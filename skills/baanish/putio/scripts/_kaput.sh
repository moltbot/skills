#!/usr/bin/env bash
set -euo pipefail

# Resolve the kaput CLI location.
# - Prefer explicit KAPUT_BIN
# - Then PATH
# - Then ~/.cargo/bin
kaput_resolve() {
  if [[ -n "${KAPUT_BIN:-}" ]]; then
    echo "$KAPUT_BIN"
    return 0
  fi

  if command -v kaput >/dev/null 2>&1; then
    echo "kaput"
    return 0
  fi

  if [[ -x "${HOME}/.cargo/bin/kaput" ]]; then
    echo "${HOME}/.cargo/bin/kaput"
    return 0
  fi

  echo "ERROR: kaput CLI not found. Install with: cargo install kaput-cli (and ensure ~/.cargo/bin is on PATH)." >&2
  return 127
}

KAPUT="$(kaput_resolve)"