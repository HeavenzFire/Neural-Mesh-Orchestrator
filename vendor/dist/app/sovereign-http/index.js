/**
 * sovereign-http — zero-dependency HTTP client/server built in-house.
 *
 * Replaces axios/got/node-fetch/supertest-class libraries. Uses only Node
 * core modules (node:http, node:https). No third-party imports. This is the
 * transport layer for air-gapped operation: everything speaks plain HTTP to
 * local runtimes (Ollama, llama.cpp server, vLLM, our own router).
 */
import * as http from 'node:http';
import * as https from 'node:https';
import { URL } from 'node:url';
/** Perform an HTTP request with no external dependencies. */
export function request(url, opts = {}) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const lib = parsed.protocol === 'https:' ? https : http;
        let payload;
        const headers = { ...(opts.headers ?? {}) };
        if (opts.body !== undefined) {
            payload = typeof opts.body === 'object' && !(opts.body instanceof Buffer)
                ? JSON.stringify(opts.body)
                : String(opts.body);
            if (!headers['content-type'] && !headers['Content-Type']) {
                headers['content-type'] = 'application/json';
            }
            headers['content-length'] = String(Buffer.byteLength(payload));
        }
        const req = lib.request({
            hostname: parsed.hostname,
            port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
            path: parsed.pathname + parsed.search,
            method: opts.method ?? 'GET',
            headers,
        }, (res) => {
            const chunks = [];
            res.on('data', (c) => chunks.push(c));
            res.on('end', () => {
                const text = Buffer.concat(chunks).toString('utf8');
                resolve({
                    status: res.statusCode ?? 0,
                    headers: res.headers,
                    text,
                    json() {
                        return JSON.parse(text);
                    },
                });
            });
        });
        if (opts.timeoutMs) {
            req.setTimeout(opts.timeoutMs, () => {
                req.destroy(new Error(`sovereign-http: timeout after ${opts.timeoutMs}ms`));
            });
        }
        req.on('error', reject);
        if (payload)
            req.write(payload);
        req.end();
    });
}
export const get = (url, headers) => request(url, { method: 'GET', headers });
export const postJson = (url, body, headers) => request(url, { method: 'POST', body, headers });
/** Minimal JSON-body reader for handlers without body-parser. */
export async function readJsonBody(req) {
    const chunks = [];
    for await (const c of req)
        chunks.push(c);
    const raw = Buffer.concat(chunks).toString('utf8');
    return (raw ? JSON.parse(raw) : {});
}
