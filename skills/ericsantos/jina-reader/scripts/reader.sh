#!/usr/bin/env bash
set -euo pipefail

# Jina AI Reader - Web content extraction
# Usage: reader.sh [options] "URL or query"

MODE="read"
SELECTOR=""
WAIT_SELECTOR=""
REMOVE_SELECTOR=""
PROXY_COUNTRY=""
NO_CACHE=false
FORMAT="markdown"
JSON_OUTPUT=false
INPUT=""

usage() {
  echo "Usage: $(basename "$0") [options] \"URL or query\""
  echo ""
  echo "Modes:"
  echo "  --mode read     Convert URL to markdown (default)"
  echo "  --mode search   Web search with full content extraction"
  echo "  --mode ground   Fact-check a statement"
  echo ""
  echo "Options:"
  echo "  --selector CSS    Extract specific region"
  echo "  --wait CSS        Wait for element before extraction"
  echo "  --remove CSS      Remove elements (comma-separated)"
  echo "  --proxy CC        Country code for geo-proxy"
  echo "  --nocache         Force fresh content"
  echo "  --format FMT      markdown|html|text|screenshot"
  echo "  --json            Raw JSON output"
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode) MODE="$2"; shift 2 ;;
    --selector) SELECTOR="$2"; shift 2 ;;
    --wait) WAIT_SELECTOR="$2"; shift 2 ;;
    --remove) REMOVE_SELECTOR="$2"; shift 2 ;;
    --proxy) PROXY_COUNTRY="$2"; shift 2 ;;
    --nocache) NO_CACHE=true; shift ;;
    --format) FORMAT="$2"; shift 2 ;;
    --json) JSON_OUTPUT=true; shift ;;
    --help|-h) usage ;;
    -*) echo "Unknown option: $1" >&2; usage ;;
    *) INPUT="$1"; shift ;;
  esac
done

if [[ -z "$INPUT" ]]; then
  echo "Error: No URL or query provided" >&2
  usage
fi

# API key is optional but recommended for higher rate limits
API_KEY="${JINA_API_KEY:-}"

# Build headers array
HEADERS=()

if [[ -n "$API_KEY" ]]; then
  HEADERS+=(-H "Authorization: Bearer $API_KEY")
fi

HEADERS+=(-H "Accept: application/json")

if [[ -n "$SELECTOR" ]]; then
  HEADERS+=(-H "x-target-selector: $SELECTOR")
fi

if [[ -n "$WAIT_SELECTOR" ]]; then
  HEADERS+=(-H "x-wait-for-selector: $WAIT_SELECTOR")
fi

if [[ -n "$REMOVE_SELECTOR" ]]; then
  HEADERS+=(-H "x-remove-selector: $REMOVE_SELECTOR")
fi

if [[ -n "$PROXY_COUNTRY" ]]; then
  HEADERS+=(-H "x-country-proxy: $PROXY_COUNTRY")
fi

if [[ "$NO_CACHE" == true ]]; then
  HEADERS+=(-H "x-no-cache: true")
fi

if [[ "$FORMAT" != "markdown" ]]; then
  HEADERS+=(-H "x-respond-with: $FORMAT")
fi

# Execute based on mode
case "$MODE" in
  read)
    RESPONSE=$(curl -sS "${HEADERS[@]}" "https://r.jina.ai/${INPUT}" 2>&1)
    ;;
  search)
    ENCODED_QUERY=$(printf '%s' "$INPUT" | jq -sRr @uri)
    RESPONSE=$(curl -sS "${HEADERS[@]}" "https://s.jina.ai/${ENCODED_QUERY}" 2>&1)
    ;;
  ground)
    RESPONSE=$(curl -sS "${HEADERS[@]}" \
      -H "Content-Type: application/json" \
      -X POST "https://g.jina.ai/" \
      -d "$(jq -n --arg s "$INPUT" '{statement: $s}')" 2>&1)
    ;;
  *)
    echo "Error: Invalid mode '$MODE'. Use: read, search, ground" >&2
    exit 1
    ;;
esac

# Check for errors (Jina returns code 200 on success, 4xx/5xx on error)
RESP_CODE=$(echo "$RESPONSE" | jq -r '.code // empty' 2>/dev/null)
if [[ -n "$RESP_CODE" && "$RESP_CODE" != "200" ]]; then
  ERROR_MSG=$(echo "$RESPONSE" | jq -r '.message // .readableMessage // "Unknown error"')
  echo "Error ($RESP_CODE): $ERROR_MSG" >&2
  exit 1
fi

# Output
if [[ "$JSON_OUTPUT" == true ]]; then
  echo "$RESPONSE" | jq .
  exit 0
fi

# Format output based on mode
case "$MODE" in
  read)
    TITLE=$(echo "$RESPONSE" | jq -r '.data.title // empty')
    URL=$(echo "$RESPONSE" | jq -r '.data.url // empty')
    CONTENT=$(echo "$RESPONSE" | jq -r '.data.content // .data // empty')

    if [[ -n "$TITLE" ]]; then
      echo "# $TITLE"
      echo ""
    fi
    if [[ -n "$URL" ]]; then
      echo "Source: $URL"
      echo ""
    fi
    if [[ -n "$CONTENT" ]]; then
      echo "$CONTENT"
    else
      echo "Error: No content extracted" >&2
      echo "$RESPONSE" | jq . >&2
      exit 1
    fi
    ;;

  search)
    RESULTS=$(echo "$RESPONSE" | jq -r '.data // empty')
    if [[ -z "$RESULTS" || "$RESULTS" == "null" ]]; then
      echo "Error: No search results" >&2
      echo "$RESPONSE" | jq . >&2
      exit 1
    fi

    echo "$RESPONSE" | jq -r '.data[] | "## \(.title // "Untitled")\nURL: \(.url // "N/A")\n\n\(.content // .description // "No content")\n\n---\n"'
    ;;

  ground)
    FACTUALITY=$(echo "$RESPONSE" | jq -r '.data.factuality // empty')
    RESULT=$(echo "$RESPONSE" | jq -r '.data.result // empty')
    REASON=$(echo "$RESPONSE" | jq -r '.data.reason // empty')

    echo "Factuality: $FACTUALITY"
    echo "Result: $RESULT"
    echo ""
    if [[ -n "$REASON" ]]; then
      echo "$REASON"
    fi

    REFERENCES=$(echo "$RESPONSE" | jq -r '.data.references[]?.url // empty' 2>/dev/null)
    if [[ -n "$REFERENCES" ]]; then
      echo ""
      echo "---"
      echo "Sources:"
      echo "$REFERENCES" | while IFS= read -r url; do
        echo "  - $url"
      done
    fi
    ;;
esac
