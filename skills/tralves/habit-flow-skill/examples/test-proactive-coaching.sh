#!/bin/bash
# Test Proactive Coaching System

set -e

echo "Testing Proactive Coaching System..."
echo "======================================"
echo

# Change to skill directory
cd "$(dirname "$0")/.."

# Get first active habit
HABIT_ID=$(npx tsx scripts/view_habits.ts --active --format json 2>/dev/null | grep -o '"id"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$HABIT_ID" ]; then
  echo "❌ No active habits found"
  echo "Creating a test habit first..."

  # Create test habit
  npx tsx scripts/manage_habit.ts create \
    --name "Test Meditation" \
    --category mindfulness \
    --frequency daily \
    --target-count 1 \
    --target-unit session

  # Get the new habit ID
  HABIT_ID=$(npx tsx scripts/view_habits.ts --active --format json 2>/dev/null | grep -o '"id"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | cut -d'"' -f4)

  if [ -z "$HABIT_ID" ]; then
    echo "❌ Failed to create test habit"
    exit 1
  fi

  echo "✅ Created test habit: $HABIT_ID"
  echo
fi

echo "Using habit ID: $HABIT_ID"
echo

# Test 1: Milestone detection
echo "1. Testing milestone detection..."
echo "-----------------------------------"
npx tsx scripts/proactive_coaching.ts --check-milestones --habit-id "$HABIT_ID"
echo
echo "✅ Milestone detection test complete"
echo

# Test 2: Risk assessment
echo "2. Testing risk assessment..."
echo "-----------------------------------"
npx tsx scripts/proactive_coaching.ts --check-risks --habit-id "$HABIT_ID"
echo
echo "✅ Risk assessment test complete"
echo

# Test 3: Weekly check-in
echo "3. Testing weekly check-in..."
echo "-----------------------------------"
npx tsx scripts/proactive_coaching.ts --weekly-checkin --habit-id "$HABIT_ID"
echo
echo "✅ Weekly check-in test complete"
echo

# Test 4: Pattern insights
echo "4. Testing pattern insights..."
echo "-----------------------------------"
npx tsx scripts/proactive_coaching.ts --detect-insights --habit-id "$HABIT_ID"
echo
echo "✅ Pattern insights test complete"
echo

# Test 5: Full run (all checks)
echo "5. Testing full coaching run..."
echo "-----------------------------------"
npx tsx scripts/proactive_coaching.ts --habit-id "$HABIT_ID"
echo
echo "✅ Full coaching run test complete"
echo

echo "======================================"
echo "✅ All proactive coaching tests passed!"
echo
echo "To test actual sending:"
echo "  npx tsx scripts/proactive_coaching.ts --habit-id $HABIT_ID --send"
echo
echo "To sync cron jobs:"
echo "  npx tsx scripts/sync_reminders.ts sync-coaching"
