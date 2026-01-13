#!/bin/bash
# Get Fathom call summary

set -e

OUTPUT="markdown"
RECORDING_ID=""

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
        --json) OUTPUT="json"; shift ;;
        -h|--help)
            echo "Usage: get-summary.sh <recording_id> [options]"
            echo ""
            echo "Options:"
            echo "  --json  Raw JSON output"
            exit 0
            ;;
        *)
            if [ -z "$RECORDING_ID" ]; then
                RECORDING_ID="$1"
            else
                echo "Unknown option: $1"
                exit 1
            fi
            shift
            ;;
    esac
done

if [ -z "$RECORDING_ID" ]; then
    echo "Usage: get-summary.sh <recording_id>"
    echo "Run ./scripts/list-calls.sh to find recording IDs"
    exit 1
fi

API_KEY=$(get_api_key)
if [ -z "$API_KEY" ]; then
    echo "❌ No API key. Run ./scripts/setup.sh first."
    exit 1
fi

# Fetch summary
RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "X-API-Key: $API_KEY" \
    "https://api.fathom.ai/external/v1/recordings/$RECORDING_ID/summary")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "200" ]; then
    if [ "$HTTP_CODE" = "404" ]; then
        echo "❌ Recording $RECORDING_ID not found"
    else
        echo "❌ Error (HTTP $HTTP_CODE)"
        echo "$BODY" | jq -r '.error // .' 2>/dev/null || echo "$BODY"
    fi
    exit 1
fi

# Output
if [ "$OUTPUT" = "json" ]; then
    echo "$BODY" | jq '.'
else
    # Markdown format
    SUMMARY=$(echo "$BODY" | jq -r '.summary // "No summary available"')
    ACTION_ITEMS=$(echo "$BODY" | jq -r '.action_items // []')
    
    echo "# Call Summary"
    echo ""
    echo "$SUMMARY"
    
    if [ "$ACTION_ITEMS" != "[]" ] && [ "$ACTION_ITEMS" != "null" ]; then
        echo ""
        echo "## Action Items"
        echo ""
        echo "$ACTION_ITEMS" | jq -r '.[] | "- \(.)"' 2>/dev/null || echo "$ACTION_ITEMS"
    fi
fi
