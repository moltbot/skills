#!/usr/bin/env bash
set -euo pipefail

# Prevent Python from writing __pycache__/ bytecode files into the repo.
export PYTHONDONTWRITEBYTECODE=1

cd "$(dirname "$0")/.."

# Clean up any stray bytecode from previous runs (should never be committed).
find . -name '__pycache__' -type d -prune -exec rm -rf {} +
find . -name '*.pyc' -type f -delete

python3 -m unittest discover -s tests -v

# Sanity check: tests should not leave bytecode behind.
if find . -name '__pycache__' -o -name '*.pyc' | grep -q .; then
  echo "ERROR: Python bytecode (__pycache__ / *.pyc) was created during tests." >&2
  echo "Tip: ensure PYTHONDONTWRITEBYTECODE=1 is honored and you're not running Python with -B disabled." >&2
  exit 1
fi
