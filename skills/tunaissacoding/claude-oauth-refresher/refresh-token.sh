#!/bin/bash
# refresh-token.sh - Claude CLI OAuth token refresh

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/claude-oauth-refresh-config.json"
AUTH_PROFILES="$HOME/.config/claude/auth-profiles.json"
KEYCHAIN_SERVICE="claude-cli-auth"
KEYCHAIN_ACCOUNT="default"

# Load config or use defaults
if [[ -f "$CONFIG_FILE" ]]; then
    REFRESH_BUFFER=$(jq -r '.refresh_buffer_minutes // 30' "$CONFIG_FILE")
    LOG_FILE=$(jq -r '.log_file // "~/clawd/logs/claude-oauth-refresh.log"' "$CONFIG_FILE" | sed "s|^~|$HOME|")
    NOTIFY_START=$(jq -r '.notifications.on_start // true' "$CONFIG_FILE")
    NOTIFY_SUCCESS=$(jq -r '.notifications.on_success // true' "$CONFIG_FILE")
    NOTIFY_FAILURE=$(jq -r '.notifications.on_failure // true' "$CONFIG_FILE")
    NOTIFY_CHANNEL=$(jq -r '.notification_channel // "telegram"' "$CONFIG_FILE")
    NOTIFY_TARGET=$(jq -r '.notification_target // ""' "$CONFIG_FILE")
else
    REFRESH_BUFFER=30
    LOG_FILE="$HOME/clawd/logs/claude-oauth-refresh.log"
    NOTIFY_START=true
    NOTIFY_SUCCESS=true
    NOTIFY_FAILURE=true
    NOTIFY_CHANNEL="telegram"
    NOTIFY_TARGET=""
fi

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Notification function
notify() {
    local message="$1"
    local notification_type="$2"  # "start", "success", or "failure"
    
    # Check if we should notify for this type
    if [[ "$notification_type" == "start" ]] && [[ "$NOTIFY_START" != "true" ]]; then
        return
    fi
    if [[ "$notification_type" == "success" ]] && [[ "$NOTIFY_SUCCESS" != "true" ]]; then
        return
    fi
    if [[ "$notification_type" == "failure" ]] && [[ "$NOTIFY_FAILURE" != "true" ]]; then
        return
    fi
    
    # Skip if no target configured
    if [[ -z "$NOTIFY_TARGET" ]] || [[ "$NOTIFY_TARGET" == "YOUR_CHAT_ID" ]]; then
        log "WARN: No notification target configured, skipping notification"
        return
    fi
    
    # Send via Clawdbot
    if command -v clawdbot &> /dev/null; then
        clawdbot message send --target "$NOTIFY_TARGET" --message "$message" >> "$LOG_FILE" 2>&1 || \
            log "ERROR: Failed to send notification"
    else
        log "WARN: clawdbot not found, cannot send notification"
    fi
}

# Enhanced error handler with detailed troubleshooting
error_exit() {
    local error_message="$1"
    local error_details="${2:-}"
    
    log "ERROR: $error_message"
    if [[ -n "$error_details" ]]; then
        log "DETAILS: $error_details"
    fi
    
    # Build detailed failure notification
    local troubleshooting=""
    local full_message="❌ Claude token refresh failed

Error: $error_message"
    
    if [[ -n "$error_details" ]]; then
        full_message="$full_message
Details: $error_details"
    fi
    
    # Add specific troubleshooting based on error type
    if [[ "$error_message" =~ "curl" ]] || [[ "$error_message" =~ "network" ]] || [[ "$error_message" =~ "timeout" ]]; then
        troubleshooting="
Troubleshooting:
- Check your internet connection
- Verify you can reach console.anthropic.com
- Try running manually: $SCRIPT_DIR/refresh-token.sh"
    elif [[ "$error_message" =~ "invalid_grant" ]] || [[ "$error_message" =~ "refresh token" ]]; then
        troubleshooting="
Troubleshooting:
- Your refresh token may have expired
- Re-authenticate: claude auth logout && claude auth
- Verify Keychain access: security find-generic-password -s '$KEYCHAIN_SERVICE' -a '$KEYCHAIN_ACCOUNT'"
    elif [[ "$error_message" =~ "Keychain" ]] || [[ "$error_message" =~ "security" ]]; then
        troubleshooting="
Troubleshooting:
- Check Keychain permissions
- Re-run authentication: claude auth
- Verify setup: $SCRIPT_DIR/verify-setup.sh"
    elif [[ "$error_message" =~ "auth-profiles" ]] || [[ "$error_message" =~ "profile" ]]; then
        troubleshooting="
Troubleshooting:
- Run: claude auth
- Verify file exists: ~/.config/claude/auth-profiles.json
- Check file permissions: chmod 600 ~/.config/claude/auth-profiles.json"
    else
        troubleshooting="
Troubleshooting:
- Run verification: $SCRIPT_DIR/verify-setup.sh
- Check logs: tail -20 $LOG_FILE
- Try manual refresh: $SCRIPT_DIR/refresh-token.sh"
    fi
    
    full_message="$full_message$troubleshooting

Need help? Message Clawdbot or check logs:
$LOG_FILE"
    
    notify "$full_message" "failure"
    exit 1
}

