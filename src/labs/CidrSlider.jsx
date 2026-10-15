import { useState } from 'react';
import { intToIp, ipToInt, prefixToMask, subnetInfo } from '../lib/net.js';
import { Bits } from './Subnetting.jsx';

export default function CidrSlider() {
  const [prefix, setPrefix] = useState(26);
  const [ipText, setIpText] = useState('192.168.10.77');
  const ip = ipToInt(ipText);
  const info = subnetInfo(ip ?? 0, prefix);
  const mask = prefixToMask(prefix);
  const hostBits = 32 - prefix;
  const octet = Math.min(3, Math.floor(prefix / 8));
  const maskOctet = (mask >>> (24 - octet * 8)) & 255;
  const usable = prefix === 32 ? '1 (host route)' : prefix === 31 ? '2 (point-to-point link, RFC 3021)' : info.usable.toLocaleString();

  return (
    <>
      <div className="section stack-lg">
        <div className="row between" style={{ alignItems: 'baseline' }}>
          <span className="drill-prompt mono">/{prefix}</span>
          <span className="mono muted">{intToIp(mask)}</span>
        </div>
        <input
          type="range"
          className="range"
          min={0}
          max={32}
          value={prefix}
          onChange={(e) => setPrefix(Number(e.target.value))}
          aria-label="CIDR prefix length"
        />
        <div className="row" style={{ gap: 6 }}>
          {[8, 16, 24, 25, 26, 27, 28, 29, 30].map((n) => (
            <button key={n} className={`btn small ${n === prefix ? 'primary' : 'quiet'}`} onClick={() => setPrefix(n)}>
              /{n}
            </button>
          ))}
        </div>
        <div className="bitwrap">
          <div className="bitrow">
            <span className="lbl">Mask bits</span>
            <Bits value={mask} prefix={prefix} />
            <span className="dec">{intToIp(mask)}</span>
          </div>
        </div>
        <div className="legend">
          <span><i style={{ background: 'var(--fill)' }} />{prefix} network bits</span>
          <span><i />{hostBits} host bits</span>
        </div>
      </div>
      <div className="section two-col">
        <div className="kv">
          <div>Subnet mask</div><div>{intToIp(mask)}</div>
          <div>Wildcard mask</div><div>{intToIp(info.wildcard)}</div>
          <div>Total addresses</div><div>2^{hostBits} = {info.total.toLocaleString()}</div>
          <div>Usable hosts</div><div>{usable}</div>
          <div>Block size</div><div>{prefix === 0 ? 'everything' : `${256 - maskOctet === 0 ? 256 : 256 - maskOctet} in octet ${octet + 1}`}</div>
          <div>Subnets in a /24</div><div>{prefix >= 24 ? 2 ** (prefix - 24) : '—'}</div>
          <div>Classful default</div><div>{prefix === 8 ? 'Class A' : prefix === 16 ? 'Class B' : prefix === 24 ? 'Class C' : '—'}</div>
        </div>
        <div className="stack">
          <label htmlFor="cidr-ip" style={{ fontWeight: 600, fontSize: 13 }}>Try an address in this /{prefix}</label>
          <input id="cidr-ip" className={`input ${ip == null ? 'bad' : ''}`} value={ipText} onChange={(e) => setIpText(e.target.value)} inputMode="decimal" spellCheck={false} />
          {ip != null ? (
            <div className="kv">
              <div>Network</div><div>{intToIp(info.network)}/{prefix}</div>
              <div>First host</div><div>{intToIp(info.first)}</div>
              <div>Last host</div><div>{intToIp(info.last)}</div>
              <div>Broadcast</div><div>{prefix >= 31 ? 'none' : intToIp(info.broadcast)}</div>
            </div>
          ) : (
            <p className="bad-text" style={{ fontSize: 13 }}>Enter a dotted IPv4 address like 10.4.20.9</p>
          )}
        </div>
      </div>
      <div className="section stack">
        <div className="eyebrow">Cheat sheet · last octet</div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>CIDR</th><th>Mask</th><th>Block</th><th>Usable hosts</th><th>Subnets / 24</th></tr>
            </thead>
            <tbody>
              {[24, 25, 26, 27, 28, 29, 30].map((n) => (
                <tr key={n} className={`clickable ${n === prefix ? 'sel' : ''}`} onClick={() => setPrefix(n)}>
                  <td className="mono">/{n}</td>
                  <td className="mono">{intToIp(prefixToMask(n))}</td>
                  <td className="mono">{2 ** (32 - n)}</td>
                  <td className="mono">{2 ** (32 - n) - 2}</td>
                  <td className="mono">{2 ** (n - 24)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
