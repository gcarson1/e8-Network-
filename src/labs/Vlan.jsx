import { useEffect, useState } from 'react';
import { PanHint, Task } from './kit.jsx';
import { Seg } from '../components/ui.jsx';

const VLANS = {
  10: { name: 'Sales', style: 'solid' },
  20: { name: 'Engineering', style: 'hatch' },
  30: { name: 'Guest', style: 'dots' },
};
const ORDER = [10, 20, 30];
const pcX = (i) => 52 + i * 76.5;
const ipOf = (i, v) => `10.10.${v}.${11 + i}`;
const fillFor = (v) => (VLANS[v].style === 'solid' ? 'var(--ink)' : VLANS[v].style === 'hatch' ? 'url(#vlan-hatch)' : 'url(#vlan-dots)');

const GOALS = [
  ['bcast', 'Send a broadcast and see who hears it'],
  ['fail', 'With the router off, ping between two VLANs'],
  ['routed', 'Turn the router on and ping between VLANs again'],
  ['one', 'Put every PC in one VLAN: how many broadcast domains now?'],
];

export default function Vlan() {
  const [vlan, setVlan] = useState([10, 10, 20, 20, 10, 30, 20, 30]);
  const [mode, setMode] = useState('broadcast');
  const [router, setRouter] = useState(false);
  const [src, setSrc] = useState(null);
  const [dst, setDst] = useState(null);
  const [done, setDone] = useState({});
  const mark = (k) => setDone((d) => (d[k] ? d : { ...d, [k]: true }));

  const used = new Set(vlan).size;
  useEffect(() => {
    if (used === 1) setDone((d) => (d.one ? d : { ...d, one: true }));
  }, [used]);

  const click = (i) => {
    if (mode === 'assign') {
      setVlan((v) => v.map((x, j) => (j === i ? ORDER[(ORDER.indexOf(x) + 1) % ORDER.length] : x)));
      return;
    }
    if (mode === 'broadcast') {
      setSrc(i);
      setDst(null);
      mark('bcast');
      return;
    }
    if (src == null || dst != null) { setSrc(i); setDst(null); }
    else if (i !== src) {
      setDst(i);
      if (vlan[i] !== vlan[src]) mark(router ? 'routed' : 'fail');
    }
  };
  const changeMode = (m) => { setMode(m); setSrc(null); setDst(null); };

  let lit = new Set();
  let bad = new Set();
  let trunk = '';
  let msg = null;
  if (mode === 'broadcast' && src != null) {
    const recv = vlan.map((v, j) => (j !== src && v === vlan[src] ? j : -1)).filter((j) => j >= 0);
    lit = new Set([src, ...recv]);
    msg = { ok: true, k: `PC${src + 1} broadcast on VLAN ${vlan[src]}`, t: `Reached ${recv.length ? recv.map((j) => `PC${j + 1}`).join(', ') : 'no one else'}. Other VLANs never see it: each VLAN is its own broadcast domain, and routers don't forward broadcasts.` };
  }
  if (mode === 'ping' && src != null && dst == null) msg = { ok: null, k: `Source: PC${src + 1}`, t: 'Now tap the destination PC.' };
  if (mode === 'ping' && src != null && dst != null) {
    if (vlan[src] === vlan[dst]) {
      lit = new Set([src, dst]);
      msg = { ok: true, k: 'Delivered by the switch', t: `Same VLAN (${vlan[src]}), same subnet. The switch forwards the frame at Layer 2 using its MAC table. No router involved.` };
    } else if (router) {
      lit = new Set([src, dst]);
      trunk = 'path';
      msg = { ok: true, k: 'Routed between VLANs', t: `${ipOf(src, vlan[src])} → ${ipOf(dst, vlan[dst])}. The frame goes up the 802.1Q trunk tagged ${vlan[src]}, the router moves it from subinterface G0/0.${vlan[src]} to G0/0.${vlan[dst]}, and it comes back down tagged ${vlan[dst]}.` };
    } else {
      lit = new Set([src]);
      bad = new Set([dst]);
      trunk = 'cut';
      msg = { ok: false, k: 'Ping failed', t: `VLAN ${vlan[src]} and VLAN ${vlan[dst]} are different subnets and broadcast domains. With no router or Layer 3 switch, nothing forwards between them.` };
    }
  }
  const dim = (i) => mode !== 'assign' && src != null && !lit.has(i) && !bad.has(i);

  return (
    <div>
      <Task>Work through the goals below. Use the modes to assign VLANs, broadcast, or ping between PCs.</Task>
      <div className="checklist" style={{ marginBottom: 20 }}>
        {GOALS.map(([k, label]) => (
          <div key={k} className={done[k] ? 'done' : ''}><span className="mk">{done[k] ? '✓' : '○'}</span><span>{label}{k === 'one' && done.one ? ' (one)' : ''}</span></div>
        ))}
      </div>

      <div className="spread">
        <Seg label="Mode" value={mode} onChange={changeMode} options={[
          { value: 'broadcast', label: 'Broadcast' },
          { value: 'ping', label: 'Ping' },
          { value: 'assign', label: 'Assign VLANs' },
        ]} />
        <button className="toggle" aria-pressed={router} onClick={() => { setRouter((r) => !r); setDst(null); }}>
          Router on a stick: {router ? 'on' : 'off'}
        </button>
      </div>
      <p className="faint small" style={{ margin: '10px 0 4px' }}>
        {mode === 'assign' && 'Tap a PC to cycle its VLAN: 10 → 20 → 30.'}
        {mode === 'broadcast' && 'Tap a PC to send a broadcast (like an ARP request).'}
        {mode === 'ping' && 'Tap a source PC, then a destination.'}
      </p>

      <div className="diagram-scroll">
        <svg className="diagram" viewBox="0 0 640 360" role="img" aria-label="Switch with eight PCs in VLANs and a router on a trunk">
          <defs>
            <pattern id="vlan-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" style={{ fill: 'var(--bg)' }} />
              <line x1="0" y1="0" x2="0" y2="6" style={{ stroke: 'var(--text)', strokeWidth: 3 }} />
            </pattern>
            <pattern id="vlan-dots" width="6" height="6" patternUnits="userSpaceOnUse">
              <rect width="6" height="6" style={{ fill: 'var(--bg)' }} />
              <circle cx="3" cy="3" r="1.2" style={{ fill: 'var(--text)' }} />
            </pattern>
          </defs>
          <g style={{ opacity: router ? 1 : 0.3 }}>
            <line x1={320} y1={62} x2={320} y2={140} className={`wire ${trunk}`} />
            <rect x={262} y={18} width={116} height={44} className="node ink" />
            <text x={320} y={38} textAnchor="middle" className="on-ink" style={{ fontSize: 13, fontWeight: 600 }}>Router</text>
            <text x={320} y={53} textAnchor="middle" className="mono on-ink" style={{ fontSize: 9.5 }}>G0/0.10 .20 .30</text>
            <text x={330} y={105} className="mono muted" style={{ fontSize: 10 }}>802.1Q trunk</text>
          </g>
          <rect x={20} y={140} width={600} height={56} className="node" />
          <text x={34} y={162} style={{ fontSize: 13, fontWeight: 600 }}>Switch</text>
          <text x={34} y={180} className="mono muted" style={{ fontSize: 10 }}>{used} VLAN{used === 1 ? '' : 's'} = {used} broadcast domain{used === 1 ? '' : 's'}</text>
          {vlan.map((v, i) => {
            const x = pcX(i);
            const on = lit.has(i);
            const isBad = bad.has(i);
            return (
              <g key={i} className="hit" onClick={() => click(i)} role="button" aria-label={`PC${i + 1}, VLAN ${v}`} style={{ opacity: dim(i) ? 0.3 : 1 }}>
                <line x1={x} y1={196} x2={x} y2={262} className={`wire ${on ? 'path' : ''} ${isBad ? 'cut' : ''}`} />
                <rect x={x - 11} y={184} width={22} height={12} style={{ fill: fillFor(v), stroke: 'var(--text)', strokeWidth: 1.2 }} />
                <text x={x} y={216} textAnchor="middle" className="mono muted halo" style={{ fontSize: 9 }}>Fa0/{i + 1}</text>
                <rect x={x - 30} y={262} width={60} height={34} style={{ fill: fillFor(v), stroke: on ? 'var(--good)' : isBad ? 'var(--bad)' : 'var(--text)', strokeWidth: on || isBad ? 3 : 1.5 }} />
                <rect x={x - 19} y={270} width={38} height={18} style={{ fill: 'var(--bg)' }} />
                <text x={x} y={283} textAnchor="middle" style={{ fontSize: 12, fontWeight: 600 }}>PC{i + 1}</text>
                <text x={x} y={314} textAnchor="middle" className="mono" style={{ fontSize: 11, fontWeight: 600 }}>VLAN {v}</text>
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
            <svg width="12" height="12" style={{ verticalAlign: -1, marginRight: 6 }} aria-hidden="true">
              <rect x="0.5" y="0.5" width="11" height="11" style={{ fill: fillFor(v), stroke: 'var(--text)' }} />
            </svg>
            VLAN {v} · {VLANS[v].name}
          </span>
        ))}
      </div>
      {msg && (
        <div className={`follow ${msg.ok === true ? 'good' : msg.ok === false ? 'bad' : ''}`} aria-live="polite">
          <div className="follow-k">{msg.k}</div>
          <p className="rest">{msg.t}</p>
        </div>
      )}
      <div className="follow">
        <div className="follow-k">Remember</div>
        <p className="rest">Access ports carry one untagged VLAN. Trunks carry many, tagged with 802.1Q (the native VLAN goes untagged). Moving traffic between VLANs takes Layer 3: router on a stick, or a Layer 3 switch with SVIs.</p>
      </div>
    </div>
  );
}
