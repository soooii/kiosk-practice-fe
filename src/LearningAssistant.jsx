import React, { useEffect, useRef, useState } from 'react';
import { createSession, recordStage, summarize, readHistory, saveSession, reportTopics, getHelpGuidance, HISTORY_KEY } from './learning.js';
import './learning.css';
import helperBird from './assets/helper-bird.png';

const AI_NOTICE_KEY = 'kiosk-ai-notice-v1';

export function useLearning(brand, step, title, reviewing, completed) {
  const root = useRef(null);
  const session = useRef(null);
  if (!session.current) session.current = createSession(brand);
  const [storageError, setStorageError] = useState('');
  const [version, setVersion] = useState(0);
  const [, refreshSummary] = useState(0);
  useEffect(() => {
    // The previous stage's cleanup has now recorded its final elapsed time.
    refreshSummary((value) => value + 1);
    if (reviewing || completed) return;
    const recording = session.current;
    const revisit = recording.stages.some((item) => item.step === step);
    recordStage(recording, step, title, 0, 0, revisit);
    let start = document.hidden ? null : performance.now();
    function flush() {
      if (start !== null) recordStage(recording, step, title, performance.now() - start);
      start = null;
    }
    function visibility() { flush(); if (!document.hidden) start = performance.now(); }
    document.addEventListener('visibilitychange', visibility);
    return () => { flush(); document.removeEventListener('visibilitychange', visibility); };
  }, [step, title, reviewing, completed, version]);
  useEffect(() => {
    if (!completed) return;
    session.current.completedAt ??= new Date().toISOString();
    try { saveSession(localStorage, session.current); }
    catch { setStorageError('이 브라우저에 기록을 저장하지 못했어요. 현재 결과는 아래에서 볼 수 있어요.'); }
  }, [completed]);
  return {
    root, session: session.current, storageError, version,
    help: () => recordStage(session.current, step, title, 0, 1),
    reset: () => { session.current = createSession(brand); setVersion((value) => value + 1); setStorageError(''); },
  };
}

