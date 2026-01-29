#!/bin/bash
# Test script for Linear webhook skill

set -e

echo "=== Testing Linear Webhook Skill ==="
echo ""

# Test 1: Transform script
echo "Test 1: Running transform with example payload..."
node linear-transform.js
echo ""
echo "✓ Transform test passed"
echo ""

# Test 2: Webhook endpoint (if Clawdbot is running)
if command -v clawdbot &> /dev/null; then
    echo "Test 2: Testing webhook endpoint..."
    
    # Check if gateway is running
    if clawdbot gateway status &> /dev/null; then
        echo "Gateway is running, testing webhook..."
        
        # Get token from env or prompt
        TOKEN=${CLAWDBOT_HOOK_TOKEN:-"test-token"}
        
        curl -X POST http://localhost:18789/hooks/linear \
          -H "x-clawdbot-token: $TOKEN" \
          -H "Content-Type: application/json" \
          -d @example-payload.json \
          -w "\nHTTP Status: %{http_code}\n" \
          --silent \
          || echo "✗ Webhook endpoint not responding (is gateway configured?)"
        
        echo ""
    else
        echo "⚠ Gateway not running, skipping webhook test"
        echo "  Start with: clawdbot gateway start"
        echo ""
    fi
else
    echo "⚠ Clawdbot CLI not found, skipping webhook test"
    echo ""
fi

# Test 3: Check files
echo "Test 3: Checking skill files..."
files=(
    "SKILL.md"
    "README.md"
    "linear-transform.js"
    "post-response.js"
    "config-example.json5"
    "example-payload.json"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file"
    else
        echo "✗ $file missing"
    fi
done

echo ""
echo "=== All tests completed ==="
echo ""
echo "Next steps:"
echo "1. Configure Clawdbot (see config-example.json5)"
echo "2. Set environment variables (CLAWDBOT_HOOK_TOKEN, LINEAR_API_KEY)"
echo "3. Start Cloudflare tunnel: cloudflared tunnel --url http://localhost:18789"
echo "4. Configure Linear webhook with your tunnel URL"
echo "5. Test by commenting @mason or @eureka in a Linear issue"
