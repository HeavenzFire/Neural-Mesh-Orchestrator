// check-manifest.mjs — independent chain-linkage validator for proof manifests.
// Usage: node vendor/airgap/check-manifest.mjs [path/to/manifest.json]
import { readFileSync } from 'node:fs';

const path = process.argv[2] || 'vendor/dist/netns-proof/manifest.netns.json';
const m = JSON.parse(readFileSync(path, 'utf8'));

let prev = m.genesis;
for (const b of m.blocks) {
  if (b.prevHash !== prev) {
    console.error('CHAIN BREAK at block', b.index);
    process.exit(1);
  }
  prev = b.hash;
}
if (m.headHash !== prev) {
  console.error('HEAD MISMATCH: declared head != last block hash');
  process.exit(1);
}
console.log('chain linkage OK | blocks:', m.blocks.length,
  '| head:', m.headHash.slice(0, 16),
  '| envelopeSig:', Boolean(m.envelopeSig));
for (const b of m.blocks) {
  console.log(' -', b.event, JSON.stringify(b.payload).slice(0, 90));
}