export default function LearningAssistant({ learning, step, title, guide, context, reviewing = false, completed = false }) {
  const [open, setOpen] = useState(false);
  const [showNotice, setShowNotice] = useState(() => {
    try { return localStorage.getItem(AI_NOTICE_KEY) !== 'seen'; } catch { return true; }
  });
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState('');
  const [instruction, setInstruction] = useState('');
  const controller = useRef(null);
  const contextKey = JSON.stringify(context);
  const resultView = reviewing || completed;
  const fallback = resultView ? '여기까지 잘 따라오셨어요. 아래에서 이번에 선택한 내용을 확인해 보세요.' : guide;

  useEffect(() => {
    setAnswer(''); setStatus('');
    return () => { controller.current?.abort(); controller.current = null; };
  }, [step, contextKey, learning.version]);
  useEffect(() => { setOpen(false); }, [learning.version]);
  useEffect(() => {
    if (!open || resultView) return;
    const { target, text } = getHelpGuidance(learning.root.current, guide);
    setInstruction(text);
    target?.classList.add('learning-highlight');
    return () => target?.classList.remove('learning-highlight');
  }, [open, step, contextKey, guide, resultView, learning.version]);
  useEffect(() => () => { controller.current?.abort(); controller.current = null; }, []);

  async function request() {
    const requestController = new AbortController();
    controller.current = requestController;
    const timer = setTimeout(() => requestController.abort(), 20000);
    setStatus('loading'); setAnswer('');
    const controls = [...(learning.root.current?.querySelectorAll('button:not(:disabled)') ?? [])]
      .filter((node) => !node.closest('.learning-assistant'))
      .slice(0, 40).map((node) => (node.getAttribute('aria-label') || node.textContent).trim().slice(0, 150));
    const nextGuide = resultView ? fallback : getHelpGuidance(learning.root.current, guide).text;
    try {
      const response = await fetch('/api/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: requestController.signal,
        body: JSON.stringify({ kind: resultView ? 'feedback' : 'help', brand: learning.session.brand,
          title, guide: nextGuide,
          context: JSON.stringify({ selections: context, controls, stages: learning.session.stages }).slice(0, 10000) }),
      });
      const result = await response.json();
      if (!response.ok || typeof result.answer !== 'string' || !result.answer.trim()) throw new Error('unavailable');
      if (controller.current !== requestController) return;
      setAnswer(result.answer); setStatus('success');
    } catch {
      if (controller.current === requestController) setStatus('error');
    } finally { clearTimeout(timer); }
  }
  function close() {
    controller.current?.abort(); controller.current = null;
    setOpen(false); setAnswer(''); setStatus('');
  }
  return <aside className={`learning-assistant${open ? ' is-guiding' : ''}`} aria-label="연습 안내"
    onKeyDown={(event) => { if (event.key === 'Escape') close(); }}>
    <div className="learning-heading"><div className="learning-companion"><img src={helperBird} className="learning-mascot" alt="" /><div><span className="learning-name">보리</span><span className="learning-eyebrow">{resultView ? '정말 잘하셨어요!' : open ? '제가 옆에서 도와드릴게요' : '천천히, 함께 해요'}</span></div></div>
      <button className="learning-toggle" aria-expanded={open} onClick={() => {
        if (open) close();
        else {
          setShowNotice(false);
          try { localStorage.setItem(AI_NOTICE_KEY, 'seen'); } catch { /* Storage is optional; keep helping. */ }
          setOpen(true); if (!resultView) learning.help(); request();
        }
      }}>{open ? '안내 접기' : resultView ? '연습 돌아보기' : '도와주세요'}<span aria-hidden="true">{open ? ' −' : ' ?'}</span></button>
    </div>
    <p className="learning-answer" aria-live="polite">{open ? answer || (resultView ? fallback : instruction || guide) : fallback}</p>
    {open && <p className="learning-note" role="status">{status === 'loading' ? '안내대로 시작해 보세요. AI도 설명을 준비하고 있어요.' : status === 'error' ? '지금은 기본 안내로 도와드릴게요.' : status === 'success' ? 'AI가 도와드리는 안내예요.' : resultView ? '천천히 확인해 보세요.' : '테두리로 표시한 곳을 확인해 주세요.'}</p>}
    {showNotice && <small className="learning-privacy">처음 한 번 안내드려요. 도움을 누르면 선택 내용과 연습 기록이 OpenAI에 전송돼요.</small>}
    {learning.storageError && <p role="status">{learning.storageError}</p>}
  </aside>;
}

export function LearningReport({ onBack }) {
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus(); }, []);
  const [history, setHistory] = useState(() => { try { return readHistory(localStorage); } catch { return []; } });
  const [error, setError] = useState('');
  const topics = reportTopics(history);
  return <section className="learning-report"><h1 ref={heading} tabIndex={-1}>나의 학습 리포트</h1>
    <p>이 브라우저에서 완료한 최근 20회 연습을 모았어요.</p>
    {history.length ? <><h2>완료한 연습 {history.length}회</h2>
      {topics.length > 0 && <><h2>다시 연습하면 좋은 단계</h2><ul>{topics.map((topic) => <li key={topic.title}>{topic.title}<small>도움 {topic.help}회 · 재방문 {topic.revisits}회</small></li>)}</ul></>}
      <ul>{history.map((row) => { const result = summarize(row); return <li key={row.id}><strong>{row.brand}</strong><small>{new Date(row.completedAt).toLocaleString('ko-KR')} · {result.seconds}초 · 도움 {result.helps}회</small><p>추천 연습: {result.recommendation}</p></li>; })}</ul>
      <button onClick={() => { if (!window.confirm('이 브라우저의 학습 기록을 모두 삭제할까요?')) return; try { localStorage.removeItem(HISTORY_KEY); setHistory([]); setError(''); } catch { setError('기록을 삭제하지 못했어요. 브라우저 저장 설정을 확인해 주세요.'); } }}>학습 기록 삭제</button>
    </> : <p>아직 완료한 연습이 없어요. 연습을 끝내면 기록이 생겨요.</p>}
    {error && <p role="alert">{error}</p>}
    <button className="back" onClick={onBack}>처음으로</button>
  </section>;
}
