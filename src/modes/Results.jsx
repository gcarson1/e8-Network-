import { useState } from 'react';
import { Eyebrow, Seg } from '../components/ui.jsx';
import { Explanation, QuestionView } from '../components/QuestionView.jsx';
import { EXAM, domainFor } from '../lib/bank.js';
import { fmtDuration } from '../lib/util.js';
import { useStudy } from '../state.jsx';

export function ScoreLine({ pct, correct, total, elapsed, showScaled }) {
  // CompTIA doesn't publish its scaling, so this linear map is only a rough guide.
  const scaled = Math.round(EXAM.scaleMin + (pct / 100) * (EXAM.scaleMax - EXAM.scaleMin));
  const pass = scaled >= EXAM.passing;
  return (
    <div className="score">
      <div className="stat">
        <div className="v">{Math.round(pct)}%</div>
        <div className="k">{correct} of {total} correct</div>
      </div>
      {showScaled && (
        <div className="stat" title="Linear estimate. CompTIA's real scaling isn't published.">
          <div className={`v sm ${pass ? 'good-text' : 'bad-text'}`}>≈{scaled}</div>
          <div className="k">{pass ? 'Passing range' : `Below ${EXAM.passing} to pass`}</div>
        </div>
      )}
      {elapsed != null && (
        <div className="stat">
          <div className="v sm">{fmtDuration(elapsed)}</div>
          <div className="k">Time</div>
        </div>
      )}
    </div>
  );
}

/** One row per domain with a bubble per question. */
export function Breakdown({ graded }) {
  const { categories } = useStudy();
  const rows = categories
    .map((c) => {
      const g = graded.filter((x) => x.q.category === c);
      return { c, g, ok: g.filter((x) => x.correct).length };
    })
    .filter((r) => r.g.length);
  return (
    <div className="rows">
      {rows.map((r) => (
        <div key={r.c} className="drow">
          <span>{domainFor(r.c)?.short || r.c}</span>
          <span className="cells" aria-hidden="true">
            {r.g.map((x) => (
              <span key={x.q.id} className={`bubble ${x.skipped ? '' : x.correct ? 'good' : 'bad'}`} title={x.q.question.slice(0, 80)} />
            ))}
          </span>
          <span className="num">
            {r.ok}/{r.g.length} · {Math.round((r.ok / r.g.length) * 100)}%
          </span>
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
      <div className="spread" style={{ marginBottom: 'var(--sp-3)' }}>
        <Eyebrow>Review</Eyebrow>
        <Seg
          label="Review filter"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'missed', label: 'Missed', n: missed },
            ...(flagged ? [{ value: 'flagged', label: 'Flagged', n: flagged }] : []),
            { value: 'all', label: 'All', n: graded.length },
          ]}
        />
      </div>
      <div className="rows">
        {list.length === 0 && <p className="muted" style={{ padding: 'var(--sp-4) var(--sp-1)' }}>Nothing missed.</p>}
        {list.map((g) => (
          <div className="rv" key={g.q.id} id={`rv-${g.i}`}>
            <button onClick={() => setOpen((o) => ({ ...o, [g.i]: !o[g.i] }))} aria-expanded={!!open[g.i]}>
              <span className={`mk ${g.skipped ? '' : g.correct ? 'good' : 'bad'}`} aria-label={g.skipped ? 'Unanswered' : g.correct ? 'Correct' : 'Incorrect'} />
              <span className="mono faint small">Q{g.i + 1}</span>
              <span className={open[g.i] ? '' : 'clamp'}>{g.q.question}</span>
              <span className="mono faint">{open[g.i] ? '−' : '+'}</span>
            </button>
            {open[g.i] && (
              <div className="rv-body">
                <p className="faint small">{g.q.category}{g.q.source ? ` · ${g.q.source}` : ''}</p>
                <QuestionView q={g.q} selected={g.answer} reveal hideStem />
                <Explanation text={g.q.explanation} />
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
