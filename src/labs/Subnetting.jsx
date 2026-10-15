import { useState } from 'react';
import { intToIp, ipToInt, octetBits, parseCidrOrMask, prefixToMask, subnetInfo } from '../lib/net.js';
import { pick, randInt, shuffle } from '../lib/util.js';
import { Seg } from '../components/ui.jsx';
import { Task } from './kit.jsx';

// ───────────────────────── shared visuals ─────────────────────────

export function Bits({ value, prefix }) {
  const octs = octetBits(value);
  return (
    <div className="bits" aria-label={octs.join('.')}>
      {octs.map((o, oi) => (
        <span className="oct" key={oi}>
          {[...o].map((b, bi) => (
            <span key={bi} className={`bit ${oi * 8 + bi < prefix ? 'net' : 'host'}`}>{b}</span>
          ))}
        </span>
      ))}
    </div>
  );
}

/** The interesting octet as a 0–255 ruler split into subnet blocks. */
export function SubnetRuler({ ip, prefix }) {
  if (prefix % 8 === 0 || prefix > 30) return null;
  const octet = Math.floor(prefix / 8);
  const block = 2 ** (8 - (prefix % 8));
  const val = (ip >>> (24 - octet * 8)) & 255;
  const start = Math.floor(val / block) * block;
  const W = 640;
  const x = (v) => 10 + (v / 256) * (W - 20);
  const blocks = Array.from({ length: 256 / block }, (_, i) => i * block);
  const labelEvery = blocks.length > 16 ? Math.ceil(blocks.length / 8) : 1;
  return (
    <figure style={{ margin: 0 }}>
      <svg className="diagram" viewBox={`0 0 ${W} 82`} role="img" aria-label={`Octet ${octet + 1} split into blocks of ${block}; ${val} is in ${start}–${start + block - 1}`}>
        {blocks.map((b, i) => (
          <rect key={b} x={x(b)} y={30} width={x(b + block) - x(b) - (block >= 8 ? 1.5 : 0.5)} height={20}
            style={{ fill: b === start ? 'var(--ink)' : i % 2 ? 'var(--s3)' : 'var(--track)' }} />
        ))}
        {blocks.map((b, i) => (i % labelEvery === 0 && b !== start ? (
          <text key={b} x={x(b)} y={66} className="mono faint" style={{ fontSize: 10 }}>{b}</text>
        ) : null))}
        <text x={x(start)} y={66} className="mono" style={{ fontSize: 11, fontWeight: 700 }}>{start}</text>
        <text x={x(start + block)} y={66} textAnchor="end" className="mono" style={{ fontSize: 11, fontWeight: 700 }}>{start + block - 1}</text>
        <line x1={x(val + 0.5)} y1={14} x2={x(val + 0.5)} y2={52} className="wire" strokeWidth="1.5" />
        <text x={x(val + 0.5)} y={11} textAnchor="middle" className="mono" style={{ fontSize: 11, fontWeight: 700 }}>{val}</text>
      </svg>
      <figcaption className="small muted" style={{ marginTop: 4 }}>
        Octet {octet + 1}, blocks of {block}. {val} sits in {start}–{start + block - 1}.
      </figcaption>
    </figure>
  );
}

function HowItWorks({ ip, prefix }) {
  const info = subnetInfo(ip, prefix);
  const hostBits = 32 - prefix;
  const octet = Math.min(3, Math.floor(prefix / 8));
  const maskOctet = (info.mask >>> (24 - octet * 8)) & 255;
  const ord = ['1st', '2nd', '3rd', '4th'][octet];
  return (
    <div className="stack-lg" style={{ marginTop: 26 }}>
      <SubnetRuler ip={ip} prefix={prefix} />
      <div className="scroll-x">
        {[
          ['Address', ip],
          ['Mask', info.mask],
          ['Network', info.network],
          ['Broadcast', info.broadcast],
        ].map(([label, val]) => (
          <div className="bitrow" key={label}>
            <span className="lbl">{label}</span>
            <Bits value={val} prefix={prefix} />
            <span className="dec">{intToIp(val)}</span>
          </div>
        ))}
      </div>
      <div className="stack-sm small" style={{ maxWidth: '64ch' }}>
        <p>
          <b>/{prefix}</b> leaves {hostBits} host bits: 2<sup>{hostBits}</sup> = {info.total.toLocaleString()} addresses, {info.usable.toLocaleString()} usable.
        </p>
        {prefix % 8 !== 0 ? (
          <p>
            Mask in the {ord} octet is {maskOctet}, so the block size is 256 − {maskOctet} = <b>{256 - maskOctet}</b>.
            Network = start of the block, broadcast = end of the block.
          </p>
        ) : (
          <p>The mask ends on an octet boundary: keep the first {prefix / 8} octet{prefix === 8 ? '' : 's'}, zero the rest.</p>
        )}
      </div>
    </div>
  );
}

