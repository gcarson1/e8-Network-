import { MatchDrill, TabbedLab } from './kit.jsx';

const ATTACKS = [
  { name: 'ARP spoofing', how: 'Forged ARP replies map the attacker\'s MAC to another host\'s IP (often the gateway)', fix: 'Dynamic ARP Inspection (DAI)' },
  { name: 'Rogue DHCP server', how: 'An unauthorized server hands out a malicious gateway or DNS server', fix: 'DHCP snooping (trusted ports only)' },
  { name: 'MAC flooding', how: 'Floods the switch with fake MACs until its CAM table fills and it floods every frame', fix: 'Port security (limit MACs per port)' },
  { name: 'VLAN hopping', how: 'Switch spoofing or double 802.1Q tagging to reach traffic on other VLANs', fix: 'Disable DTP auto-trunking; unused native VLAN' },
  { name: 'DNS poisoning', how: 'Corrupts a resolver\'s cache so a name points to the attacker\'s IP', fix: 'DNSSEC' },
  { name: 'Evil twin', how: 'A rogue AP broadcasts a trusted SSID to capture logins and traffic', fix: 'WPA3/802.1X with server certificate validation' },
  { name: 'Deauthentication attack', how: 'Spoofed management frames knock clients off the Wi-Fi', fix: '802.11w Protected Management Frames' },
  { name: 'Rogue access point', how: 'An unauthorized AP plugged into the wired network creates a back door', fix: 'Wireless IPS scanning + 802.1X/NAC on ports' },
  { name: 'On-path (MitM)', how: 'The attacker silently relays, reads and can alter traffic between two parties', fix: 'Authenticated encryption (TLS, IPsec, SSH)' },
  { name: 'DDoS', how: 'Many compromised hosts flood a target to exhaust bandwidth or resources', fix: 'Upstream scrubbing / CDN and rate limiting' },
  { name: 'Brute-force login', how: 'Tries huge numbers of passwords against an account', fix: 'Account lockout and MFA' },
  { name: 'Phishing', how: 'Fraudulent messages trick users into giving up credentials', fix: 'Security awareness training + email filtering' },
  { name: 'Tailgating', how: 'Following an authorized person through a secured door', fix: 'Access control vestibule (mantrap)' },
  { name: 'Shoulder surfing', how: 'Watching someone type a PIN or read their screen', fix: 'Privacy screens and awareness' },
  { name: 'STP manipulation', how: 'A rogue switch claims root bridge to redirect Layer 2 traffic', fix: 'BPDU guard and root guard' },
  { name: 'Dumpster diving', how: 'Digging through trash for sensitive documents', fix: 'Shred and securely dispose of media' },
];

const CONCEPTS = [
  { k: 'Defense in depth', v: 'Multiple layered controls so one failure doesn\'t expose everything' },
  { k: 'Least privilege', v: 'Only the minimum access needed to do the job' },
  { k: 'Zero trust', v: 'Never trust by network location; verify every request' },
  { k: 'Screened subnet (DMZ)', v: 'Perimeter network for public-facing servers' },
  { k: 'NAC', v: 'Checks device identity and posture before granting network access' },
  { k: 'Honeypot', v: 'Decoy system that lures and observes attackers' },
  { k: 'MFA', v: 'Two or more factor types: know, have, are, somewhere you are' },
  { k: 'ACL', v: 'Ordered permit/deny rules on a router or firewall interface, implicit deny at the end' },
  { k: 'Geofencing', v: 'Allow or block access based on the device\'s location' },
  { k: 'Content filter', v: 'Blocks web traffic by URL category or content' },
];

export default function Attacks() {
  return (
    <TabbedLab
      tabs={[
        {
          value: 'drill',
          label: 'Attack & defense',
          render: () => (
            <MatchDrill
              intro="The exam loves 'which control would prevent this?' Match attacks to their description and to the control that stops them."
              modes={[
                { label: 'Attack → defense', items: ATTACKS, prompt: (a) => a.name, answer: (a) => a.fix, note: (a) => a.how },
                { label: 'Description → attack', items: ATTACKS, prompt: (a) => a.how, answer: (a) => a.name, small: true, note: (a) => `Defense: ${a.fix}` },
                { label: 'Defense → attack', items: ATTACKS, prompt: (a) => a.fix, answer: (a) => a.name, small: true, note: (a) => a.how },
              ]}
            />
          ),
        },
        {
          value: 'concepts',
          label: 'Concepts',
          render: () => (
            <MatchDrill
              modes={[
                { label: 'Term → meaning', items: CONCEPTS, prompt: (c) => c.k, answer: (c) => c.v },
                { label: 'Meaning → term', items: CONCEPTS, prompt: (c) => c.v, answer: (c) => c.k, small: true },
              ]}
            />
          ),
        },
        {
          value: 'ref',
          label: 'Reference',
          render: () => (
            <div className="section">
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Attack</th><th>How it works</th><th>Stop it with</th></tr></thead>
                  <tbody>
                    {ATTACKS.map((a) => (
                      <tr key={a.name}>
                        <td style={{ fontWeight: 650 }}>{a.name}</td>
                        <td className="muted">{a.how}</td>
                        <td>{a.fix}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ),
        },
      ]}
    />
  );
}
