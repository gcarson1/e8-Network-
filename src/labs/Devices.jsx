import { MatchDrill, TabbedLab } from './kit.jsx';

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
  <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" style={{ color: 'var(--text)', flex: 'none' }}>
    {ICON[name]}
  </svg>
);

const withLayer = DEVICES.filter((d) => /^Layer/.test(d.layer));

function Reference() {
  return (
    <div className="section">
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th /><th>Device</th><th>Layer</th><th>What it does</th></tr></thead>
          <tbody>
            {DEVICES.map((d) => (
              <tr key={d.name}>
                <td style={{ width: 52 }}><Icon name={d.name} size={36} /></td>
                <td style={{ fontWeight: 600 }}>{d.name}</td>
                <td className="mono" style={{ whiteSpace: 'nowrap' }}>{d.layer}</td>
                <td className="muted">{d.fn}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Devices() {
  return (
    <TabbedLab
      tabs={[
        {
          value: 'drill',
          label: 'Drill',
          render: () => (
            <MatchDrill
              modes={[
                {
                  label: 'Device → job',
                  items: DEVICES,
                  prompt: (d) => <span className="row" style={{ gap: 16 }}><Icon name={d.name} />{d.name}</span>,
                  answer: (d) => d.fn,
                  note: (d) => `${d.name} · ${d.layer}`,
                },
                { label: 'Job → device', items: DEVICES, prompt: (d) => d.fn, answer: (d) => d.name, small: true },
                {
                  label: 'Device → OSI layer',
                  items: withLayer,
                  prompt: (d) => <span className="row" style={{ gap: 16 }}><Icon name={d.name} />{d.name}</span>,
                  answer: (d) => d.layer,
                  note: (d) => d.fn,
                },
              ]}
            />
          ),
        },
        { value: 'ref', label: 'Reference', render: () => <Reference /> },
      ]}
    />
  );
}
