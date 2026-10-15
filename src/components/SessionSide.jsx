import { useState } from 'react';
import { Eyebrow } from './ui.jsx';

const STATE_LABEL = { answered: 'answered', good: 'correct', bad: 'incorrect' };

/**
 * GitHub-contribution-style grid: one square per question in this session,
 * filling top-to-bottom in columns of 7.
 * cell.state: 'empty' | 'answered' | 'good' | 'bad'
 */
export function BubbleGrid({ cells, current, onSelect }) {
  return (
    <div className="bubbles" role="list">
      {cells.map((c, i) => (
        <button
          key={i}
          role="listitem"
          type="button"
          className={`bubble ${c.state === 'empty' ? '' : c.state} ${i === current ? 'current' : ''} ${c.flagged ? 'flagged' : ''}`}
          onClick={onSelect ? () => onSelect(i) : undefined}
          disabled={!onSelect}
          title={c.title || `Question ${i + 1}`}
          aria-label={`${c.title || `Question ${i + 1}`}, ${STATE_LABEL[c.state] || 'not answered'}${c.flagged ? ', flagged' : ''}`}
          aria-current={i === current ? 'step' : undefined}
        />
      ))}
    </div>
  );
}

/** Right rail during a session: count, grid, legend, optional notes. */
export function SessionSide({ title, stat, statLabel, cells, current, onSelect, legend, children }) {
  const [collapsed, setCollapsed] = useState(true);
  return (
    <aside className={`side session ${collapsed ? 'collapsed' : ''}`} aria-label="Session progress">
      <div className="side-sec">
        <div className="spread">
          <Eyebrow>{title}</Eyebrow>
          <button className="tbtn side-toggle" style={{ marginRight: 'calc(var(--sp-2) * -1)' }} onClick={() => setCollapsed((c) => !c)} aria-expanded={!collapsed}>
            {collapsed ? 'Show grid' : 'Hide grid'}
          </button>
        </div>
        <div className="hstack" style={{ marginTop: 'var(--sp-2)', alignItems: 'baseline' }}>
          <span className="big sm">{stat}</span>
          <span className="muted small">{statLabel}</span>
        </div>
      </div>
      <div className="side-sec stack collapsible">
        <div style={{ overflowX: 'auto', padding: 'var(--sp-0h)' }}>
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
      {children && <div className="side-sec stack collapsible">{children}</div>}
    </aside>
  );
}
