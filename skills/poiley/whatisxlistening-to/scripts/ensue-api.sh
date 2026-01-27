#!/bin/bash
# Ensue API wrapper for second-brain skill
# Usage: ensue-api.sh <method> '<json_args>'

set -euo pipefail

API_KEY="${ENSUE_API_KEY:-}"
API_BASE="https://api.ensue-network.ai/v1"

if [[ -z "$API_KEY" ]]; then
  # Try to get from keychain
  API_KEY=$(security find-generic-password -a "clawdbot" -s "ensue-api-key" -w 2>/dev/null || true)
fi

if [[ -z "$API_KEY" ]]; then
  echo "Error: ENSUE_API_KEY not set and not found in keychain" >&2
  exit 1
fi

METHOD="${1:-}"
ARGS="${2:-{}}"

case "$METHOD" in
  discover_memories)
    curl -sS -X POST "$API_BASE/memories/discover" \
      -H "Authorization: Bearer $API_KEY" \
      -H "Content-Type: application/json" \
      -d "$ARGS"
    ;;
  list_keys)
    curl -sS -X POST "$API_BASE/memories/list" \
      -H "Authorization: Bearer $API_KEY" \
      -H "Content-Type: application/json" \
      -d "$ARGS"
    ;;
  get_memory)
    curl -sS -X POST "$API_BASE/memories/get" \
      -H "Authorization: Bearer $API_KEY" \
      -H "Content-Type: application/json" \
      -d "$ARGS"
    ;;
  create_memory)
    curl -sS -X POST "$API_BASE/memories/create" \
      -H "Authorization: Bearer $API_KEY" \
      -H "Content-Type: application/json" \
      -d "$ARGS"
    ;;
  update_memory)
    curl -sS -X POST "$API_BASE/memories/update" \
      -H "Authorization: Bearer $API_KEY" \
      -H "Content-Type: application/json" \
      -d "$ARGS"
    ;;
  delete_memory)
    curl -sS -X POST "$API_BASE/memories/delete" \
      -H "Authorization: Bearer $API_KEY" \
      -H "Content-Type: application/json" \
      -d "$ARGS"
    ;;
  *)
    echo "Usage: ensue-api.sh <method> '<json_args>'" >&2
    echo "Methods: discover_memories, list_keys, get_memory, create_memory, update_memory, delete_memory" >&2
    exit 1
    ;;
esac
