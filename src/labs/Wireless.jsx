import { useState } from 'react';
import { MatchDrill, PanHint, Task } from './kit.jsx';

const STDS = [
  { std: '802.11a', gen: '—', year: 1999, bands: ['5'], rate: 54, rateLabel: '54 Mbps', width: '20 MHz', tech: 'OFDM. First 5 GHz standard.' },
  { std: '802.11b', gen: '—', year: 1999, bands: ['2.4'], rate: 11, rateLabel: '11 Mbps', width: '22 MHz', tech: 'DSSS. Very common early 2.4 GHz Wi-Fi.' },
  { std: '802.11g', gen: '—', year: 2003, bands: ['2.4'], rate: 54, rateLabel: '54 Mbps', width: '20 MHz', tech: 'OFDM at 2.4 GHz, backward compatible with b.' },
  { std: '802.11n', gen: 'Wi-Fi 4', year: 2009, bands: ['2.4', '5'], rate: 600, rateLabel: '600 Mbps', width: '20/40 MHz', tech: 'MIMO (up to 4 spatial streams) and channel bonding.' },
  { std: '802.11ac', gen: 'Wi-Fi 5', year: 2013, bands: ['5'], rate: 6933, rateLabel: '≈6.9 Gbps', width: 'up to 160 MHz', tech: 'Downlink MU-MIMO, 256-QAM, beamforming. 5 GHz only.' },
  { std: '802.11ax', gen: 'Wi-Fi 6 / 6E', year: 2019, bands: ['2.4', '5', '6'], rate: 9608, rateLabel: '≈9.6 Gbps', width: 'up to 160 MHz', tech: 'OFDMA, uplink + downlink MU-MIMO, 1024-QAM, BSS coloring. 6E adds the 6 GHz band.' },
];

const BANDS = {
  '2.4': {
    name: '2.4 GHz',
    range: 'Longest range, best wall penetration',
    channels: '3 non-overlapping 20 MHz channels in the US: 1, 6, 11',
    issues: 'Crowded. Interference from microwaves, Bluetooth, cordless phones and neighbors.',
  },
  '5': {
    name: '5 GHz',
    range: 'Shorter range than 2.4 GHz',
    channels: '~25 non-overlapping 20 MHz channels; some are DFS (must avoid radar)',
    issues: 'Much less congestion. Bond channels to 40/80/160 MHz for speed.',
  },
  '6': {
    name: '6 GHz (Wi-Fi 6E)',
    range: 'Shortest range of the three',
    channels: '59 × 20 MHz or 7 × 160 MHz channels (US)',
    issues: 'Clean spectrum, Wi-Fi 6E+ devices only, WPA3 required.',
  },
};

