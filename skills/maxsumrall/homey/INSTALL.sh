#!/bin/bash
# Quick install script for Homey CLI skill

set -e

LINK=0
for arg in "$@"; do
  case "$arg" in
    --link)
      LINK=1
      ;;
    --no-link)
      LINK=0
      ;;
  esac
done

echo "🦞 Installing Homey CLI Skill..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Run this from the homey skill directory."
  exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Make CLI executable (best-effort)
echo "🔧 Making CLI executable..."
chmod +x bin/homeycli.js bin/homeycli 2>/dev/null || true

# Check for auth
if [ -z "$HOMEY_TOKEN" ] && [ -z "$HOMEY_LOCAL_TOKEN" ] && [ ! -f "$HOME/.homey/config.json" ]; then
  echo ""
  echo "⚠️  No Homey auth found (env vars or ~/.homey/config.json)."
  echo ""
  echo "Local mode (LAN/VPN):"
  echo "  # discover local address (best effort via mDNS)"
  echo "  ./bin/homeycli.js auth discover-local --json"
  echo "  ./bin/homeycli.js auth discover-local --save --pick 1"
  echo "  # generate a local API key in the Homey Web App"
  echo "  ./bin/homeycli.js auth set-local --prompt"
  echo ""
  echo "Cloud mode (remote/headless):"
  echo "  # create a cloud token in Developer Tools: https://tools.developer.homey.app/api/clients"
  echo "  ./bin/homeycli.js auth set-token --prompt"
  echo ""
  echo "Env vars (optional):"
  echo "  export HOMEY_MODE=auto|local|cloud"
  echo "  export HOMEY_ADDRESS=\"http://192.168.1.50\""
  echo "  export HOMEY_LOCAL_TOKEN=\"...\""
  echo "  export HOMEY_TOKEN=\"...\""
  echo ""
else
  echo "✅ Auth appears to be configured (env var or config file present)"
fi

# Test CLI
echo ""
echo "🧪 Testing CLI..."
if ./bin/homeycli.js --help > /dev/null 2>&1; then
  echo "✅ CLI works!"
else
  echo "❌ CLI test failed"
  exit 1
fi

# Link globally (optional, non-interactive)
if [ "$LINK" -eq 1 ]; then
  echo ""
  echo "🔗 Linking globally with npm link..."
  npm link
  echo "✅ Installed globally as 'homeycli'"
else
  echo ""
  echo "Skipped global install. Use ./bin/homeycli.js to run, or pass --link."
fi

echo ""
echo "🎉 Installation complete!"
echo ""
echo "Next steps:"
echo "  1. Check config: ./bin/homeycli.js auth status"
echo "  2. Test: ./bin/homeycli.js status"
echo "  3. List devices: ./bin/homeycli.js devices --json"
echo ""
