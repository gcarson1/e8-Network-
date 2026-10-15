import { useStudy } from '../state.jsx';
import { domainFor } from '../lib/bank.js';
import { Eyebrow, Meter } from './ui.jsx';
import { useNav } from '../nav.jsx';
import { relativeTime } from '../lib/util.js';

export default function MasteryPanel() {
  const { categories, stats, overall, dirty, lastSaved } = useStudy();
  const { openData, go } = useNav();
  const fresh = overall.seen === 0 && !lastSaved;

  return (
    <aside className="side" aria-label="Readiness by domain">
      <div className="side-sec">
        <Eyebrow>Exam readiness</Eyebrow>
        <div className="hstack" style={{ marginTop: 'var(--sp-3)', alignItems: 'baseline' }}>
          <span className="big">{overall.readiness}%</span>
          <span className="muted small">
            {overall.seen} of {overall.total} seen
          </span>
        </div>
        <div style={{ marginTop: 'var(--sp-4)' }}>
          <Meter pct={overall.readiness} thick label="Exam readiness" />
        </div>
        <p className="faint small" style={{ marginTop: 'var(--sp-2)' }}>Mastery weighted by each domain's share of the exam.</p>
      </div>
      <div className="side-sec flush">
        {categories.map((c) => {
          const s = stats[c];
          const d = domainFor(c);
          return (
            <button key={c} className="mrow" onClick={() => go({ name: 'practice', preset: { categories: [c], focus: 'weak' } })} title={`Practice ${c}`}>
              <span className="mrow-top">
                <span>{d?.short || c}</span>
                <span className="pct">{s.pct}%</span>
              </span>
              <Meter pct={s.pct} label={`${c} mastery`} />
              <span className="mrow-sub">
                {s.seen}/{s.total} seen{d ? ` · ${d.weight}% of exam` : ''}
              </span>
            </button>
          );
        })}
      </div>
      <div className="side-sec">
        <Eyebrow>Progress file</Eyebrow>
        <p className="small muted" style={{ marginTop: 'var(--sp-2)' }}>
          {fresh
            ? 'Nothing loaded yet.'
            : dirty
              ? 'Unsaved changes. Save before closing.'
              : lastSaved
                ? `${lastSaved.kind === 'export' ? 'Saved' : 'Loaded'} ${relativeTime(lastSaved.at)}.`
                : 'Up to date.'}
        </p>
        <button className={`btn ${dirty ? 'primary' : ''}`} style={{ marginTop: 'var(--sp-3)' }} onClick={openData}>
          {fresh ? 'Load progress file' : dirty ? 'Save progress' : 'Manage file'}
        </button>
      </div>
    </aside>
  );
}
