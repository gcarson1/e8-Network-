import { MatchDrill, SequenceAnimator, TabbedLab } from './kit.jsx';

const DORA = [
  {
    from: 0, to: 1, label: 'DISCOVER', detail: '0.0.0.0:68 → 255.255.255.255:67', title: 'Discover (broadcast)', dashed: true,
    note: "The client has no IP yet, so it broadcasts from 0.0.0.0 to find any DHCP server on the segment. On another subnet, a DHCP relay (ip helper-address) on the router forwards it.",
    states: ['SELECTING', ''],
  },
  {
    from: 1, to: 0, label: 'OFFER', detail: '192.168.1.50/24 + options', title: 'Offer',
    note: 'The server offers an address from its scope along with options: subnet mask, default gateway (option 3), DNS servers (option 6) and lease time.',
  },
  {
    from: 0, to: 1, label: 'REQUEST', detail: 'broadcast: wants .50', title: 'Request (broadcast)', dashed: true,
    note: 'The client formally requests the offered address. It broadcasts so any other servers that sent offers know they were declined.',
    states: ['REQUESTING', ''],
  },
  {
    from: 1, to: 0, label: 'ACK', detail: 'lease confirmed', title: 'Acknowledge',
    note: 'The server confirms the lease and the client configures the address. It renews with the same server at 50% of the lease (T1) and rebinds with any server at 87.5% (T2).',
    states: ['BOUND', ''],
  },
];

const DNS_LOOKUP = [
  { from: 0, to: 1, label: 'www.example.com?', title: 'Recursive query', note: "The client asks its configured resolver and expects a final answer. That makes it a recursive query.", detail: 'recursive' },
  { from: 1, to: 2, label: 'www.example.com?', title: 'Ask a root server', note: "The resolver doesn't have it cached, so it starts at a root server (iterative query)." },
  { from: 2, to: 1, label: 'Try .com', detail: 'referral (NS)', title: 'Referral to the TLD', note: "The root doesn't know the answer but refers the resolver to the .com TLD servers." },
  { from: 1, to: 3, label: 'www.example.com?', title: 'Ask the TLD', note: 'The resolver asks a .com TLD server.' },
  { from: 3, to: 1, label: 'Try ns1.example.com', detail: 'referral (NS)', title: 'Referral to authoritative', note: 'The TLD refers it to the authoritative name servers for example.com.' },
  { from: 1, to: 4, label: 'www.example.com?', title: 'Ask the authoritative server', note: 'The resolver asks the server that holds the zone.' },
  { from: 4, to: 1, label: 'A 203.0.113.10', detail: 'TTL 3600', title: 'Authoritative answer', note: 'The authoritative server returns the A record and its TTL.' },
  { from: 1, to: 0, label: 'A 203.0.113.10', detail: 'cached for TTL', title: 'Answer to client', note: 'The resolver caches the answer for the TTL and replies. Later lookups are answered from cache.' },
];

const RECORDS = [
  { type: 'A', use: 'Hostname → IPv4 address' },
  { type: 'AAAA', use: 'Hostname → IPv6 address' },
  { type: 'CNAME', use: 'Alias of another hostname' },
  { type: 'MX', use: 'Mail server for the domain' },
  { type: 'NS', use: 'Authoritative name servers for the zone' },
  { type: 'PTR', use: 'IP address → hostname (reverse lookup)' },
  { type: 'TXT', use: 'Free text, e.g. SPF, DKIM, DMARC, domain verification' },
  { type: 'SOA', use: 'Start of authority: primary server, serial, timers' },
  { type: 'SRV', use: 'Host and port for a service (e.g. SIP, LDAP)' },
];

const DHCP_TERMS = [
  { t: 'Scope', d: 'The range of addresses a DHCP server can lease on a subnet' },
  { t: 'Exclusion', d: 'Addresses inside a scope the server will never hand out' },
  { t: 'Reservation', d: 'A fixed IP always leased to one MAC address' },
  { t: 'Lease time', d: 'How long a client may use an address before renewing' },
  { t: 'DHCP relay / IP helper', d: 'Forwards DHCP broadcasts to a server on another subnet' },
  { t: 'Option 3', d: 'Default gateway (router) handed to clients' },
  { t: 'Option 6', d: 'DNS server addresses handed to clients' },
  { t: 'APIPA 169.254.x.x', d: 'What a Windows client self-assigns when no DHCP server answers' },
];

export default function DhcpDns() {
  return (
    <TabbedLab
      tabs={[
        {
          value: 'dora',
          label: 'DHCP · DORA',
          render: () => <SequenceAnimator lanes={['Client', 'DHCP server']} steps={DORA} initialStates={['INIT', 'listening :67']} caption="DHCP DORA exchange" />,
        },
        {
          value: 'resolve',
          label: 'DNS resolution',
          render: () => <SequenceAnimator lanes={['Client', 'Resolver', 'Root', '.com TLD', 'Authoritative']} steps={DNS_LOOKUP} caption="DNS recursive and iterative resolution" />,
        },
        {
          value: 'records',
          label: 'Record types',
          render: () => (
            <MatchDrill
              intro="Match DNS record types to what they do."
              modes={[
                { label: 'Record → purpose', items: RECORDS, prompt: (r) => <span className="mono">{r.type}</span>, answer: (r) => r.use, small: false },
                { label: 'Purpose → record', items: RECORDS, prompt: (r) => r.use, answer: (r) => r.type, small: true },
              ]}
            />
          ),
        },
        {
          value: 'dhcp-terms',
          label: 'DHCP terms',
          render: () => (
            <MatchDrill
              modes={[
                { label: 'Term → meaning', items: DHCP_TERMS, prompt: (r) => r.t, answer: (r) => r.d },
                { label: 'Meaning → term', items: DHCP_TERMS, prompt: (r) => r.d, answer: (r) => r.t, small: true },
              ]}
            />
          ),
        },
      ]}
    />
  );
}
