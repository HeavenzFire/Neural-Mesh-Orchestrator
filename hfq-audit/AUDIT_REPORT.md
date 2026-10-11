# HFQ Compression Sweep — Independent Audit (2026-10-11)

Method: faithful Python port of the PowerShell script (`hfq_port.py`), identical
predictor semantics, GZip/Deflate via zlib, 59-byte header. All round-trips verified
byte-exact with SHA-256. No files in the PS repo were touched; this audit is read-only
against the algorithm as specified.

## Verdicts

1. SOUND: XOR-lag predictor invertibility. Forward out[i]=d[i]^d[i-lag], inverse
   d[i]=out[i]^out[i-lag] is an exact involution for all lag schedules including the
   lag>i guard and Phase369's Fibonacci schedule. Verified on random, constant,
   periodic, and quadratic-pattern inputs (all True).
2. SOUND: archive integrity checks. Corruption, truncation, and bad-magic archives
   are all rejected before any output is trusted.
3. SUBSTANTIVE DEFECT: the "compression sweep" never beats its own baseline. On every
   realistic fixture (JSON telemetry 19KB, CSV 318KB, random 200KB) Direct/Deflate wins;
   every XOR predictor makes Deflate/GZip WORSE (e.g. JSON: 1623 B Direct vs 1984 B
   XorLag1 vs 8959 B Phase369). Because `Direct` is in the candidate set, the sweep can
   never do worse than plain deflate — but it also never does better except on crafted
   data. The Fibonacci/3-6-9 predictors add cost, not compression.
4. NARROW WIN CONDITION: XOR-lag helps only where lag-1 differences are more uniform
   than the values themselves (sawtooth ramp: 885 B vs 1153 B baseline, a genuine 23%
   payload win). Real sensor/telemetry data rarely satisfies this because Deflate
   already performs LZ77 + Huffman modeling.
5. COST: byte-wise loops => ~0.6 s per MB per predictor pass; full sweep = 26 encode +
   26 decode passes over the input plus double compression. At the 100 MB limit this is
   hours in single-threaded PowerShell. Recommend numpy/SPAN vectorization or capping
   the sweep to {Direct, XorLag1} sampled on a 1 MB prefix.
6. MINOR: header lacks a format version beyond magic; OriginalLength is trusted before
   decompression (fine, checked after); no entropy pre-check to skip hopeless sweeps.

## Data-theoretic note (consistent with prior Landauer audit)
Random.bin expands by exactly the header+deflate overhead (+124 B): the suite correctly
confirms no algorithm compresses incompressible strings. Any mesh-node claim that these
predictors reduce bandwidth must show real-payload tables beating Direct/Deflate; they
currently cannot.

## Reproduce
python3 hfq_port.py benchmark.json   # runs full sweep + disk round-trip verify
