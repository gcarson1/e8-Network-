import { useEffect, useMemo, useRef, useState } from 'react';
import Page, { SessionBar } from '../components/Page.jsx';
import { SessionSide } from '../components/SessionSide.jsx';
import { Chips, Eyebrow, Seg } from '../components/ui.jsx';
import { Explanation, QuestionView, keyToOption, toggleAnswer } from '../components/QuestionView.jsx';
import { useStudy } from '../state.jsx';
import { useNav } from '../nav.jsx';
import { domainFor } from '../lib/bank.js';
import { itemScore, itemStatus } from '../lib/mastery.js';
import { fmtClock, plural, sameSet, shuffle } from '../lib/util.js';
import { Breakdown, ReviewList, ScoreLine } from './Results.jsx';

const FOCUS = [
  { value: 'random', label: 'Mixed' },
  { value: 'weak', label: 'Weakest first' },
  { value: 'new', label: 'Unseen' },
  { value: 'missed', label: 'Not mastered' },
];

/** Weakest first: lowest item score, then lowest domain mastery, random tiebreak. */
export function weakestFirst(list, items, stats) {
  return shuffle(list)
    .map((x) => ({ x, s: itemScore(items[x.id]), c: stats[x.category]?.pct ?? 0 }))
    .sort((a, b) => a.s - b.s || a.c - b.c)
    .map((r) => r.x);
}

