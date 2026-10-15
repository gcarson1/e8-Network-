import { useState } from 'react';
import { Eyebrow } from './ui.jsx';

/**
 * GitHub-contribution-style grid: one square per question in the current
 * session, flowing top-to-bottom in columns of 7.
 * cell.state: 'empty' | 'answered' | 'ok' | 'bad'
 */
export function BubbleGrid({ cells, current, onSelect, cellSize }) {
  return (
    <div className="bubbles" style={cellSize ? { '--cell': `${cellSize}px` } : undefined} role="list">
      {cells.map((c, i) => (
        <button
          key={c.key ?? i}
          role="listitem"
          type="button"
          className={`bubble ${c.state === 'empty' ? '' : c.state} ${i === current ? 'current' : ''} ${c.flagged ? 'flagged' : ''}`}
          onClick={onSelect ? () => onSelect(i) : undefined}
          disabled={!onSelect}
          title={c.title || `Question ${i + 1}`}
          aria-label={`${c.title || `Question ${i + 1}`}${c.state !== 'empty' ? `, ${STATE_LABEL[c.state]}` : ', not answered'}${c.flagged ? ', flagged' : ''}`}
          aria-current={i === current ? 'step' : undefined}
        />
      ))}
    </div>
  );
}

const STATE_LABEL = { answered: 'answered', ok: 'correct', bad: 'incorrect' };

/** Sidebar shown during an active exam / practice / flashcard session. */
export function SessionSide({ title, stat, statLabel, cells, current, onSelect, legend, children }) {
  const [collapsed, setCollapsed] = useState(true);
  return (
    <aside className={`panel side session-side ${collapsed ? 'collapsed' : ''}`} aria-label="Session progress">
      <div className="section stack">
        <div className="row between">
          <Eyebrow>{title}</Eyebrow>
          <button className="btn link side-toggle" onClick={() => setCollapsed((c) => !c)} aria-expanded={!collapsed}>
            {collapsed ? 'Show grid' : 'Hide grid'}
          </button>
        </div>
        <div className="row" style={{ alignItems: 'baseline', gap: 10 }}>
          <span className="session-count">{stat}</span>
          <span className="muted" style={{ fontSize: 13 }}>{statLabel}</span>
        </div>
        <div className="collapsible stack">
          <div style={{ overflowX: 'auto', paddingBottom: 2 }}>
            <BubbleGrid cells={cells} current={current} onSelect={onSelect} />
          </div>
          <div className="legend">
            {legend.map((l) => (
              <span key={l.label}>
                <i className={l.cls} />
                {l.label}
              </span>
            ))}
          </div>
        </div>
      </div>
      {children && <div className="section stack collapsible">{children}</div>}
    </aside>
  );
}
