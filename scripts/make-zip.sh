#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-/mnt/data/MARGIN-handoff.zip}"
cd "$ROOT"
rm -f "$OUT"
zip -qr "$OUT" . -x 'node_modules/*' 'extension/dist/*' 'signer/dist/*' '*.zip' '.git/*' '.pytest_cache/*' '*/.pytest_cache/*' '__pycache__/*' '*/__pycache__/*' '*.pyc' '.DS_Store' '*/.DS_Store'
echo "$OUT"
