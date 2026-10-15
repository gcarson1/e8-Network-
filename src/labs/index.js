import { CidrVisual, SubnetCalc, Vlsm } from './Subnetting.jsx';
import { Encapsulation, OsiOrder, OsiSort } from './Osi.jsx';
import { FirewallRules, PortsDrill, PortsReference } from './Ports.jsx';
import { TcpClose, TcpOpen, UdpCompare } from './Handshake.jsx';
import { TopologyIdentify, TopologySandbox } from './Topology.jsx';
import { CableSpecs, Connectors, EthStandards, WireRj45 } from './Cables.jsx';
import { BuildNetwork, DevicesDrill, DevicesReference } from './Devices.jsx';
import { Compare, CompressDrill, Shorthand } from './Ipv6.jsx';
import Routing from './Routing.jsx';
import Vlan from './Vlan.jsx';
import { ChannelPlan, WirelessDrill, WirelessStandards } from './Wireless.jsx';
import { DhcpTerms, DnsLookup, DnsRecords, Dora } from './DhcpDns.jsx';
import { AttackDrill, AttackReference, Incidents, SecurityConcepts } from './Attacks.jsx';
import { Diagnose, Methodology, SymptomsDrill, ToolsDrill } from './Troubleshooting.jsx';

const C = 'Networking Concepts';
const I = 'Network Implementations';
const O = 'Network Operations';
const S = 'Network Security';
const T = 'Network Troubleshooting';

const a = (id, label, Component) => ({ id, label, Component });

// Labs by exam domain. Activities are listed most hands-on first.
export const LABS = [
  { id: 'subnetting', domain: C, title: 'Subnetting', activities: [a('calc', 'Calculate', SubnetCalc), a('vlsm', 'VLSM planner', Vlsm), a('cidr', 'CIDR visualizer', CidrVisual)] },
  { id: 'osi', domain: C, title: 'OSI model', activities: [a('encap', 'Encapsulation', Encapsulation), a('sort', 'Sort onto layers', OsiSort), a('order', 'Layer order', OsiOrder)] },
  { id: 'ports', domain: C, title: 'Ports & protocols', activities: [a('firewall', 'Firewall rules', FirewallRules), a('drill', 'Port drill', PortsDrill), a('ref', 'Reference', PortsReference)] },
  { id: 'tcp', domain: C, title: 'TCP & UDP', activities: [a('open', 'Handshake', TcpOpen), a('close', 'Teardown', TcpClose), a('udp', 'UDP', UdpCompare)] },
  { id: 'cables', domain: C, title: 'Cables & connectors', activities: [a('wire', 'Wire an RJ45', WireRj45), a('connectors', 'Connectors', Connectors), a('specs', 'Cable specs', CableSpecs), a('standards', 'Ethernet standards', EthStandards)] },
  { id: 'devices', domain: C, title: 'Network devices', activities: [a('build', 'Build a network', BuildNetwork), a('drill', 'Drill', DevicesDrill), a('ref', 'Reference', DevicesReference)] },
  { id: 'topology', domain: C, title: 'Topologies', activities: [a('sandbox', 'Failure sandbox', TopologySandbox), a('identify', 'Identify', TopologyIdentify)] },
  { id: 'ipv6', domain: C, title: 'IPv4 & IPv6', activities: [a('compress', 'Compress IPv6', CompressDrill), a('shorthand', 'Shorthand explorer', Shorthand), a('compare', 'Compare', Compare)] },
  { id: 'routing', domain: I, title: 'Static routing', activities: [a('build', 'Route builder', Routing)] },
  { id: 'vlan', domain: I, title: 'VLANs', activities: [a('segment', 'Segmentation', Vlan)] },
  { id: 'wireless', domain: I, title: 'Wireless', activities: [a('channels', 'Channel planning', ChannelPlan), a('standards', 'Standards', WirelessStandards), a('drill', 'Drill', WirelessDrill)] },
  { id: 'dhcp-dns', domain: O, title: 'DHCP & DNS', activities: [a('dora', 'DHCP DORA', Dora), a('dns', 'DNS lookup', DnsLookup), a('records', 'Record types', DnsRecords), a('terms', 'DHCP terms', DhcpTerms)] },
  { id: 'security', domain: S, title: 'Attacks & defenses', activities: [a('incidents', 'Incidents', Incidents), a('drill', 'Attack drill', AttackDrill), a('concepts', 'Concepts', SecurityConcepts), a('ref', 'Reference', AttackReference)] },
  { id: 'troubleshooting', domain: T, title: 'Troubleshooting', activities: [a('diagnose', 'Diagnose tickets', Diagnose), a('method', 'Methodology', Methodology), a('tools', 'Tools', ToolsDrill), a('symptoms', 'Symptoms', SymptomsDrill)] },
];

export const ACTIVITY_COUNT = LABS.reduce((n, l) => n + l.activities.length, 0);
