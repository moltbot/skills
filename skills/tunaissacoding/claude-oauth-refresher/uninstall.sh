#!/bin/bash
# uninstall.sh - Clean removal of claude-oauth-refresher

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLIST_FILE="com.clawdbot.claude-oauth-refresher.plist"
LAUNCHAGENTS_DIR="$HOME/Library/LaunchAgents"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  claude-oauth-refresher uninstaller${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Step 1: Stop service
echo -e "${BLUE}[1/4]${NC} Stopping launchd service..."
if launchctl list | grep -q "com.clawdbot.claude-oauth-refresher"; then
    launchctl unload "$LAUNCHAGENTS_DIR/$PLIST_FILE" 2>/dev/null || true
    echo -e "${GREEN}✓${NC} Service unloaded"
else
    echo "  Service not running (already unloaded)"
fi
echo ""

# Step 2: Remove plist
echo -e "${BLUE}[2/4]${NC} Removing launchd plist..."
if [[ -f "$LAUNCHAGENTS_DIR/$PLIST_FILE" ]]; then
    rm "$LAUNCHAGENTS_DIR/$PLIST_FILE"
    echo -e "${GREEN}✓${NC} Removed $LAUNCHAGENTS_DIR/$PLIST_FILE"
else
    echo "  Plist not found (already removed)"
fi

if [[ -f "$SCRIPT_DIR/$PLIST_FILE" ]]; then
    rm "$SCRIPT_DIR/$PLIST_FILE"
    echo -e "${GREEN}✓${NC} Removed local plist"
fi
echo ""

# Step 3: Clean logs (optional)
echo -e "${BLUE}[3/4]${NC} Cleaning logs..."
LOG_FILES=(
    "$HOME/clawd/logs/claude-oauth-refresh.log"
    "$HOME/clawd/logs/claude-oauth-refresher-stdout.log"
    "$HOME/clawd/logs/claude-oauth-refresher-stderr.log"
)

LOG_EXISTS=false
for log in "${LOG_FILES[@]}"; do
    if [[ -f "$log" ]]; then
        LOG_EXISTS=true
        break
    fi
done

if [[ "$LOG_EXISTS" == "true" ]]; then
    echo "Found log files:"
    for log in "${LOG_FILES[@]}"; do
        if [[ -f "$log" ]]; then
            SIZE=$(du -h "$log" | cut -f1)
            echo "  • $log ($SIZE)"
        fi
    done
    echo ""
    read -p "Delete log files? [y/N] " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        for log in "${LOG_FILES[@]}"; do
            if [[ -f "$log" ]]; then
                rm "$log"
                echo -e "${GREEN}✓${NC} Deleted $(basename "$log")"
            fi
        done
    else
        echo "  Keeping log files"
    fi
else
    echo "  No log files found"
fi
echo ""

# Step 4: Remove config (optional)
echo -e "${BLUE}[4/4]${NC} Removing config..."

CONFIG_FILES=(
    "$SCRIPT_DIR/claude-oauth-refresh-config.json"
    "$SCRIPT_DIR/config.json"
)

CONFIG_EXISTS=false
for config in "${CONFIG_FILES[@]}"; do
    if [[ -f "$config" ]]; then
        CONFIG_EXISTS=true
        echo "Found config: $(basename "$config")"
    fi
done

if [[ "$CONFIG_EXISTS" == "true" ]]; then
    read -p "Delete config files? [y/N] " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        for config in "${CONFIG_FILES[@]}"; do
            if [[ -f "$config" ]]; then
                rm "$config"
                echo -e "${GREEN}✓${NC} Deleted $(basename "$config")"
            fi
        done
    else
        echo "  Keeping config files"
    fi
else
    echo "  No config files found"
fi
echo ""

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Uninstall complete!${NC}"
echo ""
echo "What was removed:"
echo "  • launchd service (stopped)"
echo "  • plist files"
echo ""
echo "What was kept:"
echo "  • Scripts in $SCRIPT_DIR"
echo "  • Claude CLI credentials (Keychain)"
echo ""
echo "To reinstall:"
echo "  → Run: $SCRIPT_DIR/install.sh"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
