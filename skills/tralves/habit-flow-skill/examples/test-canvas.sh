#!/bin/bash
# Test Canvas Dashboard generation

set -e

echo "Testing Canvas Dashboard..."
echo

# Get first active habit ID
HABIT_ID=$(npx tsx scripts/view_habits.ts --active --format json 2>/dev/null | grep -o '"id"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$HABIT_ID" ]; then
  echo "❌ No active habits found. Creating test habit..."

  # Create test habit
  HABIT_OUTPUT=$(npx tsx scripts/manage_habit.ts create \
    --name "Test Visualization Habit" \
    --category health \
    --frequency daily \
    --target-count 1)

  HABIT_ID=$(echo "$HABIT_OUTPUT" | grep -o 'h_[a-zA-Z0-9]*')

  echo "✅ Created test habit: $HABIT_ID"
  echo

  # Log some completions for the past week
  echo "Logging sample completions..."
  for i in {1..7}; do
    DATE=$(date -v-${i}d +%Y-%m-%d 2>/dev/null || date -d "${i} days ago" +%Y-%m-%d)
    npx tsx scripts/log_habit.ts --habit-id "$HABIT_ID" --date "$DATE" --status completed --count 1 2>/dev/null || true
  done
  echo "✅ Logged sample data"
  echo
fi

echo "Using habit ID: $HABIT_ID"
echo

# Generate visualizations
echo "Generating visualizations..."
echo

echo "1. Streak Chart..."
npx tsx assets/canvas-dashboard.ts streak --habit-id "$HABIT_ID" --output /tmp/test-streak.png
echo "   ✅ Saved to: /tmp/test-streak.png"

echo "2. Completion Heatmap..."
npx tsx assets/canvas-dashboard.ts heatmap --habit-id "$HABIT_ID" --days 30 --output /tmp/test-heatmap.png
echo "   ✅ Saved to: /tmp/test-heatmap.png"

echo "3. Weekly Trends..."
npx tsx assets/canvas-dashboard.ts trends --habit-id "$HABIT_ID" --weeks 4 --output /tmp/test-trends.png
echo "   ✅ Saved to: /tmp/test-trends.png"

echo "4. Multi-Habit Dashboard..."
npx tsx assets/canvas-dashboard.ts dashboard --output /tmp/test-dashboard.png
echo "   ✅ Saved to: /tmp/test-dashboard.png"

echo
echo "✅ All visualizations generated successfully!"
echo
echo "Test files created:"
echo "  - /tmp/test-streak.png"
echo "  - /tmp/test-heatmap.png"
echo "  - /tmp/test-trends.png"
echo "  - /tmp/test-dashboard.png"
