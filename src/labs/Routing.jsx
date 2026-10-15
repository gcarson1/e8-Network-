import { useState } from 'react';
import { PanHint } from './kit.jsx';
import { intToIp, ipToInt, parseCidrOrMask, prefixToMask } from '../lib/net.js';

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
  const L = ({ id, x1, y1, x2, y2 }) => <line x1={x1} y1={y1} x2={x2} y2={y2} className={`link ${on(id) ? 'path' : ''}`} />;
  const Box = ({ x, y, w = 110, label, sub, filled, bad }) => (
    <g>
      <rect x={x - w / 2} y={y - 20} width={w} height={40} className={`node ${filled ? 'filled' : ''} ${bad ? 'dead' : ''}`} />
      <text x={x} y={sub ? y - 3 : y + 5} textAnchor="middle" style={{ fontSize: 13, fontWeight: 650, fill: filled ? 'var(--on-fill)' : 'var(--text)' }}>{label}</text>
      {sub && <text x={x} y={y + 13} textAnchor="middle" className="mono" style={{ fontSize: 10, fill: filled ? 'var(--on-fill)' : 'var(--muted)' }}>{sub}</text>}
    </g>
  );

  return (
    <>
      <div className="section stack">
        <p className="muted">
          You're configuring <b>R1</b>. It already knows its directly connected networks. Add static routes so it can reach the networks behind R2 and the internet,
          then send test packets and watch longest-prefix match pick the route.
        </p>
        <div className="diagram-scroll">
          <svg className="diagram" viewBox="0 0 640 250" role="img" aria-label="Network diagram: LAN A, R1, R2 with LAN B and C, ISP">
            <L id="A-R1" x1={75} y1={130} x2={250} y2={130} />
            <L id="R1-R2" x1={250} y1={130} x2={430} y2={60} />
            <L id="R1-ISP" x1={250} y1={130} x2={430} y2={200} />
            <L id="R2-B" x1={430} y1={60} x2={570} y2={30} />
            <L id="R2-C" x1={430} y1={60} x2={570} y2={95} />
            <L id="ISP-NET" x1={430} y1={200} x2={570} y2={200} />
            <Box x={75} y={130} w={130} label="LAN A" sub="192.168.1.0/24" />
            <Box x={250} y={130} w={84} label="R1" filled bad={path.outcome === 'drop'} />
            <Box x={430} y={60} w={84} label="R2" filled bad={path.outcome === 'stuck' && path.links[path.links.length - 1] === 'R1-R2'} />
            <Box x={430} y={200} w={84} label="ISP" filled bad={path.outcome === 'stuck' && path.links[path.links.length - 1] === 'R1-ISP'} />
            <Box x={570} y={30} w={130} label="LAN B" sub="192.168.2.0/24" />
            <Box x={570} y={95} w={130} label="LAN C" sub="192.168.3.0/24" />
            <Box x={570} y={200} w={130} label="Internet" sub="0.0.0.0/0" />
            <text x={175} y={120} textAnchor="middle" className="mono muted" style={{ fontSize: 10 }}>G0/0</text>
            <text x={318} y={84} textAnchor="middle" className="mono muted" style={{ fontSize: 10 }}>10.0.12.0/30</text>
            <text x={318} y={186} textAnchor="middle" className="mono muted" style={{ fontSize: 10 }}>203.0.113.0/30</text>
          </svg>
        </div>
        <PanHint />
      </div>

      <div className="section stack">
        <div className="eyebrow">R1 routing table</div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Code</th><th>Destination</th><th>Next hop / exit</th><th>AD</th><th /></tr></thead>
            <tbody>
              {routes.map((r, i) => {
                const isBest = result?.best === r;
                const isMatch = result?.matches.includes(r);
                return (
                  <tr key={`${r.net}/${r.prefix}`} className={isBest ? 'match' : isMatch ? 'sel' : ''}>
                    <td className="mono">{r.code}</td>
                    <td className="mono">{r.net}/{r.prefix}</td>
                    <td className="mono">{r.code === 'C' ? `directly connected, ${r.via}` : r.via}</td>
                    <td className="mono">{r.ad}</td>
                    <td style={{ textAlign: 'right' }}>
                      {isBest && <span className="pill ok" style={{ marginRight: 8 }}>chosen</span>}
                      {!isBest && isMatch && <span className="pill" style={{ marginRight: 8 }}>matches</span>}
                      {r.code !== 'C' && (
                        <button className="btn link small" onClick={() => setStatics((s) => s.filter((x) => x !== r))} aria-label={`Remove route ${r.net}/${r.prefix}`}>
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <form onSubmit={add} className="answer-grid" style={{ alignItems: 'end' }}>
          <div>
            <label htmlFor="rt-net">Destination network</label>
            <input id="rt-net" className="input" value={form.net} onChange={(e) => setForm({ ...form, net: e.target.value })} placeholder="192.168.2.0" inputMode="decimal" spellCheck={false} />
          </div>
          <div>
            <label htmlFor="rt-prefix">Prefix or mask</label>
            <input id="rt-prefix" className="input" value={form.prefix} onChange={(e) => setForm({ ...form, prefix: e.target.value })} placeholder="/24" spellCheck={false} />
          </div>
          <div>
            <label htmlFor="rt-via">Next hop</label>
            <select id="rt-via" className="input" value={form.via} onChange={(e) => setForm({ ...form, via: e.target.value })}>
              {NEXT_HOPS.map((h) => <option key={h.ip} value={h.ip}>{h.label}</option>)}
            </select>
          </div>
          <div>
            <button className="btn primary block" type="submit">Add static route</button>
          </div>
        </form>
        {err && <p className="bad-text" style={{ fontSize: 14 }}>{err}</p>}
        <p className="faint mono" style={{ fontSize: 12 }}>Cisco equivalent: ip route {form.net || '<network>'} {form.prefix ? (parseCidrOrMask(form.prefix) != null ? intToIp(prefixToMask(parseCidrOrMask(form.prefix))) : '<mask>') : '<mask>'} {form.via}</p>
      </div>

      <div className="section stack">
        <div className="eyebrow">Send a test packet</div>
        <div className="row">
          <input className={`input ${result ? '' : 'bad'}`} style={{ maxWidth: 220 }} value={dest} onChange={(e) => setDest(e.target.value)} aria-label="Destination IP" inputMode="decimal" spellCheck={false} />
          {QUICK.map(([l, ip]) => (
            <button key={ip} className={`btn small ${dest === ip ? 'primary' : 'quiet'}`} onClick={() => setDest(ip)}>{l}</button>
          ))}
        </div>
        {result && (
          <div className={`callout ${path.outcome === 'delivered' ? 'ok' : 'bad'}`} aria-live="polite">
            {result.best ? (
              <>
                <p style={{ fontWeight: 650 }} className={path.outcome === 'delivered' ? 'ok-text' : 'bad-text'}>
                  {path.outcome === 'delivered' ? `Delivered to ${path.where}.` : `Forwarded, but it reaches ${path.where}.`}
                </p>
                <p className="muted" style={{ marginTop: 4 }}>
                  {result.matches.length} route{result.matches.length === 1 ? '' : 's'} matched {intToIp(result.ip)}.
                  {result.matches.length > 1 && ` The longest prefix (/${result.best.prefix}) wins over ${result.matches.slice(1).map((m) => `/${m.prefix}`).join(', ')}.`}
                </p>
              </>
            ) : (
              <>
                <p className="bad-text" style={{ fontWeight: 650 }}>Dropped at R1: no matching route.</p>
                <p className="muted" style={{ marginTop: 4 }}>R1 discards the packet and sends ICMP "destination unreachable" back. A default route (0.0.0.0/0) would catch it.</p>
              </>
            )}
          </div>
        )}
      </div>

      <div className="section stack">
        <div className="eyebrow">Missions</div>
        <div>
          {missions.map(([m, ok]) => (
            <div key={m} className="row" style={{ borderTop: '1px solid var(--line)', padding: '10px 0', flexWrap: 'nowrap' }}>
              <span className={`mono ${ok ? 'ok-text' : 'faint'}`} style={{ width: 20 }}>{ok ? '✓' : '○'}</span>
              <span className={ok ? '' : 'muted'}>{m}</span>
            </div>
          ))}
        </div>
        <p className="faint" style={{ fontSize: 13 }}>
          Hint for the bonus: 192.168.2.0/24 and 192.168.3.0/24 share their first 23 bits.
        </p>
      </div>
    </>
  );
}
