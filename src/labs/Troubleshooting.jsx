import { CaseRunner, MatchDrill, OrderBuilder } from './kit.jsx';

const STEPS = [
  'Identify the problem',
  'Establish a theory of probable cause',
  'Test the theory to determine the cause',
  'Establish a plan of action to resolve the problem and identify potential effects',
  'Implement the solution or escalate as necessary',
  'Verify full system functionality and implement preventive measures if applicable',
  'Document findings, actions, outcomes, and lessons learned',
];

const TOOLS = [
  { task: 'Find which hop along the path is dropping traffic', tool: 'traceroute / tracert' },
  { task: 'Check whether a remote host responds at all', tool: 'ping' },
  { task: 'See which DNS server answers and what record it returns', tool: 'nslookup / dig' },
  { task: "View this PC's IP, mask, gateway and DNS settings", tool: 'ipconfig / ip addr' },
  { task: 'Find which wall jack a cable in the closet runs to', tool: 'Toner probe' },
  { task: 'Find the distance to a break in a copper run', tool: 'TDR' },
  { task: 'Locate a bad splice in a long fiber run', tool: 'OTDR' },
  { task: 'Verify all eight wires in a patch cable are wired correctly', tool: 'Cable tester' },
  { task: 'Find nearby channels causing Wi-Fi interference', tool: 'Wi-Fi analyzer' },
  { task: 'Capture and inspect packets on an interface', tool: 'Protocol analyzer (Wireshark / tcpdump)' },
  { task: 'List open ports on a remote host', tool: 'nmap' },
  { task: 'Show local listening ports and active connections', tool: 'netstat' },
  { task: 'Show the IP-to-MAC mappings this host has learned', tool: 'arp -a' },
  { task: 'Test a NIC or switch port by looping transmit back to receive', tool: 'Loopback adapter' },
  { task: 'Measure throughput between two hosts', tool: 'iperf / speed tester' },
  { task: 'Check optical power levels at a fiber receiver', tool: 'Light meter' },
  { task: 'Terminate twisted pair into a patch panel or keystone', tool: 'Punchdown tool' },
];

const SYMPTOMS = [
  { s: 'Host has a 169.254.x.x address', c: 'DHCP server unreachable or out of addresses' },
  { s: 'Can ping 8.8.8.8 but not reach websites by name', c: 'DNS misconfiguration' },
  { s: 'Can reach the local subnet but nothing beyond it', c: 'Wrong or missing default gateway' },
  { s: 'Late collisions on one end of a link, CRC errors and runts on the other', c: 'Duplex mismatch' },
  { s: 'Network slows to a crawl, switch CPUs spike, broadcasts everywhere', c: 'Switching loop / broadcast storm' },
  { s: 'Two hosts report an IP address conflict', c: 'Duplicate static IP or overlapping DHCP scope' },
  { s: 'Errors and slow speeds on a 120 m copper run', c: 'Exceeded maximum cable length (attenuation)' },
  { s: 'VoIP calls are choppy and ping times vary wildly', c: 'Jitter (needs QoS)' },
  { s: 'New fiber link stays down and the light level is very low', c: 'Dirty connector or SMF/MMF mismatch' },
  { s: 'Users in one VLAN cannot reach any other VLAN', c: 'Missing inter-VLAN routing or trunk misconfiguration' },
  { s: 'Wireless clients drop when moving between rooms', c: 'Poor coverage / roaming (AP placement)' },
  { s: 'Interface is up but no traffic passes after a config change', c: 'ACL blocking traffic (implicit deny)' },
];

export const Methodology = () => (
  <OrderBuilder
    items={STEPS}
    task="Put CompTIA's seven troubleshooting steps in order."
    success="Identify → Theory → Test → Plan → Implement → Verify → Document."
  />
);

export const ToolsDrill = () => (
  <MatchDrill
    task="Pick the right tool for the job."
    modes={[
      { label: 'Task → tool', items: TOOLS, prompt: (t) => t.task, answer: (t) => t.tool, small: true },
      { label: 'Tool → task', items: TOOLS, prompt: (t) => t.tool, answer: (t) => t.task },
    ]}
  />
);

export const SymptomsDrill = () => (
  <MatchDrill
    task="Classic scenario clues: name the most likely cause."
    modes={[{ label: 'Symptom → cause', items: SYMPTOMS, prompt: (x) => x.s, answer: (x) => x.c, small: true }]}
  />
);

