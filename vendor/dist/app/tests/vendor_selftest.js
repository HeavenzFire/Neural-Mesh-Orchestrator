/**
 * Offline self-test suite for the vendor/ sovereign libraries.
 * Runs with zero network: node --experimental-strip-types or tsx.
 */
import { describe, it, expect, run } from "../sovereign-test/index.js";
import { get, postJson } from "../sovereign-http/index.js";
import { HashChainLedger, MerkleTree, sha256 } from "../sovereign-crypto/index.js";
import { toBalancedTernary, fromBalancedTernary, add as tadd, mul as tmul, tand, tor, tnot, timplies, encodeByteToTrits, decodeTritsToByte, } from "../sovereign-ternary/index.js";
import { SovereignRouter } from "../sovereign-router/index.js";
import * as http from 'node:http';
/* --------------------------- sovereign-crypto --------------------------- */
describe('sovereign-crypto: HashChainLedger', () => {
    it('chains blocks and validates', () => {
        const l = new HashChainLedger('test-secret');
        l.append('boot', { mode: 'airgap' });
        l.append('route', { engine_used: 'heuristic_fallback' });
        l.append('shutdown');
        expect(l.validate().ok).toBe(true);
    });
    it('detects tampering (fail-closed)', () => {
        const l = new HashChainLedger();
        l.append('a');
        l.append('b');
        l.append('c');
        // mutate an internal block payload via export/import round-trip
        const raw = JSON.parse(l.exportJSON());
        raw.blocks[1].payload = { evil: true };
        const tampered = HashChainLedger.importJSON(JSON.stringify(raw));
        const v = tampered.validate();
        expect(v.ok).toBe(false);
    });
    it('HMAC sign/verify head', () => {
        const l = new HashChainLedger('sig-key');
        l.append('x');
        const sig = l.signHead();
        const sigOk = l.verifySignature(sig);
        if (!sigOk)
            throw new Error('valid HMAC signature failed to verify');
        expect(l.verifySignature('deadbeef'.repeat(8))).toBe(false);
    });
    it('rejects empty HMAC secret (fail-closed)', () => {
        let threw = false;
        try {
            new HashChainLedger('   ');
        }
        catch {
            threw = true;
        }
        expect(threw).toBe(true);
    });
    it('signed envelope round-trips with the original secret out-of-band', () => {
        const l = new HashChainLedger('origin-key');
        l.append('boot');
        l.append('route');
        l.append('seal');
        const env = l.exportSignedJSON();
        const imported = HashChainLedger.importSignedJSON(env, 'origin-key');
        expect(imported.validate().ok).toBe(true);
        // history authenticates: re-signing under the same key verifies
        expect(imported.verifySignature(l.signHead())).toBe(true);
    });
    it('signed envelope rejects wrong secret and forged history', () => {
        const l = new HashChainLedger('origin-key');
        l.append('a');
        l.append('b');
        const env = JSON.parse(l.exportSignedJSON());
        let wrongKey = false;
        try {
            HashChainLedger.importSignedJSON(JSON.stringify(env), 'attacker-key');
        }
        catch {
            wrongKey = true;
        }
        expect(wrongKey).toBe(true);
        // attacker rewrites block 0 AND recomputes the whole chain — validate()
        // would pass on the rewritten chain, but the envelope HMAC must not.
        const forged = new HashChainLedger('attacker-own-key');
        forged.append('innocent-history');
        const forgedEnv = JSON.parse(forged.exportSignedJSON());
        let forgedRejected = false;
        try {
            HashChainLedger.importSignedJSON(JSON.stringify(forgedEnv), 'origin-key');
        }
        catch {
            forgedRejected = true;
        }
        expect(forgedRejected).toBe(true);
    });
});
describe('sovereign-crypto: MerkleTree', () => {
    it('proof verifies for every leaf (pre-hashed contract)', () => {
        const items = ['alpha', 'beta', 'gamma', 'delta', 'epsilon'];
        const tree = new MerkleTree(items);
        const root = tree.root();
        for (let i = 0; i < items.length; i++) {
            const ok = MerkleTree.verify(tree.leaves[i], tree.proof(i), root);
            if (!ok)
                throw new Error(`proof failed at leaf ${i}`);
        }
    });
    it('verifyItem accepts raw preimages, rejects altered ones', () => {
        const items = ['a', 'b', 'c', 'd', 'e', 'f'];
        const tree = new MerkleTree(items);
        const root = tree.root();
        expect(MerkleTree.verifyItem('c', tree.proof(2), root)).toBe(true);
        // one-byte alteration of the raw preimage must fail
        expect(MerkleTree.verifyItem('C', tree.proof(2), root)).toBe(false);
        expect(MerkleTree.verifyItem('corrupted-payload', tree.proof(0), root)).toBe(false);
    });
    it('raw item passed to verify() fails (documented contract)', () => {
        const tree = new MerkleTree(['x', 'y']);
        // Passing the RAW item instead of tree.leaves[0] must NOT verify —
        // this is the documented VERIFY CONTRACT (pre-hashed leaves only).
        expect(MerkleTree.verify('x', tree.proof(0), tree.root())).toBe(false);
    });
    it('tampered proof steps and forged roots are rejected', () => {
        const tree = new MerkleTree(['p', 'q', 'r', 's', 't', 'u']);
        const root = tree.root();
        const good = tree.proof(1);
        // mutate a sibling hash inside the proof array
        const mutated = JSON.parse(JSON.stringify(good));
        mutated[0].hash = sha256('evil-sibling');
        expect(MerkleTree.verify(tree.leaves[1], mutated, root)).toBe(false);
        // flip the position tag
        const flipped = JSON.parse(JSON.stringify(good));
        flipped[0].position = flipped[0].position === 'left' ? 'right' : 'left';
        expect(MerkleTree.verify(tree.leaves[1], flipped, root)).toBe(false);
        // legitimate proof against a forged root
        expect(MerkleTree.verify(tree.leaves[1], good, sha256('fake-root'))).toBe(false);
        // non-hex / wrong-length leaf input fails closed
        expect(MerkleTree.verify('short', good, root)).toBe(false);
    });
});
/* -------------------------- sovereign-ternary --------------------------- */
describe('sovereign-ternary', () => {
    it('round-trips integers -100..100', () => {
        for (let n = -100; n <= 100; n++) {
            const bt = toBalancedTernary(n);
            if (fromBalancedTernary(bt) !== BigInt(n)) {
                throw new Error(`round-trip failed for ${n} -> ${bt}`);
            }
        }
    });
    it('known encodings', () => {
        expect(toBalancedTernary(0)).toBe('0');
        expect(toBalancedTernary(1)).toBe('1');
        expect(toBalancedTernary(2)).toBe('1T');
        expect(toBalancedTernary(3)).toBe('10');
        expect(toBalancedTernary(6)).toBe('1T0');
    });
    it('add/mul on ternary strings', () => {
        expect(tadd('10', '1')).toBe('11'); // 3+1=4 -> 11
        expect(tmul('10', '10')).toBe('100'); // 3*3=9
        // NB: '1T' decodes to 2 (3-1), so 2+1=3 -> '10'
        expect(fromBalancedTernary(tadd('1T', '1'))).toBe(3n);
        expect(tadd('1T', '1')).toBe('10');
    });
    it('Kleene tri-valued logic tables', () => {
        const U = 0, T = 1, F = -1;
        // NB: tnot(0) yields -0; compare with === (SameValueZero), not Object.is
        if (tand(T, U) !== U)
            throw new Error(`tand(T,U)=${tand(T, U)} expected 0`);
        if (tor(F, U) !== U)
            throw new Error(`tor(F,U)=${tor(F, U)} expected 0`);
        if (tnot(U) !== U)
            throw new Error(`tnot(U)=${tnot(U)} expected 0`);
        // Kleene: U->F = max(-U, F) = max(0, -1) = 0 (unknown), NOT false
        if (timplies(U, F) !== U)
            throw new Error(`timplies(U,F)=${timplies(U, F)} expected 0`);
        if (timplies(F, U) !== T)
            throw new Error(`timplies(F,U)=${timplies(F, U)} expected 1`);
    });
    it('byte<->trits codec', () => {
        for (const b of [0, 1, 127, 128, 255]) {
            expect(decodeTritsToByte(encodeByteToTrits(b))).toBe(b);
        }
    });
});
/* ------------------------ sovereign-http + router ----------------------- */
describe('sovereign-http: local loopback server (no external egress)', () => {
    it('GET/POST roundtrip against in-process server', async () => {
        const srv = http.createServer((req, res) => {
            if (req.url === '/health') {
                res.writeHead(200, { 'content-type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok', uptime_s: process.uptime() }));
            }
            else if (req.url === '/api/generate' && req.method === 'POST') {
                let body = '';
                req.on('data', (c) => (body += c));
                req.on('end', () => {
                    const j = JSON.parse(body || '{}');
                    res.writeHead(200, { 'content-type': 'application/json' });
                    res.end(JSON.stringify({ response: `echo:${j.prompt}` }));
                });
            }
            else {
                res.writeHead(404);
                res.end();
            }
        });
        await new Promise((r) => srv.listen(0, '127.0.0.1', r));
        const addr = srv.address();
        const port = typeof addr === 'object' && addr ? addr.port : 0;
        try {
            const health = await get(`http://127.0.0.1:${port}/health`);
            expect(health.status).toBe(200);
            expect(health.json().status).toBe('ok');
            const post = await postJson(`http://127.0.0.1:${port}/api/generate`, { prompt: 'ping' });
            expect(post.json().response).toBe('echo:ping');
        }
        finally {
            srv.close();
        }
    });
});
describe('sovereign-router: failover & offline guarantees', () => {
    it('falls back to heuristic when all providers unreachable (offline)', async () => {
        const router = new SovereignRouter([
            { id: 'ollama-dead', kind: 'ollama', baseUrl: 'http://127.0.0.1:1', priority: 1, timeoutMs: 500 },
            { id: 'vllm-dead', kind: 'vllm', baseUrl: 'http://127.0.0.1:2', priority: 2, timeoutMs: 500 },
            { id: 'local-heuristic', kind: 'heuristic', priority: 99 },
        ]);
        const res = await router.complete('route this task offline?');
        expect(res.meta.engine_used).toBe('heuristic_fallback');
        if (!res.meta.is_fallback)
            throw new Error('expected fallback route with all providers dead');
        expect(typeof res.meta.execution_time_ms).toBe('number');
        const parsed = JSON.parse(res.text);
        expect(parsed.engine).toBe('heuristic_fallback');
    });
    it('uses primary provider when reachable (local mock only)', async () => {
        const srv = http.createServer((req, res) => {
            let body = '';
            req.on('data', (c) => (body += c));
            req.on('end', () => {
                const j = JSON.parse(body || '{}');
                res.writeHead(200, { 'content-type': 'application/json' });
                res.end(JSON.stringify({ response: `local-model-said:${j.prompt}` }));
            });
        });
        await new Promise((r) => srv.listen(0, '127.0.0.1', r));
        const addr = srv.address();
        const port = typeof addr === 'object' && addr ? addr.port : 0;
        try {
            const router = new SovereignRouter([
                { id: 'mock-ollama', kind: 'ollama', baseUrl: `http://127.0.0.1:${port}`, model: 'test', priority: 1 },
                { id: 'heur', kind: 'heuristic', priority: 9 },
            ]);
            const probes = await router.probeAll();
            if (!probes['mock-ollama'])
                throw new Error('mock ollama should probe healthy');
            const res = await router.complete('hello');
            expect(res.meta.engine_used).toBe('mock-ollama');
            expect(res.meta.is_fallback).toBe(false);
        }
        finally {
            srv.close();
        }
    });
    it('circuit breaker opens after repeated failures', async () => {
        const router = new SovereignRouter([{ id: 'flaky', kind: 'ollama', baseUrl: 'http://127.0.0.1:1', priority: 1, timeoutMs: 300 }], { failureThreshold: 2, cooldownMs: 60_000 });
        // complete() fails over to heuristic each time, but attemptLog records provider calls
        await router.complete('a'); // failure 1
        await router.complete('b'); // failure 2 -> breaker opens
        const res = await router.complete('c'); // should see circuit_open, not a real call
        expect(res.meta.engine_used).toBe('heuristic_fallback');
        const opened = router.attemptLog.find((a) => a.provider === 'flaky' && a.error === 'circuit_open');
        if (!opened)
            throw new Error('circuit_open attempt was never recorded');
        expect(router.attemptLog.filter((a) => a.error === 'circuit_open').length).toBe(1);
    });
});
run().then((failures) => process.exit(failures));
