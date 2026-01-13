#!/bin/bash
# Fathom API Setup - Validate and test connection

set -e

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

API_KEY=$(get_api_key)

if [ -z "$API_KEY" ]; then
    echo "❌ No API key found!"
    echo ""
    echo "Setup instructions:"
    echo "  1. Get your API key from https://developers.fathom.ai"
    echo "  2. Save it:"
    echo "     echo 'YOUR_KEY' > ~/.fathom_api_key"
    echo "     chmod 600 ~/.fathom_api_key"
    echo ""
    echo "  Or set environment variable:"
    echo "     export FATHOM_API_KEY='YOUR_KEY'"
    exit 1
fi

echo "🔑 API key found"
echo "🔗 Testing connection..."

RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "X-API-Key: $API_KEY" \
    "https://api.fathom.ai/external/v1/meetings?limit=1")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Connection successful!"
    
    # Show account info
    CALL_COUNT=$(echo "$BODY" | jq -r '.items | length')
    if [ "$CALL_COUNT" -gt 0 ]; then
        LATEST=$(echo "$BODY" | jq -r '.items[0].title')
        echo "📞 Latest call: $LATEST"
    fi
    echo ""
    echo "You're all set! Try:"
    echo "  ./scripts/list-calls.sh"
elif [ "$HTTP_CODE" = "401" ]; then
    echo "❌ Invalid API key"
    echo "Check your key at https://developers.fathom.ai"
    exit 1
else
    echo "❌ Connection failed (HTTP $HTTP_CODE)"
    echo "$BODY" | jq -r '.error // .message // .' 2>/dev/null || echo "$BODY"
    exit 1
fi
