import { SequenceAnimator, TabbedLab } from './kit.jsx';

const HANDSHAKE = [
  {
    from: 0, to: 1, label: 'SYN', detail: 'seq=1000', title: 'SYN',
    note: 'The client picks a random initial sequence number (ISN) and asks to synchronize. The client moves to SYN-SENT.',
    states: ['SYN-SENT', ''],
  },
  {
    from: 1, to: 0, label: 'SYN-ACK', detail: 'seq=5000 ack=1001', title: 'SYN-ACK',
    note: "The server acknowledges the client's ISN + 1 and sends its own ISN in the same segment. The server moves to SYN-RECEIVED.",
    states: ['', 'SYN-RECEIVED'],
  },
  {
    from: 0, to: 1, label: 'ACK', detail: 'seq=1001 ack=5001', title: 'ACK',
    note: "The client acknowledges the server's ISN + 1. Both sides are now ESTABLISHED and data can flow.",
    states: ['ESTABLISHED', 'ESTABLISHED'],
  },
  {
    from: 0, to: 1, label: 'PSH, ACK · 200 bytes', detail: 'seq=1001 ack=5001', title: 'Data',
    note: 'The client sends 200 bytes. Sequence numbers count bytes, so the next segment from the client will start at 1201.',
  },
  {
    from: 1, to: 0, label: 'ACK', detail: 'ack=1201', title: 'Acknowledgment',
    note: 'The server acknowledges every byte up to 1200 by asking for 1201 next. Unacknowledged data would be retransmitted.',
  },
];

const TEARDOWN = [
  { from: 0, to: 1, label: 'FIN, ACK', detail: 'seq=1201', title: 'Client FIN', note: 'The client is done sending and asks to close its side.', states: ['FIN-WAIT-1', ''] },
  { from: 1, to: 0, label: 'ACK', detail: 'ack=1202', title: 'Server ACK', note: 'The server acknowledges. The connection is now half-closed: the server can still send.', states: ['FIN-WAIT-2', 'CLOSE-WAIT'] },
  { from: 1, to: 0, label: 'FIN, ACK', detail: 'seq=5001', title: 'Server FIN', note: 'When the server application is finished, it sends its own FIN.', states: ['', 'LAST-ACK'] },
  { from: 0, to: 1, label: 'ACK', detail: 'ack=5002', title: 'Final ACK', note: 'The client acknowledges and waits in TIME-WAIT (2 × MSL) in case the ACK was lost. The server closes immediately. (RST would abort the connection instantly instead.)', states: ['TIME-WAIT', 'CLOSED'] },
];

const UDP = [
  { from: 0, to: 1, label: 'DNS query', detail: 'UDP → port 53', title: 'Datagram out', note: 'UDP has no handshake. The client just sends a datagram. No sequence numbers, no acknowledgments.' },
  { from: 1, to: 0, label: 'DNS response', detail: 'UDP → client port', title: 'Datagram back', note: 'The reply is another standalone datagram. If it were lost, the application (not UDP) would have to retry. Low overhead is why DNS, VoIP, streaming and TFTP use UDP.' },
];

export default function Handshake() {
  return (
    <TabbedLab
      tabs={[
        { value: 'open', label: '3-way handshake', render: () => <SequenceAnimator lanes={['Client', 'Server']} steps={HANDSHAKE} initialStates={['CLOSED', 'LISTEN']} caption="TCP three-way handshake" /> },
        { value: 'close', label: 'Teardown', render: () => <SequenceAnimator lanes={['Client', 'Server']} steps={TEARDOWN} initialStates={['ESTABLISHED', 'ESTABLISHED']} caption="TCP connection teardown" /> },
        { value: 'udp', label: 'Compare: UDP', render: () => <SequenceAnimator lanes={['Client', 'DNS server']} steps={UDP} caption="UDP exchange" /> },
      ]}
    />
  );
}
