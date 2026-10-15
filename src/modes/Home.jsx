import Workspace from '../components/Workspace.jsx';
import { Eyebrow } from '../components/ui.jsx';
import { useStudy } from '../state.jsx';
import { useNav } from '../nav.jsx';
import { EXAM, domainFor } from '../lib/bank.js';
import { LABS } from '../labs/index.js';
import { plural, relativeTime } from '../lib/util.js';

export default function Home() {
  const { questions, categories, terms, stats, overall, backup, replaceItems, dismissBackup, notify } = useStudy();
  const { go, openData } = useNav();
  const fresh = overall.seen === 0;

  // Weakest domain = lowest mastery, ties broken by exam weight (heavier first).
  const weakest = [...categories].sort(
    (a, b) => stats[a].pct - stats[b].pct || (domainFor(b)?.weight || 0) - (domainFor(a)?.weight || 0),
  )[0];

  const restore = () => {
    replaceItems(backup.items, 'restore');
    notify(`Restored ${Object.keys(backup.items).length} items. Export to keep them.`);
  };

  return (
    <Workspace mainLabel="Home">
      <div className="hero">
        <Eyebrow>CompTIA Network+ · {EXAM.code}</Eyebrow>
        <h1 style={{ marginTop: 14 }}>Practice, drill, and simulate the exam, all from one file.</h1>
        <p className="lede" style={{ marginTop: 12 }}>
          {questions.length} questions across {categories.length} exam domains, {terms.length} key-term flashcards and {LABS.length} hands-on labs.
          Works offline, no login.
        </p>
        <div className="cta-row">
          {fresh ? (
            <>
              <button className="btn primary" onClick={() => go({ name: 'practice', stamp: Date.now() })}>
                Start a practice set →
              </button>
              <button className="btn link" onClick={openData}>
                I have a progress file
              </button>
            </>
          ) : (
            <>
              <button
                className="btn primary"
                onClick={() => go({ name: 'practice', stamp: Date.now(), preset: { categories: [weakest], focus: 'weak' } })}
              >
                Practice weakest domain: {domainFor(weakest)?.short || weakest} · {stats[weakest].pct}% →
              </button>
              <button className="btn link" onClick={() => go({ name: 'exam', stamp: Date.now() })}>
                Take a timed exam
              </button>
            </>
          )}
        </div>
      </div>

      {backup && fresh && (
        <div className="notice" role="status">
          <span className="bar-mark" />
          <div className="stack" style={{ flex: 1 }}>
            <p>
              <b>Unsaved progress from {relativeTime(backup.at)}</b> was found in this browser ({plural(Object.keys(backup.items).length, 'item')}).
              It wasn't exported, so restore it now if you want it.
            </p>
            <div className="row">
              <button className="btn small" onClick={restore}>
                Restore it
              </button>
              <button className="btn link small" onClick={dismissBackup}>
                Ignore
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mode-list">
        <ModeItem
          n="01"
          title="Simulated exam"
          desc={`${EXAM.questions} questions in ${EXAM.minutes} minutes, drawn by official domain weighting. No feedback until you submit.`}
          onClick={() => go({ name: 'exam', stamp: Date.now() })}
        />
        <ModeItem
          n="02"
          title="Practice"
          desc="Pick domains and get instant feedback with the full explanation after every answer."
          onClick={() => go({ name: 'practice', stamp: Date.now() })}
        />
        <ModeItem
          n="03"
          title="Flashcards"
          desc="Flip question-bank cards and key terms. Smart Deck surfaces your weakest domains first."
          onClick={() => go({ name: 'flashcards', stamp: Date.now() })}
        />
        <ModeItem
          n="04"
          title="Labs"
          desc="Interactive tools for subnetting, OSI, ports, VLANs, routing, Wi-Fi, IPv6 and more."
          onClick={() => go({ name: 'labs', stamp: Date.now() })}
        />
      </div>

      <div className="notice">
        <span className="bar-mark" />
        <p className="muted">
          Nothing is saved automatically. When you finish studying, open <b>Progress</b> (top right) and download your file. Import it next time to pick up where you left off.
        </p>
      </div>
    </Workspace>
  );
}

function ModeItem({ n, title, desc, onClick }) {
  return (
    <button className="mode-item" onClick={onClick}>
      <span className="num">{n}</span>
      <span>
        <h3>{title}</h3>
        <p>{desc}</p>
      </span>
      <span className="arrow">→</span>
    </button>
  );
}
