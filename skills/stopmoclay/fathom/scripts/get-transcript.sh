#!/bin/bash
# Get Fathom call transcript

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
        --text-only) OUTPUT="text"; shift ;;
        -h|--help)
            echo "Usage: get-transcript.sh <recording_id> [options]"
            echo ""
            echo "Options:"
            echo "  --json       Raw JSON output"
            echo "  --text-only  Plain text without speakers"
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
    echo "Usage: get-transcript.sh <recording_id>"
    echo "Run ./scripts/list-calls.sh to find recording IDs"
    exit 1
fi

API_KEY=$(get_api_key)
if [ -z "$API_KEY" ]; then
    echo "❌ No API key. Run ./scripts/setup.sh first."
    exit 1
fi

# Fetch transcript
RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "X-API-Key: $API_KEY" \
    "https://api.fathom.ai/external/v1/recordings/$RECORDING_ID/transcript")

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
case $OUTPUT in
    json)
        echo "$BODY" | jq '.'
        ;;
    text)
        echo "$BODY" | jq -r '.transcript[].text' | tr '\n' ' ' | fold -s -w 80
        echo ""
        ;;
    markdown)
        echo "# Transcript"
        echo ""
        echo "$BODY" | jq -r '.transcript[] | "**\(.speaker.display_name // "Unknown")** (\(.timestamp // "")):\n\(.text)\n"'
        ;;
esac
