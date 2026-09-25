/**
 * Ed25519 (RFC 8032) — pure BigInt, zero native deps, no OpenSSL bindings.
 *
 * Deliberately NOT using node:crypto.sign: an air-gapped sovereign audit
 * story requires the verification path itself to be inspectable source code
 * that ships in the manifest, not a black-box binding. Cost: ~20-40ms per
 * verify; acceptable for once-per-build manifest attestation.
 *
 * Validated against RFC 8032 §7.1 test vectors 1 & 2 (vendor_selftest).
 */

import { createHash } from 'node:crypto';

const Q = (1n << 255n) - 19n;                        // field prime 2^255-19
const L = (1n << 252n) + 27742317777372353535851937790883648493n; // group order

function mod(a: bigint, m: bigint): bigint { const r = a % m; return r >= 0n ? r : r + m; }
function powmod(b: bigint, e: bigint, m: bigint): bigint {
  let r = 1n; b = mod(b, m);
  while (e > 0n) { if (e & 1n) r = (r * b) % m; b = (b * b) % m; e >>= 1n; }
  return r;
}
function inv(a: bigint, m: bigint): bigint { return powmod(mod(a, m), m - 2n, m); }

const Dv = mod(-121665n * inv(121666n, Q), Q);       // curve constant d
const I_ROOT = powmod(2n, (Q - 1n) / 4n, Q);         // sqrt(-1) in GF(p)

type Point = [bigint, bigint, bigint, bigint]; // extended coords (X, Y, Z, T): x=X/Z, y=Y/Z, xy=T/Z

function xrecover(y: bigint): bigint {
  const xx = mod((y * y - 1n) * inv(mod(mod(Dv * y, Q) * y, Q) + 1n, Q), Q);
  let x = powmod(xx, (Q + 3n) / 8n, Q);
  if (mod(x * x - xx, Q) !== 0n) x = mod(x * I_ROOT, Q);
  if ((x & 1n) === 1n) x = Q - x;
  return x;
}

const By = mod(4n * inv(5n, Q), Q);
const Bx = xrecover(By);
const BASEPOINT: Point = [mod(Bx, Q), mod(By, Q), 1n, mod(Bx * By, Q)];
const IDENTITY: Point = [0n, 1n, 1n, 0n];

/** Unified addition (Hisil et al., "Twisted Edwards Curves Revisited", a=-1). */
function edwardsAdd(Pp: Point, Qp: Point): Point {
  const [x1, y1, z1, t1] = Pp, [x2, y2, z2, t2] = Qp;
  const a = mod((y1 - x1) * (y2 + x1), Q);
  const b = mod((y1 + x1) * (y2 - x1), Q);
  const c = mod(mod(mod(t1 * 2n, Q) * Dv, Q) * t2, Q);
  const dd = mod(mod(z1 * 2n, Q) * z2, Q);
  const e = mod(b - a, Q), f = mod(dd - c, Q), g = mod(dd + c, Q), h = mod(b + a, Q);
  return [mod(e * f, Q), mod(g * h, Q), mod(f * g, Q), mod(e * h, Q)];
}

/** Dedicated doubling — Hisil–Wong–Carter–Jose (CRYPTO 2008), extended
 *  coords, a=-1. NOTE the output T component is (X+Y)·(D−B) − Z·F, i.e.
 *  t' = x'y'z', NOT E·H (a common transcription error that silently breaks
 *  every subsequent add(), since add() requires the invariant T = X·Y/Z). */
function edwardsDouble(Pp: Point): Point {
  const [x, y, z] = Pp;
  const A = mod(x * x, Q);
  const B = mod(y * y, Q);
  const C = mod(2n * mod(z * z, Q), Q);
  const D = mod(Q - A, Q);                                   // D = a·A, a=-1
  const E = mod(mod(mod(x + y, Q) * mod(x + y, Q), Q) - A - B, Q);
  const G = mod(D + B, Q);
  const F = mod(E - C, Q);
  const H = mod(D - B, Q);
  return [
    mod(E * F, Q),
    mod(G * H, Q),
    mod(F * G, Q),
    mod(mod(mod(x + y, Q) * H, Q) - mod(z * F, Q), Q),       // T' = (X+Y)(D−B) − Z·F
  ];
}

/** Iterative double-and-add over bits of e (LSB→MSB). */
export function scalarmult(Pp: Point, e: bigint): Point {
  let R: Point = IDENTITY;
  let Qp: Point = Pp;
  let n = e;
  while (n > 0n) {
    if (n & 1n) R = edwardsAdd(R, Qp);
    Qp = edwardsDouble(Qp);
    n >>= 1n;
  }
  return R;
}

/* ----------------------------- little-endian codec ----------------------- */

