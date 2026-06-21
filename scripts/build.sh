#!/usr/bin/env bash
# CapperWeb production build: install deps, apply security fixes, then compile.
set -euo pipefail

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT"

if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

echo "==> npm audit fix --force"
npm audit fix --force || true

# audit fix may rewrite package-lock.json; re-sync node_modules if it did.
if [ -f package-lock.json ]; then
  npm ci
fi

exec npm run build "$@"
