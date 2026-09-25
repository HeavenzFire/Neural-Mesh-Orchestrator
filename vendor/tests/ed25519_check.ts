import { publicKeyFromSeed, sign, verify } from '../sovereign-crypto/index.ed25519.ts';

// RFC 8032 §7.1 test vectors
const sk1 = '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60';
const pk1 = 'd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a';
const t = Date.now();
const gotPk1 = publicKeyFromSeed(sk1);
console.log('pk match:', gotPk1 === pk1, gotPk1);
const sig1 = sign('', sk1);
console.log('sig1:', sig1);
console.log('verify1:', verify('', sig1, pk1));
const sk2 = '4ccd089b28ff96da9db6c346ec114e0f5b8a319f35aba624da8cf6ed4fb8a6fb';
const pk2 = '3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c';
const sig2 = sign(Buffer.from('72', 'hex'), sk2);
console.log('sig2:', sig2);
console.log('verify2:', verify(Buffer.from('72','hex'), sig2, pk2));
const bad = Buffer.from(sig2, 'hex'); bad[0] ^= 1;
console.log('tampered verify (expect false):', verify(Buffer.from('72','hex'), bad.toString('hex'), pk2));
console.log('elapsed ms:', Date.now() - t);