function leBytesToInt(b: Buffer): bigint {
  let acc = 0n;
  for (let i = b.length - 1; i >= 0; i--) acc = (acc << 8n) | BigInt(b[i]);
  return acc;
}
function intTo32Le(v: bigint): Buffer {
  const out = Buffer.alloc(32);
  let x = v;
  for (let i = 0; i < 32; i++) { out[i] = Number(x & 0xffn); x >>= 8n; }
  return out;
}
function encodepoint(Pp: Point): Buffer {
  const [x, y, z] = Pp;
  const zi = inv(z, Q);
  const xf = mod(x * zi, Q), yf = mod(y * zi, Q);
  return intTo32Le(yf | ((xf & 1n) << 255n));
}
/** Affine membership: -x² + y² = 1 + d·x²·y²  (plus extended-coord consistency). */
function isoncurve(Pp: Point): boolean {
  const [X, Y, Z, T] = Pp;
  if (mod(Z, Q) === 0n) return false;
  const Zi = inv(Z, Q);
  const x = mod(X * Zi, Q), y = mod(Y * Zi, Q);
  const xx = mod(x * x, Q), yy = mod(y * y, Q);
  return mod(yy - xx - 1n - mod(mod(Dv * xx, Q) * yy, Q), Q) === 0n
      && mod(X * Y, Q) === mod(Z * T, Q);
}
function decodepoint(s: Buffer): Point {
  if (s.length !== 32) throw new Error('ed25519: point must be 32 bytes');
  const signBit = BigInt((s[31] >> 7) & 1);
  const y = leBytesToInt(s.subarray(0, 31)) | (signBit << 255n);
  let x = xrecover(mod(y, Q));
  if ((x & 1n) !== signBit) x = Q - x;
  const Pp: Point = [x, mod(y, Q), 1n, mod(x * y, Q)];
  if (!isoncurve(Pp)) throw new Error('ed25519: point not on curve');
  return Pp;
}

/* ------------------------------ hashing ---------------------------------- */

function H(m: Buffer): bigint {
  return leBytesToInt(createHash('sha512').update(m).digest());
}
/** Key scalar: little-endian SHA-512 prefix with bit0-2 cleared, bit254 set, bit255 cleared. */
function clampScalar(h: Buffer): bigint {
  let a = leBytesToInt(h.subarray(0, 32));
  a &= ~0b111n;
  a &= ~(1n << 255n);
  a |= 1n << 254n;
  return a;
}

/* ------------------------------- public API ------------------------------ */

export interface Ed25519KeyPair { seedHex: string; publicHex: string; }

export function publicKeyFromSeed(seedHex: string): string {
  const seed = Buffer.from(seedHex, 'hex');
  if (seed.length !== 32) throw new Error('ed25519: seed must be 32 bytes');
  const h = createHash('sha512').update(seed).digest();
  return encodepoint(scalarmult(BASEPOINT, clampScalar(h))).toString('hex');
}

export function generateKeypair(seedHex?: string): Ed25519KeyPair {
  const seed = seedHex
    ? Buffer.from(seedHex, 'hex')
    : require('node:crypto').randomBytes(32) as Buffer;
  if (seed.length !== 32) throw new Error('ed25519: seed must be 32 bytes');
  const hex = seed.toString('hex');
  return { seedHex: hex, publicHex: publicKeyFromSeed(hex) };
}

/** Deterministic signature over msg with the key derived from seedHex. */
export function sign(msg: string | Buffer, seedHex: string): string {
  const seed = Buffer.from(seedHex, 'hex');
  const pk = Buffer.from(publicKeyFromSeed(seedHex), 'hex');
  const m = typeof msg === 'string' ? Buffer.from(msg, 'utf8') : msg;
  const h = createHash('sha512').update(seed).digest();
  const a = clampScalar(h);
  const r = H(Buffer.concat([h.subarray(32), m]));
  const R = scalarmult(BASEPOINT, r);
  const k = H(Buffer.concat([encodepoint(R), pk, m]));
  const S = mod(r + k * a, L);
  return Buffer.concat([encodepoint(R), intTo32Le(S)]).toString('hex');
}

/** Verify [S]B == R + [k]A. Returns false on any malformed input. */
export function verify(msg: string | Buffer, sigHex: string, publicHex: string): boolean {
  try {
    const sig = Buffer.from(sigHex, 'hex');
    const pk = Buffer.from(publicHex, 'hex');
    if (sig.length !== 64 || pk.length !== 32) return false;
    const m = typeof msg === 'string' ? Buffer.from(msg, 'utf8') : msg;
    const R = decodepoint(sig.subarray(0, 32));
    const A = decodepoint(pk);
    const S = leBytesToInt(sig.subarray(32));
    if (S >= L) return false;
    const k = H(Buffer.concat([sig.subarray(0, 32), pk, m]));
    const lhs = scalarmult(BASEPOINT, S);
    const rhs = edwardsAdd(R, scalarmult(A, k));
    return mod(lhs[0] * rhs[2] - rhs[0] * lhs[2], Q) === 0n
        && mod(lhs[1] * rhs[2] - rhs[1] * lhs[2], Q) === 0n;
  } catch {
    return false;
  }
}
