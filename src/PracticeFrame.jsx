import React, { useEffect, useRef } from 'react';
import LearningAssistant from './LearningAssistant.jsx';

export default function PracticeFrame({ className, header, step, count, title, guide, children, footer, learning, context, reviewing, completed }) {
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus(); }, [step]);

  return (
    <section ref={learning.root} className={`practice-frame ${className}`}>
      {header}
      <div className="frame-progress">
        <span>{step + 1} / {count} 단계</span>
        <progress aria-label="체험 진행" value={step + 1} max={count} />
      </div>
      <div className="frame-title"><h1 ref={heading} tabIndex={-1}>{title}</h1></div>
      <div className="frame-content">
        <LearningAssistant learning={learning} step={step} title={title} guide={guide}
          context={context} reviewing={reviewing} completed={completed} />
        {children}
      </div>
      <footer className="frame-footer">{footer}</footer>
    </section>
  );
}
