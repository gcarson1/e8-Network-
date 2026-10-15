import { useState } from 'react';
import { OrderBuilder, PanHint, Task, useKeys } from './kit.jsx';
import { Seg } from '../components/ui.jsx';
import { shuffle } from '../lib/util.js';

const LAYERS = [
  [7, 'Application', 'Network services for apps', 'Data'],
  [6, 'Presentation', 'Format, encrypt, compress', 'Data'],
  [5, 'Session', 'Open, manage, close sessions', 'Data'],
  [4, 'Transport', 'Ports, reliability, segmentation', 'Segment'],
  [3, 'Network', 'IP addressing and routing', 'Packet'],
  [2, 'Data Link', 'MAC addressing and switching', 'Frame'],
  [1, 'Physical', 'Signals, cables, connectors', 'Bits'],
];

// ───────── 1. Order ─────────
export function OsiOrder() {
  return (
    <>
      <OrderBuilder
        items={LAYERS.map((l) => l[1])}
        slotLabel={(i) => `L${7 - i}`}
        task="Tap the layers from the top of the stack (Layer 7) down to Layer 1."
        success='Top down: "All People Seem To Need Data Processing." Bottom up: "Please Do Not Throw Sausage Pizza Away."'
      />
      <div style={{ marginTop: 'var(--sp-8)' }}>
        <div className="eyebrow" style={{ marginBottom: 'var(--sp-2)' }}>Reference</div>
        <div className="scroll-x">
          <table className="table">
            <thead><tr><th>#</th><th>Layer</th><th>Job</th><th>PDU</th></tr></thead>
            <tbody>
              {LAYERS.map(([n, name, job, pdu]) => (
                <tr key={n}><td className="mono">{n}</td><td><b>{name}</b></td><td className="muted">{job}</td><td className="mono">{pdu}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ───────── 2. Sort onto layers ─────────
const ITEMS = [
  ['HTTP / HTTPS', 7], ['DNS', 7], ['SMTP', 7], ['SNMP', 7], ['FTP', 7], ['DHCP', 7],
  ['Encryption & compression', 6], ['Character encoding (ASCII, JPEG)', 6],
  ['Session setup & teardown', 5], ['RPC / NetBIOS session', 5],
  ['TCP', 4], ['UDP', 4], ['Port numbers', 4], ['Segments', 4],
  ['IP address', 3], ['Router', 3], ['ICMP (ping)', 3], ['Packets', 3], ['Layer 3 switch', 3],
  ['MAC address', 2], ['Switch', 2], ['Frames', 2], ['Bridge', 2], ['802.1Q VLAN tag', 2], ['Wireless access point', 2],
  ['Hub', 1], ['Repeater', 1], ['Twisted-pair cable', 1], ['Bits & signals', 1], ['Media converter', 1],
];
const ROUND = 10;

export function OsiSort() {
  const [round, setRound] = useState(() => shuffle(ITEMS).slice(0, ROUND));
  const [armed, setArmed] = useState(() => round[0]);
  const [placed, setPlaced] = useState({});
  const [mistakes, setMistakes] = useState(0);
  const [flash, setFlash] = useState(null);
  const pool = round.filter(([t]) => !(t in placed));
  const done = pool.length === 0;

  const drop = (layer) => {
    if (!armed) return;
    const ok = armed[1] === layer;
    setFlash({ layer, ok });
    setTimeout(() => setFlash(null), 500);
    if (ok) {
      setPlaced((p) => ({ ...p, [armed[0]]: layer }));
      const rest = pool.filter((x) => x[0] !== armed[0]);
      setArmed(rest[0] || null); // auto-select the next item
    } else setMistakes((m) => m + 1);
  };
  const reset = () => {
    const r = shuffle(ITEMS).slice(0, ROUND);
    setRound(r);
    setPlaced({});
    setArmed(r[0]);
    setMistakes(0);
  };

  useKeys((e) => {
    const n = Number(e.key);
    if (n >= 1 && n <= 7) drop(n);
  });

  return (
    <div>
      <Task>Pick an item, then tap its layer (or press 1–7). The next item is selected for you.</Task>
      {!done ? (
        <div className="pool" style={{ marginBottom: 'var(--sp-5)' }}>
          {pool.map((it) => (
            <button key={it[0]} className="chipbtn" aria-pressed={armed?.[0] === it[0]} onClick={() => setArmed(armed?.[0] === it[0] ? null : it)}>
              {it[0]}
            </button>
          ))}
        </div>
      ) : (
        <div className="follow good" style={{ marginTop: '0', marginBottom: 'var(--sp-5)' }}>
          <div className="follow-k">All {ROUND} placed</div>
          <p className="rest">{mistakes === 0 ? 'No mistakes.' : `${mistakes} wrong tap${mistakes === 1 ? '' : 's'} along the way.`}</p>
        </div>
      )}
      <div className="slots">
        {LAYERS.map(([n, name]) => {
          const here = Object.entries(placed).filter(([, l]) => l === n);
          const f = flash?.layer === n ? (flash.ok ? 'good' : 'bad') : '';
          return (
            <div
              key={n}
              className={`slot ${armed ? 'target' : ''} ${f}`}
              role="button"
              tabIndex={armed ? 0 : -1}
              onClick={() => drop(n)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), drop(n))}
              style={{ gridTemplateColumns: '40px 130px minmax(0, 1fr)' }}
              aria-label={`Layer ${n}, ${name}`}
            >
              <span className="n">L{n}</span>
              <b>{name}</b>
              <span className="hstack" style={{ gap: 'var(--sp-1h)', padding: 'var(--sp-1h) 0' }}>
                {here.map(([t]) => <span key={t} className="pill good">{t}</span>)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="qactions">
        <button className={`btn ${done ? 'primary' : ''}`} onClick={reset}>New round</button>
        <span className="tally">{Object.keys(placed).length}/{ROUND} placed · {mistakes} wrong</span>
      </div>
    </div>
  );
}

// ───────── 3. Encapsulation ─────────
// Each row is the PDU at that layer; header blocks prepend to the left.
const BLOCKS = {
  eth: { label: 'Ethernet', sub: 'to gateway MAC', x: 120, w: 110, fill: 'var(--ink)', ink: true },
  ip: { label: 'IP', sub: 'to 203.0.113.10', x: 230, w: 110, fill: 'var(--s2)', ink: true },
  tcp: { label: 'TCP', sub: ':51514 → :443', x: 340, w: 90, fill: 'var(--s3)' },
  data: { label: 'Data', sub: 'GET /index.html', x: 430, w: 150, fill: 'var(--soft)' },
  fcs: { label: 'FCS', sub: 'CRC', x: 580, w: 50, fill: 'var(--ink)', ink: true },
};
const ROWS = [
  { layer: 'L7–5', name: 'Application', pdu: 'Data', blocks: ['data'], note: 'The browser creates the request. Layers 7–5 handle format, encryption (TLS) and the session.' },
  { layer: 'L4', name: 'Transport', pdu: 'Segment', blocks: ['tcp', 'data'], note: 'TCP adds source and destination ports plus sequence numbers. Port 443 tells the server which service to hand this to.' },
  { layer: 'L3', name: 'Network', pdu: 'Packet', blocks: ['ip', 'tcp', 'data'], note: 'IP adds source and destination IP addresses so routers can forward it across networks.' },
  { layer: 'L2', name: 'Data Link', pdu: 'Frame', blocks: ['eth', 'ip', 'tcp', 'data', 'fcs'], note: 'Ethernet adds MAC addresses for the next hop (the default gateway) and an FCS trailer to detect errors.' },
  { layer: 'L1', name: 'Physical', pdu: 'Bits', blocks: [], note: 'The NIC turns the frame into signals: voltage on copper, light on fiber, or radio waves.' },
];
const PDUS = ['Data', 'Segment', 'Packet', 'Frame', 'Bits'];

export function Encapsulation() {
  const [dir, setDir] = useState('send');
  const [shown, setShown] = useState(1);
  const [guess, setGuess] = useState(null);
  const [score, setScore] = useState({ ok: 0, n: 0 });

  const order = dir === 'send' ? [0, 1, 2, 3, 4] : [4, 3, 2, 1, 0];
  const visible = order.slice(0, shown);
  const nextRow = shown < 5 ? ROWS[order[shown]] : null;
  const curRow = ROWS[order[shown - 1]];
  const askPdu = dir === 'send' && nextRow && guess == null;

  const reveal = () => {
    setGuess(null);
    setShown((s) => Math.min(5, s + 1));
  };
  const answer = (p) => {
    setGuess(p);
    setScore((s) => ({ ok: s.ok + (p === nextRow.pdu ? 1 : 0), n: s.n + 1 }));
  };
  const reset = (d = dir) => {
    setDir(d);
    setShown(1);
    setGuess(null);
    setScore({ ok: 0, n: 0 });
  };

  const rowH = 56;
  return (
    <div>
      <div className="spread" style={{ marginBottom: 'var(--sp-4)' }}>
        <Seg label="Direction" value={dir} onChange={reset} options={[
          { value: 'send', label: 'Sender: encapsulate' },
          { value: 'receive', label: 'Receiver: decapsulate' },
        ]} />
        {score.n > 0 && <span className="tally"><b>{score.ok}</b>/{score.n} PDUs named</span>}
      </div>
      <Task>
        {dir === 'send'
          ? 'Follow a web request down the stack. Name each PDU before it appears.'
          : 'The receiver strips one header per layer on the way up.'}
      </Task>
      <div className="diagram-scroll">
        <svg className="diagram" viewBox={`0 0 640 ${rowH * 5 + 10}`} role="img" aria-label="Encapsulation diagram">
          {ROWS.map((r, i) => {
            const y = 6 + i * rowH;
            const on = visible.includes(i);
            const current = order[shown - 1] === i;
            return (
              <g key={r.layer} style={{ opacity: on ? (current ? 1 : 0.45) : 1 }}>
                <text x={0} y={y + 20} style={{ fontSize: 13, fontWeight: 600 }} className={on ? '' : 'faint'}>{r.layer} {r.name}</text>
                <text x={0} y={y + 37} className={`mono ${on ? 'muted' : 'faint'}`} style={{ fontSize: 11 }}>{on ? r.pdu : '?'}</text>
                {!on && <rect x={120} y={y + 4} width={510} height={40} style={{ fill: 'none', stroke: 'var(--line)', strokeDasharray: '4 4' }} />}
                {on && r.blocks.map((k) => {
                  const b = BLOCKS[k];
                  return (
                    <g key={k}>
                      <rect x={b.x} y={y + 4} width={b.w - 2} height={40} style={{ fill: b.fill, stroke: k === 'data' ? 'var(--line-strong)' : 'none' }} />
                      <text x={b.x + 8} y={y + 20} style={{ fontSize: 12, fontWeight: 700, fill: b.ink ? 'var(--ink-text)' : 'var(--text)' }}>{b.label}</text>
                      {b.w > 60 && <text x={b.x + 8} y={y + 35} className="mono" style={{ fontSize: 9.5, fill: b.ink ? 'var(--ink-text)' : 'var(--muted)', opacity: 0.85 }}>{b.sub}</text>}
                    </g>
                  );
                })}
                {on && r.pdu === 'Bits' && (
                  <text x={120} y={y + 29} className="mono" style={{ fontSize: 13, letterSpacing: 1 }}>0110 1001 0100 1110 1100 0011 0101 1010 0110 0001 1011 0100 …</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <PanHint />

      {askPdu ? (
        <div style={{ marginTop: 'var(--sp-5)' }}>
          <p className="qstem" style={{ fontSize: 'var(--fs-18)' }}>At {nextRow.layer} {nextRow.name}, what is the PDU called?</p>
          <div className="opts two" style={{ marginTop: 'var(--sp-3)' }}>
            {PDUS.map((p, i) => (
              <button key={p} className="opt" onClick={() => answer(p)}>
                <span className="opt-k">{i + 1}</span><span className="opt-l">{p}</span>
              </button>
            ))}
          </div>
        </div>
      ) : guess != null ? (
        <div className={`follow ${guess === nextRow.pdu ? 'good' : 'bad'}`}>
          <div className="follow-k">{guess === nextRow.pdu ? 'Correct' : `It's a ${nextRow.pdu.toLowerCase()}`}</div>
          <p className="rest">{nextRow.note}</p>
        </div>
      ) : (
        <div className="follow">
          <div className="follow-k">{curRow.layer} {curRow.name} · {curRow.pdu}</div>
          <p className="rest">{dir === 'receive' && curRow.pdu !== 'Bits' ? `${curRow.note.split('.')[0]}. The receiver reads this layer, then strips it and passes the rest up.` : curRow.note}</p>
        </div>
      )}

      <div className="qactions">
        {shown < 5 && !askPdu && <button className="btn primary" onClick={reveal}>{guess != null ? 'Show it →' : 'Next layer →'}</button>}
        {shown >= 5 && <button className="btn primary" onClick={() => reset(dir === 'send' ? 'receive' : 'send')}>{dir === 'send' ? 'Now decapsulate →' : 'Encapsulate again'}</button>}
        <button className="tbtn" onClick={() => reset()}>Restart</button>
      </div>
    </div>
  );
}

