// IPv4 / IPv6 helpers used by the labs. IPv4 values are unsigned 32-bit ints.

export function ipToInt(ip) {
  const parts = String(ip).trim().split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const v = Number(p);
    if (v > 255) return null;
    n = n * 256 + v;
  }
  return n >>> 0;
}

export function intToIp(n) {
  n = n >>> 0;
  return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}

export function prefixToMask(prefix) {
  return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
}

export function maskToPrefix(maskInt) {
  let p = 0;
  let m = maskInt >>> 0;
  while (m & 0x80000000) { p++; m = (m << 1) >>> 0; }
  return m === 0 ? p : null; // null = non-contiguous mask
}

export function parseCidrOrMask(str) {
  const s = String(str).trim().replace(/^\//, '');
  if (/^\d{1,2}$/.test(s) && Number(s) <= 32) return Number(s);
  const m = ipToInt(s);
  return m == null ? null : maskToPrefix(m);
}

export function subnetInfo(ipInt, prefix) {
  const mask = prefixToMask(prefix);
  const network = (ipInt & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const total = 2 ** (32 - prefix);
  let first, last, usable;
  if (prefix === 32) { first = last = network; usable = 1; }
  else if (prefix === 31) { first = network; last = broadcast; usable = 2; }
  else { first = network + 1; last = broadcast - 1; usable = total - 2; }
  return { mask, network, broadcast, first: first >>> 0, last: last >>> 0, total, usable, wildcard: ~mask >>> 0 };
}

export const toBin32 = (n) => (n >>> 0).toString(2).padStart(32, '0');
export const octetBits = (n) => toBin32(n).match(/.{8}/g);

export function ipv4Facts(ipInt) {
  const o1 = ipInt >>> 24;
  const o2 = (ipInt >>> 16) & 255;
  let cls, defaultPrefix;
  if (o1 < 128) { cls = 'A'; defaultPrefix = 8; }
  else if (o1 < 192) { cls = 'B'; defaultPrefix = 16; }
  else if (o1 < 224) { cls = 'C'; defaultPrefix = 24; }
  else if (o1 < 240) { cls = 'D'; defaultPrefix = null; }
  else { cls = 'E'; defaultPrefix = null; }

  const o3 = (ipInt >>> 8) & 255;
  let kind = 'Public (globally routable)';
  if (ipInt === 0xffffffff) kind = 'Limited broadcast';
  else if ((o1 === 192 && o2 === 0 && o3 === 2) || (o1 === 198 && o2 === 51 && o3 === 100) || (o1 === 203 && o2 === 0 && o3 === 113)) kind = 'Documentation (TEST-NET, never routed)';
  else if (o1 === 198 && (o2 === 18 || o2 === 19)) kind = 'Benchmark testing (RFC 2544, not routed)';
  else if (o1 === 192 && o2 === 0 && o3 === 0) kind = 'Special use (IETF protocol assignments)';
  else if (o1 === 10 || (o1 === 172 && o2 >= 16 && o2 <= 31) || (o1 === 192 && o2 === 168)) kind = 'Private (RFC 1918)';
  else if (o1 === 127) kind = 'Loopback';
  else if (o1 === 169 && o2 === 254) kind = 'APIPA / link-local (DHCP failed)';
  else if (o1 === 100 && o2 >= 64 && o2 <= 127) kind = 'Carrier-grade NAT (RFC 6598)';
  else if (cls === 'D') kind = 'Multicast';
  else if (cls === 'E') kind = 'Experimental / reserved';
  else if (o1 === 0) kind = 'This network / unspecified';
  return { cls, defaultPrefix, kind };
}

// ---------- IPv6 ----------

/** Returns 8 hextet numbers or null. Handles :: and embedded IPv4 tails. */
export function parseIPv6(input) {
  let s = String(input).trim().toLowerCase().replace(/^\[|\]$/g, '').split('%')[0];
  if (!s || /[^0-9a-f:.]/.test(s)) return null;
  const v4 = s.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (v4) {
    const n = ipToInt(v4[1]);
    if (n == null) return null;
    s = s.slice(0, -v4[1].length) + ((n >>> 16).toString(16)) + ':' + ((n & 0xffff).toString(16));
  }
  const dbl = s.split('::');
  if (dbl.length > 2) return null;
  const head = dbl[0] ? dbl[0].split(':') : [];
  const tail = dbl.length === 2 && dbl[1] ? dbl[1].split(':') : [];
  const fill = 8 - head.length - tail.length;
  if (dbl.length === 1 && head.length !== 8) return null;
  if (dbl.length === 2 && fill < 1) return null;
  const all = [...head, ...Array(dbl.length === 2 ? fill : 0).fill('0'), ...tail];
  if (all.length !== 8) return null;
  const out = [];
  for (const h of all) {
    if (!/^[0-9a-f]{1,4}$/.test(h)) return null;
    out.push(parseInt(h, 16));
  }
  return out;
}

export const expandIPv6 = (h) => h.map((x) => x.toString(16).padStart(4, '0')).join(':');
export const dropLeadingZeros = (h) => h.map((x) => x.toString(16)).join(':');

/** RFC 5952 canonical form: longest run (≥2) of zero hextets becomes ::. */
export function compressIPv6(h) {
  const best = zeroRun(h);
  const parts = h.map((x) => x.toString(16));
  if (best.len < 2) return parts.join(':');
  const left = parts.slice(0, best.start).join(':');
  const right = parts.slice(best.start + best.len).join(':');
  return `${left}::${right}`;
}

export function zeroRun(h) {
  let best = { start: -1, len: 0 };
  let cur = { start: -1, len: 0 };
  h.forEach((x, i) => {
    if (x === 0) {
      if (cur.start === -1) cur = { start: i, len: 0 };
      cur.len++;
      if (cur.len > best.len) best = { ...cur };
    } else cur = { start: -1, len: 0 };
  });
  return best.len >= 2 ? best : { start: -1, len: 0 };
}

export function ipv6Type(h) {
  const first = h[0];
  if (h.every((x) => x === 0)) return { name: 'Unspecified (::)', prefix: '::/128' };
  if (h.slice(0, 7).every((x) => x === 0) && h[7] === 1) return { name: 'Loopback (::1)', prefix: '::1/128' };
  if ((first & 0xffc0) === 0xfe80) return { name: 'Link-local unicast', prefix: 'fe80::/10' };
  if ((first & 0xfe00) === 0xfc00) return { name: 'Unique local (private)', prefix: 'fc00::/7' };
  if ((first & 0xff00) === 0xff00) return { name: 'Multicast', prefix: 'ff00::/8' };
  if ((first & 0xe000) === 0x2000) return { name: 'Global unicast (public)', prefix: '2000::/3' };
  if (h.slice(0, 5).every((x) => x === 0) && h[5] === 0xffff) return { name: 'IPv4-mapped', prefix: '::ffff:0:0/96' };
  return { name: 'Reserved / other', prefix: '' };
}
