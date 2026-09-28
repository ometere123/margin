#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "[1/5] Python syntax"
python3 -m py_compile contracts/margin.py tests/test_contract_invariants.py tests/direct/test_margin.py

echo "[2/5] Source invariants"
python3 -m unittest -q tests.test_contract_invariants

echo "[3/5] Network invariant"
FORBIDDEN_CHAIN="619""97"
if grep -RIn --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=__pycache__ --exclude='*.zip' --exclude='*.pyc' "$FORBIDDEN_CHAIN" .; then
  echo "Unexpected non-Studionet chain reference found" >&2
  exit 1
fi
grep -RIn --exclude-dir=.git --exclude-dir=node_modules --exclude='*.zip' '61999' README.md contracts shared extension signer docs deployment.example.json gltest.config.yaml >/dev/null

echo "[4/5] Local GenLayer CLI pin invariant"
python3 - <<'PYCLI'
import json
from pathlib import Path
root = Path('.')
pkg = json.loads((root / 'package.json').read_text())
assert pkg.get('devDependencies', {}).get('genlayer') == '0.39.1', 'package.json must pin genlayer exactly to 0.39.1'
assert (root / '.genlayer-cli-version').read_text().strip() == '0.39.1', '.genlayer-cli-version must be 0.39.1'
print('GenLayer CLI pin: 0.39.1')
PYCLI

echo "[5/5] Shared protocol TypeScript (when global tsc is present)"
if command -v tsc >/dev/null 2>&1 && tsc --version >/dev/null 2>&1; then
  tsc --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --lib ES2022,DOM,DOM.Iterable shared/protocol.ts
else
  echo "runnable tsc not available in this shell; skipped shared protocol compile"
fi

echo "Offline preflight passed. Full npm/GenVM/live checks are separate."
