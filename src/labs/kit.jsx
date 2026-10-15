// Reusable lab building blocks: tabs, a rapid-fire match drill, an ordering
// exercise, and a ladder-diagram sequence animator.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Seg } from '../components/ui.jsx';
import { shuffle } from '../lib/util.js';

export function useNarrow(query = '(max-width: 600px)') {
  const [narrow, setNarrow] = useState(() => window.matchMedia?.(query).matches ?? false);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return undefined;
    const on = () => setNarrow(mq.matches);
    mq.addEventListener ? mq.addEventListener('change', on) : mq.addListener(on);
    return () => (mq.removeEventListener ? mq.removeEventListener('change', on) : mq.removeListener(on));
  }, [query]);
  return narrow;
}

export function PanHint() {
  return <p className="show-sm faint" style={{ fontSize: 12, marginTop: 8 }}>Swipe sideways to see the whole diagram.</p>;
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** Lab with tabbed sub-tools. tabs: [{ value, label, render: () => node }] */
export function TabbedLab({ tabs }) {
  const [tab, setTab] = useState(tabs[0].value);
  const cur = tabs.find((t) => t.value === tab) || tabs[0];
  return (
    <>
      {tabs.length > 1 && <Tabs tabs={tabs} value={tab} onChange={setTab} />}
      <div key={cur.value}>{cur.render()}</div>
    </>
  );
}

// ---------------------------------------------------------------------------
// MatchDrill
// modes: [{ label, items, prompt: item => node, answer: item => string,
//           note?: item => string, small?: bool, pool?: string[] (distractors) }]
// ---------------------------------------------------------------------------
export function MatchDrill({ modes, optionCount = 4, intro }) {
  const [modeIdx, setModeIdx] = useState(0);
  const [sprint, setSprint] = useState(false);
  const mode = modes[modeIdx];
  return (
    <div>
      <div className="section stack">
        {intro && <p className="muted">{intro}</p>}
        <div className="row">
          {modes.length > 1 && (
            <Seg label="Drill direction" value={modeIdx} onChange={setModeIdx} options={modes.map((m, i) => ({ value: i, label: m.label }))} />
          )}
          <Seg
            label="Drill type"
            value={sprint}
            onChange={setSprint}
            options={[
              { value: false, label: 'Practice' },
              { value: true, label: '60s sprint' },
            ]}
          />
        </div>
      </div>
      <DrillRun key={`${modeIdx}-${sprint}`} mode={mode} sprint={sprint} optionCount={optionCount} />
    </div>
  );
}

function buildOptions(mode, item, n) {
  const right = mode.answer(item);
  const pool = [...new Set(mode.pool || mode.items.map(mode.answer))].filter((a) => a !== right);
  return shuffle([right, ...shuffle(pool).slice(0, n - 1)]);
}

function DrillRun({ mode, sprint, optionCount }) {
  const [queue, setQueue] = useState(() => shuffle(mode.items));
  const [pos, setPos] = useState(0);
  const item = queue[pos % queue.length];
  const [options, setOptions] = useState(() => buildOptions(mode, queue[0], optionCount));
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState({ right: 0, wrong: 0, streak: 0, best: 0 });
  const [deadline, setDeadline] = useState(null);
  const [now, setNow] = useState(Date.now());
  const timer = useRef(null);

  const right = mode.answer(item);
  const done = sprint && deadline && now >= deadline;
  const remaining = deadline ? Math.max(0, Math.ceil((deadline - now) / 1000)) : 60;

  useEffect(() => {
    if (!sprint || !deadline || done) return undefined;
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, [sprint, deadline, done]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const advance = () => {
    clearTimeout(timer.current);
    const nextPos = pos + 1;
    let q = queue;
    if (nextPos % queue.length === 0) {
      q = shuffle(mode.items);
      setQueue(q);
    }
    setPos(nextPos);
    setOptions(buildOptions(mode, q[nextPos % q.length], optionCount));
    setPicked(null);
  };

  const pick = (opt) => {
    if (picked || done) return;
    if (sprint && !deadline) {
      setDeadline(Date.now() + 60000);
      setNow(Date.now());
    }
    setPicked(opt);
    const ok = opt === right;
    setScore((s) => {
      const streak = ok ? s.streak + 1 : 0;
      return { right: s.right + (ok ? 1 : 0), wrong: s.wrong + (ok ? 0 : 1), streak, best: Math.max(s.best, streak) };
    });
    if (!ok && !sprint) {
      // Re-queue the missed item a few cards later.
      setQueue((q) => {
        const copy = q.slice();
        copy.splice(Math.min(copy.length, (pos % q.length) + 4), 0, item);
        return copy;
      });
    }
    if (ok || sprint) timer.current = setTimeout(advance, ok ? 550 : 1100);
  };

  const keyRef = useRef(null);
  keyRef.current = (e) => {
    if (document.querySelector('.modal') || /input|textarea|select/i.test(e.target.tagName)) return;
    const n = Number(e.key);
    if (n >= 1 && n <= options.length) pick(options[n - 1]);
    else if (e.key === 'Enter' && picked && picked !== right && !sprint) advance();
  };
  useEffect(() => {
    const h = (e) => keyRef.current?.(e);
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const restart = () => {
    const q = shuffle(mode.items);
    setQueue(q);
    setPos(0);
    setOptions(buildOptions(mode, q[0], optionCount));
    setPicked(null);
    setScore({ right: 0, wrong: 0, streak: 0, best: 0 });
    setDeadline(null);
  };

  if (done) {
    return (
      <div className="section stack-lg">
        <div className="scoreline">
          <div className="stat"><div className="v ok-text">{score.right}</div><div className="k">Correct in 60s</div></div>
          <div className="stat"><div className="v small bad-text">{score.wrong}</div><div className="k">Missed</div></div>
          <div className="stat"><div className="v small">{score.best}</div><div className="k">Best streak</div></div>
        </div>
        <div className="row">
          <button className="btn primary" onClick={restart}>Go again</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="section stack-lg">
        <div className="scorebar">
          <span><b className="ok-text">{score.right}</b> right</span>
          <span><b className="bad-text">{score.wrong}</b> missed</span>
          <span><b>{score.streak}</b> streak</span>
          {sprint && <span><b>{remaining}s</b> {deadline ? 'left' : '· starts on first answer'}</span>}
        </div>
        <div className={`drill-prompt ${mode.small ? 'sm' : ''}`} aria-live="polite">{mode.prompt(item)}</div>
      </div>
      <div className="drill-options">
        {options.map((o, i) => {
          let cls = '';
          if (picked) {
            if (o === right) cls = 'is-correct';
            else if (o === picked) cls = 'is-wrong';
          }
          return (
            <button key={o} className={cls} onClick={() => pick(o)} disabled={!!picked}>
              <span className="k">{i + 1}</span>
              <span>{o}</span>
            </button>
          );
        })}
      </div>
      {picked && (picked !== right || mode.note) && (
        <div className="section stack">
          {picked !== right && (
            <p className="bad-text" style={{ fontWeight: 600 }}>
              Answer: {right}
            </p>
          )}
          {mode.note && <p className="muted">{mode.note(item)}</p>}
          {picked !== right && !sprint && (
            <div>
              <button className="btn primary" onClick={advance}>Next →</button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// OrderBuilder: tap items from the pool in order, then check.
// ---------------------------------------------------------------------------
export function OrderBuilder({ items, slotLabel = (i) => i + 1, prompt, success }) {
  const [placed, setPlaced] = useState([]);
  const [checked, setChecked] = useState(false);
  const [pool, setPool] = useState(() => shuffle(items));
  const remaining = pool.filter((x) => !placed.includes(x));
  const allRight = checked && placed.every((x, i) => x === items[i]);
  const wrongCount = checked ? placed.filter((x, i) => x !== items[i]).length : 0;

  const reset = () => {
    setPlaced([]);
    setChecked(false);
    setPool(shuffle(items));
  };

  return (
    <div className="section stack-lg">
      {prompt && <p className="muted">{prompt}</p>}
      <div className="order-slots">
        {items.map((_, i) => {
          const val = placed[i];
          const state = checked && val ? (val === items[i] ? 'ok' : 'bad') : '';
          return (
            <div key={i} className={`slot ${val ? 'filled' : ''} ${state}`}>
              <span className="n" style={{ paddingLeft: 10 }}>{slotLabel(i)}</span>
              {val ? (
                <button
                  className="item"
                  onClick={() => {
                    setPlaced((p) => p.filter((x) => x !== val));
                    setChecked(false);
                  }}
                  title="Remove"
                >
                  {val}
                </button>
              ) : (
                <span className="placeholder">{i === placed.length ? '← next pick goes here' : ''}</span>
              )}
              <span className="mono" style={{ fontSize: 12, paddingRight: 10 }}>
                {state === 'bad' ? <span className="bad-text">{items[i] === val ? '' : '✕'}</span> : state === 'ok' ? <span className="ok-text">✓</span> : ''}
              </span>
            </div>
          );
        })}
      </div>
      {remaining.length > 0 && (
        <div className="pool">
          {remaining.map((x) => (
            <button
              key={x}
              onClick={() => {
                setPlaced((p) => [...p, x]);
                setChecked(false);
              }}
            >
              {x}
            </button>
          ))}
        </div>
      )}
      {checked && (
        <div className={`callout ${allRight ? 'ok' : 'bad'}`}>
          {allRight ? (
            <p className="ok-text" style={{ fontWeight: 600 }}>{success || 'Correct order!'}</p>
          ) : (
            <p className="bad-text" style={{ fontWeight: 600 }}>
              {wrongCount} in the wrong spot. Tap a wrong item to send it back, then try again.
            </p>
          )}
        </div>
      )}
      <div className="row">
        <button className="btn primary" disabled={placed.length !== items.length || (checked && allRight)} onClick={() => setChecked(true)}>
          Check order
        </button>
        <button className="btn quiet" onClick={reset}>Reset</button>
        <button
          className="btn link"
          onClick={() => {
            setPlaced(items.slice());
            setChecked(true);
          }}
        >
          Show answer
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SequenceAnimator: ladder diagram, one arrow per step.
// lanes: ['Client', 'Server']; steps: [{ from, to, label, detail, note, states }]
// ---------------------------------------------------------------------------
export function SequenceAnimator({ lanes, steps, initialStates, caption }) {
  const [step, setStep] = useState(0); // number of steps shown
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return undefined;
    if (step >= steps.length) { setPlaying(false); return undefined; }
    const t = setTimeout(() => setStep((s) => s + 1), step === 0 ? 300 : 1500);
    return () => clearTimeout(t);
  }, [playing, step, steps.length]);

  const narrow = useNarrow();
  const many = lanes.length > 2;
  const W = narrow && !many ? 380 : 640;
  const pad = many ? 64 : narrow ? 64 : 110;
  const laneX = (i) => pad + (i * (W - pad * 2)) / Math.max(1, lanes.length - 1);
  const top = 70;
  const rowH = 62;
  const H = top + steps.length * rowH + 30;
  const states = useMemo(() => {
    const cur = initialStates ? [...initialStates] : lanes.map(() => '');
    for (let i = 0; i < step; i++) (steps[i].states || []).forEach((s, j) => { if (s) cur[j] = s; });
    return cur;
  }, [step, steps, initialStates, lanes]);
  const current = steps[step - 1];

  return (
    <div className="section stack-lg">
      <div className={`diagram-scroll ${many ? '' : 'fit'}`}>
      <svg className="diagram" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={caption || 'Sequence diagram'}>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" style={{ fill: 'var(--text)' }} />
          </marker>
        </defs>
        {lanes.map((l, i) => (
          <g key={l}>
            <text x={laneX(i)} y={22} textAnchor="middle" style={{ fontWeight: 650, fontSize: 15 }}>{l}</text>
            {initialStates && (
              <text x={laneX(i)} y={42} textAnchor="middle" className="mono muted" style={{ fontSize: 11 }}>
                {states[i]}
              </text>
            )}
            <line x1={laneX(i)} y1={top - 14} x2={laneX(i)} y2={H - 10} className="thin" strokeWidth="1.5" strokeDasharray="2 4" />
          </g>
        ))}
        {steps.slice(0, step).map((s, i) => {
          const y1 = top + i * rowH;
          const y2 = y1 + rowH - 18;
          const x1 = laneX(s.from);
          const x2 = laneX(s.to);
          const mid = (x1 + x2) / 2;
          const active = i === step - 1;
          const targets = s.to === 'all' ? lanes.map((_, j) => j).filter((j) => j !== s.from) : [s.to];
          return (
            <g key={i} style={{ opacity: active ? 1 : 0.45 }}>
              {targets.map((t) => (
                <line
                  key={t}
                  x1={x1}
                  y1={y1}
                  x2={laneX(t)}
                  y2={y2}
                  className="stroke"
                  strokeWidth={active ? 2.5 : 1.5}
                  strokeDasharray={s.dashed ? '6 4' : undefined}
                  markerEnd="url(#arrow)"
                  style={active ? { strokeDasharray: s.dashed ? '6 4' : 600, strokeDashoffset: 0, animation: s.dashed ? undefined : 'draw 0.6s ease both' } : undefined}
                />
              ))}
              <text
                x={s.to === 'all' ? x1 + (x1 < W / 2 ? 14 : -14) : mid}
                y={(y1 + y2) / 2 - 8}
                textAnchor={s.to === 'all' ? (x1 < W / 2 ? 'start' : 'end') : 'middle'}
                className="mono"
                style={{ fontSize: 13, fontWeight: 700, paintOrder: 'stroke', stroke: 'var(--surface)', strokeWidth: 5 }}
              >
                {s.label}
              </text>
              {s.detail && (
                <text
                  x={s.to === 'all' ? x1 + (x1 < W / 2 ? 14 : -14) : mid}
                  y={(y1 + y2) / 2 + 22}
                  textAnchor={s.to === 'all' ? (x1 < W / 2 ? 'start' : 'end') : 'middle'}
                  className="mono muted"
                  style={{ fontSize: 11, paintOrder: 'stroke', stroke: 'var(--surface)', strokeWidth: 5 }}
                >
                  {s.detail}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      </div>
      {many && <PanHint />}
      <div className="callout" style={{ minHeight: 52 }} aria-live="polite">
        {current ? (
          <>
            <p style={{ fontWeight: 650 }}>
              Step {step} of {steps.length}: {current.title || current.label}
            </p>
            <p className="muted" style={{ marginTop: 4 }}>{current.note}</p>
          </>
        ) : (
          <p className="muted">Press Next to step through, or Play to watch the whole exchange.</p>
        )}
      </div>
      <div className="row">
        <button className="btn quiet" onClick={() => { setPlaying(false); setStep((s) => Math.max(0, s - 1)); }} disabled={step === 0}>
          ← Back
        </button>
        <button className="btn primary" onClick={() => { setPlaying(false); setStep((s) => Math.min(steps.length, s + 1)); }} disabled={step >= steps.length}>
          Next step →
        </button>
        <button className="btn quiet" onClick={() => { if (step >= steps.length) setStep(0); setPlaying((p) => !p); }}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button className="btn link" onClick={() => { setPlaying(false); setStep(0); }}>Reset</button>
      </div>
    </div>
  );
}

export function LabIntro({ children }) {
  return (
    <div className="section">
      <p className="lede">{children}</p>
    </div>
  );
}
