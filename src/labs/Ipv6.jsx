import { useState } from 'react';
import { Task } from './kit.jsx';
import { compressIPv6, dropLeadingZeros, expandIPv6, ipToInt, ipv4Facts, ipv6Type, parseIPv6, zeroRun } from '../lib/net.js';
import { pick, randInt } from '../lib/util.js';

// ───────── 1. Compare ─────────
const ROWS = [
  ['Size', '32 bits', '128 bits'],
  ['Written as', '4 decimal octets, dotted', '8 hex hextets, colons'],
  ['Example', '192.168.1.10', '2001:db8:acad:1::10'],
  ['Address space', '2³² ≈ 4.3 billion', '2¹²⁸ ≈ 3.4 × 10³⁸'],
  ['Header', '20–60 bytes, has checksum', 'Fixed 40 bytes, no checksum'],
  ['Auto-config', 'DHCP (or APIPA 169.254/16)', 'SLAAC, DHCPv6, link-local fe80::/10'],
  ['Broadcast', 'Yes', 'None, multicast replaces it'],
  ['Find a MAC', 'ARP', 'NDP (ICMPv6 neighbor discovery)'],
  ['Private space', '10/8, 172.16/12, 192.168/16', 'Unique local fc00::/7'],
  ['Loopback', '127.0.0.1', '::1'],
  ['NAT', 'Common (PAT)', 'Not needed; NAT64 for IPv4 interop'],
];

