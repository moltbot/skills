---
name: todoist
description: Manage Todoist tasks, projects, labels, and sections via the `todoist` CLI. Use when a user asks to add/complete/list tasks, show today's tasks, search tasks, or manage projects.
homepage: https://github.com/buddyh/todoist-cli
metadata: {"clawdbot":{"emoji":"✅","requires":{"bins":["todoist"]},"install":[{"id":"brew","kind":"brew","formula":"buddyh/tap/todoist","bins":["todoist"],"label":"Install todoist (brew)"},{"id":"go","kind":"go","module":"github.com/buddyh/todoist-cli/cmd/todoist@latest","bins":["todoist"],"label":"Install todoist-cli (go)"}]}}
---

# Todoist CLI

Use `todoist` to manage tasks, projects, labels, and sections via the Todoist REST API.

## Tasks

```bash
# Today's tasks (default)
todoist

# List tasks
todoist tasks --all
todoist tasks --filter "p1"           # High priority
todoist tasks --filter "overdue"      # Overdue
todoist tasks -p Work                 # By project

# Add task
todoist add "Buy groceries"
todoist add "Call mom" -d tomorrow
todoist add "Urgent" -P 1 -d "today 5pm" -l urgent

# Complete / reopen
todoist complete <task-id>
todoist done <task-id>
todoist reopen <task-id>

# Update task
todoist update <task-id> --due "next monday"
todoist update <task-id> -P 2

# Move task (Kanban)
todoist move <task-id> --section "In Progress"
todoist move <task-id> --project "Work"

# Delete task
todoist delete <task-id>

# View / search
todoist view <task-id>
todoist search "meeting"
```

## Projects

```bash
todoist projects
todoist projects add "New Project" --color blue
```

## Labels

```bash
todoist labels
todoist labels add urgent --color red
```

## Sections

```bash
todoist sections -p Work
todoist sections add "In Progress" -p Work
```

## Comments

```bash
todoist comment <task-id>
todoist comment <task-id> "This is a note"
```

## Completed Tasks

```bash
todoist completed
todoist completed --since 2024-01-01 --limit 50
```

## Command Reference

| Command | Description |
|---------|-------------|
| `todoist` | Show today's tasks |
| `todoist tasks` | List tasks with filters |
| `todoist add` | Create a new task |
| `todoist complete` | Mark task complete |
| `todoist done` | Alias for complete |
| `todoist reopen` | Reopen completed task |
| `todoist move` | Move task to section/project |
| `todoist update` | Update a task |
| `todoist delete` | Delete a task |
| `todoist view` | View task details |
| `todoist search` | Search tasks |
| `todoist projects` | List/manage projects |
| `todoist labels` | List/manage labels |
| `todoist sections` | List/manage sections |
| `todoist comment` | View/add comments |
| `todoist completed` | Show completed tasks |

## Priority Mapping

| CLI | Todoist |
|-----|---------|
| `-P 1` | p1 (highest) |
| `-P 2` | p2 |
| `-P 3` | p3 |
| `-P 4` | p4 (lowest) |

## Notes

- All commands support `--json` for machine-readable output
- Auth: `todoist auth` or set `TODOIST_API_TOKEN`
