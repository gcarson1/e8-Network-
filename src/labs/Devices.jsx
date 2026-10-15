import { useState } from 'react';
import { MatchDrill, PanHint, Task } from './kit.jsx';
import { shuffle } from '../lib/util.js';

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'square' };

// Simplified network-diagram style icons (64×64).
const ICON = {
  Router: (
    <>
      <ellipse cx="32" cy="32" rx="22" ry="22" {...S} />
      <path d="M22 22 l8 8 M22 22 h6 M22 22 v6 M42 42 l-8 -8 M42 42 h-6 M42 42 v-6 M42 22 l-8 8 M42 22 h-6 M42 22 v6 M22 42 l8 -8 M22 42 h6 M22 42 v-6" {...S} />
    </>
  ),
  Switch: (
    <>
      <rect x="8" y="18" width="48" height="28" {...S} />
      <path d="M16 27 h20 l-4 -4 M48 37 h-20 l4 4 M16 37 h12 M36 27 h12" {...S} />
    </>
  ),
  'Layer 3 switch': (
    <>
      <rect x="8" y="18" width="48" height="28" {...S} />
      <path d="M20 26 l8 6 l-8 6 M44 26 l-8 6 l8 6" {...S} />
      <circle cx="32" cy="32" r="3" fill="currentColor" />
    </>
  ),
  Hub: (
    <>
      <rect x="8" y="22" width="48" height="20" {...S} />
      <path d="M14 32 h36 M20 32 v-6 M28 32 v-6 M36 32 v-6 M44 32 v-6" {...S} />
    </>
  ),
  Firewall: (
    <>
      <rect x="10" y="14" width="44" height="36" {...S} />
      <path d="M10 26 h44 M10 38 h44 M24 14 v12 M40 14 v12 M18 26 v12 M32 26 v12 M46 26 v12 M24 38 v12 M40 38 v12" {...S} />
    </>
  ),
  'Wireless access point': (
    <>
      <rect x="16" y="36" width="32" height="14" {...S} />
      <path d="M32 36 v-8 M24 22 a11 11 0 0 1 16 0 M19 16 a18 18 0 0 1 26 0" {...S} />
    </>
  ),
  'Wireless LAN controller': (
    <>
      <rect x="8" y="30" width="48" height="20" {...S} />
      <path d="M18 40 h28 M18 22 a10 10 0 0 1 12 0 M34 22 a10 10 0 0 1 12 0" {...S} />
    </>
  ),
  'Load balancer': (
    <>
      <rect x="22" y="22" width="20" height="20" {...S} />
      <path d="M6 32 h16 M42 32 l14 -14 M42 32 h14 M42 32 l14 14" {...S} />
    </>
  ),
  'Proxy server': (
    <>
      <rect x="20" y="12" width="24" height="40" {...S} />
      <path d="M4 26 h16 M44 26 h16 M60 38 h-16 M20 38 h-16 M26 20 h12 M26 44 h12" {...S} />
    </>
  ),
  'IDS': (
    <>
      <path d="M6 32 q26 -24 52 0 q-26 24 -52 0 z" {...S} />
      <circle cx="32" cy="32" r="8" {...S} />
      <circle cx="32" cy="32" r="3" fill="currentColor" />
    </>
  ),
  'IPS': (
    <>
      <path d="M32 8 l20 8 v14 c0 14 -10 22 -20 26 c-10 -4 -20 -12 -20 -26 v-14 z" {...S} />
      <path d="M22 32 l7 7 l13 -14" {...S} />
    </>
  ),
  Modem: (
    <>
      <rect x="8" y="20" width="48" height="24" {...S} />
      <path d="M14 32 q5 -8 10 0 t10 0 t10 0 t8 0" {...S} />
    </>
  ),
  Bridge: (
    <>
      <path d="M6 40 h52 M12 40 v-8 q20 -16 40 0 v8" {...S} />
      <path d="M22 40 v-10 M32 40 v-13 M42 40 v-10" {...S} />
    </>
  ),
  Repeater: (
    <>
      <rect x="16" y="20" width="32" height="24" {...S} />
      <path d="M4 32 h12 M48 32 h12 M24 32 l6 -6 v12 z" {...S} />
    </>
  ),
};

const DEVICES = [
  { name: 'Hub', layer: 'Layer 1', fn: 'Repeats every signal out every port; one shared collision domain' },
  { name: 'Repeater', layer: 'Layer 1', fn: 'Regenerates a signal to extend cable distance' },
  { name: 'Bridge', layer: 'Layer 2', fn: 'Joins two LAN segments and filters frames by MAC address' },
  { name: 'Switch', layer: 'Layer 2', fn: 'Forwards frames out the right port using a MAC address table' },
  { name: 'Wireless access point', layer: 'Layer 2', fn: 'Bridges wireless clients onto the wired LAN' },
  { name: 'Router', layer: 'Layer 3', fn: 'Forwards packets between networks using IP routing tables' },
  { name: 'Layer 3 switch', layer: 'Layer 3', fn: 'Switches at wire speed and routes between VLANs' },
  { name: 'Firewall', layer: 'Layers 3–4 (NGFW: 7)', fn: 'Permits or denies traffic by rules on IPs, ports and state' },
  { name: 'Load balancer', layer: 'Layers 4–7', fn: 'Spreads client requests across a pool of servers' },
  { name: 'Proxy server', layer: 'Layer 7', fn: 'Makes requests on behalf of clients; can cache and filter' },
  { name: 'IDS', layer: 'Detects', fn: 'Watches a copy of traffic and alerts on attacks (passive)' },
  { name: 'IPS', layer: 'Prevents', fn: 'Sits inline and blocks malicious traffic as it happens' },
  { name: 'Wireless LAN controller', layer: 'Management', fn: 'Centrally configures and manages many lightweight APs' },
  { name: 'Modem', layer: 'Layer 1', fn: 'Converts digital data to and from the carrier signal (cable/DSL)' },
];