# Check dependencies
command -v jq &> /dev/null || error_exit "jq not installed" "Install with: brew install jq"
command -v security &> /dev/null || error_exit "security command not found" "This script requires macOS Keychain"
[[ -f "$AUTH_PROFILES" ]] || error_exit "No auth profiles found" "Run: claude auth"

log "Starting token refresh check..."

# Send start notification if enabled
notify "🔄 Refreshing Claude token..." "start"

# Read current auth profile
PROFILE=$(jq -r '.default // empty' "$AUTH_PROFILES" 2>/dev/null) || \
    error_exit "Failed to read auth profiles" "Cannot parse JSON from $AUTH_PROFILES"
[[ -n "$PROFILE" ]] || error_exit "No default profile in auth-profiles.json" "Run: claude auth"

# Extract expiry time
EXPIRES_AT=$(echo "$PROFILE" | jq -r '.expiresAt // empty')
[[ -n "$EXPIRES_AT" ]] || error_exit "No expiresAt field in auth profile" "Your auth profile may be corrupted. Re-run: claude auth"

# Parse expiry (format: ISO 8601)
if date --version &> /dev/null 2>&1; then
    # GNU date
    EXPIRES_EPOCH=$(date -d "$EXPIRES_AT" +%s 2>/dev/null) || \
        error_exit "Failed to parse expiry time" "Invalid date format: $EXPIRES_AT"
else
    # BSD date (macOS)
    EXPIRES_EPOCH=$(date -j -f "%Y-%m-%dT%H:%M:%S" "${EXPIRES_AT%.*}" +%s 2>/dev/null || \
                    date -j -f "%Y-%m-%dT%H:%M:%SZ" "$EXPIRES_AT" +%s 2>/dev/null) || \
        error_exit "Failed to parse expiry time" "Invalid date format: $EXPIRES_AT"
fi

NOW_EPOCH=$(date +%s)
BUFFER_SECONDS=$((REFRESH_BUFFER * 60))
REFRESH_THRESHOLD=$((EXPIRES_EPOCH - BUFFER_SECONDS))

TIME_UNTIL_EXPIRY=$((EXPIRES_EPOCH - NOW_EPOCH))
MINUTES_UNTIL_EXPIRY=$((TIME_UNTIL_EXPIRY / 60))

log "Token expires in $MINUTES_UNTIL_EXPIRY minutes"

# Check if refresh needed
if [[ $NOW_EPOCH -lt $REFRESH_THRESHOLD ]]; then
    log "Token still valid, no refresh needed (buffer: $REFRESH_BUFFER min)"
    exit 0
fi

log "Token needs refresh (within $REFRESH_BUFFER min buffer)"

# Retrieve refresh token from Keychain
log "Retrieving refresh token from Keychain..."
REFRESH_TOKEN=$(security find-generic-password -s "$KEYCHAIN_SERVICE" -a "$KEYCHAIN_ACCOUNT" -w 2>&1) || \
    error_exit "Failed to retrieve refresh token from Keychain" "$(echo "$REFRESH_TOKEN" | grep -o 'errSecItemNotFound\|errSecAuthFailed\|The specified item could not be found in the keychain' || echo 'Unknown keychain error')"

[[ -n "$REFRESH_TOKEN" ]] || error_exit "Refresh token is empty" "Re-run: claude auth"

# OAuth refresh request
log "Requesting new access token..."
OAUTH_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "https://console.anthropic.com/v1/oauth/token" \
    -H "Content-Type: application/json" \
    --max-time 30 \
    -d "{
        \"grant_type\": \"refresh_token\",
        \"refresh_token\": \"$REFRESH_TOKEN\",
        \"client_id\": \"9d1c250a-e61b-44d9-88ed-5944d1962f5e\"
    }" 2>&1)

