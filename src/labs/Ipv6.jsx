import { useState } from 'react';
import { TabbedLab } from './kit.jsx';
import { compressIPv6, dropLeadingZeros, expandIPv6, ipToInt, ipv4Facts, ipv6Type, parseIPv6, zeroRun } from '../lib/net.js';
import { pick, randInt } from '../lib/util.js';

function Compare() {
  const [v4, setV4] = useState('172.20.14.9');
  const n = ipToInt(v4);
  const facts = n != null ? ipv4Facts(n) : null;
  const rows = [
    ['Size', '32 bits', '128 bits'],
    ['Written as', '4 decimal octets, dotted', '8 hex hextets, colon-separated'],
    ['Example', '192.168.1.10', '2001:db8:acad:1::10'],
    ['Address space', '2³² ≈ 4.3 billion', '2¹²⁸ ≈ 3.4 × 10³⁸'],
    ['Header', 'Variable, 20–60 bytes, has checksum', 'Fixed 40 bytes, no checksum'],
    ['Auto-config', 'DHCP (or APIPA 169.254/16)', 'SLAAC, DHCPv6, link-local fe80::/10'],
    ['Broadcast', 'Yes', 'None (multicast replaces it)'],
    ['Address resolution', 'ARP', 'NDP (Neighbor Discovery, ICMPv6)'],
    ['Private space', '10/8, 172.16/12, 192.168/16', 'Unique local fc00::/7'],
    ['Loopback', '127.0.0.1', '::1'],
    ['NAT', 'Common (PAT)', 'Not needed; NAT64 for IPv4 interop'],
  ];
  return (
    <>
      <div className="section stack">
        <div className="eyebrow">Size to scale</div>
        <div className="stack" style={{ gap: 6 }}>
          <div className="row" style={{ gap: 12, flexWrap: 'nowrap' }}>
            <span className="mono" style={{ width: 42, fontSize: 13 }}>IPv4</span>
            <div style={{ flex: 1 }}><div style={{ width: '25%', height: 16, background: 'var(--shade-2)' }} /></div>
          </div>
          <div className="row" style={{ gap: 12, flexWrap: 'nowrap' }}>
            <span className="mono" style={{ width: 42, fontSize: 13 }}>IPv6</span>
            <div style={{ flex: 1, display: 'flex' }}>
              {[0.375, 0.125, 0.5].map((w, i) => (
                <div key={i} style={{ width: `${w * 100}%`, height: 16, background: i === 0 ? 'var(--fill)' : i === 1 ? 'var(--shade-2)' : 'var(--shade-3)', borderRight: '2px solid var(--surface)' }} />
              ))}
            </div>
          </div>
          <div className="legend" style={{ marginLeft: 54 }}>
            <span><i style={{ background: 'var(--fill)' }} />Global routing prefix (48)</span>
            <span><i style={{ background: 'var(--shade-2)' }} />Subnet ID (16)</span>
            <span><i style={{ background: 'var(--shade-3)' }} />Interface ID (64)</span>
          </div>
        </div>
      </div>
      <div className="section">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th /><th>IPv4</th><th>IPv6</th></tr></thead>
            <tbody>
              {rows.map(([k, a, b]) => (
                <tr key={k}>
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>{k}</td>
                  <td>{a}</td>
                  <td>{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="section stack">
        <div className="eyebrow">Classify an IPv4 address</div>
        <input className={`input ${n == null ? 'bad' : ''}`} value={v4} onChange={(e) => setV4(e.target.value)} aria-label="IPv4 address" spellCheck={false} inputMode="decimal" style={{ maxWidth: 320 }} />
        <div className="row" style={{ gap: 6 }}>
          {['10.1.2.3', '172.31.0.5', '192.168.0.1', '169.254.10.20', '127.0.0.1', '8.8.8.8', '224.0.0.5', '100.64.1.1'].map((x) => (
            <button key={x} className="btn small quiet mono" onClick={() => setV4(x)}>{x}</button>
          ))}
        </div>
        {facts && (
          <div className="kv" style={{ maxWidth: 520 }}>
            <div>Type</div><div>{facts.kind}</div>
            <div>Class</div><div>{facts.cls}{facts.defaultPrefix ? ` (default /${facts.defaultPrefix})` : ''}</div>
            <div>Binary first octet</div><div>{(n >>> 24).toString(2).padStart(8, '0')}</div>
          </div>
        )}
      </div>
    </>
  );
}

function Shorthand() {
  const [text, setText] = useState('2001:0db8:0000:0000:0000:ff00:0042:8329');
  const h = parseIPv6(text);
  const run = h ? zeroRun(h) : null;
  const type = h ? ipv6Type(h) : null;
  return (
    <div className="section stack-lg">
      <div className="stack">
        <label htmlFor="v6" style={{ fontWeight: 600, fontSize: 13 }}>Type any IPv6 address, full or shortened</label>
        <input id="v6" className={`input ${h ? '' : 'bad'}`} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} autoCapitalize="off" />
        <div className="row" style={{ gap: 6 }}>
          {['fe80::1c2b:3ff:fe4a:91', '2001:db8:acad:10::1', 'fd12:3456:789a:1::25', 'ff02::1', '::1', '2001:0db8:0000:0000:0000:ff00:0042:8329'].map((x) => (
            <button key={x} className="btn small quiet mono" onClick={() => setText(x)}>{x}</button>
          ))}
        </div>
      </div>
      {!h ? (
        <p className="bad-text">Not a valid IPv6 address. Check for more than one :: or a group longer than 4 hex digits.</p>
      ) : (
        <>
          <div className="stack">
            <div className="eyebrow">Full form</div>
            <div className="mono" style={{ fontSize: 16, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {h.map((x, i) => (
                <span key={i} style={{ padding: '3px 6px', background: run.start !== -1 && i >= run.start && i < run.start + run.len ? 'var(--track)' : 'transparent', border: '1px solid var(--line)' }}>
                  {x.toString(16).padStart(4, '0')}
                </span>
              ))}
            </div>
          </div>
          <div className="kv">
            <div>1 · Expanded</div><div style={{ wordBreak: 'break-all' }}>{expandIPv6(h)}</div>
            <div>2 · Drop leading zeros</div><div style={{ wordBreak: 'break-all' }}>{dropLeadingZeros(h)}</div>
            <div>3 · Collapse zeros with ::</div><div style={{ wordBreak: 'break-all' }}><b>{compressIPv6(h)}</b></div>
            <div>Type</div><div>{type.name} {type.prefix && <span className="pill">{type.prefix}</span>}</div>
            {type.name.startsWith('Global') && (
              <>
                <div>Routing prefix /48</div><div>{h.slice(0, 3).map((x) => x.toString(16)).join(':')}</div>
                <div>Subnet ID</div><div>{h[3].toString(16)}</div>
                <div>Interface ID /64</div><div>{h.slice(4).map((x) => x.toString(16)).join(':')}</div>
              </>
            )}
          </div>
          <div className="callout">
            <p className="muted">
              Rules: within each hextet drop leading zeros (0042 → 42). Replace the single longest run of all-zero hextets with <b className="mono">::</b>, and only once per address,
              otherwise you couldn't tell how many zeros each :: stands for.
              {run.start === -1 && ' This address has no run of two or more zero hextets, so :: is not used.'}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function randomV6() {
  const hx = () => randInt(0, 0xffff);
  const base = pick([[0x2001, 0x0db8], [0xfe80, 0], [0xfd00 + randInt(0, 255), hx()], [0x2001, 0x0db8]]);
  const h = [...base, ...Array.from({ length: 6 }, () => (Math.random() < 0.5 ? 0 : pick([hx(), randInt(1, 0xff), randInt(1, 0xfff)])))];
  if (h[0] === 0xfe80) { h[1] = 0; h[2] = 0; h[3] = 0; }
  // make sure there's something to compress
  const zs = randInt(2, 4);
  const at = randInt(2, 8 - zs);
  for (let i = at; i < at + zs; i++) h[i] = 0;
  return h;
}

function Drill() {
  const [h, setH] = useState(randomV6);
  const [ans, setAns] = useState('');
  const [res, setRes] = useState(null);
  const [tally, setTally] = useState({ ok: 0, n: 0 });
  const best = compressIPv6(h);

  const check = () => {
    const parsed = parseIPv6(ans);
    const same = parsed && parsed.every((x, i) => x === h[i]);
    const shortest = same && ans.trim().length <= best.length;
    const verdict = !parsed ? 'invalid' : !same ? 'wrong' : shortest ? 'ok' : 'long';
    setRes(verdict);
    setTally((t) => ({ ok: t.ok + (verdict === 'ok' ? 1 : 0), n: t.n + 1 }));
  };
  const next = () => {
    setH(randomV6());
    setAns('');
    setRes(null);
  };

  return (
    <div className="section stack-lg">
      <div className="row between">
        <div className="eyebrow plain">Write the shortest valid form</div>
        <span className="mono muted" style={{ fontSize: 13 }}>{tally.ok}/{tally.n}</span>
      </div>
      <div className="mono" style={{ fontSize: 'clamp(15px, 3.6vw, 22px)', fontWeight: 600, wordBreak: 'break-all' }}>{expandIPv6(h)}</div>
      <form onSubmit={(e) => { e.preventDefault(); res ? next() : check(); }} className="stack">
        <input
          className={`input ${res === 'ok' ? 'ok' : res && res !== 'long' ? 'bad' : ''}`}
          value={ans}
          onChange={(e) => setAns(e.target.value)}
          placeholder="e.g. 2001:db8::ff00:42:8329"
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          readOnly={!!res}
          aria-label="Compressed IPv6 address"
        />
        {res && (
          <div className={`callout ${res === 'ok' ? 'ok' : 'bad'}`}>
            <p style={{ fontWeight: 650 }} className={res === 'ok' ? 'ok-text' : 'bad-text'}>
              {res === 'ok' && 'Correct and fully compressed.'}
              {res === 'long' && 'Valid, and the same address, but it can be shortened further.'}
              {res === 'wrong' && "That's a valid IPv6 address, but not the same one."}
              {res === 'invalid' && "That isn't valid IPv6 notation."}
            </p>
            {res !== 'ok' && <p className="mono" style={{ marginTop: 4 }}>{best}</p>}
          </div>
        )}
        <div className="row">
          {res ? <button className="btn primary" type="submit">Next address →</button> : <button className="btn primary" type="submit" disabled={!ans.trim()}>Check</button>}
        </div>
      </form>
    </div>
  );
}

export default function Ipv6() {
  return (
    <TabbedLab
      tabs={[
        { value: 'compare', label: 'IPv4 vs IPv6', render: () => <Compare /> },
        { value: 'short', label: 'Shorthand explorer', render: () => <Shorthand /> },
        { value: 'drill', label: 'Compression drill', render: () => <Drill /> },
      ]}
    />
  );
}

