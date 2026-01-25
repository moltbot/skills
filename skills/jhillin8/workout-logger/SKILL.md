---
name: workout-logger
description: Log workouts, track progress, get exercise suggestions and PR tracking
author: clawd-team
version: 1.0.0
triggers:
  - "log workout"
  - "track exercise"
  - "gym session"
  - "what's my PR"
  - "workout history"
---

# Workout Logger

Track your fitness through conversation. Log workouts, hit PRs, see progress over time.

## What it does

Records workouts in natural language, tracks personal records, shows progress charts, and suggests exercises based on your history. Your AI gym buddy that remembers everything.

## Usage

**Log workouts:**
```
"Bench press 185lbs 3x8"
"Ran 5k in 24 minutes"
"Did 30 min yoga"
"Leg day: squats 225x5, lunges 3x12, leg press 400x10"
```

**Check progress:**
```
"What's my bench PR?"
"Show deadlift progress"
"How many times did I work out this month?"
```

**Get suggestions:**
```
"What should I do for back today?"
"I have 20 minutes, suggest a workout"
"What haven't I trained this week?"
```

**View history:**
```
"Last chest workout"
"Running history this month"
"Volume for legs last week"
```

## Exercise Types

- Strength (weight x reps x sets)
- Cardio (distance, time, pace)
- Flexibility (duration, type)
- Sports (activity, duration)

## PR Tracking

Automatic detection for:
- 1RM (estimated from rep maxes)
- Volume PRs
- Distance/time records
- Streak achievements

## Tips

- Be consistent with exercise names for accurate tracking
- Say "same as last time" to repeat a previous workout
- Ask "recovery status" for suggested rest days
- Use "bodyweight" for exercises without weights
- Export to CSV anytime
