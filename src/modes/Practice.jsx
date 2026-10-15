import { useEffect, useMemo, useRef, useState } from 'react';
import Workspace from '../components/Workspace.jsx';
import { SessionSide } from '../components/SessionSide.jsx';
import { Chips, Eyebrow, Seg } from '../components/ui.jsx';
import { Explanation, QuestionView, keyToOption, toggleAnswer } from '../components/QuestionView.jsx';
import { useStudy } from '../state.jsx';
import { useNav } from '../nav.jsx';
import { itemScore, itemStatus } from '../lib/mastery.js';
import { fmtClock, plural, sameSet, shuffle } from '../lib/util.js';
import { Breakdown, ReviewList, ScoreLine } from './Results.jsx';

const FOCUS = [
  { value: 'random', label: 'Mixed' },
  { value: 'weak', label: 'Weakest first' },
  { value: 'new', label: 'New only' },
  { value: 'missed', label: 'Missed' },
];

/** Orders items weakest-first: low item score, then low category mastery, random tiebreak. */
export function weakestFirst(list, items, stats) {
  return shuffle(list)
    .map((x) => ({ x, s: itemScore(items[x.id]), c: stats[x.category]?.pct ?? 0 }))
    .sort((a, b) => a.s - b.s || a.c - b.c)
    .map((r) => r.x);
}

