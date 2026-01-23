#!/bin/bash
# refresh-token.sh - Clawdbot OAuth token refresh
# Matches the exact process: Keychain JSON → OAuth API → Update auth-profiles.json + Keychain
# Usage: ./refresh-token.sh [--force]

set -euo pipefail

FORCE_REFRESH=false
if [[ "${1:-}" == "--force" ]]; then
    FORCE_REFRESH=true
fi

# Configuration
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/claude-oauth-refresh-config.json"

# Defaults for Clawdbot setup
DEFAULT_KEYCHAIN_SERVICE="Claude Code-credentials"
DEFAULT_KEYCHAIN_ACCOUNT="claude"
DEFAULT_KEYCHAIN_FIELD="claudeAiOauth"
DEFAULT_AUTH_FILE="$HOME/.clawdbot/agents/main/agent/auth-profiles.json"
DEFAULT_PROFILE_NAME="anthropic:default"
DEFAULT_CLIENT_ID="9d1c250a-e61b-44d9-88ed-5944d1962f5e"
DEFAULT_TOKEN_URL="https://console.anthropic.com/v1/oauth/token"
DEFAULT_REFRESH_BUFFER=30

# Load config or use defaults
if [[ -f "$CONFIG_FILE" ]]; then
    REFRESH_BUFFER=$(jq -r '.refresh_buffer_minutes // 30' "$CONFIG_FILE")
    LOG_FILE=$(jq -r '.log_file // "~/clawd/logs/claude-oauth-refresh.log"' "$CONFIG_FILE" | sed "s|^~|$HOME|")
    NOTIFY_SUCCESS=$(jq -r '.notifications.on_success // true' "$CONFIG_FILE")
    NOTIFY_FAILURE=$(jq -r '.notifications.on_failure // true' "$CONFIG_FILE")
    NOTIFY_CHANNEL=$(jq -r '.notification_channel // "telegram"' "$CONFIG_FILE")
    NOTIFY_TARGET=$(jq -r '.notification_target // ""' "$CONFIG_FILE")
    
    KEYCHAIN_SERVICE=$(jq -r '.keychain_service // ""' "$CONFIG_FILE")
    KEYCHAIN_ACCOUNT=$(jq -r '.keychain_account // ""' "$CONFIG_FILE")
    KEYCHAIN_FIELD=$(jq -r '.keychain_field // ""' "$CONFIG_FILE")
    AUTH_FILE=$(jq -r '.auth_file // ""' "$CONFIG_FILE" | sed "s|^~|$HOME|")
    PROFILE_NAME=$(jq -r '.profile_name // ""' "$CONFIG_FILE")
    CLIENT_ID=$(jq -r '.client_id // ""' "$CONFIG_FILE")
    TOKEN_URL=$(jq -r '.token_url // ""' "$CONFIG_FILE")
else
    REFRESH_BUFFER=$DEFAULT_REFRESH_BUFFER
    LOG_FILE="$HOME/clawd/logs/claude-oauth-refresh.log"
    NOTIFY_SUCCESS=true
    NOTIFY_FAILURE=true
    NOTIFY_CHANNEL="telegram"
    NOTIFY_TARGET=""
    KEYCHAIN_SERVICE=""
    KEYCHAIN_ACCOUNT=""
    KEYCHAIN_FIELD=""
    AUTH_FILE=""
    PROFILE_NAME=""
    CLIENT_ID=""
    TOKEN_URL=""
fi

# Apply defaults if not set
KEYCHAIN_SERVICE="${KEYCHAIN_SERVICE:-$DEFAULT_KEYCHAIN_SERVICE}"
KEYCHAIN_ACCOUNT="${KEYCHAIN_ACCOUNT:-$DEFAULT_KEYCHAIN_ACCOUNT}"
KEYCHAIN_FIELD="${KEYCHAIN_FIELD:-$DEFAULT_KEYCHAIN_FIELD}"
AUTH_FILE="${AUTH_FILE:-$DEFAULT_AUTH_FILE}"
PROFILE_NAME="${PROFILE_NAME:-$DEFAULT_PROFILE_NAME}"
CLIENT_ID="${CLIENT_ID:-$DEFAULT_CLIENT_ID}"
TOKEN_URL="${TOKEN_URL:-$DEFAULT_TOKEN_URL}"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Notification function
notify() {
    local message="$1"
    local notification_type="$2"
    
    if [[ "$notification_type" == "success" ]] && [[ "$NOTIFY_SUCCESS" != "true" ]]; then
        return
    fi
    if [[ "$notification_type" == "failure" ]] && [[ "$NOTIFY_FAILURE" != "true" ]]; then
        return
    fi
    
    if [[ -z "$NOTIFY_TARGET" ]] || [[ "$NOTIFY_TARGET" == "YOUR_CHAT_ID" ]]; then
        return
    fi
    
    if command -v clawdbot &> /dev/null; then
        clawdbot message send --target "$NOTIFY_TARGET" --message "$message" >> "$LOG_FILE" 2>&1 || true
    fi
}

