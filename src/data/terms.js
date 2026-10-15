// Built-in key-terms flashcard deck, mapped to N10-009 domains. These sit
// alongside the question-bank cards; ids are prefixed "t-" so they never
// collide with question ids in the progress file.
const C = 'Networking Concepts';
const I = 'Network Implementations';
const O = 'Network Operations';
const S = 'Network Security';
const T = 'Network Troubleshooting';

const RAW = [
  // Networking Concepts
  [C, 'OSI model (layers 7 → 1)', 'Application, Presentation, Session, Transport, Network, Data Link, Physical. Mnemonic: "All People Seem To Need Data Processing."'],
  [C, 'PDU at each layer', 'Transport: segment (TCP) / datagram (UDP). Network: packet. Data Link: frame. Physical: bits.'],
  [C, 'TCP vs. UDP', 'TCP is connection-oriented and reliable (handshake, sequencing, acknowledgments, retransmits). UDP is connectionless best-effort with lower overhead (DNS queries, VoIP, live video, TFTP).'],
  [C, 'TCP three-way handshake', 'SYN → SYN-ACK → ACK. The client sends SYN, the server replies SYN-ACK, and the client confirms with ACK before data flows.'],
  [C, 'RFC 1918 private ranges', '10.0.0.0/8, 172.16.0.0/12 (172.16–172.31), 192.168.0.0/16. Not routable on the public internet; reach it through NAT.'],
  [C, 'APIPA', '169.254.0.0/16. Self-assigned when a host can\'t reach a DHCP server. Usually means a DHCP problem.'],
  [C, 'Loopback address', 'IPv4 127.0.0.1 (127.0.0.0/8); IPv6 ::1. Tests the local TCP/IP stack.'],
  [C, 'CIDR', 'Classless Inter-Domain Routing: the /n suffix is the number of network bits. /24 = 255.255.255.0 = 254 usable hosts.'],
  [C, 'Usable hosts formula', '2^h − 2, where h = host bits. The 2 reserved addresses are the network ID and the broadcast.'],
  [C, 'Unicast / multicast / broadcast / anycast', 'One-to-one, one-to-group, one-to-all on the segment, and one-to-nearest (same address announced from many places).'],
  [C, 'IPv6 link-local', 'fe80::/10. Auto-configured on every IPv6 interface and never routed off the local link.'],
  [C, 'IPv6 global unicast', '2000::/3. Publicly routable; usually a /48 site prefix + 16-bit subnet ID + 64-bit interface ID.'],
  [C, 'SLAAC', 'Stateless Address Autoconfiguration: an IPv6 host builds its own address from the router-advertised prefix plus an interface ID (EUI-64 or random).'],
  [C, 'Dual stack', 'Running IPv4 and IPv6 at the same time on the same interfaces during migration.'],
  [C, 'Spine and leaf', 'Data center topology: every leaf (access) switch connects to every spine switch, so any server is the same number of hops from any other. Built for east-west traffic.'],
  [C, 'North-south vs. east-west traffic', 'North-south flows in and out of the data center; east-west flows between servers inside it.'],
  [C, 'SDN', 'Software-defined networking separates the control plane (decisions) from the data plane (forwarding) and centralizes control in a controller.'],
  [C, 'SD-WAN', 'Software-defined WAN: steers traffic across multiple WAN links (MPLS, broadband, LTE) based on application policy.'],
  [C, 'VXLAN', 'Encapsulates Layer 2 frames in UDP so Layer 2 segments can stretch across a Layer 3 network. 24-bit VNI allows about 16 million segments.'],
  [C, 'SASE / SSE', 'Secure Access Service Edge: cloud-delivered networking (SD-WAN) plus security (SWG, CASB, ZTNA, FWaaS). SSE is the security half.'],
  [C, 'Cloud service models', 'IaaS: you manage the OS and up. PaaS: you manage apps and data. SaaS: you just use the software.'],
  [C, 'Cat6a', '10 Gbps up to 100 m over twisted pair. Cat6 only reaches 10 Gbps to about 55 m.'],
  [C, 'Single-mode vs. multimode fiber', 'Single-mode (SMF): small core, laser, long distance (km). Multimode (MMF): larger core, LED/VCSEL, shorter runs (hundreds of meters).'],
  [C, 'SFP / QSFP', 'Hot-swappable transceiver modules. SFP is a single lane (1G; SFP+ 10G); QSFP is four lanes (QSFP+ 40G; QSFP28 100G).'],

  // Network Implementations
  [I, 'VLAN', 'Virtual LAN: splits one physical switch into separate Layer 2 broadcast domains. Traffic between VLANs needs a router or Layer 3 switch.'],
  [I, '802.1Q', 'The VLAN tagging standard. Trunk links carry tagged frames for many VLANs; native VLAN frames cross untagged.'],
  [I, 'Access port vs. trunk port', 'An access port carries one untagged VLAN to an end device. A trunk carries multiple tagged VLANs between switches or to a router.'],
  [I, 'Router on a stick', 'One router interface split into subinterfaces, one per VLAN, over a single trunk link to do inter-VLAN routing.'],
  [I, 'STP (802.1D)', 'Spanning Tree Protocol stops Layer 2 loops by electing a root bridge and blocking redundant paths. RSTP (802.1w) converges faster.'],
  [I, 'Link aggregation (LACP)', '802.3ad/802.1AX: bundles several physical links into one logical link for bandwidth and redundancy.'],
  [I, 'Administrative distance', 'How much a router trusts a route source; lower wins. Connected 0, static 1, eBGP 20, EIGRP 90, OSPF 110, RIP 120.'],
  [I, 'Longest prefix match', 'When several routes match, the router uses the most specific one (the largest /n).'],
  [I, 'OSPF', 'Link-state interior routing protocol; uses cost (bandwidth) as its metric and areas for scale. Open standard.'],
  [I, 'BGP', 'Path-vector exterior gateway protocol that routes between autonomous systems. The routing protocol of the internet.'],
  [I, 'FHRP', 'First Hop Redundancy Protocols (VRRP, HSRP) give hosts a virtual default gateway that fails over between routers.'],
  [I, 'NAT / PAT', 'NAT translates private to public addresses. PAT (NAT overload) maps many inside hosts onto one public IP using ports.'],
  [I, '2.4 GHz non-overlapping channels', '1, 6 and 11 (in North America). 2.4 GHz has longer range but more interference than 5 or 6 GHz.'],
  [I, 'Wi-Fi 6 (802.11ax)', '2.4 and 5 GHz (6 GHz for Wi-Fi 6E). Adds OFDMA and uplink/downlink MU-MIMO; up to about 9.6 Gbps.'],
  [I, 'SSID vs. BSSID', 'SSID is the network name. BSSID is the MAC address of a specific AP radio broadcasting that SSID.'],
  [I, 'PoE standards', '802.3af PoE 15.4 W, 802.3at PoE+ 30 W, 802.3bt PoE++ 60 W (Type 3) / 90 W (Type 4) at the source.'],

  // Network Operations
  [O, 'DHCP DORA', 'Discover → Offer → Request → Acknowledge. The client broadcasts Discover from UDP 68 to server port 67.'],
  [O, 'DHCP relay (IP helper)', 'Forwards DHCP broadcasts across routers to a DHCP server on another subnet.'],
  [O, 'DHCP reservation', 'Ties a specific IP to a client\'s MAC address so it always gets the same lease.'],
  [O, 'DNS record: A / AAAA', 'Maps a hostname to an IPv4 (A) or IPv6 (AAAA) address.'],
  [O, 'DNS record: CNAME', 'An alias that points one name at another (canonical) name.'],
  [O, 'DNS record: MX', 'Names the mail server(s) for a domain, with a preference value.'],
  [O, 'DNS record: PTR', 'Reverse lookup: maps an IP address back to a hostname.'],
  [O, 'SNMP', 'Simple Network Management Protocol (UDP 161 polls, 162 traps). SNMPv3 adds authentication and encryption. Device data is described by the MIB.'],
  [O, 'Syslog', 'Standard for sending log messages to a central collector (UDP 514). Severity runs 0 Emergency to 7 Debug.'],
  [O, 'RPO vs. RTO', 'RPO = how much data loss (time) is tolerable. RTO = how long until service must be restored.'],
  [O, 'MTTR / MTBF', 'Mean Time To Repair (how fast you fix it) and Mean Time Between Failures (how long it runs before failing).'],
  [O, 'Hot / warm / cold site', 'Hot: fully equipped and live, ready in minutes. Warm: hardware ready but needs data and config. Cold: space and power only.'],
  [O, 'NTP', 'Network Time Protocol (UDP 123) keeps clocks in sync; stratum 0 is the reference clock. Accurate time matters for logs and Kerberos.'],
  [O, 'Out-of-band management', 'Managing devices over a separate path (console server, dedicated management network) that still works when the production network is down.'],

  // Network Security
  [S, 'CIA triad', 'Confidentiality, Integrity, Availability: the three core goals of security.'],
  [S, 'AAA', 'Authentication (who you are), Authorization (what you can do), Accounting (what you did). Delivered by RADIUS or TACACS+.'],
  [S, 'RADIUS vs. TACACS+', 'RADIUS: UDP, combines authentication and authorization, encrypts only the password. TACACS+: TCP 49, separates AAA, encrypts the whole payload (common for device admin).'],
  [S, '802.1X', 'Port-based network access control. Supplicant (client) → authenticator (switch/AP) → authentication server (RADIUS).'],
  [S, 'Zero trust', 'Never trust, always verify: every request is authenticated and authorized no matter where it comes from on the network.'],
  [S, 'Least privilege', 'Give users and systems only the access they need to do their job, and nothing more.'],
  [S, 'Screened subnet (DMZ)', 'A perimeter network that holds public-facing services, kept separate from the internal LAN.'],
  [S, 'Honeypot', 'A decoy system that attracts attackers so their activity can be observed.'],
  [S, 'WPA3', 'Current Wi-Fi security. SAE replaces the PSK handshake (resists offline dictionary attacks); Enterprise mode uses 802.1X.'],
  [S, 'IPsec', 'Encrypts and authenticates at Layer 3. AH gives integrity/authentication; ESP adds encryption. IKE negotiates keys.'],
  [S, 'Dynamic ARP Inspection', 'Validates ARP packets against the DHCP snooping table to stop ARP spoofing / on-path attacks.'],
  [S, 'DHCP snooping', 'Allows DHCP server replies only from trusted ports, which blocks rogue DHCP servers.'],
  [S, 'Port security', 'Limits which (and how many) MAC addresses can use a switch port. Defends against MAC flooding.'],
  [S, 'Evil twin', 'A rogue AP impersonating a legitimate SSID to capture credentials and traffic.'],

  // Network Troubleshooting
  [T, 'Troubleshooting methodology', '1 Identify the problem → 2 Establish a theory → 3 Test the theory → 4 Plan of action → 5 Implement or escalate → 6 Verify functionality and prevent recurrence → 7 Document.'],
  [T, 'traceroute / tracert', 'Lists each hop to a destination using increasing TTL values. Shows where along the path traffic stops or slows.'],
  [T, 'nslookup / dig', 'Query DNS servers directly to test name resolution and look up records.'],
  [T, 'netstat', 'Shows active connections, listening ports and routing tables on a host.'],
  [T, 'Toner probe', 'Puts a tone on a wire and traces it with a probe to find which cable or jack it runs to.'],
  [T, 'TDR / OTDR', 'Time-domain reflectometer (copper) / optical TDR (fiber): finds the distance to a break, kink or bad splice.'],
  [T, 'Duplex mismatch', 'One side full-duplex, the other half-duplex. Causes late collisions, CRC errors and very slow throughput.'],
  [T, 'Attenuation', 'Loss of signal strength over distance. Fix with shorter runs, better cable, or repeaters/amplifiers.'],
  [T, 'Crosstalk (NEXT/FEXT)', 'Signal bleeding between pairs in a cable, often from untwisted wire at the terminations.'],
  [T, 'Jitter', 'Variation in packet delay. Hurts VoIP and video; mitigate with QoS and buffering.'],
  [T, 'Broadcast storm', 'Broadcasts multiplying out of control, usually from a Layer 2 loop. STP prevents it.'],
  [T, 'Asymmetric routing', 'Traffic leaves on one path and returns on another. Can break stateful firewalls.'],
];

export const TERMS = RAW.map(([category, term, definition]) => ({
  id: `t-${term.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
  category,
  term,
  definition,
}));
