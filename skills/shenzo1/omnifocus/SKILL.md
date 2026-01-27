---
name: omnifocus
description: "Manage OmniFocus tasks via JavaScript for Automation (JXA) scripts. Use when the user asks Clawdbot to interact with OmniFocus, including - (1) Adding tasks to inbox, (2) Listing or searching tasks (inbox, available, flagged, overdue, due soon), (3) Completing tasks, (4) Updating task properties (notes, due dates, flags), (5) Getting OmniFocus statistics, (6) Reporting on task status, or (7) Acting on tasks in OmniFocus based on user queries."
---

# OmniFocus Task Management

Automate OmniFocus task management via JavaScript for Automation (JXA) scripts.

## Quick Start

All scripts are located in the `scripts/` directory and use JXA. Run with:

```bash
osascript -l JavaScript scripts/<script-name>.js [args]
```

**Key Scripts:**
- `add_task.js` - Add task to inbox
- `list_tasks.js` - List tasks with filters
- `search_tasks.js` - Search tasks by keyword
- `complete_task.js` - Complete a task by name
- `update_task.js` - Update task properties
- `get_stats.js` - Get OmniFocus statistics

## Core Operations

### Adding Tasks

```bash
osascript -l JavaScript scripts/add_task.js "Task name" ["Note"] ["YYYY-MM-DD"]
```

**Examples:**
```bash
osascript -l JavaScript scripts/add_task.js "Buy groceries"
osascript -l JavaScript scripts/add_task.js "Review doc" "Check sections 1-3"
osascript -l JavaScript scripts/add_task.js "Submit report" "Q1" "2026-01-31"
```

**Returns:** Task ID

### Listing Tasks

```bash
osascript -l JavaScript scripts/list_tasks.js [filter] [limit]
```

**Filters:**
- `inbox` - Inbox tasks
- `available` - Available (unblocked) tasks (default)
- `flagged` - Flagged tasks
- `due-soon` - Due within 3 days
- `overdue` - Past due
- `all` - All incomplete tasks

**Returns:** JSON array with task details (name, id, note, dueDate, flagged, project, tags)

### Searching Tasks

```bash
osascript -l JavaScript scripts/search_tasks.js "keyword" [limit]
```

Searches task names and notes. Case-insensitive.

**Returns:** JSON array of matching tasks

### Completing Tasks

```bash
osascript -l JavaScript scripts/complete_task.js "Task name"
```

Searches inbox first, then all tasks. Completes first match.

### Updating Tasks

```bash
osascript -l JavaScript scripts/update_task.js "Task name" [--note "text"] [--due "YYYY-MM-DD"] [--flag true/false]
```

**Examples:**
```bash
osascript -l JavaScript scripts/update_task.js "Review" --note "Added notes"
osascript -l JavaScript scripts/update_task.js "Submit" --due "2026-02-01"
osascript -l JavaScript scripts/update_task.js "Important" --flag true
```

### Getting Statistics

```bash
osascript -l JavaScript scripts/get_stats.js
```

**Returns:** JSON with counts:
- total, incomplete, inbox
- flagged, overdue, dueSoon
- available, blocked

## Usage Guidelines

### When Responding to User Queries

1. **List tasks** before acting on them to confirm targets
2. **Parse JSON output** for structured processing
3. **Present results** in user-friendly format (not raw JSON)
4. **Confirm operations** before completing or modifying tasks
5. **Handle errors gracefully** (task not found, etc.)

### Common Patterns

**Daily Review:**
```bash
# Statistics overview
osascript -l JavaScript scripts/get_stats.js

# What needs attention
osascript -l JavaScript scripts/list_tasks.js overdue
osascript -l JavaScript scripts/list_tasks.js due-soon
```

**Task Queries:**
```bash
# "What's in my inbox?"
osascript -l JavaScript scripts/list_tasks.js inbox

# "What are my next actions?"
osascript -l JavaScript scripts/list_tasks.js available 10

# "Show my flagged tasks"
osascript -l JavaScript scripts/list_tasks.js flagged
```

**Task Management:**
```bash
# "Add a task to call John"
osascript -l JavaScript scripts/add_task.js "Call John"

# "Find tasks about the project"
osascript -l JavaScript scripts/search_tasks.js "project"

# "Mark 'Buy milk' as complete"
osascript -l JavaScript scripts/complete_task.js "Buy milk"

# "Flag the review task"
osascript -l JavaScript scripts/update_task.js "Review" --flag true
```

### Output Handling

Scripts return JSON for structured data. When presenting to users:

1. Parse the JSON
2. Format results clearly
3. Summarize counts and key information
4. Highlight urgent items (overdue, due soon)

**Example response format:**
```
Found 3 overdue tasks:
• Submit Q1 report (due Jan 20)
• Review contract (due Jan 23)
• Call vendor (due Jan 24)

And 5 tasks due in the next 3 days:
• [list tasks]

Would you like me to flag or update any of these?
```

### Error Handling

Common errors:
- **Task not found** - Double-check name or search first
- **No tasks** - Empty result, report clearly
- **Invalid date** - Use YYYY-MM-DD format
- **OmniFocus not running** - Scripts require OmniFocus

### Multi-Step Operations

**Find then act:**
```bash
# 1. Search for task
RESULTS=$(osascript -l JavaScript scripts/search_tasks.js "meeting")

# 2. Parse and identify target task name

# 3. Complete the task
osascript -l JavaScript scripts/complete_task.js "Team meeting notes"
```

## Technical Reference

For detailed API information and advanced usage, see:
- **JXA API Reference:** `references/jxa-api.md` - Object model and methods
- **Automation Guide:** `references/automation-guide.md` - Detailed script documentation and workflows

Read these files when:
- Building complex queries
- Understanding OmniFocus data model
- Implementing custom workflows
- Debugging scripts

## Requirements

- macOS
- OmniFocus installed and running
- Scripts have execute permissions (chmod +x)

## Notes

- Scripts use JXA (JavaScript for Automation), not AppleScript
- Task matching is case-sensitive for exact names, case-insensitive for searches
- Date format: YYYY-MM-DD (ISO 8601)
- All operations are performed on the default OmniFocus document
- Scripts are read-only safe except for add, complete, and update operations
