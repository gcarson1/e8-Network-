import { useState } from 'react';
import { intToIp, ipToInt, parseCidrOrMask, prefixToMask } from '../lib/net.js';
import { PanHint, Task } from './kit.jsx';

const CONNECTED = [
  { code: 'C', net: '192.168.1.0', prefix: 24, via: 'G0/0', ad: 0 },
  { code: 'C', net: '10.0.12.0', prefix: 30, via: 'G0/1', ad: 0 },
  { code: 'C', net: '203.0.113.0', prefix: 30, via: 'G0/2', ad: 0 },
];
const NEXT_HOPS = [
  { ip: '10.0.12.2', label: '10.0.12.2 (R2, via G0/1)' },
  { ip: '203.0.113.1', label: '203.0.113.1 (ISP, via G0/2)' },
];
const QUICK = [
  ['LAN B host', '192.168.2.10'],
  ['LAN C server', '192.168.3.25'],
  ['Internet', '8.8.8.8'],
  ['LAN A host', '192.168.1.20'],
  ['R2', '10.0.12.2'],
];

function lookup(routes, ipStr) {
  const ip = ipToInt(ipStr);
  if (ip == null) return null;
  const matches = routes.filter((r) => ((ip & prefixToMask(r.prefix)) >>> 0) === ipToInt(r.net));
  matches.sort((a, b) => b.prefix - a.prefix || a.ad - b.ad);
  return { ip, matches, best: matches[0] || null };
}

// Where the packet ends up, for drawing the path.
function pathFor(result) {
  if (!result?.best) return { links: [], outcome: 'drop' };
  const { best, ip } = result;
  const inNet = (n, p) => ((ip & prefixToMask(p)) >>> 0) === ipToInt(n);
  if (best.via === 'G0/0') return { links: ['A-R1'], outcome: 'delivered', where: 'LAN A (directly connected)' };
  if (best.via === 'G0/1') return { links: ['R1-R2'], outcome: 'delivered', where: 'the R1–R2 link (directly connected)' };
  if (best.via === 'G0/2') return { links: ['R1-ISP'], outcome: 'delivered', where: 'the ISP link (directly connected)' };
  if (best.via === '10.0.12.2') {
    if (inNet('192.168.2.0', 24)) return { links: ['R1-R2', 'R2-B'], outcome: 'delivered', where: 'LAN B via R2' };
    if (inNet('192.168.3.0', 24)) return { links: ['R1-R2', 'R2-C'], outcome: 'delivered', where: 'LAN C via R2' };
    return { links: ['R1-R2'], outcome: 'stuck', where: "R2, which has no route there and drops it" };
  }
  if (best.via === '203.0.113.1') {
    if (inNet('192.168.0.0', 16) || inNet('10.0.0.0', 8)) return { links: ['R1-ISP'], outcome: 'stuck', where: 'the ISP, which drops private addresses' };
    return { links: ['R1-ISP', 'ISP-NET'], outcome: 'delivered', where: 'the internet via the ISP' };
  }
  return { links: [], outcome: 'drop' };
}

