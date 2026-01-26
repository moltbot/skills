#!/bin/bash
# Auto-Approver: Monitors tmux session and auto-approves Claude Code prompts

set -uo pipefail

SESSION_NAME="$1"

if [ -z "$SESSION_NAME" ]; then
    echo "Usage: $0 <tmux-session-name>"
    exit 1
fi

echo "[Auto-Approver] Monitoring session: $SESSION_NAME"

while true; do
    # Capture current pane content
    OUTPUT=$(tmux capture-pane -t "$SESSION_NAME" -p 2>/dev/null)
    
    # Check if session still exists
    if [ $? -ne 0 ]; then
        echo "[Auto-Approver] Session ended. Exiting."
        exit 0
    fi
    
    # Look for "Do you trust..." prompt (folder trust)
    if echo "$OUTPUT" | grep -q "Do you trust"; then
        echo "[Auto-Approver] Trust prompt detected! Approving folder trust..."
        # Just press Enter to confirm option 1 (Yes, proceed)
        tmux send-keys -t "$SESSION_NAME" Enter
        sleep 2
    # Look for approval prompt (any "Do you want..." question)
    elif echo "$OUTPUT" | grep -q "Do you want"; then
        echo "[Auto-Approver] Approval prompt detected! Navigating to option 2 and confirming..."
        # Option 2 is typically "Yes, and allow for session/project"
        # Navigate down one option (from 1 to 2) and press Enter
        tmux send-keys -t "$SESSION_NAME" Down Enter
        sleep 2  # Give it time to process
    fi
    
    sleep 1  # Check every second
done
