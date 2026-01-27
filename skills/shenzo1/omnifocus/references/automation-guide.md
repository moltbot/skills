# OmniFocus Automation Guide

## Automation Methods

OmniFocus supports multiple automation approaches:

### 1. JavaScript for Automation (JXA) - Recommended

**Pros:**
- Native JavaScript syntax
- Direct access to OmniFocus data model
- No compilation needed
- Can be run from command line via `osascript -l JavaScript`
- Returns structured data easily (JSON)

**Cons:**
- macOS only
- Requires OmniFocus to be installed

**Usage:**
```bash
osascript -l JavaScript script.js arg1 arg2
```

### 2. AppleScript

**Pros:**
- Well-documented
- Mature and stable
- Widely supported

**Cons:**
- Less familiar syntax
- More verbose
- Harder to parse output

**Not used in this skill** (JXA is preferred)

### 3. Omni Automation (Plugin-based)

**Pros:**
- Cross-platform (iOS/macOS)
- Can be installed as plugins
- Rich UI integration

**Cons:**
- More complex setup
- Requires plugin packaging
- Not suitable for command-line automation

**Not used in this skill** (designed for command-line use)

### 4. SQLite Database Access

**Pros:**
- Direct database access
- Can read without running OmniFocus
- Very fast for queries

**Cons:**
- **Read-only** (modifying database directly can corrupt it)
- Database format may change
- Requires finding database location
- Complex schema

**Use case:** Reading tasks only, when OmniFocus isn't running

**Database location:**
```
~/Library/Group Containers/34YW5XSRB7.com.omnigroup.OmniFocus/Library/Caches/com.omnigroup.OmniFocus3.MacRelease/OmniFocusDatabase2
```

## Script Architecture

All scripts in this skill use JXA and follow this pattern:

```javascript
#!/usr/bin/env osascript -l JavaScript

function run(args) {
    const of = Application('OmniFocus');
    const doc = of.defaultDocument;
    
    // Parse arguments
    // Perform operations
    // Return results (usually JSON)
    
    return JSON.stringify(result, null, 2);
}
```

## Available Scripts

### add_task.js
Add a new task to inbox.

**Usage:**
```bash
osascript -l JavaScript add_task.js "Task name" ["Note text"] ["Due date YYYY-MM-DD"]
```

**Examples:**
```bash
osascript -l JavaScript add_task.js "Buy groceries"
osascript -l JavaScript add_task.js "Review document" "Check for errors"
osascript -l JavaScript add_task.js "Submit report" "Q1 analysis" "2026-01-31"
```

### list_tasks.js
List tasks with various filters.

**Usage:**
```bash
osascript -l JavaScript list_tasks.js [filter] [limit]
```

**Filters:**
- `inbox` - Tasks in inbox
- `available` - Available (unblocked) tasks
- `flagged` - Flagged tasks
- `due-soon` - Due within 3 days
- `overdue` - Past due date
- `all` - All incomplete tasks

**Examples:**
```bash
osascript -l JavaScript list_tasks.js available 10
osascript -l JavaScript list_tasks.js overdue
osascript -l JavaScript list_tasks.js inbox
```

**Output:** JSON array of tasks with properties:
- name
- id
- note
- dueDate (ISO string or null)
- flagged
- project
- tags

### search_tasks.js
Search tasks by keyword in name or note.

**Usage:**
```bash
osascript -l JavaScript search_tasks.js "search term" [limit]
```

**Examples:**
```bash
osascript -l JavaScript search_tasks.js "meeting"
osascript -l JavaScript search_tasks.js "client" 5
```

### complete_task.js
Mark a task as complete by name.

**Usage:**
```bash
osascript -l JavaScript complete_task.js "Task name"
```

**Examples:**
```bash
osascript -l JavaScript complete_task.js "Buy groceries"
```

**Note:** Searches inbox first, then all tasks. Completes the first match.

### update_task.js
Update task properties.

**Usage:**
```bash
osascript -l JavaScript update_task.js "Task name" [--note "text"] [--due "YYYY-MM-DD"] [--flag true/false]
```

**Examples:**
```bash
osascript -l JavaScript update_task.js "Review code" --note "Check PR #123"
osascript -l JavaScript update_task.js "Submit report" --due "2026-02-01"
osascript -l JavaScript update_task.js "Important task" --flag true
osascript -l JavaScript update_task.js "Task" --note "Updated" --due "2026-01-31" --flag true
```

### get_stats.js
Get OmniFocus statistics.

**Usage:**
```bash
osascript -l JavaScript get_stats.js
```

**Output:** JSON object with counts:
- total - All tasks
- incomplete - Incomplete tasks
- inbox - Tasks in inbox
- flagged - Flagged tasks
- overdue - Overdue tasks
- dueSoon - Due within 3 days
- available - Available (unblocked) tasks
- blocked - Blocked tasks

## Common Workflows

### Daily Review
```bash
# Get statistics
osascript -l JavaScript get_stats.js

# Check overdue tasks
osascript -l JavaScript list_tasks.js overdue

# Check what's due soon
osascript -l JavaScript list_tasks.js due-soon 10

# Review inbox
osascript -l JavaScript list_tasks.js inbox
```

### Task Management
```bash
# Add a task
osascript -l JavaScript add_task.js "New task" "With note" "2026-01-31"

# Search for tasks
osascript -l JavaScript search_tasks.js "project"

# Complete a task
osascript -l JavaScript complete_task.js "Completed task"

# Update task details
osascript -l JavaScript update_task.js "Task name" --flag true --due "2026-02-01"
```

### Focused Work Lists
```bash
# Get available tasks (next actions)
osascript -l JavaScript list_tasks.js available 10

# Get flagged tasks (priorities)
osascript -l JavaScript list_tasks.js flagged
```

## Error Handling

Scripts handle common errors:
- Missing required arguments
- Task not found
- Invalid date formats
- OmniFocus not running

Check script output for error messages.

## Integration Tips

### Parse JSON Output
```bash
# Using jq
osascript -l JavaScript list_tasks.js available | jq '.[].name'

# Using Python
osascript -l JavaScript get_stats.js | python3 -c "import sys, json; print(json.load(sys.stdin)['inbox'])"
```

### Use with Clawdbot
When using these scripts through Clawdbot:
1. Always use full paths to scripts
2. Parse JSON output for structured data
3. Present results in user-friendly format
4. Batch operations when possible (e.g., list then complete)

### Shell Functions
Add to your shell profile for quick access:
```bash
of-add() {
    osascript -l JavaScript ~/.../scripts/add_task.js "$@"
}

of-list() {
    osascript -l JavaScript ~/.../scripts/list_tasks.js "$@"
}

of-stats() {
    osascript -l JavaScript ~/.../scripts/get_stats.js
}
```
