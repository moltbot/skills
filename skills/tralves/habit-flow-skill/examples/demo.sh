#!/bin/bash
# HabitFlow Demo Script
# This script demonstrates the basic functionality of HabitFlow

set -e

echo "🎯 HabitFlow Demo"
echo "================="
echo ""

# Navigate to skill directory
cd "$(dirname "$0")/.."

echo "📝 Step 1: Creating sample habits..."
echo ""

# Create meditation habit
MEDITATION_ID=$(npx tsx scripts/manage_habit.ts create \
  --name "Meditation" \
  --category mindfulness \
  --frequency daily \
  --target-count 10 \
  --target-unit minutes \
  --description "Daily mindfulness practice" \
  2>/dev/null | jq -r '.habit.id')

echo "✅ Created: Meditation (ID: $MEDITATION_ID)"

# Create exercise habit
EXERCISE_ID=$(npx tsx scripts/manage_habit.ts create \
  --name "Exercise" \
  --category fitness \
  --frequency daily \
  --target-count 30 \
  --target-unit minutes \
  --description "Daily workout" \
  2>/dev/null | jq -r '.habit.id')

echo "✅ Created: Exercise (ID: $EXERCISE_ID)"

# Create reading habit
READING_ID=$(npx tsx scripts/manage_habit.ts create \
  --name "Reading" \
  --category learning \
  --frequency daily \
  --target-count 20 \
  --target-unit pages \
  --description "Read every day" \
  2>/dev/null | jq -r '.habit.id')

echo "✅ Created: Reading (ID: $READING_ID)"
echo ""

echo "📊 Step 2: Viewing all habits..."
echo ""
npx tsx scripts/view_habits.ts --active --format markdown
echo ""

echo "✏️  Step 3: Logging completions for the past week..."
echo ""

# Log meditation for past 7 days
npx tsx scripts/log_habit.ts \
  --habit-id "$MEDITATION_ID" \
  --dates "2026-01-22,2026-01-23,2026-01-24,2026-01-25,2026-01-26,2026-01-27,2026-01-28" \
  --status completed \
  2>/dev/null > /dev/null

echo "✅ Logged 7 days of meditation"

# Log exercise with one missed day
npx tsx scripts/log_habit.ts \
  --habit-id "$EXERCISE_ID" \
  --dates "2026-01-22,2026-01-23,2026-01-25,2026-01-26,2026-01-27,2026-01-28" \
  --status completed \
  2>/dev/null > /dev/null

npx tsx scripts/log_habit.ts \
  --habit-id "$EXERCISE_ID" \
  --date "2026-01-24" \
  --status missed \
  2>/dev/null > /dev/null

echo "✅ Logged 6 days of exercise + 1 missed day"

# Log reading with varying counts
npx tsx scripts/log_habit.ts \
  --habit-id "$READING_ID" \
  --dates "2026-01-26,2026-01-27,2026-01-28" \
  --status completed \
  --count 25 \
  2>/dev/null > /dev/null

echo "✅ Logged 3 days of reading"
echo ""

echo "🔥 Step 4: Checking streaks..."
echo ""

echo "Meditation:"
npx tsx scripts/calculate_streaks.ts --habit-id "$MEDITATION_ID" --format text | grep -E "Current|Perfect|Quality"

echo ""
echo "Exercise (with 1-day forgiveness):"
npx tsx scripts/calculate_streaks.ts --habit-id "$EXERCISE_ID" --format text | grep -E "Current|Perfect|Quality|Forgiveness"

echo ""
echo "Reading:"
npx tsx scripts/calculate_streaks.ts --habit-id "$READING_ID" --format text | grep -E "Current|Perfect|Quality"

echo ""
echo "📈 Step 5: Viewing statistics..."
echo ""
npx tsx scripts/get_stats.ts --all --period 7 --format text

echo ""
echo "🗣️  Step 6: Testing natural language parsing..."
echo ""

echo "Input: 'I meditated for 15 minutes today'"
npx tsx scripts/parse_natural_language.ts --text "I meditated for 15 minutes today" | jq -r '"  ✅ Detected: \(.habitName) (\(.dates[0])) with confidence \(.confidence)"'

echo ""
echo "Input: 'Exercised yesterday'"
npx tsx scripts/parse_natural_language.ts --text "Exercised yesterday" | jq -r '"  ✅ Detected: \(.habitName) (\(.dates[0])) with confidence \(.confidence)"'

echo ""
echo "Input: 'Read 30 pages on Monday'"
npx tsx scripts/parse_natural_language.ts --text "Read 30 pages on Monday" | jq -r '"  ✅ Detected: \(.habitName) (\(.dates[0])) with confidence \(.confidence)"'

echo ""
echo "✨ Demo complete! Check ~/clawd/habit-flow-data/ for generated files."
echo ""
