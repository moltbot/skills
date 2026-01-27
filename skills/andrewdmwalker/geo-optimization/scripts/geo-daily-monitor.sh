#!/bin/bash
# Daily GEO Monitoring for Gameye Comparison Pages
# Runs full test suite and sends Telegram summary

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE="/Users/awalker/clawd"
cd "$WORKSPACE"

echo "🔍 Running daily GEO test..."

# Run the GEO monitor test
python3 scripts/geo-monitor.py --test > /tmp/geo-test-output.txt 2>&1

# Extract summary from output
SUMMARY=$(tail -50 /tmp/geo-test-output.txt | grep -A 20 "SUMMARY REPORT" || echo "Test completed")

# Get today's results
TODAY=$(date +%Y%m%d)
SUMMARY_FILE="geo-history/summary-${TODAY}-*.json"

# Find the most recent summary file
LATEST_SUMMARY=$(ls -t geo-history/summary-*.json 2>/dev/null | head -1)

if [ -f "$LATEST_SUMMARY" ]; then
    # Extract key metrics using Python
    METRICS=$(python3 -c "
import json

with open('$LATEST_SUMMARY') as f:
    data = json.load(f)

total = data.get('total', 0)
cited = data.get('cited', 0)
rate = data.get('citation_rate', 0) * 100

# Count critical gaps
results = data.get('results', [])
critical_misses = sum(1 for r in results if r.get('priority') == 'critical' and r.get('expected') and not r.get('actual_cited'))

print(f'📊 Gameye Citation Rate: {cited}/{total} ({rate:.1f}%)')
print(f'⚠️  Critical gaps remaining: {critical_misses}')
")
    
    # Send summary to Telegram
    MESSAGE="📊 **Daily GEO Test Results** - $(date +%Y-%m-%d)

${METRICS}

Full report: \`geo-history/summary-${TODAY}-*.json\`

Run \`python3 scripts/geo-monitor.py --report\` for detailed analysis."

else
    MESSAGE="⚠️ GEO test ran but no summary file generated. Check logs."
fi

# Send to Telegram using clawdbot message tool
# Note: This will be handled by the cron job's Telegram notification

echo "$MESSAGE"
