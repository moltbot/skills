#!/bin/bash
# master-monitor.sh - Master daemon that monitors all Claude Code sessions
# and sends WhatsApp notifications when approval is needed
#
# Usage: ./master-monitor.sh [--poll-interval SECONDS] [--reminder-interval SECONDS]
#
# Environment variables (optional - reads from ~/.clawdbot/clawdbot.json if not set):
#   CLAWDBOT_PHONE          - Phone number to notify (default: from clawdbot config)
#   CLAWDBOT_WEBHOOK_TOKEN  - Webhook auth token (default: from clawdbot config)

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LIB_DIR="$SCRIPT_DIR/lib"

# Configuration
POLL_INTERVAL="${POLL_INTERVAL:-10}"
REMINDER_INTERVAL="${REMINDER_INTERVAL:-300}"

# File paths
STATE_DIR="/tmp/claude-orchestrator"
LOG_FILE="$STATE_DIR/master-monitor.log"
PID_FILE="$STATE_DIR/master-monitor.pid"
NOTIFY_STATE_DIR="$STATE_DIR/notify-state"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --poll-interval)
            POLL_INTERVAL="$2"
            shift 2
            ;;
        --reminder-interval)
            REMINDER_INTERVAL="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [--poll-interval SECONDS] [--reminder-interval SECONDS]"
            echo ""
            echo "Options:"
            echo "  --poll-interval      How often to check sessions (default: 10)"
            echo "  --reminder-interval  How often to resend notifications (default: 300)"
            echo ""
            echo "Environment variables (optional - reads from ~/.clawdbot/clawdbot.json):"
            echo "  CLAWDBOT_PHONE          Override phone number"
            echo "  CLAWDBOT_WEBHOOK_TOKEN  Override webhook auth token"
            exit 0
            ;;
        *)
            echo "Unknown option: $1" >&2
            exit 1
            ;;
    esac
done

# Ensure state directories exist
mkdir -p "$STATE_DIR" "$NOTIFY_STATE_DIR"

# Logging function
log() {
    local level="$1"
    shift
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $*"
    echo "$msg"
    echo "$msg" >> "$LOG_FILE"
}