export function WirelessStandards() {
  const [band, setBand] = useState('all');
  const [sel, setSel] = useState('802.11ax');
  const shown = STDS.filter((s) => band === 'all' || s.bands.includes(band));
  const x = (v) => (Math.log10(v / 10) / 3) * 100; // 10 Mbps … 10 Gbps
  const cur = STDS.find((s) => s.std === sel);

  return (
    <div>
      <Task>Tap a standard for details. Filter by band to see which ones share a frequency.</Task>
      <div className="toggles" style={{ marginBottom: 'var(--sp-5)' }}>
        {['all', '2.4', '5', '6'].map((b) => (
          <button key={b} className="toggle" aria-pressed={band === b} onClick={() => setBand(b)}>{b === 'all' ? 'All bands' : `${b} GHz`}</button>
        ))}
      </div>
      <div className="eyebrow" style={{ marginBottom: 'var(--sp-2)' }}>Max data rate · log scale</div>
      <div className="rows">
        {shown.map((s) => (
          <button key={s.std} className="rateRow" onClick={() => setSel(s.std)} aria-pressed={sel === s.std}>
            <span className="mono" style={{ fontWeight: 600, fontSize: 'var(--fs-13)' }}>{s.std}</span>
            <span className="meter thick ink" style={{ height: '0.75rem' }}><span style={{ width: `${x(s.rate)}%`, background: sel === s.std ? 'var(--ink)' : 'var(--s2)' }} /></span>
            <span className="mono small" style={{ textAlign: 'right' }}>{s.rateLabel}</span>
          </button>
        ))}
      </div>
      <div className="rateRow" style={{ border: 0, cursor: 'default' }} aria-hidden="true">
        <span />
        <span className="mono faint" style={{ fontSize: 'var(--fs-11)', display: 'flex', justifyContent: 'space-between' }}><span>10M</span><span>100M</span><span>1G</span><span>10G</span></span>
        <span />
      </div>
      {cur && (
        <div className="grid-2" style={{ marginTop: 'var(--sp-5)' }}>
          <div>
            <h3>{cur.std}{cur.gen !== '—' ? ` · ${cur.gen}` : ''}</h3>
            <p className="muted small" style={{ marginTop: 'var(--sp-1h)' }}>{cur.tech}</p>
          </div>
          <div className="kv">
            <div>Band</div><div>{cur.bands.map((b) => `${b} GHz`).join(' + ')}</div>
            <div>Max rate</div><div>{cur.rateLabel}</div>
            <div>Channel width</div><div>{cur.width}</div>
            <div>Year</div><div>{cur.year}{cur.std === '802.11ax' ? ' (6E certification: 2021)' : ''}</div>
          </div>
        </div>
      )}
      <div style={{ marginTop: 'var(--sp-7)' }}>
        <div className="eyebrow" style={{ marginBottom: 'var(--sp-2)' }}>Band trade-offs</div>
        <div className="scroll-x">
          <table className="table">
            <thead><tr><th>Band</th><th>Range</th><th>Channels</th><th>Notes</th></tr></thead>
            <tbody>
              {Object.values(BANDS).map((b) => (
                <tr key={b.name}><td style={{ whiteSpace: 'nowrap' }}><b>{b.name}</b></td><td>{b.range}</td><td className="muted">{b.channels}</td><td className="muted">{b.issues}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="faint small" style={{ marginTop: 'var(--sp-2)' }}>Higher frequency: more bandwidth, less range and wall penetration.</p>
      </div>
    </div>
  );
}

const SECURITY = [
  { k: 'WEP', v: 'Broken RC4-based encryption; never use' },
  { k: 'WPA (TKIP)', v: 'Stopgap fix for WEP; now deprecated' },
  { k: 'WPA2-Personal', v: 'AES-CCMP with a pre-shared key (PSK)' },
  { k: 'WPA2-Enterprise', v: 'AES-CCMP with 802.1X/RADIUS per-user logins' },
  { k: 'WPA3-Personal', v: 'SAE handshake that resists offline dictionary attacks' },
  { k: 'WPA3-Enterprise', v: '802.1X with an optional 192-bit security suite' },
];

export const WirelessDrill = () => (
  <MatchDrill
    task="Speeds, bands and security types."
    modes={[
      { label: 'Standard → speed', items: STDS, prompt: (s) => <span className="mono">{s.std}</span>, answer: (s) => s.rateLabel, note: (s) => `${s.std}: ${s.bands.join('/')} GHz. ${s.tech}` },
      { label: 'Standard → band', items: STDS, prompt: (s) => <span className="mono">{s.std}</span>, answer: (s) => `${s.bands.join(' + ')} GHz`, note: (s) => s.tech },
      { label: 'Wi-Fi name → standard', items: STDS.filter((s) => s.gen !== '—'), prompt: (s) => s.gen, answer: (s) => s.std, pool: STDS.map((s) => s.std) },
      { label: 'Security', items: SECURITY, prompt: (s) => s.k, answer: (s) => s.v },
    ]}
  />
);

// ───────── 2.4 GHz channel planning ─────────
const APS = [
  { id: 'AP1', x: 130, y: 110 }, { id: 'AP2', x: 310, y: 110 }, { id: 'AP3', x: 490, y: 110 },
  { id: 'AP4', x: 220, y: 250 }, { id: 'AP5', x: 400, y: 250 }, { id: 'AP6', x: 580, y: 250 },
];
const NEIGHBORS = [];
APS.forEach((a, i) => APS.forEach((b, j) => {
  if (j > i && Math.hypot(a.x - b.x, a.y - b.y) < 200) NEIGHBORS.push([i, j]);
}));
const CHANNELS = [1, 3, 6, 9, 11];
const overlaps = (a, b) => Math.abs(a - b) < 5;

export function ChannelPlan() {
  const [ch, setCh] = useState(() => APS.map(() => 6));
  const cycle = (i) => setCh((c) => c.map((v, j) => (j === i ? CHANNELS[(CHANNELS.indexOf(v) + 1) % CHANNELS.length] : v)));
  const conflicts = NEIGHBORS.filter(([i, j]) => overlaps(ch[i], ch[j]));
  const solved = conflicts.length === 0;

  // Spectrum: channel n is centered on 2412 + 5(n − 1) MHz and ~22 MHz wide.
  const fx = (mhz) => 20 + ((mhz - 2400) / 86) * 600;
  const used = new Set(ch);

  return (
    <div>
      <Task>Tap an AP to change its channel. Neighbors whose coverage overlaps must not use overlapping channels.</Task>
      <div className="spread" style={{ marginBottom: 'var(--sp-2)' }}>
        <span className="tally">
          {solved ? <b className="good-text">No interference</b> : <><b className="bad-text">{conflicts.length}</b> overlapping neighbor pair{conflicts.length === 1 ? '' : 's'}</>}
        </span>
        <button className="tbtn" onClick={() => setCh(APS.map(() => 6))} style={{ marginRight: 'calc(var(--sp-2) * -1)' }}>Reset</button>
      </div>
      <div className="diagram-scroll">
        <svg className="diagram" viewBox="0 0 680 340" role="img" aria-label="Floor plan with six access points">
          <defs><clipPath id="floor"><rect x={10} y={10} width={660} height={320} /></clipPath></defs>
          <g clipPath="url(#floor)">
            {APS.map((a) => <circle key={a.id} cx={a.x} cy={a.y} r={118} style={{ fill: 'var(--text)', opacity: 0.045 }} />)}
          </g>
          <rect x={10} y={10} width={660} height={320} style={{ fill: 'none', stroke: 'var(--line-strong)', strokeWidth: 2 }} />
          {NEIGHBORS.map(([i, j]) => {
            const bad = overlaps(ch[i], ch[j]);
            const a = APS[i];
            const b = APS[j];
            return (
              <g key={`${i}-${j}`}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={`wire ${bad ? 'cut' : 'soft'}`} strokeWidth={bad ? 2.5 : 1.5} />
                {bad && (
                  <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 6} textAnchor="middle" className="halo" style={{ fontSize: 10.5, fontWeight: 600, fill: 'var(--bad)' }}>
                    {ch[i] === ch[j] ? 'same channel' : 'overlap'}
                  </text>
                )}
              </g>
            );
          })}
          {APS.map((a, i) => (
            <g key={a.id} className="hit" onClick={() => cycle(i)} role="button" aria-label={`${a.id}, channel ${ch[i]}. Activate to change.`}>
              <rect x={a.x - 34} y={a.y - 24} width={68} height={48} className="node ink" />
              <text x={a.x} y={a.y - 6} textAnchor="middle" className="on-ink" style={{ fontSize: 11 }}>{a.id}</text>
              <text x={a.x} y={a.y + 14} textAnchor="middle" className="mono on-ink" style={{ fontSize: 17, fontWeight: 700 }}>{ch[i]}</text>
            </g>
          ))}
        </svg>
      </div>
      <PanHint />
      <div style={{ marginTop: 'var(--sp-4)' }}>
        <div className="eyebrow" style={{ marginBottom: 'var(--sp-1h)' }}>2.4 GHz spectrum in use</div>
        <svg className="diagram" viewBox="0 0 640 86" role="img" aria-label="2.4 GHz channel spectrum">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => {
            const c = 2412 + 5 * (n - 1);
            const on = used.has(n);
            return (
              <g key={n}>
                <path
                  d={`M${fx(c - 11)} 62 Q ${fx(c)} ${on ? -6 : 22} ${fx(c + 11)} 62`}
                  style={{ fill: on ? 'var(--text)' : 'none', fillOpacity: on ? 0.14 : 0, stroke: on ? 'var(--text)' : 'var(--line-strong)', strokeWidth: on ? 2 : 1 }}
                />
                <text x={fx(c)} y={78} textAnchor="middle" className={`mono ${on ? '' : 'faint'}`} style={{ fontSize: 10.5, fontWeight: on ? 700 : 400 }}>{n}</text>
              </g>
            );
          })}
          <line x1={fx(2400)} y1={62} x2={fx(2486)} y2={62} className="wire soft" strokeWidth="1" />
        </svg>
      </div>
      <div className={`follow ${solved ? 'good' : ''}`}>
        <div className="follow-k">{solved ? 'Clean plan' : 'Why it matters'}</div>
        <p className="rest">
          {solved
            ? 'Channels 1, 6 and 11 are the only three in 2.4 GHz that don\'t overlap, so neighbors alternate between them.'
            : 'Each 2.4 GHz channel is about 22 MHz wide but only 5 MHz apart, so nearby channels bleed into each other. Same channel = co-channel interference (APs take turns). Overlapping channels = adjacent-channel interference (worse: corrupted frames).'}
        </p>
      </div>
    </div>
  );
}
