import { useStudy } from '../state.jsx';
import { domainFor } from '../lib/bank.js';
import { Eyebrow, Meter } from './ui.jsx';
import { useNav } from '../nav.jsx';
import { relativeTime } from '../lib/util.js';

export default function MasteryPanel() {
  const { categories, stats, overall, dirty, lastSaved } = useStudy();
  const { openData, go } = useNav();
  const fresh = overall.seen === 0;

  return (
    <aside className="side" aria-label="Mastery by domain">
      <div className="side-sec">
        <Eyebrow>Mastery</Eyebrow>
        <div className="hstack" style={{ marginTop: 10, alignItems: 'baseline' }}>
          <span className="big">{overall.pct}%</span>
          <span className="muted small">
            {overall.seen}/{overall.total} questions seen
          </span>
        </div>
      </div>
      <div className="side-sec flush">
        {categories.map((c) => {
          const s = stats[c];
          const d = domainFor(c);
          return (
            <button
              key={c}
              className="mrow"
              onClick={() => go({ name: 'practice', preset: { categories: [c], focus: 'weak' } })}
              title={`Practice ${c}`}
            >
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
      <div className="side-sec stack-sm">
        <Eyebrow>Progress file</Eyebrow>
        <p className="small muted">
          {fresh && !lastSaved
            ? 'Nothing loaded. Import yours to restore your stats.'
            : dirty
              ? 'Unsaved changes. Save before you close this tab.'
              : lastSaved
                ? `${lastSaved.kind === 'export' ? 'Saved' : 'Loaded'} ${relativeTime(lastSaved.at)}.`
                : 'Up to date.'}
        </p>
        <div>
          <button className={`btn ${dirty ? 'primary' : ''}`} style={{ marginTop: 6 }} onClick={openData}>
            {fresh && !lastSaved ? 'Import file' : dirty ? 'Save progress' : 'Open'}
          </button>
        </div>
      </div>
    </aside>
  );
}
