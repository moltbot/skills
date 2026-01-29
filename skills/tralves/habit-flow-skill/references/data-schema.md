# HabitFlow Data Schema

## Storage Location

All data is stored in: `~/clawd/habit-flow-data/`

## File Structure

```
~/clawd/habit-flow-data/
├── habits.json              # All habits metadata
├── logs/                    # One JSONL file per habit per year
│   ├── h_abc123_2026.jsonl
│   └── h_def456_2026.jsonl
└── config.json              # User configuration
```

---

## habits.json Schema

Root object containing all habits:

```json
{
  "habits": [
    {
      "id": "h_abc123",
      "userId": "default-user",
      "name": "Morning meditation",
      "description": "10 minutes of mindfulness",
      "category": "mindfulness",
      "frequency": "daily",
      "targetCount": 1,
      "targetUnit": "session",
      "reminderSettings": {
        "enabled": true,
        "times": ["07:00"],
        "message": "Time for meditation"
      },
      "isActive": true,
      "startDate": "2026-01-20T08:00:00Z",
      "endDate": null,
      "currentStreak": 7,
      "longestStreak": 14,
      "createdAt": "2026-01-20T08:00:00Z",
      "updatedAt": "2026-01-28T07:15:00Z"
    }
  ]
}
```

### Field Descriptions

- **id**: Unique identifier with `h_` prefix
- **userId**: User identifier (default: "default-user")
- **name**: Habit name/title
- **description**: Optional detailed description
- **category**: One of: health, fitness, productivity, learning, social, creative, mindfulness, spirituality, other
- **frequency**: One of: daily, weekly, monthly, custom
- **targetCount**: Number of completions expected per period
- **targetUnit**: What is being counted (e.g., session, glasses, miles, pages)
- **reminderSettings**: Optional reminder configuration
  - **enabled**: Whether reminders are active
  - **times**: Array of reminder times in HH:MM format
  - **message**: Optional custom reminder message
- **isActive**: Whether habit is currently active (false = archived)
- **startDate**: When habit tracking started
- **endDate**: When habit was archived (if archived)
- **currentStreak**: Current consecutive completion streak
- **longestStreak**: Best streak ever achieved
- **createdAt**: Creation timestamp
- **updatedAt**: Last update timestamp

---

## Log Files Schema (JSONL)

One line per log entry in `logs/{habit_id}_{year}.jsonl`:

```json
{"id":"log_001","habitId":"h_abc123","userId":"default-user","logDate":"2026-01-28T00:00:00Z","status":"completed","actualCount":1,"targetCount":1,"unit":"session","notes":"Felt focused","metadata":{"mood":"happy","difficulty":"easy"},"createdAt":"2026-01-28T07:30:00Z"}
```

### Field Descriptions

- **id**: Unique log identifier with `log_` prefix
- **habitId**: Reference to parent habit
- **userId**: User identifier
- **logDate**: Date of completion (ISO format)
- **status**: One of:
  - `completed`: Target met or exceeded
  - `partial`: Some progress but didn't meet target
  - `missed`: No completion recorded
  - `skipped`: Intentionally skipped (vacation, rest day)
- **actualCount**: Actual number of completions
- **targetCount**: Target number for this entry
- **unit**: Unit of measurement
- **notes**: Optional user notes
- **metadata**: Optional additional data (mood, difficulty, etc.)
- **createdAt**: When log was created
- **updatedAt**: When log was last updated (optional)

---

## config.json Schema

User configuration:

```json
{
  "timezone": "America/Los_Angeles",
  "activePersona": "flex",
  "userId": "default-user"
}
```

### Field Descriptions

- **timezone**: IANA timezone identifier for reminder scheduling
- **activePersona**: Currently active coaching persona (default: "flex")
- **userId**: User identifier (default: "default-user")

---

## Data Integrity Rules

1. **One log per day**: Only the last log for a given date counts toward streak calculation
2. **Habit ID uniqueness**: Habit IDs must be unique across all habits
3. **Log ID uniqueness**: Log IDs must be unique within a habit's logs
4. **Date validation**: All dates must be valid ISO 8601 format
5. **Status validation**: Status must be one of the four allowed values
6. **Cascade rules**: Archiving a habit does not delete its logs
7. **Year partitioning**: Logs are partitioned by year for performance

---

## File Operations

### Reading
- Parse JSON for habits.json and config.json
- Parse JSONL line-by-line for log files
- Handle missing files gracefully (return empty defaults)

### Writing
- Use pretty-print JSON for habits.json and config.json (2-space indent)
- Append-only for log files (one JSON object per line)
- Atomic writes where possible

### Updates
- For habits: Load, modify, save entire JSON file
- For logs: Read all lines, update matching log, rewrite file
- For config: Load, modify, save entire JSON file
