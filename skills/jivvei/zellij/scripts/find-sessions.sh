#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: find-sessions.sh [-D data-dir|-A] [-q pattern]

List zellij sessions on a data directory.

Options:
  -D, --data-dir    zellij data directory path
  -A, --all         scan all data directories under CLAWDBOT_ZELLIJ_DATA_DIR
  -q, --query       case-insensitive substring to filter session names
  -h, --help        show this help
USAGE
}

data_dir=""
query=""
scan_all=false
zellij_data_dir="${CLAWDBOT_ZELLIJ_DATA_DIR:-${TMPDIR:-/tmp}/moltbot-zellij-data}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -D|--data-dir) data_dir="${2-}"; shift 2 ;;
    -A|--all)       scan_all=true; shift ;;
    -q|--query)     query="${2-}"; shift 2 ;;
    -h|--help)      usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ "$scan_all" == true && -n "$data_dir" ]]; then
  echo "Cannot combine --all with -D" >&2
  exit 1
fi

if ! command -v zellij >/dev/null 2>&1; then
  echo "zellij not found in PATH" >&2
  exit 1
fi

list_sessions() {
  local dir="$1"
  local label="$2"

  if [[ ! -d "$dir" ]]; then
    echo "Data directory not found: $dir" >&2
    return 1
  fi

  if ! sessions_json="$(zellij --data-dir "$dir" list-sessions 2>/dev/null)"; then
    echo "No zellij sessions found in $label" >&2
    return 1
  fi

  if ! command -v jq >/dev/null 2>&1; then
    echo "jq is required to parse zellij output" >&2
    return 1
  fi

  if [[ -n "$query" ]]; then
    sessions_json="$(printf '%s\n' "$sessions_json" | jq --arg q "$query" '[.[] | select(.name | ascii_downcase | contains($q | ascii_downcase))]' 2>/dev/null || echo '[]')"
  fi

  local count
  count=$(printf '%s\n' "$sessions_json" | jq 'length')

  if [[ "$count" -eq 0 ]]; then
    echo "No sessions found in $label"
    return 0
  fi

  echo "Sessions in $label:"
  printf '%s\n' "$sessions_json" | jq -r '.[] |
    "  - \(.name) (pid: \(.pid), tabs: \(.tabs | length))"'
}

if [[ "$scan_all" == true ]]; then
  if [[ ! -d "$zellij_data_dir" ]]; then
    echo "Zellij data directory not found: $zellij_data_dir" >&2
    exit 1
  fi

  shopt -s nullglob
  data_dirs=("$zellij_data_dir"/*)
  shopt -u nullglob

  if [[ "${#data_dirs[@]}" -eq 0 ]]; then
    echo "No data directories found under $zellij_data_dir" >&2
    exit 1
  fi

  exit_code=0
  for d in "${data_dirs[@]}"; do
    if [[ ! -d "$d" ]]; then
      continue
    fi
    list_sessions "$d" "data directory '$d'" || exit_code=$?
    echo ""
  done
  exit "$exit_code"
fi

# Use provided data dir or default
if [[ -z "$data_dir" ]]; then
  data_dir="$zellij_data_dir"
fi

list_sessions "$data_dir" "data directory '$data_dir'"
