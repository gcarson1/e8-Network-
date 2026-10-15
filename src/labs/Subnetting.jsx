import { useState } from 'react';
import { Seg } from '../components/ui.jsx';
import { intToIp, ipToInt, octetBits, parseCidrOrMask, prefixToMask, subnetInfo } from '../lib/net.js';
import { pick, randInt } from '../lib/util.js';

const LEVELS = {
  easy: { label: 'Easy · /24–/30', min: 24, max: 30 },
  medium: { label: 'Medium · /16–/30', min: 16, max: 30 },
  hard: { label: 'Hard · /8–/30', min: 8, max: 30 },
};

function makeProblem(level) {
  const { min, max } = LEVELS[level];
  const first = pick([10, 172, 192, randInt(1, 223)]);
  let o1 = first;
  let o2 = randInt(0, 255);
  if (first === 172) o2 = randInt(16, 31);
  if (first === 192) o2 = 168;
  if (o1 === 127) o1 = 126;
  const ip = ipToInt(`${o1}.${o2}.${randInt(0, 255)}.${randInt(1, 254)}`);
  const prefix = randInt(min, max);
  return { ip, prefix, useMask: Math.random() < 0.5 };
}

const FIELDS = [
  ['network', 'Network address'],
  ['broadcast', 'Broadcast address'],
  ['first', 'First usable host'],
  ['last', 'Last usable host'],
  ['hosts', 'Usable hosts'],
  ['mask', 'Mask / CIDR'],
];

export default function Subnetting() {
  const [level, setLevel] = useState('easy');
  const [p, setP] = useState(() => makeProblem('easy'));
  const [ans, setAns] = useState({});
  const [checked, setChecked] = useState(null); // { field: bool }
  const [showWork, setShowWork] = useState(false);
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
      else r[k] = ipToInt(v) === ipToInt(expected[k]) && ipToInt(v) != null;
    }
    const all = Object.values(r).every(Boolean);
    setChecked(r);
    setShowWork(!all);
    setTally((t) => ({ solved: t.solved + (all ? 1 : 0), tried: t.tried + 1 }));
  };

  const next = (lvl = level) => {
    setP(makeProblem(lvl));
    setAns({});
    setChecked(null);
    setShowWork(false);
  };

  const allRight = checked && Object.values(checked).every(Boolean);
  const maskStr = intToIp(prefixToMask(p.prefix));

  return (
    <>
      <div className="section stack">
        <div className="row between">
          <Seg
            label="Difficulty"
            value={level}
            onChange={(v) => {
              setLevel(v);
              next(v);
            }}
            options={Object.entries(LEVELS).map(([value, l]) => ({ value, label: l.label }))}
          />
          <span className="mono muted" style={{ fontSize: 13 }}>
            {tally.solved}/{tally.tried} solved
          </span>
        </div>
      </div>
      <div className="section stack-lg">
        <div>
          <div className="eyebrow plain">Find everything about this subnet</div>
          <div className="drill-prompt mono" style={{ marginTop: 10 }}>
            {intToIp(p.ip)}
            {p.useMask ? <span className="muted"> mask {maskStr}</span> : <span className="muted">/{p.prefix}</span>}
          </div>
        </div>
        <form
          className="answer-grid"
          onSubmit={(e) => {
            e.preventDefault();
            if (checked) next();
            else grade();
          }}
        >
          {FIELDS.map(([k, label]) => (
            <div key={k}>
              <label htmlFor={`sn-${k}`}>{k === 'mask' ? (p.useMask ? 'CIDR prefix (e.g. /26)' : 'Subnet mask (dotted)') : label}</label>
              <input
                id={`sn-${k}`}
                className={`input ${checked ? (checked[k] ? 'ok' : 'bad') : ''}`}
                value={ans[k] || ''}
                onChange={(e) => setAns((a) => ({ ...a, [k]: e.target.value }))}
                inputMode={k === 'hosts' ? 'numeric' : 'decimal'}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                readOnly={!!checked}
                placeholder={k === 'hosts' ? 'e.g. 62' : k === 'mask' ? (p.useMask ? '/__' : '255.255.___.___') : '___.___.___.___'}
              />
              {checked && !checked[k] && <div className="expect">{expected[k]}</div>}
            </div>
          ))}
          <button type="submit" hidden />
        </form>
        {checked && (
          <div className={`callout ${allRight ? 'ok' : 'bad'}`}>
            <p className={allRight ? 'ok-text' : 'bad-text'} style={{ fontWeight: 650 }}>
              {allRight ? 'All correct.' : `${Object.values(checked).filter((x) => !x).length} of ${FIELDS.length} need another look. Expected answers are shown in green under each field.`}
            </p>
          </div>
        )}
        <div className="row">
          {!checked ? (
            <button className="btn primary" onClick={grade}>Check answers</button>
          ) : (
            <button className="btn primary" onClick={() => next()}>Next subnet →</button>
          )}
          <button className="btn link" onClick={() => setShowWork((s) => !s)}>
            {showWork ? 'Hide the binary' : 'Show the binary'}
          </button>
          {!checked && <button className="btn link" onClick={() => next()}>Skip</button>}
        </div>
      </div>
      {showWork && <BinaryWork ip={p.ip} prefix={p.prefix} />}
    </>
  );
}

