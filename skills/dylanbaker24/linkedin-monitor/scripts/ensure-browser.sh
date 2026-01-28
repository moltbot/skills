#!/bin/bash
# Ensure clawd browser is running with LinkedIn tab open
# Run this on startup or if browser health check fails

echo "LinkedIn Monitor - Browser Setup"
echo "================================="

# This script outputs instructions for Clawdbot to execute
# It doesn't directly control the browser (that's done via browser tool)

cat << 'EOF'
BROWSER_SETUP_INSTRUCTIONS:

1. Check browser status:
   browser action=status profile=clawd

2. If not running, start it:
   browser action=start profile=clawd

3. Check tabs for LinkedIn:
   browser action=tabs profile=clawd

4. If no LinkedIn tab, open one:
   browser action=open profile=clawd targetUrl=https://www.linkedin.com/messaging/

5. Verify LinkedIn is logged in:
   - Take snapshot
   - Check for "Messaging" heading (logged in) vs "Sign in" (logged out)

6. If logged out:
   - Alert user to log in manually
   - Browser is on second desktop

IMPORTANT:
- The clawd browser should ALWAYS stay open
- LinkedIn tab should ALWAYS stay open
- Do NOT close the browser after checks
- Do NOT close tabs
EOF
