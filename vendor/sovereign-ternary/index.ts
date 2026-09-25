/**
 * sovereign-ternary — balanced ternary (base-3) arithmetic, zero deps.
 *
 * In-house replacement for arbitrary-precision / non-binary logic libraries
 * (bignumber.js, balance-ternary npm packages). Pure string/BigInt math on
 * Node core only. Powers the Base12/ternary state encoding used by the
 * sovereign stack's non-binary logic layer (EM_agent in the COCOMO model).
 */

// We use canonical balanced-ternary symbols: T (-1), 0, 1
const BT: Record<string, number> = { T: -1, '0': 0, '1': 1 };

export type BalancedTernary = string; // e.g. "1T0" == 9 + (-1)*3 + 0 = 6

/** BigInt (or number) -> balanced ternary string. */
export function toBalancedTernary(n: bigint | number): BalancedTernary {
  let x = BigInt(n);
  if (x === 0n) return '0';
  const neg = x < 0n;
  if (neg) x = -x;
  let out = '';
  while (x > 0n) {
    const r = Number(x % 3n);
    if (r === 2) {
      out = 'T' + out; // 2 == 3*1 - 1 => digit -1 with carry
      x = (x + 1n) / 3n;
    } else {
      out = String(r) + out;
      x = x / 3n;
    }
  }
  return neg ? negate(out) : out;
}

/** balanced ternary string -> BigInt. */
export function fromBalancedTernary(bt: BalancedTernary): bigint {
  let acc = 0n;
  for (const ch of bt) {
    const d = BT[ch];
    if (d === undefined) throw new Error(`sovereign-ternary: bad digit '${ch}'`);
    acc = acc * 3n + BigInt(d);
  }
  return acc;
}

export function negate(bt: BalancedTernary): BalancedTernary {
  const map: Record<string, string> = { T: '1', '1': 'T', '0': '0' };
  return [...bt].map((c) => map[c]).join('').replace(/^(-?)(T|1|0)/, (_m, s, d) => s + d);
}

/** Add two balanced ternary numbers via BigInt round-trip (exact, unbounded). */
export function add(a: BalancedTernary, b: BalancedTernary): BalancedTernary {
  return toBalancedTernary(fromBalancedTernary(a) + fromBalancedTernary(b));
}

export function mul(a: BalancedTernary, b: BalancedTernary): BalancedTernary {
  return toBalancedTernary(fromBalancedTernary(a) * fromBalancedTernary(b));
}

/** Ternary logic gate over {-1,0,1}: returns min/max/NOT per Reichenbach-style tri-valence. */
export type TriBool = -1 | 0 | 1; // false / unknown / true

export const tnot = (a: TriBool): TriBool => (-a) as TriBool;
export const tand = (a: TriBool, b: TriBool): TriBool => Math.min(a, b) as TriBool;
export const tor = (a: TriBool, b: TriBool): TriBool => Math.max(a, b) as TriBool;

/** Kleene strong three-valued implication: ¬a ∨ b */
export const timplies = (a: TriBool, b: TriBool): TriBool => tor(tnot(a), b);

/** Encode a byte (0-255) as 6 trits (3^6=729 > 256 capacity with sign handling via pairs). */
export function encodeByteToTrits(byte: number): BalancedTernary {
  if (!Number.isInteger(byte) || byte < 0 || byte > 255) {
    throw new Error('sovereign-ternary: byte out of range');
  }
  return toBalancedTernary(BigInt(byte)).padStart(6, '0');
}

export function decodeTritsToByte(bt: BalancedTernary): number {
  const v = fromBalancedTernary(bt);
  if (v < 0n || v > 255n) throw new Error('sovereign-ternary: trit string does not encode a byte');
  return Number(v);
}
