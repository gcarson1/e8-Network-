import { useState } from 'react';
import { MatchDrill, Task } from './kit.jsx';
import { Seg } from '../components/ui.jsx';
import { shuffle } from '../lib/util.js';

// Simplified front-view line drawings of each connector.
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinejoin: 'round' };
const F = { fill: 'currentColor' };

const DRAW = {
  RJ45: (
    <>
      <rect x="28" y="18" width="64" height="44" {...S} />
      {Array.from({ length: 8 }, (_, i) => <rect key={i} x={33 + i * 7.4} y="22" width="3.2" height="14" {...F} />)}
      <path d="M44 62 v14 h32 v-14" {...S} />
      <path d="M52 76 v8 M68 76 v8" {...S} />
    </>
  ),
  RJ11: (
    <>
      <rect x="38" y="20" width="44" height="40" {...S} />
      {Array.from({ length: 6 }, (_, i) => <rect key={i} x={43 + i * 6.2} y="24" width="2.6" height="12" style={{ fill: i === 0 || i === 5 ? 'none' : 'currentColor', stroke: 'currentColor', strokeWidth: 0.8 }} />)}
      <path d="M50 60 v12 h20 v-12" {...S} />
    </>
  ),
  LC: (
    <>
      {[30, 64].map((x) => (
        <g key={x}>
          <rect x={x} y="36" width="26" height="26" {...S} />
          <circle cx={x + 13} cy="49" r="4" {...S} />
          <path d={`M${x + 4} 36 L${x + 8} 22 L${x + 20} 22`} {...S} />
        </g>
      ))}
      <path d="M38 22 h44" {...S} strokeWidth="3" />
      <path d="M40 62 v14 h40 v-14" {...S} />
    </>
  ),
  SC: (
    <>
      <rect x="36" y="16" width="48" height="56" {...S} />
      <rect x="44" y="24" width="32" height="40" {...S} />
      <circle cx="60" cy="44" r="8" {...S} />
      <circle cx="60" cy="44" r="2.5" {...F} />
    </>
  ),
  ST: (
    <>
      <circle cx="60" cy="45" r="30" {...S} />
      {Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * Math.PI * 2;
        return <line key={i} x1={60 + 30 * Math.cos(a)} y1={45 + 30 * Math.sin(a)} x2={60 + 34 * Math.cos(a)} y2={45 + 34 * Math.sin(a)} stroke="currentColor" strokeWidth="1.6" />;
      })}
      <circle cx="60" cy="45" r="11" {...S} />
      <circle cx="60" cy="45" r="3" {...F} />
      <path d="M86 40 h10 v10 h-6" {...S} />
    </>
  ),
  MPO: (
    <>
      <rect x="14" y="28" width="92" height="34" {...S} />
      <rect x="22" y="36" width="76" height="18" {...S} />
      <circle cx="29" cy="45" r="3.5" {...S} />
      <circle cx="91" cy="45" r="3.5" {...S} />
      {Array.from({ length: 12 }, (_, i) => <circle key={i} cx={37 + i * 4.2} cy="45" r="1.4" {...F} />)}
    </>
  ),
  'F-type': (
    <>
      <path d="M60 13 L88 29 L88 61 L60 77 L32 61 L32 29 Z" {...S} />
      <circle cx="60" cy="45" r="19" {...S} />
      <circle cx="60" cy="45" r="11" style={{ fill: 'currentColor', opacity: 0.15 }} />
      <circle cx="60" cy="45" r="2.6" {...F} />
    </>
  ),
  BNC: (
    <>
      <circle cx="60" cy="45" r="26" {...S} />
      <rect x="27" y="41" width="8" height="8" {...F} />
      <rect x="85" y="41" width="8" height="8" {...F} />
      <circle cx="60" cy="45" r="15" {...S} />
      <circle cx="60" cy="45" r="8" style={{ fill: 'currentColor', opacity: 0.15 }} />
      <circle cx="60" cy="45" r="2.6" {...F} />
      <path d="M44 74 h32" {...S} />
    </>
  ),
  SFP: (
    <>
      <rect x="30" y="18" width="60" height="44" {...S} />
      <rect x="38" y="28" width="18" height="18" {...S} />
      <rect x="64" y="28" width="18" height="18" {...S} />
      <circle cx="47" cy="37" r="2.5" {...F} />
      <circle cx="73" cy="37" r="2.5" {...F} />
      <path d="M36 62 v14 h48 v-14" {...S} />
    </>
  ),
  QSFP: (
    <>
      <rect x="18" y="20" width="84" height="40" {...S} />
      <rect x="32" y="30" width="56" height="18" {...S} />
      {Array.from({ length: 8 }, (_, i) => <circle key={i} cx={42 + i * 5.2} cy="39" r="1.4" {...F} />)}
      <path d="M52 60 v18 h16 v-18" {...S} />
    </>
  ),
};

