#!/usr/bin/env bash
# run-netns-proof.sh — execute the compiled vendor self-test + packaged W1
# router under KERNEL-ENFORCED network isolation on hosts WITHOUT Docker.
#
# Mechanism: `unshare -rn` creates a fresh user+network namespace whose only
# interface is a DOWN loopback. We bring lo UP via SIOCSIFFLAGS ioctl (iproute2
# 'ip' may be absent), then run node inside that namespace. Remote egress is
# IMPOSSIBLE (no routes, no DNS) while 127.0.0.1 still works — exactly docker's
# `--network none` semantic. This upgrades the claim from "tests happened not to
# touch the network" to "tests cannot touch the network".
#
# Captures per reviewer checklist: command, exit code ($? directly, never a
# pipe's tail status), complete logs, source commit, SHA-256 of every artifact
# -> manifest.netns.json chained + signed via sovereign-crypto envelope export.
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT_DIR="$REPO_ROOT/vendor/dist/netns-proof"
LOG="$OUT_DIR/selftest.log"
W1_LOG="$OUT_DIR/w1-e2e.log"
MANIFEST="$OUT_DIR/manifest.netns.json"
mkdir -p "$OUT_DIR"

command -v unshare >/dev/null || { echo "FATAL: unshare missing"; exit 2; }
command -v python3 >/dev/null || { echo "FATAL: python3 missing (needed for lo-up ioctl)"; exit 2; }
[ -f "$REPO_ROOT/vendor/dist/app/tests/vendor_selftest.js" ] \
  || { echo "FATAL: run vendor/image/sovereign-build.sh first"; exit 2; }

LO_UP='import socket,fcntl,struct,subprocess,sys
s=socket.socket(socket.AF_INET,socket.SOCK_DGRAM)
fcntl.ioctl(s.fileno(),0x8914,struct.pack("16sH14s",b"lo",1,b"\0"*14))
sys.exit(subprocess.call(sys.argv[1:]))'

echo "[netns] 1/2 vendor self-test under isolated netns (egress impossible)"
unshare -rn python3 -c "$LO_UP" node "$REPO_ROOT/vendor/tests/run-selftest.mjs" >"$LOG" 2>&1
EXIT_SELFTEST=$?

echo "[netns] 2/2 packaged W1 router e2e under isolated netns"
GEMINI_API_KEY="" LOCAL_FALLBACK_ONLY=true \
unshare -rn python3 -c "$LO_UP" node "$REPO_ROOT/vendor/dist/app/image/w1-entry.js" --selftest >"$W1_LOG" 2>&1
EXIT_W1=$?

echo "[netns] exits: selftest=$EXIT_SELFTEST w1=$EXIT_W1"
tail -2 "$LOG"; tail -2 "$W1_LOG"
if [ "$EXIT_SELFTEST" -ne 0 ] || [ "$EXIT_W1" -ne 0 ]; then echo "NETNS PROOF FAILED"; exit 1; fi

COMMIT="$(git -C "$REPO_ROOT" rev-parse HEAD 2>/dev/null || echo unknown)"
if [ "$COMMIT" = "unknown" ]; then echo "FATAL: source commit unresolved — refusing to attest"; exit 1; fi

node --input-type=module -e '
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const sha = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");
const { HashChainLedger } = await import("'"$REPO_ROOT"'/vendor/dist/app/sovereign-crypto/index.js");
const l = new HashChainLedger(process.env.ATTEST_KEY ?? "airgap-netns-attest");
l.append("source-commit", { commit: "'"$COMMIT"'" });
l.append("isolation-mode", { mechanism: "unshare -rn (user+net ns, loopback-only)", docker_equivalent: "--network none" });
l.append("selftest-exit", { code: '"$EXIT_SELFTEST"', log_sha256: sha("'"$LOG"'") });
l.append("w1-e2e-exit", { code: '"$EXIT_W1"', log_sha256: sha("'"$W1_LOG"'") });
const v = l.validate(); if (!v.ok) { console.error("chain invalid", v); process.exit(1); }
writeFileSync("'"$MANIFEST"'", l.exportSignedJSON());
console.log("attestation manifest written:", "'"$(realpath "$MANIFEST")"'");
' || { echo "FATAL: attestation step failed"; exit 1; }

echo "NETNS PROOF OK — primitives + packaged W1 fallback route executed with egress impossible"
echo "scope: does NOT yet prove offline npm install or external-witness anchoring."
