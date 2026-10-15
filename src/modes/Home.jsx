import Page from '../components/Page.jsx';
import { Eyebrow, Icon } from '../components/ui.jsx';
import { useStudy } from '../state.jsx';
import { useNav } from '../nav.jsx';
import { EXAM, domainFor } from '../lib/bank.js';
import { itemStatus } from '../lib/mastery.js';
import { ACTIVITY_COUNT, LABS } from '../labs/index.js';
import { plural, relativeTime } from '../lib/util.js';

export default function Home() {
  const { questions, categories, terms, items, stats, overall, backup, replaceItems, dismissBackup, notify } = useStudy();
  const { go, openData } = useNav();
  const fresh = overall.seen === 0;

  // Weakest domain: lowest mastery; ties go to the one worth more on the exam.
  const weakest = [...categories].sort(
    (a, b) => stats[a].pct - stats[b].pct || (domainFor(b)?.weight || 0) - (domainFor(a)?.weight || 0),
  )[0];
  const w = stats[weakest];
  const missedIds = questions.filter((q) => itemStatus(items[q.id]) === 'missed').map((q) => q.id);
  const unseen = overall.total - overall.seen;

  const restore = () => {
    replaceItems(backup.items, 'restore');
    notify(`Restored ${plural(Object.keys(backup.items).length, 'item')}`);
  };

  const recs = fresh
    ? [
        { t: 'Take a 20-question diagnostic exam', s: 'Timed, scored at the end, weighted like the real test', go: { name: 'exam', preset: { count: 20 } } },
        { t: 'Load your progress file', s: 'Pick up where you left off on another device', action: openData },
      ]
    : [
        missedIds.length > 0 && { t: `Retry ${plural(missedIds.length, 'missed question')}`, s: 'Questions whose last answer was wrong', go: { name: 'practice', preset: { ids: missedIds } } },
        unseen > 0 && { t: `Cover ${unseen} unseen questions`, s: 'A set of 20 you have not answered yet', go: { name: 'practice', preset: { unseen: true } } },
        { t: `Full exam: ${EXAM.questions} questions in ${EXAM.minutes} minutes`, s: 'The best measure of where you stand', go: { name: 'exam' } },
      ].filter(Boolean);

  const modes = [
    { name: 'exam', title: 'Exam', sub: `${EXAM.questions} questions · ${EXAM.minutes} min` },
    { name: 'practice', title: 'Practice', sub: 'Answers explained as you go' },
    { name: 'flashcards', title: 'Flashcards', sub: `${questions.length} questions · ${terms.length} terms` },
    { name: 'labs', title: 'Labs', sub: `${LABS.length} topics · ${ACTIVITY_COUNT} activities` },
  ];

  return (
    <Page label="Home">
      {backup && fresh && (
        <div className="notice" role="status">
          <div className="stack-sm" style={{ flex: 1 }}>
            <p>Unsaved progress from {relativeTime(backup.at)} is still in this browser ({plural(Object.keys(backup.items).length, 'item')}).</p>
            <div className="hstack" style={{ marginLeft: 'calc(var(--sp-2) * -1)' }}>
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
            <h1>Start with a 20-question set</h1>
            <p>A mix from all five domains, with every answer explained.</p>
          </>
        ) : (
          <>
            <h1>Practice {domainFor(weakest)?.name || weakest}</h1>
            <p>
              Your weakest domain · {w.pct}% mastered · {domainFor(weakest)?.weight ?? '—'}% of the exam
            </p>
          </>
        )}
        <div className="hstack">
          <button className="btn primary lg" onClick={() => go({ name: 'practice', preset: fresh ? { quick: true } : { categories: [weakest], focus: 'weak' } })}>
            Start practice
          </button>
          <span className="faint small">20 questions · about 15 minutes</span>
        </div>
      </section>

      <section className="sec">
        <Eyebrow>Recommended</Eyebrow>
        <div className="rows" style={{ marginTop: 'var(--sp-3)' }}>
          {recs.map((r) => (
            <button key={r.t} className="rowbtn" onClick={() => (r.action ? r.action() : go(r.go))}>
              <span>
                <span className="t">{r.t}</span>
                <span className="s">{r.s}</span>
              </span>
              <span className="r">→</span>
            </button>
          ))}
        </div>
      </section>

      <section className="sec">
        <Eyebrow>All modes</Eyebrow>
        <div className="modegrid" style={{ marginTop: 'var(--sp-4)' }}>
          {modes.map((m) => (
            <button key={m.name} className="modetile" onClick={() => go(m.name)}>
              <Icon name={m.name} size={1.25} />
              <span className="t">{m.title}</span>
              <span className="s">{m.sub}</span>
            </button>
          ))}
        </div>
      </section>
    </Page>
  );
}
