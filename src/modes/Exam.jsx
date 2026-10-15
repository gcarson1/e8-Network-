import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Page, { SessionBar } from '../components/Page.jsx';
import { SessionSide } from '../components/SessionSide.jsx';
import { Eyebrow, Icon, Seg } from '../components/ui.jsx';
import { QuestionView, keyToOption, toggleAnswer } from '../components/QuestionView.jsx';
import { useStudy } from '../state.jsx';
import { useNav } from '../nav.jsx';
import { EXAM, domainFor } from '../lib/bank.js';
import { fmtClock, plural, sameSet, shuffle, weightedSample } from '../lib/util.js';
import { Breakdown, ReviewList, ScoreLine } from './Results.jsx';

export default function Exam({ view }) {
  const { questions, recordResults } = useStudy();
  const { setGuard, confirm, go } = useNav();
  const presets = [EXAM.questions, 45, 20].filter((n) => n <= questions.length);
  if (!presets.length) presets.push(questions.length);

  const [count, setCount] = useState(() => (presets.includes(view?.preset?.count) ? view.preset.count : presets[0]));
  const [weighting, setWeighting] = useState('official');
  const [s, setS] = useState(null);
  const [now, setNow] = useState(Date.now());
  const running = s && !s.endedAt;

  const start = () => {
    const qs = weighting === 'official' ? weightedSample(questions, count, (c) => domainFor(c)?.weight) : shuffle(questions).slice(0, count);
    setS({ qs, answers: {}, flags: {}, idx: 0, startedAt: Date.now(), durationSec: count * 60, endedAt: null });
    window.scrollTo(0, 0);
  };

  const sRef = useRef(null);
  sRef.current = s;
  const submit = useCallback(
    (timedOut = false) => {
      const cur = sRef.current;
      if (!cur || cur.endedAt) return;
      const results = cur.qs.filter((x) => cur.answers[x.id]?.length).map((x) => [x.id, sameSet(cur.answers[x.id], x.correct)]);
      const done = { ...cur, endedAt: Math.min(Date.now(), cur.startedAt + cur.durationSec * 1000), timedOut };
      sRef.current = done;
      recordResults(results);
      setS(done);
      setGuard(null);
      window.scrollTo(0, 0);
    },
    [recordResults, setGuard],
  );

  useEffect(() => {
    if (running) setGuard({ title: 'Leave the exam?', body: 'This attempt is discarded and nothing is recorded.', confirmLabel: 'Leave exam' });
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

  const q = s?.qs[s.idx];
  const setIdx = (i) => {
    setS((cur) => ({ ...cur, idx: Math.max(0, Math.min(cur.qs.length - 1, i)) }));
    window.scrollTo(0, 0);
  };
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

  const answered = s ? s.qs.filter((x) => s.answers[x.id]?.length === x.correct.length).length : 0;
  const flagged = s ? s.qs.filter((x) => s.flags[x.id]).length : 0;

  const askSubmit = async () => {
    const left = s.qs.length - answered;
    const ok = await confirm({
      title: 'Submit the exam?',
      body: left
        ? `${plural(left, 'question')} unanswered${flagged ? `, ${flagged} flagged` : ''}. Unanswered questions count as wrong.`
        : flagged
          ? `Everything is answered. ${plural(flagged, 'question is', 'questions are')} still flagged.`
          : 'Everything is answered.',
      confirmLabel: 'Submit',
      cancelLabel: 'Keep going',
    });
    if (ok) submit(false);
  };

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

  const graded = useMemo(() => {
    if (!s?.endedAt) return null;
    return s.qs.map((x) => {
      const a = s.answers[x.id] || [];
      return { q: x, answer: a, correct: a.length > 0 && sameSet(a, x.correct), skipped: a.length === 0, flagged: !!s.flags[x.id] };
    });
  }, [s]);

  // ── setup ──
  if (!s) {
    return (
      <Page label="Exam setup">
        <div className="head">
          <h1>Exam</h1>
          <p>Timed like the real thing. No feedback until you submit.</p>
        </div>
        <div className="field">
          <span className="field-label">Length</span>
          <Seg
            label="Exam length"
            value={count}
            onChange={setCount}
            options={presets.map((n) => ({ value: n, label: `${n} questions · ${n} min` }))}
          />
        </div>
        <div className="field">
          <span className="field-label">Questions</span>
          <Seg
            label="How questions are drawn"
            value={weighting}
            onChange={setWeighting}
            options={[
              { value: 'official', label: 'Weighted like the exam' },
              { value: 'random', label: 'Random' },
            ]}
          />
        </div>
        <div className="form-foot">
          <button className="btn primary lg" onClick={start}>Start exam</button>
          <span className="faint small">Pass mark: {EXAM.passing} on a {EXAM.scaleMin}–{EXAM.scaleMax} scale</span>
        </div>
      </Page>
    );
  }

  // ── results ──
  if (graded) {
    const correct = graded.filter((g) => g.correct).length;
    const missedIds = graded.filter((g) => !g.correct).map((g) => g.q.id);
    const skipped = graded.filter((g) => g.skipped).length;
    return (
      <Page label="Exam result">
        <div className="head">
          <Eyebrow>{s.timedOut ? 'Time ran out' : 'Exam result'}</Eyebrow>
        </div>
        <ScoreLine pct={(correct / graded.length) * 100} correct={correct} total={graded.length} elapsed={(s.endedAt - s.startedAt) / 1000} showScaled />
        {skipped > 0 && <p className="muted small" style={{ marginTop: 'var(--sp-3)' }}>{plural(skipped, 'question')} left blank. Blanks count as wrong here but don't touch your mastery.</p>}
        <div className="form-foot" style={{ margin: 'var(--sp-6) 0 var(--sp-7)' }}>
          {missedIds.length > 0 && (
            <button className="btn primary" onClick={() => go({ name: 'practice', preset: { ids: missedIds } })}>
              Practice the {missedIds.length} missed
            </button>
          )}
          <button className={missedIds.length ? 'tbtn' : 'btn primary'} onClick={() => setS(null)}>New exam</button>
        </div>
        <section className="sec">
          <Eyebrow>By domain</Eyebrow>
          <div style={{ marginTop: 'var(--sp-3)' }}><Breakdown graded={graded} /></div>
        </section>
        <section className="sec">
          <ReviewList graded={graded} />
        </section>
      </Page>
    );
  }

  // ── running ──
  const answer = s.answers[q.id] || [];
  const isLast = s.idx === s.qs.length - 1;
  return (
    <Page
      label="Exam"
      bar={
        <SessionBar
          title="Exam"
          onExit={() => go('home')}
          meta={[`${answered}/${s.qs.length} answered`, flagged ? `${flagged} flagged` : null]}
          right={
            <>
              <span className={`timer ${remaining < 300 ? 'low' : ''}`} role="timer" aria-label="Time remaining">{fmtClock(remaining)}</span>
              <button className={`btn ${answered === s.qs.length ? 'primary' : ''}`} style={{ marginLeft: 'var(--sp-3)' }} onClick={askSubmit}>Submit</button>
            </>
          }
        />
      }
      side={
        <SessionSide
          title="Questions"
          stat={`${answered}/${s.qs.length}`}
          statLabel="answered"
          cells={s.qs.map((x, i) => ({ state: s.answers[x.id]?.length === x.correct.length ? 'answered' : 'empty', flagged: !!s.flags[x.id], title: `Question ${i + 1}` }))}
          current={s.idx}
          onSelect={setIdx}
          legend={[
            { cls: 'answered', label: 'Answered' },
            { cls: '', label: 'Blank' },
            { cls: 'flagged', label: 'Flagged' },
          ]}
        >
          <p className="faint small">Click a square to jump to it. Keys: letter to answer, ← → to move, F to flag.</p>
        </SessionSide>
      }
    >
      <div className="spread qmeta">
        <Eyebrow n={`of ${s.qs.length}`}>Question {s.idx + 1}</Eyebrow>
        <button className={`tbtn ${s.flags[q.id] ? 'on' : ''}`} onClick={toggleFlag} aria-pressed={!!s.flags[q.id]} style={{ marginRight: 'calc(var(--sp-2) * -1)' }}>
          <Icon name="flag" /> {s.flags[q.id] ? 'Flagged' : 'Flag'}
        </button>
      </div>
      <div key={q.id}>
        <QuestionView q={q} selected={answer} onToggle={choose} />
      </div>
      <div className="qactions">
        <button className="tbtn" onClick={() => setIdx(s.idx - 1)} disabled={s.idx === 0} style={{ marginLeft: 'calc(var(--sp-2) * -1)' }}>← Previous</button>
        <span className="spacer" />
        {isLast ? (
          <button className="btn primary" onClick={askSubmit}>Review & submit</button>
        ) : (
          <button className="btn primary" onClick={() => setIdx(s.idx + 1)}>Next →</button>
        )}
      </div>
    </Page>
  );
}
