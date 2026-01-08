---
name: hevy
description: Query workout data from Hevy including workouts, routines, exercises, and history. Use when user asks about their workouts, gym sessions, exercise progress, or fitness routines.
homepage: https://hevy.com
metadata:
  clawdbot:
    emoji: "🏋️"
    requires:
      bins: ["hevy"]
      env: ["HEVY_API_KEY"]
---

# Hevy CLI

CLI for the Hevy workout tracking API. Query workouts, routines, exercises, and track progress.

## Installation

```bash
npm install -g hevy-cli
```

## Setup

Requires Hevy Pro subscription for API access.

1. Get API key from https://hevy.com/settings?developer
2. Set environment variable: `export HEVY_API_KEY="your-key"`

## Commands

### Status

```bash
hevy status                # Check configuration and connection
hevy status --json
```

### Workouts

```bash
hevy workouts              # List recent workouts (default 5)
hevy workouts -n 10        # List 10 recent workouts
hevy workouts --all        # Fetch all workouts
hevy workouts --kg         # Show weights in kg (default is lbs)
hevy workout <id>          # Show detailed workout
hevy workouts --json       # Output as JSON
```

### Routines

```bash
hevy routines              # List all routines
hevy routine <id>          # Show detailed routine
hevy routines --json
```

### Exercises

```bash
hevy exercises                      # List all exercises
hevy exercises -s "bench press"     # Search by name
hevy exercises --muscle chest       # Filter by muscle group
hevy exercises --custom             # Show only custom exercises
hevy exercises --json
```

### Exercise History

```bash
hevy history <exercise-id>          # Show history for exercise
hevy history <exercise-id> -n 50    # Limit entries
hevy history <exercise-id> --json
```

### Stats

```bash
hevy count                 # Total workout count
hevy folders               # List routine folders
```

## Usage Examples

**User: "What did I do at the gym today?"**
```bash
hevy workouts -n 1
```

**User: "Show me my bench press progress"**
```bash
hevy exercises -s "bench press" --json  # Get exercise ID
hevy history <exercise-id>              # View history
```

**User: "What routines do I have?"**
```bash
hevy routines
```

**User: "How many workouts have I done?"**
```bash
hevy count
```

**User: "Find exercises for legs"**
```bash
hevy exercises --muscle quadriceps
hevy exercises --muscle hamstrings
```

## Notes

- Weights default to lbs, use `--kg` for kilograms
- Exercise IDs are UUIDs shown in detailed views and JSON output
- API has rate limits; avoid excessive `--all` usage