export default function Practice({ view }) {
  const { questions, categories, items, stats, recordResults } = useStudy();
  const { setGuard, go } = useNav();
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

  // Shortcuts from Home, the mastery panel and exam results start right away.
  const started = useRef(false);
  useEffect(() => {
    if (started.current || !preset) return;
    started.current = true;
    if (preset.ids) {
      const set = new Set(preset.ids);
      begin(shuffle(questions.filter((q) => set.has(q.id))));
    } else if (preset.quick) {
      begin(shuffle(questions).slice(0, 20));
    } else if (preset.unseen) {
      begin(shuffle(questions.filter((q) => !items[q.id])).slice(0, 20));
    } else if (preset.categories) {
      begin(weakestFirst(questions.filter((q) => preset.categories.includes(q.category)), items, stats).slice(0, 20));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const running = s && !s.endedAt;
  const answeredCount = s ? Object.keys(s.results).length : 0;
  useEffect(() => {
    if (running && answeredCount > 0) setGuard({ title: 'Leave this set?', body: 'Answers you checked are already saved to your mastery.', confirmLabel: 'Leave' });
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
      window.scrollTo(0, 0);
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

  // ── setup ──
  if (!s) {
    const n = count === 'all' ? pool.length : Math.min(count, pool.length);
    return (
      <Page label="Practice setup">
        <div className="head">
          <h1>Practice</h1>
          <p>Answer, check, and read why. No timer.</p>
        </div>
        <div className="field">
          <span className="field-label">Domains</span>
          <Chips
            label="Domains"
            options={categories.map((c) => ({ value: c, label: domainFor(c)?.short || c, n: questions.filter((q) => q.category === c).length }))}
            selected={cats}
            onToggle={(c) => setCats((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]))}
          />
          <div className="hstack" style={{ marginLeft: 'calc(var(--sp-2) * -1)' }}>
            <button className="tbtn" onClick={() => setCats(categories)}>All</button>
            <button className="tbtn" onClick={() => setCats([])}>None</button>
          </div>
        </div>
        <div className="field">
          <span className="field-label">Focus</span>
          <Seg label="Focus" value={focus} onChange={setFocus} options={FOCUS} />
        </div>
        <div className="field">
          <span className="field-label">Questions</span>
          <Seg label="Number of questions" value={count} onChange={setCount} options={[10, 20, 40, { value: 'all', label: 'All' }]} />
        </div>
        <div className="form-foot">
          <button className="btn primary lg" onClick={start} disabled={n === 0}>
            {n === 0 ? 'No questions match' : `Start ${plural(n, 'question')}`}
          </button>
          <span className="faint small">{pool.length} available</span>
        </div>
      </Page>
    );
  }

  // ── results ──
  if (s.endedAt) {
    const graded = s.qs
      .filter((x) => x.id in s.results)
      .map((x) => ({ q: x, answer: s.picks[x.id] || [], correct: s.results[x.id], skipped: false, flagged: false }));
    const correct = graded.filter((g) => g.correct).length;
    const missedIds = graded.filter((g) => !g.correct).map((g) => g.q.id);
    return (
      <Page label="Practice result">
        <div className="head">
          <Eyebrow>Practice result</Eyebrow>
        </div>
        {graded.length ? (
          <ScoreLine pct={(correct / graded.length) * 100} correct={correct} total={graded.length} elapsed={(s.endedAt - s.startedAt) / 1000} />
        ) : (
          <p className="muted">No answers checked.</p>
        )}
        <div className="form-foot" style={{ margin: 'var(--sp-6) 0 var(--sp-7)' }}>
          {missedIds.length > 0 && (
            <button className="btn primary" onClick={() => begin(shuffle(questions.filter((x) => missedIds.includes(x.id))))}>
              Retry the {missedIds.length} missed
            </button>
          )}
          <button className={missedIds.length ? 'tbtn' : 'btn primary'} onClick={() => setS(null)}>New set</button>
        </div>
        {graded.length > 0 && (
          <>
            <section className="sec">
              <Eyebrow>By domain</Eyebrow>
              <div style={{ marginTop: 'var(--sp-3)' }}><Breakdown graded={graded} /></div>
            </section>
            <section className="sec">
              <ReviewList graded={graded} />
            </section>
          </>
        )}
      </Page>
    );
  }

  // ── running ──
  const correctSoFar = Object.values(s.results).filter(Boolean).length;
  const ok = checked && s.results[q.id];
  const answerText = q.correct.join(' & ');
  return (
    <Page
      label="Practice"
      bar={
        <SessionBar
          title="Practice"
          onExit={() => go('home')}
          meta={[`${correctSoFar}/${answeredCount} correct`, `${s.qs.length - answeredCount} left`]}
          right={
            <>
              <span className="mono faint small hide-sm" aria-label="Elapsed time">{fmtClock((now - s.startedAt) / 1000)}</span>
              <button className="btn" style={{ marginLeft: 'var(--sp-3)' }} onClick={finish}>Finish</button>
            </>
          }
        />
      }
      side={
        <SessionSide
          title="This set"
          stat={`${correctSoFar}/${answeredCount}`}
          statLabel="correct"
          cells={s.qs.map((x, i) => ({ state: x.id in s.results ? (s.results[x.id] ? 'good' : 'bad') : 'empty', title: `Question ${i + 1}` }))}
          current={s.idx}
          onSelect={(i) => setS((cur) => ({ ...cur, idx: i }))}
          legend={[
            { cls: 'good', label: 'Correct' },
            { cls: 'bad', label: 'Wrong' },
            { cls: '', label: 'Not yet' },
          ]}
        />
      }
    >
      <div className="spread qmeta">
        <Eyebrow n={`of ${s.qs.length}`}>Question {s.idx + 1}</Eyebrow>
        <span className="faint small">{domainFor(q.category)?.short || q.category}</span>
      </div>
      <div key={q.id}>
        <QuestionView q={q} selected={picks} onToggle={choose} reveal={checked} />
        {checked && (
          <div aria-live="polite">
            <Explanation text={q.explanation || ' '} ok={ok} label={ok ? 'Correct' : `Incorrect · answer ${answerText}`} />
          </div>
        )}
      </div>
      <div className="qactions">
        {!checked ? (
          <>
            <button className="btn primary" onClick={check} disabled={!canCheck}>Check</button>
            <span className="hint hide-sm">{q.multi ? `Pick ${q.correct.length}` : 'Enter also checks'}</span>
            <span className="spacer" />
            <button className="tbtn" onClick={next} style={{ marginRight: 'calc(var(--sp-2) * -1)' }}>Skip</button>
          </>
        ) : (
          <button className="btn primary" onClick={next}>{s.idx === s.qs.length - 1 ? 'See results' : 'Next →'}</button>
        )}
      </div>
    </Page>
  );
}
