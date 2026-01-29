#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: wait-for-text.sh -s session -p pane-id -r pattern [options]

Poll a zellij pane for text and exit when found.

Options:
  -s, --session    zellij session name (required)
  -p, --pane-id    pane ID (required)
  -r, --pattern    regex pattern to look for (required)
  -F, --fixed      treat pattern as a fixed string (grep -F)
  -T, --timeout    seconds to wait (integer, default: 15)
  -i, --interval   poll interval in seconds (default: 0.5)
  -D, --data-dir   zellij data dir (uses CLAWDBOT_ZELLIJ_DATA_DIR if not set)
  -h, --help       show this help
USAGE
}

session=""
pane_id=""
pattern=""
grep_flag="-E"
timeout=15
interval=0.5
data_dir=""
zellij_data_dir="${CLAWDBOT_ZELLIJ_DATA_DIR:-${TMPDIR:-/tmp}/moltbot-zellij-data}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -s|--session)   session="${2-}"; shift 2 ;;
    -p|--pane-id)   pane_id="${2-}"; shift 2 ;;
    -r|--pattern)   pattern="${2-}"; shift 2 ;;
    -F|--fixed)     grep_flag="-F"; shift ;;
    -T|--timeout)   timeout="${2-}"; shift 2 ;;
    -i|--interval)  interval="${2-}"; shift 2 ;;
    -D|--data-dir)  data_dir="${2-}"; shift 2 ;;
    -h|--help)      usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$session" || -z "$pane_id" || -z "$pattern" ]]; then
  echo "session, pane-id, and pattern are required" >&2
  usage
  exit 1
fi

if ! [[ "$timeout" =~ ^[0-9]+$ ]]; then
  echo "timeout must be an integer number of seconds" >&2
  exit 1
fi

if ! command -v zellij >/dev/null 2>&1; then
  echo "zellij not found in PATH" >&2
  exit 1
fi

if [[ -z "$data_dir" ]]; then
  data_dir="$zellij_data_dir"
fi

if [[ ! -d "$data_dir" ]]; then
  echo "Data directory not found: $data_dir" >&2
  exit 1
fi

# End time in epoch seconds (integer, good enough for polling)
start_epoch=$(date +%s)
deadline=$((start_epoch + timeout))

while true; do
  # Read pane content
  if ! pane_text="$(zellij --data-dir "$data_dir" pipe --session "$session" --pane-id "$pane_id" 2>/dev/null)"; then
    pane_text=""
  fi

  if printf '%s\n' "$pane_text" | grep $grep_flag -- "$pattern" >/dev/null 2>&1; then
    exit 0
  fi

  now=$(date +%s)
  if (( now >= deadline )); then
    echo "Timed out after ${timeout}s waiting for pattern: $pattern" >&2
    echo "Content from pane $pane_id in session $session:" >&2
    printf '%s\n' "$pane_text" >&2
    exit 1
  fi

  sleep "$interval"
done
