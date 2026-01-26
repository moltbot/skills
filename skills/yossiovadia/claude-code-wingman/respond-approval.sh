#!/bin/bash
# Respond to a pending approval request

SESSION="$1"
RESPONSE="$2"

if [ -z "$SESSION" ] || [ -z "$RESPONSE" ]; then
    echo "Usage: $0 <session-name> <yes|always|no>"
    exit 1
fi

APPROVAL_DIR="/tmp/claude-approvals"
RESPONSE_FILE="$APPROVAL_DIR/${SESSION}.response"

echo "$RESPONSE" > "$RESPONSE_FILE"
echo "✅ Response recorded: $RESPONSE"
echo "Interactive approver will act on it within 1-2 seconds."