const Icon = ({ name, size = 54 }) => (
  <svg viewBox="0 0 64 64" aria-hidden="true" style={{ width: `${size / 16}rem`, height: `${size / 16}rem`, color: 'var(--text)', flex: 'none' }}>
    {ICON[name]}
  </svg>
);

const withLayer = DEVICES.filter((d) => /^Layer/.test(d.layer));

export function DevicesReference() {
  return (
    <div className="scroll-x">
      <table className="table">
        <thead><tr><th /><th>Device</th><th>Layer</th><th>Job</th></tr></thead>
        <tbody>
          {DEVICES.map((d) => (
            <tr key={d.name}>
              <td style={{ width: '3rem' }}><Icon name={d.name} size={34} /></td>
              <td><b>{d.name}</b></td>
              <td className="mono">{d.layer}</td>
              <td className="muted">{d.fn}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const DevicesDrill = () => (
  <MatchDrill
    task="Match each device to its job or OSI layer."
    modes={[
      {
        label: 'Device → job',
        items: DEVICES,
        prompt: (d) => <span className="hstack" style={{ gap: 'var(--sp-4)' }}><Icon name={d.name} />{d.name}</span>,
        answer: (d) => d.fn,
        note: (d) => `${d.name} · ${d.layer}`,
      },
      { label: 'Job → device', items: DEVICES, prompt: (d) => d.fn, answer: (d) => d.name, small: true },
      {
        label: 'Device → layer',
        items: withLayer,
        prompt: (d) => <span className="hstack" style={{ gap: 'var(--sp-4)' }}><Icon name={d.name} />{d.name}</span>,
        answer: (d) => d.layer,
        note: (d) => d.fn,
      },
    ]}
  />
);

// ───────── Build the network ─────────
const SLOTS = [
  { id: 'rtr', device: 'Router', x: 320, y: 96, hint: 'Connects you to the ISP' },
  { id: 'fw', device: 'Firewall', x: 320, y: 168, hint: 'Filters traffic by rules' },
  { id: 'lb', device: 'Load balancer', x: 530, y: 168, hint: 'Spreads requests over web servers' },
  { id: 'ips', device: 'IPS', x: 320, y: 240, hint: 'Inline, blocks attacks it detects' },
  { id: 'sw', device: 'Switch', x: 320, y: 312, hint: 'Connects wired devices by MAC' },
  { id: 'ap', device: 'Wireless access point', x: 180, y: 396, hint: 'Puts laptops on the LAN over Wi-Fi' },
  { id: 'wlc', device: 'Wireless LAN controller', x: 460, y: 396, hint: 'Manages all the APs centrally' },
];
const DISTRACTORS = ['Hub', 'Modem', 'Proxy server'];
const SHORT = { 'Wireless access point': 'Access point', 'Wireless LAN controller': 'WLC' };

/** Split a hint into lines of about 20 characters for the slot boxes. */
function wrap(text, max = 20) {
  const lines = [''];
  for (const w of text.split(' ')) {
    const cur = lines[lines.length - 1];
    if (cur && (cur + ' ' + w).length > max) lines.push(w);
    else lines[lines.length - 1] = cur ? `${cur} ${w}` : w;
  }
  return lines;
}

export function BuildNetwork() {
  const [palette, setPalette] = useState(() => shuffle([...SLOTS.map((s) => s.device), ...DISTRACTORS]));
  const [armed, setArmed] = useState(null);
  const [placed, setPlaced] = useState({}); // slot id -> device
  const [hints, setHints] = useState(true);
  const [checked, setChecked] = useState(false);

  const used = new Set(Object.values(placed));
  const drop = (slot) => {
    if (checked) return;
    if (placed[slot.id] && !armed) {
      setPlaced((p) => { const n = { ...p }; delete n[slot.id]; return n; });
      return;
    }
    if (!armed) return;
    setPlaced((p) => {
      const n = Object.fromEntries(Object.entries(p).filter(([, d]) => d !== armed));
      n[slot.id] = armed;
      return n;
    });
    setArmed(null);
  };
  const right = SLOTS.filter((s) => placed[s.id] === s.device).length;
  const full = SLOTS.every((s) => placed[s.id]);
  const reset = () => {
    setPalette(shuffle([...SLOTS.map((s) => s.device), ...DISTRACTORS]));
    setPlaced({});
    setArmed(null);
    setChecked(false);
  };

  const box = (s) => {
    const d = placed[s.id];
    const state = checked ? (d === s.device ? 'goodn' : 'badn') : '';
    return (
      <g key={s.id} className="hit" onClick={() => drop(s)} role="button" aria-label={`Slot: ${s.hint}${d ? `, holds ${d}` : ', empty'}`}>
        <rect x={s.x - 66} y={s.y - 22} width={132} height={44} className={`node ${d ? '' : 'soft'} ${state}`} style={!d ? { strokeDasharray: '5 4' } : undefined} />
        {d ? (
          <>
            <g transform={`translate(${s.x - 60}, ${s.y - 16}) scale(0.5)`} style={{ color: 'var(--text)' }}>{ICON[d]}</g>
            <text x={s.x - 22} y={s.y + 5} style={{ fontSize: 12.5, fontWeight: 600 }}>{SHORT[d] || d}</text>
          </>
        ) : hints ? (
          <text x={s.x} y={s.y - (wrap(s.hint).length - 1) * 6.5 + 4} textAnchor="middle" className="muted" style={{ fontSize: 10.5 }}>
            {wrap(s.hint).map((line, k) => <tspan key={k} x={s.x} dy={k ? 13 : 0}>{line}</tspan>)}
          </text>
        ) : (
          <text x={s.x} y={s.y + 6} textAnchor="middle" className="faint" style={{ fontSize: 18, fontWeight: 600 }}>?</text>
        )}
        {checked && d !== s.device && (
          <text x={s.x} y={s.y + 36} textAnchor="middle" className="halo" style={{ fontSize: 11, fontWeight: 600, fill: 'var(--bad)' }}>Should be: {SHORT[s.device] || s.device}</text>
        )}
      </g>
    );
  };
  const end = (x, y, label) => (
    <g key={label}>
      <rect x={x - 40} y={y - 15} width={80} height={30} className="node" />
      <text x={x} y={y + 5} textAnchor="middle" style={{ fontSize: 12 }}>{label}</text>
    </g>
  );

  return (
    <div>
      <div className="spread" style={{ marginBottom: 'var(--sp-1h)', alignItems: 'baseline' }}>
        <Task>Pick a device, then tap the slot where it belongs. Three devices are decoys.</Task>
        <button className={`tbtn ${hints ? 'on' : ''}`} onClick={() => setHints((h) => !h)} aria-pressed={hints} style={{ marginRight: 'calc(var(--sp-2) * -1)' }}>
          {hints ? 'Hints on' : 'Hints off'}
        </button>
      </div>
      <div className="pool" style={{ marginBottom: 'var(--sp-4)' }}>
        {palette.map((d) => (
          <button key={d} className={`chipbtn wirebtn ${used.has(d) ? 'placed' : ''}`} aria-pressed={armed === d} onClick={() => !checked && setArmed(armed === d ? null : d)}>
            <Icon name={d} size={20} />
            {SHORT[d] || d}
          </button>
        ))}
      </div>
      <div className="diagram-scroll">
        <svg className="diagram" viewBox="0 0 640 440" role="img" aria-label="Network diagram with empty device slots">
          <ellipse cx={320} cy={30} rx={70} ry={22} className="node soft" />
          <text x={320} y={35} textAnchor="middle" style={{ fontSize: 13, fontWeight: 600 }}>Internet</text>
          {[[320, 52, 320, 74], [320, 118, 320, 146], [386, 168, 464, 168], [320, 190, 320, 218], [320, 262, 320, 290], [320, 334, 180, 374], [320, 334, 460, 374], [320, 334, 320, 380], [530, 190, 490, 236], [530, 190, 570, 236]].map(([x1, y1, x2, y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="wire" strokeWidth="1.5" />
          ))}
          {end(490, 250, 'Web 1')}
          {end(570, 250, 'Web 2')}
          {end(320, 395, 'PCs')}
          <text x={530} y={128} textAnchor="middle" className="faint" style={{ fontSize: 11, letterSpacing: '0.06em' }}>SCREENED SUBNET</text>
          {SLOTS.map(box)}
        </svg>
      </div>
      <PanHint />
      {checked && (
        <div className={`follow ${right === SLOTS.length ? 'good' : 'bad'}`}>
          <div className="follow-k">{right}/{SLOTS.length} placed correctly</div>
          <p className="rest">
            {right === SLOTS.length
              ? 'Traffic from the internet hits the router, is filtered by the firewall, inspected by the IPS, then switched to hosts. Public servers sit behind the load balancer in the screened subnet.'
              : 'The correct device is shown next to each wrong slot.'}
          </p>
        </div>
      )}
      <div className="qactions">
        {!checked ? (
          <button className="btn primary" disabled={!full} onClick={() => setChecked(true)}>Check</button>
        ) : (
          <button className="btn primary" onClick={reset}>Try again</button>
        )}
        <span className="tally">{Object.keys(placed).length}/{SLOTS.length} slots filled</span>
      </div>
    </div>
  );
}