const CONNECTORS = [
  { name: 'RJ45', medium: 'Copper twisted pair', use: '8P8C plug for twisted-pair Ethernet (Cat5e/6/6a)' },
  { name: 'RJ11', medium: 'Copper twisted pair', use: 'Smaller 6-position plug for telephone lines and DSL' },
  { name: 'LC', medium: 'Fiber', use: 'Small form-factor latch fiber connector, usually duplex; the standard on SFPs' },
  { name: 'SC', medium: 'Fiber', use: 'Square push-pull fiber connector; common in PON/FTTH and older switches' },
  { name: 'ST', medium: 'Fiber', use: 'Round bayonet twist-lock fiber connector; legacy multimode runs' },
  { name: 'MPO', medium: 'Fiber', use: 'Multi-fiber (12/24) ribbon connector for 40/100G parallel optics' },
  { name: 'F-type', medium: 'Coax', use: 'Threaded coax connector for cable TV and cable modems (RG-6)' },
  { name: 'BNC', medium: 'Coax', use: 'Bayonet coax connector; legacy 10BASE2 Ethernet and CCTV/video' },
  { name: 'SFP', medium: 'Transceiver', use: 'Hot-swappable single-lane module (1G; SFP+ = 10G, SFP28 = 25G)' },
  { name: 'QSFP', medium: 'Transceiver', use: 'Quad-lane hot-swappable module (40G; QSFP28 = 100G)' },
];

const CABLES = [
  { name: 'Cat5e', spec: '1 Gbps up to 100 m' },
  { name: 'Cat6', spec: '1 Gbps at 100 m; 10 Gbps only up to ~55 m' },
  { name: 'Cat6a', spec: '10 Gbps up to 100 m' },
  { name: 'Cat7', spec: '10 Gbps up to 100 m, individually shielded pairs' },
  { name: 'Cat8', spec: '25/40 Gbps up to 30 m (data center)' },
  { name: 'Single-mode fiber (SMF)', spec: 'Tiny ~9 µm core, laser light, runs of many kilometers' },
  { name: 'Multimode fiber (MMF)', spec: '50/62.5 µm core, LED/VCSEL light, runs of a few hundred meters' },
  { name: 'Twinax (DAC)', spec: 'Short copper direct-attach cable between SFP+ ports in a rack' },
  { name: 'Coax RG-6', spec: 'Cable TV and cable broadband with F-type connectors' },
  { name: 'Plenum-rated cable', spec: 'Fire-retardant, low-smoke jacket required in air-handling spaces' },
  { name: 'STP', spec: 'Twisted pair with shielding to resist EMI near motors and lights' },
];

const STANDARDS = [
  { name: '1000BASE-T', spec: '1 Gbps over Cat5e or better copper, 100 m' },
  { name: '10GBASE-T', spec: '10 Gbps over Cat6a copper, 100 m' },
  { name: '1000BASE-SX', spec: '1 Gbps over multimode fiber, short wavelength' },
  { name: '1000BASE-LX', spec: '1 Gbps over single-mode fiber, long wavelength (km)' },
  { name: '10GBASE-SR', spec: '10 Gbps over multimode fiber, short range (~300–400 m)' },
  { name: '10GBASE-LR', spec: '10 Gbps over single-mode fiber, up to 10 km' },
  { name: '100BASE-TX', spec: '100 Mbps Fast Ethernet over Cat5 copper' },
];

const Pic = ({ name, size = 150 }) => (
  <svg viewBox="0 0 120 90" width={size} height={(size * 90) / 120} role="img" aria-label="Connector drawing" style={{ color: 'var(--text)', display: 'block' }}>
    {DRAW[name]}
  </svg>
);

