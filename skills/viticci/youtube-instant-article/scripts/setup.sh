#!/bin/bash
# Setup script for youtube-instant-article
# Creates a Telegraph account and outputs the token

set -euo pipefail

echo "🔧 YouTube Instant Article Setup"
echo "================================"
echo ""

# Check dependencies
echo "Checking dependencies..."

missing=()
command -v summarize &>/dev/null || missing+=("summarize (brew install steipete/tap/summarize)")
command -v jq &>/dev/null || missing+=("jq (brew install jq)")
command -v curl &>/dev/null || missing+=("curl")
command -v ffmpeg &>/dev/null || missing+=("ffmpeg (brew install ffmpeg)")

if [[ ${#missing[@]} -gt 0 ]]; then
    echo "❌ Missing dependencies:"
    for dep in "${missing[@]}"; do
        echo "   - $dep"
    done
    echo ""
    echo "Install them and run this script again."
    exit 1
fi

echo "✅ All dependencies installed"
echo ""

# Get user info for Telegraph account
read -p "Enter your name (for article author): " AUTHOR_NAME
[[ -z "$AUTHOR_NAME" ]] && AUTHOR_NAME="Anonymous"

read -p "Enter a short account name (e.g., 'mybot'): " SHORT_NAME
[[ -z "$SHORT_NAME" ]] && SHORT_NAME="instant-article"

echo ""
echo "Creating Telegraph account..."

# Create Telegraph account
RESPONSE=$(curl -s "https://api.telegra.ph/createAccount" \
    -d "short_name=$SHORT_NAME" \
    -d "author_name=$AUTHOR_NAME")

if echo "$RESPONSE" | jq -e '.ok' >/dev/null 2>&1; then
    TOKEN=$(echo "$RESPONSE" | jq -r '.result.access_token')
    AUTH_URL=$(echo "$RESPONSE" | jq -r '.result.auth_url')
    
    echo ""
    echo "✅ Telegraph account created!"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "YOUR TELEGRAPH TOKEN (save this!):"
    echo ""
    echo "  $TOKEN"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Add this to your shell profile (~/.zshrc or ~/.bashrc):"
    echo ""
    echo "  export TELEGRAPH_TOKEN=\"$TOKEN\""
    echo ""
    echo "Or create a .env file in your project:"
    echo ""
    echo "  echo 'TELEGRAPH_TOKEN=$TOKEN' >> .env"
    echo ""
    echo "To manage your articles, visit:"
    echo "  $AUTH_URL"
    echo ""
else
    echo "❌ Failed to create account:"
    echo "$RESPONSE" | jq -r '.error // "Unknown error"'
    exit 1
fi