# Clean up on exit
cleanup() {
    log "INFO" "Shutting down master monitor..."
    rm -f "$PID_FILE"
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Check for existing instance
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo "Master monitor already running (PID $OLD_PID)" >&2
        echo "Stop it with: kill $OLD_PID" >&2
        exit 1
    fi
    rm -f "$PID_FILE"
fi

# Write PID file
echo $$ > "$PID_FILE"

# Hash function for deduplication
hash_prompt() {
    echo "$1" | md5 2>/dev/null || echo "$1" | md5sum 2>/dev/null | cut -d' ' -f1
}

# Get notification state for a session
get_notify_state() {
    local session="$1"
    local state_file="$NOTIFY_STATE_DIR/$session.state"
    if [ -f "$state_file" ]; then
        cat "$state_file"
    else
        echo "0|0||"
    fi
}

# Set notification state for a session
set_notify_state() {
    local session="$1"
    local timestamp="$2"
    local reminder_count="$3"
    local hash="$4"
    local state_file="$NOTIFY_STATE_DIR/$session.state"
    echo "$timestamp|$reminder_count|$hash" > "$state_file"
}

# Clear notification state for a session
clear_notify_state() {
    local session="$1"
    local state_file="$NOTIFY_STATE_DIR/$session.state"
    rm -f "$state_file"
}

# Send WhatsApp notification
send_notification() {
    local session="$1"
    local details="$2"
    local reminder_count="${3:-0}"

    local reminder_text=""
    if [ "$reminder_count" -gt 0 ]; then
        reminder_text=" (reminder #$reminder_count)"
    fi

    local message="🔒 Session '$session' needs approval$reminder_text

$details

Reply with:
• approve $session - Allow once
• always $session - Allow all similar
• deny $session - Reject"

    log "INFO" "Sending notification for session: $session"

    if "$LIB_DIR/send-notification.sh" "$message" >/dev/null 2>&1; then
        log "INFO" "Notification sent for session: $session"
        return 0
    else
        log "ERROR" "Failed to send notification for session: $session"
        return 1
    fi
}

# Extract approval details from session output
extract_approval_details() {
    local session="$1"
    local output
    output=$(tmux capture-pane -t "$session" -p -S -50 2>/dev/null) || return 1

    local details=""

    if echo "$output" | grep -q "Bash("; then
        details=$(echo "$output" | grep -o "Bash([^)]*)" | tail -1)
    elif echo "$output" | grep -q "Write("; then
        details=$(echo "$output" | grep -o "Write([^)]*)" | tail -1)
    elif echo "$output" | grep -q "Edit("; then
        details=$(echo "$output" | grep -o "Edit([^)]*)" | tail -1)
    elif echo "$output" | grep -q "Read("; then
        details=$(echo "$output" | grep -o "Read([^)]*)" | tail -1)
    fi

    if [ -z "$details" ]; then
        details=$(echo "$output" | grep -E "Do you want|Allow this" | tail -3 | tr '\n' ' ')
    fi

    if [ -z "$details" ]; then
        details="Tool execution approval needed"
    fi

    if [ ${#details} -gt 200 ]; then
        details="${details:0:200}..."
    fi

    echo "$details"
}

# Check if session needs approval
check_session_approval() {
    local session="$1"

    if [ -x "$LIB_DIR/session-status.sh" ]; then
        local status
        status=$("$LIB_DIR/session-status.sh" "$session" --json 2>/dev/null) || return 1
        local session_status
        session_status=$(echo "$status" | jq -r '.status' 2>/dev/null)
        if [ "$session_status" = "waiting_approval" ]; then
            return 0
        fi
        return 1
    fi

    local output
    output=$(tmux capture-pane -t "$session" -p 2>/dev/null) || return 1
    if echo "$output" | grep -qE "Do you want|Allow this|y/n/always"; then
        return 0
    fi
    return 1
}

# Get list of tmux sessions
get_sessions() {
    tmux list-sessions -F "#{session_name}" 2>/dev/null || echo ""
}

# Main monitoring loop
log "INFO" "Starting master monitor daemon"
log "INFO" "Poll interval: ${POLL_INTERVAL}s"
log "INFO" "Reminder interval: ${REMINDER_INTERVAL}s"
log "INFO" "PID: $$"
log "INFO" "Log file: $LOG_FILE"

WAITING_SESSIONS_FILE="$STATE_DIR/waiting-sessions.tmp"

while true; do
    CURRENT_TIME=$(date +%s)
    SESSIONS=$(get_sessions)

    if [ -z "$SESSIONS" ]; then
        sleep "$POLL_INTERVAL"
        continue
    fi

    : > "$WAITING_SESSIONS_FILE"

    while IFS= read -r session; do
        [ -z "$session" ] && continue

        if check_session_approval "$session"; then
            echo "$session" >> "$WAITING_SESSIONS_FILE"

            DETAILS=$(extract_approval_details "$session")
            PROMPT_HASH=$(hash_prompt "$DETAILS")

            STATE=$(get_notify_state "$session")
            LAST_NOTIFIED=$(echo "$STATE" | cut -d'|' -f1)
            REMINDER_COUNT=$(echo "$STATE" | cut -d'|' -f2)
            LAST_HASH=$(echo "$STATE" | cut -d'|' -f3)

            TIME_SINCE_NOTIFY=$((CURRENT_TIME - LAST_NOTIFIED))

            SHOULD_NOTIFY=false
            NEW_REMINDER_COUNT=0

            if [ "$PROMPT_HASH" != "$LAST_HASH" ]; then
                SHOULD_NOTIFY=true
                NEW_REMINDER_COUNT=0
            elif [ "$TIME_SINCE_NOTIFY" -ge "$REMINDER_INTERVAL" ]; then
                SHOULD_NOTIFY=true
                NEW_REMINDER_COUNT=$((REMINDER_COUNT + 1))
            fi

            if [ "$SHOULD_NOTIFY" = true ]; then
                if send_notification "$session" "$DETAILS" "$NEW_REMINDER_COUNT"; then
                    set_notify_state "$session" "$CURRENT_TIME" "$NEW_REMINDER_COUNT" "$PROMPT_HASH"
                fi
            fi
        fi
    done <<< "$SESSIONS"

    # Clean up state for sessions no longer waiting
    if ls "$NOTIFY_STATE_DIR"/*.state >/dev/null 2>&1; then
        for state_file in "$NOTIFY_STATE_DIR"/*.state; do
            [ -f "$state_file" ] || continue
            session=$(basename "$state_file" .state)
            if ! grep -q "^${session}$" "$WAITING_SESSIONS_FILE" 2>/dev/null; then
                log "INFO" "Session '$session' no longer waiting for approval"
                clear_notify_state "$session"
            fi
        done
    fi

    sleep "$POLL_INTERVAL"
done