export function Connectors() {
  const [quiz, setQuiz] = useState(false);
  return (
    <div>
      <div className="spread" style={{ marginBottom: 18 }}>
        <Seg label="Mode" value={quiz} onChange={setQuiz} options={[{ value: false, label: 'Learn' }, { value: true, label: 'Quiz me' }]} />
      </div>
      {quiz ? (
        <MatchDrill
          task="Name the connector from its front view."
          modes={[
            { label: 'Picture → name', items: CONNECTORS, prompt: (c) => <Pic name={c.name} />, answer: (c) => c.name, note: (c) => c.use },
            { label: 'Use → name', items: CONNECTORS, prompt: (c) => c.use, answer: (c) => c.name, small: true },
          ]}
        />
      ) : (
        <>
          <div className="rows">
            {CONNECTORS.map((c) => (
              <div key={c.name} className="conn">
                <Pic name={c.name} size={84} />
                <div>
                  <div className="hstack" style={{ gap: 8 }}><b>{c.name}</b><span className="pill">{c.medium}</span></div>
                  <p className="muted small" style={{ marginTop: 3 }}>{c.use}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="faint small" style={{ marginTop: 10 }}>Simplified front views, not to scale.</p>
        </>
      )}
    </div>
  );
}

export const CableSpecs = () => (
  <MatchDrill
    task="Match each cable to its speed and distance."
    modes={[
      { label: 'Cable → spec', items: CABLES, prompt: (c) => c.name, answer: (c) => c.spec },
      { label: 'Spec → cable', items: CABLES, prompt: (c) => c.spec, answer: (c) => c.name, small: true },
    ]}
  />
);

export const EthStandards = () => (
  <MatchDrill
    task="Decode the name: speed, BASE (baseband), medium. T = twisted pair, SR/SX = short-reach multimode, LR/LX = long-reach single-mode."
    modes={[
      { label: 'Standard → meaning', items: STANDARDS, prompt: (c) => <span className="mono">{c.name}</span>, answer: (c) => c.spec },
      { label: 'Meaning → standard', items: STANDARDS, prompt: (c) => c.spec, answer: (c) => c.name, small: true },
    ]}
  />
);

// ───────── RJ45 wiring ─────────
const WIRE_COLORS = { orange: '#e07b24', green: '#3c8d50', blue: '#2e68c0', brown: '#7a4b2a' };
const T568B = ['White/orange', 'Orange', 'White/green', 'Blue', 'White/blue', 'Green', 'White/brown', 'Brown'];
const T568A = ['White/green', 'Green', 'White/orange', 'Blue', 'White/blue', 'Orange', 'White/brown', 'Brown'];
const PIN_ROLE = ['TX+', 'TX−', 'RX+', '', '', 'RX−', '', ''];

const TASKS = [
  { std: 'B', title: 'Wire this plug to T568B', note: 'T568B is the most common standard in the US.' },
  { std: 'A', title: 'Wire this plug to T568A', note: 'T568A swaps the orange and green pairs. Required in some government installs.' },
  { std: 'B', title: 'Straight-through cable: end 1 is T568B. Wire end 2.', note: 'Straight-through = the same standard on both ends. PC to switch.' },
  { std: 'A', title: 'Crossover cable: end 1 is T568B. Wire end 2.', note: 'Crossover = T568A on one end and T568B on the other, so pins 1/2 (send) meet 3/6 (receive). Auto-MDIX makes this rare today.' },
];

function Wire({ name, w = 26, h = 54 }) {
  const color = WIRE_COLORS[name.replace('White/', '').toLowerCase()];
  const striped = name.startsWith('White');
  const id = `stripe-${name.replace('/', '')}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" style={{ display: 'block' }}>
      {striped && (
        <defs>
          <pattern id={id} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <rect width="8" height="8" fill="#f4f3ef" />
            <rect width="3.5" height="8" fill={color} />
          </pattern>
        </defs>
      )}
      <rect x="1" y="1" width={w - 2} height={h - 2} fill={striped ? `url(#${id})` : color} stroke="var(--line-strong)" />
    </svg>
  );
}

export function WireRj45() {
  const [t, setT] = useState(0);
  const task = TASKS[t];
  const target = task.std === 'B' ? T568B : T568A;
  const [pins, setPins] = useState([]);
  const [pool, setPool] = useState(() => shuffle(T568B));
  const [checked, setChecked] = useState(false);

  const place = (w) => {
    if (checked || pins.length >= 8) return;
    setPins((p) => [...p, w]);
  };
  const removeAt = (i) => {
    if (checked) return;
    setPins((p) => p.filter((_, j) => j !== i));
  };
  const reset = (nt = t) => {
    setT(nt);
    setPins([]);
    setPool(shuffle(T568B));
    setChecked(false);
  };
  const wrong = checked ? pins.filter((w, i) => w !== target[i]).length : 0;
  const remaining = pool.filter((w) => !pins.includes(w));

  return (
    <div>
      <div className="spread" style={{ marginBottom: 8 }}>
        <span className="eyebrow">Task {t + 1} of {TASKS.length}</span>
        <div className="hstack" style={{ gap: 2, marginRight: -8 }}>
          {TASKS.map((_, i) => (
            <button key={i} className={`tbtn ${i === t ? 'on' : ''}`} onClick={() => reset(i)}>{i + 1}</button>
          ))}
        </div>
      </div>
      <p className="qstem" style={{ marginBottom: 6 }}>{task.title}</p>
      <Task>Tap wires in order for pins 1 → 8 (clip facing down, pin 1 on the left). Tap a pin to clear it.</Task>

      <div className="plug" role="group" aria-label="RJ45 pins">
        {Array.from({ length: 8 }, (_, i) => {
          const w = pins[i];
          const state = checked && w ? (w === target[i] ? 'good' : 'bad') : '';
          return (
            <button key={i} className={`pin ${state}`} onClick={() => w && removeAt(i)} aria-label={`Pin ${i + 1}${w ? `: ${w}` : ', empty'}`}>
              <span className="pin-n mono">{i + 1}</span>
              {w ? <Wire name={w} /> : <span className="pin-empty" />}
              <span className={`pin-mk mono ${state === 'good' ? 'good-text' : state === 'bad' ? 'bad-text' : ''}`}>{state === 'good' ? '✓' : state === 'bad' ? '✕' : PIN_ROLE[i] && checked ? PIN_ROLE[i] : ''}</span>
            </button>
          );
        })}
      </div>

      {remaining.length > 0 && !checked && (
        <div className="pool" style={{ marginTop: 16 }}>
          {remaining.map((w) => (
            <button key={w} className="chipbtn wirebtn" onClick={() => place(w)}>
              <Wire name={w} w={14} h={22} />
              {w}
            </button>
          ))}
        </div>
      )}

      {checked && (
        <div className={`follow ${wrong ? 'bad' : 'good'}`}>
          <div className="follow-k">{wrong ? `${wrong} pin${wrong === 1 ? '' : 's'} wrong` : `Correct: T568${task.std}`}</div>
          <p className="rest">
            {wrong ? `T568${task.std}: ${target.join(', ')}.` : task.note} Pins 1/2 send and 3/6 receive on 10/100 Ethernet; gigabit uses all four pairs.
          </p>
        </div>
      )}
      <div className="qactions">
        {!checked ? (
          <button className="btn primary" disabled={pins.length < 8} onClick={() => setChecked(true)}>Check wiring</button>
        ) : wrong ? (
          <button className="btn primary" onClick={() => { setPins((p) => p.slice(0, p.findIndex((w, i) => w !== target[i]))); setChecked(false); }}>Fix from the first wrong pin</button>
        ) : t < TASKS.length - 1 ? (
          <button className="btn primary" onClick={() => reset(t + 1)}>Next task →</button>
        ) : (
          <button className="btn primary" onClick={() => reset(0)}>Start over</button>
        )}
        {checked && wrong > 0 && t < TASKS.length - 1 && <button className="tbtn" onClick={() => reset(t + 1)}>Skip to next task</button>}
        {!checked && <button className="tbtn" onClick={() => reset()}>Clear</button>}
        {!(checked && !wrong) && <button className="tbtn" onClick={() => { setPins(target.slice()); setChecked(true); }}>Show answer</button>}
      </div>
    </div>
  );
}
