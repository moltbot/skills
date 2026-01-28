#!/usr/bin/env bash
# Locus MCP Setup — configures mcporter with your Locus API key
set -euo pipefail

DEFAULT_URL="https://mcp.paywithlocus.com/mcp"

echo "📍 Locus Payment Setup"
echo "======================"
echo ""

# Check mcporter
if ! command -v mcporter &>/dev/null; then
  echo "mcporter not found. Installing..."
  npm i -g mcporter
fi

# Check if already configured
if mcporter config get locus &>/dev/null 2>&1; then
  echo "Locus is already configured in mcporter."
  read -rp "Reconfigure? (y/N): " reconfigure
  if [[ ! "$reconfigure" =~ ^[Yy]$ ]]; then
    echo "Keeping existing config."
    exit 0
  fi
  mcporter config remove locus 2>/dev/null || true
fi

# Get API key
echo "Get your Locus API key from https://paywithlocus.com"
echo "Each key is tied to your wallet and permission group."
echo ""
read -rp "API Key (locus_...): " api_key

if [[ -z "$api_key" ]]; then
  echo "Error: API key is required."
  exit 1
fi

# Configure
echo ""
echo "Configuring mcporter..."
mcporter config add locus \
  --url "$DEFAULT_URL" \
  --header "Authorization=Bearer $api_key" \
  --scope home

echo ""
echo "✅ Locus configured! Testing connection..."
echo ""

# Test and show available tools
if mcporter list locus 2>/dev/null; then
  echo ""
  echo "🎉 Connected to Locus! Your wallet is ready."
  echo "Tools shown above are based on your permission group."
else
  echo ""
  echo "⚠️  Connection test failed. Check your API key and try again."
  echo "  Run: bash skills/locus/scripts/setup.sh"
fi
