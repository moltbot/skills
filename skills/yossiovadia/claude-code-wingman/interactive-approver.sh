#!/bin/bash
# Interactive Approver: Detects prompts and notifies user for approval

set -uo pipefail

SESSION_NAME="$1"
APPROVAL_DIR="/tmp/claude-approvals"

if [ -z "$SESSION_NAME" ]; then
    echo "Usage: $0 <tmux-session-name>"
    exit 1
fi

mkdir -p "$APPROVAL_DIR"
PENDING_FILE="$APPROVAL_DIR/${SESSION_NAME}.pending"
RESPONSE_FILE="$APPROVAL_DIR/${SESSION_NAME}.response"

echo "[Interactive-Approver] Monitoring session: $SESSION_NAME"
echo "[Interactive-Approver] Approval dir: $APPROVAL_DIR"

while true; do
    # Capture current pane content
    OUTPUT=$(tmux capture-pane -t "$SESSION_NAME" -p 2>/dev/null)
    
    # Check if session still exists
    if [ $? -ne 0 ]; then
        echo "[Interactive-Approver] Session ended. Exiting."
        rm -f "$PENDING_FILE" "$RESPONSE_FILE"
        exit 0
    fi
    
    # Look for "Do you trust..." prompt (folder trust)
    if echo "$OUTPUT" | grep -q "Do you trust"; then
        # Auto-approve trust prompts (one-time, safe)
        echo "[Interactive-Approver] Trust prompt detected, auto-approving..."
        tmux send-keys -t "$SESSION_NAME" Enter
        sleep 2
        continue
    fi
    
    # Look for approval prompt (any "Do you want..." question)
    if echo "$OUTPUT" | grep -q "Do you want"; then
        # Check if already waiting for response
        if [ -f "$PENDING_FILE" ]; then
            # Check for user response
            if [ -f "$RESPONSE_FILE" ]; then
                RESPONSE=$(cat "$RESPONSE_FILE")
                echo "[Interactive-Approver] User responded: $RESPONSE"
                
                case "$RESPONSE" in
                    yes|1)
                        echo "[Interactive-Approver] Approving (option 1)..."
                        tmux send-keys -t "$SESSION_NAME" Enter
                        ;;
                    always|2)
                        echo "[Interactive-Approver] Approving always (option 2)..."
                        tmux send-keys -t "$SESSION_NAME" Down Enter
                        ;;
                    no|3)
                        echo "[Interactive-Approver] Declining..."
                        tmux send-keys -t "$SESSION_NAME" Down Down Enter
                        ;;
                    *)
                        echo "[Interactive-Approver] Unknown response, defaulting to decline"
                        tmux send-keys -t "$SESSION_NAME" Down Down Enter
                        ;;
                esac
                
                rm -f "$PENDING_FILE" "$RESPONSE_FILE"
                sleep 2
            fi
        else
            # New prompt detected, notify user
            echo "[Interactive-Approver] Approval prompt detected! Waiting for user decision..."
            
            # Extract the prompt question
            QUESTION=$(echo "$OUTPUT" | grep -A 10 "Do you want" | head -20)
            
            # Write to pending file
            cat > "$PENDING_FILE" << EOF
Session: $SESSION_NAME
Timestamp: $(date)

Prompt:
$QUESTION

To respond, write one of these to: $RESPONSE_FILE
  yes     - Approve this once (option 1)
  always  - Approve and don't ask again for this project (option 2)
  no      - Decline (option 3)
EOF
            
            echo "[Interactive-Approver] Pending approval written to: $PENDING_FILE"
        fi
    fi
    
    sleep 1  # Check every second
done
