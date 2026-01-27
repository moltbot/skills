#!/bin/bash
# Monitor Session: Watches tmux session for approval prompts and creates alerts
# Part of Claude Code Wingman - https://github.com/yossiovadia/claude-code-orchestrator

set -uo pipefail

# Configuration
POLL_INTERVAL=2              # Check every 2 seconds
REMINDER_INTERVAL=300        # Remind every 5 minutes (300 seconds)

# Parse arguments
SESSION_NAME="${1:-}"

if [ -z "$SESSION_NAME" ]; then
    echo "Usage: $0 <tmux-session-name>"
    echo ""
    echo "Monitors a tmux session for approval prompts and writes alerts to:"
    echo "  /tmp/claude-monitor-{session}.alert"
    exit 1
fi

# File paths
ALERT_FILE="/tmp/claude-monitor-${SESSION_NAME}.alert"
LOG_FILE="/tmp/claude-monitor-${SESSION_NAME}.log"

# State tracking
LAST_ALERT_TIME=0
CURRENT_PROMPT_HASH=""

# Logging function
log() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [Monitor] $1"
    echo "$msg"
    echo "$msg" >> "$LOG_FILE"
}

# Clean up on exit
cleanup() {
    log "Cleaning up..."
    rm -f "$ALERT_FILE"
    log "Monitor stopped."
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Generate hash for prompt content to detect changes
hash_prompt() {
    echo "$1" | md5 2>/dev/null || echo "$1" | md5sum 2>/dev/null | cut -d' ' -f1
}

# Write alert file in JSON format
write_alert() {
    local prompt_type="$1"
    local prompt_content="$2"
    local timestamp
    timestamp=$(date -u '+%Y-%m-%dT%H:%M:%SZ')

    # Escape special characters for JSON
    local escaped_content
    escaped_content=$(echo "$prompt_content" | sed 's/\\/\\\\/g; s/"/\\"/g; s/	/\\t/g' | tr '\n' ' ')

    cat > "$ALERT_FILE" << EOF
{
  "session": "$SESSION_NAME",
  "timestamp": "$timestamp",
  "type": "$prompt_type",
  "prompt": "$escaped_content",
  "options": {
    "1": "yes",
    "2": "always",
    "3": "no"
  },
  "reminder_count": $REMINDER_COUNT
}
EOF

    log "Alert written to $ALERT_FILE (reminder #$REMINDER_COUNT)"
}

# Detect approval prompt patterns
detect_approval_prompt() {
    local output="$1"

    # Pattern 1: "Do you want" prompts (tool calls, file access, etc.)
    if echo "$output" | grep -q "Do you want"; then
        echo "tool_approval"
        return 0
    fi

    # Pattern 2: "Allow this" prompts
    if echo "$output" | grep -q -i "allow this"; then
        echo "permission"
        return 0
    fi

    # Pattern 3: y/n/always pattern
    if echo "$output" | grep -q -E "\[y/n/always\]|\(y/n/always\)"; then
        echo "confirmation"
        return 0
    fi

    # Pattern 4: "Approve" prompts
    if echo "$output" | grep -q -i "approve"; then
        echo "approval"
        return 0
    fi

    # Pattern 5: Numbered options with Yes/No
    if echo "$output" | grep -q -E "^\s*[123]\.\s*(Yes|No|Allow)"; then
        echo "numbered_choice"
        return 0
    fi

    echo ""
    return 1
}

# Extract the relevant prompt content
extract_prompt_content() {
    local output="$1"

    # Get last 30 lines which typically contain the prompt
    echo "$output" | tail -30
}

# Main monitoring loop
log "Starting monitor for session: $SESSION_NAME"
log "Poll interval: ${POLL_INTERVAL}s"
log "Reminder interval: ${REMINDER_INTERVAL}s"
log "Alert file: $ALERT_FILE"

REMINDER_COUNT=0

while true; do
    # Capture current pane content
    OUTPUT=$(tmux capture-pane -t "$SESSION_NAME" -p -S -100 2>/dev/null)

    # Check if session still exists
    if [ $? -ne 0 ] || ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
        log "Session '$SESSION_NAME' ended. Exiting."
        break
    fi

    # Check for approval prompts
    PROMPT_TYPE=$(detect_approval_prompt "$OUTPUT")

    if [ -n "$PROMPT_TYPE" ]; then
        # Extract prompt content
        PROMPT_CONTENT=$(extract_prompt_content "$OUTPUT")
        NEW_PROMPT_HASH=$(hash_prompt "$PROMPT_CONTENT")

        CURRENT_TIME=$(date +%s)
        TIME_SINCE_ALERT=$((CURRENT_TIME - LAST_ALERT_TIME))

        # Check if this is a new prompt or if it's time for a reminder
        if [ "$NEW_PROMPT_HASH" != "$CURRENT_PROMPT_HASH" ]; then
            # New prompt detected
            CURRENT_PROMPT_HASH="$NEW_PROMPT_HASH"
            REMINDER_COUNT=0
            LAST_ALERT_TIME=$CURRENT_TIME
            log "New $PROMPT_TYPE prompt detected!"
            write_alert "$PROMPT_TYPE" "$PROMPT_CONTENT"
        elif [ $TIME_SINCE_ALERT -ge $REMINDER_INTERVAL ]; then
            # Same prompt, time for reminder
            REMINDER_COUNT=$((REMINDER_COUNT + 1))
            LAST_ALERT_TIME=$CURRENT_TIME
            log "Reminder #$REMINDER_COUNT for pending $PROMPT_TYPE prompt"
            write_alert "$PROMPT_TYPE" "$PROMPT_CONTENT"
        fi
    else
        # No prompt detected, clean up alert file if it exists
        if [ -f "$ALERT_FILE" ]; then
            log "Prompt resolved, removing alert file"
            rm -f "$ALERT_FILE"
            CURRENT_PROMPT_HASH=""
            REMINDER_COUNT=0
        fi
    fi

    sleep "$POLL_INTERVAL"
done
