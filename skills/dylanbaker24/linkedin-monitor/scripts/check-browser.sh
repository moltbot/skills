#!/bin/bash
# Browser-based LinkedIn inbox check
# Uses Clawdbot browser tool instead of lk CLI

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="${HOME}/.clawdbot/linkedin-monitor"
STATE_DIR="${CONFIG_DIR}/state"
MESSAGES_FILE="${STATE_DIR}/messages.json"
LOG_DIR="${CONFIG_DIR}/logs"
LOG_FILE="${LOG_DIR}/activity.log"

# Ensure directories exist
mkdir -p "${STATE_DIR}" "${LOG_DIR}"

# Initialize state file if not exists
if [ ! -f "${MESSAGES_FILE}" ]; then
    echo '{"seenIds":[],"lastCheck":""}' > "${MESSAGES_FILE}"
fi

log() {
    local level="$1"
    shift
    local msg="$*"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    echo "[${timestamp}] [${level}] ${msg}" >> "${LOG_FILE}"
}

log "INFO" "Starting browser-based LinkedIn check"

# The actual browser check is done by Clawdbot
# This script is called by the cron, which then invokes Clawdbot
# to do the browser work and parse results

# Output instruction for Clawdbot cron
cat << 'EOF'
LINKEDIN_BROWSER_CHECK
Instructions for Clawdbot:
1. Use browser tool (profile: clawd) to navigate to linkedin.com/messaging/
2. Take snapshot
3. Parse conversation list for inbound messages (not from me)
4. Compare against state file: ~/.clawdbot/linkedin-monitor/state/messages.json
5. For each NEW inbound message:
   - Extract: name, message preview, timestamp
   - Add to results
   - Mark as seen in state file
6. If new messages found:
   - Draft replies using USER.md communication style
   - Post to #linkedin channel
7. Update lastCheck timestamp in state file
EOF
