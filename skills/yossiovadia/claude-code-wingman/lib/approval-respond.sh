#!/bin/bash
# approval-respond.sh - Send an approval response to a Claude Code session
# Usage: approval-respond.sh <session-name> <response>
# Response can be: y, n, always, never, approve, deny

set -e

SESSION_NAME="$1"
RESPONSE="$2"

if [ -z "$SESSION_NAME" ] || [ -z "$RESPONSE" ]; then
    echo "Usage: $0 <session-name> <response>" >&2
    echo "Response options: y, n, always, never, approve, deny" >&2
    exit 1
fi

# Check if session exists
if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo "Error: tmux session '$SESSION_NAME' does not exist" >&2
    exit 1
fi

# Normalize response
case "$RESPONSE" in
    y|yes|approve)
        # For menu-style prompts, select option 1
        tmux send-keys -t "$SESSION_NAME" C-m
        ;;
    n|no|deny)
        # For menu-style prompts, select option 3
        tmux send-keys -t "$SESSION_NAME" Down Down C-m
        ;;
    always|all)
        # For menu-style prompts, select option 2 (allow all)
        tmux send-keys -t "$SESSION_NAME" Down C-m
        ;;
    never)
        # Send 'never' for traditional prompts
        tmux send-keys -t "$SESSION_NAME" "never" C-m
        ;;
    *)
        echo "Error: Invalid response '$RESPONSE'" >&2
        echo "Valid options: y, yes, approve, n, no, deny, always, all, never" >&2
        exit 1
        ;;
esac

echo "✓ Sent approval response to session '$SESSION_NAME': $NORMALIZED"
