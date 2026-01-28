#!/bin/bash
# SuperMemory - Search Memories Script
# Usage: search.sh "search query"

set -e

QUERY="$1"

if [ -z "$QUERY" ]; then
    echo "Error: No search query provided"
    echo "Usage: search.sh \"search query\""
    exit 1
fi

API_KEY="${SUPERMEMORY_API_KEY}"
if [ -z "$API_KEY" ]; then
    echo "Error: SUPERMEMORY_API_KEY environment variable not set"
    echo "Please set it with: export SUPERMEMORY_API_KEY=\"your-api-key\""
    exit 1
fi

# SuperMemory API search endpoint
API_URL="https://api.supermemory.ai/v3/search"

# Prepare the request
DATA=$(cat <<EOF
{
    "q": "$QUERY",
    "limit": 10
}
EOF
)

# Make the API request
RESPONSE=$(curl -s -X POST "$API_URL" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "$DATA")

# Check for errors
if echo "$RESPONSE" | grep -q "error"; then
    echo "Error searching memories: $RESPONSE"
    exit 1
fi

# Parse and display results
echo "Search results for \"$QUERY\":"
echo "---"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
