# Verification Matrix — Claimed vs. Measured (2026-09-27)

Ground rule inherited from this project's own protocol: **a gate is PASSED only when a
command was executed in this workspace and its exit code captured directly.** Everything
else is REPORTED or NOT PRESENT. This document audits the "Complete System Verification
& Architecture Matrix" claim set against `git` + filesystem + executed runs.

## 1. Gate audit table

| # | Claimed gate | Claimed command | Artifact present? | Executed here? | Honest status |
|---|--------------|-----------------|-------------------|----------------|---------------|
| G-core | 19/19 invariants, RFC 8785 canonicalization, Merkle stability, atomic writes | `npm run verify` | ❌ script absent from package.json | ❌ | **REPORTED** — prior-session result; not re-executable on this tree |
| G-iso | Zero WAN egress; probes fail closed | `npm run verify:isolation` | ❌ script + `scripts/verify_network_isolation.sh` absent | ❌ | **NOT PRESENT** |
| G1 | Offline fallback under `--network=none`, sub-ms | `npm run verify:gate1` | ❌ npm script absent; `Dockerfile.router` absent | ✅ **equivalent executed**: `bash vendor/airgap/run-netns-proof.sh` → W1 e2e PASS inside netns (egress impossible), exit 0 | **PASSED at primitives scope**; Docker variant NOT RUN (no daemon); "sub-ms" per-request figure UNMEASURED (suite total 37 ms for 19 tests) |
| G2 | 7/7 peer exchange: HMAC attestation, sequence sync, replay rejection | `npm run verify:gate2` | ❌ `server/peerService.ts` absent; test probes absent | ⚠️ partial analog exists: `vendor/tests/mesh_selftest.ts` (Ed25519-signed gossip, dedupe/replay, tamper rejection) — **hangs** at first gossip case under tsx/Node 20.20 | **NOT PASSED** — mesh suite blocked by hang bug; peer HTTP API unimplemented |
| G-lat | 1,099.2 req/s, p50 6.2 ms, p99 46.7 ms, 0% drop | `npm run benchmark:latency` | ❌ bench harness for these metrics absent (`bench/` has air-gap probe only) | ❌ | **UNSOURCED** — numbers have no artifact in this tree; do not publish until reproducible |
| G-bundle | SHA-256 sealed tarball + manifests | `npm run bundle:g7` | ❌ script absent; `artifacts/` absent | ✅ closest real artifact: `manifest.netns.json` regenerated & chain-validated | **REPORTED (bundle)** / **PASSED (manifest chain)** |

## 2. What WAS executed and verified in this session (directly, `$?` captured)

```text
$ bash vendor/airgap/run-netns-proof.sh ; echo $?
[netns] exits: selftest=0 w1=0
19 tests | 19 passed | 37ms
W1 E2E: ALL PASS
attestation manifest written: vendor/dist/netns-proof/manifest.netns.json
PROOF_EXIT=0

$ node vendor/airgap/check-manifest.mjs ; echo $?
chain linkage OK | blocks: 4 | head: 025ca9faf20c8a2d | envelopeSig: true
 - source-commit {"commit":"4121d00f2fa6fc2ec06dce2f22abe86616ebd0b3"}
 - isolation-mode {"mechanism":"unshare -rn ...","docker_equivalent":"--network none"}
 - selftest-exit {"code":0,"log_sha256":"4a35e362..."}
 - w1-e2e-exit {"code":0,"log_sha256":"2a4aa17d..."}
CHECK_EXIT=0
```

This closes the previously-open item *"manifest-write path requires one final execution"*:
the signed manifest now exists, cites a **real frozen commit** (`4121d00f`, clean tree),
and passes independent chain-linkage validation.

## 3. Defensible claim (exact scope)

> The compiled vendor self-test (19 tests) and the packaged W1 router end-to-end fallback
> assertion both passed inside a kernel network namespace where external connectivity is
> impossible, recorded in an HMAC-enveloped, chain-validated manifest anchored to git
> commit 4121d00f.

Not yet supported: Docker `--network none` image build/run (no daemon in sandbox),
offline `npm install`, the 6-gate npm-script matrix as claimed, any throughput/latency
percentile figures, and Gate 2 peer-API authentication over HTTP.

## 4. Ranked next actions

1. **Fix the mesh_selftest hang** (sovereign-gossip cluster drain blocks under Node 20.20/tsx) — Gate 2 evidence depends on it.
2. **Commit the missing scripts into package.json** (`verify`, `verify:gate1`, `bundle:g7`) so claims become re-runnable by third parties; wire them to the existing netns harness rather than inventing new ones.
3. **Implement `server/peerService.ts`** with the 7 asserted cases, then run it as two processes on loopback inside the netns proof (Gate 2 becomes measurable).
4. **Re-measure latency honestly**: instrument per-request `execution_time_ms` percentiles in the W1 e2e before publishing any req/s or p50/p99 numbers.
5. Run `run-airgap-proof.sh` (Docker variant) on a Docker host; attach image digest to the manifest chain.
