import { MatchDrill, TabbedLab } from './kit.jsx';

// Simplified front-view line drawings of each connector.
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinejoin: 'round' };
const F = { fill: 'currentColor' };

const DRAW = {
  RJ45: (
    <>
      <rect x="28" y="18" width="64" height="44" {...S} />
      {Array.from({ length: 8 }, (_, i) => <rect key={i} x={33 + i * 7.4} y="22" width="3.2" height="14" {...F} />)}
      <path d="M44 62 v14 h32 v-14" {...S} />
      <path d="M52 76 v8 M68 76 v8" {...S} />
    </>
  ),
  RJ11: (
    <>
      <rect x="38" y="20" width="44" height="40" {...S} />
      {Array.from({ length: 6 }, (_, i) => <rect key={i} x={43 + i * 6.2} y="24" width="2.6" height="12" style={{ fill: i === 0 || i === 5 ? 'none' : 'currentColor', stroke: 'currentColor', strokeWidth: 0.8 }} />)}
      <path d="M50 60 v12 h20 v-12" {...S} />
    </>
  ),
  LC: (
    <>
      {[30, 64].map((x) => (
        <g key={x}>
          <rect x={x} y="36" width="26" height="26" {...S} />
          <circle cx={x + 13} cy="49" r="4" {...S} />
          <path d={`M${x + 4} 36 L${x + 8} 22 L${x + 20} 22`} {...S} />
        </g>
      ))}
      <path d="M38 22 h44" {...S} strokeWidth="3" />
      <path d="M40 62 v14 h40 v-14" {...S} />
    </>
  ),
  SC: (
    <>
      <rect x="36" y="16" width="48" height="56" {...S} />
      <rect x="44" y="24" width="32" height="40" {...S} />
      <circle cx="60" cy="44" r="8" {...S} />
      <circle cx="60" cy="44" r="2.5" {...F} />
    </>
  ),
  ST: (
    <>
      <circle cx="60" cy="45" r="30" {...S} />
      {Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * Math.PI * 2;
        return <line key={i} x1={60 + 30 * Math.cos(a)} y1={45 + 30 * Math.sin(a)} x2={60 + 34 * Math.cos(a)} y2={45 + 34 * Math.sin(a)} stroke="currentColor" strokeWidth="1.6" />;
      })}
      <circle cx="60" cy="45" r="11" {...S} />
      <circle cx="60" cy="45" r="3" {...F} />
      <path d="M86 40 h10 v10 h-6" {...S} />
    </>
  ),
  MPO: (
    <>
      <rect x="14" y="28" width="92" height="34" {...S} />
      <rect x="22" y="36" width="76" height="18" {...S} />
      <circle cx="29" cy="45" r="3.5" {...S} />
      <circle cx="91" cy="45" r="3.5" {...S} />
      {Array.from({ length: 12 }, (_, i) => <circle key={i} cx={37 + i * 4.2} cy="45" r="1.4" {...F} />)}
    </>
  ),
  'F-type': (
    <>
      <path d="M60 13 L88 29 L88 61 L60 77 L32 61 L32 29 Z" {...S} />
      <circle cx="60" cy="45" r="19" {...S} />
      <circle cx="60" cy="45" r="11" style={{ fill: 'currentColor', opacity: 0.15 }} />
      <circle cx="60" cy="45" r="2.6" {...F} />
    </>
  ),
  BNC: (
    <>
      <circle cx="60" cy="45" r="26" {...S} />
      <rect x="27" y="41" width="8" height="8" {...F} />
      <rect x="85" y="41" width="8" height="8" {...F} />
      <circle cx="60" cy="45" r="15" {...S} />
      <circle cx="60" cy="45" r="8" style={{ fill: 'currentColor', opacity: 0.15 }} />
      <circle cx="60" cy="45" r="2.6" {...F} />
      <path d="M44 74 h32" {...S} />
    </>
  ),
  SFP: (
    <>
      <rect x="30" y="18" width="60" height="44" {...S} />
      <rect x="38" y="28" width="18" height="18" {...S} />
      <rect x="64" y="28" width="18" height="18" {...S} />
      <circle cx="47" cy="37" r="2.5" {...F} />
      <circle cx="73" cy="37" r="2.5" {...F} />
      <path d="M36 62 v14 h48 v-14" {...S} />
    </>
  ),
  QSFP: (
    <>
      <rect x="18" y="20" width="84" height="40" {...S} />
      <rect x="32" y="30" width="56" height="18" {...S} />
      {Array.from({ length: 8 }, (_, i) => <circle key={i} cx={42 + i * 5.2} cy="39" r="1.4" {...F} />)}
      <path d="M52 60 v18 h16 v-18" {...S} />
    </>
  ),
};

