#!/bin/sh
# sovereign-build.sh — air-gapped W1 router image WITHOUT a container daemon.
#
# WHY: this host has no docker/podman/buildah. Instead of waiting on a daemon,
# we produce an OCI-style, content-addressed artifact with only Node + coreutils:
#   1) transpile TS->JS offline (local tsc, no registry access)
#   2) reproducible tar.gz layer (--sort=name, fixed mtime/owner, gzip -n)
#   3) config.json + manifest.json with sha256 digests of every layer
#   4) fail-closed digest verification
# Runtime isolation is enforced EXTERNALLY by ../airgap/run-netns-proof.sh via
# `unshare -rn` (kernel loopback-only netns) — egress impossible, not merely
# unused. On Docker hosts, run-airgap-proof.sh stays canonical.
set -eu
export LC_ALL=C

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUT_DIR="${1:-$REPO_ROOT/vendor/dist/image}"
EPOCH="${SOURCE_DATE_EPOCH:-1735689600}"

rm -rf "$OUT_DIR"; mkdir -p "$OUT_DIR/staging/app"
STAGE="$OUT_DIR/staging"

echo "[image] 1/4 transpile (offline local tsc)"
TSC="$REPO_ROOT/node_modules/.bin/tsc"
[ -x "$TSC" ] || { echo "FATAL: node_modules/.bin/tsc missing"; exit 1; }
"$TSC" \
  --rootDir "$REPO_ROOT/vendor" \
  --outDir "$STAGE/app" \
  --target es2022 --module nodenext --moduleResolution nodenext \
  --allowImportingTsExtensions --rewriteRelativeImportExtensions \
  --skipLibCheck --declaration false \
  "$REPO_ROOT/vendor/sovereign-http/index.ts" \
  "$REPO_ROOT/vendor/sovereign-crypto/index.ts" \
  "$REPO_ROOT/vendor/sovereign-router/index.ts" \
  "$REPO_ROOT/vendor/sovereign-test/index.ts" \
  "$REPO_ROOT/vendor/tests/vendor_selftest.ts" \
  "$REPO_ROOT/vendor/image/w1-entry.ts" || { echo "FATAL: tsc failed"; exit 1; }

# rewrite '.ts' import specifiers to '.js' for nodenext runtime (belt & braces)
find "$STAGE/app" -name '*.js' | while read -r f; do
  sed -i "s|from '\(\.[^']*\)\.ts'|from '\1.js'|g" "$f"
done

echo "[image] 2/4 entrypoint + config (sovereignty assertions)"
cat > "$STAGE/app/entrypoint.sh" <<'LAUNCH'
#!/bin/sh
[ "${GEMINI_API_KEY:-}" = "" ] || { echo "FATAL: GEMINI_API_KEY set in airgap image" >&2; exit 78; }
[ "${LOCAL_FALLBACK_ONLY:-}" = "true" ] || { echo "FATAL: LOCAL_FALLBACK_ONLY!=true" >&2; exit 78; }
exec node "/app/app/image/w1-entry.js" "$@"
LAUNCH
chmod +x "$STAGE/app/entrypoint.sh"

CREATED="$(date -u -d "@$EPOCH" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -r "$EPOCH" +%Y-%m-%dT%H:%M:%SZ)"
cat > "$OUT_DIR/config.json" <<CFG
{
  "architecture": "amd64", "os": "linux", "created": "$CREATED",
  "config": {
    "Env": ["GEMINI_API_KEY=", "LOCAL_FALLBACK_ONLY=true", "NODE_ENV=production"],
    "NetworkDisabled": true,
    "Entrypoint": ["/app/app/entrypoint.sh"]
  },
  "builder": "sovereign-build-nodaemon/1.0"
}
CFG

echo "[image] 3/4 reproducible layer"
tar --format=gnu --sort=name --mtime="@${EPOCH}" --owner=0 --group=0 --numeric-owner \
    -C "$STAGE" -cf "$OUT_DIR/layer.tar" app
gzip -n -9 -f "$OUT_DIR/layer.tar"

LAYER_DIGEST="$(sha256sum "$OUT_DIR/layer.tar.gz" | cut -d' ' -f1)"
LAYER_SIZE="$(wc -c < "$OUT_DIR/layer.tar.gz" | tr -d ' ')"
CONFIG_DIGEST="$(sha256sum "$OUT_DIR/config.json" | cut -d' ' -f1)"
CONFIG_SIZE="$(wc -c < "$OUT_DIR/config.json" | tr -d ' ')"

cat > "$OUT_DIR/manifest.json" <<MAN
{
  "schemaVersion": 2,
  "mediaType": "application/vnd.docker.distribution.manifest.v2+json",
  "config": { "mediaType": "application/vnd.oci.image.config.v1+json", "digest": "sha256:${CONFIG_DIGEST}", "size": ${CONFIG_SIZE} },
  "layers": [
    { "mediaType": "application/vnd.docker.image.rootfs.diff.tar.gzip", "digest": "sha256:${LAYER_DIGEST}", "size": ${LAYER_SIZE} }
  ],
  "isolation_note": "runtime isolation enforced externally: docker --network none OR unshare -rn (loopback-only netns)"
}
MAN

echo "[image] 4/4 fail-closed verify"
node --experimental-strip-types "$SCRIPT_DIR/verify-image.ts" "$OUT_DIR/manifest.json" "$OUT_DIR" 2>/dev/null \
  || npx --no-install tsx "$SCRIPT_DIR/verify-image.ts" "$OUT_DIR/manifest.json" "$OUT_DIR"

# Publish compiled runtime at vendor/dist/app for the plain-node proof runner.
rm -rf "$REPO_ROOT/vendor/dist/app"
mv "$STAGE/app" "$REPO_ROOT/vendor/dist/app"
# ESM: force module semantics regardless of root package.json type field.
printf '{ "type": "module" }\n' > "$REPO_ROOT/vendor/dist/app/package.json"
# smoke test under bare node (no tsx, no network needed)
node "$REPO_ROOT/vendor/dist/app/tests/vendor_selftest.js" | tail -3 \
  || { echo "FATAL: compiled self-test failed under bare node"; exit 1; }

echo "layer sha256:  $LAYER_DIGEST"
echo "config sha256: $CONFIG_DIGEST"
echo "IMAGE BUILD OK (content-addressed, deterministic under SOURCE_DATE_EPOCH=$EPOCH)"