# Extract HTTP code and body
HTTP_CODE=$(echo "$OAUTH_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
OAUTH_BODY=$(echo "$OAUTH_RESPONSE" | sed '/HTTP_CODE:/d')

# Check for curl errors
if [[ -z "$HTTP_CODE" ]]; then
    error_exit "Network error connecting to console.anthropic.com" "Connection failed or timed out after 30s. Check your internet connection."
fi

# Check for HTTP errors
if [[ "$HTTP_CODE" != "200" ]]; then
    ERROR_MSG=$(echo "$OAUTH_BODY" | jq -r '.error_description // .error // "Unknown error"')
    error_exit "OAuth refresh failed (HTTP $HTTP_CODE)" "$ERROR_MSG"
fi

# Check for errors in response
if echo "$OAUTH_BODY" | jq -e '.error' &> /dev/null; then
    ERROR_MSG=$(echo "$OAUTH_BODY" | jq -r '.error_description // .error')
    error_exit "OAuth refresh failed" "$ERROR_MSG"
fi

# Extract new tokens
NEW_ACCESS_TOKEN=$(echo "$OAUTH_BODY" | jq -r '.access_token // empty')
NEW_REFRESH_TOKEN=$(echo "$OAUTH_BODY" | jq -r '.refresh_token // empty')
EXPIRES_IN=$(echo "$OAUTH_BODY" | jq -r '.expires_in // 3600')

[[ -n "$NEW_ACCESS_TOKEN" ]] || error_exit "No access token in OAuth response" "Response may be malformed. Try re-authenticating: claude auth"

# Calculate new expiry
NEW_EXPIRES_AT=$(date -u -j -f "%s" "$((NOW_EPOCH + EXPIRES_IN))" "+%Y-%m-%dT%H:%M:%SZ" 2>/dev/null) || \
    error_exit "Failed to calculate new expiry time" "Invalid expires_in value: $EXPIRES_IN"

# Update auth-profiles.json
log "Updating auth profile..."
UPDATED_PROFILE=$(echo "$PROFILE" | jq \
    --arg access_token "$NEW_ACCESS_TOKEN" \
    --arg expires_at "$NEW_EXPIRES_AT" \
    '.accessToken = $access_token | .expiresAt = $expires_at' 2>/dev/null) || \
    error_exit "Failed to update auth profile" "Cannot modify auth profile JSON"

jq --arg profile "$UPDATED_PROFILE" '.default = ($profile | fromjson)' "$AUTH_PROFILES" > "$AUTH_PROFILES.tmp" && \
    mv "$AUTH_PROFILES.tmp" "$AUTH_PROFILES" || \
    error_exit "Failed to write updated auth profile" "Cannot write to $AUTH_PROFILES"

# Update refresh token in Keychain if it changed
if [[ -n "$NEW_REFRESH_TOKEN" ]] && [[ "$NEW_REFRESH_TOKEN" != "$REFRESH_TOKEN" ]]; then
    log "Updating refresh token in Keychain..."
    security add-generic-password -U -s "$KEYCHAIN_SERVICE" -a "$KEYCHAIN_ACCOUNT" -w "$NEW_REFRESH_TOKEN" &> /dev/null || \
        log "WARN: Failed to update refresh token in Keychain (will retry next refresh)"
fi

# Success
EXPIRES_IN_HOURS=$((EXPIRES_IN / 3600))
NEXT_REFRESH_SECONDS=$((EXPIRES_IN - REFRESH_BUFFER * 60))
NEXT_REFRESH_HOURS=$((NEXT_REFRESH_SECONDS / 3600))
NEXT_REFRESH_MINUTES=$(((NEXT_REFRESH_SECONDS % 3600) / 60))

# Format next refresh time
if [[ $NEXT_REFRESH_HOURS -gt 0 ]]; then
    NEXT_REFRESH_TIME="${NEXT_REFRESH_HOURS}h ${NEXT_REFRESH_MINUTES}m"
else
    NEXT_REFRESH_TIME="${NEXT_REFRESH_MINUTES}m"
fi

log "✓ Token refreshed successfully (expires in ${EXPIRES_IN_HOURS}h, next refresh in ${NEXT_REFRESH_TIME})"
notify "✅ Claude token refreshed!
New expiry: $NEW_EXPIRES_AT
Next refresh: ~${NEXT_REFRESH_TIME}" "success"

exit 0
