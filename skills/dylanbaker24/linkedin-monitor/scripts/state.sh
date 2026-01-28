#!/bin/bash
# State management utilities for linkedin-monitor
# Handles reading/writing state to ensure no duplicate notifications

STATE_DIR="${HOME}/.clawdbot/linkedin-monitor/state"
MESSAGES_FILE="${STATE_DIR}/messages.json"
LASTRUN_FILE="${STATE_DIR}/lastrun.txt"
DRAFTS_FILE="${STATE_DIR}/drafts.json"

# Ensure state directory exists
init_state() {
    mkdir -p "${STATE_DIR}"
    
    # Initialize messages.json if not exists
    if [ ! -f "${MESSAGES_FILE}" ]; then
        echo '{"seenIds":[],"lastCheck":""}' > "${MESSAGES_FILE}"
    fi
    
    # Initialize drafts.json if not exists
    if [ ! -f "${DRAFTS_FILE}" ]; then
        echo '{"drafts":[]}' > "${DRAFTS_FILE}"
    fi
}

# Get list of seen message IDs
get_seen_ids() {
    init_state
    jq -r '.seenIds[]' "${MESSAGES_FILE}" 2>/dev/null || echo ""
}

# Check if a message ID has been seen
is_seen() {
    local id="$1"
    init_state
    jq -e --arg id "$id" '.seenIds | index($id) != null' "${MESSAGES_FILE}" >/dev/null 2>&1
}

# Mark a message ID as seen
mark_seen() {
    local id="$1"
    init_state
    
    # Add ID if not already present
    if ! is_seen "$id"; then
        local tmp=$(mktemp)
        jq --arg id "$id" '.seenIds += [$id]' "${MESSAGES_FILE}" > "$tmp" && mv "$tmp" "${MESSAGES_FILE}"
    fi
}

# Mark multiple IDs as seen
mark_seen_batch() {
    init_state
    local tmp=$(mktemp)
    
    # Read IDs from stdin (one per line)
    local ids="[]"
    while read -r id; do
        [ -n "$id" ] && ids=$(echo "$ids" | jq --arg id "$id" '. += [$id]')
    done
    
    # Merge with existing
    jq --argjson new "$ids" '.seenIds = (.seenIds + $new | unique)' "${MESSAGES_FILE}" > "$tmp" && mv "$tmp" "${MESSAGES_FILE}"
}

# Update last check timestamp
update_lastcheck() {
    init_state
    local now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local tmp=$(mktemp)
    jq --arg now "$now" '.lastCheck = $now' "${MESSAGES_FILE}" > "$tmp" && mv "$tmp" "${MESSAGES_FILE}"
    echo "$now" > "${LASTRUN_FILE}"
}

# Get last check timestamp
get_lastcheck() {
    init_state
    jq -r '.lastCheck // ""' "${MESSAGES_FILE}"
}

# Save a draft reply
save_draft() {
    local name="$1"
    local message="$2"
    local draft_text="$3"
    local conversation_id="$4"
    
    init_state
    local tmp=$(mktemp)
    local now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    jq --arg name "$name" \
       --arg message "$message" \
       --arg draft "$draft_text" \
       --arg conv_id "$conversation_id" \
       --arg created "$now" \
       '.drafts += [{
           "name": $name,
           "inboundMessage": $message,
           "draftReply": $draft,
           "conversationId": $conv_id,
           "createdAt": $created,
           "status": "pending"
       }]' "${DRAFTS_FILE}" > "$tmp" && mv "$tmp" "${DRAFTS_FILE}"
}

# Get pending drafts
get_drafts() {
    init_state
    jq '.drafts | map(select(.status == "pending"))' "${DRAFTS_FILE}"
}

# Get draft by name
get_draft() {
    local name="$1"
    init_state
    jq --arg name "$name" '.drafts | map(select(.name == $name and .status == "pending")) | .[0]' "${DRAFTS_FILE}"
}

# Mark draft as sent
mark_draft_sent() {
    local name="$1"
    init_state
    local tmp=$(mktemp)
    jq --arg name "$name" '(.drafts[] | select(.name == $name and .status == "pending")).status = "sent"' "${DRAFTS_FILE}" > "$tmp" && mv "$tmp" "${DRAFTS_FILE}"
}

# Mark draft as skipped
mark_draft_skipped() {
    local name="$1"
    init_state
    local tmp=$(mktemp)
    jq --arg name "$name" '(.drafts[] | select(.name == $name and .status == "pending")).status = "skipped"' "${DRAFTS_FILE}" > "$tmp" && mv "$tmp" "${DRAFTS_FILE}"
}

# Reset all state (fresh start)
reset_state() {
    rm -f "${MESSAGES_FILE}" "${DRAFTS_FILE}" "${LASTRUN_FILE}"
    init_state
    echo "State reset complete"
}

# Show state summary
show_state() {
    init_state
    local seen_count=$(jq '.seenIds | length' "${MESSAGES_FILE}")
    local last_check=$(get_lastcheck)
    local pending_drafts=$(jq '[.drafts[] | select(.status == "pending")] | length' "${DRAFTS_FILE}")
    
    echo "LinkedIn Monitor State"
    echo "======================"
    echo "Seen messages: ${seen_count}"
    echo "Last check: ${last_check:-never}"
    echo "Pending drafts: ${pending_drafts}"
}

# Run command if script is executed directly
case "${1:-}" in
    init) init_state ;;
    seen) get_seen_ids ;;
    is-seen) is_seen "$2" && echo "yes" || echo "no" ;;
    mark) mark_seen "$2" ;;
    lastcheck) get_lastcheck ;;
    update-lastcheck) update_lastcheck ;;
    save-draft) save_draft "$2" "$3" "$4" "$5" ;;
    get-drafts) get_drafts ;;
    get-draft) get_draft "$2" ;;
    mark-sent) mark_draft_sent "$2" ;;
    mark-skipped) mark_draft_skipped "$2" ;;
    reset) reset_state ;;
    status) show_state ;;
    *) echo "Usage: state.sh {init|seen|is-seen|mark|lastcheck|update-lastcheck|save-draft|get-drafts|get-draft|mark-sent|mark-skipped|reset|status}" ;;
esac
