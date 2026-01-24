#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/_kaput.sh"

if "$KAPUT" whoami >/dev/null 2>&1; then
  echo "Authenticated"
  exit 0
fi

echo "Not authenticated. Run: kaput login" >&2
echo "It will show a link + short code (device-code flow). Enter the code in your browser and the CLI will finish automatically." >&2
exit 1
