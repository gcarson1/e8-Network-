import { useMemo, useState } from 'react';
import { PanHint } from './kit.jsx';
import { Seg } from '../components/ui.jsx';

// Each topology: nodes (kind: end | infra | tap), links [a, b], directed?
function ringNodes(n, cx, cy, r, prefix = 'PC') {
  return Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return { id: `${prefix}${i + 1}`, x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), kind: 'end' };
  });
}

const TOPOLOGIES = {
  star: (() => {
    const ends = ringNodes(6, 320, 175, 130);
    return {
      label: 'Star',
      nodes: [{ id: 'SW', x: 320, y: 175, kind: 'infra', label: 'Switch' }, ...ends],
      links: ends.map((e) => ['SW', e.id]),
      about: 'Every device has its own cable to a central switch. The most common LAN topology today (also called hub-and-spoke when it connects sites).',
      pros: ['Easy to add, move and troubleshoot one device', 'One cable failure affects only that device'],
      cons: ['The central switch is a single point of failure', 'Uses more cable than a bus'],
      tip: 'Click the switch to fail it.',
    };
  })(),
  mesh: (() => {
    const ends = ringNodes(5, 320, 180, 135, 'R');
    const links = [];
    for (let i = 0; i < ends.length; i++) for (let j = i + 1; j < ends.length; j++) links.push([ends[i].id, ends[j].id]);
    return {
      label: 'Full mesh',
      nodes: ends,
      links,
      about: 'Every node links directly to every other node. Often used between WAN routers or core switches where uptime matters most.',
      pros: ['Highest redundancy: many paths survive failures', 'No single point of failure'],
      cons: ['Links grow fast: n(n−1)/2', 'Expensive and complex to cable and manage'],
      tip: 'Cut several links. Traffic keeps finding a way.',
      formula: true,
    };
  })(),
  partial: (() => {
    const ends = ringNodes(6, 320, 180, 135, 'R');
    const pairs = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 3], [1, 4]];
    return {
      label: 'Partial mesh',
      nodes: ends,
      links: pairs.map(([a, b]) => [ends[a].id, ends[b].id]),
      about: 'Some nodes have redundant links, others do not. A common compromise between cost and resilience in WANs.',
      pros: ['Redundancy where it matters most', 'Cheaper than a full mesh'],
      cons: ['Some failures can still isolate nodes', 'Path planning is less uniform'],
      tip: 'Find the smallest set of cuts that isolates a router.',
    };
  })(),
  bus: (() => {
    const taps = Array.from({ length: 6 }, (_, i) => ({ id: `T${i}`, x: 80 + i * 96, y: 175, kind: 'tap' }));
    const ends = taps.map((t, i) => ({ id: `PC${i + 1}`, x: t.x, y: i % 2 ? 275 : 75, kind: 'end' }));
    return {
      label: 'Bus',
      nodes: [...taps, ...ends],
      links: [...taps.slice(1).map((t, i) => [taps[i].id, t.id]), ...ends.map((e, i) => [taps[i].id, e.id])],
      terminators: true,
      about: 'All devices share one backbone cable with a terminator at each end (legacy coax 10BASE2/10BASE5). Only one device can transmit at a time.',
      pros: ['Very little cable', 'Simple for tiny networks'],
      cons: ['A break in the backbone splits the network (and an unterminated end causes reflections)', 'Collisions grow as devices are added'],
      tip: 'Cut the backbone between two PCs.',
    };
  })(),
  ring: (() => {
    const ends = ringNodes(6, 320, 180, 135);
    return {
      label: 'Ring',
      nodes: ends,
      links: ends.map((e, i) => [e.id, ends[(i + 1) % ends.length].id]),
      directed: true,
      about: 'Each device connects to two neighbors and data travels in one direction around the loop (Token Ring, FDDI, SONET). Dual rings add a backup loop.',
      pros: ['Predictable, orderly access to the medium', 'Dual rings can heal around one break'],
      cons: ['In a single ring, one break or failed node disrupts traffic', 'Adding a device interrupts the ring'],
      tip: 'Cut one link. Traffic only flows one way, so most pairs break.',
    };
  })(),
  hybrid: (() => {
    const core = { id: 'Core', x: 320, y: 60, kind: 'infra', label: 'Core' };
    const access = [130, 320, 510].map((x, i) => ({ id: `SW${i + 1}`, x, y: 170, kind: 'infra', label: `SW${i + 1}` }));
    const ends = access.flatMap((a, i) => [
      { id: `PC${i * 2 + 1}`, x: a.x - 50, y: 290, kind: 'end' },
      { id: `PC${i * 2 + 2}`, x: a.x + 50, y: 290, kind: 'end' },
    ]);
    return {
      label: 'Hybrid',
      nodes: [core, ...access, ...ends],
      links: [...access.map((a) => ['Core', a.id]), ...ends.map((e, i) => [access[Math.floor(i / 2)].id, e.id])],
      about: 'A mix of topologies. This one is a star of stars (tree): access switches in a star off a core switch, the typical hierarchical campus design.',
      pros: ['Scales well and is easy to segment', 'Failures stay contained to a branch'],
      cons: ['The core is critical: plan redundancy there', 'More devices to manage'],
      tip: 'Fail one access switch, then the core.',
    };
  })(),
  spine: (() => {
    const spines = [220, 420].map((x, i) => ({ id: `Spine${i + 1}`, x, y: 60, kind: 'infra', label: `Spine ${i + 1}` }));
    const leaves = [100, 247, 393, 540].map((x, i) => ({ id: `Leaf${i + 1}`, x, y: 180, kind: 'infra', label: `Leaf ${i + 1}` }));
    const servers = leaves.map((l, i) => ({ id: `Srv${i + 1}`, x: l.x, y: 295, kind: 'end', label: `Srv${i + 1}` }));
    return {
      label: 'Spine & leaf',
      nodes: [...spines, ...leaves, ...servers],
      links: [...leaves.flatMap((l) => spines.map((s) => [s.id, l.id])), ...servers.map((s, i) => [leaves[i].id, s.id])],
      about: 'Data center design: every leaf connects to every spine, so any two servers are always leaf → spine → leaf apart. Built for east-west traffic.',
      pros: ['Predictable low latency between any servers', 'Scale out by adding spines or leaves'],
      cons: ['Lots of cabling between tiers', 'Each server still depends on its leaf (dual-home it for redundancy)'],
      tip: 'Fail a spine. Every server can still reach every other.',
    };
  })(),
};

