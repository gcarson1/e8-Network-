import { useState } from 'react';
import { OrderBuilder, TabbedLab } from './kit.jsx';
import { shuffle } from '../lib/util.js';

const LAYERS = [
  [7, 'Application', 'Network services for apps', 'Data'],
  [6, 'Presentation', 'Formatting, encryption, compression', 'Data'],
  [5, 'Session', 'Opens, manages, closes sessions', 'Data'],
  [4, 'Transport', 'End-to-end delivery, ports, reliability', 'Segment / datagram'],
  [3, 'Network', 'Logical addressing and routing', 'Packet'],
  [2, 'Data Link', 'MAC addressing, framing, switching', 'Frame'],
  [1, 'Physical', 'Signals, cables, connectors', 'Bits'],
];

// Items with an unambiguous home layer in CompTIA's model.
const ITEMS = [
  ['HTTP / HTTPS', 7], ['DNS', 7], ['SMTP', 7], ['SNMP', 7], ['FTP', 7], ['DHCP', 7],
  ['Data encryption & compression', 6], ['Character encoding (ASCII, JPEG)', 6],
  ['Session setup & teardown', 5], ['RPC / NetBIOS session', 5],
  ['TCP', 4], ['UDP', 4], ['Port numbers', 4], ['Segments', 4],
  ['IP address', 3], ['Router', 3], ['ICMP (ping)', 3], ['Packets', 3], ['Layer 3 switch', 3],
  ['MAC address', 2], ['Switch', 2], ['Frames', 2], ['Bridge', 2], ['802.1Q VLAN tag', 2], ['Wireless access point', 2],
  ['Hub', 1], ['Repeater', 1], ['Twisted-pair cable', 1], ['Bits & signals', 1], ['Media converter', 1],
];

export default function Osi() {
  return (
    <TabbedLab
      tabs={[
        {
          value: 'stack',
          label: '1 · Build the stack',
          render: () => (
            <>
              <OrderBuilder
                items={LAYERS.map((l) => l[1])}
                slotLabel={(i) => `L${7 - i}`}
                prompt="Tap the layers in order from the top of the stack (Layer 7) down to Layer 1."
                success='Correct! Top to bottom: "All People Seem To Need Data Processing." Bottom up: "Please Do Not Throw Sausage Pizza Away."'
              />
              <LayerReference />
            </>
          ),
        },
        { value: 'match', label: '2 · Match to layers', render: () => <LayerMatch /> },
      ]}
    />
  );
}

function LayerReference() {
  return (
    <div className="section stack">
      <div className="eyebrow">Reference</div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>#</th><th>Layer</th><th>Job</th><th>PDU</th></tr>
          </thead>
          <tbody>
            {LAYERS.map(([n, name, job, pdu]) => (
              <tr key={n}>
                <td className="mono">{n}</td>
                <td style={{ fontWeight: 600 }}>{name}</td>
                <td className="muted">{job}</td>
                <td className="mono">{pdu}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function newRound() {
  return shuffle(ITEMS).slice(0, 12);
}

function LayerMatch() {
  const [round, setRound] = useState(newRound);
  const [armed, setArmed] = useState(null);
  const [placed, setPlaced] = useState({}); // item -> layer
  const [mistakes, setMistakes] = useState(0);
  const [flash, setFlash] = useState(null); // { layer, ok }

  const pool = round.filter(([t]) => !(t in placed));
  const done = pool.length === 0;

  const drop = (layer) => {
    if (!armed) return;
    const ok = armed[1] === layer;
    setFlash({ layer, ok });
    setTimeout(() => setFlash(null), 450);
    if (ok) {
      setPlaced((p) => ({ ...p, [armed[0]]: layer }));
      setArmed(null);
    } else setMistakes((m) => m + 1);
  };

  return (
    <div className="section stack-lg">
      <p className="muted">
        Tap a protocol, device or PDU, then tap the layer it belongs to. A wrong layer flashes red and the item stays selected.
      </p>
      {!done ? (
        <div className="pool" aria-label="Items to place">
          {pool.map((it) => (
            <button key={it[0]} className={armed?.[0] === it[0] ? 'armed' : ''} onClick={() => setArmed(armed?.[0] === it[0] ? null : it)} aria-pressed={armed?.[0] === it[0]}>
              {it[0]}
            </button>
          ))}
        </div>
      ) : (
        <div className="callout ok">
          <p className="ok-text" style={{ fontWeight: 650 }}>
            All 12 placed with {mistakes === 0 ? 'no mistakes' : `${mistakes} mistake${mistakes === 1 ? '' : 's'}`}.
          </p>
        </div>
      )}
      <div className="order-slots">
        {LAYERS.map(([n, name]) => {
          const here = Object.entries(placed).filter(([, l]) => l === n);
          const f = flash?.layer === n ? (flash.ok ? 'ok' : 'bad') : '';
          return (
            <div
              key={n}
              className={`slot ${f}`}
              role="button"
              tabIndex={armed ? 0 : -1}
              onClick={() => drop(n)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), drop(n))}
              style={{ cursor: armed ? 'pointer' : 'default', gridTemplateColumns: '44px 140px minmax(0,1fr)' }}
              aria-label={`Layer ${n} ${name}`}
            >
              <span className="n" style={{ paddingLeft: 10 }}>L{n}</span>
              <span style={{ fontWeight: 650 }}>{name}</span>
              <span className="row" style={{ gap: 6 }}>
                {here.map(([t]) => (
                  <span key={t} className="pill ok">{t}</span>
                ))}
              </span>
            </div>
          );
        })}
      </div>
      <div className="row">
        <button
          className={`btn ${done ? 'primary' : 'quiet'}`}
          onClick={() => {
            setRound(newRound());
            setPlaced({});
            setArmed(null);
            setMistakes(0);
          }}
        >
          New round
        </button>
        <span className="mono muted" style={{ fontSize: 13 }}>
          {Object.keys(placed).length}/12 placed · {mistakes} mistakes
        </span>
      </div>
    </div>
  );
}
