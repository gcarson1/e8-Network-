import { useState } from 'react';
import { MatchDrill } from './kit.jsx';

// N10-009 objective 1.4 port list.
export const PORTS = [
  { port: '20/21', name: 'FTP', proto: 'TCP', desc: 'File Transfer Protocol (20 data, 21 control). Unencrypted.' },
  { port: '22', name: 'SSH / SFTP', proto: 'TCP', desc: 'Secure Shell for encrypted remote admin; SFTP transfers files over SSH.' },
  { port: '23', name: 'Telnet', proto: 'TCP', desc: 'Unencrypted remote terminal. Replace with SSH.' },
  { port: '25', name: 'SMTP', proto: 'TCP', desc: 'Simple Mail Transfer Protocol: server-to-server email.' },
  { port: '53', name: 'DNS', proto: 'UDP/TCP', desc: 'Name resolution. UDP for queries, TCP for zone transfers and large responses.' },
  { port: '67/68', name: 'DHCP', proto: 'UDP', desc: 'Server listens on 67, client on 68.' },
  { port: '69', name: 'TFTP', proto: 'UDP', desc: 'Trivial FTP: no authentication; used for firmware/config files.' },
  { port: '80', name: 'HTTP', proto: 'TCP', desc: 'Unencrypted web traffic.' },
  { port: '123', name: 'NTP', proto: 'UDP', desc: 'Network Time Protocol keeps clocks in sync.' },
  { port: '161/162', name: 'SNMP', proto: 'UDP', desc: '161 for polling agents, 162 for traps sent to the manager.' },
  { port: '389', name: 'LDAP', proto: 'TCP/UDP', desc: 'Directory queries (e.g. Active Directory). Unencrypted.' },
  { port: '443', name: 'HTTPS', proto: 'TCP', desc: 'HTTP over TLS.' },
  { port: '445', name: 'SMB', proto: 'TCP', desc: 'Server Message Block: Windows file and printer sharing.' },
  { port: '514', name: 'Syslog', proto: 'UDP', desc: 'Sends log messages to a central syslog server.' },
  { port: '587', name: 'SMTPS (submission)', proto: 'TCP', desc: 'Secure mail submission from clients, using STARTTLS.' },
  { port: '636', name: 'LDAPS', proto: 'TCP', desc: 'LDAP over TLS.' },
  { port: '1433', name: 'SQL Server', proto: 'TCP', desc: 'Microsoft SQL Server database.' },
  { port: '3389', name: 'RDP', proto: 'TCP', desc: 'Remote Desktop Protocol.' },
  { port: '5060/5061', name: 'SIP', proto: 'TCP/UDP', desc: 'Session Initiation Protocol for VoIP call setup (5061 = SIP over TLS).' },
];

export default function Ports() {
  const [sheet, setSheet] = useState(false);
  return (
    <>
      <MatchDrill
        intro="Every port on the N10-009 objectives list. Answer fast; anything you miss comes back a few cards later. Keys 1–4 pick."
        modes={[
          {
            label: 'Port → protocol',
            items: PORTS,
            prompt: (p) => <span className="mono">Port {p.port}</span>,
            answer: (p) => p.name,
            note: (p) => `${p.name} · ${p.proto} ${p.port}. ${p.desc}`,
          },
          {
            label: 'Protocol → port',
            items: PORTS,
            prompt: (p) => p.name,
            answer: (p) => p.port,
            note: (p) => `${p.name} · ${p.proto} ${p.port}. ${p.desc}`,
          },
        ]}
      />
      <div className="section stack">
        <div className="row between">
          <div className="eyebrow">Cheat sheet</div>
          <button className="btn link small" onClick={() => setSheet((s) => !s)}>{sheet ? 'Hide' : 'Show'}</button>
        </div>
        {sheet && (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Port</th><th>Protocol</th><th>Transport</th><th>What it does</th></tr></thead>
              <tbody>
                {PORTS.map((p) => (
                  <tr key={p.port}>
                    <td className="mono">{p.port}</td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td className="mono">{p.proto}</td>
                    <td className="muted">{p.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