# Error handler
error_exit() {
    local error_message="$1"
    log "ERROR: $error_message"
    notify "❌ Claude token refresh failed: $error_message" "failure"
    exit 1
}

echo "=== Claude OAuth Token Refresh ==="
log "Refresh started"

# Step 1: Read tokens from Keychain with fallback discovery
log "Reading tokens from Keychain..."

# Helper function to validate keychain data
validate_keychain_data() {
    local data="$1"
    local account_name="$2"
    
    # Try to parse and check for required fields
    local has_refresh=$(echo "$data" | python3 -c "import sys, json; data=json.load(sys.stdin); print('yes' if '$KEYCHAIN_FIELD' in data and 'refreshToken' in data['$KEYCHAIN_FIELD'] and data['$KEYCHAIN_FIELD']['refreshToken'] else 'no')" 2>/dev/null)
    local has_expires=$(echo "$data" | python3 -c "import sys, json; data=json.load(sys.stdin); print('yes' if '$KEYCHAIN_FIELD' in data and 'expiresAt' in data['$KEYCHAIN_FIELD'] and data['$KEYCHAIN_FIELD']['expiresAt'] else 'no')" 2>/dev/null)
    
    if [[ "$has_refresh" == "yes" ]] && [[ "$has_expires" == "yes" ]]; then
        log "✓ Found complete token data in account: $account_name"
        return 0
    else
        log "⚠ Account '$account_name' has incomplete data (refreshToken: $has_refresh, expiresAt: $has_expires)"
        return 1
    fi
}

# Try primary account first
KEYCHAIN_DATA=""
KEYCHAIN_DATA=$(security find-generic-password -s "$KEYCHAIN_SERVICE" -a "$KEYCHAIN_ACCOUNT" -w 2>&1 || echo "")

if [[ -n "$KEYCHAIN_DATA" ]] && validate_keychain_data "$KEYCHAIN_DATA" "$KEYCHAIN_ACCOUNT"; then
    log "Using configured account: $KEYCHAIN_ACCOUNT"
else
    # Fallback: Auto-discover accounts with complete data
    log "Primary account failed, trying common account names..."
    
    # Try common account names
    COMMON_ACCOUNTS=("claude" "Claude Code" "default" "oauth" "anthropic")
    
    FOUND=false
    for account in "${COMMON_ACCOUNTS[@]}"; do
        log "Trying account: $account"
        
        KEYCHAIN_DATA=$(security find-generic-password -s "$KEYCHAIN_SERVICE" -a "$account" -w 2>&1 || echo "")
        
        if [[ -n "$KEYCHAIN_DATA" ]] && validate_keychain_data "$KEYCHAIN_DATA" "$account"; then
            KEYCHAIN_ACCOUNT="$account"  # Update to use this account
            FOUND=true
            break
        fi
    done
    
    if [[ "$FOUND" == "false" ]]; then
        error_exit "No account found with complete token data. Tried: ${COMMON_ACCOUNTS[*]}

Hint: Check your keychain entry:
  security find-generic-password -s '$KEYCHAIN_SERVICE' -l

Verify the password (JSON) contains:
  { \"$KEYCHAIN_FIELD\": { \"refreshToken\": \"...\", \"expiresAt\": ... } }"
    fi
fi

# Parse keychain JSON
REFRESH_TOKEN=$(echo "$KEYCHAIN_DATA" | python3 -c "import sys, json; print(json.load(sys.stdin)['$KEYCHAIN_FIELD']['refreshToken'])")
CURRENT_EXPIRES=$(echo "$KEYCHAIN_DATA" | python3 -c "import sys, json; print(json.load(sys.stdin)['$KEYCHAIN_FIELD']['expiresAt'])")

log "✓ Using keychain account: $KEYCHAIN_ACCOUNT"
log "Current expiry: $(date -r $((CURRENT_EXPIRES / 1000)) '+%Y-%m-%d %H:%M:%S')"

# Check if refresh needed
NOW_MS=$(($(date +%s) * 1000))
TIME_LEFT_MS=$((CURRENT_EXPIRES - NOW_MS))
TIME_LEFT_MIN=$((TIME_LEFT_MS / 60000))

if [[ "$FORCE_REFRESH" == "false" ]] && [[ $TIME_LEFT_MIN -gt $REFRESH_BUFFER ]]; then
    log "Token still valid for ${TIME_LEFT_MIN} minutes (buffer: ${REFRESH_BUFFER}m)"
    echo "✅ Token still valid ($TIME_LEFT_MIN minutes remaining)"
    echo "Use --force to refresh anyway"
    exit 0
fi

if [[ "$FORCE_REFRESH" == "true" ]]; then
    log "Force refresh requested (token expires in $TIME_LEFT_MIN minutes)"
else
    log "Token expires in $TIME_LEFT_MIN minutes, refreshing..."
fi

# Step 2: Call OAuth endpoint
log "Calling OAuth endpoint..."
RESPONSE=$(curl -s -X POST "$TOKEN_URL" \
    -H "Content-Type: application/json" \
    --max-time 30 \
    -d "{
        \"grant_type\": \"refresh_token\",
        \"refresh_token\": \"$REFRESH_TOKEN\",
        \"client_id\": \"$CLIENT_ID\"
    }") || error_exit "Network error calling OAuth endpoint"

# Parse response
NEW_ACCESS=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))" 2>/dev/null) || \
    error_exit "Failed to parse OAuth response"

