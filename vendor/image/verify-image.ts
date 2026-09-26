/**
 * verify-image.ts — fail-closed integrity check for the sovereign image bundle.
 * Re-hashes every layer referenced in manifest.json and compares against the
 * recorded sha256 digests. Any mismatch => exit 1 (tamper-evident packaging).
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const [, , manifestPath, dir] = process.argv;
if (!manifestPath || !dir) {
  console.error('usage: verify-image.ts <manifest.json> <image-dir>');
  process.exit(2);
}

function sha256File(p: string): string {
  return createHash('sha256').update(readFileSync(p)).digest('hex');
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
let failures = 0;

function check(label: string, digestField: string, sizeField: string, file: string) {
  const entry = manifest[label];
  const items = Array.isArray(entry) ? entry : [entry];
  for (const it of items) {
    const want = String(it.digest).replace(/^sha256:/, '');
    const got = sha256File(join(dir, file));
    const sizeWant = Number(it.size);
    const sizeGot = readFileSync(join(dir, file)).length;
    if (want !== got) { console.error(`✗ ${file}: digest mismatch`); failures++; }
    else if (sizeWant !== sizeGot) { console.error(`✗ ${file}: size mismatch (${sizeWant} vs ${sizeGot})`); failures++; }
    else console.log(`✓ ${file}: sha256:${got.slice(0, 16)}… attested`);
  }
}

check('config', 'digest', 'size', 'config.json');
check('layers', 'digest', 'size', 'layer.tar.gz');

if (failures) { console.error(`IMAGE VERIFY FAILED (${failures})`); process.exit(1); }
console.log('IMAGE VERIFY OK — all layer digests match manifest');
