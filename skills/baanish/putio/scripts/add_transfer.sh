#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/_kaput.sh"

URL="${1:-}"
if [[ -z "$URL" ]]; then
  echo "Usage: $0 <magnet_or_url>" >&2
  exit 2
fi

"$KAPUT" transfers add "$URL"
