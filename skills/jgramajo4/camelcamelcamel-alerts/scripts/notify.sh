#!/bin/bash
# Send Telegram notifications for new CamelCamelCamel alerts
# Input: JSON array from fetch_rss.py on stdin

# Read JSON from stdin
json_input=$(cat)

# Check if we have alerts
alert_count=$(echo "$json_input" | jq 'length' 2>/dev/null)

if [[ -z "$alert_count" || "$alert_count" == "0" || "$alert_count" == "null" ]]; then
    exit 0
fi

# Process each alert
echo "$json_input" | jq -c '.[]' | while read -r alert; do
    title=$(echo "$alert" | jq -r '.title // "No title"')
    link=$(echo "$alert" | jq -r '.link // ""')
    description=$(echo "$alert" | jq -r '.description // "No details"' | head -c 200)
    
    # Format message
    message="🛒 *Price Alert*\n\n*${title}*\n\n${description}\n\n[View on Amazon](${link})"
    
    # Send via Clawdbot (using message tool)
    # This will be called from a parent process that has access to message tool
    # Output in format that can be piped to message action
    echo "ALERT|$title|$message|$link"
done
