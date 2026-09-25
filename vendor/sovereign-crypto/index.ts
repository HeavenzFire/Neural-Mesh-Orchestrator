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

export class HashChainLedger {
  private blocks: LedgerBlock[] = [];
  private secret: Buffer;

  constructor(hmacSecret?: string) {
    this.secret = Buffer.from(hmacSecret ?? randomUUID());
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

  static importJSON(json: string): HashChainLedger {
    const data = JSON.parse(json) as { blocks: LedgerBlock[] };
    const l = new HashChainLedger('static-import');
    l.blocks = data.blocks;
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

export class MerkleTree {
  readonly leaves: string[];
  private levels: string[][] = [];

  constructor(items: (string | Buffer)[]) {
    this.leaves = items.map((i) => sha256(i));
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
        next.push(sha256(a + b));
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

  static verify(
    leaf: string,
    path: { hash: string; position: 'left' | 'right' }[],
    root: string
  ): boolean {
    let acc = leaf;
    for (const step of path) {
      acc = step.position === 'left' ? sha256(step.hash + acc) : sha256(acc + step.hash);
    }
    return acc === root;
  }
}
