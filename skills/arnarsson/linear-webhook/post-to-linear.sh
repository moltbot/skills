#!/bin/bash
# Post a response to Linear issue
# Usage: ./post-to-linear.sh <issue_id> <agent_name> <response_text>

ISSUE_ID="$1"
AGENT_NAME="$2"
RESPONSE="$3"

if [ -z "$ISSUE_ID" ] || [ -z "$AGENT_NAME" ] || [ -z "$RESPONSE" ]; then
  echo "Usage: ./post-to-linear.sh <issue_id> <agent_name> <response_text>"
  exit 1
fi

LINEAR_API_KEY=$(cat ~/.linear_api_key)

node -e "
const {postLinearComment} = require('/home/sven/clawd-mason/skills/linear-webhook/linear-transform.js');
postLinearComment('$ISSUE_ID', \`$RESPONSE\`, '$AGENT_NAME');
"
