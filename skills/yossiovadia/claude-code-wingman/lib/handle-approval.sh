#!/bin/bash
# handle-approval.sh - Handle approval commands from WhatsApp
# Usage: handle-approval.sh <action> <session-name>
# Actions: approve, always, deny

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ACTION="$1"
SESSION="$2"

if [ -z "$ACTION" ] || [ -z "$SESSION" ]; then
    echo "Usage: $0 <approve|always|deny> <session-name>" >&2
    exit 1
fi

# Normalize action
case "$ACTION" in
    approve|yes|y|1)
        RESPONSE="y"
        ACTION_DESC="approved (once)"
        ;;
    always|all|2)
        RESPONSE="always"
        ACTION_DESC="approved (always)"
        ;;
    deny|no|n|reject|3)
        RESPONSE="n"
        ACTION_DESC="denied"
        ;;
    *)
        echo "Error: Unknown action '$ACTION'" >&2
        echo "Valid actions: approve, always, deny" >&2
        exit 1
        ;;
esac

# Check if session exists
if ! tmux has-session -t "$SESSION" 2>/dev/null; then
    echo "Error: Session '$SESSION' not found" >&2
    echo "Active sessions:"
    tmux ls 2>/dev/null || echo "  (none)"
    exit 1
fi

# Send the response
"$SCRIPT_DIR/approval-respond.sh" "$SESSION" "$RESPONSE"

echo "✓ Session '$SESSION' $ACTION_DESC"
