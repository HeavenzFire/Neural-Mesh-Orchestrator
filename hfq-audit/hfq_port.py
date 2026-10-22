"""Faithful Python port of the HeavenzFire HFQ sweep, for independent audit.
Mirrors PowerShell semantics exactly: byte-wise XOR predictors with lag<=i guard,
GZip/Deflate via gzip/zlib raw, header magic HFQCOMP01 + 59-byte header."""
import gzip, zlib, hashlib, struct, math

ALGOS = ['Direct','XorLag1','XorLag2','XorLag3','XorLag5','XorLag8','XorLag13',
         'XorLag21','XorLag34','XorLag55','XorLag89','XorLag144','Phase369']
CODECS = ['GZip','Deflate']
MAGIC = b'HFQCOMP01'
HEADER_SIZE = 59  # 9+1+1+8+32+8
MAX_ARCHIVE_BYTES = 128 * 1024 * 1024
MAX_ORIGINAL_BYTES = 100 * 1024 * 1024
MAX_SWEEP_BYTES = 1 * 1024 * 1024
FIB = [1,2,3,5,8,13,21,34,55,89,144]

def predictor(data: bytes, algo: str, inverse: bool) -> bytes:
    n = len(data)
    out = bytearray(n)
    import re
    m = re.fullmatch(r'XorLag(\d+)', algo)
    for i in range(n):
        lag = 0
        if m:
            lag = int(m.group(1))
        elif algo == 'Phase369':
            phase = [3,6,9][i % 3]
            lag = FIB[(i + phase) % len(FIB)]
        elif algo != 'Direct':
            raise ValueError(f'Unknown predictor: {algo}')
        if lag <= 0 or lag > i:
            out[i] = data[i]
        elif inverse:
            out[i] = data[i] ^ out[i-lag]
        else:
            out[i] = data[i] ^ data[i-lag]
    return bytes(out)

def compress(b: bytes, codec: str) -> bytes:
    if codec == 'GZip':
        return gzip.compress(b, mtime=0)
    co = zlib.compressobj(9, zlib.DEFLATED, -15)
    return co.compress(b) + co.flush()

def expand(b: bytes, codec: str, expected_len: int) -> bytes:
    if not isinstance(expected_len, int) or expected_len < 0 or expected_len > MAX_ORIGINAL_BYTES:
        raise ValueError('Declared original length is outside the permitted range.')
    if codec not in CODECS:
        raise ValueError(f'Unknown codec: {codec}')
    wbits = 16 + zlib.MAX_WBITS if codec == 'GZip' else -zlib.MAX_WBITS
    de = zlib.decompressobj(wbits)
    decoded = de.decompress(b, expected_len + 1)
    if len(decoded) > expected_len or de.unconsumed_tail:
        raise ValueError('Decompressed output exceeds declared original length.')
    decoded += de.flush()
    if len(decoded) > expected_len:
        raise ValueError('Decompressed output exceeds declared original length.')
    if not de.eof:
        raise ValueError('Compressed payload is truncated.')
    if de.unused_data:
        raise ValueError('Compressed payload contains trailing data.')
    return decoded

def write_archive(path, aid, cid, orig_len, digest, payload):
    if aid < 0 or aid >= len(ALGOS) or cid < 0 or cid >= len(CODECS):
        raise ValueError('Invalid algorithm or codec IDs.')
    if orig_len < 0 or orig_len > MAX_ORIGINAL_BYTES:
        raise ValueError('Original length is outside the permitted range.')
    if len(digest) != 32:
        raise ValueError('SHA-256 digest must be exactly 32 bytes.')
    if len(payload) > MAX_ARCHIVE_BYTES - HEADER_SIZE:
        raise ValueError('Payload exceeds the permitted archive size.')
    directory = os.path.dirname(os.path.abspath(path))
    os.makedirs(directory, exist_ok=True)
    fd, temp_path = tempfile.mkstemp(prefix='.hfq-', suffix='.tmp', dir=directory)
    try:
        with os.fdopen(fd, 'wb') as handle:
            handle.write(MAGIC)
            handle.write(bytes([aid, cid]))
            handle.write(struct.pack('<q', orig_len))
            handle.write(digest)
            handle.write(struct.pack('<q', len(payload)))
            handle.write(payload)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temp_path, path)
        if os.name != 'nt':
            dir_fd = os.open(directory, os.O_RDONLY)
            try:
                os.fsync(dir_fd)
            finally:
                os.close(dir_fd)
    finally:
        try:
            os.unlink(temp_path)
        except FileNotFoundError:
            pass

