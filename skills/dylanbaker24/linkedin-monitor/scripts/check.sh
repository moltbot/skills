#!/bin/bash
# Main monitoring script for linkedin-monitor
# Fetches messages, compares against state, outputs only NEW messages

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="${HOME}/.clawdbot/linkedin-monitor"
CONFIG_FILE="${CONFIG_DIR}/config.json"
LOG_DIR="${CONFIG_DIR}/logs"
LOG_FILE="${LOG_DIR}/activity.log"

# Source state management
source "${SCRIPT_DIR}/state.sh"

# Ensure directories exist
mkdir -p "${LOG_DIR}"
init_state

# Logging
log() {
    local level="$1"
    shift
    local msg="$*"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    echo "[${timestamp}] [${level}] ${msg}" >> "${LOG_FILE}"
    
    if [ "${DEBUG:-}" = "1" ]; then
        echo "[${level}] ${msg}" >&2
    fi
}

# Parse arguments
DEBUG=0
DRY_RUN=0
while [[ $# -gt 0 ]]; do
    case $1 in
        --debug) DEBUG=1; shift ;;
        --dry-run) DRY_RUN=1; shift ;;
        *) shift ;;
    esac
done

log "INFO" "Starting LinkedIn check"

# 1. Health check - verify auth
log "INFO" "Checking authentication..."
if ! command -v lk &> /dev/null; then
    log "ERROR" "lk CLI not installed"
    echo '{"error": "lk CLI not installed", "action": "install lk: npm install -g lk"}'
    exit 1
fi

if ! lk profile me --json 2>/dev/null | jq -e '.id' &>/dev/null; then
    log "ERROR" "LinkedIn auth expired"
    echo '{"error": "LinkedIn auth expired", "action": "run: lk auth login"}'
    exit 1
fi

log "INFO" "Auth OK"

# 2. Fetch messages
log "INFO" "Fetching messages..."
MESSAGES_RAW=$(lk message list --json 2>/dev/null) || {
    log "ERROR" "Failed to fetch messages"
    echo '{"error": "Failed to fetch messages", "details": "lk message list failed"}'
    exit 1
}

# 3. Parse messages and extract relevant info
# lk message list returns array of conversations
CONVERSATIONS=$(echo "${MESSAGES_RAW}" | jq -c '
    [.[] | {
        id: .conversationId,
        participantName: (.participants[0].firstName + " " + .participants[0].lastName),
        participantId: .participants[0].profileId,
        lastMessage: .lastMessage.text,
        lastMessageTime: .lastMessage.createdAt,
        lastMessageFromMe: .lastMessage.fromMe,
        unread: .unread
    }]
')

log "INFO" "Found $(echo "${CONVERSATIONS}" | jq 'length') conversations"

# 4. Filter to only inbound messages (not from me) that we haven't seen
NEW_MESSAGES="[]"
while IFS= read -r conv; do
    CONV_ID=$(echo "$conv" | jq -r '.id')
    FROM_ME=$(echo "$conv" | jq -r '.lastMessageFromMe')
    
    # Skip if last message is from me
    if [ "$FROM_ME" = "true" ]; then
        continue
    fi
    
    # Skip if we've already seen this conversation ID with this message
    # We use conversationId + lastMessageTime as unique key
    MSG_TIME=$(echo "$conv" | jq -r '.lastMessageTime')
    UNIQUE_KEY="${CONV_ID}_${MSG_TIME}"
    
    if is_seen "$UNIQUE_KEY"; then
        log "DEBUG" "Already seen: ${UNIQUE_KEY}"
        continue
    fi
    
    # This is a new inbound message!
    log "INFO" "New message from: $(echo "$conv" | jq -r '.participantName')"
    NEW_MESSAGES=$(echo "$NEW_MESSAGES" | jq --argjson conv "$conv" '. += [$conv]')
    
    # Mark as seen (unless dry run)
    if [ "$DRY_RUN" = "0" ]; then
        mark_seen "$UNIQUE_KEY"
    fi
    
done < <(echo "${CONVERSATIONS}" | jq -c '.[]')

# 5. Update last check timestamp
if [ "$DRY_RUN" = "0" ]; then
    update_lastcheck
fi

# 6. Output results
NEW_COUNT=$(echo "$NEW_MESSAGES" | jq 'length')
log "INFO" "Check complete. New messages: ${NEW_COUNT}"

if [ "$NEW_COUNT" -eq 0 ]; then
    # No new messages - output nothing (silent)
    log "INFO" "No new messages"
    exit 0
else
    # Output new messages as JSON
    echo "$NEW_MESSAGES" | jq -c '{
        newMessages: .,
        count: (. | length),
        timestamp: now | todate
    }'
fi
