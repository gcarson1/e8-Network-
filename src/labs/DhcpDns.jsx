import { MatchDrill, SequenceAnimator } from './kit.jsx';

const DHCP_MSGS = ['Discover', 'Offer', 'Request', 'Acknowledge'];

const DORA = [
  {
    from: 0, to: 1, label: 'DISCOVER', detail: '0.0.0.0:68 → 255.255.255.255:67', title: 'Discover (broadcast)', dashed: true,
    ask: { q: 'A laptop joins the network with no IP address. What does it send first?', options: DHCP_MSGS, answer: 'Discover' },
    note: "With no address yet, the client broadcasts from 0.0.0.0 to find any DHCP server. Across subnets, a relay (ip helper-address) forwards it.",
    states: ['SELECTING', ''],
  },
  {
    from: 1, to: 0, label: 'OFFER', detail: '192.168.1.50/24 + options', title: 'Offer',
    ask: { q: 'What does the server answer with?', options: DHCP_MSGS, answer: 'Offer' },
    note: 'The server offers an address from its scope with options: mask, default gateway (option 3), DNS servers (option 6) and lease time.',
  },
  {
    from: 0, to: 1, label: 'REQUEST', detail: 'broadcast: wants .50', title: 'Request (broadcast)', dashed: true,
    ask: { q: 'The client accepts the offer. Why is its Request broadcast instead of sent straight to the server?', options: ['So other servers know their offers were declined', 'It still has no MAC address', 'Routers require it', 'To reach the DNS server'], answer: 'So other servers know their offers were declined' },
    note: 'Any other server that made an offer sees the Request and pulls its offer back.',
    states: ['REQUESTING', ''],
  },
  {
    from: 1, to: 0, label: 'ACK', detail: 'lease confirmed', title: 'Acknowledge',
    ask: { q: 'What confirms the lease?', options: DHCP_MSGS, answer: 'Acknowledge' },
    note: 'The client configures the address. It renews at 50% of the lease (T1) and rebinds with any server at 87.5% (T2).',
    states: ['BOUND', ''],
  },
];

const DNS_LOOKUP = [
  {
    from: 0, to: 1, label: 'www.example.com?', detail: 'recursive', title: 'Recursive query',
    ask: { q: 'The client asks its resolver and expects a final answer. What kind of query is that?', options: ['Recursive', 'Iterative', 'Reverse', 'Zone transfer'], answer: 'Recursive' },
    note: 'The client hands the whole job to the resolver.',
  },
  {
    from: 1, to: 2, label: 'www.example.com?', title: 'Ask a root server',
    ask: { q: "The resolver has nothing cached. Who does it ask first?", options: ['A root server', 'The .com TLD server', 'The authoritative server', 'The DHCP server'], answer: 'A root server' },
    note: 'Resolution starts at the root and works down (iterative queries).',
  },
  { from: 2, to: 1, label: 'Try .com', detail: 'referral', title: 'Referral to the TLD', note: "The root doesn't know the answer, so it refers the resolver to the .com TLD servers." },
  { from: 1, to: 3, label: 'www.example.com?', title: 'Ask the TLD', note: 'The resolver asks a .com TLD server.' },
  {
    from: 3, to: 1, label: 'Try ns1.example.com', detail: 'referral', title: 'Referral to authoritative',
    ask: { q: 'Which record type does the TLD use to point at example.com\'s name servers?', options: ['NS', 'A', 'MX', 'PTR'], answer: 'NS' },
    note: 'NS records delegate a zone to its authoritative name servers.',
  },
  { from: 1, to: 4, label: 'www.example.com?', title: 'Ask the authoritative server', note: 'The resolver asks the server that holds the zone.' },
  {
    from: 4, to: 1, label: 'A 203.0.113.10', detail: 'TTL 3600', title: 'Authoritative answer',
    ask: { q: 'The answer is an IPv4 address. Which record type is it?', options: ['A', 'AAAA', 'CNAME', 'TXT'], answer: 'A' },
    note: 'A maps a name to IPv4 (AAAA is IPv6). The TTL says how long it can be cached.',
  },
  { from: 1, to: 0, label: 'A 203.0.113.10', detail: 'cached', title: 'Answer to client', note: 'The resolver caches the answer for the TTL, so the next lookup is answered locally.' },
];

const RECORDS = [
  { type: 'A', use: 'Hostname → IPv4 address' },
  { type: 'AAAA', use: 'Hostname → IPv6 address' },
  { type: 'CNAME', use: 'Alias of another hostname' },
  { type: 'MX', use: 'Mail server for the domain' },
  { type: 'NS', use: 'Authoritative name servers for the zone' },
  { type: 'PTR', use: 'IP address → hostname (reverse lookup)' },
  { type: 'TXT', use: 'Free text: SPF, DKIM, DMARC, verification' },
  { type: 'SOA', use: 'Zone authority: primary server, serial, timers' },
  { type: 'SRV', use: 'Host and port for a service (SIP, LDAP)' },
];

const DHCP_TERMS = [
  { t: 'Scope', d: 'The address range a DHCP server leases on a subnet' },
  { t: 'Exclusion', d: 'Addresses inside a scope that are never handed out' },
  { t: 'Reservation', d: 'A fixed IP always leased to one MAC address' },
  { t: 'Lease time', d: 'How long a client keeps an address before renewing' },
  { t: 'DHCP relay / IP helper', d: 'Forwards DHCP broadcasts to a server on another subnet' },
  { t: 'Option 3', d: 'Default gateway handed to clients' },
  { t: 'Option 6', d: 'DNS servers handed to clients' },
  { t: 'APIPA 169.254.x.x', d: 'What a client self-assigns when no DHCP server answers' },
];

export const Dora = () => <SequenceAnimator lanes={['Client', 'DHCP server']} steps={DORA} initialStates={['INIT', 'listening :67']} caption="DHCP DORA exchange" />;
export const DnsLookup = () => <SequenceAnimator lanes={['Client', 'Resolver', 'Root', '.com TLD', 'Authoritative']} steps={DNS_LOOKUP} caption="DNS resolution" />;
export const DnsRecords = () => (
  <MatchDrill
    task="Match each record type to what it does."
    modes={[
      { label: 'Record → purpose', items: RECORDS, prompt: (r) => <span className="mono">{r.type}</span>, answer: (r) => r.use },
      { label: 'Purpose → record', items: RECORDS, prompt: (r) => r.use, answer: (r) => r.type, small: true },
    ]}
  />
);
export const DhcpTerms = () => (
  <MatchDrill
    task="DHCP vocabulary that shows up in scenario questions."
    modes={[
      { label: 'Term → meaning', items: DHCP_TERMS, prompt: (r) => r.t, answer: (r) => r.d },
      { label: 'Meaning → term', items: DHCP_TERMS, prompt: (r) => r.d, answer: (r) => r.t, small: true },
    ]}
  />
);
