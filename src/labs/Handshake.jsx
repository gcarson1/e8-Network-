import { SequenceAnimator } from './kit.jsx';

const FLAGS = ['SYN', 'SYN-ACK', 'ACK', 'FIN'];

const HANDSHAKE = [
  {
    from: 0, to: 1, label: 'SYN', detail: 'seq=1000', title: 'SYN',
    ask: { q: 'The client wants to open a connection. What does it send first?', options: FLAGS, answer: 'SYN' },
    note: 'The client picks a random initial sequence number (ISN) and asks to synchronize. It moves to SYN-SENT.',
    states: ['SYN-SENT', ''],
  },
  {
    from: 1, to: 0, label: 'SYN-ACK', detail: 'seq=5000 ack=1001', title: 'SYN-ACK',
    ask: { q: 'The server accepts. What does it reply with?', options: FLAGS, answer: 'SYN-ACK' },
    note: "The server acknowledges the client's ISN + 1 and sends its own ISN in the same segment. It moves to SYN-RECEIVED.",
    states: ['', 'SYN-RECEIVED'],
  },
  {
    from: 0, to: 1, label: 'ACK', detail: 'seq=1001 ack=5001', title: 'ACK',
    ask: { q: 'The server sent seq=5000. What ack number does the client send back?', options: ['5000', '5001', '1001', '1000'], answer: '5001' },
    note: 'ACK = the next byte expected, so 5000 + 1. Both sides are ESTABLISHED and data can flow.',
    states: ['ESTABLISHED', 'ESTABLISHED'],
  },
  {
    from: 0, to: 1, label: 'PSH, ACK · 200 bytes', detail: 'seq=1001', title: 'Data',
    note: 'The client sends 200 bytes starting at sequence number 1001.',
  },
  {
    from: 1, to: 0, label: 'ACK', detail: 'ack=1201', title: 'Acknowledgment',
    ask: { q: 'The client sent 200 bytes starting at seq=1001. What ack does the server send?', options: ['1200', '1201', '1002', '5001'], answer: '1201' },
    note: 'Sequence numbers count bytes: 1001 + 200 = 1201, the next byte the server expects. Unacknowledged data gets retransmitted.',
  },
];

const TEARDOWN = [
  {
    from: 0, to: 1, label: 'FIN, ACK', detail: 'seq=1201', title: 'Client FIN',
    ask: { q: 'The client is done sending. Which flag starts a graceful close?', options: ['RST', 'FIN', 'SYN', 'PSH'], answer: 'FIN' },
    note: 'FIN closes the client\'s sending direction. (RST would abort the connection immediately instead.)',
    states: ['FIN-WAIT-1', ''],
  },
  {
    from: 1, to: 0, label: 'ACK', detail: 'ack=1202', title: 'Server ACK',
    note: 'The server acknowledges. The connection is half-closed: the server can still send data.',
    states: ['FIN-WAIT-2', 'CLOSE-WAIT'],
  },
  {
    from: 1, to: 0, label: 'FIN, ACK', detail: 'seq=5001', title: 'Server FIN',
    ask: { q: 'The server application finishes. What does the server send now?', options: ['FIN', 'SYN', 'RST', 'Nothing, it just closes'], answer: 'FIN' },
    note: 'Each side closes its own direction. Shown here as four segments; when the server has nothing left to send, its ACK and FIN often ride in one segment.',
    states: ['', 'LAST-ACK'],
  },
  {
    from: 0, to: 1, label: 'ACK', detail: 'ack=5002', title: 'Final ACK',
    ask: { q: 'After the final ACK, which state does the client wait in?', options: ['CLOSE-WAIT', 'TIME-WAIT', 'LISTEN', 'SYN-SENT'], answer: 'TIME-WAIT' },
    note: 'The client waits in TIME-WAIT (2 × max segment lifetime) in case its ACK was lost. The server closes right away.',
    states: ['TIME-WAIT', 'CLOSED'],
  },
];

const UDP = [
  {
    from: 0, to: 1, label: 'DNS query', detail: 'UDP → port 53', title: 'Datagram out',
    ask: { q: 'Before sending a UDP DNS query, what does the client do first?', options: ['Three-way handshake', 'Nothing, it just sends', 'Sends SYN', 'Opens a session'], answer: 'Nothing, it just sends' },
    note: 'UDP is connectionless: no handshake, no sequence numbers, no acknowledgments.',
  },
  {
    from: 1, to: 0, label: 'DNS response', detail: 'UDP → client port', title: 'Datagram back',
    ask: { q: 'If this reply is lost, what retransmits it?', options: ['UDP itself', 'The application', 'The router', 'TCP'], answer: 'The application' },
    note: 'UDP never retransmits, so the application has to retry. Low overhead is why DNS, VoIP, live video and TFTP use UDP.',
  },
];

export const TcpOpen = () => (
  <SequenceAnimator lanes={['Client', 'Server']} steps={HANDSHAKE} initialStates={['CLOSED', 'LISTEN']} caption="TCP three-way handshake" />
);
export const TcpClose = () => (
  <SequenceAnimator lanes={['Client', 'Server']} steps={TEARDOWN} initialStates={['ESTABLISHED', 'ESTABLISHED']} caption="TCP connection teardown" />
);
export const UdpCompare = () => <SequenceAnimator lanes={['Client', 'DNS server']} steps={UDP} caption="UDP exchange" />;
