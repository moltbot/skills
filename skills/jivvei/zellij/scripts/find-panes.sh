#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: find-panes.sh -s session [-D data-dir] [-q pattern]

List panes in a zellij session.

Options:
  -s, --session     session name (required)
  -D, --data-dir    zellij data directory (uses CLAWDBOT_ZELLIJ_DATA_DIR if not set)
  -q, --query       case-insensitive substring to filter pane content
  -h, --help        show this help
USAGE
}

session=""
data_dir=""
query=""
zellij_data_dir="${CLAWDBOT_ZELLIJ_DATA_DIR:-${TMPDIR:-/tmp}/moltbot-zellij-data}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -s|--session)   session="${2-}"; shift 2 ;;
    -D|--data-dir)  data_dir="${2-}"; shift 2 ;;
    -q|--query)     query="${2-}"; shift 2 ;;
    -h|--help)      usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$session" ]]; then
  echo "session is required" >&2
  usage
  exit 1
fi

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

# Get session details
if ! session_info="$(zellij --data-dir "$data_dir" list-sessions)"; then
  echo "Failed to list sessions in $data_dir" >&2
  exit 1
fi

# Find the requested session
session_json=$(printf '%s\n' "$session_info" | jq --arg s "$session" '.[] | select(.name == $s)') || {
  echo "Session not found: $session" >&2
  exit 1
}

# List panes in the session
echo "Panes in session '$session':"
printf '%s\n' "$session_json" | jq -r '.tabs[] |
  "  Tab: \(.name // "unnamed") (id: \(.id))",
  (.panes[] | "    Pane: \(.id) (\(.title // "no title"))")'

# If query is provided, try to find matching pane content
if [[ -n "$query" ]]; then
  echo ""
  echo "Searching for pane content matching: $query"
  printf '%s\n' "$session_json" | jq -r '.tabs[].panes[].id' | while read -r pane_id; do
    if pane_content=$(zellij --data-dir "$data_dir" pipe --session "$session" --pane-id "$pane_id" 2>/dev/null); then
      if grep -qi -- "$query" <<< "$pane_content"; then
        echo "  ✓ Found in pane $pane_id"
      fi
    fi
  done
fi