export default function Practice({ view }) {
  const { questions, categories, items, stats, recordResults } = useStudy();
  const { setGuard } = useNav();
  const preset = view?.preset;

  const [cats, setCats] = useState(preset?.categories || categories);
  const [count, setCount] = useState(20);
  const [focus, setFocus] = useState(preset?.focus || 'random');
  const [s, setS] = useState(null);
  const [now, setNow] = useState(Date.now());

  const pool = useMemo(() => {
    let list = questions.filter((q) => cats.includes(q.category));
    if (focus === 'new') list = list.filter((q) => !items[q.id]);
    if (focus === 'missed') list = list.filter((q) => items[q.id] && itemStatus(items[q.id]) !== 'mastered');
    return list;
  }, [questions, cats, focus, items]);

  const begin = (qs) => {
    setS({ qs, idx: 0, picks: {}, results: {}, startedAt: Date.now(), endedAt: null });
    window.scrollTo(0, 0);
  };

  const start = () => {
    const ordered = focus === 'weak' || focus === 'missed' ? weakestFirst(pool, items, stats) : shuffle(pool);
    begin(count === 'all' ? ordered : ordered.slice(0, count));
  };

  // Presets from Home / exam results start right away.
  const started = useRef(false);
  useEffect(() => {
    if (started.current || !preset) return;
    started.current = true;
    if (preset.ids) {
      const set = new Set(preset.ids);
      begin(shuffle(questions.filter((q) => set.has(q.id))));
    } else if (preset.categories) {
      const list = questions.filter((q) => preset.categories.includes(q.category));
      begin(weakestFirst(list, items, stats).slice(0, 20));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const running = s && !s.endedAt;
  const answeredCount = s ? Object.keys(s.results).length : 0;
  useEffect(() => {
    if (running && answeredCount > 0) {
      setGuard({ title: 'End this practice set?', body: 'Answers you already checked are saved to your mastery stats.', confirmLabel: 'End set' });
    }
    return () => setGuard(null);
  }, [running, answeredCount, setGuard]);

  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);

  const q = s?.qs[s.idx];
  const picks = q ? s.picks[q.id] || [] : [];
  const checked = q ? q.id in s.results : false;
  const canCheck = q && picks.length === q.correct.length;

  const choose = (key) => {
    if (checked) return;
    setS((cur) => {
      const cq = cur.qs[cur.idx];
      return { ...cur, picks: { ...cur.picks, [cq.id]: toggleAnswer(cq, cur.picks[cq.id], key) } };
    });
  };
  const check = () => {
    if (!canCheck || checked) return;
    const ok = sameSet(picks, q.correct);
    recordResults([[q.id, ok]]);
    setS((cur) => ({ ...cur, results: { ...cur.results, [q.id]: ok } }));
  };
  const finish = () => {
    setS((cur) => ({ ...cur, endedAt: Date.now() }));
    window.scrollTo(0, 0);
  };
  const next = () => {
    if (s.idx === s.qs.length - 1) finish();
    else {
      setS((cur) => ({ ...cur, idx: cur.idx + 1 }));
      document.querySelector('.main')?.scrollIntoView({ block: 'start' });
    }
  };

  const keyRef = useRef(null);
  keyRef.current = (e) => {
    if (!running || document.querySelector('.modal') || /input|textarea/i.test(e.target.tagName)) return;
    const opt = keyToOption(q, e);
    if (opt && !checked) { choose(opt); e.preventDefault(); return; }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (checked) next();
      else check();
    }
  };
  useEffect(() => {
    const h = (e) => keyRef.current?.(e);
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // ================= setup =================
  if (!s) {
    const available = pool.length;
    const n = count === 'all' ? available : Math.min(count, available);
    return (
      <Workspace mainLabel="Practice setup">
        <div className="hero">
          <Eyebrow>Practice mode</Eyebrow>
          <h1 style={{ marginTop: 14 }}>Answer, check, and read why, one question at a time.</h1>
          <p className="lede" style={{ marginTop: 12 }}>
            No time pressure. Every answer you check updates your mastery stats.
          </p>
        </div>
        <div className="section">
          <div className="field">
            <span className="label">Domains</span>
            <div>
              <Chips
                options={categories.map((c) => ({ value: c, label: c, count: questions.filter((q) => q.category === c).length }))}
                selected={cats}
                onToggle={(c) => setCats((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]))}
              />
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn link small" onClick={() => setCats(categories)}>All</button>
                <button className="btn link small" onClick={() => setCats([])}>None</button>
              </div>
            </div>
          </div>
          <div className="field">
            <span className="label">Focus</span>
            <div>
              <Seg label="Question focus" value={focus} onChange={setFocus} options={FOCUS} />
              <p className="hint">
                {focus === 'random' && 'A random mix from the selected domains.'}
                {focus === 'weak' && 'Unseen and missed questions first, starting with your weakest domains.'}
                {focus === 'new' && "Only questions you haven't answered yet."}
                {focus === 'missed' && "Questions you've answered but not mastered yet."}
              </p>
            </div>
          </div>
          <div className="field">
            <span className="label">Questions</span>
            <div>
              <Seg
                label="Number of questions"
                value={count}
                onChange={setCount}
                options={[10, 20, 40, { value: 'all', label: 'All' }]}
              />
              <p className="hint">{available} available with these settings.</p>
            </div>
          </div>
        </div>
        <div className="qfoot">
          <button className="btn primary" onClick={start} disabled={n === 0}>
            {n === 0 ? 'No questions match' : `Start ${plural(n, 'question')}`}
          </button>
        </div>
      </Workspace>
    );
  }

  // ================= results =================
  if (s.endedAt) {
    const graded = s.qs
      .filter((x) => x.id in s.results)
      .map((x) => ({ q: x, answer: s.picks[x.id] || [], correct: s.results[x.id], skipped: false, flagged: false }));
    const correct = graded.filter((g) => g.correct).length;
    const missedIds = graded.filter((g) => !g.correct).map((g) => g.q.id);
    return (
      <Workspace
        mainLabel="Practice results"
        side={
          <SessionSide
            title="Results"
            stat={`${correct}/${graded.length}`}
            statLabel="correct"
            cells={graded.map((g, i) => ({ state: g.correct ? 'ok' : 'bad', title: `Q${i + 1} · ${g.q.category}` }))}
            onSelect={(i) => document.getElementById(`rv-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            legend={[{ cls: 'ok', label: 'Correct' }, { cls: 'bad', label: 'Incorrect' }]}
          />
        }
      >
        {graded.length === 0 ? (
          <div className="section stack">
            <Eyebrow>Practice ended</Eyebrow>
            <p className="muted">You didn't check any answers this time.</p>
          </div>
        ) : (
          <>
            <div className="section stack-lg">
              <Eyebrow>Practice complete</Eyebrow>
              <ScoreLine pct={(correct / graded.length) * 100} correct={correct} total={graded.length} elapsed={(s.endedAt - s.startedAt) / 1000} />
            </div>
            <div className="section stack">
              <Eyebrow>By domain</Eyebrow>
              <Breakdown graded={graded} />
            </div>
            <div className="section stack">
              <ReviewList graded={graded} />
            </div>
          </>
        )}
        <div className="qfoot">
          {missedIds.length > 0 && (
            <button className="btn primary" onClick={() => begin(shuffle(questions.filter((x) => missedIds.includes(x.id))))}>
              Retry the {missedIds.length} missed →
            </button>
          )}
          <button className={`btn ${missedIds.length ? 'quiet' : 'primary'}`} onClick={() => setS(null)}>
            New practice set
          </button>
        </div>
      </Workspace>
    );
  }

  // ================= running =================
  const correctSoFar = Object.values(s.results).filter(Boolean).length;
  const ok = checked && s.results[q.id];
  return (
    <Workspace
      mainLabel="Practice"
      side={
        <SessionSide
          title="This set"
          stat={`${correctSoFar}/${answeredCount}`}
          statLabel={`correct · ${s.qs.length - answeredCount} to go`}
          cells={s.qs.map((x, i) => ({
            state: x.id in s.results ? (s.results[x.id] ? 'ok' : 'bad') : 'empty',
            title: `Question ${i + 1}`,
          }))}
          current={s.idx}
          onSelect={(i) => setS((cur) => ({ ...cur, idx: i }))}
          legend={[
            { cls: 'ok', label: 'Correct' },
            { cls: 'bad', label: 'Incorrect' },
            { cls: '', label: 'Not yet' },
          ]}
        >
          <button className="btn quiet block" onClick={finish}>
            End set & see results
          </button>
        </SessionSide>
      }
    >
      <div className="qhead">
        <span className="qnum">
          Question <b>{s.idx + 1}</b> of {s.qs.length}
        </span>
        <span className="faint mono hide-sm" style={{ fontSize: 12 }}>{q.category}</span>
        <span className="spacer" />
        <span className="mono muted" style={{ fontSize: 13 }} aria-label="Elapsed time">
          {fmtClock((now - s.startedAt) / 1000)}
        </span>
      </div>
      <div className="section stack-lg" key={q.id}>
        <QuestionView q={q} selected={picks} onToggle={choose} reveal={checked} />
        {checked && (
          <div className="stack" aria-live="polite">
            <div className={`verdict ${ok ? 'ok' : 'bad'}`}>
              <span className="mark">{ok ? '✓' : '✕'}</span>
              {ok ? 'Correct' : `Incorrect. The answer is ${q.correct.join(' & ')}.`}
            </div>
            <Explanation text={q.explanation} />
          </div>
        )}
      </div>
      <div className="qfoot">
        {!checked ? (
          <>
            <button className="btn primary" onClick={check} disabled={!canCheck}>
              Check answer
            </button>
            <span className="faint" style={{ fontSize: 13 }}>
              {q.multi ? `Pick ${q.correct.length}, then check.` : 'Pick one, then check. Enter works too.'}
            </span>
            <span className="spacer" />
            <button className="btn link" onClick={next}>
              Skip
            </button>
          </>
        ) : (
          <button className="btn primary" onClick={next}>
            {s.idx === s.qs.length - 1 ? 'See results' : 'Next question →'}
          </button>
        )}
      </div>
    </Workspace>
  );
}
