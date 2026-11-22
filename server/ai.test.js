import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createAiMiddleware, generateAdvice, validRequest } from './ai.js';
import viteConfig from '../vite.config.js';

const input = { kind: 'help', brand: '맥도날드', title: '세트 선택', guide: '세트에는 사이드와 음료가 있어요.', context: '{"controls":["단품","세트"]}' };
const upstream = { ok: true, json: async () => ({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: '세트는 함께 주문하는 메뉴예요.' }] }] }) };
test('Vite hooks install the API without returning a post-install callback', () => {
  const plugin = viteConfig({ mode: 'test' }).plugins[0];
  let installed = 0;
  const server = { middlewares: { use(handler) { assert.equal(typeof handler, 'function'); installed++; return () => {}; } } };
  assert.equal(plugin.configureServer(server), undefined);
  assert.equal(plugin.configurePreviewServer(server), undefined);
  assert.equal(installed, 2);
});
async function invoke(handler, { body = input, method = 'POST', headers = {} } = {}) {
  const req = Readable.from([typeof body === 'string' ? body : JSON.stringify(body)]);
  Object.assign(req, { url: '/api/ai', method, headers: { host: 'localhost:5174', 'content-type': 'application/json', ...headers } });
  const result = {};
  await handler(req, { writeHead(status) { result.status = status; }, end(value) { result.body = JSON.parse(value); } }, () => { result.next = true; });
  return result;
}

test('Responses request keeps key server-side and asks not to store response', async () => {
  let sent;
  const answer = await generateAdvice(input, { apiKey: 'test-secret', fetchImpl: async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/responses'); sent = options; return upstream;
  } });
  assert.match(answer, /세트/);
  assert.equal(sent.headers.Authorization, 'Bearer test-secret');
  assert.equal(JSON.parse(sent.body).store, false);
  assert.equal(JSON.parse(sent.body).input, JSON.stringify(input));
  assert.ok(!answer.includes('test-secret'));
});

test('validates body, method, size, origin and content type before calling upstream', async () => {
  const handler = createAiMiddleware({ apiKey: 'test', fetchImpl() { assert.fail('must not call'); } });
  assert.equal(validRequest({ ...input, kind: 'unknown' }), false);
  assert.equal((await invoke(handler, { body: '{' })).status, 400);
  assert.equal((await invoke(handler, { body: { ...input, context: [] } })).status, 400);
  assert.equal((await invoke(handler, { body: 'a'.repeat(16001) })).status, 413);
  assert.equal((await invoke(handler, { method: 'GET' })).status, 405);
  for (const origin of ['https://evil.example', 'null', 'invalid']) assert.equal((await invoke(handler, { headers: { origin } })).status, 403);
  assert.equal((await invoke(handler, { headers: { 'content-type': 'text/plain' } })).status, 415);
});

test('missing key and provider failure return safe fallback statuses', async () => {
  assert.equal((await invoke(createAiMiddleware({ apiKey: '' }))).body.error, 'unconfigured');
  const fail = createAiMiddleware({ apiKey: 'secret', fetchImpl: async () => { throw new Error('secret provider error'); } });
  const result = await invoke(fail);
  assert.equal(result.status, 502);
  assert.ok(!JSON.stringify(result).includes('secret'));
  await assert.rejects(generateAdvice(input, { apiKey: 'test', fetchImpl: async () => ({ ok: true, json: async () => ({ status: 'incomplete', output: [] }) }) }));
});

test('returns generated answer and caps local AI calls per minute', async () => {
  const handler = createAiMiddleware({ apiKey: 'test', fetchImpl: async () => upstream });
  for (let i = 0; i < 20; i++) assert.equal((await invoke(handler)).status, 200);
  assert.equal((await invoke(handler)).status, 429);
});

test('reports actionable failure categories without exposing provider errors or keys', async () => {
  for (const [status, code, expected] of [[401, 'invalid_api_key', 'authentication'], [429, 'insufficient_quota', 'quota'], [429, 'rate_limit_exceeded', 'rate_limit'], [403, 'forbidden', 'permission'], [404, 'model_not_found', 'model'], [500, 'server_error', 'upstream']]) {
    const handler = createAiMiddleware({ apiKey: 'secret', fetchImpl: async () => ({ ok: false, status, json: async () => ({ error: { code, message: 'private secret details' } }) }) });
    const result = await invoke(handler);
    assert.equal(result.status, 502);
    assert.deepEqual(result.body, { error: expected });
  }
  const timeout = createAiMiddleware({ apiKey: 'secret', fetchImpl: async () => { throw Object.assign(new Error('private'), { name: 'TimeoutError' }); } });
  assert.equal((await invoke(timeout)).body.error, 'timeout');
});

test('billing 429 codes and quota types are not mistaken for temporary traffic limits', async () => {
  for (const error of [
    { code: 'credit_balance_exhausted' }, { code: 'organization_usage_limit_exceeded' },
    { code: 'organization_spend_limit_exceeded' }, { code: 'project_spend_limit_exceeded' },
    { type: 'insufficient_quota', code: null },
  ]) {
    const handler = createAiMiddleware({ apiKey: 'test', fetchImpl: async () => ({ ok: false, status: 429, json: async () => ({ error }) }) });
    assert.deepEqual((await invoke(handler)).body, { error: 'quota' });
  }
});
