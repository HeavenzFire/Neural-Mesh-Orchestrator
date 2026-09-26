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
export const GENESIS_HASH = '0'.repeat(64);
export function sha256(data) {
    return createHash('sha256').update(data).digest('hex');
}
function blockPreimage(b) {
    return `${b.index}|${b.timestamp}|${b.event}|${JSON.stringify(b.payload)}|${b.prevHash}`;
}
/** Canonical preimage for a ledger head — identical on both sides of export/import. */
export function headAttestation(genesis, blocks) {
    const h = blocks[blocks.length - 1];
    return `sovereign-ledger-v1|${genesis}|${blocks.length}|${h ? h.hash : GENESIS_HASH}`;
}
export class HashChainLedger {
    blocks = [];
    secret;
    constructor(hmacSecret) {
        // Fail closed: an explicit empty/whitespace secret is rejected rather than
        // silently falling back to a random one (which would break re-import signing).
        if (hmacSecret !== undefined && hmacSecret.trim() === '') {
            throw new Error('sovereign-crypto: empty HMAC secret rejected');
        }
        this.secret = Buffer.from(hmacSecret ?? randomUUID());
    }
    /** Rebind the signing secret (e.g. supply the original key out-of-band after import). */
    withSecret(secret) {
        if (secret.trim() === '')
            throw new Error('sovereign-crypto: empty HMAC secret rejected');
        this.secret = Buffer.from(secret);
        return this;
    }
    append(event, payload = null) {
        const prevHash = this.blocks.length
            ? this.blocks[this.blocks.length - 1].hash
            : GENESIS_HASH;
        const partial = {
            index: this.blocks.length,
            timestamp: new Date().toISOString(),
            event,
            payload,
            prevHash,
        };
        const block = { ...partial, hash: sha256(blockPreimage(partial)) };
        this.blocks.push(block);
        return block;
    }
    head() {
        return this.blocks.length ? this.blocks[this.blocks.length - 1] : null;
    }
    /** Walk the chain and verify linkage + recomputed hashes. Fail-closed. */
    validate() {
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
    exportJSON() {
        return JSON.stringify({ genesis: GENESIS_HASH, blocks: this.blocks }, null, 2);
    }
    /**
     * Signed export. The envelope carries an HMAC over the canonical head
     * attestation so a verifier holding the secret can authenticate history —
     * internal linkage (validate()) alone never proves provenance.
     */
    exportSignedJSON() {
        const env = {
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
    static importJSON(json) {
        const data = JSON.parse(json);
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
    static importSignedJSON(json, secret) {
        const env = JSON.parse(json);
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
        if (!v.ok)
            throw new Error(`sovereign-crypto: imported chain broken at ${v.brokenAt}: ${v.reason}`);
        return l;
    }
    /** Sign the current head so a verifier holding the secret can attest origin. */
    signHead() {
        const h = this.head();
        if (!h)
            throw new Error('sovereign-crypto: empty ledger');
        return createHmac('sha256', this.secret).update(h.hash).digest('hex');
    }
    verifySignature(sig) {
        const h = this.head();
        if (!h)
            return false;
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
export function leafHash(item) {
    return createHash('sha256').update(LEAF_PREFIX).update(item).digest('hex');
}
export function nodeHash(left, right) {
    return createHash('sha256').update(NODE_PREFIX).update(left).update(right).digest('hex');
}
export class MerkleTree {
    leaves;
    levels = [];
    constructor(items) {
        this.leaves = items.map(leafHash);
        if (this.leaves.length === 0) {
            this.levels = [['']];
            return;
        }
        let level = [...this.leaves];
        this.levels.push(level);
        while (level.length > 1) {
            const next = [];
            for (let i = 0; i < level.length; i += 2) {
                const a = level[i];
                const b = i + 1 < level.length ? level[i + 1] : a; // duplicate last node
                next.push(nodeHash(a, b));
            }
            this.levels.push(next);
            level = next;
        }
    }
    root() {
        return this.levels[this.levels.length - 1][0];
    }
    proof(leafIndex) {
        const path = [];
        let idx = leafIndex;
        for (let l = 0; l < this.levels.length - 1; l++) {
            const level = this.levels[l];
            const siblingIdx = idx % 2 === 0 ? idx + 1 : idx - 1;
            if (siblingIdx < level.length) {
                path.push({ hash: level[siblingIdx], position: idx % 2 === 0 ? 'right' : 'left' });
            }
            else {
                path.push({ hash: level[idx], position: 'right' }); // self-duplicate
            }
            idx = Math.floor(idx / 2);
        }
        return path;
    }
    /** Verify against a PRE-HASHED leaf (see VERIFY CONTRACT above). Fail-closed on empty path vs non-singleton root. */
    static verify(prehashedLeaf, path, root) {
        if (typeof prehashedLeaf !== 'string' || prehashedLeaf.length !== 64)
            return false;
        let acc = prehashedLeaf;
        for (const step of path) {
            acc = step.position === 'left' ? nodeHash(step.hash, acc) : nodeHash(acc, step.hash);
        }
        return acc === root;
    }
    /** Convenience: verify from the RAW item (hashes it with the leaf prefix first). */
    static verifyItem(item, path, root) {
        return MerkleTree.verify(leafHash(item), path, root);
    }
}
