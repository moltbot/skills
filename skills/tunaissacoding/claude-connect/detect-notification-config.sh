#!/bin/bash
# detect-notification-config.sh - Auto-detect notification settings from Clawdbot config

set -euo pipefail

CLAWDBOT_CONFIG="$HOME/.clawdbot/clawdbot.json"

# Output format: channel|target or empty
detect_notification_target() {
    if [[ ! -f "$CLAWDBOT_CONFIG" ]]; then
        return 1
    fi
    
    if ! command -v jq &> /dev/null; then
        return 1
    fi
    
    # Try to find enabled channels with valid targets
    local channels=("telegram" "slack" "discord" "whatsapp" "imessage" "signal")
    
    for channel in "${channels[@]}"; do
        local enabled=$(jq -r ".channels.${channel}.enabled // false" "$CLAWDBOT_CONFIG" 2>/dev/null)
        
        if [[ "$enabled" == "true" ]]; then
            # Channel is enabled, try to find target
            local target=""
            
            case "$channel" in
                telegram)
                    # Try to get chat_id from config or recent messages
                    target=$(jq -r ".channels.telegram.default_chat_id // empty" "$CLAWDBOT_CONFIG" 2>/dev/null)
                    if [[ -z "$target" ]]; then
                        # Try to get from user info
                        target=$(jq -r ".channels.telegram.user_id // empty" "$CLAWDBOT_CONFIG" 2>/dev/null)
                    fi
                    ;;
                    
                slack)
                    # Try to get user ID
                    target=$(jq -r ".channels.slack.user_id // empty" "$CLAWDBOT_CONFIG" 2>/dev/null)
                    if [[ -n "$target" ]]; then
                        target="user:${target}"
                    fi
                    ;;
                    
                discord)
                    # Try to get user ID
                    target=$(jq -r ".channels.discord.user_id // empty" "$CLAWDBOT_CONFIG" 2>/dev/null)
                    if [[ -n "$target" ]]; then
                        target="user:${target}"
                    fi
                    ;;
                    
                whatsapp)
                    # Try to get phone number
                    target=$(jq -r ".channels.whatsapp.phone // empty" "$CLAWDBOT_CONFIG" 2>/dev/null)
                    ;;
                    
                imessage)
                    # Try to get default target
                    target=$(jq -r ".channels.imessage.default_target // empty" "$CLAWDBOT_CONFIG" 2>/dev/null)
                    ;;
                    
                signal)
                    # Try to get phone number
                    target=$(jq -r ".channels.signal.phone // empty" "$CLAWDBOT_CONFIG" 2>/dev/null)
                    ;;
            esac
            
            # If we found a valid target, return it
            if [[ -n "$target" ]]; then
                echo "${channel}|${target}"
                return 0
            fi
        fi
    done
    
    return 1
}

# Try runtime detection via clawdbot CLI
detect_from_cli() {
    if ! command -v clawdbot &> /dev/null; then
        return 1
    fi
    
    # Try Telegram first (most common)
    if clawdbot message telegram account list &> /dev/null; then
        local chat_id=$(clawdbot message telegram message search --limit 1 --from-me true 2>/dev/null | \
                       jq -r '.messages[0].chat.id // empty' 2>/dev/null)
        if [[ -n "$chat_id" ]]; then
            echo "telegram|${chat_id}"
            return 0
        fi
    fi
    
    return 1
}

# Main detection logic
main() {
    # Try config file first
    if result=$(detect_notification_target); then
        echo "$result"
        exit 0
    fi
    
    # Fall back to CLI detection
    if result=$(detect_from_cli); then
        echo "$result"
        exit 0
    fi
    
    # No detection possible
    exit 1
}

main
