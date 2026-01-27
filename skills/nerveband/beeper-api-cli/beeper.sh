#!/bin/bash
# Beeper API CLI wrapper skill for Clawdbot
# Provides easy access to Beeper CLI commands with environment variables auto-configured
# Auto-starts Beeper Desktop if not running

set -e

# Beeper CLI binary location
BEEPER_CLI="/Users/ashrafali/clawd/skills/beeper-api-cli/beeper"

# Ensure environment variables are set
: ${BEEPER_API_URL:="http://[::1]:23373"}
: ${BEEPER_TOKEN:?"BEEPER_TOKEN must be set in environment"}

export BEEPER_API_URL
export BEEPER_TOKEN

# Function to check if Beeper Desktop is running
is_beeper_running() {
    pgrep -x "Beeper Desktop" > /dev/null 2>&1
}

# Function to check if Beeper API is responding
is_beeper_api_ready() {
    curl -s -f -H "Authorization: Bearer ${BEEPER_TOKEN}" \
        "${BEEPER_API_URL}/api/whoami" > /dev/null 2>&1
}

# Auto-start Beeper Desktop if not running
if ! is_beeper_running; then
    echo "⚠️  Beeper Desktop is not running. Starting it..." >&2
    open -a "Beeper Desktop"
    
    # Wait for Beeper to start (max 30 seconds)
    MAX_WAIT=30
    WAITED=0
    while [ $WAITED -lt $MAX_WAIT ]; do
        if is_beeper_running; then
            echo "✅ Beeper Desktop started. Waiting for API..." >&2
            break
        fi
        sleep 1
        WAITED=$((WAITED + 1))
    done
    
    if [ $WAITED -ge $MAX_WAIT ]; then
        echo "❌ Beeper Desktop failed to start within ${MAX_WAIT} seconds" >&2
        exit 1
    fi
fi

# Wait for API to be ready (max 15 seconds)
if ! is_beeper_api_ready; then
    echo "⏳ Waiting for Beeper API to be ready..." >&2
    MAX_API_WAIT=15
    API_WAITED=0
    while [ $API_WAITED -lt $MAX_API_WAIT ]; do
        if is_beeper_api_ready; then
            echo "✅ Beeper API is ready" >&2
            break
        fi
        sleep 1
        API_WAITED=$((API_WAITED + 1))
    done
    
    if [ $API_WAITED -ge $MAX_API_WAIT ]; then
        echo "❌ Beeper API not responding after ${MAX_API_WAIT} seconds" >&2
        echo "   Make sure API is enabled in Beeper Desktop settings" >&2
        exit 1
    fi
fi

# Execute the beeper CLI with all arguments passed through
exec "$BEEPER_CLI" "$@"
