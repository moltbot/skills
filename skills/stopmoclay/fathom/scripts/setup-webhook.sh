#!/bin/bash
# Register a Fathom webhook

set -e

WEBHOOK_URL=""
INCLUDE_TRANSCRIPT=true
INCLUDE_SUMMARY=true
INCLUDE_ACTION_ITEMS=true

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
        --url) WEBHOOK_URL="$2"; shift 2 ;;
        --no-transcript) INCLUDE_TRANSCRIPT=false; shift ;;
        --no-summary) INCLUDE_SUMMARY=false; shift ;;
        --no-action-items) INCLUDE_ACTION_ITEMS=false; shift ;;
        -h|--help)
            echo "Usage: setup-webhook.sh --url <https://...> [options]"
            echo ""
            echo "Options:"
            echo "  --url URL           Webhook endpoint (required, must be HTTPS)"
            echo "  --no-transcript     Don't include transcript"
            echo "  --no-summary        Don't include summary"
            echo "  --no-action-items   Don't include action items"
            echo ""
            echo "Requirements:"
            echo "  - URL must be publicly accessible HTTPS endpoint"
            echo "  - Endpoint should accept POST requests with JSON body"
            exit 0
            ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

if [ -z "$WEBHOOK_URL" ]; then
    echo "❌ Webhook URL required"
    echo "Usage: setup-webhook.sh --url https://your-domain.com/webhook"
    exit 1
fi

if [[ ! "$WEBHOOK_URL" =~ ^https:// ]]; then
    echo "❌ Webhook URL must be HTTPS"
    exit 1
fi

API_KEY=$(get_api_key)
if [ -z "$API_KEY" ]; then
    echo "❌ No API key. Run ./scripts/setup.sh first."
    exit 1
fi

echo "📡 Registering webhook..."
echo "   URL: $WEBHOOK_URL"
echo "   Include transcript: $INCLUDE_TRANSCRIPT"
echo "   Include summary: $INCLUDE_SUMMARY"
echo "   Include action items: $INCLUDE_ACTION_ITEMS"
echo ""

# Register webhook
RESPONSE=$(curl -s -X POST "https://api.fathom.ai/external/v1/webhooks" \
    -H "X-API-Key: $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
        \"destination_url\": \"$WEBHOOK_URL\",
        \"include_transcript\": $INCLUDE_TRANSCRIPT,
        \"include_summary\": $INCLUDE_SUMMARY,
        \"include_action_items\": $INCLUDE_ACTION_ITEMS,
        \"triggered_for\": [\"my_recordings\", \"shared_external_recordings\", \"my_shared_with_team_recordings\", \"shared_team_recordings\"]
    }")

# Check response
if echo "$RESPONSE" | jq -e '.id' >/dev/null 2>&1; then
    WEBHOOK_ID=$(echo "$RESPONSE" | jq -r '.id')
    WEBHOOK_SECRET=$(echo "$RESPONSE" | jq -r '.secret')
    
    echo "✅ Webhook registered!"
    echo ""
    echo "Webhook ID: $WEBHOOK_ID"
    echo "Secret: $WEBHOOK_SECRET"
    echo ""
    echo "Save these! The secret is used to verify webhook signatures."
    echo ""
    echo "To delete this webhook later:"
    echo "  curl -X DELETE -H \"X-API-Key: \$API_KEY\" \\"
    echo "    \"https://api.fathom.ai/external/v1/webhooks/$WEBHOOK_ID\""
else
    echo "❌ Failed to register webhook"
    echo "$RESPONSE" | jq -r '.error // .' 2>/dev/null || echo "$RESPONSE"
    exit 1
fi
