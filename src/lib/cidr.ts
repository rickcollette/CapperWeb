/** IPv4 CIDR helpers for client-side validation (mirrors backend vpc.ContainsCIDR). */

function parseCidr(cidr: string): { network: number; prefix: number } | null {
  const m = /^(\d+)\.(\d+)\.(\d+)\.(\d+)\/(\d+)$/.exec(cidr.trim());
  if (!m) return null;
  const octets = m.slice(1, 5).map((x) => Number(x));
  const prefix = Number(m[5]);
  if (prefix < 0 || prefix > 32 || octets.some((o) => o > 255 || o < 0)) return null;
  const ip = ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return { network: ip & mask, prefix };
}

export function cidrContains(parent: string, child: string): boolean {
  const p = parseCidr(parent);
  const c = parseCidr(child);
  if (!p || !c) return false;
  if (c.prefix < p.prefix) return false;
  const mask = p.prefix === 0 ? 0 : (0xffffffff << (32 - p.prefix)) >>> 0;
  return (p.network & mask) === (c.network & mask);
}

export function isValidCidr(cidr: string): boolean {
  return parseCidr(cidr) !== null;
}
