#!/usr/bin/env bash
# Send Gotify notification
set -euo pipefail

CONFIG_FILE="${GOTIFY_CONFIG_FILE:-$HOME/.clawdbot/credentials/gotify/config.json}"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "Error: Gotify not configured. Create $CONFIG_FILE with {\"url\": \"https://...\", \"token\": \"...\"}" >&2
  exit 1
fi

GOTIFY_URL=$(jq -r '.url' "$CONFIG_FILE")
GOTIFY_TOKEN=$(jq -r '.token' "$CONFIG_FILE")

MESSAGE=""
TITLE=""
PRIORITY=5
MARKDOWN=false

while [[ $# -gt 0 ]]; do
  case $1 in
    -m|--message)
      MESSAGE="$2"
      shift 2
      ;;
    -t|--title)
      TITLE="$2"
      shift 2
      ;;
    -p|--priority)
      PRIORITY="$2"
      shift 2
      ;;
    --markdown)
      MARKDOWN=true
      shift
      ;;
    *)
      if [ -z "$MESSAGE" ]; then
        MESSAGE="$1"
      fi
      shift
      ;;
  esac
done

if [ -z "$MESSAGE" ]; then
  echo "Usage: $0 [-m|--message] <message> [-t|--title <title>] [-p|--priority <0-10>] [--markdown]" >&2
  exit 1
fi

# Build JSON payload
PAYLOAD=$(jq -nc \
  --arg message "$MESSAGE" \
  --arg title "$TITLE" \
  --argjson priority "$PRIORITY" \
  '{message: $message, priority: $priority}')

# Add title if provided
if [ -n "$TITLE" ]; then
  PAYLOAD=$(echo "$PAYLOAD" | jq --arg title "$TITLE" '.title = $title')
fi

# Add markdown extras if requested
if [ "$MARKDOWN" = true ]; then
  PAYLOAD=$(echo "$PAYLOAD" | jq '.extras = {"client::display": {"contentType": "text/markdown"}}')
fi

# Send notification
curl -sS -X POST "$GOTIFY_URL/message?token=$GOTIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"

echo ""  # newline after response
