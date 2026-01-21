#!/usr/bin/env bash
set -euo pipefail

# charger-notify.sh
#
# Prints a notification message ONLY when availability flips from NO/UNKNOWN -> YES.
# Keeps state in ~/.cache/charger-notify/<target>.state
#
# Usage:
#   bash charger-notify.sh <favorite|place-id|query>

if [[ $# -lt 1 || "$1" == "-h" || "$1" == "--help" ]]; then
  cat >&2 <<'EOF'
Usage:
  charger-notify.sh <favorite|place-id|query>

Behavior:
- Runs `charger check <target>`
- If it detects `Any free: YES` and last state was not YES, prints a one-line notification.
- Otherwise prints nothing.

State:
- ~/.cache/charger-notify/<target>.state
EOF
  exit 2
fi

target="$1"

export PATH="/home/claw/clawd/bin:$PATH"

cache_dir="${HOME}/.cache/charger-notify"
mkdir -p "$cache_dir"

safe_target="${target//[^a-zA-Z0-9_.-]/_}"
state_file="$cache_dir/${safe_target}.state"

last=""
if [[ -f "$state_file" ]]; then
  last="$(cat "$state_file" 2>/dev/null || true)"
fi

out="$(charger check "$target" 2>&1 || true)"

# Detect current availability.
current="UNKNOWN"
if echo "$out" | grep -q "^\- Any free: YES$"; then
  current="YES"
elif echo "$out" | grep -q "^\- Any free: NO$"; then
  current="NO"
fi

# Always record current state (so UNKNOWN doesn't spam, but still updates).
echo "$current" > "$state_file"

if [[ "$current" == "YES" && "$last" != "YES" ]]; then
  # Pull details from charger output.
  name="$(echo "$out" | head -n 1)"
  address="$(echo "$out" | sed -n 's/^\- Address: //p' | head -n 1)"
  availability="$(echo "$out" | sed -n 's/^\- Availability: //p' | head -n 1)"
  updated="$(echo "$out" | sed -n 's/^\- Updated: //p' | head -n 1)"

  msg="EV charger available: ${name}"
  if [[ -n "$address" ]]; then
    msg+=" — ${address}"
  fi
  if [[ -n "$availability" ]]; then
    msg+=" — ${availability}"
  fi
  if [[ -n "$updated" ]]; then
    msg+=" (updated ${updated})"
  fi

  echo "$msg"
fi
