#!/bin/bash
# List Fathom calls with filters

set -e

# Defaults
LIMIT=10
OUTPUT="table"
AFTER=""
BEFORE=""
CURSOR=""

# Get API key
get_api_key() {
    if [ -n "$FATHOM_API_KEY" ]; then
        echo "$FATHOM_API_KEY"
    elif [ -f ~/.fathom_api_key ]; then
        cat ~/.fathom_api_key
    else
        echo ""
    fi
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --limit) LIMIT="$2"; shift 2 ;;
        --after) AFTER="$2"; shift 2 ;;
        --before) BEFORE="$2"; shift 2 ;;
        --cursor) CURSOR="$2"; shift 2 ;;
        --json) OUTPUT="json"; shift ;;
        --table) OUTPUT="table"; shift ;;
        -h|--help)
            echo "Usage: list-calls.sh [options]"
            echo ""
            echo "Options:"
            echo "  --limit N      Number of results (default: 10)"
            echo "  --after DATE   Calls after date (YYYY-MM-DD)"
            echo "  --before DATE  Calls before date (YYYY-MM-DD)"
            echo "  --cursor TOKEN Pagination cursor"
            echo "  --json         Raw JSON output"
            echo "  --table        Formatted table (default)"
            exit 0
            ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

API_KEY=$(get_api_key)
if [ -z "$API_KEY" ]; then
    echo "❌ No API key. Run ./scripts/setup.sh first."
    exit 1
fi

# Build URL with query params
URL="https://api.fathom.ai/external/v1/meetings?limit=$LIMIT"
[ -n "$AFTER" ] && URL="$URL&created_after=${AFTER}T00:00:00Z"
[ -n "$BEFORE" ] && URL="$URL&created_before=${BEFORE}T23:59:59Z"
[ -n "$CURSOR" ] && URL="$URL&cursor=$CURSOR"

# Fetch
RESPONSE=$(curl -s -H "X-API-Key: $API_KEY" "$URL")

# Check for errors
if echo "$RESPONSE" | jq -e '.error' >/dev/null 2>&1; then
    echo "❌ Error: $(echo "$RESPONSE" | jq -r '.error')"
    exit 1
fi

# Output
if [ "$OUTPUT" = "json" ]; then
    echo "$RESPONSE" | jq '.items'
else
    # Table format
    echo ""
    printf "%-12s | %-40s | %-20s | %s\n" "RECORDING ID" "TITLE" "DATE" "RECORDED BY"
    printf "%s\n" "-------------|------------------------------------------|----------------------|-------------"
    
    echo "$RESPONSE" | jq -r '.items[] | [
        (.recording_id | tostring),
        (.title // "Untitled" | .[0:38]),
        (.created_at | split("T")[0]),
        (.recorded_by.name // "Unknown")
    ] | @tsv' | while IFS=$'\t' read -r id title date recorder; do
        printf "%-12s | %-40s | %-20s | %s\n" "$id" "$title" "$date" "$recorder"
    done
    
    # Pagination info
    NEXT=$(echo "$RESPONSE" | jq -r '.next_cursor // empty')
    if [ -n "$NEXT" ]; then
        echo ""
        echo "More results available. Use: --cursor \"$NEXT\""
    fi
fi