// ───────── Diagnose from command output ─────────
// Lines starting with "> " are commands; lines wrapped in ** are the clue.
const CASES = [
  {
    report: '"I can\'t get to anything, not even the file server."',
    output: [
      '> ipconfig',
      'Ethernet adapter Ethernet:',
      '   IPv4 Address. . . . . . . : **169.254.23.7**',
      '   Subnet Mask . . . . . . . : 255.255.0.0',
      '   Default Gateway . . . . . :',
    ],
    options: ['DHCP server unreachable', 'DNS server down', 'Wrong default gateway', 'Duplex mismatch'],
    answer: 'DHCP server unreachable',
    fix: '169.254.x.x is APIPA: the PC never got a DHCP lease. Check the cable/VLAN, the DHCP scope (exhausted?) and the relay, then run ipconfig /release and /renew.',
  },
  {
    report: '"Local stuff works, but no internet."',
    output: [
      '> ipconfig',
      '   IPv4 Address. . . . . . . : 192.168.10.45',
      '   Subnet Mask . . . . . . . : 255.255.255.0',
      '   Default Gateway . . . . . : **192.168.1.1**',
      '> ping 192.168.10.20',
      'Reply from 192.168.10.20: bytes=32 time<1ms TTL=128',
      '> ping 8.8.8.8',
      'Reply from 192.168.10.45: **Destination host unreachable.**',
    ],
    options: ['Gateway is on a different subnet', 'DNS misconfigured', 'APIPA address', 'Bad patch cable'],
    answer: 'Gateway is on a different subnet',
    fix: 'The host is in 192.168.10.0/24 but its gateway is 192.168.1.1, which isn\'t on its subnet, so ARP for it fails and the host reports itself as the source of the error. Set the gateway to the router\'s address in this subnet (e.g. 192.168.10.1).',
  },
  {
    report: '"No websites will load, but my mapped drive at \\\\10.0.0.20 still works."',
    output: [
      '> ping 8.8.8.8',
      'Reply from 8.8.8.8: bytes=32 time=14ms TTL=117',
      '> ping www.comptia.org',
      '**Ping request could not find host www.comptia.org.**',
      '> nslookup www.comptia.org',
      '**DNS request timed out.**',
      'Server:  UnKnown',
      'Address:  10.0.0.53',
    ],
    options: ['DNS server unreachable or wrong', 'Default gateway down', 'Firewall blocking ICMP', 'Wrong subnet mask'],
    answer: 'DNS server unreachable or wrong',
    fix: 'Anything addressed by IP works, so routing is fine; only name resolution fails. Check the DNS server address (DHCP option 6) and whether 10.0.0.53 is up.',
  },
  {
    report: '"My laptop shows no network at all at this desk."',
    output: [
      '> ipconfig',
      'Ethernet adapter Ethernet:',
      '   **Media State . . . . . . . : Media disconnected**',
    ],
    options: ['Physical layer: cable or port', 'DHCP scope exhausted', 'DNS failure', 'IP address conflict'],
    answer: 'Physical layer: cable or port',
    fix: 'No link at all is Layer 1. Check link lights, reseat the cable, test it with a cable tester, and confirm the switch port is enabled.',
  },
  {
    report: '"I keep getting kicked off the network, and a warning pops up."',
    output: [
      '> ipconfig',
      '   IPv4 Address. . . . . . . : **10.1.1.50(Duplicate)**',
      '   Autoconfiguration IPv4 . . : 169.254.88.12',
      'Router# show ip arp 10.1.1.50',
      'Internet  10.1.1.50    2   **3c52.821a.9f04**  ARPA   Vlan10',
      '(This laptop\'s MAC is 8c16.4501.77a2)',
    ],
    options: ['Duplicate IP address', 'DHCP relay missing', 'Routing loop', 'Wireless interference'],
    answer: 'Duplicate IP address',
    fix: 'Windows detected the conflict and fell back to an APIPA address. The router maps 10.1.1.50 to a different MAC, probably a device with a static IP inside the DHCP scope. Trace that MAC in the switch MAC table, then use a reservation or an exclusion.',
  },
  {
    report: '"Nothing past the second router works since last night\'s change."',
    output: [
      '> tracert 172.16.40.10',
      '  1    <1 ms   10.0.0.1',
      '  2     1 ms   **10.0.12.2**',
      '  3     1 ms   **10.0.12.1**',
      '  4     2 ms   **10.0.12.2**',
      '  5     2 ms   **10.0.12.1**',
      '  …',
      ' 29     6 ms   10.0.12.2',
      ' 30     6 ms   10.0.12.1',
      '',
      'Trace complete.',
    ],
    options: ['Routing loop between two routers', 'DNS failure', 'Duplex mismatch', 'Host firewall'],
    answer: 'Routing loop between two routers',
    fix: 'The trace bounces between 10.0.12.1 and 10.0.12.2 until TTL runs out. Each router points at the other for this network. Fix the static routes from last night\'s change.',
  },
  {
    report: '"The link to the 3rd floor is crawling."',
    output: [
      '> show interface gi0/12',
      'GigabitEthernet0/12 is up, line protocol is up',
      '  **Half-duplex, 100Mb/s**, media type is 10/100/1000BaseTX',
      '  5 minute input rate 2140000 bits/sec',
      '     0 runts, 0 giants, 0 throttles',
      '     0 output errors, **3012 collisions**, 0 interface resets',
      '     0 babbles, **845 late collision**, 0 deferred',
      '(The far end is hard-coded to full duplex and logs CRC errors and runts)',
    ],
    options: ['Duplex mismatch', 'Bad DNS server', 'VLAN mismatch', 'Exceeded cable length'],
    answer: 'Duplex mismatch',
    fix: 'Classic duplex mismatch: one side is hard-coded to full, so the auto-negotiating side falls back to half. The half-duplex end logs late collisions and the full-duplex end logs CRC errors. Set both ends to auto, or hard-code both identically.',
  },
  {
    report: '"I\'m plugged into the new conference room and can\'t reach the servers. Others in my department can."',
    output: [
      '> ipconfig',
      '   IPv4 Address. . . . . . . : **192.168.50.27**',
      '   Default Gateway . . . . . : 192.168.50.1',
      '   (Engineering uses 192.168.20.0/24)',
      '> show interfaces gi0/7 switchport',
      '  Access Mode VLAN: **50 (GUEST)**',
    ],
    options: ['Switch port in the wrong VLAN', 'Duplicate IP', 'DHCP server down', 'Routing loop'],
    answer: 'Switch port in the wrong VLAN',
    fix: 'The port is an access port in the guest VLAN, so the PC got a guest address and the ACLs block it. Move gi0/7 to the Engineering VLAN.',
  },
];

export const Diagnose = () => <CaseRunner cases={CASES} unit="Ticket" question="What's the problem?" scoreLabel="diagnosed" />;