NEW_REFRESH=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('refresh_token', ''))" 2>/dev/null) || \
    error_exit "Failed to parse OAuth response"

EXPIRES_IN=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('expires_in', 0))" 2>/dev/null) || \
    error_exit "Failed to parse OAuth response"

[[ -n "$NEW_ACCESS" ]] || error_exit "No access_token in OAuth response: $RESPONSE"
[[ -n "$NEW_REFRESH" ]] || error_exit "No refresh_token in OAuth response"

NEW_EXPIRES_AT=$(($(date +%s) * 1000 + EXPIRES_IN * 1000))
NEW_EXPIRES_TIME=$(date -r $((NEW_EXPIRES_AT / 1000)) '+%Y-%m-%d %H:%M:%S')

log "✓ Received new tokens"
log "New expiry: $NEW_EXPIRES_TIME (${EXPIRES_IN}s / $((EXPIRES_IN / 3600))h)"

# Step 3: Update auth-profiles.json
log "Updating auth-profiles.json..."
if [[ -f "$AUTH_FILE" ]]; then
    python3 << PYEOF
import json
with open('$AUTH_FILE') as f:
    data = json.load(f)
data['profiles']['$PROFILE_NAME']['token'] = '$NEW_ACCESS'
with open('$AUTH_FILE', 'w') as f:
    json.dump(data, f, indent=2)
PYEOF
    log "✓ Auth file updated: $AUTH_FILE"
else
    log "WARN: Auth file not found: $AUTH_FILE"
fi

# Step 4: Update Keychain
log "Updating Keychain..."

# Read existing metadata from keychain
SCOPES=$(echo "$KEYCHAIN_DATA" | python3 -c "import sys, json; import json as j; print(j.dumps(json.load(sys.stdin)['$KEYCHAIN_FIELD'].get('scopes', [])))" 2>/dev/null || echo "[]")
SUB_TYPE=$(echo "$KEYCHAIN_DATA" | python3 -c "import sys, json; print(json.load(sys.stdin)['$KEYCHAIN_FIELD'].get('subscriptionType', 'max'))" 2>/dev/null || echo "max")
RATE_TIER=$(echo "$KEYCHAIN_DATA" | python3 -c "import sys, json; print(json.load(sys.stdin)['$KEYCHAIN_FIELD'].get('rateLimitTier', 'default'))" 2>/dev/null || echo "default")

# Build new keychain data
NEW_KEYCHAIN_DATA=$(python3 << PYEOF
import json
data = {
    '$KEYCHAIN_FIELD': {
        'accessToken': '$NEW_ACCESS',
        'refreshToken': '$NEW_REFRESH',
        'expiresAt': $NEW_EXPIRES_AT,
        'scopes': $SCOPES,
        'subscriptionType': '$SUB_TYPE',
        'rateLimitTier': '$RATE_TIER'
    }
}
print(json.dumps(data))
PYEOF
)

# Update keychain (delete old + add new)
security delete-generic-password -s "$KEYCHAIN_SERVICE" -a "$KEYCHAIN_ACCOUNT" 2>/dev/null || true
security add-generic-password -s "$KEYCHAIN_SERVICE" -a "$KEYCHAIN_ACCOUNT" -w "$NEW_KEYCHAIN_DATA" -U

log "✓ Keychain updated"
log "Refresh complete"

notify "✅ Claude token refreshed!
New expiry: $NEW_EXPIRES_TIME
Next refresh: ~$((EXPIRES_IN / 3600 - REFRESH_BUFFER / 60))h" "success"

echo ""
echo "✅ Token refreshed successfully!"
echo "New expiry: $NEW_EXPIRES_TIME"
echo "Expires in: $((EXPIRES_IN / 3600)) hours"
