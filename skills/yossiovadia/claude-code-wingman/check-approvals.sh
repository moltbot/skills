#!/bin/bash
# Check for pending approval requests and notify

APPROVAL_DIR="/tmp/claude-approvals"

if [ ! -d "$APPROVAL_DIR" ]; then
    exit 0
fi

# Find all pending files
for PENDING in "$APPROVAL_DIR"/*.pending; do
    [ -e "$PENDING" ] || continue
    
    SESSION=$(basename "$PENDING" .pending)
    RESPONSE_FILE="$APPROVAL_DIR/${SESSION}.response"
    
    # Skip if already has response
    [ -f "$RESPONSE_FILE" ] && continue
    
    echo "⚠️ Approval needed for session: $SESSION"
    echo ""
    cat "$PENDING"
    echo ""
    echo "Respond with: ~/code/claude-code-wingman/respond-approval.sh $SESSION <yes|always|no>"
done
