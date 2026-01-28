#!/bin/bash
# SuperMemory - Add Memory Script
# Usage: add-memory.sh "content" "description (optional)"

set -e

CONTENT="$1"
DESCRIPTION="$2"

if [ -z "$CONTENT" ]; then
    echo "Error: No content provided"
    echo "Usage: add-memory.sh \"content\" \"description (optional)\""
    exit 1
fi

API_KEY="${SUPERMEMORY_API_KEY}"
if [ -z "$API_KEY" ]; then
    echo "Error: SUPERMEMORY_API_KEY environment variable not set"
    echo "Please set it with: export SUPERMEMORY_API_KEY=\"your-api-key\""
    exit 1
fi

# Sanitize description: replace spaces with hyphens, keep only alphanumeric, hyphens, underscores
SANITIZED_DESC=$(echo "${DESCRIPTION:-clawdbot}" | tr -cd '[:alnum:]-_' | tr '[:upper:]' '[:lower:]')

# SuperMemory API endpoint (using the direct API)
API_URL="https://api.supermemory.ai/v3/documents"

# Prepare the request
DATA=$(cat <<EOF
{
    "content": "$CONTENT",
    "customId": "memory_$(date +%s)",
    "containerTags": ["$SANITIZED_DESC"]
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
    echo "Error adding memory: $RESPONSE"
    exit 1
fi

# Success - extract the memory ID if available
MEMORY_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$MEMORY_ID" ]; then
    echo "✓ Memory added successfully (ID: $MEMORY_ID)"
else
    echo "✓ Memory added successfully"
fi

echo "$RESPONSE"
