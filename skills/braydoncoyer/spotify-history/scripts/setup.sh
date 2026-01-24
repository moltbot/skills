#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
WORKSPACE_DIR="$(dirname "$(dirname "$SKILL_DIR")")"
CREDS_DIR="$WORKSPACE_DIR/credentials"
CREDS_FILE="$CREDS_DIR/spotify.json"

echo "🎵 Spotify History Skill Setup"
echo "================================"
echo

# Check if already set up
if [ -f "$CREDS_FILE" ]; then
    echo "✓ Credentials already exist at: $CREDS_FILE"
    read -p "Overwrite? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing credentials."
        exit 0
    fi
fi

echo "Step 1: Create Spotify Developer App"
echo "-------------------------------------"
echo "1. Go to: https://developer.spotify.com/dashboard"
echo "2. Click 'Create App'"
echo "3. Fill in:"
echo "   - App name: Clawd (or any name)"
echo "   - App description: Personal assistant integration"
echo "   - Redirect URI: http://127.0.0.1:8888/callback"
echo "4. Save and copy your Client ID and Client Secret"
echo
read -p "Press Enter when ready..."
echo

# Get credentials
echo "Step 2: Enter Credentials"
echo "-------------------------"
read -p "Client ID: " CLIENT_ID
read -p "Client Secret: " CLIENT_SECRET
echo

# Validate input
if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
    echo "❌ Error: Client ID and Secret are required"
    exit 1
fi

# Create credentials directory
mkdir -p "$CREDS_DIR"

# Save credentials
cat > "$CREDS_FILE" <<EOF
{
  "client_id": "$CLIENT_ID",
  "client_secret": "$CLIENT_SECRET",
  "redirect_uri": "http://127.0.0.1:8888/callback"
}
EOF

chmod 600 "$CREDS_FILE"
echo "✓ Credentials saved to: $CREDS_FILE"
echo

# Run auth flow
echo "Step 3: Authorize Spotify Access"
echo "---------------------------------"
echo "Running OAuth flow..."
echo

cd "$WORKSPACE_DIR"
python3 scripts/spotify-auth.py

echo
echo "✅ Setup Complete!"
echo
echo "Test it:"
echo "  python3 scripts/spotify-api.py recent"
echo "  python3 scripts/spotify-api.py top-artists"
echo "  python3 scripts/spotify-api.py recommend"
echo
