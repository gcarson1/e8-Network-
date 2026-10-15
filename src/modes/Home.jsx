import Page from '../components/Page.jsx';
import { Eyebrow } from '../components/ui.jsx';
import { useStudy } from '../state.jsx';
import { useNav } from '../nav.jsx';
import { EXAM, domainFor } from '../lib/bank.js';
import { ACTIVITY_COUNT, LABS } from '../labs/index.js';
import { plural, relativeTime } from '../lib/util.js';

export default function Home() {
  const { questions, categories, terms, stats, overall, backup, replaceItems, dismissBackup, notify } = useStudy();
  const { go, openData } = useNav();
  const fresh = overall.seen === 0;

  // Weakest domain: lowest mastery, ties go to the heavier exam weight.
  const weakest = [...categories].sort(
    (a, b) => stats[a].pct - stats[b].pct || (domainFor(b)?.weight || 0) - (domainFor(a)?.weight || 0),
  )[0];

  const restore = () => {
    replaceItems(backup.items, 'restore');
    notify(`Restored ${plural(Object.keys(backup.items).length, 'item')}`);
  };

  const modes = [
    { name: 'exam', title: 'Exam', sub: `${EXAM.questions} questions · ${EXAM.minutes} min · scored at the end` },
    { name: 'practice', title: 'Practice', sub: 'Pick domains · answers explained as you go' },
    { name: 'flashcards', title: 'Flashcards', sub: `${questions.length} question cards · ${terms.length} key terms` },
    { name: 'labs', title: 'Labs', sub: `${LABS.length} topics · ${ACTIVITY_COUNT} hands-on activities` },
  ];

  return (
    <Page label="Home">
      {backup && fresh && (
        <div className="notice" style={{ marginBottom: 24 }} role="status">
          <div className="stack-sm" style={{ flex: 1 }}>
            <p>
              Unsaved progress from {relativeTime(backup.at)} is still in this browser ({plural(Object.keys(backup.items).length, 'item')}).
            </p>
            <div className="hstack" style={{ marginLeft: -8 }}>
              <button className="tbtn strong" onClick={restore}>Restore it</button>
              <button className="tbtn" onClick={dismissBackup}>Ignore</button>
            </div>
          </div>
        </div>
      )}

      <section className="next">
        <Eyebrow>Up next</Eyebrow>
        {fresh ? (
          <>
            <h1>20-question practice set</h1>
            <p>A mix from every domain, with each answer explained.</p>
          </>
        ) : (
          <>
            <h1>Practice {domainFor(weakest)?.short || weakest}</h1>
            <p>
              Your weakest domain · {stats[weakest].pct}% mastered · {stats[weakest].total - stats[weakest].seen} unseen
            </p>
          </>
        )}
        <div className="hstack">
          <button
            className="btn primary lg"
            onClick={() =>
              go({ name: 'practice', preset: fresh ? { quick: true } : { categories: [weakest], focus: 'weak' } })
            }
          >
            Start
          </button>
          {fresh && (
            <button className="tbtn" onClick={openData}>
              Load a progress file
            </button>
          )}
        </div>
      </section>

      <div className="rows">
        {modes.map((m) => (
          <button key={m.name} className="rowbtn" onClick={() => go(m.name)}>
            <span>
              <span className="t">{m.title}</span>
              <span className="s">{m.sub}</span>
            </span>
            <span className="r">→</span>
          </button>
        ))}
      </div>
    </Page>
  );
}
