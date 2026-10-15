import { useState } from 'react';
import { MatchDrill, Task } from './kit.jsx';
import { shuffle } from '../lib/util.js';

// N10-009 objective 1.4 ports.
export const PORTS = [
  { port: '20/21', name: 'FTP', proto: 'TCP', desc: 'File transfer (20 data, 21 control). Unencrypted.' },
  { port: '22', name: 'SSH / SFTP', proto: 'TCP', desc: 'Encrypted remote admin; SFTP moves files over SSH.' },
  { port: '23', name: 'Telnet', proto: 'TCP', desc: 'Unencrypted remote terminal. Replace with SSH.' },
  { port: '25', name: 'SMTP', proto: 'TCP', desc: 'Server-to-server email.' },
  { port: '53', name: 'DNS', proto: 'UDP/TCP', desc: 'Name resolution. TCP for zone transfers and large replies.' },
  { port: '67/68', name: 'DHCP', proto: 'UDP', desc: 'Server listens on 67, client on 68.' },
  { port: '69', name: 'TFTP', proto: 'UDP', desc: 'Trivial FTP, no authentication. Firmware and configs.' },
  { port: '80', name: 'HTTP', proto: 'TCP', desc: 'Unencrypted web.' },
  { port: '123', name: 'NTP', proto: 'UDP', desc: 'Time sync.' },
  { port: '161/162', name: 'SNMP', proto: 'UDP', desc: '161 polls agents; 162 receives traps.' },
  { port: '389', name: 'LDAP', proto: 'TCP/UDP', desc: 'Directory lookups (Active Directory). Unencrypted.' },
  { port: '443', name: 'HTTPS', proto: 'TCP', desc: 'HTTP over TLS.' },
  { port: '445', name: 'SMB', proto: 'TCP', desc: 'Windows file and printer sharing.' },
  { port: '514', name: 'Syslog', proto: 'UDP', desc: 'Log messages to a central server.' },
  { port: '587', name: 'SMTPS (submission)', proto: 'TCP', desc: 'Secure mail submission from clients.' },
  { port: '636', name: 'LDAPS', proto: 'TCP', desc: 'LDAP over TLS.' },
  { port: '1433', name: 'SQL Server', proto: 'TCP', desc: 'Microsoft SQL Server.' },
  { port: '3389', name: 'RDP', proto: 'TCP', desc: 'Remote Desktop.' },
  { port: '5060/5061', name: 'SIP', proto: 'TCP/UDP', desc: 'VoIP call setup (5061 = over TLS).' },
];

export function PortsDrill() {
  return (
    <MatchDrill
      task="Name the protocol for each port, or flip it around. Misses come back a few cards later."
      modes={[
        { label: 'Port → protocol', items: PORTS, prompt: (p) => <span className="mono">{p.port}</span>, answer: (p) => p.name, note: (p) => `${p.proto} ${p.port}. ${p.desc}` },
        { label: 'Protocol → port', items: PORTS, prompt: (p) => p.name, answer: (p) => p.port, note: (p) => `${p.proto} ${p.port}. ${p.desc}` },
      ]}
    />
  );
}

// Each scenario lists exactly the ports that should be open.
const SCENARIOS = [
  { ask: 'Public web server. Serve the site over plain and secure HTTP.', allow: ['80', '443'] },
  { ask: 'Mail server. Accept mail from other servers and secure submissions from users.', allow: ['25', '587'] },
  { ask: 'Domain controller. Directory lookups (plain and secure) and file shares.', allow: ['389', '636', '445'] },
  { ask: 'Switches and routers. Secure CLI access, time sync, and monitoring polls/traps.', allow: ['22', '123', '161/162'] },
  { ask: 'Windows jump box. Remote desktop only.', allow: ['3389'] },
  { ask: 'VoIP phone system. Call signaling, plain and over TLS.', allow: ['5060/5061'] },
  { ask: 'Branch router serving clients. Hand out addresses and resolve names.', allow: ['67/68', '53'] },
  { ask: 'Log server. Receive syslog messages and SNMP traps.', allow: ['514', '161/162'] },
  { ask: 'Retire insecure management. Open only the secure replacement for Telnet and FTP.', allow: ['22'] },
  { ask: 'Database server. App servers connect to Microsoft SQL Server.', allow: ['1433'] },
  { ask: 'Network devices pull firmware and configs from a server with no authentication.', allow: ['69'] },
];

