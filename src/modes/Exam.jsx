import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Workspace from '../components/Workspace.jsx';
import { SessionSide } from '../components/SessionSide.jsx';
import { Eyebrow, Icon, Seg } from '../components/ui.jsx';
import { QuestionView, keyToOption, toggleAnswer } from '../components/QuestionView.jsx';
import { useStudy } from '../state.jsx';
import { useNav } from '../nav.jsx';
import { EXAM, domainFor } from '../lib/bank.js';
import { fmtClock, plural, sameSet, shuffle, weightedSample } from '../lib/util.js';
import { Breakdown, ReviewList, ScoreLine } from './Results.jsx';

export default function Exam() {
  const { questions, recordResults } = useStudy();
  const { setGuard, confirm, go } = useNav();
  const max = questions.length;
  const presets = [EXAM.questions, 45, 20].filter((n) => n <= max);
  if (!presets.length) presets.push(max);

  const [count, setCount] = useState(presets[0]);
  const [weighting, setWeighting] = useState('official');
  const [s, setS] = useState(null); // running/finished session
  const [now, setNow] = useState(Date.now());

  const running = s && !s.endedAt;

  // ----- start / submit -----
  const start = () => {
    const qs =
      weighting === 'official'
        ? weightedSample(questions, count, (c) => domainFor(c)?.weight)
        : shuffle(questions).slice(0, count);
    setS({ qs, answers: {}, flags: {}, idx: 0, startedAt: Date.now(), durationSec: count * 60, endedAt: null });
    window.scrollTo(0, 0);
  };

  const sRef = useRef(null);
  sRef.current = s;
  const submit = useCallback(
    (timedOut = false) => {
      const cur = sRef.current;
      if (!cur || cur.endedAt) return;
      const results = cur.qs
        .filter((x) => cur.answers[x.id]?.length)
        .map((x) => [x.id, sameSet(cur.answers[x.id], x.correct)]);
      const done = { ...cur, endedAt: Math.min(Date.now(), cur.startedAt + cur.durationSec * 1000), timedOut };
      sRef.current = done; // block a second submit before re-render
      recordResults(results);
      setS(done);
      setGuard(null);
      window.scrollTo(0, 0);
    },
    [recordResults, setGuard],
  );

  // ----- guard + timer -----
  useEffect(() => {
    if (running) {
      setGuard({
        title: 'Leave the exam?',
        body: 'This attempt will be discarded and nothing from it is recorded.',
        confirmLabel: 'Leave exam',
      });
    }
    return () => setGuard(null);
  }, [running, setGuard]);

  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [running]);

  const remaining = s ? s.durationSec - (now - s.startedAt) / 1000 : 0;
  useEffect(() => {
    if (running && remaining <= 0) submit(true);
  }, [running, remaining, submit]);

  // ----- answer helpers -----
  const q = s?.qs[s.idx];
  const setIdx = (i) => setS((cur) => ({ ...cur, idx: Math.max(0, Math.min(cur.qs.length - 1, i)) }));
  const choose = (key) =>
    setS((cur) => {
      const cq = cur.qs[cur.idx];
      return { ...cur, answers: { ...cur.answers, [cq.id]: toggleAnswer(cq, cur.answers[cq.id], key) } };
    });
  const toggleFlag = () =>
    setS((cur) => {
      const id = cur.qs[cur.idx].id;
      return { ...cur, flags: { ...cur.flags, [id]: !cur.flags[id] } };
    });

  const answeredCount = s ? s.qs.filter((x) => s.answers[x.id]?.length === x.correct.length).length : 0;
  const flaggedCount = s ? s.qs.filter((x) => s.flags[x.id]).length : 0;

  const askSubmit = async () => {
    const unanswered = s.qs.length - answeredCount;
    const ok = await confirm({
      title: 'Submit exam?',
      body: unanswered
        ? `${plural(unanswered, 'question is', 'questions are')} unanswered${flaggedCount ? ` and ${flaggedCount} flagged` : ''}. Unanswered questions count as wrong.`
        : flaggedCount
          ? `All questions answered. ${plural(flaggedCount, 'question is', 'questions are')} still flagged for review.`
          : 'All questions answered.',
      confirmLabel: 'Submit',
      cancelLabel: 'Keep working',
    });
    if (ok) submit(false);
  };

  // Keyboard shortcuts while the exam runs.
  const keyRef = useRef(null);
  keyRef.current = (e) => {
    if (!running || document.querySelector('.modal') || /input|textarea/i.test(e.target.tagName)) return;
    const opt = keyToOption(q, e);
    if (opt) { choose(opt); e.preventDefault(); return; }
    if (e.key === 'ArrowRight' || e.key === 'Enter') { if (s.idx < s.qs.length - 1) setIdx(s.idx + 1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { setIdx(s.idx - 1); e.preventDefault(); }
    else if (e.key.toLowerCase() === 'f') toggleFlag();
  };
  useEffect(() => {
    const h = (e) => keyRef.current?.(e);
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // ----- results data -----
  const graded = useMemo(() => {
    if (!s?.endedAt) return null;
    return s.qs.map((x) => {
      const a = s.answers[x.id] || [];
      return { q: x, answer: a, correct: a.length > 0 && sameSet(a, x.correct), skipped: a.length === 0, flagged: !!s.flags[x.id] };
    });
  }, [s]);

  // ================= render =================
  if (!s) {
    return (
      <Workspace mainLabel="Exam setup">
        <div className="hero">
          <Eyebrow>Simulated exam</Eyebrow>
          <h1 style={{ marginTop: 14 }}>Exam conditions: a timer, no feedback, one score at the end.</h1>
          <p className="lede" style={{ marginTop: 12 }}>
            The real {EXAM.code} has up to {EXAM.questions} questions in {EXAM.minutes} minutes and you need {EXAM.passing} on a {EXAM.scaleMin}–{EXAM.scaleMax} scale to pass.
            You can flag questions and move around freely. Your results feed your mastery stats.
          </p>
        </div>
        <div className="section">
          <div className="field">
            <span className="label">Length</span>
            <div>
              <Seg
                label="Exam length"
                value={count}
                onChange={setCount}
                options={presets.map((n) => ({ value: n, label: n === EXAM.questions ? `Full · ${n}` : `${n}` }))}
              />
              <p className="hint">
                {count} questions · {count} minute time limit (1 minute per question, like the real exam).
              </p>
            </div>
          </div>
          <div className="field">
            <span className="label">Domain mix</span>
            <div>
              <Seg
                label="Domain weighting"
                value={weighting}
                onChange={setWeighting}
                options={[
                  { value: 'official', label: `${EXAM.code} weights` },
                  { value: 'random', label: 'Random' },
                ]}
              />
              <p className="hint">
                {weighting === 'official'
                  ? 'Questions are drawn to match the official split: Concepts 23%, Implementations 20%, Operations 19%, Security 14%, Troubleshooting 24%.'
                  : 'Questions are drawn at random from the whole bank.'}
              </p>
            </div>
          </div>
        </div>
        <div className="qfoot">
          <button className="btn primary" onClick={start}>
            Start {count}-question exam
          </button>
          <span className="faint" style={{ fontSize: 13 }}>
            The real exam also has performance-based questions. Use Labs to practice those skills.
          </span>
        </div>
      </Workspace>
    );
  }

  if (graded) {
    const correct = graded.filter((g) => g.correct).length;
    const pct = (correct / graded.length) * 100;
    const elapsed = (s.endedAt - s.startedAt) / 1000;
    const skipped = graded.filter((g) => g.skipped).length;
    return (
      <Workspace
        mainLabel="Exam results"
        side={
          <SessionSide
            title="Results"
            stat={`${correct}/${graded.length}`}
            statLabel="correct"
            cells={graded.map((g, i) => ({
              state: g.skipped ? 'empty' : g.correct ? 'ok' : 'bad',
              flagged: g.flagged,
              title: `Q${i + 1} · ${g.q.category}`,
            }))}
            onSelect={(i) => document.getElementById(`rv-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            legend={[
              { cls: 'ok', label: 'Correct' },
              { cls: 'bad', label: 'Incorrect' },
              { cls: '', label: 'Unanswered' },
              { cls: 'flagged', label: 'Flagged' },
            ]}
          />
        }
      >
        <div className="section stack-lg">
          <Eyebrow>{s.timedOut ? "Time's up · exam submitted" : 'Exam submitted'}</Eyebrow>
          <ScoreLine pct={pct} correct={correct} total={graded.length} elapsed={elapsed} showScaled />
          {skipped > 0 && (
            <p className="muted" style={{ fontSize: 14 }}>
              {plural(skipped, 'question was', 'questions were')} left unanswered. They count against the score but not against your mastery stats.
            </p>
          )}
        </div>
        <div className="section stack">
          <Eyebrow>By domain</Eyebrow>
          <Breakdown graded={graded} />
        </div>
        <div className="section stack">
          <ReviewList graded={graded} />
        </div>
        <div className="qfoot">
          {graded.some((g) => !g.correct) ? (
            <button
              className="btn primary"
              onClick={() =>
                go({ name: 'practice', stamp: Date.now(), preset: { ids: graded.filter((g) => !g.correct).map((g) => g.q.id) } })
              }
            >
              Practice the {graded.filter((g) => !g.correct).length} you missed →
            </button>
          ) : null}
          <button className="btn quiet" onClick={() => setS(null)}>
            New exam
          </button>
        </div>
      </Workspace>
    );
  }

  // ----- running -----
  const answer = s.answers[q.id] || [];
  const isLast = s.idx === s.qs.length - 1;
  return (
    <Workspace
      mainLabel="Exam in progress"
      side={
        <SessionSide
          title="This exam"
          stat={`${answeredCount}/${s.qs.length}`}
          statLabel={`answered${flaggedCount ? ` · ${flaggedCount} flagged` : ''}`}
          cells={s.qs.map((x, i) => ({
            state: s.answers[x.id]?.length ? 'answered' : 'empty',
            flagged: !!s.flags[x.id],
            title: `Question ${i + 1}`,
          }))}
          current={s.idx}
          onSelect={setIdx}
          legend={[
            { cls: 'answered', label: 'Answered' },
            { cls: '', label: 'Not yet' },
            { cls: 'flagged', label: 'Flagged' },
          ]}
        >
          <button className={`btn block ${answeredCount === s.qs.length ? 'primary' : ''}`} onClick={askSubmit}>
            Submit exam
          </button>
          <p className="faint" style={{ fontSize: 12 }}>
            Results stay hidden until you submit. Keys: A–G pick, ←/→ move, F flags.
          </p>
        </SessionSide>
      }
    >
      <div className="qhead">
        <span className={`timer ${remaining < 300 ? 'low' : ''}`} role="timer" aria-live="off" aria-label="Time remaining">
          {fmtClock(remaining)}
        </span>
        <span className="qnum">
          Question <b>{s.idx + 1}</b> of {s.qs.length}
        </span>
        <span className="spacer" />
        <button className={`btn small ${s.flags[q.id] ? 'primary' : 'quiet'}`} onClick={toggleFlag} aria-pressed={!!s.flags[q.id]}>
          <Icon name="flag" size={15} />
          {s.flags[q.id] ? 'Flagged' : 'Flag'}
        </button>
      </div>
      <div className="section" key={q.id}>
        <QuestionView q={q} selected={answer} onToggle={choose} />
      </div>
      <div className="qfoot">
        <button className="btn quiet" onClick={() => setIdx(s.idx - 1)} disabled={s.idx === 0}>
          ← Previous
        </button>
        <span className="spacer" />
        {isLast ? (
          <button className="btn primary" onClick={askSubmit}>
            Review & submit
          </button>
        ) : (
          <button className="btn primary" onClick={() => setIdx(s.idx + 1)}>
            Next →
          </button>
        )}
      </div>
    </Workspace>
  );
}
