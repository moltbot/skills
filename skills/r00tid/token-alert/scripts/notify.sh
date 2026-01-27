#!/bin/bash
# Token Alert - macOS Notification Service
# Checks token usage and sends native macOS popup

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_FILE="$HOME/.clawdbot/.token-alert-state"

# Ensure state file exists
mkdir -p "$HOME/.clawdbot"
touch "$STATE_FILE"

# Run check.py and capture output + exit code
OUTPUT=$("$SCRIPT_DIR/check.py" 2>&1)
EXIT_CODE=$?

# Read last alerted level
LAST_LEVEL=$(cat "$STATE_FILE" 2>/dev/null)
if [ -z "$LAST_LEVEL" ]; then
    LAST_LEVEL=0
fi

# Map exit codes to levels
# 0=OK, 1=LOW, 2=MEDIUM, 3=HIGH, 4=CRITICAL, 5=EMERGENCY
if [ "$EXIT_CODE" -ge "$LAST_LEVEL" ] && [ "$EXIT_CODE" -gt 0 ]; then
    # New threshold reached - send notification
    
    # Extract title and message
    TITLE=$(echo "$OUTPUT" | head -1)
    MESSAGE=$(echo "$OUTPUT" | tail -n +3)
    
    # Send macOS notification
    if command -v terminal-notifier &> /dev/null; then
        # Using terminal-notifier (better)
        terminal-notifier -title "$TITLE" -message "$MESSAGE" -sound Glass
    else
        # Fallback: osascript
        osascript -e "display notification \"$MESSAGE\" with title \"$TITLE\" sound name \"Glass\""
    fi
    
    # Update state
    echo "$EXIT_CODE" > "$STATE_FILE"
    
    # Also print to stdout (for logging)
    echo "$OUTPUT"
else
    # No new threshold - just log quietly
    echo "$(date): Token usage at $EXIT_CODE/5" >> "$HOME/.clawdbot/.token-alert.log"
fi
