/**
 * sovereign-ternary — balanced ternary (base-3) arithmetic, zero deps.
 *
 * In-house replacement for arbitrary-precision / non-binary logic libraries
 * (bignumber.js, balance-ternary npm packages). Pure string/BigInt math on
 * Node core only. Powers the Base12/ternary state encoding used by the
 * sovereign stack's non-binary logic layer (EM_agent in the COCOMO model).
 */
// We use canonical balanced-ternary symbols: T (-1), 0, 1
const BT = { T: -1, '0': 0, '1': 1 };
/** BigInt (or number) -> balanced ternary string. */
export function toBalancedTernary(n) {
    let x = BigInt(n);
    if (x === 0n)
        return '0';
    const neg = x < 0n;
    if (neg)
        x = -x;
    let out = '';
    while (x > 0n) {
        const r = Number(x % 3n);
        if (r === 2) {
            out = 'T' + out; // 2 == 3*1 - 1 => digit -1 with carry
            x = (x + 1n) / 3n;
        }
        else {
            out = String(r) + out;
            x = x / 3n;
        }
    }
    return neg ? negate(out) : out;
}
/** balanced ternary string -> BigInt. */
export function fromBalancedTernary(bt) {
    let acc = 0n;
    for (const ch of bt) {
        const d = BT[ch];
        if (d === undefined)
            throw new Error(`sovereign-ternary: bad digit '${ch}'`);
        acc = acc * 3n + BigInt(d);
    }
    return acc;
}
export function negate(bt) {
    const map = { T: '1', '1': 'T', '0': '0' };
    return [...bt].map((c) => map[c]).join('').replace(/^(-?)(T|1|0)/, (_m, s, d) => s + d);
}
/** Add two balanced ternary numbers via BigInt round-trip (exact, unbounded). */
export function add(a, b) {
    return toBalancedTernary(fromBalancedTernary(a) + fromBalancedTernary(b));
}
export function mul(a, b) {
    return toBalancedTernary(fromBalancedTernary(a) * fromBalancedTernary(b));
}
export const tnot = (a) => (-a);
export const tand = (a, b) => Math.min(a, b);
export const tor = (a, b) => Math.max(a, b);
/** Kleene strong three-valued implication: ¬a ∨ b */
export const timplies = (a, b) => tor(tnot(a), b);
/** Encode a byte (0-255) as 6 trits (3^6=729 > 256 capacity with sign handling via pairs). */
export function encodeByteToTrits(byte) {
    if (!Number.isInteger(byte) || byte < 0 || byte > 255) {
        throw new Error('sovereign-ternary: byte out of range');
    }
    return toBalancedTernary(BigInt(byte)).padStart(6, '0');
}
export function decodeTritsToByte(bt) {
    const v = fromBalancedTernary(bt);
    if (v < 0n || v > 255n)
        throw new Error('sovereign-ternary: trit string does not encode a byte');
    return Number(v);
}
