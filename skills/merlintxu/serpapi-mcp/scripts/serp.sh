#!/usr/bin/env bash
set -euo pipefail

# Skill script for SerpAPI MCP via mcporter.
# Usage:
#   serp.sh 'query' [engine] [num] [mode]

q="${1:-}"
engine="${2:-google_light}"
num="${3:-5}"
mode="${4:-compact}"

if [[ -z "$q" ]]; then
  echo "Missing query. Usage: $0 'query' [engine] [num] [mode]" >&2
  exit 2
fi

if [[ -z "${SERPAPI_API_KEY:-}" ]]; then
  echo "SERPAPI_API_KEY env var is not set (set it in Clawdbot gateway config: env.vars.SERPAPI_API_KEY)" >&2
  exit 2
fi

endpoint="https://mcp.serpapi.com/${SERPAPI_API_KEY}/mcp.search"

args=$(node -e 'const [q,engine,num,mode]=process.argv.slice(1); console.log(JSON.stringify({params:{q,engine,num:Number(num)},mode}));' "$q" "$engine" "$num" "$mode")

mcporter call "$endpoint" --args "$args" --output json
