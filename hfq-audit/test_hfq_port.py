import gzip
import hashlib
import struct
import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path

from hfq_port import (
    MAGIC, HEADER_SIZE, MAX_ORIGINAL_BYTES, CODECS, ALGOS,
    compress, expand, read_archive, restore, sweep, write_archive,
)


def make_archive(orig_len, payload, digest=None, aid=0, cid=0):
    if digest is None:
        digest = b"\x00" * 32
    return (MAGIC + bytes([aid, cid]) + struct.pack("<q", orig_len) + digest
            + struct.pack("<q", len(payload)) + payload)


class HfqPortSecurityTests(unittest.TestCase):
    def test_round_trip_and_restore(self):
        data = b"sensor telemetry\n" * 32
        with tempfile.TemporaryDirectory() as temp:
            target = Path(temp) / "sample.hfq"
            write_archive(target, 0, 0, len(data), hashlib.sha256(data).digest(), compress(data, "GZip"))
            self.assertEqual(restore(target), data)

    def test_rejects_declared_original_length_above_limit_before_decompression(self):
        payload = gzip.compress(b"A" * 8)
        with tempfile.TemporaryDirectory() as temp:
            target = Path(temp) / "oversized.hfq"
            target.write_bytes(make_archive(MAX_ORIGINAL_BYTES + 1, payload))
            with self.assertRaisesRegex(ValueError, "Declared original length"):
                restore(target)

    def test_rejects_decompression_bomb_that_exceeds_declared_length(self):
        payload = gzip.compress(b"A" * 1_000_000)
        with tempfile.TemporaryDirectory() as temp:
            target = Path(temp) / "bomb.hfq"
            target.write_bytes(make_archive(8, payload))
            with self.assertRaisesRegex(ValueError, "exceeds declared original length"):
                restore(target)

    def test_rejects_truncated_and_trailing_payloads(self):
        payload = gzip.compress(b"hello")
        with tempfile.TemporaryDirectory() as temp:
            truncated = Path(temp) / "truncated.hfq"
            truncated.write_bytes(make_archive(5, payload)[:-1])
            with self.assertRaisesRegex(ValueError, "Truncated payload"):
                restore(truncated)
            trailing = Path(temp) / "trailing.hfq"
            trailing.write_bytes(make_archive(5, payload + b"junk"))
            with self.assertRaisesRegex(ValueError, "trailing data|unexpected trailing"):
                restore(trailing)

    def test_rejects_invalid_magic(self):
        with tempfile.TemporaryDirectory() as temp:
            target = Path(temp) / "bad.hfq"
            target.write_bytes(b"BADMAGIC!" + b"\x00" * (HEADER_SIZE - 9))
            with self.assertRaisesRegex(ValueError, "Invalid archive signature"):
                restore(target)

    def test_sweep_rejects_cpu_exhaustion_sized_input(self):
        from hfq_port import MAX_SWEEP_BYTES
        with self.assertRaisesRegex(ValueError, "1 MiB CPU-safety limit"):
            sweep(b"x" * (MAX_SWEEP_BYTES + 1), "unused.hfq")

    def test_restore_rejects_wrong_digest_even_with_optimization_enabled(self):
        data = b"hello"
        payload = gzip.compress(data)
        with tempfile.TemporaryDirectory() as temp:
            target = Path(temp) / "bad-digest.hfq"
            target.write_bytes(make_archive(len(data), payload, digest=b"\x00" * 32))
            with self.assertRaisesRegex(ValueError, "SHA-256 mismatch"):
                restore(target)

    def test_write_archive_preserves_existing_archive_if_atomic_replace_fails(self):
        data = b"old valid archive"
        with tempfile.TemporaryDirectory() as temp:
            target = Path(temp) / "existing.hfq"
            write_archive(target, 0, 0, len(data), hashlib.sha256(data).digest(), compress(data, "GZip"))
            previous = target.read_bytes()
            with patch("hfq_port.os.replace", side_effect=OSError("simulated replace failure")):
                with self.assertRaisesRegex(OSError, "simulated replace failure"):
                    write_archive(target, 0, 0, len(data), hashlib.sha256(data).digest(), compress(b"new data", "GZip"))
            self.assertEqual(target.read_bytes(), previous)
            self.assertEqual(list(Path(temp).glob(".hfq-*.tmp")), [])

    def test_compress_rejects_unknown_codec_names(self):
        with self.assertRaisesRegex(ValueError, "Unknown codec"):
            compress(b"data", "Gzip")


if __name__ == "__main__":
    unittest.main()