function reachability(topo, dead, cut) {
  const alive = (id) => !dead.has(id);
  const adj = new Map(topo.nodes.map((n) => [n.id, []]));
  topo.links.forEach(([a, b], i) => {
    if (cut.has(i) || !alive(a) || !alive(b)) return;
    adj.get(a).push(b);
    if (!topo.directed) adj.get(b).push(a);
  });
  const ends = topo.nodes.filter((n) => n.kind === 'end');
  let ok = 0;
  let total = 0;
  for (const s of ends) {
    const seen = new Set([s.id]);
    const q = alive(s.id) ? [s.id] : [];
    while (q.length) {
      const cur = q.shift();
      for (const nx of adj.get(cur)) if (!seen.has(nx)) { seen.add(nx); q.push(nx); }
    }
    for (const t of ends) {
      if (t.id === s.id) continue;
      total++;
      if (alive(s.id) && alive(t.id) && seen.has(t.id)) ok++;
    }
  }
  return { ok, total };
}

export default function Topology() {
  const [key, setKey] = useState('star');
  const [dead, setDead] = useState(new Set());
  const [cut, setCut] = useState(new Set());
  const topo = TOPOLOGIES[key];
  const pos = useMemo(() => Object.fromEntries(topo.nodes.map((n) => [n.id, n])), [topo]);
  const r = reachability(topo, dead, cut);
  const pct = r.total ? Math.round((r.ok / r.total) * 100) : 0;

  const toggle = (set, setter, v) => {
    const n = new Set(set);
    n.has(v) ? n.delete(v) : n.add(v);
    setter(n);
  };
  const change = (k) => {
    setKey(k);
    setDead(new Set());
    setCut(new Set());
  };
  const nEnds = topo.nodes.filter((n) => n.kind === 'end').length;

  return (
    <>
      <div className="section stack">
        <Seg label="Topology" value={key} onChange={change} options={Object.entries(TOPOLOGIES).map(([value, t]) => ({ value, label: t.label }))} />
      </div>
      <div className="section stack-lg">
        <div className="row between">
          <div className="scorebar">
            <span><b className={pct === 100 ? 'ok-text' : pct < 60 ? 'bad-text' : ''}>{pct}%</b> of device pairs can talk</span>
            <span><b>{topo.links.length}</b> links</span>
            {topo.formula && <span>n(n−1)/2 = {nEnds}·{nEnds - 1}/2 = {topo.links.length}</span>}
          </div>
          <button className="btn link small" onClick={() => { setDead(new Set()); setCut(new Set()); }} disabled={!dead.size && !cut.size}>
            Repair all
          </button>
        </div>
        <div className="diagram-scroll">
          <svg className="diagram" viewBox="0 0 640 350" role="img" aria-label={`${topo.label} topology diagram`}>
            <defs>
              <marker id="ring-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0,0 L10,5 L0,10 z" style={{ fill: 'var(--text)' }} />
              </marker>
            </defs>
            {topo.links.map(([a, b], i) => {
              const A = pos[a];
              const B = pos[b];
              const isCut = cut.has(i);
              const mx = (A.x + B.x) / 2;
              const my = (A.y + B.y) / 2;
              return (
                <g key={i} className="hit" onClick={() => toggle(cut, setCut, i)} role="button" aria-label={`Link ${a} to ${b}${isCut ? ' (cut)' : ''}`}>
                  <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="transparent" strokeWidth="16" />
                  <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} className={`link ${isCut ? 'cut' : ''}`} />
                  {topo.directed && !isCut && <line x1={mx - (B.x - A.x) * 0.02} y1={my - (B.y - A.y) * 0.02} x2={mx + (B.x - A.x) * 0.02} y2={my + (B.y - A.y) * 0.02} className="stroke" markerEnd="url(#ring-arrow)" />}
                  {isCut && <text x={mx} y={my + 5} textAnchor="middle" className="bad-fill" style={{ fontSize: 16, fontWeight: 700 }}>✕</text>}
                </g>
              );
            })}
            {topo.terminators && (
              <>
                <rect x={60} y={168} width={8} height={14} className="node filled" />
                <rect x={572} y={168} width={8} height={14} className="node filled" />
              </>
            )}
            {topo.nodes.map((n) => {
              if (n.kind === 'tap') return <circle key={n.id} cx={n.x} cy={n.y} r={3} style={{ fill: 'var(--text)' }} />;
              const isDead = dead.has(n.id);
              const w = n.kind === 'infra' ? 74 : 54;
              return (
                <g key={n.id} className="hit" onClick={() => toggle(dead, setDead, n.id)} role="button" aria-label={`${n.label || n.id}${isDead ? ' (failed)' : ''}`}>
                  <rect x={n.x - w / 2} y={n.y - 15} width={w} height={30} className={`node ${n.kind === 'infra' && !isDead ? 'filled' : ''} ${isDead ? 'dead' : ''}`} />
                  <text
                    x={n.x}
                    y={n.y + 5}
                    textAnchor="middle"
                    className="mono"
                    style={{ fontSize: 12, fontWeight: 600, fill: n.kind === 'infra' && !isDead ? 'var(--on-fill)' : isDead ? 'var(--bad)' : 'var(--text)' }}
                  >
                    {n.label || n.id}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <PanHint />
        <p className="faint" style={{ fontSize: 13 }}>Click a device to fail it or a link to cut it. {topo.tip}</p>
      </div>
      <div className="section two-col">
        <div className="stack">
          <h3>{topo.label}</h3>
          <p className="muted">{topo.about}</p>
        </div>
        <div className="stack">
          <div>
            <div className="eyebrow plain ok-text" style={{ color: 'var(--text)' }}>Strengths</div>
            <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{topo.pros.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
          <div>
            <div className="eyebrow plain">Weaknesses</div>
            <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{topo.cons.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
        </div>
      </div>
    </>
  );
}
