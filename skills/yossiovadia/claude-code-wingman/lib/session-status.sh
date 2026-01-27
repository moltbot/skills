#!/bin/bash
# session-status.sh - Get the current status of a Claude Code session
# Usage: session-status.sh <session-name> [--json]
#        session-status.sh --all [--json]

set -e

SESSION_NAME="$1"
JSON_OUTPUT=false
CHECK_ALL=false

# Parse arguments
for arg in "$@"; do
    if [ "$arg" = "--json" ]; then
        JSON_OUTPUT=true
    elif [ "$arg" = "--all" ]; then
        CHECK_ALL=true
    fi
done

# If --all flag, check all tmux sessions
if [ "$CHECK_ALL" = true ]; then
    # Get all tmux sessions
    ALL_SESSIONS=$(tmux list-sessions -F "#{session_name}" 2>/dev/null || echo "")

    if [ -z "$ALL_SESSIONS" ]; then
        if [ "$JSON_OUTPUT" = true ]; then
            echo '[]'
        else
            echo "No tmux sessions found"
        fi
        exit 0
    fi

    # Check each session and build JSON array
    if [ "$JSON_OUTPUT" = true ]; then
        echo "["
        FIRST=true
        while IFS= read -r session; do
            if [ "$FIRST" = false ]; then
                echo ","
            fi
            FIRST=false
            "$0" "$session" --json | tr -d '\n'
        done <<< "$ALL_SESSIONS"
        echo ""
        echo "]"
    else
        while IFS= read -r session; do
            "$0" "$session" --json | jq -r '"Session: \(.session)\nStatus: \(.status)\nDetails: \(.details)\n"'
        done <<< "$ALL_SESSIONS"
    fi
    exit 0
fi

# Single session mode
if [ -z "$SESSION_NAME" ]; then
    echo "Usage: $0 <session-name> [--json]" >&2
    echo "       $0 --all [--json]" >&2
    exit 1
fi

# Check if session exists
if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    if [ "$JSON_OUTPUT" = true ]; then
        echo '{"status":"not_found","session":"'$SESSION_NAME'"}'
    else
        echo "Error: tmux session '$SESSION_NAME' does not exist" >&2
    fi
    exit 1
fi

# Capture recent output from the session
OUTPUT=$(tmux capture-pane -t "$SESSION_NAME" -p | tail -20)

# Detect state
STATUS="unknown"
DETAILS=""

if echo "$OUTPUT" | grep -qE "Allow this tool call|y/n/always|Do you want to|❯ 1\. Yes"; then
    STATUS="waiting_approval"
    # Try to extract what's being approved
    DETAILS=$(echo "$OUTPUT" | grep -E "Create file|Write\(|Edit\(|Bash\(" | head -1 || echo "Approval needed")
elif echo "$OUTPUT" | grep -q "❯"; then
    STATUS="idle"
    DETAILS="Ready for input"
elif echo "$OUTPUT" | grep -qE "Error:|Failed:|Exception:"; then
    STATUS="error"
    DETAILS=$(echo "$OUTPUT" | grep -E "Error:|Failed:|Exception:" | tail -1 || echo "")
elif echo "$OUTPUT" | grep -qE "Reading|Writing|Executing|Running"; then
    STATUS="working"
    DETAILS=$(echo "$OUTPUT" | tail -3 | head -1 || echo "")
else
    STATUS="unknown"
    DETAILS="Unable to determine state"
fi

# Output
if [ "$JSON_OUTPUT" = true ]; then
    echo "{\"session\":\"$SESSION_NAME\",\"status\":\"$STATUS\",\"details\":$(echo "$DETAILS" | jq -Rs .)}"
else
    echo "Session: $SESSION_NAME"
    echo "Status: $STATUS"
    if [ -n "$DETAILS" ]; then
        echo "Details: $DETAILS"
    fi
fi
