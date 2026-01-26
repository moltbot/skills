---
name: ticktick
description: TickTick task manager integration. List projects and tasks, create new tasks, complete tasks, delete tasks. Use when the user wants to manage their to-do list, add reminders, check pending tasks, or mark tasks as done. Requires OAuth setup via `ticktick-setup`.
---

# TickTick Integration

Manage tasks via TickTick's Open API.

## Setup

First time only:

1. Go to https://developer.ticktick.com and create an app
2. Add redirect URI: `http://127.0.0.1:8765/callback`
3. Run setup:

```bash
ticktick-setup <client_id> <client_secret>
```

4. Open the auth URL in browser, authorize, paste the callback URL

## Usage

```bash
# List projects
ticktick projects

# List all tasks
ticktick tasks

# List tasks from specific project
ticktick tasks <project_id>

# Add task (inbox)
ticktick add "Buy milk"

# Add task to project with due date
ticktick add "Buy milk" --project <id> --due 2026-01-30

# Complete task
ticktick complete <project_id> <task_id>

# Delete task
ticktick delete <project_id> <task_id>
```

## API Reference

Base URL: `https://api.ticktick.com/open/v1`

| Endpoint | Method | Description |
|----------|--------|-------------|
| /project | GET | List all projects |
| /project/{id}/data | GET | Get project with tasks |
| /task | POST | Create task |
| /task/{id} | POST | Update task |
| /project/{pid}/task/{tid}/complete | POST | Complete task |
| /task/{pid}/{tid} | DELETE | Delete task |

## Task Object

```json
{
  "title": "Task title",
  "content": "Description", 
  "projectId": "project-id",
  "dueDate": "2026-01-25T12:00:00+0000",
  "priority": 0,
  "tags": ["tag1"]
}
```

Priority: 0=none, 1=low, 3=medium, 5=high
