#!/bin/bash
# Setup Token Alert Notifications for macOS

echo "🚨 Token Alert - macOS Notification Setup"
echo ""

# 1. Install terminal-notifier (optional, better notifications)
if ! command -v terminal-notifier &> /dev/null; then
    echo "📦 Installing terminal-notifier..."
    brew install terminal-notifier
else
    echo "✅ terminal-notifier already installed"
fi

# 2. Copy launchd plist
PLIST_SRC="$HOME/clawd/skills/token-alert/com.clawdbot.token-alert.plist"
PLIST_DST="$HOME/Library/LaunchAgents/com.clawdbot.token-alert.plist"

echo "📋 Installing LaunchAgent..."
mkdir -p "$HOME/Library/LaunchAgents"
cp "$PLIST_SRC" "$PLIST_DST"

# 3. Load service
echo "🚀 Starting service..."
launchctl unload "$PLIST_DST" 2>/dev/null
launchctl load "$PLIST_DST"

echo ""
echo "✅ Setup complete!"
echo ""
echo "📊 Service checks token usage every 5 minutes"
echo "🔔 Popup appears when new threshold reached (25%, 50%, 75%, 90%, 95%)"
echo ""
echo "Commands:"
echo "  Stop:   launchctl unload $PLIST_DST"
echo "  Start:  launchctl load $PLIST_DST"
echo "  Test:   ~/clawd/skills/token-alert/scripts/notify.sh"
echo ""
