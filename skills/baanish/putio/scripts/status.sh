#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/_kaput.sh"

# Privacy: whoami may print your account email. Only show it if explicitly requested.
if [[ "${SHOW_ACCOUNT:-0}" == "1" ]]; then
  echo "=== Account ==="
  "$KAPUT" whoami
  echo ""
fi

echo "=== Transfers ==="
"$KAPUT" transfers list