const CONNECTORS = [
  { name: 'RJ45', medium: 'Copper twisted pair', use: '8P8C plug for twisted-pair Ethernet (Cat5e/6/6a)' },
  { name: 'RJ11', medium: 'Copper twisted pair', use: 'Smaller 6-position plug for telephone lines and DSL' },
  { name: 'LC', medium: 'Fiber', use: 'Small form-factor latch fiber connector, usually duplex; the standard on SFPs' },
  { name: 'SC', medium: 'Fiber', use: 'Square push-pull fiber connector; common in PON/FTTH and older switches' },
  { name: 'ST', medium: 'Fiber', use: 'Round bayonet twist-lock fiber connector; legacy multimode runs' },
  { name: 'MPO', medium: 'Fiber', use: 'Multi-fiber (12/24) ribbon connector for 40/100G parallel optics' },
  { name: 'F-type', medium: 'Coax', use: 'Threaded coax connector for cable TV and cable modems (RG-6)' },
  { name: 'BNC', medium: 'Coax', use: 'Bayonet coax connector; legacy 10BASE2 Ethernet and CCTV/video' },
  { name: 'SFP', medium: 'Transceiver', use: 'Hot-swappable single-lane module (1G; SFP+ = 10G, SFP28 = 25G)' },
  { name: 'QSFP', medium: 'Transceiver', use: 'Quad-lane hot-swappable module (40G; QSFP28 = 100G)' },
];

const CABLES = [
  { name: 'Cat5e', spec: '1 Gbps up to 100 m' },
  { name: 'Cat6', spec: '1 Gbps at 100 m; 10 Gbps only up to ~55 m' },
  { name: 'Cat6a', spec: '10 Gbps up to 100 m' },
  { name: 'Cat7', spec: '10 Gbps up to 100 m, individually shielded pairs' },
  { name: 'Cat8', spec: '25/40 Gbps up to 30 m (data center)' },
  { name: 'Single-mode fiber (SMF)', spec: 'Tiny ~9 µm core, laser light, runs of many kilometers' },
  { name: 'Multimode fiber (MMF)', spec: '50/62.5 µm core, LED/VCSEL light, runs of a few hundred meters' },
  { name: 'Twinax (DAC)', spec: 'Short copper direct-attach cable between SFP+ ports in a rack' },
  { name: 'Coax RG-6', spec: 'Cable TV and cable broadband with F-type connectors' },
  { name: 'Plenum-rated cable', spec: 'Fire-retardant, low-smoke jacket required in air-handling spaces' },
  { name: 'STP', spec: 'Twisted pair with shielding to resist EMI near motors and lights' },
];

const STANDARDS = [
  { name: '1000BASE-T', spec: '1 Gbps over Cat5e or better copper, 100 m' },
  { name: '10GBASE-T', spec: '10 Gbps over Cat6a copper, 100 m' },
  { name: '1000BASE-SX', spec: '1 Gbps over multimode fiber, short wavelength' },
  { name: '1000BASE-LX', spec: '1 Gbps over single-mode fiber, long wavelength (km)' },
  { name: '10GBASE-SR', spec: '10 Gbps over multimode fiber, short range (~300–400 m)' },
  { name: '10GBASE-LR', spec: '10 Gbps over single-mode fiber, up to 10 km' },
  { name: '100BASE-TX', spec: '100 Mbps Fast Ethernet over Cat5 copper' },
];

const Pic = ({ name, size = 150 }) => (
  <svg viewBox="0 0 120 90" width={size} height={(size * 90) / 120} role="img" aria-label="Connector drawing" style={{ color: 'var(--text)', display: 'block' }}>
    {DRAW[name]}
  </svg>
);

function Gallery() {
  return (
    <div className="section">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', borderTop: '1px solid var(--line)', borderLeft: '1px solid var(--line)' }}>
        {CONNECTORS.map((c) => (
          <div key={c.name} style={{ padding: 16, borderRight: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }} className="stack">
            <Pic name={c.name} size={110} />
            <div className="row between">
              <b>{c.name}</b>
              <span className="pill">{c.medium}</span>
            </div>
            <p className="muted" style={{ fontSize: 13.5 }}>{c.use}</p>
          </div>
        ))}
      </div>
      <p className="faint" style={{ fontSize: 12.5, marginTop: 12 }}>Drawings are simplified front views, not to scale.</p>
    </div>
  );
}

export default function Cables() {
  return (
    <TabbedLab
      tabs={[
        { value: 'gallery', label: 'Gallery', render: () => <Gallery /> },
        {
          value: 'identify',
          label: 'Identify',
          render: () => (
            <MatchDrill
              intro="Name the connector from its front view."
              modes={[
                { label: 'Picture → name', items: CONNECTORS, prompt: (c) => <Pic name={c.name} />, answer: (c) => c.name, note: (c) => `${c.name}: ${c.use}.` },
                { label: 'Use → name', items: CONNECTORS, prompt: (c) => c.use, answer: (c) => c.name, small: true },
              ]}
            />
          ),
        },
        {
          value: 'cables',
          label: 'Cable specs',
          render: () => (
            <MatchDrill
              modes={[
                { label: 'Cable → spec', items: CABLES, prompt: (c) => c.name, answer: (c) => c.spec },
                { label: 'Spec → cable', items: CABLES, prompt: (c) => c.spec, answer: (c) => c.name, small: true },
              ]}
            />
          ),
        },
        {
          value: 'standards',
          label: 'Ethernet standards',
          render: () => (
            <MatchDrill
              intro="Read the name: speed · BASE (baseband) · medium. T = twisted pair, S = short-reach multimode, L = long-reach single-mode."
              modes={[
                { label: 'Standard → meaning', items: STANDARDS, prompt: (c) => <span className="mono">{c.name}</span>, answer: (c) => c.spec },
                { label: 'Meaning → standard', items: STANDARDS, prompt: (c) => c.spec, answer: (c) => c.name, small: true },
              ]}
            />
          ),
        },
      ]}
    />
  );
}
