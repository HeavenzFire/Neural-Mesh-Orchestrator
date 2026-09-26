import { createHash } from 'node:crypto';
const Q = (1n << 255n) - 19n;
function mod(a: bigint, m: bigint) { const r = a % m; return r >= 0n ? r : r + m; }
function powmod(b: bigint, e: bigint, m: bigint): bigint { let r = 1n; b = mod(b, m); while (e > 0n) { if (e & 1n) r = (r * b) % m; b = (b * b) % m; e >>= 1n; } return r; }
function inv(a: bigint, m: bigint) { return powmod(mod(a, m), m - 2n, m); }
const Dv = mod(-121665n * inv(121666n, Q), Q);
type Aff = [bigint, bigint];
function aAdd(Pp: Aff, Qq: Aff): Aff {
  const [x1,y1] = Pp, [x2,y2] = Qq;
  const xy = mod(x1*x2, Q), yy = mod(y1*y2, Q);
  const dx = mod(Dv*xy, Q);
  return [mod(mod(x1*yy + y1*x2, Q)*inv(mod(1n+dx,Q),Q),Q),
          mod(mod(yy + x1*x2, Q)*inv(mod(1n-dx,Q),Q),Q)];
}
const By = mod(4n*inv(5n,Q),Q);
// RFC 8032 sqrt for p≡5 mod 8 with the (-1|p/x) branch
const xx = mod((By*By-1n)*inv(mod(Dv*By*By+1n,Q),Q),Q);
let Bx: bigint;
{
  const exp1 = (Q - 5n) / 8n;
  const i = powmod(2n, (Q - 1n) / 4n, Q); // sqrt(-1)
  let x = powmod(xx, exp1, Q);
  const check = mod(x*x, Q);
  if (check === xx) Bx = x;
  else if (check === mod(-xx, Q)) Bx = mod(x*i, Q);
  else throw new Error('not square');
  if ((Bx & 1n) === 1n) Bx = Q - Bx; // want even root (RFC: x is even unless sign bit set)
}
console.log('Bx:', Bx.toString(16));
console.log('want: 2782d7bfd86d56c17e0b...');
// encode basepoint LE: y | (x&1)<<255
function intTo32Le(v: bigint): Buffer { const o=Buffer.alloc(32); let x=v; for(let i=0;i<32;i++){o[i]=Number(x&0xffn);x>>=8n;} return o; }
console.log('enc B:', intTo32Le(By | ((Bx&1n)<<255n)).toString('hex'));
console.log('want h(B)= 5866666666666666666666666666666666666666666666666666666666666666');
