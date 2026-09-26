/**
 * w1-entry.ts — packaged W1 router entrypoint for the sovereign image.
 *
 * Boots the Zero-Markup Router (Wedge W1) with sovereignty assertions:
 *   - GEMINI_API_KEY must be empty  -> no cloud endpoint is ever configured
 *   - LOCAL_FALLBACK_ONLY=true      -> routing terminates in heuristic_fallback
 * Serves /health + /route on loopback, and runs an end-to-end self-test that
 * asserts fallback telemetry. Designed to be executed under `--network none`
 * (Docker) or `unshare -rn` (kernel netns) so egress is impossible, not merely
 * unused.
 */
import * as http from 'node:http';
import { SovereignRouter } from "../sovereign-router/index.js";
const KEY = process.env.GEMINI_API_KEY ?? '';
if (KEY !== '') {
    console.error('FATAL: GEMINI_API_KEY present in air-gap image; refusing to boot');
    process.exit(78);
}
const LOCAL_ONLY = process.env.LOCAL_FALLBACK_ONLY === 'true';
if (!LOCAL_ONLY) {
    console.error('FATAL: LOCAL_FALLBACK_ONLY!=true; refusing to boot air-gap image');
    process.exit(78);
}
// Provider registry: local-only providers first; heuristic terminal fallback.
// With LOCAL_FALLBACK_ONLY we deliberately register NO reachable remote base URL.
const router = new SovereignRouter([
    { id: 'ollama-local', kind: 'ollama', baseUrl: 'http://127.0.0.1:11434', priority: 0, timeoutMs: 1500 },
    { id: 'heuristic', kind: 'heuristic', priority: 99 },
], { failureThreshold: 2, cooldownMs: 5000 });
async function handleRoute(prompt) {
    const res = await router.complete(prompt);
    return res;
}
/* ---------------------------- serve mode -------------------------------- */
export function serve(port = Number(process.env.PORT || 8080)) {
    const server = http.createServer(async (req, res) => {
        if (req.url === '/health') {
            res.writeHead(200, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ ok: true, mode: 'airgap', local_fallback_only: true, mem: process.memoryUsage().rss }));
            return;
        }
        if (req.url === '/route' && req.method === 'POST') {
            let body = '';
            req.on('data', (c) => (body += c));
            req.on('end', async () => {
                try {
                    const { prompt } = JSON.parse(body || '{}');
                    const out = await handleRoute(String(prompt ?? ''));
                    res.writeHead(200, { 'content-type': 'application/json' });
                    res.end(JSON.stringify(out));
                }
                catch (e) {
                    res.writeHead(400, { 'content-type': 'application/json' });
                    res.end(JSON.stringify({ error: String(e.message) }));
                }
            });
            return;
        }
        res.writeHead(404);
        res.end('not found');
    });
    server.listen(port, '127.0.0.1');
    return server;
}
/* --------------------- end-to-end self test (offline) -------------------- */
export async function e2eSelfTest() {
    let failures = 0;
    const assert = (cond, msg) => {
        if (cond)
            console.log('  ✓', msg);
        else {
            console.error('  ✗', msg);
            failures++;
        }
    };
    // 1) Direct library call: unreachable ollama port -> deterministic fallback.
    const r1 = await handleRoute('summarize the incident report?');
    assert(r1.meta.engine_used === 'heuristic_fallback', 'library routes to heuristic_fallback when no local engine is up');
    assert(r1.meta.is_fallback === true, 'telemetry flags is_fallback=true');
    assert(typeof r1.meta.execution_time_ms === 'number', 'telemetry reports execution_time_ms');
    let payloadOk = false;
    try {
        payloadOk = JSON.parse(r1.text).engine === 'heuristic_fallback';
    }
    catch { /* invalid json */ }
    assert(payloadOk, 'fallback payload is valid JSON with engine tag');
    // 2) HTTP surface over loopback only.
    const server = serve(0);
    await new Promise((r) => setTimeout(r, 50));
    const addr = server.address();
    const port = typeof addr === 'object' && addr ? addr.port : 0;
    const healthRes = await fetch(`http://127.0.0.1:${port}/health`).then((x) => x.json());
    assert(healthRes.ok === true && healthRes.mode === 'airgap', '/health reports airgap mode');
    const routeRes = await fetch(`http://127.0.0.1:${port}/route`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: 'hello offline world' }),
    }).then((x) => x.json());
    assert(routeRes.meta?.engine_used === 'heuristic_fallback', 'HTTP /route returns fallback telemetry end-to-end');
    server.close();
    console.log(failures === 0 ? 'W1 E2E: ALL PASS' : `W1 E2E: ${failures} FAILURES`);
    return failures;
}
if (process.argv[1] && process.argv[1].includes('w1-entry')) {
    const mode = process.argv[2] ?? '--selftest';
    if (mode === '--serve') {
        serve();
        console.log('W1 router serving on 127.0.0.1 (airgap mode)');
    }
    else {
        e2eSelfTest().then((f) => process.exit(f ? 1 : 0));
    }
}
