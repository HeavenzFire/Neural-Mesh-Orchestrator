/**
 * sovereign-test — in-house zero-dependency test runner (replaces jest/vitest/uvu).
 *
 * Air-gap friendly: no workers, no watch mode, no external reporters.
 * Usage:
 *   import { describe, it, expect, run } from '../sovereign-test/index.js';
 *   ...define tests...
 *   process.exit(await run());  // exit code = failures
 */
const cases = [];
let currentSuite = '';
/** Nested describe is supported — suites are joined with " > ". */
export function describe(name, body) {
    const prev = currentSuite;
    currentSuite = prev ? `${prev} > ${name}` : name;
    body();
    currentSuite = prev;
}
export function it(name, fn, opts) {
    cases.push({ name, fn, suite: currentSuite, timeoutMs: opts?.timeoutMs });
}
it.skip = (name, fn) => {
    cases.push({ name, fn, suite: currentSuite, skip: true });
};
it.only = (name, fn) => {
    cases.push({ name, fn, suite: currentSuite, only: true });
};
export const test = it; // alias
/** Reject if not settled within ms. Zero-dep replacement for jest's per-test timeout. */
export function withTimeout(p, ms, label = 'test') {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`TIMEOUT after ${ms}ms: ${label}`)), ms);
        timer.unref?.(); // don't keep the event loop alive just for the watchdog
        p.then((v) => { clearTimeout(timer); resolve(v); }, (e) => { clearTimeout(timer); reject(e); });
    });
}
class AssertionError extends Error {
}
function fmt(v) {
    if (typeof v === 'string')
        return JSON.stringify(v);
    try {
        return JSON.stringify(v);
    }
    catch {
        return String(v);
    }
}
/** Build the positive matchers for a value. */
function positiveMatchers(actual) {
    return {
        toBe(expected) {
            // SameValueZero: treats -0 === 0 (Kleene tri-valued gates return -0 for tnot(0))
            const same = actual === expected || (typeof actual === 'number' && typeof expected === 'number' && actual === expected);
            if (!same) {
                throw new AssertionError(`expected ${fmt(expected)} but got ${fmt(actual)}`);
            }
        },
        toEqual(expected) {
            const a = JSON.stringify(actual);
            const b = JSON.stringify(expected);
            if (a !== b) {
                throw new AssertionError(`deep-equal failed:\n  expected: ${b}\n  actual:   ${a}`);
            }
        },
        toBeTruthy() {
            if (!actual)
                throw new AssertionError(`expected truthy, got ${fmt(actual)}`);
        },
        toBeFalsy() {
            if (actual)
                throw new AssertionError(`expected falsy, got ${fmt(actual)}`);
        },
        toContain(needle) {
            if (typeof actual !== 'string' || !actual.includes(needle)) {
                throw new AssertionError(`expected ${fmt(actual)} to contain ${fmt(needle)}`);
            }
        },
        toMatch(re) {
            if (typeof actual !== 'string' || !re.test(actual)) {
                throw new AssertionError(`expected ${fmt(actual)} to match ${re}`);
            }
        },
        toThrow() {
            let threw = false;
            try {
                actual();
            }
            catch {
                threw = true;
            }
            if (!threw)
                throw new AssertionError('expected function to throw, but it did not');
        },
        async rejects() {
            let threw = false;
            try {
                await actual;
            }
            catch {
                threw = true;
            }
            if (!threw)
                throw new AssertionError('expected promise to reject, but it resolved');
        },
    };
}
/** Wrap matchers so each throws when the positive assertion SUCCEEDS. */
function negated(actual) {
    const pos = positiveMatchers(actual);
    const wrap = (key, desc) => (...args) => {
        let passed = false;
        try {
            const r = pos[key](...args);
            // rejects() is async — negate() only wraps sync matchers meaningfully;
            // handle the promise case separately below.
            if (r?.then) {
                return r.then(() => { throw new AssertionError(`expected NOT ${desc}`); }, () => undefined);
            }
            passed = true;
        }
        catch (e) {
            if (e instanceof AssertionError)
                passed = false;
            else
                throw e;
        }
        if (passed)
            throw new AssertionError(`expected NOT ${desc}`);
    };
    return {
        toBe: wrap('toBe', `toBe(${fmt(actual)})`),
        toEqual: wrap('toEqual', 'toEqual'),
        toBeTruthy: wrap('toBeTruthy', 'toBeTruthy'),
        toBeFalsy: wrap('toBeFalsy', 'toBeFalsy'),
        toContain: wrap('toContain', 'toContain'),
        toMatch: wrap('toMatch', 'toMatch'),
        toThrow: wrap('toThrow', 'toThrow'),
        rejects: wrap('rejects', 'rejects'),
    };
}
/** jest-style: expect(actual).toBe(expected); also supports .not.* */
export function expect(actual) {
    return { ...positiveMatchers(actual), not: negated(actual) };
}
const DEFAULT_TIMEOUT_MS = 10_000;
export async function run(opts) {
    const started = performance.now();
    let passed = 0;
    let skipped = 0;
    const failures = [];
    let lastSuite = '';
    const hasOnly = cases.some((c) => c.only);
    for (const c of cases) {
        if (c.suite !== lastSuite) {
            console.log(`\n\u001b[1m${c.suite || '(root)'}\u001b[0m`);
            lastSuite = c.suite;
        }
        if (c.skip || (hasOnly && !c.only)) {
            skipped++;
            console.log(`  \u001b[33m○\u001b[0m ${c.name}${c.skip ? ' [skip]' : ' [filtered]'}`);
            continue;
        }
        const limit = c.timeoutMs ?? opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
        try {
            await withTimeout(Promise.resolve().then(c.fn), limit, `${c.suite} > ${c.name}`);
            passed++;
            console.log(`  \u001b[32m✓\u001b[0m ${c.name}`);
        }
        catch (err) {
            failures.push({ name: `${c.suite} > ${c.name}`, err });
            console.log(`  \u001b[31m✗\u001b[0m ${c.name}`);
        }
    }
    const durationMs = Math.round(performance.now() - started);
    console.log(`\n${passed + failures.length + skipped} tests | \u001b[32m${passed} passed\u001b[0m` +
        (failures.length ? ` | \u001b[31m${failures.length} failed\u001b[0m` : '') +
        (skipped ? ` | \u001b[33m${skipped} skipped\u001b[0m` : '') +
        ` | ${durationMs}ms`);
    for (const f of failures) {
        console.error(`\n\u001b[31mFAIL\u001b[0m ${f.name}\n  ${f.err.message ?? f.err}`);
    }
    return failures.length;
}
