import { MatchDrill, OrderBuilder, TabbedLab } from './kit.jsx';

const STEPS = [
  'Identify the problem',
  'Establish a theory of probable cause',
  'Test the theory to determine the cause',
  'Establish a plan of action and identify potential effects',
  'Implement the solution or escalate',
  'Verify full functionality and implement preventive measures',
  'Document findings, actions, outcomes and lessons learned',
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
  { s: 'Rising CRC errors and late collisions on one interface', c: 'Duplex mismatch' },
  { s: 'Network slows to a crawl, switch CPUs spike, broadcasts everywhere', c: 'Switching loop / broadcast storm' },
  { s: 'Two hosts report an IP address conflict', c: 'Duplicate static IP or overlapping DHCP scope' },
  { s: 'Errors and slow speeds on a 120 m copper run', c: 'Exceeded maximum cable length (attenuation)' },
  { s: 'VoIP calls are choppy and ping times vary wildly', c: 'Jitter (needs QoS)' },
  { s: 'New fiber link stays down and the light level is very low', c: 'Dirty connector or SMF/MMF mismatch' },
  { s: 'Users in one VLAN cannot reach any other VLAN', c: 'Missing inter-VLAN routing or trunk misconfiguration' },
  { s: 'Wireless clients drop when moving between rooms', c: 'Poor coverage / roaming (AP placement)' },
  { s: 'Interface is up but no traffic passes after a config change', c: 'ACL blocking traffic (implicit deny)' },
];

export default function Troubleshooting() {
  return (
    <TabbedLab
      tabs={[
        {
          value: 'method',
          label: 'Methodology',
          render: () => (
            <OrderBuilder
              items={STEPS}
              prompt="Put CompTIA's seven troubleshooting steps in order. It's a guaranteed exam topic."
              success="Correct! Identify → Theory → Test → Plan → Implement → Verify → Document."
            />
          ),
        },
        {
          value: 'tools',
          label: 'Pick the tool',
          render: () => (
            <MatchDrill
              modes={[
                { label: 'Task → tool', items: TOOLS, prompt: (t) => t.task, answer: (t) => t.tool, small: true },
                { label: 'Tool → task', items: TOOLS, prompt: (t) => t.tool, answer: (t) => t.task },
              ]}
            />
          ),
        },
        {
          value: 'symptoms',
          label: 'Symptom → cause',
          render: () => (
            <MatchDrill
              intro="Classic scenario clues. Spot the symptom, name the likely cause."
              modes={[{ label: 'Symptom → cause', items: SYMPTOMS, prompt: (x) => x.s, answer: (x) => x.c, small: true }]}
            />
          ),
        },
      ]}
    />
  );
}
