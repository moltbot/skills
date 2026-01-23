#!/bin/bash
# Wrapper script - sources .env and runs generate.sh
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Source .env if it exists
[[ -f "$SCRIPT_DIR/.env" ]] && source "$SCRIPT_DIR/.env"
[[ -f "$HOME/clawd/.env" ]] && source "$HOME/clawd/.env"

exec "$SCRIPT_DIR/scripts/generate.sh" "$@"
