/**
 * mesh_selftest — adversarial verification for sovereign-nodeid + sovereign-gossip.
 * Run: npx tsx vendor/tests/mesh_selftest.ts  (dev) or compiled dist under netns (proof).
 */
import { describe, it, expect, run } from '../sovereign-test/index.ts';
import { generateKeypair, publicKeyFromSeed, sign, verify } from '../sovereign-crypto/index.ed25519.ts';
import {
  identityFromPublicKey, deriveNodeId, proveOwnership, verifyOwnership,
  xorDistance, bucketIndex, KBucket, RoutingTable,
} from '../sovereign-nodeid/index.ts';
import { GossipNode, serializeMessage, messageId, type GossipNet } from '../sovereign-gossip/index.ts';

function makeNode(seed?: string) {
  const kp = generateKeypair(seed);
  return { ...kp, id: identityFromPublicKey(kp.publicHex) };
}

describe('sovereign-nodeid: derivation & proofs', () => {
  it('id is deterministic SHA-256(pubkey) and stable across calls', () => {
    const n = makeNode();
    expect(deriveNodeId(n.publicHex)).toBe(n.id.nodeIdHex);
    expect(n.id.nodeIdHex.length).toBe(64);
  });

  it('valid ownership proof verifies; wrong-id binding fails closed', () => {
    const n = makeNode();
    const good = proveOwnership(n.id.nodeIdHex, n.publicHex, n.seedHex);
    expect(verifyOwnership(n.id.nodeIdHex, n.publicHex, good)).toBe(true);
    const other = makeNode();
    // proof over attacker-chosen id with victim pubkey must fail structural check
    expect(verifyOwnership(other.id.nodeIdHex, n.publicHex, good)).toBe(false);
  });

  it('adversarial: forged sig, truncated hex, mismatched key all return false (never throw)', () => {
    const n = makeNode();
    const good = proveOwnership(n.id.nodeIdHex, n.publicHex, n.seedHex);
    const flipped = { sigHex: (good.sigHex[0] === 'a' ? 'b' : 'a') + good.sigHex.slice(1) };
    expect(verifyOwnership(n.id.nodeIdHex, n.publicHex, flipped)).toBe(false);
    expect(verifyOwnership(n.id.nodeIdHex, n.publicHex, { sigHex: 'zz' + good.sigHex.slice(2) })).toBe(false);
    expect(verifyOwnership('00'.repeat(32), n.publicHex, good)).toBe(false); // id not derived from key
    expect(verifyOwnership(n.id.nodeIdHex, n.publicHex, null as any)).toBe(false);
  });

  it('proveOwnership refuses to sign a mismatched (id,pk) pair', () => {
    const a = makeNode(), b = makeNode();
    let threw = false;
    try { proveOwnership(b.id.nodeIdHex, a.publicHex, a.seedHex); } catch { threw = true; }
    expect(threw).toBe(true);
  });
});

describe('sovereign-nodeid: XOR metric properties', () => {
  it('identity, symmetry hold; triangle inequality on random ids', () => {
    const ns = Array.from({ length: 40 }, () => makeNode());
    for (const n of ns) expect(xorDistance(n.id.nodeIdHex, n.id.nodeIdHex)).toBe(0n);
    for (let i = 0; i < 200; i++) {
      const a = ns[i % 40].id.nodeIdHex, b = ns[(i * 7 + 1) % 40].id.nodeIdHex, c = ns[(i * 13 + 3) % 40].id.nodeIdHex;
      expect(xorDistance(a, b)).toBe(xorDistance(b, a));
      const dAB = xorDistance(a, b), dBC = xorDistance(b, c), dAC = xorDistance(a, c);
      if (dAC > dAB + dBC) throw new Error(`triangle violated at ${i}`);
    }
  });

  it('bucketIndex maps distance to floor(log2(d)) correctly', () => {
    expect(bucketIndex(0n)).toBe(-1);
    expect(bucketIndex(1n)).toBe(0);
    expect(bucketIndex(2n)).toBe(1);
    expect(bucketIndex(3n)).toBe(1);
    expect(bucketIndex(4n)).toBe(2);
    expect(bucketIndex(1n << 255n)).toBe(255);
  });

  it('adversarial: malformed hex distances throw, never silently compute', () => {
    let t1 = false, t2 = false;
    try { xorDistance('nothex', '00'.repeat(32)); } catch { t1 = true; }
    try { xorDistance('00'.repeat(31) + 'g0', '00'.repeat(32)); } catch { t2 = true; }
    expect(t1).toBe(true); expect(t2).toBe(true);
  });
});

