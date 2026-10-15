import { useStudy } from '../state.jsx';
import { domainFor } from '../lib/bank.js';
import { Bar, Eyebrow } from './ui.jsx';
import { useNav } from '../nav.jsx';

export default function MasteryPanel() {
  const { categories, stats, overall, dirty, lastSaved } = useStudy();
  const { openData } = useNav();
  const fresh = overall.seen === 0 && Object.values(stats).every((s) => s.pct === 0);

  return (
    <aside className="panel side" aria-label="Category mastery">
      <div className="mastery-head">
        <Eyebrow>Mastery</Eyebrow>
        <div className="mastery-total">
          <span className="big">{overall.pct}%</span>
          <span className="muted" style={{ fontSize: 13 }}>
            overall · {overall.seen}/{overall.total} questions seen
          </span>
        </div>
      </div>
      {categories.map((c) => {
        const s = stats[c];
        const d = domainFor(c);
        return (
          <div className="mastery-row" key={c}>
            <div className="top">
              <span className="name">{c}</span>
              <span className="pct">{s.pct}%</span>
            </div>
            <Bar pct={s.pct} label={`${c} mastery`} />
            <div className="sub">
              {s.seen}/{s.total} seen · {s.mastered} mastered{d ? ` · ${d.weight}% of exam` : ''}
            </div>
          </div>
        );
      })}
      <div className="mastery-foot stack">
        <p className="muted" style={{ fontSize: 13 }}>
          {fresh
            ? 'Starting fresh. Import a progress file to restore your stats.'
            : dirty
              ? 'You have unsaved progress. Export it to keep it.'
              : lastSaved
                ? `Progress ${lastSaved.kind === 'export' ? 'exported' : 'imported'}. Nothing new to save.`
                : 'Progress loaded.'}
        </p>
        <button className={`btn small block ${dirty ? '' : 'quiet'}`} onClick={openData}>
          {fresh ? 'Import progress file' : dirty ? 'Export progress' : 'Progress file'}
        </button>
      </div>
    </aside>
  );
}
