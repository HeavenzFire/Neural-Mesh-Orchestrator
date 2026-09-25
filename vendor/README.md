# Sovereign Vendor Libraries (`/vendor`)

In-house, zero-dependency replacements for every third-party library the
air-gapped stack would otherwise need. Built per the doctrine: **if it isn't
available offline, we build our own.** Node core modules only — no npm
registry required at runtime or test time.

| Library | Replaces | What it provides | Verified by |
|---|---|---|---|
| `sovereign-http` | axios, got, node-fetch, supertest | Promise-based HTTP client (GET/POST JSON), body reader; local-loopback transport for Ollama / llama.cpp / vLLM | loopback GET/POST roundtrip test |
| `sovereign-crypto` | merkle-tools, sqlchain, audit-ledger SaaS SDKs | SHA-256 hash-chain ledger (append/validate/export/import), HMAC head signing, Merkle tree with inclusion proofs — fail-closed validation | chain linkage, tamper-detection, sign/verify, Merkle proof tests |
| `sovereign-ternary` | bignumber.js, balance-ternary | Balanced ternary arithmetic (BigInt-exact), Kleene tri-valued logic gates, byte↔trit codec | -100..100 roundtrip, known encodings, add/mul, truth-table tests |
| `sovereign-router` | LangChain, LiteLLM, OpenRouter SDKs | Multi-model routing wedge (W1): priority failover, circuit breaker w/ cooldown + half-open probe, deterministic heuristic fallback, `{ engine_used, is_fallback, execution_time_ms }` telemetry contract | offline-fallback, live-mock primary, circuit-breaker tests |
| `sovereign-test` | jest, vitest, uvu | Zero-dep async test runner (describe/it/expect, jest-style matchers, exit code = failure count) | self-hosting: runs its own suite |

## Run the offline self-test suite

```bash
npx tsx vendor/tests/vendor_selftest.ts   # 14 tests, ~25ms, exit 0 on pass
```

No network access needed — all "remote" providers in tests are in-process
loopback servers or deliberately dead ports.

## Design notes & bug history (claim-to-evidence)

1. **Balanced ternary carry fix** — initial `toBalancedTernary` mis-encoded
   even remainders (`x/3+1` vs `(x+1)/3`); caught by the `add/mul` test
   (`tadd('10','1')` returned wrong value). Fixed and re-verified.
2. **Kleene implication table** — `U→F = max(¬U,F) = max(0,-1) = U`, not F.
   Test corrected to match the formal definition (test was wrong, lib was right).
3. **Circuit breaker half-open state** — original implementation deleted
   health state on cooldown expiry, losing failure accounting; now resets
   counters in place so a fresh success closes the breaker and repeated
   failures re-open it. `attemptLog` exposes per-provider attempts for
   manifest attestation.
4. **-0 semantics** — `tnot(0)` yields `-0`; runner's `toBe` uses
   SameValueZero comparison so `tnot(U) === U` holds as expected.

## Integration points

- `server/geminiService.ts` dual-mode optimizer emits the same
  `meta: { engine_used, is_fallback, execution_time_ms }` contract that
  `SovereignRouter.complete()` returns — the router is the drop-in local
  replacement when `LOCAL_FALLBACK_ONLY=true`.
- `HashChainLedger` + `MerkleTree` provide the artifact digests and chain
  validation consumed by the G7 verification manifest pipeline.
- All five libraries are pure-TypeScript single-file modules importable via
  `.ts` extensions under the repo's existing `allowImportingTsExtensions`
  tsconfig — no build step, no lockfile changes.
