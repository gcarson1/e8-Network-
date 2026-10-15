// Shared lab building blocks: a rapid-fire match drill, an ordering
// exercise, and a ladder-diagram animator with an optional predict mode.
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

export const PanHint = () => <p className="pan-hint">Swipe sideways to see the whole diagram.</p>;

export function Task({ children }) {
  return <p className="task">{children}</p>;
}

/** Global key handler that ignores typing in fields and open dialogs. */
export function useKeys(handler) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const h = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.querySelector('.modal') || /input|textarea|select/i.test(e.target.tagName)) return;
      ref.current(e);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
}

// ---------------------------------------------------------------------------
// MatchDrill
// modes: [{ label, items, prompt: item => node, answer: item => string,
//           note?: item => string, small?: bool, pool?: string[] }]
// ---------------------------------------------------------------------------
export function MatchDrill({ modes, task }) {
  const [modeIdx, setModeIdx] = useState(0);
  const [sprint, setSprint] = useState(false);
  return (
    <div>
      {task && <Task>{task}</Task>}
      <div className="spread" style={{ marginBottom: 'var(--sp-6)' }}>
        {modes.length > 1 ? (
          <Seg label="Direction" value={modeIdx} onChange={setModeIdx} options={modes.map((m, i) => ({ value: i, label: m.label }))} />
        ) : (
          <span />
        )}
        <button className={`tbtn ${sprint ? 'on' : ''}`} onClick={() => setSprint((x) => !x)} aria-pressed={sprint} style={{ marginRight: 'calc(var(--sp-2) * -1)' }}>
          {sprint ? '60-second sprint: on' : '60-second sprint'}
        </button>
      </div>
      <DrillRun key={`${modeIdx}-${sprint}`} mode={modes[modeIdx]} sprint={sprint} />
    </div>
  );
}

function buildOptions(mode, item) {
  const right = mode.answer(item);
  const pool = [...new Set(mode.pool || mode.items.map(mode.answer))].filter((a) => a !== right);
  return shuffle([right, ...shuffle(pool).slice(0, 3)]);
}

