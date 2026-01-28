#!/bin/bash
# SuperMemory - Chat with Memories Script
# Usage: chat.sh "question"
# Note: Uses search to retrieve relevant memories and presents them

set -e

QUESTION="$1"

if [ -z "$QUESTION" ]; then
    echo "Error: No question provided"
    echo "Usage: chat.sh \"question\""
    exit 1
fi

API_KEY="${SUPERMEMORY_API_KEY}"
if [ -z "$API_KEY" ]; then
    echo "Error: SUPERMEMORY_API_KEY environment variable not set"
    echo "Please set it with: export SUPERMEMORY_API_KEY=\"your-api-key\""
    exit 1
fi

# SuperMemory API search endpoint (used for chat-like queries)
API_URL="https://api.supermemory.ai/v3/search"

# Prepare the request
DATA=$(cat <<EOF
{
    "q": "$QUESTION",
    "limit": 5
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
    echo "Error querying memories: $RESPONSE"
    exit 1
fi

# Parse and display results in a chat-like format
echo "Based on your memories:"
echo "---"

# Extract and display the relevant chunks
echo "$RESPONSE" | python3 -c "
import sys, json

data = json.load(sys.stdin)
results = data.get('results', [])

if not results:
    print('No relevant memories found.')
else:
    for i, result in enumerate(results, 1):
        chunks = result.get('chunks', [])
        for chunk in chunks:
            content = chunk.get('content', '')
            score = chunk.get('score', 0)
            if content:
                print(f'{i}. {content}')
                print(f'   (relevance: {score:.2f})')
                print()
" 2>/dev/null || echo "$RESPONSE"
