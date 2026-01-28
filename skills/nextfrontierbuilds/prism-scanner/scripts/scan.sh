#!/bin/bash
# PRISM Token Scanner
# Usage: ./scan.sh <token_or_address> [--json]

PRISM_URL="${PRISM_URL:-https://strykr-prism.up.railway.app}"
TOKEN="$1"
JSON_MODE="$2"

if [ -z "$TOKEN" ]; then
  echo "Usage: ./scan.sh <token_or_address> [--json]"
  exit 1
fi

# Fetch data in parallel
analyze=$(curl -s "$PRISM_URL/analyze/$TOKEN")
copycat=$(curl -s "$PRISM_URL/analyze/copycat/$TOKEN")

# Extract data (using jq)
risk_score=$(echo "$analyze" | jq -r '.risk_score // 0')
is_copycat=$(echo "$copycat" | jq -r '.is_copycat // false')
similarity=$(echo "$copycat" | jq -r '.similarity // 0')

# Calculate risk level
if [ "$risk_score" -le 25 ]; then
  risk_level="✅ Lower Risk"
  bar="████████░░░░░░░░░░░░"
elif [ "$risk_score" -le 50 ]; then
  risk_level="⚠️ Medium Risk"
  bar="████████████░░░░░░░░"
elif [ "$risk_score" -le 75 ]; then
  risk_level="🔶 Higher Risk"
  bar="████████████████░░░░"
else
  risk_level="🚨 High Risk"
  bar="████████████████████"
fi

if [ "$JSON_MODE" == "--json" ]; then
  echo "{\"token\": \"$TOKEN\", \"risk_score\": $risk_score, \"is_copycat\": $is_copycat, \"analyze\": $analyze, \"copycat\": $copycat}"
  exit 0
fi

# Pretty print
cat << EOF
🛡️ PRISM Token Scan: $TOKEN

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RISK SCORE: $risk_score/100
$bar $risk_level

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANALYSIS:
$(echo "$analyze" | jq -r '.summary // "No summary available"')

COPYCAT CHECK:
$(if [ "$is_copycat" == "true" ]; then echo "🚨 COPYCAT DETECTED (${similarity}% similar)"; else echo "✅ No copycat detected"; fi)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ DYOR - This is not financial advice
EOF
