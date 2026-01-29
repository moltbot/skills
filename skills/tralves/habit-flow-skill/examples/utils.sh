#!/bin/bash
# HabitFlow Utility Functions
# Source this file to get helpful functions: source examples/utils.sh

SKILL_DIR="${SKILL_DIR:-$HOME/clawd/skills/habit-flow}"

# Get habit ID by name (fuzzy search)
habit_id() {
  local name="$1"
  cd "$SKILL_DIR" && npx tsx scripts/view_habits.ts --search "$name" 2>/dev/null | jq -r '.habits[0].id // empty'
}

# Quick log completion for today
hlog() {
  local habit_name="$1"
  local status="${2:-completed}"

  if [ -z "$habit_name" ]; then
    echo "Usage: hlog <habit_name> [status]"
    echo "Example: hlog meditation completed"
    return 1
  fi

  local habit_id=$(habit_id "$habit_name")

  if [ -z "$habit_id" ]; then
    echo "❌ Habit not found: $habit_name"
    return 1
  fi

  cd "$SKILL_DIR" && npx tsx scripts/log_habit.ts \
    --habit-id "$habit_id" \
    --status "$status" 2>/dev/null | jq -r '
      if .success then
        "✅ Logged! Current streak: \(.streakUpdate.currentStreak) days 🔥 (\(.streakUpdate.streakQuality))"
      else
        "❌ Error: \(.error)"
      end
    '
}

# View all active habits
hlist() {
  cd "$SKILL_DIR" && npx tsx scripts/view_habits.ts --active --format markdown
}

# Get stats for a habit
hstats() {
  local habit_name="$1"
  local period="${2:-30}"

  if [ -z "$habit_name" ]; then
    echo "Usage: hstats <habit_name> [period_days]"
    echo "Example: hstats meditation 30"
    return 1
  fi

  local habit_id=$(habit_id "$habit_name")

  if [ -z "$habit_id" ]; then
    echo "❌ Habit not found: $habit_name"
    return 1
  fi

  cd "$SKILL_DIR" && npx tsx scripts/get_stats.ts \
    --habit-id "$habit_id" \
    --period "$period" \
    --format text
}

# Create a new habit interactively
hnew() {
  echo "🎯 Create New Habit"
  echo "=================="
  echo ""

  read -p "Habit name: " name

  echo ""
  echo "Categories: health, fitness, productivity, learning, social, creative, mindfulness, spirituality, other"
  read -p "Category: " category

  echo ""
  echo "Frequencies: daily, weekly, monthly"
  read -p "Frequency: " frequency

  read -p "Target count: " count
  read -p "Target unit (e.g., minutes, pages, glasses): " unit

  read -p "Description (optional): " description

  echo ""
  read -p "Set reminder? (y/n): " has_reminder

  local cmd="cd $SKILL_DIR && npx tsx scripts/manage_habit.ts create \
    --name \"$name\" \
    --category \"$category\" \
    --frequency \"$frequency\" \
    --target-count $count \
    --target-unit \"$unit\""

  if [ -n "$description" ]; then
    cmd="$cmd --description \"$description\""
  fi

  if [ "$has_reminder" = "y" ]; then
    read -p "Reminder time (HH:MM): " reminder_time
    cmd="$cmd --reminder \"$reminder_time\""
  fi

  echo ""
  echo "Creating habit..."

  result=$(eval "$cmd" 2>/dev/null)

  if echo "$result" | jq -e '.success' > /dev/null 2>&1; then
    habit_id=$(echo "$result" | jq -r '.habit.id')
    echo ""
    echo "✅ Habit created successfully!"
    echo "ID: $habit_id"
    echo ""

    if [ "$has_reminder" = "y" ]; then
      echo "Syncing reminder..."
      cd "$SKILL_DIR" && npx tsx scripts/sync_reminders.ts --habit-id "$habit_id" --add 2>/dev/null
      echo "✅ Reminder set for $reminder_time"
    fi
  else
    echo "❌ Error creating habit"
    echo "$result" | jq -r '.error'
  fi
}

# Parse natural language
hparse() {
  local text="$*"

  if [ -z "$text" ]; then
    echo "Usage: hparse <natural language text>"
    echo "Example: hparse I meditated today"
    return 1
  fi

  cd "$SKILL_DIR" && npx tsx scripts/parse_natural_language.ts \
    --text "$text" 2>/dev/null | jq -r '
      if .success then
        "Detected: \(.habitName)\nDate: \(.dates[0])\nStatus: \(.status)\nConfidence: \(.confidence * 100 | round)%\n\n\(
          if .confidence >= 0.85 then
            "High confidence - would log automatically ✅"
          elif .confidence >= 0.60 then
            "Medium confidence - would ask for confirmation ⚠️"
          else
            "Low confidence - would request clarification ❌"
          end
        )"
      else
        "❌ Error: \(.error)"
      end
    '
}

# Show streak info
hstreak() {
  local habit_name="$1"

  if [ -z "$habit_name" ]; then
    echo "Usage: hstreak <habit_name>"
    echo "Example: hstreak meditation"
    return 1
  fi

  local habit_id=$(habit_id "$habit_name")

  if [ -z "$habit_id" ]; then
    echo "❌ Habit not found: $habit_name"
    return 1
  fi

  cd "$SKILL_DIR" && npx tsx scripts/calculate_streaks.ts \
    --habit-id "$habit_id" \
    --format text | grep -E "Current|Longest|Perfect|Quality|Forgiveness"
}

echo "✅ HabitFlow utils loaded!"
echo ""
echo "Available commands:"
echo "  hlog <habit> [status]     - Log completion (default: completed)"
echo "  hlist                     - List all active habits"
echo "  hstats <habit> [days]     - View statistics (default: 30 days)"
echo "  hstreak <habit>           - View streak info"
echo "  hparse <text>             - Parse natural language"
echo "  hnew                      - Create new habit (interactive)"
echo ""
echo "Examples:"
echo "  hlog meditation"
echo "  hlog exercise partial"
echo "  hstats meditation 7"
echo "  hstreak meditation"
echo "  hparse I meditated today"
echo ""
