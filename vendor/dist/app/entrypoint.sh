#!/bin/sh
[ "${GEMINI_API_KEY:-}" = "" ] || { echo "FATAL: GEMINI_API_KEY set in airgap image" >&2; exit 78; }
[ "${LOCAL_FALLBACK_ONLY:-}" = "true" ] || { echo "FATAL: LOCAL_FALLBACK_ONLY!=true" >&2; exit 78; }
exec node "/app/app/image/w1-entry.js" "$@"
