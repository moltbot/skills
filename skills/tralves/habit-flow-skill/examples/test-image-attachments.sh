#!/bin/bash
# Test Image Attachments in Proactive Coaching

set -e

echo "Testing Image Attachments for Proactive Coaching"
echo "================================================="
echo

cd "$(dirname "$0")/.."

# Get first active habit
HABIT_ID=$(npx tsx scripts/view_habits.ts --active --format json 2>/dev/null | grep -o '"id"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$HABIT_ID" ]; then
  echo "❌ No active habits found"
  exit 1
fi

echo "Using habit ID: $HABIT_ID"
echo

# Test 1: JSON output format
echo "1. Testing JSON output format..."
echo "-----------------------------------"
OUTPUT=$(npx tsx scripts/proactive_coaching.ts --habit-id "$HABIT_ID" --weekly-checkin --format json 2>/dev/null)

# Check if output is valid JSON
if echo "$OUTPUT" | jq . > /dev/null 2>&1; then
  echo "✅ Valid JSON output"

  # Extract message count
  MESSAGE_COUNT=$(echo "$OUTPUT" | jq -r '.messageCount')
  echo "   Messages: $MESSAGE_COUNT"

  # Extract attachments
  ATTACHMENTS=$(echo "$OUTPUT" | jq -r '.messages[0].attachments[]' 2>/dev/null)
  if [ -n "$ATTACHMENTS" ]; then
    echo "   Attachments found:"
    echo "$ATTACHMENTS" | while read -r path; do
      if [ -f "$path" ]; then
        SIZE=$(du -h "$path" | cut -f1)
        echo "     ✅ $path ($SIZE)"
      else
        echo "     ❌ $path (not found)"
      fi
    done
  else
    echo "   No attachments in output"
  fi
else
  echo "❌ Invalid JSON output"
  exit 1
fi
echo

# Test 2: Simulate agent reading images
echo "2. Simulating agent reading images..."
echo "-----------------------------------"
ATTACHMENTS=$(echo "$OUTPUT" | jq -r '.messages[0].attachments[]' 2>/dev/null)

if [ -n "$ATTACHMENTS" ]; then
  echo "$ATTACHMENTS" | while read -r path; do
    if [ -f "$path" ]; then
      echo "   Reading image: $path"
      # In a real agent session, this would use the Read tool
      # For testing, we just verify the file exists and is a valid PNG
      if file "$path" | grep -q "PNG image"; then
        echo "   ✅ Valid PNG image"
      else
        echo "   ⚠️  File exists but may not be a valid PNG"
      fi
    fi
  done
else
  echo "   No attachments to read"
fi
echo

# Test 3: Complete message format
echo "3. Testing complete message format..."
echo "-----------------------------------"
SUBJECT=$(echo "$OUTPUT" | jq -r '.messages[0].subject')
BODY=$(echo "$OUTPUT" | jq -r '.messages[0].body')

echo "Subject: $SUBJECT"
echo
echo "Body:"
echo "$BODY"
echo
echo "Attachments:"
echo "$ATTACHMENTS" | while read -r path; do
  echo "  - $path"
done
echo

echo "================================================="
echo "✅ Image attachment tests complete!"
echo
echo "To test in a real cron session:"
echo "  1. Sync coaching jobs: npx tsx scripts/sync_reminders.ts sync-coaching"
echo "  2. List jobs: clawdbot cron list | grep HabitFlow"
echo "  3. Wait for scheduled trigger or manually test the message prompt"
echo
echo "Expected behavior:"
echo "  - Agent runs command with --format json"
echo "  - Agent parses JSON to extract message and attachment paths"
echo "  - Agent uses Read tool to display images"
echo "  - Agent formats complete message with visualizations"
echo "  - clawdbot --deliver sends to user's last active channel"
