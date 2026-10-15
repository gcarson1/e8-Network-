import { useState } from 'react';
import { PanHint } from './kit.jsx';
import { Seg } from '../components/ui.jsx';

const VLANS = {
  10: { name: 'Sales', style: 'solid' },
  20: { name: 'Engineering', style: 'hatch' },
  30: { name: 'Guest', style: 'dots' },
};
const ORDER = [10, 20, 30];
const N = 8;
const pcX = (i) => 52 + i * 76.5;
const ipOf = (i, v) => `10.10.${v}.${11 + i}`;

function fillFor(v) {
  const s = VLANS[v].style;
  return s === 'solid' ? 'var(--fill)' : s === 'hatch' ? 'url(#vlan-hatch)' : 'url(#vlan-dots)';
}

export default function Vlan() {
  const [vlan, setVlan] = useState([10, 10, 20, 20, 10, 30, 20, 30]);
  const [mode, setMode] = useState('assign');
  const [router, setRouter] = useState(true);
  const [src, setSrc] = useState(null);
  const [dst, setDst] = useState(null);

  const click = (i) => {
    if (mode === 'assign') {
      setVlan((v) => v.map((x, j) => (j === i ? ORDER[(ORDER.indexOf(x) + 1) % ORDER.length] : x)));
      return;
    }
    if (mode === 'broadcast') { setSrc(i); setDst(null); return; }
    if (src == null || dst != null) { setSrc(i); setDst(null); }
    else if (i !== src) setDst(i);
  };
  const changeMode = (m) => { setMode(m); setSrc(null); setDst(null); };

  // Outcome for highlighting
  let lit = new Set();
  let bad = new Set();
  let trunk = '';
  let message = null;
  if (mode === 'broadcast' && src != null) {
    const recv = vlan.map((v, j) => (j !== src && v === vlan[src] ? j : -1)).filter((j) => j >= 0);
    lit = new Set([src, ...recv]);
    message = {
      ok: true,
      text: `Broadcast from PC${src + 1} (VLAN ${vlan[src]}) reached ${recv.length ? recv.map((j) => `PC${j + 1}`).join(', ') : 'no other hosts'}. Hosts in other VLANs never see it, because each VLAN is its own broadcast domain.${router ? ' The router does not forward broadcasts either.' : ''}`,
    };
  }
  if (mode === 'ping' && src != null && dst != null) {
    const same = vlan[src] === vlan[dst];
    if (same) {
      lit = new Set([src, dst]);
      message = { ok: true, text: `PC${src + 1} → PC${dst + 1}: same VLAN (${vlan[src]}), same subnet. The switch forwards the frame at Layer 2 using its MAC address table. No router needed.` };
    } else if (router) {
      lit = new Set([src, dst]);
      trunk = 'path';
      message = {
        ok: true,
        text: `PC${src + 1} (${ipOf(src, vlan[src])}) → PC${dst + 1} (${ipOf(dst, vlan[dst])}): different VLANs, so the frame goes to the default gateway. It travels up the 802.1Q trunk tagged VLAN ${vlan[src]}, the router routes it from subinterface G0/0.${vlan[src]} to G0/0.${vlan[dst]}, and it comes back down tagged VLAN ${vlan[dst]}.`,
      };
    } else {
      lit = new Set([src]);
      bad = new Set([dst]);
      trunk = 'cut';
      message = { ok: false, text: `PC${src + 1} → PC${dst + 1}: different VLANs are different subnets and broadcast domains. With no router or Layer 3 switch, nothing can forward between them, so the ping fails.` };
    }
  }
  if (mode === 'ping' && src != null && dst == null) message = { ok: null, text: `Source: PC${src + 1}. Now pick a destination.` };

  const used = new Set(vlan).size;
  const dim = (i) => (mode !== 'assign' && (src != null) && !lit.has(i) && !bad.has(i));

  return (
    <>
      <div className="section stack">
        <div className="row">
          <Seg
            label="Mode"
            value={mode}
            onChange={changeMode}
            options={[
              { value: 'assign', label: '1 · Assign VLANs' },
              { value: 'broadcast', label: '2 · Broadcast' },
              { value: 'ping', label: '3 · Ping' },
            ]}
          />
          <label className="chip" aria-pressed={router} style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={router} onChange={(e) => setRouter(e.target.checked)} className="sr-only" />
            <span className="box" />
            Router on a stick
          </label>
        </div>
        <p className="muted">
          {mode === 'assign' && 'Click a PC (or its port) to cycle its access VLAN: 10 → 20 → 30.'}
          {mode === 'broadcast' && 'Click a PC to send a broadcast (like an ARP request) and see who receives it.'}
          {mode === 'ping' && 'Click a source PC, then a destination PC.'}
        </p>
      </div>
      <div className="section">
        <div className="diagram-scroll">
          <svg className="diagram" viewBox="0 0 640 360" role="img" aria-label="Switch with eight PCs in VLANs and a router on a trunk">
            <defs>
              <pattern id="vlan-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="6" height="6" style={{ fill: 'var(--surface)' }} />
                <line x1="0" y1="0" x2="0" y2="6" style={{ stroke: 'var(--text)', strokeWidth: 3 }} />
              </pattern>
              <pattern id="vlan-dots" width="6" height="6" patternUnits="userSpaceOnUse">
                <rect width="6" height="6" style={{ fill: 'var(--surface)' }} />
                <circle cx="3" cy="3" r="1.2" style={{ fill: 'var(--text)' }} />
              </pattern>
            </defs>
  
            {/* Router + trunk */}
            <g style={{ opacity: router ? 1 : 0.3 }}>
              <line x1={320} y1={62} x2={320} y2={140} className={`link ${trunk}`} />
              <rect x={262} y={18} width={116} height={44} className="node filled" />
              <text x={320} y={38} textAnchor="middle" style={{ fontSize: 13, fontWeight: 650, fill: 'var(--on-fill)' }}>Router</text>
              <text x={320} y={53} textAnchor="middle" className="mono" style={{ fontSize: 9.5, fill: 'var(--on-fill)' }}>G0/0.10 .20 .30</text>
              <text x={330} y={105} className="mono muted" style={{ fontSize: 10 }}>802.1Q trunk</text>
            </g>
  
            {/* Switch */}
            <rect x={20} y={140} width={600} height={56} className="node" />
            <text x={34} y={162} style={{ fontSize: 13, fontWeight: 650 }}>Switch</text>
            <text x={34} y={180} className="mono muted" style={{ fontSize: 10 }}>{used} VLANs = {used} broadcast domains</text>
  
            {vlan.map((v, i) => {
              const x = pcX(i);
              const on = lit.has(i);
              const isBad = bad.has(i);
              return (
                <g key={i} className="hit" onClick={() => click(i)} role="button" aria-label={`PC${i + 1}, VLAN ${v}`} style={{ opacity: dim(i) ? 0.3 : 1 }}>
                  <line x1={x} y1={196} x2={x} y2={262} className={`link ${on ? 'path' : ''} ${isBad ? 'cut' : ''}`} />
                  <rect x={x - 11} y={184} width={22} height={12} style={{ fill: fillFor(v), stroke: 'var(--line-strong)', strokeWidth: 1.2 }} />
                  <text x={x} y={216} textAnchor="middle" className="mono muted" style={{ fontSize: 9, paintOrder: 'stroke', stroke: 'var(--surface)', strokeWidth: 4 }}>Fa0/{i + 1}</text>
                  <rect x={x - 30} y={262} width={60} height={34} style={{ fill: fillFor(v), stroke: on ? 'var(--ok)' : isBad ? 'var(--bad)' : 'var(--line-strong)', strokeWidth: on || isBad ? 3 : 1.5 }} />
                  <rect x={x - 19} y={270} width={38} height={18} style={{ fill: 'var(--surface)', stroke: 'none' }} />
                  <text x={x} y={283} textAnchor="middle" style={{ fontSize: 12, fontWeight: 650 }}>PC{i + 1}</text>
                  <text x={x} y={314} textAnchor="middle" className="mono" style={{ fontSize: 11, fontWeight: 650 }}>VLAN {v}</text>
                  <text x={x} y={330} textAnchor="middle" className="mono muted" style={{ fontSize: 9 }}>.{v}.{11 + i}</text>
                  {src === i && mode !== 'assign' && <text x={x} y={350} textAnchor="middle" className="mono" style={{ fontSize: 10, fontWeight: 700 }}>SRC</text>}
                  {dst === i && <text x={x} y={350} textAnchor="middle" className="mono" style={{ fontSize: 10, fontWeight: 700 }}>DST</text>}
                </g>
              );
            })}
          </svg>
        </div>
        <PanHint />
        <div className="legend" style={{ marginTop: 10 }}>
          {ORDER.map((v) => (
            <span key={v}>
              <svg width="14" height="14" style={{ verticalAlign: -2, marginRight: 6 }} aria-hidden="true">
                <rect x="0.5" y="0.5" width="13" height="13" style={{ fill: fillFor(v), stroke: 'var(--line-strong)' }} />
              </svg>
              VLAN {v} · {VLANS[v].name} · 10.10.{v}.0/24
            </span>
          ))}
        </div>
      </div>
      {message && (
        <div className="section">
          <div className={`callout ${message.ok === true ? 'ok' : message.ok === false ? 'bad' : ''}`} aria-live="polite">
            <p>{message.text}</p>
          </div>
        </div>
      )}
      <div className="section stack">
        <div className="eyebrow">Key points</div>
        <ul style={{ margin: 0, paddingLeft: 18 }} className="stack">
          <li>Each VLAN is a separate broadcast domain and normally its own IP subnet.</li>
          <li>Access ports carry one untagged VLAN; trunk ports carry many VLANs tagged with 802.1Q (the native VLAN is untagged).</li>
          <li>Traffic between VLANs needs Layer 3: a router (router on a stick with subinterfaces) or a Layer 3 switch (SVIs).</li>
          <li>Every switch port is its own collision domain.</li>
        </ul>
      </div>
    </>
  );
}
