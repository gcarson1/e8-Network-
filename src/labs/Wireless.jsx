import { useState } from 'react';
import { MatchDrill, TabbedLab } from './kit.jsx';

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

function Explorer() {
  const [band, setBand] = useState('all');
  const [sel, setSel] = useState('802.11ax');
  const shown = STDS.filter((s) => band === 'all' || s.bands.includes(band));
  const x = (v) => (Math.log10(v / 10) / 3) * 100; // 10 Mbps … 10 Gbps
  const cur = STDS.find((s) => s.std === sel);

  return (
    <>
      <div className="section stack">
        <div className="row">
          <span className="muted" style={{ fontSize: 14 }}>Filter by band</span>
          <div className="chips">
            {['all', '2.4', '5', '6'].map((b) => (
              <button key={b} className="chip" aria-pressed={band === b} onClick={() => setBand(b)}>
                <span className="box" />
                {b === 'all' ? 'All' : `${b} GHz`}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="section stack">
        <div className="eyebrow">Max theoretical data rate (log scale)</div>
        <div className="stack" style={{ gap: 4 }}>
          {shown.map((s) => (
            <button
              key={s.std}
              onClick={() => setSel(s.std)}
              style={{ display: 'grid', gridTemplateColumns: '92px minmax(0,1fr) 88px', gap: 12, alignItems: 'center', background: sel === s.std ? 'var(--hover)' : 'none', border: 0, padding: '6px 4px', textAlign: 'left' }}
              aria-pressed={sel === s.std}
            >
              <span className="mono" style={{ fontWeight: 650, fontSize: 13 }}>{s.std}</span>
              <span style={{ position: 'relative', height: 14, background: 'var(--track)' }}>
                <span style={{ position: 'absolute', inset: 0, width: `${x(s.rate)}%`, background: sel === s.std ? 'var(--fill)' : 'var(--shade-2)' }} />
              </span>
              <span className="mono" style={{ fontSize: 12.5, textAlign: 'right' }}>{s.rateLabel}</span>
            </button>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '92px minmax(0,1fr) 88px', gap: 12, padding: '0 4px' }}>
            <span />
            <span className="mono faint" style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
              <span>10M</span><span>100M</span><span>1G</span><span>10G</span>
            </span>
          </div>
        </div>
      </div>
      {cur && (
        <div className="section two-col">
          <div className="stack">
            <h3>{cur.std} {cur.gen !== '—' && <span className="pill solid" style={{ marginLeft: 8 }}>{cur.gen}</span>}</h3>
            <p className="muted">{cur.tech}</p>
          </div>
          <div className="kv">
            <div>Year</div><div>{cur.year}{cur.std === '802.11ax' ? ' (6E: 2020)' : ''}</div>
            <div>Band(s)</div><div>{cur.bands.map((b) => `${b} GHz`).join(' + ')}</div>
            <div>Max rate</div><div>{cur.rateLabel}</div>
            <div>Channel width</div><div>{cur.width}</div>
          </div>
        </div>
      )}
      <div className="section">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Standard</th><th>Name</th><th>Band</th><th>Max rate</th><th>Width</th></tr></thead>
            <tbody>
              {STDS.map((s) => (
                <tr key={s.std} className={`clickable ${sel === s.std ? 'sel' : ''}`} onClick={() => setSel(s.std)} style={{ opacity: shown.includes(s) ? 1 : 0.35 }}>
                  <td className="mono" style={{ fontWeight: 650 }}>{s.std}</td>
                  <td>{s.gen}</td>
                  <td className="mono">{s.bands.join(' / ')} GHz</td>
                  <td className="mono">{s.rateLabel}</td>
                  <td className="mono">{s.width}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="section stack">
        <div className="eyebrow">Band trade-offs</div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Band</th><th>Range</th><th>Channels</th><th>Notes</th></tr></thead>
            <tbody>
              {Object.values(BANDS).map((b) => (
                <tr key={b.name}>
                  <td style={{ fontWeight: 650, whiteSpace: 'nowrap' }}>{b.name}</td>
                  <td>{b.range}</td>
                  <td className="muted">{b.channels}</td>
                  <td className="muted">{b.issues}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="faint" style={{ fontSize: 13 }}>Rule of thumb: higher frequency means more bandwidth but less range and penetration.</p>
      </div>
    </>
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

export default function Wireless() {
  return (
    <TabbedLab
      tabs={[
        { value: 'explore', label: 'Standards', render: () => <Explorer /> },
        {
          value: 'drill',
          label: 'Drill',
          render: () => (
            <MatchDrill
              modes={[
                { label: 'Standard → speed', items: STDS, prompt: (s) => <span className="mono">{s.std}</span>, answer: (s) => s.rateLabel, note: (s) => `${s.std}: ${s.bands.join('/')} GHz · ${s.tech}` },
                { label: 'Standard → band', items: STDS, prompt: (s) => <span className="mono">{s.std}</span>, answer: (s) => `${s.bands.join(' + ')} GHz`, note: (s) => s.tech },
                {
                  label: 'Wi-Fi name → standard',
                  items: STDS.filter((s) => s.gen !== '—'),
                  prompt: (s) => s.gen,
                  answer: (s) => s.std,
                  pool: STDS.map((s) => s.std),
                },
                { label: 'Security', items: SECURITY, prompt: (s) => s.k, answer: (s) => s.v },
              ]}
            />
          ),
        },
      ]}
    />
  );
}
