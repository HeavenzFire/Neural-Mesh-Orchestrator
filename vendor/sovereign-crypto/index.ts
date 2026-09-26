/**
 * sovereign-crypto — SHA-256 hash-chain ledger + Merkle proofs, zero deps.
 *
 * Replaces external audit-ledger packages (merkle-tools, sqlchain, etc.).
 * Built directly on node:crypto so it runs in any air-gapped container with
 * only the Node runtime present. Every append is chained to its predecessor,
 * giving tamper-evident local state persistence (the "Ledger" pillar of the
 * G7 offline-verification protocol).
 */

import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

export interface LedgerBlock {
  index: number;
  timestamp: string;
  event: string;
  payload: unknown;
  prevHash: string;
  hash: string;
}

export const GENESIS_HASH = '0'.repeat(64);

export function sha256(data: string | Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

function blockPreimage(b: Omit<LedgerBlock, 'hash'>): string {
  return `${b.index}|${b.timestamp}|${b.event}|${JSON.stringify(b.payload)}|${b.prevHash}`;
}

export interface SignedEnvelope {
  format: 'sovereign-ledger-v1';
  genesis: string;
  blocks: LedgerBlock[];
  /** HMAC over the canonical head attestation string, keyed by the ledger secret. */
  envelopeSig: string;
  headHash: string;
}

/** Canonical preimage for a ledger head — identical on both sides of export/import. */
export function headAttestation(genesis: string, blocks: LedgerBlock[]): string {
  const h = blocks[blocks.length - 1];
  return `sovereign-ledger-v1|${genesis}|${blocks.length}|${h ? h.hash : GENESIS_HASH}`;
}

export class HashChainLedger {
  private blocks: LedgerBlock[] = [];
  private secret: Buffer;

  constructor(hmacSecret?: string) {
    // Fail closed: an explicit empty/whitespace secret is rejected rather than
    // silently falling back to a random one (which would break re-import signing).
    if (hmacSecret !== undefined && hmacSecret.trim() === '') {
      throw new Error('sovereign-crypto: empty HMAC secret rejected');
    }
    this.secret = Buffer.from(hmacSecret ?? randomUUID());
  }

  /** Rebind the signing secret (e.g. supply the original key out-of-band after import). */
  withSecret(secret: string): this {
    if (secret.trim() === '') throw new Error('sovereign-crypto: empty HMAC secret rejected');
    this.secret = Buffer.from(secret);
    return this;
  }

  append(event: string, payload: unknown = null): LedgerBlock {
    const prevHash = this.blocks.length
      ? this.blocks[this.blocks.length - 1].hash
      : GENESIS_HASH;
    const partial: Omit<LedgerBlock, 'hash'> = {
      index: this.blocks.length,
      timestamp: new Date().toISOString(),
      event,
      payload,
      prevHash,
    };
    const block: LedgerBlock = { ...partial, hash: sha256(blockPreimage(partial)) };
    this.blocks.push(block);
    return block;
  }

  head(): LedgerBlock | null {
    return this.blocks.length ? this.blocks[this.blocks.length - 1] : null;
  }

  /** Walk the chain and verify linkage + recomputed hashes. Fail-closed. */
  validate(): { ok: boolean; brokenAt?: number; reason?: string } {
    for (let i = 0; i < this.blocks.length; i++) {
      const b = this.blocks[i];
      const expectedPrev = i === 0 ? GENESIS_HASH : this.blocks[i - 1].hash;
      if (b.prevHash !== expectedPrev) {
        return { ok: false, brokenAt: i, reason: 'prev-hash linkage mismatch' };
      }
      const { hash, ...rest } = b;
      if (sha256(blockPreimage(rest)) !== hash) {
        return { ok: false, brokenAt: i, reason: 'block hash recomputation mismatch' };
      }
    }
    return { ok: true };
  }

  exportJSON(): string {
    return JSON.stringify({ genesis: GENESIS_HASH, blocks: this.blocks }, null, 2);
  }

  /**
   * Signed export. The envelope carries an HMAC over the canonical head
   * attestation so a verifier holding the secret can authenticate history —
   * internal linkage (validate()) alone never proves provenance.
   */
  exportSignedJSON(): string {
    const env: SignedEnvelope = {
      format: 'sovereign-ledger-v1',
      genesis: GENESIS_HASH,
      blocks: this.blocks,
      headHash: this.head()?.hash ?? GENESIS_HASH,
      envelopeSig: createHmac('sha256', this.secret)
        .update(headAttestation(GENESIS_HASH, this.blocks))
        .digest('hex'),
    };
    return JSON.stringify(env, null, 2);
  }

  static importJSON(json: string): HashChainLedger {
    const data = JSON.parse(json) as { blocks: LedgerBlock[] };
    // Reject unsigned-envelope shape drift fail-closed.
    if (!Array.isArray(data?.blocks)) {
      throw new Error('sovereign-crypto: importJSON missing blocks array');
    }
    const l = new HashChainLedger('static-import');
    l.blocks = data.blocks;
    return l;
  }

  /**
   * Import a signed envelope and verify it against the expected secret.
   * Throws on any mismatch (bad signature, forged length, swapped head).
   * NOTE: the returned ledger's own signing secret is deliberately NOT taken
   * from the envelope — callers rebind it out-of-band via withSecret().
   */
  static importSignedJSON(json: string, secret: string): HashChainLedger {
    const env = JSON.parse(json) as SignedEnvelope;
    if (env.format !== 'sovereign-ledger-v1' || !Array.isArray(env.blocks)) {
      throw new Error('sovereign-crypto: invalid signed envelope schema');
    }
    const expected = createHmac('sha256', Buffer.from(secret))
      .update(headAttestation(env.genesis, env.blocks))
      .digest('hex');
    const given = Buffer.from(env.envelopeSig ?? '', 'hex');
    const expBuf = Buffer.from(expected, 'hex');
    if (given.length !== expBuf.length || !timingSafeEqual(given, expBuf)) {
      throw new Error('sovereign-crypto: signed envelope HMAC verification failed');
    }
    const l = new HashChainLedger(secret);
    l.blocks = env.blocks;
    // double-check internal linkage of imported history too
    const v = l.validate();
    if (!v.ok) throw new Error(`sovereign-crypto: imported chain broken at ${v.brokenAt}: ${v.reason}`);
    return l;
  }

  /** Sign the current head so a verifier holding the secret can attest origin. */
  signHead(): string {
    const h = this.head();
    if (!h) throw new Error('sovereign-crypto: empty ledger');
    return createHmac('sha256', this.secret).update(h.hash).digest('hex');
  }

  verifySignature(sig: string): boolean {
    const h = this.head();
    if (!h) return false;
    const expected = createHmac('sha256', this.secret).update(h.hash).digest();
    const given = Buffer.from(sig, 'hex');
    return given.length === expected.length && timingSafeEqual(given, expected);
  }
}

/* ----------------------------- Merkle tree ------------------------------ */

/**
 * Domain-separated SHA-256 Merkle tree (RFC 6962-style prefixes):
 *   leaf  = H(0x00 || item)          — prevents leaf/node collision attacks
 *   node  = H(0x01 || left || right)
 *
 * VERIFY CONTRACT (explicit, per security review):
 *   `MerkleTree.verify` consumes a PRE-HASHED leaf — callers must pass
 *   `tree.leaves[index]` (or the equivalent `leafHash(item)` value), never
 *   the raw original item. A convenience wrapper `verifyItem()` is provided
 *   for callers holding raw data.
 */

const LEAF_PREFIX = Buffer.from([0x00]);
const NODE_PREFIX = Buffer.from([0x01]);

export function leafHash(item: string | Buffer): string {
  return createHash('sha256').update(LEAF_PREFIX).update(item).digest('hex');
}

export function nodeHash(left: string, right: string): string {
  return createHash('sha256').update(NODE_PREFIX).update(left).update(right).digest('hex');
}

export class MerkleTree {
  readonly leaves: string[];
  private levels: string[][] = [];

  constructor(items: (string | Buffer)[]) {
    this.leaves = items.map(leafHash);
    if (this.leaves.length === 0) {
      this.levels = [['']];
      return;
    }
    let level = [...this.leaves];
    this.levels.push(level);
    while (level.length > 1) {
      const next: string[] = [];
      for (let i = 0; i < level.length; i += 2) {
        const a = level[i];
        const b = i + 1 < level.length ? level[i + 1] : a; // duplicate last node
        next.push(nodeHash(a, b));
      }
      this.levels.push(next);
      level = next;
    }
  }

  root(): string {
    return this.levels[this.levels.length - 1][0];
  }

  proof(leafIndex: number): { hash: string; position: 'left' | 'right' }[] {
    const path: { hash: string; position: 'left' | 'right' }[] = [];
    let idx = leafIndex;
    for (let l = 0; l < this.levels.length - 1; l++) {
      const level = this.levels[l];
      const siblingIdx = idx % 2 === 0 ? idx + 1 : idx - 1;
      if (siblingIdx < level.length) {
        path.push({ hash: level[siblingIdx], position: idx % 2 === 0 ? 'right' : 'left' });
      } else {
        path.push({ hash: level[idx], position: 'right' }); // self-duplicate
      }
      idx = Math.floor(idx / 2);
    }
    return path;
  }

  /** Verify against a PRE-HASHED leaf (see VERIFY CONTRACT above). Fail-closed on empty path vs non-singleton root. */
  static verify(
    prehashedLeaf: string,
    path: { hash: string; position: 'left' | 'right' }[],
    root: string
  ): boolean {
    if (typeof prehashedLeaf !== 'string' || prehashedLeaf.length !== 64) return false;
    let acc = prehashedLeaf;
    for (const step of path) {
      acc = step.position === 'left' ? nodeHash(step.hash, acc) : nodeHash(acc, step.hash);
    }
    return acc === root;
  }

  /** Convenience: verify from the RAW item (hashes it with the leaf prefix first). */
  static verifyItem(
    item: string | Buffer,
    path: { hash: string; position: 'left' | 'right' }[],
    root: string
  ): boolean {
    return MerkleTree.verify(leafHash(item), path, root);
  }
}
