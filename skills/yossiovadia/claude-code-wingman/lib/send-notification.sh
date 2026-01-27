#!/bin/bash
# send-notification.sh - Send WhatsApp notification via Clawdbot webhook
# Usage: send-notification.sh "Your message here"

set -e

MESSAGE="${1:-}"
CLAWDBOT_CONFIG="${CLAWDBOT_CONFIG:-$HOME/.clawdbot/clawdbot.json}"
WEBHOOK_URL="${CLAWDBOT_WEBHOOK_URL:-http://127.0.0.1:18789/hooks/agent}"

# Get phone from env or clawdbot config
if [ -n "$CLAWDBOT_PHONE" ]; then
    PHONE="$CLAWDBOT_PHONE"
elif [ -f "$CLAWDBOT_CONFIG" ]; then
    PHONE=$(jq -r '.channels.whatsapp.allowFrom[0] // empty' "$CLAWDBOT_CONFIG" 2>/dev/null)
fi

if [ -z "$PHONE" ]; then
    echo "Error: No phone number found. Set CLAWDBOT_PHONE or configure allowFrom in clawdbot.json" >&2
    exit 1
fi

# Get webhook token from env or clawdbot config
if [ -n "$CLAWDBOT_WEBHOOK_TOKEN" ]; then
    WEBHOOK_TOKEN="$CLAWDBOT_WEBHOOK_TOKEN"
elif [ -f "$CLAWDBOT_CONFIG" ]; then
    WEBHOOK_TOKEN=$(jq -r '.hooks.token // empty' "$CLAWDBOT_CONFIG" 2>/dev/null)
fi

if [ -z "$WEBHOOK_TOKEN" ]; then
    echo "Error: No webhook token found. Set CLAWDBOT_WEBHOOK_TOKEN or configure hooks.token in clawdbot.json" >&2
    exit 1
fi

if [ -z "$MESSAGE" ]; then
    echo "Usage: $0 <message>" >&2
    exit 1
fi

# Escape message for JSON
ESCAPED_MESSAGE=$(echo "$MESSAGE" | jq -Rs .)

curl -s -X POST "$WEBHOOK_URL" \
  -H "Authorization: Bearer $WEBHOOK_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": $ESCAPED_MESSAGE,
    \"name\": \"OrchestratorMonitor\",
    \"deliver\": true,
    \"channel\": \"whatsapp\",
    \"to\": \"$PHONE\"
  }"