describe('sovereign-nodeid: KBucket & RoutingTable', () => {
  it('full bucket rejects newcomers but refreshes existing entries', () => {
    const k = new KBucket(3);
    const ids = Array.from({ length: 5 }, () => makeNode().id.nodeIdHex);
    for (const id of ids.slice(0, 3)) expect(k.insert({ nodeIdHex: id, lastSeenMs: 1 })).toBe(true);
    expect(k.insert({ nodeIdHex: ids[3], lastSeenMs: 2 })).toBe(false);
    expect(k.insert({ nodeIdHex: ids[0], lastSeenMs: 99 })).toBe(true); // refresh ok
    expect(k.entries.find(e => e.nodeIdHex === ids[0])!.lastSeenMs).toBe(99);
  });

  it('routing table never self-adds and nearestPeers orders by XOR ascending', () => {
    const local = makeNode(), peers = Array.from({ length: 10 }, () => makeNode());
    const rt = new RoutingTable(local.id.nodeIdHex);
    expect(rt.addPeer(local.id.nodeIdHex, 1)).toBe(false);
    for (const p of peers) expect(rt.addPeer(p.id.nodeIdHex, 1)).toBe(true);
    const target = makeNode().id.nodeIdHex;
    const near = rt.nearestPeers(target, 4).map(e => e.nodeIdHex);
    expect(near.length).toBe(4);
    for (let i = 1; i < near.length; i++) {
      if (xorDistance(near[i - 1], target) > xorDistance(near[i], target)) throw new Error('not sorted');
    }
  });

  it('adversarial: latency metadata cannot reorder nearestPeers (anti-Sybil invariant)', () => {
    const local = makeNode();
    const honest = makeNode(), liar = makeNode();
    const rt = new RoutingTable(local.id.nodeIdHex);
    rt.addPeer(honest.id.nodeIdHex, 1, 500);   // honest reports real latency
    rt.addPeer(liar.id.nodeIdHex, 1, 0);       // liar claims 0ms
    const target = makeNode().id.nodeIdHex;
    const [first] = rt.nearestPeers(target, 2);
    expect(first.nodeIdHex).toBe(
      xorDistance(honest.id.nodeIdHex, target) <= xorDistance(liar.id.nodeIdHex, target)
        ? honest.id.nodeIdHex : liar.id.nodeIdHex);
  });
});

/* --------------------------- gossip cluster ----------------------------- */

function buildCluster(size: number) {
  const nodes = Array.from({ length: size }, () => makeNode());
  const tables = nodes.map(n => new RoutingTable(n.id.nodeIdHex, 8));
  const nets: GossipNet[] = [];
  const gossips: GossipNode[] = [];
  const queues: string[][] = Array.from({ length: size }, () => []);
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) if (i !== j) tables[i].addPeer(nodes[j].id.nodeIdHex, 1);
  }
  for (let i = 0; i < size; i++) {
    nets.push({ send: (id, json) => { const j = nodes.findIndex(n => n.id.nodeIdHex === id); if (j < 0) return false; queues[j].push(json); return true; } });
    gossips.push(new GossipNode(nodes[i].seedHex, nodes[i].id, nets[i], tables[i], { fanout: 8 }));
  }
  async function drain(maxRounds = 10) {
    for (let r = 0; r < maxRounds; r++) {
      let any = false;
      for (const q of queues) while (q.length) { any = true; const m = q.shift()!; await Promise.all(gossips.map((g, i) => g.receive(m).catch(() => false))); }
      if (!any) break;
    }
  }
  return { nodes, gossips, drain };
}