function DrillRun({ mode, sprint }) {
  const [queue, setQueue] = useState(() => shuffle(mode.items));
  const [pos, setPos] = useState(0);
  const item = queue[pos % queue.length];
  const [options, setOptions] = useState(() => buildOptions(mode, queue[0]));
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
    setOptions(buildOptions(mode, q[nextPos % q.length]));
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
      // Bring the missed item back a few cards later.
      setQueue((q) => {
        const copy = q.slice();
        copy.splice(Math.min(copy.length, (pos % q.length) + 4), 0, item);
        return copy;
      });
    }
    if (ok || sprint) timer.current = setTimeout(advance, ok ? 550 : 1100);
  };

  useKeys((e) => {
    const n = Number(e.key);
    if (n >= 1 && n <= options.length) pick(options[n - 1]);
    else if (e.key === 'Enter' && picked && picked !== right && !sprint) advance();
  });

  const restart = () => {
    const q = shuffle(mode.items);
    setQueue(q);
    setPos(0);
    setOptions(buildOptions(mode, q[0]));
    setPicked(null);
    setScore({ right: 0, wrong: 0, streak: 0, best: 0 });
    setDeadline(null);
  };

  if (done) {
    return (
      <div className="stack-lg">
        <div className="score">
          <div className="stat"><div className="v">{score.right}</div><div className="k">Correct in 60 s</div></div>
          <div className="stat"><div className="v sm">{score.wrong}</div><div className="k">Missed</div></div>
          <div className="stat"><div className="v sm">{score.best}</div><div className="k">Best streak</div></div>
        </div>
        <button className="btn primary" onClick={restart}>Go again</button>
      </div>
    );
  }

  return (
    <div>
      <div className="spread" style={{ marginBottom: 'var(--sp-3)' }}>
        <span className="tally">
          <b className="good-text">{score.right}</b> right · <b className="bad-text">{score.wrong}</b> missed · streak <b>{score.streak}</b>
        </span>
        {sprint && <span className="tally"><b>{remaining}s</b>{deadline ? '' : ' · starts on your first answer'}</span>}
      </div>
      <div className={`drill-q ${mode.small ? 'sm' : ''}`} aria-live="polite">{mode.prompt(item)}</div>
      <div className="opts two">
        {options.map((o, i) => {
          let cls = '';
          if (picked) {
            if (o === right) cls = 'good';
            else if (o === picked) cls = 'bad';
          }
          return (
            <button key={o} className={`opt ${cls}`} onClick={() => pick(o)} disabled={!!picked}>
              <span className="opt-k">{i + 1}</span>
              <span className="opt-l">{o}</span>
            </button>
          );
        })}
      </div>
      {picked && (picked !== right || mode.note) && (
        <div className={`follow ${picked === right ? 'good' : 'bad'}`}>
          <div className="follow-k">{picked === right ? 'Correct' : `Answer: ${right}`}</div>
          {mode.note && <p className="rest">{mode.note(item)}</p>}
        </div>
      )}
      {picked && picked !== right && !sprint && (
        <div className="qactions">
          <button className="btn primary" onClick={advance}>Next →</button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// OrderBuilder: tap items in order, then check.
// ---------------------------------------------------------------------------
export function OrderBuilder({ items, slotLabel = (i) => i + 1, task, success }) {
  const [placed, setPlaced] = useState([]);
  const [checked, setChecked] = useState(false);
  const [pool, setPool] = useState(() => shuffle(items));
  const remaining = pool.filter((x) => !placed.includes(x));
  const allRight = checked && placed.every((x, i) => x === items[i]);
  const wrong = checked ? placed.filter((x, i) => x !== items[i]).length : 0;

  const reset = () => {
    setPlaced([]);
    setChecked(false);
    setPool(shuffle(items));
  };

  return (
    <div>
      {task && <Task>{task}</Task>}
      <div className="slots">
        {items.map((_, i) => {
          const val = placed[i];
          const state = checked && val ? (val === items[i] ? 'good' : 'bad') : '';
          return (
            <div key={i} className={`slot ${val ? 'filled' : ''} ${state}`}>
              <span className="n">{slotLabel(i)}</span>
              {val ? (
                <button className="item" onClick={() => { setPlaced((p) => p.filter((x) => x !== val)); setChecked(false); }} title="Tap to remove">
                  {val}
                </button>
              ) : (
                <span className="ph">{i === placed.length ? 'next' : ''}</span>
              )}
              <span className="mk mono">{state === 'good' ? '✓' : state === 'bad' ? '✕' : ''}</span>
            </div>
          );
        })}
      </div>
      {remaining.length > 0 && (
        <div className="pool" style={{ marginTop: 'var(--sp-4)' }}>
          {remaining.map((x) => (
            <button key={x} className="chipbtn" onClick={() => { setPlaced((p) => [...p, x]); setChecked(false); }}>
              {x}
            </button>
          ))}
        </div>
      )}
      {checked && (
        <div className={`follow ${allRight ? 'good' : 'bad'}`}>
          <div className="follow-k">{allRight ? 'Correct' : `${wrong} out of place`}</div>
          <p className="rest">{allRight ? success : 'Tap a wrong item to send it back, then check again.'}</p>
        </div>
      )}
      <div className="qactions">
        <button className="btn primary" disabled={placed.length !== items.length || (checked && allRight)} onClick={() => setChecked(true)}>Check</button>
        <button className="tbtn" onClick={reset}>Reset</button>
        <button className="tbtn" onClick={() => { setPlaced(items.slice()); setChecked(true); }}>Show answer</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SequenceAnimator: ladder diagram, one arrow per step.
// steps: [{ from, to, label, detail, title, note, states, dashed,
//           ask?: { q, options, answer } }]
// In predict mode, a step with `ask` is quizzed before its arrow appears.
// ---------------------------------------------------------------------------
export function SequenceAnimator({ lanes, steps, initialStates, caption, task }) {
  const canPredict = steps.some((s) => s.ask);
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState(canPredict ? 'predict' : 'watch');
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState({ ok: 0, n: 0 });
  const narrow = useNarrow();

  const nextStep = steps[step];
  const asking = mode === 'predict' && nextStep?.ask && picked == null;

  const advance = () => {
    setPicked(null);
    setStep((s) => Math.min(steps.length, s + 1));
  };
  const answer = (opt) => {
    if (picked != null) return;
    setPicked(opt);
    setScore((s) => ({ ok: s.ok + (opt === nextStep.ask.answer ? 1 : 0), n: s.n + 1 }));
  };
  const reset = () => {
    setStep(0);
    setPicked(null);
    setScore({ ok: 0, n: 0 });
  };
  const back = () => {
    setPicked(null);
    setStep((s) => Math.max(0, s - 1));
  };

  useKeys((e) => {
    if (asking) {
      const n = Number(e.key);
      if (n >= 1 && n <= nextStep.ask.options.length) answer(nextStep.ask.options[n - 1]);
    } else if ((e.key === 'Enter' || e.key === 'ArrowRight') && step < steps.length) advance();
    else if (e.key === 'ArrowLeft' && step > 0) back();
  });

  const many = lanes.length > 2;
  const W = narrow && !many ? 380 : 640;
  const pad = many ? 64 : narrow ? 64 : 120;
  const laneX = (i) => pad + (i * (W - pad * 2)) / Math.max(1, lanes.length - 1);
  const top = 70;
  const rowH = 60;
  const H = top + steps.length * rowH + 20;
  const states = useMemo(() => {
    const cur = initialStates ? [...initialStates] : lanes.map(() => '');
    for (let i = 0; i < step; i++) (steps[i].states || []).forEach((s, j) => { if (s) cur[j] = s; });
    return cur;
  }, [step, steps, initialStates, lanes]);
  const current = steps[step - 1];

  return (
    <div>
      {task && <Task>{task}</Task>}
      {canPredict && (
        <div className="spread" style={{ marginBottom: 'var(--sp-4)' }}>
          <Seg
            label="Mode"
            value={mode}
            onChange={(m) => { setMode(m); reset(); }}
            options={[
              { value: 'predict', label: 'Predict each step' },
              { value: 'watch', label: 'Just watch' },
            ]}
          />
          {mode === 'predict' && score.n > 0 && <span className="tally"><b>{score.ok}</b>/{score.n} predicted</span>}
        </div>
      )}

      <div className={`diagram-scroll ${many ? '' : 'fit'}`}>
        <svg className="diagram" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={caption || 'Sequence diagram'}>
          <defs>
            <marker id="seq-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" style={{ fill: 'var(--text)' }} />
            </marker>
          </defs>
          {lanes.map((l, i) => (
            <g key={l}>
              <text x={laneX(i)} y={22} textAnchor="middle" style={{ fontWeight: 600, fontSize: 14 }}>{l}</text>
              {initialStates && (
                <text x={laneX(i)} y={41} textAnchor="middle" className="mono muted" style={{ fontSize: 11 }}>{states[i]}</text>
              )}
              <line x1={laneX(i)} y1={top - 14} x2={laneX(i)} y2={H - 6} className="wire soft" strokeWidth="1.5" />
            </g>
          ))}
          {steps.slice(0, step).map((s, i) => {
            const y1 = top + i * rowH;
            const y2 = y1 + rowH - 18;
            const x1 = laneX(s.from);
            const x2 = laneX(s.to);
            const active = i === step - 1;
            return (
              <g key={i} style={{ opacity: active ? 1 : 0.4 }}>
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  className="wire"
                  strokeWidth={active ? 2.2 : 1.4}
                  strokeDasharray={s.dashed ? '6 4' : active ? 600 : undefined}
                  markerEnd="url(#seq-arrow)"
                  style={active && !s.dashed ? { animation: 'draw 0.6s ease both' } : undefined}
                />
                <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 7} textAnchor="middle" className="mono halo" style={{ fontSize: 12.5, fontWeight: 700 }}>{s.label}</text>
                {s.detail && <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 + 20} textAnchor="middle" className="mono muted halo" style={{ fontSize: 10.5 }}>{s.detail}</text>}
              </g>
            );
          })}
        </svg>
      </div>
      {many && <PanHint />}

      {asking ? (
        <div style={{ marginTop: 'var(--sp-5)' }}>
          <p className="qstem" style={{ fontSize: 'var(--fs-18)' }}>{nextStep.ask.q}</p>
          <div className="opts two" style={{ marginTop: 'var(--sp-3)' }}>
            {nextStep.ask.options.map((o, i) => (
              <button key={o} className="opt" onClick={() => answer(o)}>
                <span className="opt-k">{i + 1}</span>
                <span className="opt-l">{o}</span>
              </button>
            ))}
          </div>
        </div>
      ) : picked != null ? (
        <div className={`follow ${picked === nextStep.ask.answer ? 'good' : 'bad'}`} style={{ marginTop: 'var(--sp-5)' }}>
          <div className="follow-k">{picked === nextStep.ask.answer ? 'Correct' : `Answer: ${nextStep.ask.answer}`}</div>
          <p className="rest">{nextStep.note}</p>
        </div>
      ) : (
        <div className="follow" style={{ marginTop: 'var(--sp-5)', minHeight: '3rem' }} aria-live="polite">
          {current ? (
            <>
              <div className="follow-k">Step {step} of {steps.length} · {current.title || current.label}</div>
              <p className="rest">{current.note}</p>
            </>
          ) : (
            <p className="rest" style={{ marginTop: '0' }}>{mode === 'predict' ? 'Answer each question to reveal the next message.' : 'Step through the exchange one message at a time.'}</p>
          )}
        </div>
      )}

      <div className="qactions">
        {!asking && step < steps.length && (
          <button className="btn primary" onClick={advance}>
            {picked != null ? 'Show it →' : step === 0 ? 'Start' : 'Next step →'}
          </button>
        )}
        {step >= steps.length && <button className="btn primary" onClick={reset}>Run it again</button>}
        <button className="tbtn" onClick={back} disabled={step === 0}>← Back</button>
        {step > 0 && step < steps.length && <button className="tbtn" onClick={reset}>Restart</button>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CaseRunner: a report + command/log output, pick the diagnosis.
// cases: [{ report, output: [lines], options, answer, fix }]
// Output lines starting with "> " are commands; **text** marks a clue.
// ---------------------------------------------------------------------------
const promptFor = (cmd) => (/^show /.test(cmd) ? 'Switch#' : /^(ipconfig|arp|nslookup|ping|tracert|netstat)/.test(cmd) ? 'C:\\>' : '$');

function Console({ lines }) {
  return (
    <pre className="console" aria-label="Command output">
      {lines.map((l, i) => {
        const isCmd = l.startsWith('> ');
        const parts = l.split('**');
        return (
          <span key={i} className={isCmd ? 'cmd' : 'out'}>
            {isCmd ? `${promptFor(l.slice(2))} ${l.slice(2)}` : parts.map((p, j) => (j % 2 ? <span key={j} className="hl">{p}</span> : p))}
            {'\n'}
          </span>
        );
      })}
    </pre>
  );
}

export function CaseRunner({ cases, unit = 'Case', question, scoreLabel = 'correct' }) {
  const [order, setOrder] = useState(() => shuffle(cases));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [opts, setOpts] = useState(() => shuffle(order[0].options));
  const [tally, setTally] = useState({ ok: 0, n: 0 });
  const [clues, setClues] = useState(false);
  const c = order[i % order.length];

  const choose = (o) => {
    if (picked) return;
    setPicked(o);
    setTally((t) => ({ ok: t.ok + (o === c.answer ? 1 : 0), n: t.n + 1 }));
  };
  const next = () => {
    let ord = order;
    if ((i + 1) % order.length === 0) {
      ord = shuffle(cases);
      setOrder(ord);
    }
    setI((x) => x + 1);
    setOpts(shuffle(ord[(i + 1) % ord.length].options));
    setPicked(null);
  };
  useKeys((e) => {
    const n = Number(e.key);
    if (!picked && n >= 1 && n <= opts.length) choose(opts[n - 1]);
    else if (picked && e.key === 'Enter') next();
  });

  // Hide the highlight until the user asks for clues or answers.
  const lines = clues || picked ? c.output : c.output.map((l) => l.replace(/\*\*/g, ''));

  return (
    <div>
      <div className="spread" style={{ marginBottom: 'var(--sp-2)' }}>
        <span className="eyebrow">{unit} {(i % order.length) + 1} of {order.length}</span>
        <span className="tally"><b>{tally.ok}</b>/{tally.n} {scoreLabel}</span>
      </div>
      <p className="qstem" style={{ marginBottom: 'var(--sp-4)' }}>{c.report}</p>
      <Console lines={lines} />
      <div className="spread" style={{ marginTop: 'var(--sp-4)' }}>
        <span className="eyebrow">{question}</span>
        {!picked && <button className="tbtn" onClick={() => setClues((x) => !x)} style={{ marginRight: 'calc(var(--sp-2) * -1)' }}>{clues ? 'Hide clues' : 'Highlight clues'}</button>}
      </div>
      <div className="opts two" style={{ marginTop: 'var(--sp-2)' }}>
        {opts.map((o, k) => {
          let cls = '';
          if (picked) cls = o === c.answer ? 'good' : o === picked ? 'bad' : '';
          return (
            <button key={o} className={`opt ${cls}`} onClick={() => choose(o)} disabled={!!picked}>
              <span className="opt-k">{k + 1}</span>
              <span className="opt-l">{o}</span>
            </button>
          );
        })}
      </div>
      {picked && (
        <div className={`follow ${picked === c.answer ? 'good' : 'bad'}`}>
          <div className="follow-k">{picked === c.answer ? 'Correct' : `It's: ${c.answer}`}</div>
          <p className="rest">{c.fix}</p>
        </div>
      )}
      {picked && (
        <div className="qactions">
          <button className="btn primary" onClick={next}>Next {unit.toLowerCase()} →</button>
        </div>
      )}
    </div>
  );
}
