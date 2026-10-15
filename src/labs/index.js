import Subnetting from './Subnetting.jsx';
import CidrSlider from './CidrSlider.jsx';
import Osi from './Osi.jsx';
import Ports from './Ports.jsx';
import Handshake from './Handshake.jsx';
import Topology from './Topology.jsx';
import Cables from './Cables.jsx';
import Devices from './Devices.jsx';
import Ipv6 from './Ipv6.jsx';
import Routing from './Routing.jsx';
import Vlan from './Vlan.jsx';
import Wireless from './Wireless.jsx';
import DhcpDns from './DhcpDns.jsx';
import Attacks from './Attacks.jsx';
import Troubleshooting from './Troubleshooting.jsx';

const C = 'Networking Concepts';
const I = 'Network Implementations';
const O = 'Network Operations';
const S = 'Network Security';
const T = 'Network Troubleshooting';

// Interactive labs, grouped by the N10-009 domain they reinforce.
export const LABS = [
  { id: 'subnetting', domain: C, title: 'Subnetting trainer', blurb: 'Work out network, broadcast and host range for random subnets, with the binary shown when you miss.', Component: Subnetting },
  { id: 'cidr', domain: C, title: 'CIDR slider', blurb: 'Drag the prefix length and watch network and host bits, masks and host counts change live.', Component: CidrSlider },
  { id: 'osi', domain: C, title: 'OSI stack builder', blurb: 'Put the seven layers in order, then sort protocols, devices and PDUs onto them.', Component: Osi },
  { id: 'ports', domain: C, title: 'Port number drill', blurb: 'Rapid-fire every port on the objectives list, both directions, with a 60-second sprint mode.', Component: Ports },
  { id: 'tcp', domain: C, title: 'TCP handshake animator', blurb: 'Step through SYN / SYN-ACK / ACK with sequence numbers and states, plus teardown and UDP.', Component: Handshake },
  { id: 'topology', domain: C, title: 'Topology visualizer', blurb: 'Fail devices and cut links in star, mesh, bus, ring, hybrid and spine-leaf designs.', Component: Topology },
  { id: 'cables', domain: C, title: 'Cables & connectors', blurb: 'Identify RJ45, LC, SC, ST, MPO, F-type, BNC and transceivers; drill cable categories and standards.', Component: Cables },
  { id: 'devices', domain: C, title: 'Network devices', blurb: 'Match routers, switches, firewalls, APs, IDS/IPS and more to their job and OSI layer.', Component: Devices },
  { id: 'ipv6', domain: C, title: 'IPv4 vs IPv6', blurb: 'Compare the two side by side, decode IPv6 shorthand, and practice compressing addresses.', Component: Ipv6 },
  { id: 'routing', domain: I, title: 'Routing table builder', blurb: 'Add static and default routes to a router, then trace packets through longest-prefix match.', Component: Routing },
  { id: 'vlan', domain: I, title: 'VLAN segmentation', blurb: 'Assign ports to VLANs, then watch broadcasts stay contained and pings need a router.', Component: Vlan },
  { id: 'wireless', domain: I, title: 'Wireless standards', blurb: 'Compare 802.11a/b/g/n/ac/ax by speed and band, and drill Wi-Fi security types.', Component: Wireless },
  { id: 'dhcp-dns', domain: O, title: 'DHCP & DNS', blurb: 'Animate DORA and a full DNS lookup, then drill record types and DHCP terms.', Component: DhcpDns },
  { id: 'attacks', domain: S, title: 'Attacks & defenses', blurb: 'Match common attacks to how they work and the control that stops them.', Component: Attacks },
  { id: 'troubleshooting', domain: T, title: 'Troubleshooting', blurb: 'Order the 7-step methodology, pick the right tool, and diagnose classic symptoms.', Component: Troubleshooting },
];
