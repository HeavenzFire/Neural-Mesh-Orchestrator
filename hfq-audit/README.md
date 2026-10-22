# HFQ archive audit utility

This folder contains a bounded reader/writer for the experimental HFQ container format and adversarial regression tests. It is a file-format tool, not evidence of a new compression theorem or of quantum hardware execution.

## Safety limits

- Maximum input/original payload for restore: 100 MiB.
- Maximum archive file: 128 MiB.
- Full codec/predictor sweep is limited to 1 MiB because it evaluates multiple algorithms in pure Python.
- Header IDs, declared lengths, payload framing, decompressed output size, trailing data, and SHA-256 integrity are checked with explicit exceptions (not Python `assert` statements).
- Archive output is written to a same-directory temporary file, flushed/fsynced, and atomically replaced only after the complete write succeeds.

## Usage

Run the unit tests:

```powershell
python -m unittest -v hfq-audit/test_hfq_port.py
```

Run a small codec sweep on an input file no larger than 1 MiB:

```powershell
python hfq-audit/hfq_port.py path\to\small-input.bin
```

The sweep is a deterministic classical predictor/compressor comparison. It does not demonstrate quantum computation, a physical field, or lossless recovery for lossy predictor modes. Verify each archive by restoring it and comparing the declared length and SHA-256 digest.
