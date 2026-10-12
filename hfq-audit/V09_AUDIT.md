# BASELINE_v09_LOSSY_151_4BIT_99PCT.hfq — Artifact Audit (2026-10-12)

## Verdict: NOT VERIFIED — artifact absent from this checkout

The PowerShell audit script short-circuits with `NOT VERIFIED` when the file is missing.
A full-tree search of `/workspace` (excluding node_modules/.git/vendor) found **zero** files
matching `*v09*`, `*FINAL*`, or `*.zdict`. The only `.hfq` artifacts present are the lossless
HFQCOMP01 archives from the previous sweep (`hfq-audit/*.hfq`).

## Script defects found during review

1. **Hardcoded baseline**: `$OriginalBytes = 47488.0` is baked in, not read from disk. Any
   reduction/ratio output is computed against a constant, not the actual payload.
2. **Schema mismatch**: the geometric-error decoder requires `benchmark.json.matrix_modes`.
   The benchmark.json in this checkout has keys `[nodes, coherence, field]` and no
   `matrix_modes` — the decoder would raise KeyError even if the .hfq existed.
3. **Lossy ≠ verifiable by SHA**: the filename says LOSSY; the script's "DATA INTEGRITY: Hash
   recorded" line cannot certify reconstruction quality. Only the max-SDF error check can,
   and it never runs here.
4. **No size bound on brotli payload**: nothing in the format prevents a 151-byte file from
   being a truncated/corrupt blob; the decoder should assert `n == len(modes)` and
   `len(q) >= n` before trusting the error figure.

## What IS reproducible right now (lossless HFQ, same machine)

Input: `hfq-audit/benchmark.json` (19,322 B)
SHA-256(input):   11625e884a3e99d4c9e7e5126f15f988199bb895156889c340126c1f750281f7
Archive:         `hfq-audit/benchmark_reverified.hfq` (1,623 B, Direct/Deflate best-of-sweep)
SHA-256(archive): 21d6205f2b23a3a7990453b25f18052ef2371ac0b7e8b47e6dde346c2f29db8e
Round-trip:      exact byte-for-byte match (True)
Sweep table:     Direct/Deflate 1623 B (91.6%) < Direct/GZip 1641 B < XorLag1/Deflate 1984 B
                 — consistent with the prior finding that XOR predictors lose to Deflate on real data.

## Claim accounting for the 151-byte lossy codec

Format per the embedded decoder: 10 B header (`<ffH`: min, max, count) + brotli(packed nibbles).
For n=151 modes at 4-bit packing: 76 raw bytes → ≤141 compressed bytes inside 151 total.
Geometrically possible. Physically plausible ONLY because the codec is lossy: 4-bit quantization
carries ~151×4 = 604 bits ≈ 76 B of information, so a ~110 B container is near the entropy floor
for that quantized representation. But:
- The "99%" accuracy claim is unmeasurable without the artifact + matrix_modes fixture.
- Reconstruction deviation depends entirely on the mode distribution; no bound is derivable
  from the format alone.
- Status remains: UNVERIFIED CLAIM. To close it, re-run the encoder end-to-end in one process
  (encode → write → decode → compare vs source) and print max|recon−orig| plus the file hash.

## Recommended next experiment (self-contained, no missing inputs)

Generate matrix_modes synthetically (e.g., 151 smooth gyroid SDF samples), quantize to 4 bits,
pack, brotli-compress, write the 151-byte-style file, decode it back, and report:
file size, round-trip length check, and max SDF deviation vs the float64 originals.
That produces an honest number for the "99%" label without relying on any absent artifact.