// ───────────────────────── 1. Calculate ─────────────────────────

const LEVELS = { easy: [24, 30], medium: [16, 30], hard: [8, 30] };

function makeProblem(level) {
  const [min, max] = LEVELS[level];
  const first = pick([10, 172, 192, randInt(1, 223)]);
  let o2 = randInt(0, 255);
  if (first === 172) o2 = randInt(16, 31);
  if (first === 192) o2 = 168;
  const ip = ipToInt(`${first === 127 ? 126 : first}.${o2}.${randInt(0, 255)}.${randInt(1, 254)}`);
  return { ip, prefix: randInt(min, max), useMask: Math.random() < 0.5 };
}

const FIELDS = [
  ['network', 'Network'],
  ['first', 'First host'],
  ['last', 'Last host'],
  ['broadcast', 'Broadcast'],
  ['hosts', 'Usable hosts'],
  ['mask', 'Mask / prefix'],
];

export function SubnetCalc() {
  const [level, setLevel] = useState('easy');
  const [p, setP] = useState(() => makeProblem('easy'));
  const [ans, setAns] = useState({});
  const [checked, setChecked] = useState(null);
  const [show, setShow] = useState(false);
  const [tally, setTally] = useState({ solved: 0, tried: 0 });

  const info = subnetInfo(p.ip, p.prefix);
  const expected = {
    network: intToIp(info.network),
    broadcast: intToIp(info.broadcast),
    first: intToIp(info.first),
    last: intToIp(info.last),
    hosts: String(info.usable),
    mask: p.useMask ? `/${p.prefix}` : intToIp(info.mask),
  };

  const grade = () => {
    const r = {};
    for (const [k] of FIELDS) {
      const v = (ans[k] || '').trim();
      if (k === 'hosts') r[k] = v.replace(/,/g, '') === expected.hosts;
      else if (k === 'mask') r[k] = parseCidrOrMask(v) === p.prefix;
      else r[k] = ipToInt(v) != null && ipToInt(v) === ipToInt(expected[k]);
    }
    const all = Object.values(r).every(Boolean);
    setChecked(r);
    setShow(!all);
    setTally((t) => ({ solved: t.solved + (all ? 1 : 0), tried: t.tried + 1 }));
  };
  const next = (lvl = level) => {
    setP(makeProblem(lvl));
    setAns({});
    setChecked(null);
    setShow(false);
    setTimeout(() => document.getElementById('sn-network')?.focus(), 0);
  };
  const allRight = checked && Object.values(checked).every(Boolean);
  const misses = checked ? Object.values(checked).filter((x) => !x).length : 0;

  return (
    <div>
      <div className="spread" style={{ marginBottom: 22 }}>
        <Seg label="Difficulty" value={level} onChange={(v) => { setLevel(v); next(v); }} options={[
          { value: 'easy', label: '/24–/30' },
          { value: 'medium', label: '/16–/30' },
          { value: 'hard', label: '/8–/30' },
        ]} />
        <span className="tally"><b>{tally.solved}</b>/{tally.tried} solved</span>
      </div>
      <Task>Fill in every field for this address. Tab moves along; Enter checks.</Task>
      <div className="drill-q mono" style={{ marginBottom: 18 }}>
        {intToIp(p.ip)}
        <span className="faint">{p.useMask ? ` ${intToIp(prefixToMask(p.prefix))}` : `/${p.prefix}`}</span>
      </div>
      <form
        className="grid-fields"
        onSubmit={(e) => { e.preventDefault(); checked ? next() : grade(); }}
      >
        {FIELDS.map(([k, label]) => (
          <label className="lf" key={k}>
            <span>{k === 'mask' ? (p.useMask ? 'Prefix (e.g. /26)' : 'Subnet mask') : label}</span>
            <input
              id={`sn-${k}`}
              className={`input ${checked ? (checked[k] ? 'good' : 'bad') : ''}`}
              value={ans[k] || ''}
              onChange={(e) => setAns((a) => ({ ...a, [k]: e.target.value }))}
              inputMode={k === 'hosts' ? 'numeric' : 'decimal'}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              readOnly={!!checked}
            />
            {checked && !checked[k] && <span className="expect">{expected[k]}</span>}
          </label>
        ))}
        <button type="submit" hidden />
      </form>
      {checked && (
        <div className={`follow ${allRight ? 'good' : 'bad'}`}>
          <div className="follow-k">{allRight ? 'All correct' : `${misses} of ${FIELDS.length} wrong`}</div>
          {!allRight && <p className="rest">The right answers are under each field.</p>}
        </div>
      )}
      <div className="qactions">
        {!checked ? <button className="btn primary" onClick={grade}>Check</button> : <button className="btn primary" onClick={() => next()}>Next address →</button>}
        <button className="tbtn" onClick={() => setShow((s) => !s)}>{show ? 'Hide working' : 'Show working'}</button>
        {!checked && <button className="tbtn" onClick={() => next()}>Skip</button>}
      </div>
      {show && <HowItWorks ip={p.ip} prefix={p.prefix} />}
    </div>
  );
}