def read_archive(path):
    with open(path, 'rb') as f:
        blob = f.read(MAX_ARCHIVE_BYTES + 1)
    if len(blob) > MAX_ARCHIVE_BYTES:
        raise ValueError('Archive exceeds the permitted size.')
    if len(blob) < HEADER_SIZE:
        raise ValueError('Archive too short.')
    if blob[:9] != MAGIC:
        raise ValueError('Invalid archive signature.')
    aid, cid = blob[9], blob[10]
    (orig_len,) = struct.unpack('<q', blob[11:19])
    digest = blob[19:51]
    (plen,) = struct.unpack('<q', blob[51:59])
    if orig_len < 0 or orig_len > MAX_ORIGINAL_BYTES:
        raise ValueError('Declared original length is outside the permitted range.')
    if plen < 0 or plen > MAX_ARCHIVE_BYTES - HEADER_SIZE:
        raise ValueError('Declared payload length is outside the permitted range.')
    if len(blob) != HEADER_SIZE + plen:
        raise ValueError('Truncated payload or unexpected trailing bytes.')
    if aid >= len(ALGOS) or cid >= len(CODECS):
        raise ValueError('Invalid algorithm or codec IDs.')
    return aid, cid, orig_len, digest, blob[HEADER_SIZE:]

def restore(path):
    aid, cid, orig_len, digest, payload = read_archive(path)
    algo, codec = ALGOS[aid], CODECS[cid]
    decoded = expand(payload, codec, orig_len)
    original = decoded if algo == 'Direct' else predictor(decoded, algo, True)
    if len(original) != orig_len:
        raise ValueError('Verification failed: restored length mismatch.')
    if hashlib.sha256(original).digest() != digest:
        raise ValueError('Verification failed: SHA-256 mismatch.')
    return original

def sweep(src_bytes, dest_path):
    data = src_bytes
    if len(data) > MAX_SWEEP_BYTES:
        raise ValueError('Sweep input exceeds the 1 MiB CPU-safety limit.')
    digest = hashlib.sha256(data).digest()
    rows, best = [], None
    for a, algo in enumerate(ALGOS):
        encoded = data if algo == 'Direct' else predictor(data, algo, False)
        for c, codec in enumerate(CODECS):
            payload = compress(encoded, codec)
            decoded = expand(payload, codec, len(encoded))
            restored = decoded if algo == 'Direct' else predictor(decoded, algo, True)
            ok = len(restored) == len(data) and hashlib.sha256(restored).digest() == digest
            if not ok: raise ValueError(f'Round-trip failed: {algo}/{codec}')
            arch = len(payload) + HEADER_SIZE
            rows.append((algo, codec, len(payload), arch,
                         round(100*(1 - arch/max(1,len(data))),2)))
            if best is None or arch < best[0]:
                best = (arch, a, c, payload, algo, codec)
    write_archive(dest_path, best[1], best[2], len(data), digest, best[3])
    disk = restore(dest_path)
    if hashlib.sha256(disk).digest() != digest:
        raise ValueError('Saved archive verification failed.')
    return rows, best

if __name__ == '__main__':
    import sys, json, os
    path = sys.argv[1]
    with open(path, 'rb') as handle:
        data = handle.read(MAX_SWEEP_BYTES + 1)
    if len(data) > MAX_SWEEP_BYTES:
        raise ValueError('Sweep input exceeds the 1 MiB CPU-safety limit.')
    rows, best = sweep(data, path + '.hfq')
    print(f'input={len(data)} best={best[4]}/{best[5]} archive={os.path.getsize(path+".hfq")}')
    for r in sorted(rows, key=lambda x:(x[3],))[:8]:
        print(f'{r[0]:10s} {r[1]:8s} payload={r[2]:8d} archive={r[3]:8d} red={r[4]:6.2f}%')