export function BinaryWork({ ip, prefix }) {
  const info = subnetInfo(ip, prefix);
  const rows = [
    ['IP address', ip],
    ['Subnet mask', info.mask],
    ['Network', info.network, 'AND the IP with the mask: host bits become 0'],
    ['Broadcast', info.broadcast, 'Set every host bit to 1'],
  ];
  const octet = Math.min(3, Math.floor(prefix / 8));
  const maskOctet = (info.mask >>> (24 - octet * 8)) & 255;
  const block = 256 - maskOctet;
  const ipOctet = (ip >>> (24 - octet * 8)) & 255;
  const start = Math.floor(ipOctet / block) * block;
  const ord = ['1st', '2nd', '3rd', '4th'][octet];
  const hostBits = 32 - prefix;

  return (
    <div className="section stack-lg">
      <div className="eyebrow">How it works</div>
      <div className="bitwrap">
        {rows.map(([label, val, hint]) => (
          <div className="bitrow" key={label} title={hint}>
            <span className="lbl">{label}</span>
            <Bits value={val} prefix={prefix} />
            <span className="dec">{intToIp(val)}</span>
          </div>
        ))}
      </div>
      <div className="legend">
        <span><i style={{ background: 'var(--fill)' }} />Network bits ({prefix})</span>
        <span><i />Host bits ({hostBits})</span>
      </div>
      <div className="stack" style={{ maxWidth: '68ch' }}>
        <p>
          <b>/{prefix}</b> leaves <b>{hostBits}</b> host bits, so 2<sup>{hostBits}</sup> = {info.total.toLocaleString()} addresses
          {prefix <= 30 ? <> and {info.total.toLocaleString()} − 2 = <b>{info.usable.toLocaleString()} usable hosts</b> (network and broadcast are reserved).</> : '.'}
        </p>
        {prefix % 8 !== 0 ? (
          <p>
            The interesting octet is the <b>{ord}</b> (mask value {maskOctet}). Block size = 256 − {maskOctet} = <b>{block}</b>, so subnets in that octet start at
            0, {block}, {block * 2}… The address's {ord} octet is {ipOctet}, which falls in the block starting at <b>{start}</b> and ending at <b>{start + block - 1}</b>.
          </p>
        ) : (
          <p>The mask falls exactly on an octet boundary, so the network keeps the first {prefix / 8} octet{prefix === 8 ? '' : 's'} and zeroes the rest.</p>
        )}
      </div>
    </div>
  );
}

export function Bits({ value, prefix, compare }) {
  const octs = octetBits(value);
  const cmp = compare != null ? octetBits(compare) : null;
  return (
    <div className="bits" aria-label={octs.join('.')}>
      {octs.map((o, oi) => (
        <span className="octet" key={oi}>
          {[...o].map((b, bi) => {
            const idx = oi * 8 + bi;
            const diff = cmp && cmp[oi][bi] !== b;
            return (
              <span key={bi} className={`bit ${idx < prefix ? 'net' : 'host'} ${diff ? 'diff' : ''}`}>
                {b}
              </span>
            );
          })}
        </span>
      ))}
    </div>
  );
}
