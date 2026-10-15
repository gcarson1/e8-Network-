import { CaseRunner, MatchDrill } from './kit.jsx';

const ATTACKS = [
  { name: 'ARP spoofing / poisoning', how: 'Forged ARP replies map the attacker\'s MAC to another host\'s IP (often the gateway)', fix: 'Dynamic ARP Inspection (DAI)' },
  { name: 'Rogue DHCP server', how: 'An unauthorized server hands out a malicious gateway or DNS server', fix: 'DHCP snooping (trusted ports only)' },
  { name: 'MAC flooding', how: 'Floods the switch with fake MACs until its CAM table fills and it floods every frame', fix: 'Port security (limit MACs per port)' },
  { name: 'VLAN hopping', how: 'Switch spoofing or double 802.1Q tagging to reach traffic on other VLANs', fix: 'Disable DTP auto-trunking; unused native VLAN' },
  { name: 'DNS poisoning', how: 'Corrupts a resolver\'s cache so a name points to the attacker\'s IP', fix: 'DNSSEC validation on the resolver' },
  { name: 'DNS spoofing', how: 'Forged DNS replies reach a client before (or instead of) the real answer', fix: 'Encrypted DNS (DoH/DoT) to a trusted resolver' },
  { name: 'Evil twin', how: 'A rogue AP broadcasts a trusted SSID to capture logins and traffic', fix: '802.1X (WPA2/WPA3-Enterprise) with server certificate validation' },
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
  { name: 'Malware (ransomware, worms)', how: 'Malicious code that encrypts, spreads or steals once it runs on a host', fix: 'Patching, endpoint protection (EDR) and offline backups' },
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

export const AttackDrill = () => (
  <MatchDrill
    task="'Which control would stop this?' Match attacks to how they work and what defeats them."
    modes={[
      { label: 'Attack → defense', items: ATTACKS, prompt: (a) => a.name, answer: (a) => a.fix, note: (a) => a.how },
      { label: 'Description → attack', items: ATTACKS, prompt: (a) => a.how, answer: (a) => a.name, small: true, note: (a) => `Defense: ${a.fix}` },
      { label: 'Defense → attack', items: ATTACKS, prompt: (a) => a.fix, answer: (a) => a.name, small: true, note: (a) => a.how },
    ]}
  />
);

export const SecurityConcepts = () => (
  <MatchDrill
    task="Core security vocabulary."
    modes={[
      { label: 'Term → meaning', items: CONCEPTS, prompt: (c) => c.k, answer: (c) => c.v },
      { label: 'Meaning → term', items: CONCEPTS, prompt: (c) => c.v, answer: (c) => c.k, small: true },
    ]}
  />
);

export function AttackReference() {
  return (
    <div className="scroll-x">
      <table className="table">
        <thead><tr><th>Attack</th><th>How it works</th><th>Stop it with</th></tr></thead>
        <tbody>
          {ATTACKS.map((a) => (
            <tr key={a.name}><td><b>{a.name}</b></td><td className="muted">{a.how}</td><td>{a.fix}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const INCIDENTS = [
  {
    report: 'Users on VLAN 10 say pages load slowly and certificate warnings keep popping up.',
    output: [
      '> arp -a',
      '  Internet Address    Physical Address',
      '  **192.168.10.1        a4-5e-60-11-22-33**   dynamic',
      '  **192.168.10.37       a4-5e-60-11-22-33**   dynamic',
    ],
    options: ['ARP spoofing (on-path)', 'MAC flooding', 'Rogue DHCP server', 'DNS poisoning'],
    answer: 'ARP spoofing (on-path)',
    fix: 'The gateway (.1) and a workstation (.37) share one MAC, so .37 is posing as the gateway and relaying traffic. Enable Dynamic ARP Inspection (backed by DHCP snooping).',
  },
  {
    report: 'New laptops get addresses but can\'t reach anything internal.',
    output: [
      '> ipconfig /all',
      '   IPv4 Address . . . . . : **10.99.0.23**',
      '   Default Gateway  . . . : **10.99.0.1**',
      '   DHCP Server  . . . . . : **10.99.0.1**',
      '   (Company scope is 172.20.0.0/16, DHCP server 172.20.0.5)',
    ],
    options: ['Rogue DHCP server', 'APIPA', 'VLAN hopping', 'Evil twin'],
    answer: 'Rogue DHCP server',
    fix: 'An unauthorized device is answering DHCP with its own gateway. Enable DHCP snooping so only trusted uplink ports can send DHCP offers.',
  },
  {
    report: 'An access switch suddenly floods traffic out every port, and a sniffer on one port sees everyone\'s frames.',
    output: [
      '> show mac address-table count',
      '  Dynamic Address Count : **8191**',
      '  Total MAC addresses space available : **0**',
      '> show mac address-table interface gi0/14 | count',
      '  **8174**',
    ],
    options: ['MAC flooding', 'STP manipulation', 'ARP spoofing', 'DDoS'],
    answer: 'MAC flooding',
    fix: 'One port learned ~8,000 MACs and filled the CAM table, so the switch fails open and floods. Turn on port security with a MAC limit (and shutdown on violation).',
  },
  {
    report: 'Visitors in the parking lot report a strong "CorpWiFi" signal that asks them to log in again.',
    output: [
      '> wifi scan',
      '  SSID        BSSID               Signal  Security',
      '  CorpWiFi    00:1a:2b:3c:4d:01   -61     WPA2-Enterprise',
      '  **CorpWiFi    6e:12:9a:00:be:ef   -38     Open + captive portal**',
    ],
    options: ['Evil twin', 'Deauthentication attack', 'Rogue DHCP server', 'Bluejacking'],
    answer: 'Evil twin',
    fix: 'A second AP clones the SSID with no encryption to harvest credentials. Use 802.1X/WPA3-Enterprise with server certificate validation, and wireless IPS to detect rogue BSSIDs.',
  },
  {
    report: 'The internet-facing SSH jump host is sluggish, and its auth log grew fast overnight.',
    output: [
      "> grep 'Failed password' /var/log/auth.log | awk '{print $9, $11}' | sort | uniq -c | sort -rn | head -3",
      '   **4812 admin 203.0.113.77**',
      '      2 jsmith 198.51.100.4',
      '      1 root 198.51.100.4',
    ],
    options: ['Brute-force password attack', 'Phishing', 'On-path attack', 'Shoulder surfing'],
    answer: 'Brute-force password attack',
    fix: 'Thousands of password guesses against one account from one source. Disable password logins in favor of keys or MFA, rate-limit or lock out repeated failures (e.g. fail2ban), and block the source.',
  },
  {
    report: 'The public website stopped responding. The web server\'s kernel log has a warning.',
    output: [
      '> dmesg | tail -1',
      'TCP: request_sock_TCP: **Possible SYN flooding on port 443. Sending cookies.**',
      '> ss -tan state syn-recv | wc -l',
      '**4097**',
      '> ss -tan state established | wc -l',
      '38',
    ],
    options: ['DDoS (SYN flood)', 'Brute-force attack', 'MAC flooding', 'DNS poisoning'],
    answer: 'DDoS (SYN flood)',
    fix: 'The SYN backlog is full of half-open connections that never send the final ACK. The kernel has fallen back to SYN cookies. Real mitigation is upstream: DDoS scrubbing or a CDN, plus rate limiting at the edge.',
  },
  {
    report: 'After someone plugged a switch in under their desk, traffic across the building started taking strange paths.',
    output: [
      '> show spanning-tree vlan 1',
      'VLAN0001',
      '  Spanning tree enabled protocol ieee',
      '  Root ID    Priority    **1**',
      '             Address     **0011.2233.4455**',
      '             Cost        19',
      '             Port        **31 (GigabitEthernet0/31)**',
      '  (Gi0/31 is a desk port in an office)',
    ],
    options: ['STP manipulation (rogue root bridge)', 'VLAN hopping', 'MAC flooding', 'Rogue access point'],
    answer: 'STP manipulation (rogue root bridge)',
    fix: 'A device on a desk port advertised bridge priority 0 (shown as 1: priority plus the VLAN 1 system ID) and won the root election. Enable BPDU guard on access ports and root guard where the root should never appear.',
  },
  {
    report: 'Several users typing the bank\'s URL land on a near-identical login page.',
    output: [
      '> nslookup portal.examplebank.com',
      'Server:  resolver.corp.local',
      'Address:  10.0.0.53',
      '',
      'Non-authoritative answer:',
      'Name:    portal.examplebank.com',
      'Address:  **198.51.100.66**',
      '(The bank publishes 192.0.2.80 for this name)',
    ],
    options: ['DNS poisoning', 'ARP spoofing', 'Evil twin', 'Phishing email'],
    answer: 'DNS poisoning',
    fix: "The internal resolver's cache returns an attacker's IP for a legitimate name. Flush the cache, and use DNSSEC validation so forged answers fail.",
  },
];

export const Incidents = () => <CaseRunner cases={INCIDENTS} unit="Alert" question="What attack is this?" scoreLabel="identified" />;
