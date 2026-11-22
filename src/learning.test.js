import test from 'node:test';
import assert from 'node:assert/strict';
import { createSession, recordStage, summarize, readHistory, saveSession, reportTopics, getHelpGuidance, HISTORY_KEY } from './learning.js';

const storage = () => {
  const values = new Map();
  return { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) };
};

test('accumulates revisited stages and recommends the stage needing help, not simply the slowest', () => {
  const session = createSession('카페');
  recordStage(session, 0, '메뉴', 50000);
  recordStage(session, 1, '온도', 5000, 1);
  recordStage(session, 1, '온도', 2000, 1, true);
  recordStage(session, 1, '온도', -10);
  assert.equal(session.stages.length, 2);
  assert.deepEqual(summarize(session), { seconds: 57, helps: 2, recommendation: '온도', longest: session.stages[0] });
  assert.equal(session.stages[1].revisits, 1);
  assert.equal(reportTopics([session])[0].help, 2);
});

test('history survives reload, deduplicates completion and retains only 20 sessions', () => {
  const store = storage();
  const session = createSession('버거');
  session.completedAt = new Date().toISOString();
  recordStage(session, 0, '메뉴', 1000);
  saveSession(store, session); saveSession(store, session);
  assert.equal(readHistory(store).length, 1);
  for (let i = 0; i < 25; i++) saveSession(store, { ...session, id: String(i) });
  const rows = readHistory(store);
  assert.equal(rows.length, 20);
  assert.equal(rows[0].id, '24');
  assert.equal(rows[19].id, '5');
});

test('corrupt, malformed or unavailable storage does not break the report', () => {
  const store = storage();
  for (const value of ['null', '{}', 'oops', '[null]', '[{"stages": []}]']) {
    store.setItem(HISTORY_KEY, value);
    assert.deepEqual(readHistory(store), []);
  }
  assert.deepEqual(readHistory({ getItem() { throw new Error('disabled'); } }), []);
  assert.throws(() => saveSession({ getItem() {}, setItem() { throw new Error('full'); } }, createSession('카페')));
});


test('guidance moves from choices to the enabled next action and prioritizes correction', () => {
  const choices = {};
  const next = { textContent: '다음 ❯' };
  const correction = { textContent: '아니요 (수정할게요)' };
  let canAdvance = false;
  let needsCorrection = false;
  const root = { querySelector(selector) {
    if (selector.includes('data-help-target')) return needsCorrection ? correction : null;
    if (selector.includes('frame-footer')) return canAdvance ? next : null;
    return choices;
  } };
  assert.deepEqual(getHelpGuidance(root, '음료를 눌러주세요.'), { target: choices, text: '음료를 눌러주세요.' });
  canAdvance = true;
  assert.deepEqual(getHelpGuidance(root, '음료를 눌러주세요.'), { target: next, text: '아래의 ‘다음’ 버튼을 눌러주세요.' });
  needsCorrection = true;
  assert.equal(getHelpGuidance(root, '').target, correction);
  assert.equal(getHelpGuidance(null, '안내').text, '안내');
});
