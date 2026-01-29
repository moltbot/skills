#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: cleanup-sessions.sh [-D data-dir]

Delete all zellij sessions in the specified data directory.

Options:
  -D, --data-dir    zellij data directory (uses CLAWDBOT_ZELLIJ_DATA_DIR if not set)
  -y, --yes         skip confirmation prompt
  -h, --help        show this help
USAGE
}

data_dir=""
skip_confirm=false
zellij_data_dir="${CLAWDBOT_ZELLIJ_DATA_DIR:-${TMPDIR:-/tmp}/moltbot-zellij-data}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -D|--data-dir)  data_dir="${2-}"; shift 2 ;;
    -y|--yes)       skip_confirm=true; shift ;;
    -h|--help)      usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage; exit 1 ;;
  esac
done

if ! command -v zellij >/dev/null 2>&1; then
  echo "zellij not found in PATH" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required to parse zellij output" >&2
  exit 1
fi

if [[ -z "$data_dir" ]]; then
  data_dir="$zellij_data_dir"
fi

if [[ ! -d "$data_dir" ]]; then
  echo "Data directory not found: $data_dir" >&2
  exit 1
fi

# Get list of sessions
if ! sessions_json="$(zellij --data-dir "$data_dir" list-sessions 2>/dev/null)"; then
  echo "No zellij sessions found in $data_dir" >&2
  exit 0
fi

session_count=$(printf '%s\n' "$sessions_json" | jq 'length')

if [[ "$session_count" -eq 0 ]]; then
  echo "No sessions to delete"
  exit 0
fi

# Show sessions to be deleted
echo "Sessions in $data_dir:"
printf '%s\n' "$sessions_json" | jq -r '.[] | "  - \(.name) (pid: \(.pid))"'

# Confirm unless -y flag
if [[ "$skip_confirm" != true ]]; then
  echo ""
  read -p "Delete all ${session_count} sessions? [y/N] " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted"
    exit 0
  fi
fi

# Delete all sessions
printf '%s\n' "$sessions_json" | jq -r '.[].name' | while read -r session_name; do
  echo "Deleting session: $session_name"
  zellij --data-dir "$data_dir" delete-session --yes --session "$session_name" 2>/dev/null || true
done

echo "Done"