export function FirewallRules() {
  const [order, setOrder] = useState(() => shuffle(SCENARIOS));
  const [i, setI] = useState(0);
  const [on, setOn] = useState([]);
  const [checked, setChecked] = useState(false);
  const [tally, setTally] = useState({ ok: 0, n: 0 });
  const sc = order[i % order.length];

  const missing = sc.allow.filter((p) => !on.includes(p));
  const extra = on.filter((p) => !sc.allow.includes(p));
  const ok = checked && !missing.length && !extra.length;

  const check = () => {
    setChecked(true);
    setTally((t) => ({ ok: t.ok + (!missing.length && !extra.length ? 1 : 0), n: t.n + 1 }));
  };
  const next = () => {
    if ((i + 1) % order.length === 0) setOrder(shuffle(SCENARIOS));
    setI((x) => x + 1);
    setOn([]);
    setChecked(false);
  };
  const toggle = (p) => {
    if (checked) return;
    setOn((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));
  };

  return (
    <div>
      <div className="spread" style={{ marginBottom: 8 }}>
        <span className="eyebrow">Rule set {(i % order.length) + 1} of {order.length}</span>
        <span className="tally"><b>{tally.ok}</b>/{tally.n} exact</span>
      </div>
      <p className="qstem" style={{ marginBottom: 6 }}>{sc.ask}</p>
      <Task>Allow only the ports it needs. Everything else stays blocked (implicit deny).</Task>
      <div className="tiles">
        {PORTS.map((p) => {
          const pressed = on.includes(p.port);
          let cls = '';
          if (checked) {
            if (sc.allow.includes(p.port)) cls = pressed ? 'good' : 'bad';
            else if (pressed) cls = 'bad';
          }
          return (
            <button key={p.port} className={`tile ${cls}`} aria-pressed={pressed} onClick={() => toggle(p.port)}>
              <span className="p">{p.port}</span>
              <span className="nm">{p.name}</span>
            </button>
          );
        })}
      </div>
      {checked && (
        <div className={`follow ${ok ? 'good' : 'bad'}`}>
          <div className="follow-k">{ok ? 'Exactly right' : 'Not quite'}</div>
          {!ok && (
            <p className="rest">
              {missing.length > 0 && <>Missing: <b>{missing.map((p) => `${PORTS.find((x) => x.port === p).name} ${p}`).join(', ')}</b>. </>}
              {extra.length > 0 && <>Shouldn't be open: <b>{extra.map((p) => `${PORTS.find((x) => x.port === p).name} ${p}`).join(', ')}</b>.</>}
            </p>
          )}
        </div>
      )}
      <div className="qactions">
        {!checked ? (
          <button className="btn primary" onClick={check} disabled={!on.length}>Check rules</button>
        ) : (
          <button className="btn primary" onClick={next}>Next rule set →</button>
        )}
        {!checked && on.length > 0 && <button className="tbtn" onClick={() => setOn([])}>Clear</button>}
      </div>
    </div>
  );
}

export function PortsReference() {
  return (
    <div className="scroll-x">
      <table className="table">
        <thead><tr><th>Port</th><th>Protocol</th><th>Transport</th><th>Use</th></tr></thead>
        <tbody>
          {PORTS.map((p) => (
            <tr key={p.port}>
              <td className="mono">{p.port}</td>
              <td><b>{p.name}</b></td>
              <td className="mono">{p.proto}</td>
              <td className="muted">{p.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
