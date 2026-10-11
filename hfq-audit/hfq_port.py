"""Faithful Python port of the HeavenzFire HFQ sweep, for independent audit.
Mirrors PowerShell semantics exactly: byte-wise XOR predictors with lag<=i guard,
GZip/Deflate via gzip/zlib raw, header magic HFQCOMP01 + 59-byte header."""
import gzip, zlib, hashlib, struct, math

ALGOS = ['Direct','XorLag1','XorLag2','XorLag3','XorLag5','XorLag8','XorLag13',
         'XorLag21','XorLag34','XorLag55','XorLag89','XorLag144','Phase369']
CODECS = ['GZip','Deflate']
MAGIC = b'HFQCOMP01'
HEADER_SIZE = 59  # 9+1+1+8+32+8
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

def expand(b: bytes, codec: str) -> bytes:
    if codec == 'GZip':
        return gzip.decompress(b)
    de = zlib.decompressobj(-15)
    return de.decompress(b) + de.flush()

def write_archive(path, aid, cid, orig_len, digest, payload):
    with open(path,'wb') as f:
        f.write(MAGIC); f.write(bytes([aid])); f.write(bytes([cid]))
        f.write(struct.pack('<q', orig_len)); f.write(digest)
        f.write(struct.pack('<q', len(payload))); f.write(payload)

def read_archive(path):
    with open(path,'rb') as f: blob = f.read()
    assert len(blob) >= HEADER_SIZE, 'Archive too short.'
    assert blob[:9] == MAGIC, 'Invalid archive signature.'
    aid, cid = blob[9], blob[10]
    (orig_len,) = struct.unpack('<q', blob[11:19])
    digest = blob[19:51]
    (plen,) = struct.unpack('<q', blob[51:59])
    payload = blob[59:59+plen]
    assert len(payload) == plen, 'Truncated payload.'
    assert aid < len(ALGOS) and cid < len(CODECS), 'Invalid IDs.'
    return aid, cid, orig_len, digest, payload

def restore(path):
    aid, cid, orig_len, digest, payload = read_archive(path)
    algo, codec = ALGOS[aid], CODECS[cid]
    decoded = expand(payload, codec)
    original = decoded if algo == 'Direct' else predictor(decoded, algo, True)
    assert len(original) == orig_len, 'Verification failed: restored length mismatch.'
    assert hashlib.sha256(original).digest() == digest, 'Verification failed: SHA-256 mismatch.'
    return original

def sweep(src_bytes, dest_path):
    data = src_bytes
    digest = hashlib.sha256(data).digest()
    rows, best = [], None
    for a, algo in enumerate(ALGOS):
        encoded = data if algo == 'Direct' else predictor(data, algo, False)
        for c, codec in enumerate(CODECS):
            payload = compress(encoded, codec)
            decoded = expand(payload, codec)
            restored = decoded if algo == 'Direct' else predictor(decoded, algo, True)
            ok = len(restored) == len(data) and hashlib.sha256(restored).digest() == digest
            if not ok: raise AssertionError(f'Round-trip failed: {algo}/{codec}')
            arch = len(payload) + HEADER_SIZE
            rows.append((algo, codec, len(payload), arch,
                         round(100*(1 - arch/max(1,len(data))),2)))
            if best is None or arch < best[0]:
                best = (arch, a, c, payload, algo, codec)
    write_archive(dest_path, best[1], best[2], len(data), digest, best[3])
    disk = restore(dest_path)
    assert hashlib.sha256(disk).digest() == digest, 'Saved archive verification failed.'
    return rows, best

if __name__ == '__main__':
    import sys, json, os
    path = sys.argv[1]
    data = open(path,'rb').read()
    rows, best = sweep(data, path + '.hfq')
    print(f'input={len(data)} best={best[4]}/{best[5]} archive={os.path.getsize(path+".hfq")}')
    for r in sorted(rows, key=lambda x:(x[3],))[:8]:
        print(f'{r[0]:10s} {r[1]:8s} payload={r[2]:8d} archive={r[3]:8d} red={r[4]:6.2f}%')