export function Compare() {
  const [v4, setV4] = useState('172.20.14.9');
  const n = ipToInt(v4);
  const facts = n != null ? ipv4Facts(n) : null;
  return (
    <div>
      <Task>The two side by side, drawn to scale. Then classify any IPv4 address.</Task>
      <div className="stack-sm">
        <div className="scalebar"><span className="mono small">IPv4</span><span><span style={{ width: '25%', background: 'var(--s2)' }} /></span></div>
        <div className="scalebar">
          <span className="mono small">IPv6</span>
          <span>
            <span style={{ width: '37.5%', background: 'var(--ink)' }} />
            <span style={{ width: '12.5%', background: 'var(--s2)' }} />
            <span style={{ width: '50%', background: 'var(--s3)' }} />
          </span>
        </div>
        <div className="legend" style={{ marginLeft: 'var(--sp-12)' }}>
          <span><i className="ink" />Routing prefix /48</span>
          <span><i style={{ background: 'var(--s2)' }} />Subnet ID 16</span>
          <span><i style={{ background: 'var(--s3)' }} />Interface ID 64</span>
        </div>
      </div>
      <div className="scroll-x" style={{ marginTop: 'var(--sp-6)' }}>
        <table className="table">
          <thead><tr><th /><th>IPv4</th><th>IPv6</th></tr></thead>
          <tbody>
            {ROWS.map(([k, a, b]) => (
              <tr key={k}><td className="muted" style={{ whiteSpace: 'nowrap' }}>{k}</td><td>{a}</td><td>{b}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 'var(--sp-7)' }}>
        <div className="eyebrow" style={{ marginBottom: 'var(--sp-3)' }}>Classify an IPv4 address</div>
        <div className="grid-2">
          <div className="stack-sm">
            <input className={`input ${n == null ? 'bad' : ''}`} value={v4} onChange={(e) => setV4(e.target.value)} aria-label="IPv4 address" spellCheck={false} inputMode="decimal" />
            <div className="hstack" style={{ gap: 'var(--sp-1)', marginLeft: 'calc(var(--sp-2) * -1)' }}>
              {['10.1.2.3', '172.31.0.5', '192.168.0.1', '169.254.10.20', '127.0.0.1', '8.8.8.8', '224.0.0.5', '100.64.1.1'].map((x) => (
                <button key={x} className="tbtn mono small" onClick={() => setV4(x)}>{x}</button>
              ))}
            </div>
          </div>
          {facts ? (
            <div className="kv">
              <div>Type</div><div>{facts.kind}</div>
              <div>Class</div><div>{facts.cls}{facts.defaultPrefix ? ` (default /${facts.defaultPrefix})` : ''}</div>
              <div>First octet</div><div>{(n >>> 24).toString(2).padStart(8, '0')}</div>
            </div>
          ) : (
            <p className="bad-text small">Enter a dotted IPv4 address.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ───────── 2. Shorthand explorer ─────────
export function Shorthand() {
  const [text, setText] = useState('2001:0db8:0000:0000:0000:ff00:0042:8329');
  const h = parseIPv6(text);
  const run = h ? zeroRun(h) : null;
  const type = h ? ipv6Type(h) : null;
  return (
    <div>
      <Task>Type any IPv6 address, full or shortened, to see every step and what kind of address it is.</Task>
      <input className={`input ${h ? '' : 'bad'}`} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} autoCapitalize="off" aria-label="IPv6 address" />
      <div className="hstack" style={{ gap: 'var(--sp-1)', margin: 'var(--sp-1h) 0 0 calc(var(--sp-2) * -1)' }}>
        {['fe80::1c2b:3ff:fe4a:91', '2001:db8:acad:10::1', 'fd12:3456:789a:1::25', 'ff02::1', '::1'].map((x) => (
          <button key={x} className="tbtn mono small" onClick={() => setText(x)}>{x}</button>
        ))}
      </div>
      {!h ? (
        <p className="bad-text small" style={{ marginTop: 'var(--sp-4)' }}>Not valid IPv6. Look for two "::" or a group longer than 4 hex digits.</p>
      ) : (
        <>
          <div className="hextets" style={{ marginTop: 'var(--sp-5)' }}>
            {h.map((x, i) => (
              <span key={i} className={run.start !== -1 && i >= run.start && i < run.start + run.len ? 'z' : ''}>{x.toString(16).padStart(4, '0')}</span>
            ))}
          </div>
          <div className="kv" style={{ marginTop: 'var(--sp-5)' }}>
            <div>1 · Full</div><div>{expandIPv6(h)}</div>
            <div>2 · Drop leading zeros</div><div>{dropLeadingZeros(h)}</div>
            <div>3 · Collapse one zero run</div><div><b>{compressIPv6(h)}</b></div>
            <div>Type</div><div>{type.name}{type.prefix && <span className="pill" style={{ marginLeft: 'var(--sp-2)' }}>{type.prefix}</span>}</div>
            {type.name.startsWith('Global') && (
              <>
                <div>Routing prefix</div><div>{h.slice(0, 3).map((x) => x.toString(16)).join(':')}::/48</div>
                <div>Subnet ID</div><div>{h[3].toString(16)}</div>
                <div>Interface ID</div><div>{h.slice(4).map((x) => x.toString(16)).join(':')}</div>
              </>
            )}
          </div>
          <div className="follow">
            <div className="follow-k">Rules</div>
            <p className="rest">
              Drop leading zeros in each group (0042 → 42). Replace the longest run of all-zero groups with :: once per address, or no one could tell how many zeros each :: means.
              {run.start === -1 && ' This address has no run of two or more zero groups, so :: isn\'t used.'}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ───────── 3. Compression drill ─────────
function randomV6() {
  const hx = () => randInt(0, 0xffff);
  const base = pick([[0x2001, 0x0db8], [0xfe80, 0], [0xfd00 + randInt(0, 255), hx()], [0x2001, 0x0db8]]);
  const h = [...base, ...Array.from({ length: 6 }, () => (Math.random() < 0.5 ? 0 : pick([hx(), randInt(1, 0xff), randInt(1, 0xfff)])))];
  if (h[0] === 0xfe80) { h[1] = 0; h[2] = 0; h[3] = 0; }
  const zs = randInt(2, 4);
  const at = randInt(2, 8 - zs);
  for (let i = at; i < at + zs; i++) h[i] = 0;
  return h;
}

export function CompressDrill() {
  const [h, setH] = useState(randomV6);
  const [ans, setAns] = useState('');
  const [res, setRes] = useState(null);
  const [tally, setTally] = useState({ ok: 0, n: 0 });
  const best = compressIPv6(h);

  const check = () => {
    const parsed = parseIPv6(ans);
    const same = parsed && parsed.every((x, i) => x === h[i]);
    const verdict = !parsed ? 'invalid' : !same ? 'wrong' : ans.trim().length <= best.length ? 'ok' : 'long';
    setRes(verdict);
    setTally((t) => ({ ok: t.ok + (verdict === 'ok' ? 1 : 0), n: t.n + 1 }));
  };
  const next = () => {
    setH(randomV6());
    setAns('');
    setRes(null);
  };

  return (
    <div>
      <div className="spread" style={{ marginBottom: 'var(--sp-2)' }}>
        <Task>Write the shortest valid form of this address.</Task>
        <span className="tally"><b>{tally.ok}</b>/{tally.n}</span>
      </div>
      <div className="mono" style={{ fontSize: 'clamp(15px, 3.4vw, 21px)', fontWeight: 600, wordBreak: 'break-all', marginBottom: 'var(--sp-4)' }}>{expandIPv6(h)}</div>
      <form onSubmit={(e) => { e.preventDefault(); res ? next() : check(); }}>
        <input
          className={`input ${res === 'ok' ? 'good' : res ? 'bad' : ''}`}
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
          <div className={`follow ${res === 'ok' ? 'good' : 'bad'}`}>
            <div className="follow-k">
              {res === 'ok' && 'Correct and fully compressed'}
              {res === 'long' && 'Same address, but it can be shorter'}
              {res === 'wrong' && 'Valid IPv6, but a different address'}
              {res === 'invalid' && "That isn't valid IPv6"}
            </div>
            {res !== 'ok' && <p className="mono">{best}</p>}
          </div>
        )}
        <div className="qactions">
          {res ? <button className="btn primary" type="submit">Next address →</button> : <button className="btn primary" type="submit" disabled={!ans.trim()}>Check</button>}
        </div>
      </form>
    </div>
  );
}