export default function Routing() {
  const [statics, setStatics] = useState([]);
  const [form, setForm] = useState({ net: '', prefix: '', via: NEXT_HOPS[0].ip });
  const [err, setErr] = useState('');
  const [dest, setDest] = useState('192.168.2.10');

  const routes = [...CONNECTED, ...statics];
  const result = lookup(routes, dest);
  const path = pathFor(result);

  const add = (e) => {
    e.preventDefault();
    setErr('');
    const netInt = ipToInt(form.net);
    const prefix = parseCidrOrMask(form.prefix);
    if (netInt == null) return setErr('Destination must be a dotted IPv4 network, like 192.168.2.0');
    if (prefix == null) return setErr('Prefix must be /0–/32 or a dotted mask like 255.255.255.0');
    const network = (netInt & prefixToMask(prefix)) >>> 0;
    if (network !== netInt) return setErr(`Host bits are set. For /${prefix} the network address is ${intToIp(network)}.`);
    if (routes.some((r) => r.net === intToIp(network) && r.prefix === prefix)) return setErr('A route for that exact network already exists. Remove it first.');
    setStatics((s) => [...s, { code: prefix === 0 ? 'S*' : 'S', net: intToIp(network), prefix, via: form.via, ad: 1 }]);
    setForm((f) => ({ ...f, net: '', prefix: '' }));
  };

  const hop = (ip) => lookup(routes, ip)?.best?.via;
  const lanRoutes = statics.filter((r) => r.prefix === 24 && (r.net === '192.168.2.0' || r.net === '192.168.3.0'));
  const missions = [
    ['Reach LAN B (192.168.2.0/24) through R2', hop('192.168.2.10') === '10.0.12.2'],
    ['Reach LAN C (192.168.3.0/24) through R2', hop('192.168.3.10') === '10.0.12.2'],
    ['Send everything else to the ISP with a default route', hop('8.8.8.8') === '203.0.113.1' && statics.some((r) => r.prefix === 0)],
    [
      'Bonus: replace both LAN routes with one summary route',
      statics.some((r) => r.net === '192.168.2.0' && r.prefix === 23 && r.via === '10.0.12.2') && lanRoutes.length === 0,
    ],
  ];

  const on = (id) => path.links.includes(id);
  const L = ({ id, x1, y1, x2, y2 }) => <line x1={x1} y1={y1} x2={x2} y2={y2} className={`wire ${on(id) ? 'path' : ''}`} />;
  const Box = ({ x, y, w = 110, label, sub, ink, bad }) => (
    <g>
      <rect x={x - w / 2} y={y - 20} width={w} height={40} className={`node ${ink && !bad ? 'ink' : ''} ${bad ? 'dead' : ''}`} />
      <text x={x} y={sub ? y - 3 : y + 5} textAnchor="middle" style={{ fontSize: 13, fontWeight: 600, fill: ink && !bad ? 'var(--ink-text)' : bad ? 'var(--bad)' : 'var(--text)' }}>{label}</text>
      {sub && <text x={x} y={y + 13} textAnchor="middle" className="mono" style={{ fontSize: 10, fill: 'var(--muted)' }}>{sub}</text>}
    </g>
  );
  const done = missions.filter((m) => m[1]).length;

  return (
    <div>
      <Task>You're configuring <b>R1</b>. Add static routes until every goal is checked, then send test packets to see longest-prefix match at work.</Task>
      <div className="checklist">
        {missions.map(([m, ok]) => (
          <div key={m} className={ok ? 'done' : ''}>
            <span className="mk">{ok ? '✓' : '○'}</span>
            <span>{m}</span>
          </div>
        ))}
      </div>
      <p className="faint small" style={{ marginTop: 'var(--sp-1h)' }}>{done}/{missions.length} done{done < missions.length ? ' · hint for the bonus: 192.168.2.0 and 192.168.3.0 share their first 23 bits' : ''}</p>

      <div className="diagram-scroll" style={{ marginTop: 'var(--sp-5)' }}>
        <svg className="diagram" viewBox="0 0 640 240" role="img" aria-label="LAN A, R1, R2 with LAN B and C, and the ISP">
          <L id="A-R1" x1={75} y1={125} x2={250} y2={125} />
          <L id="R1-R2" x1={250} y1={125} x2={430} y2={55} />
          <L id="R1-ISP" x1={250} y1={125} x2={430} y2={195} />
          <L id="R2-B" x1={430} y1={55} x2={570} y2={25} />
          <L id="R2-C" x1={430} y1={55} x2={570} y2={90} />
          <L id="ISP-NET" x1={430} y1={195} x2={570} y2={195} />
          <Box x={75} y={125} w={130} label="LAN A" sub="192.168.1.0/24" />
          <Box x={250} y={125} w={84} label="R1" ink bad={path.outcome === 'drop'} />
          <Box x={430} y={55} w={84} label="R2" ink bad={path.outcome === 'stuck' && path.links[path.links.length - 1] === 'R1-R2'} />
          <Box x={430} y={195} w={84} label="ISP" ink bad={path.outcome === 'stuck' && path.links[path.links.length - 1] === 'R1-ISP'} />
          <Box x={570} y={25} w={130} label="LAN B" sub="192.168.2.0/24" />
          <Box x={570} y={90} w={130} label="LAN C" sub="192.168.3.0/24" />
          <Box x={570} y={195} w={130} label="Internet" sub="anything else" />
          <text x={175} y={116} textAnchor="middle" className="mono muted" style={{ fontSize: 10 }}>G0/0</text>
          <text x={318} y={80} textAnchor="middle" className="mono muted halo" style={{ fontSize: 10 }}>G0/1 · 10.0.12.0/30</text>
          <text x={318} y={182} textAnchor="middle" className="mono muted halo" style={{ fontSize: 10 }}>G0/2 · 203.0.113.0/30</text>
        </svg>
      </div>
      <PanHint />

      <div className="eyebrow" style={{ margin: 'var(--sp-6) 0 var(--sp-2)' }}>R1 routing table</div>
      <div className="scroll-x">
        <table className="table">
          <thead><tr><th>Code</th><th>Destination</th><th>Via</th><th>AD</th><th /></tr></thead>
          <tbody>
            {routes.map((r) => {
              const isBest = result?.best === r;
              const isMatch = result?.matches.includes(r);
              return (
                <tr key={`${r.net}/${r.prefix}`} className={isBest ? 'hit' : isMatch ? 'sel' : ''}>
                  <td className="mono">{r.code}</td>
                  <td className="mono">{r.net}/{r.prefix}</td>
                  <td className="mono">{r.code === 'C' ? `connected, ${r.via}` : r.via}</td>
                  <td className="mono">{r.ad}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {isBest && <span className="pill good">used</span>}
                    {!isBest && isMatch && <span className="pill">matches</span>}
                    {r.code !== 'C' && <button className="tbtn small" onClick={() => setStatics((x) => x.filter((y) => y !== r))} aria-label={`Remove ${r.net}/${r.prefix}`}>Remove</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <form onSubmit={add} className="grid-fields" style={{ marginTop: 'var(--sp-4)', alignItems: 'end' }}>
        <label className="lf"><span>Destination network</span><input className="input" value={form.net} onChange={(e) => setForm({ ...form, net: e.target.value })} placeholder="192.168.2.0" inputMode="decimal" spellCheck={false} /></label>
        <label className="lf"><span>Prefix or mask</span><input className="input" value={form.prefix} onChange={(e) => setForm({ ...form, prefix: e.target.value })} placeholder="/24" spellCheck={false} /></label>
        <label className="lf"><span>Next hop</span>
          <select className="input" value={form.via} onChange={(e) => setForm({ ...form, via: e.target.value })}>
            {NEXT_HOPS.map((h) => <option key={h.ip} value={h.ip}>{h.label}</option>)}
          </select>
        </label>
        <div><button className="btn primary" type="submit">Add route</button></div>
      </form>
      {err && <p className="bad-text small" style={{ marginTop: 'var(--sp-2)' }}>{err}</p>}
      <p className="faint small mono" style={{ marginTop: 'var(--sp-2)' }}>
        ip route {form.net || '<network>'} {parseCidrOrMask(form.prefix) != null ? intToIp(prefixToMask(parseCidrOrMask(form.prefix))) : '<mask>'} {form.via}
      </p>

      <div className="eyebrow" style={{ margin: 'var(--sp-7) 0 var(--sp-2)' }}>Send a test packet</div>
      <div className="hstack">
        <input className={`input ${result ? '' : 'bad'}`} style={{ maxWidth: '12.5rem' }} value={dest} onChange={(e) => setDest(e.target.value)} aria-label="Destination IP" inputMode="decimal" spellCheck={false} />
        <div className="toggles">
          {QUICK.map(([l, ip]) => <button key={ip} className="toggle" aria-pressed={dest === ip} onClick={() => setDest(ip)}>{l}</button>)}
        </div>
      </div>
      {result && (
        <div className={`follow ${path.outcome === 'delivered' ? 'good' : 'bad'}`} aria-live="polite">
          {result.best ? (
            <>
              <div className="follow-k">{path.outcome === 'delivered' ? `Delivered to ${path.where}` : `Forwarded, but it reaches ${path.where}`}</div>
              <p className="rest">
                {result.matches.length} route{result.matches.length === 1 ? '' : 's'} matched {intToIp(result.ip)}.
                {result.matches.length > 1 && ` The longest prefix (/${result.best.prefix}) wins over ${result.matches.slice(1).map((m) => `/${m.prefix}`).join(', ')}.`}
              </p>
            </>
          ) : (
            <>
              <div className="follow-k">Dropped at R1: no matching route</div>
              <p className="rest">R1 discards it and sends ICMP "destination unreachable". A default route (0.0.0.0/0) would catch it.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
