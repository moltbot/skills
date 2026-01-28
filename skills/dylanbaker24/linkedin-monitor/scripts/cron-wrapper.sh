#!/bin/bash
# Cron wrapper for linkedin-monitor
# Runs the check and sends results to Clawdbot if new messages found

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="${HOME}/.clawdbot/linkedin-monitor"
CONFIG_FILE="${CONFIG_DIR}/config.json"

# Load config
if [ ! -f "${CONFIG_FILE}" ]; then
    echo "Config not found. Run: linkedin-monitor setup"
    exit 1
fi

CHANNEL_ID=$(jq -r '.alertChannelId // ""' "${CONFIG_FILE}")
AUTONOMY_LEVEL=$(jq -r '.autonomyLevel // 1' "${CONFIG_FILE}")

# Run the check
RESULT=$(bash "${SCRIPT_DIR}/check.sh" 2>&1) || {
    # Check failed - might be an error
    if echo "$RESULT" | jq -e '.error' &>/dev/null; then
        ERROR_MSG=$(echo "$RESULT" | jq -r '.error')
        ACTION=$(echo "$RESULT" | jq -r '.action // "check logs"')
        
        # Alert about the error
        if [ -n "${CHANNEL_ID}" ]; then
            # Send error alert to Clawdbot
            # This uses the Clawdbot message format
            cat << EOF
LINKEDIN_MONITOR_ERROR
Channel: ${CHANNEL_ID}
Error: ${ERROR_MSG}
Action: ${ACTION}
EOF
        fi
    fi
    exit 1
}

# If no output, no new messages - exit silently
if [ -z "${RESULT}" ]; then
    exit 0
fi

# Parse the result
NEW_COUNT=$(echo "$RESULT" | jq -r '.count // 0')

if [ "$NEW_COUNT" -eq 0 ]; then
    exit 0
fi

# We have new messages!
echo "Found ${NEW_COUNT} new message(s)"

# Format the messages for Clawdbot
MESSAGES=$(echo "$RESULT" | jq -r '.newMessages[]')

# Build the alert message
ALERT="**LinkedIn Inbox Update**\n\n"

while IFS= read -r msg; do
    NAME=$(echo "$msg" | jq -r '.participantName')
    TEXT=$(echo "$msg" | jq -r '.lastMessage')
    TIME=$(echo "$msg" | jq -r '.lastMessageTime')
    
    ALERT="${ALERT}📬 **${NAME}**\n"
    ALERT="${ALERT}> ${TEXT}\n\n"
done < <(echo "$RESULT" | jq -c '.newMessages[]')

# Output for Clawdbot cron to pick up
# The cron system will see this output and process it
cat << EOF
LINKEDIN_MONITOR_ALERT
Channel: ${CHANNEL_ID}
AutonomyLevel: ${AUTONOMY_LEVEL}
NewCount: ${NEW_COUNT}
---
${ALERT}
---
Messages: ${RESULT}
EOF
