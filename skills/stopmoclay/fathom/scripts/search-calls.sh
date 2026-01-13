#!/bin/bash
# Search Fathom calls by various criteria

set -e

QUERY=""
SPEAKER=""
AFTER=""
BEFORE=""
LIMIT=20
OUTPUT="table"

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
        --speaker) SPEAKER="$2"; shift 2 ;;
        --after) AFTER="$2"; shift 2 ;;
        --before) BEFORE="$2"; shift 2 ;;
        --limit) LIMIT="$2"; shift 2 ;;
        --json) OUTPUT="json"; shift ;;
        -h|--help)
            echo "Usage: search-calls.sh [query] [options]"
            echo ""
            echo "Options:"
            echo "  --speaker NAME  Filter by speaker name"
            echo "  --after DATE    Calls after date"
            echo "  --before DATE   Calls before date"
            echo "  --limit N       Max results (default: 20)"
            echo "  --json          Raw JSON output"
            exit 0
            ;;
        *)
            if [ -z "$QUERY" ]; then
                QUERY="$1"
            fi
            shift
            ;;
    esac
done

API_KEY=$(get_api_key)
if [ -z "$API_KEY" ]; then
    echo "❌ No API key. Run ./scripts/setup.sh first."
    exit 1
fi

# Build URL
URL="https://api.fathom.ai/external/v1/meetings?limit=$LIMIT"
[ -n "$AFTER" ] && URL="$URL&created_after=${AFTER}T00:00:00Z"
[ -n "$BEFORE" ] && URL="$URL&created_before=${BEFORE}T23:59:59Z"

# Fetch meetings
RESPONSE=$(curl -s -H "X-API-Key: $API_KEY" "$URL")

# Check for errors
if echo "$RESPONSE" | jq -e '.error' >/dev/null 2>&1; then
    echo "❌ Error: $(echo "$RESPONSE" | jq -r '.error')"
    exit 1
fi

# Filter results if query provided
if [ -n "$QUERY" ] || [ -n "$SPEAKER" ]; then
    FILTERED=$(echo "$RESPONSE" | jq --arg q "${QUERY,,}" --arg s "${SPEAKER,,}" '
        .items | map(select(
            (if $q != "" then (.title | ascii_downcase | contains($q)) else true end) and
            (if $s != "" then (.recorded_by.name | ascii_downcase | contains($s)) or 
                (.calendar_invitees[]?.name | ascii_downcase | contains($s)) else true end)
        ))
    ')
else
    FILTERED=$(echo "$RESPONSE" | jq '.items')
fi

# Output
if [ "$OUTPUT" = "json" ]; then
    echo "$FILTERED"
else
    COUNT=$(echo "$FILTERED" | jq 'length')
    
    if [ "$COUNT" = "0" ]; then
        echo "No calls found matching criteria."
        exit 0
    fi
    
    echo "Found $COUNT call(s):"
    echo ""
    printf "%-12s | %-40s | %-12s | %s\n" "RECORDING ID" "TITLE" "DATE" "RECORDED BY"
    printf "%s\n" "-------------|------------------------------------------|--------------|-------------"
    
    echo "$FILTERED" | jq -r '.[] | [
        (.recording_id | tostring),
        (.title // "Untitled" | .[0:38]),
        (.created_at | split("T")[0]),
        (.recorded_by.name // "Unknown")
    ] | @tsv' | while IFS=$'\t' read -r id title date recorder; do
        printf "%-12s | %-40s | %-12s | %s\n" "$id" "$title" "$date" "$recorder"
    done
fi