describe('sovereign-gossip: authenticated propagation', () => {
  it('publish reaches subscribers across a 5-node mesh exactly once each', async () => {
    const { gossips, drain } = buildCluster(5);
    const got: string[] = [];
    for (const g of gossips) g.subscribe('state', (m) => { got.push(Buffer.from(m.payloadB64, 'base64').toString()); });
    gossips[0].publish('state', Buffer.from('mutation-A'));
    await drain();
    // Origin does not self-deliver (no loopback in GossipNet); the other 4 must each get it exactly once.
    expect(got.filter(x => x === 'mutation-A').length).toBe(4);
  });

  it('tampered payload in transit is rejected (signature covers payload)', async () => {
    const { gossips, nodes, drain } = buildCluster(3);
    const msg = gossips[0].publish('state', Buffer.from('real'))!;
    const evil = JSON.parse(JSON.stringify(msg)); evil.payloadB64 = Buffer.from('evil').toString('base64');
    let accepted = 0;
    gossips[1].subscribe('state', () => accepted++);
    await gossips[1].receive(JSON.stringify(evil));
    expect(accepted).toBe(0);
    expect(gossips[1].rejectedCount).toBe(1);
  });

  it('replayed duplicate message is deduped, not re-delivered', async () => {
    const { gossips, drain } = buildCluster(2);
    let hits = 0;
    gossips[1].subscribe('t', () => hits++);
    const msg = gossips[0].publish('t', Buffer.from('x'))!;
    const raw = JSON.stringify(msg);
    await gossips[1].receive(raw);
    await gossips[1].receive(raw);
    expect(hits).toBe(1);
    expect(gossips[1].dupCount).toBe(1);
  });

  it('unsubscribed topic drops delivery; stale timestamp fails closed', async () => {
    const { gossips } = buildCluster(2);
    const msg = gossips[0].publish('topic-x', Buffer.from('y'))!;
    const res = await gossips[1].receive(JSON.stringify(msg)); // no subscriber yet
    expect(res).toBe(false);
    const old = JSON.parse(JSON.stringify(gossips[0].publish('t2', Buffer.from('z'))!));
    old.issuedAtMs = Date.now() - 120_000; // beyond TTL+skew
    gossips[1].subscribe('t2', () => { throw new Error('must not deliver'); });
    expect(await gossips[1].receive(JSON.stringify(old))).toBe(false);
  });
});


describe('sovereign-crypto: Ed25519 RFC 8032 §7.1 vectors', () => {
  it('vector 1: empty message pubkey+sig match spec', () => {
    const seed = '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60';
    const pk = 'd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a';
    const sig = 'e5564300c360ac729086e16611a946623651cf57796cb74155fb6b0fd49f138b5cb45ae41d3d7ca5d7a0d4ef322ffabc6e26eb095b4a4f8c7f187fe8d5608f0f';
    expect(publicKeyFromSeed(seed)).toBe(pk);
    expect(sign('', seed)).toBe(sig);
    expect(verify('', sig, pk)).toBe(true);
  });

  it('vector 2: single-byte message roundtrip + tamper rejection', () => {
    const seed = '4ccd089b28ff96da9db6c346ec114e0f5b8a319f35aba624da8cf6ed4fb8a6fb';
    const pk = '3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c';
    const msgHex = '72';
    const sig = '92a009a9f0d4cab8720e820b5f642540a2b27b5416503f8fb3762223ebdb69da085ac1e43e15996e458f3613d0f11d8c387b2eaeb4302aeeb00d29161bbbc2';
    expect(publicKeyFromSeed(seed)).toBe(pk);
    expect(sign(Buffer.from(msgHex, 'hex'), seed)).toBe(sig);
    expect(verify(Buffer.from(msgHex, 'hex'), sig, pk)).toBe(true);
    // flip one bit of the signature -> must reject
    const bad = sig.slice(0, 2) === '92' ? '93' + sig.slice(2) : '92' + sig.slice(2);
    expect(verify(Buffer.from(msgHex, 'hex'), bad, pk)).toBe(false);
  });
});

run().then((f) => process.exit(f));