// ───────────────────────── 2. CIDR visualizer ─────────────────────────

export function CidrVisual() {
  const [prefix, setPrefix] = useState(26);
  const [ipText, setIpText] = useState('192.168.10.77');
  const ip = ipToInt(ipText);
  const info = subnetInfo(ip ?? 0, prefix);
  const mask = prefixToMask(prefix);
  const usable = prefix === 32 ? '1 (host route)' : prefix === 31 ? '2 (point-to-point)' : info.usable.toLocaleString();

  return (
    <div>
      <Task>Drag the slider and watch the mask, block size and host count change.</Task>
      <div className="spread" style={{ alignItems: 'baseline' }}>
        <span className="drill-q mono">/{prefix}</span>
        <span className="mono muted">{intToIp(mask)}</span>
      </div>
      <input type="range" className="range" min={0} max={32} value={prefix} onChange={(e) => setPrefix(Number(e.target.value))} aria-label="Prefix length" style={{ margin: '10px 0' }} />
      <div className="scroll-x">
        <div className="bitrow"><span className="lbl">Mask</span><Bits value={mask} prefix={prefix} /><span className="dec">{prefix} network · {32 - prefix} host bits</span></div>
      </div>
      <div className="grid-2" style={{ marginTop: 24 }}>
        <div className="kv">
          <div>Mask</div><div>{intToIp(mask)}</div>
          <div>Wildcard</div><div>{intToIp(info.wildcard)}</div>
          <div>Addresses</div><div>{info.total.toLocaleString()}</div>
          <div>Usable hosts</div><div>{usable}</div>
          <div>Per /24</div><div>{prefix >= 24 ? `${2 ** (prefix - 24)} subnets` : '—'}</div>
        </div>
        <div className="stack-sm">
          <label className="lf">
            <span>Try an address</span>
            <input className={`input ${ip == null ? 'bad' : ''}`} value={ipText} onChange={(e) => setIpText(e.target.value)} inputMode="decimal" spellCheck={false} />
          </label>
          {ip != null && (
            <div className="kv">
              <div>Network</div><div>{intToIp(info.network)}/{prefix}</div>
              <div>Hosts</div><div>{intToIp(info.first)} – {intToIp(info.last)}</div>
              <div>Broadcast</div><div>{prefix >= 31 ? 'none' : intToIp(info.broadcast)}</div>
            </div>
          )}
        </div>
      </div>
      {ip != null && <div style={{ marginTop: 22 }}><SubnetRuler ip={ip} prefix={prefix} /></div>}
      <div style={{ marginTop: 26 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Cheat sheet</div>
        <div className="scroll-x">
          <table className="table">
            <thead><tr><th>Prefix</th><th>Mask</th><th>Block</th><th>Hosts</th></tr></thead>
            <tbody>
              {[24, 25, 26, 27, 28, 29, 30].map((n) => (
                <tr key={n} className={`click ${n === prefix ? 'sel' : ''}`} onClick={() => setPrefix(n)}>
                  <td className="mono">/{n}</td>
                  <td className="mono">{intToIp(prefixToMask(n))}</td>
                  <td className="mono">{2 ** (32 - n)}</td>
                  <td className="mono">{2 ** (32 - n) - 2}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── 3. VLSM planner ─────────────────────────

const minPrefix = (hosts) => {
  for (let p = 30; p >= 1; p--) if (2 ** (32 - p) - 2 >= hosts) return p;
  return 1;
};

const TEMPLATES = [[100, 50, 20, 2], [120, 60, 25, 10], [60, 30, 12, 2], [90, 40, 20, 6], [50, 25, 25, 2], [110, 28, 14, 2]];
const NAMES = ['Sales', 'Engineering', 'Guest Wi-Fi', 'Servers', 'Voice', 'Printers'];

function makeVlsm() {
  const t = pick(TEMPLATES);
  const names = shuffle(NAMES);
  const reqs = t.map((h, i) => {
    const p = minPrefix(h);
    const lo = p === 30 ? 2 : 2 ** (32 - p - 1) - 1; // smallest count that still needs this prefix
    const hosts = p === 30 ? 2 : randInt(lo, Math.min(h, 2 ** (32 - p) - 2));
    return { id: i, name: hosts === 2 ? 'Router link' : names[i], hosts };
  });
  return { base: ipToInt(`192.168.${randInt(1, 254)}.0`), reqs };
}

export function Vlsm() {
  const [sc, setSc] = useState(makeVlsm);
  const [pref, setPref] = useState({});
  const [checked, setChecked] = useState(false);

  const chosen = sc.reqs.filter((r) => pref[r.id]);
  // Allocate largest blocks first so every block stays aligned.
  const order = [...chosen].sort((a, b) => pref[a.id] - pref[b.id]);
  let cursor = 0;
  const alloc = {};
  for (const r of order) {
    const size = 2 ** (32 - pref[r.id]);
    alloc[r.id] = { start: cursor, size };
    cursor += size;
  }
  const overflow = cursor > 256;
  const allSet = chosen.length === sc.reqs.length;
  const verdict = (r) => {
    const p = pref[r.id];
    if (!p) return null;
    const best = minPrefix(r.hosts);
    if (p > best) return 'small';
    if (p < best) return 'big';
    return 'ok';
  };
  const allOk = allSet && !overflow && sc.reqs.every((r) => verdict(r) === 'ok');
  const wasted = chosen.reduce((a, r) => a + (alloc[r.id].size - 2 - r.hosts), 0);

  const W = 640;
  const x = (v) => (v / 256) * W;

  return (
    <div>
      <Task>
        Split <b className="mono">{intToIp(sc.base)}/24</b> into these subnets. Give each one the smallest prefix that fits its hosts.
      </Task>
      <div className="rows">
        {sc.reqs.map((r, i) => {
          const v = checked ? verdict(r) : null;
          const a = alloc[r.id];
          return (
            <div key={r.id} className="vrow">
              <span>
                <b>{String.fromCharCode(65 + i)} · {r.name}</b>
                <span className="muted small"> needs {r.hosts} hosts</span>
              </span>
              <select
                className={`input ${v === 'ok' ? 'good' : v ? 'bad' : ''}`}
                value={pref[r.id] || ''}
                onChange={(e) => { setPref((p) => ({ ...p, [r.id]: Number(e.target.value) || undefined })); setChecked(false); }}
                aria-label={`Prefix for ${r.name}`}
              >
                <option value="">Prefix…</option>
                {[25, 26, 27, 28, 29, 30].map((n) => (
                  <option key={n} value={n}>/{n} · {2 ** (32 - n) - 2} hosts</option>
                ))}
              </select>
              <span className="mono small">
                {a && !overflow ? <>{intToIp(sc.base + a.start)}/{pref[r.id]} <span className="faint">.{a.start}–.{a.start + a.size - 1}</span></> : <span className="faint">—</span>}
                {v === 'small' && <span className="bad-text"> too small</span>}
                {v === 'big' && <span className="bad-text"> wasteful</span>}
              </span>
            </div>
          );
        })}
      </div>

      <svg className="diagram" viewBox={`0 0 ${W} 70`} style={{ marginTop: 18 }} role="img" aria-label="Address space usage">
        <rect x={x(0)} y={14} width={x(256) - x(0)} height={26} style={{ fill: 'var(--track)' }} />
        {order.map((r) => {
          const a = alloc[r.id];
          if (a.start >= 256) return null;
          const end = Math.min(256, a.start + a.size);
          const letter = String.fromCharCode(65 + sc.reqs.indexOf(r));
          const usedW = ((Math.min(r.hosts + 2, a.size)) / a.size) * (x(end) - x(a.start));
          return (
            <g key={r.id}>
              <rect x={x(a.start)} y={14} width={x(end) - x(a.start) - 1.5} height={26} style={{ fill: 'var(--s3)' }} />
              <rect x={x(a.start)} y={14} width={Math.max(2, usedW - 1.5)} height={26} style={{ fill: 'var(--ink)' }} />
              {x(end) - x(a.start) > 18 && <text x={x(a.start) + 6} y={32} className="on-ink" style={{ fontSize: 12, fontWeight: 700 }}>{letter}</text>}
              <text x={x(a.start)} y={56} className="mono faint" style={{ fontSize: 10 }}>.{a.start}</text>
            </g>
          );
        })}
        {overflow && <rect x={x(0)} y={14} width={x(256) - x(0)} height={26} style={{ fill: 'none', stroke: 'var(--bad)', strokeWidth: 2 }} />}
        <text x={x(256)} y={56} textAnchor="end" className="mono faint" style={{ fontSize: 10 }}>.255</text>
      </svg>
      <div className="legend" style={{ marginTop: 4 }}>
        <span><i className="ink" />Hosts needed</span>
        <span><i style={{ background: 'var(--s3)' }} />Spare in the block</span>
        <span><i />Unallocated</span>
      </div>

      {overflow && <p className="bad-text small" style={{ marginTop: 12 }}>Those blocks need {cursor} addresses, more than the /24's 256.</p>}
      {checked && (
        <div className={`follow ${allOk ? 'good' : 'bad'}`}>
          <div className="follow-k">{allOk ? 'Efficient plan' : 'Not quite'}</div>
          <p className="rest">
            {allOk
              ? `Every subnet fits with the smallest block. ${256 - cursor} addresses remain free for growth.`
              : 'A block is either too small for its hosts or bigger than it needs to be. Usable hosts = 2^host bits − 2.'}
          </p>
        </div>
      )}
      <div className="qactions">
        {allOk && checked ? (
          <button className="btn primary" onClick={() => { setSc(makeVlsm()); setPref({}); setChecked(false); }}>New network →</button>
        ) : (
          <button className="btn primary" disabled={!allSet} onClick={() => setChecked(true)}>Check plan</button>
        )}
        <button className="tbtn" onClick={() => { setPref(Object.fromEntries(sc.reqs.map((r) => [r.id, minPrefix(r.hosts)]))); setChecked(true); }}>Show answer</button>
        <button className="tbtn" onClick={() => { setSc(makeVlsm()); setPref({}); setChecked(false); }}>New network</button>
        {allSet && !overflow && <span className="faint small">{wasted} spare addresses inside blocks</span>}
      </div>
    </div>
  );
}
