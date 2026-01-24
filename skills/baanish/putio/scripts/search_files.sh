#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/_kaput.sh"

QUERY="${1:-}"
if [[ -z "$QUERY" ]]; then
  echo "Usage: $0 <query>" >&2
  exit 2
fi

"$KAPUT" files search "$QUERY"
