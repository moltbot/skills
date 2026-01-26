#!/bin/bash
# Ensue API wrapper for Second Brain skill
# Usage: ./scripts/ensue-api.sh <method> '<json_args>'
#
# Methods:
#   list_keys        - List keys by prefix
#   get_memory       - Get specific entries
#   create_memory    - Create new entries
#   update_memory    - Update existing entry
#   delete_memory    - Delete an entry
#   discover_memories - Semantic search
#
# Examples:
#   ./scripts/ensue-api.sh list_keys '{"prefix": "public/concepts/", "limit": 10}'
#   ./scripts/ensue-api.sh discover_memories '{"query": "how does caching work", "limit": 5}'

METHOD="$1"
ARGS="$2"

if [ -z "$ENSUE_API_KEY" ]; then
  echo '{"error":"ENSUE_API_KEY not set. Configure in clawdbot.json under skills.entries.second-brain.apiKey or get a key at https://ensue-network.ai/dashboard"}'
  exit 1
fi

if [ -z "$METHOD" ]; then
  echo '{"error":"No method specified. Available: list_keys, get_memory, create_memory, update_memory, delete_memory, discover_memories"}'
  exit 1
fi

# Default empty args
[ -z "$ARGS" ] && ARGS='{}'

curl -s -X POST https://api.ensue-network.ai/ \
  -H "Authorization: Bearer $ENSUE_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"tools/call\",\"params\":{\"name\":\"$METHOD\",\"arguments\":$ARGS},\"id\":1}" \
  | sed 's/^data: //'
