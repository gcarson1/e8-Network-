import { useState } from 'react';
import { Bar, Eyebrow, Seg } from '../components/ui.jsx';
import { BubbleGrid } from '../components/SessionSide.jsx';
import { Explanation, QuestionView } from '../components/QuestionView.jsx';
import { EXAM } from '../lib/bank.js';
import { fmtDuration } from '../lib/util.js';
import { useStudy } from '../state.jsx';

export function ScoreLine({ pct, correct, total, elapsed, showScaled }) {
  // CompTIA doesn't publish its scaling; a straight linear map is only a rough guide.
  const scaled = Math.round(EXAM.scaleMin + (pct / 100) * (EXAM.scaleMax - EXAM.scaleMin));
  const pass = scaled >= EXAM.passing;
  return (
    <div className="scoreline">
      <div className="stat">
        <div className="v">{Math.round(pct)}%</div>
        <div className="k">Score</div>
      </div>
      <div className="stat">
        <div className="v small">
          {correct}/{total}
        </div>
        <div className="k">Correct</div>
      </div>
      {elapsed != null && (
        <div className="stat">
          <div className="v small">{fmtDuration(elapsed)}</div>
          <div className="k">Time</div>
        </div>
      )}
      {showScaled && (
        <div className="stat" title="Linear estimate. CompTIA's actual scaling is not published.">
          <div className="v small">
            ≈{scaled} <span className={`pill ${pass ? 'ok' : 'bad'}`} style={{ verticalAlign: 'middle' }}>{pass ? 'PASS' : 'BELOW 720'}</span>
          </div>
          <div className="k">Est. scaled score</div>
        </div>
      )}
    </div>
  );
}

/** Per-domain rows with one bubble per question in this session. */
export function Breakdown({ graded }) {
  const { categories } = useStudy();
  const rows = categories
    .map((c) => {
      const g = graded.filter((x) => x.q.category === c);
      return { c, g, ok: g.filter((x) => x.correct).length };
    })
    .filter((r) => r.g.length);
  return (
    <div className="stack">
      {rows.map((r) => (
        <div key={r.c} style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
          <div className="domain-bubbles">
            <span style={{ fontWeight: 550, fontSize: 14 }}>{r.c}</span>
            <div className="cells">
              <BubbleGrid
                cells={r.g.map((x) => ({ state: x.skipped ? 'empty' : x.correct ? 'ok' : 'bad', title: x.q.question.slice(0, 80) }))}
                cellSize={12}
              />
            </div>
            <span className="mono" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
              {r.ok}/{r.g.length} · {Math.round((r.ok / r.g.length) * 100)}%
            </span>
          </div>
          <div style={{ marginTop: 8 }}>
            <Bar pct={(r.ok / r.g.length) * 100} thin label={`${r.c} score`} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReviewList({ graded }) {
  const missed = graded.filter((g) => !g.correct).length;
  const flagged = graded.filter((g) => g.flagged).length;
  const [filter, setFilter] = useState(missed ? 'missed' : 'all');
  const [open, setOpen] = useState({});
  const list = graded
    .map((g, i) => ({ ...g, i }))
    .filter((g) => (filter === 'missed' ? !g.correct : filter === 'flagged' ? g.flagged : true));

  return (
    <>
      <div className="row between">
        <Eyebrow>Review</Eyebrow>
        <Seg
          label="Review filter"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'missed', label: `Missed · ${missed}` },
            ...(flagged ? [{ value: 'flagged', label: `Flagged · ${flagged}` }] : []),
            { value: 'all', label: `All · ${graded.length}` },
          ]}
        />
      </div>
      <div>
        {list.length === 0 && <p className="muted" style={{ padding: '12px 0' }}>Nothing here. Nice work.</p>}
        {list.map((g) => (
          <div className="review-item" key={g.q.id} id={`rv-${g.i}`}>
            <button onClick={() => setOpen((o) => ({ ...o, [g.i]: !o[g.i] }))} aria-expanded={!!open[g.i]}>
              <span className={`mk ${g.skipped ? 'skip' : g.correct ? 'ok' : 'bad'}`} aria-label={g.skipped ? 'Unanswered' : g.correct ? 'Correct' : 'Incorrect'} />
              <span className="mono faint" style={{ fontSize: 12.5, paddingTop: 2 }}>
                Q{g.i + 1}
              </span>
              <span style={{ display: '-webkit-box', WebkitLineClamp: open[g.i] ? 'unset' : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {g.q.question}
              </span>
              <span className="mono faint">{open[g.i] ? '−' : '+'}</span>
            </button>
            {open[g.i] && (
              <div className="review-body stack-lg">
                <div className="eyebrow plain">{g.q.category}{g.q.source ? ` · ${g.q.source}` : ''}</div>
                <QuestionView q={{ ...g.q, question: '' }} selected={g.answer} reveal />
                <Explanation text={g.q.explanation} />
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
