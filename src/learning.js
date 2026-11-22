export const HISTORY_KEY = 'kiosk-learning-v1';
export const MAX_HISTORY = 20;

export function getHelpGuidance(root, guide) {
  const correction = root?.querySelector('[data-help-target="true"]:not(:disabled)');
  const next = root?.querySelector('.frame-footer .shop-button:not(.secondary):not(:disabled), .frame-footer .primary:not(:disabled)');
  const target = correction || next || root?.querySelector('.menu-grid, .temperature-options, .payment-options, .bag-options, .scan-products, .goods-list:has(button), .choices, .ticket-list, .seats');
  const label = (correction || next)?.textContent.trim().replace(/[❯‹🛒]/gu, '').trim();
  return { target, text: label ? `아래의 ‘${label}’ 버튼을 눌러주세요.` : guide };
}

export function createSession(brand) {
  return { id: crypto.randomUUID(), brand, completedAt: null, stages: [] };
}

export function recordStage(session, step, title, elapsed, help = 0, revisit = false) {
  let stage = session.stages.find((item) => item.step === step);
  if (!stage) { stage = { step, title, ms: 0, help: 0, revisits: 0 }; session.stages.push(stage); }
  stage.ms += Math.max(0, elapsed);
  stage.help += help;
  stage.revisits += Number(revisit);
}

export function summarize(session) {
  const stages = session.stages;
  const longest = [...stages].sort((a, b) => b.ms - a.ms)[0];
  const helped = [...stages].sort((a, b) => b.help - a.help)[0];
  return {
    seconds: Math.round(stages.reduce((sum, stage) => sum + stage.ms, 0) / 1000),
    helps: stages.reduce((sum, stage) => sum + stage.help, 0),
    recommendation: helped?.help ? helped.title : longest?.title,
    longest,
  };
}

export function readHistory(storage) {
  try {
    const rows = JSON.parse(storage.getItem(HISTORY_KEY) ?? '[]');
    if (!Array.isArray(rows)) return [];
    return rows.filter((row) => row && typeof row.id === 'string' && typeof row.brand === 'string' &&
      Number.isFinite(Date.parse(row.completedAt)) && Array.isArray(row.stages) && row.stages.length <= 30 &&
      row.stages.every((stage) => stage && typeof stage.title === 'string' && Number.isInteger(stage.step) &&
        ['ms', 'help', 'revisits'].every((key) => Number.isFinite(stage[key]) && stage[key] >= 0))).slice(0, MAX_HISTORY);
  } catch { return []; }
}

export function saveSession(storage, session) {
  const rows = [session, ...readHistory(storage).filter((row) => row.id !== session.id)].slice(0, MAX_HISTORY);
  storage.setItem(HISTORY_KEY, JSON.stringify(rows));
}

export function reportTopics(history) {
  const topics = new Map();
  for (const session of history) for (const stage of session.stages) {
    const key = session.brand + ': ' + stage.title;
    const item = topics.get(key) ?? { title: key, help: 0, revisits: 0 };
    item.help += stage.help; item.revisits += stage.revisits;
    topics.set(key, item);
  }
  return [...topics.values()].filter((item) => item.help || item.revisits)
    .sort((a, b) => (b.help + b.revisits) - (a.help + a.revisits)).slice(0, 3);
}
