---
name: todozi
description: "Todozi Eisenhower matrix API client + LangChain tools. Create matrices, tasks, goals, notes; list/search/update; bulk operations; webhooks. Categories: do, done, dream, delegate, defer, dont."
---

# Todozi

## Quick Start

**As SDK:**
```python
from skills.todozi.scripts.todozi import TodoziClient

client = TodoziClient(api_key="your_key")
matrices = await client.list_matrices()
task = await client.create_task("Build feature", priority="high")
await client.complete_item(task.id)
```

**As LangChain Tools:**
```python
from skills.todozi.scripts.todozi import TODOZI_TOOLS
# Add to agent tools list
```

## SDK Overview

| Class | Purpose |
|-------|---------|
| `TodoziClient` | Async API client |
| `TodoziTask` | Task dataclass |
| `TodoziMatrix` | Matrix dataclass |
| `TodoziStats` | Stats dataclass |

### Environment

```bash
export TODOZI_API_KEY=your_key
export TODOZI_BASE=https://todozi.com/api  # optional, default provided
```

## Client Methods

### Matrices

```python
# List all matrices
matrices = await client.list_matrices()

# Create matrix
matrix = await client.create_matrix("Work", category="do")

# Get matrix
matrix = await client.get_matrix("matrix_id")

# Delete matrix
await client.delete_matrix("matrix_id")
```

### Tasks / Goals / Notes

```python
# Create task
task = await client.create_task(
    title="Review PR",
    priority="high",
    due_date="2026-02-01",
    description="Check the new feature",
    tags=["pr", "review"],
)

# Create goal
goal = await client.create_goal("Ship v2", priority="high")

# Create note
note = await client.create_note("Remember to call Mom")

# Get item
item = await client.get_item("item_id")

# Update item
updated = await client.update_item("item_id", {"title": "New title", "priority": "low"})

# Complete item
await client.complete_item("item_id")

# Delete item
await client.delete_item("item_id")
```

### Lists

```python
# List tasks (with filters)
tasks = await client.list_tasks(status="todo", priority="high")

# List goals
goals = await client.list_goals()

# List notes
notes = await client.list_notes()

# List everything
all_items = await client.list_all()
```

### Search

**Searches only:** title, description, tags (NOT content)

```python
results = await client.search(
    query="pr",
    type_="task",          # task, goal, or note
    status="pending",
    priority="high",
    category="do",
    tags=["review"],
    limit=10,
)
```

### Bulk Operations

```python
# Update multiple
await client.bulk_update([
    {"id": "id1", "title": "Updated"},
    {"id": "id2", "priority": "low"},
])

# Complete multiple
await client.bulk_complete(["id1", "id2"])

# Delete multiple
await client.bulk_delete(["id1", "id2"])
```

### Webhooks

```python
# Create webhook
webhook = await client.create_webhook(
    url="https://yoururl.com/todozi",
    events=["item.created", "item.completed"],
)

# List webhooks
webhooks = await client.list_webhooks()

# Update webhook
await client.update_webhook(webhook_id, url, ["*"])

# Delete webhook
await client.delete_webhook(webhook_id)
```

### System

```python
# Stats
stats = await client.get_stats()

# Health check
health = await client.health_check()

# Validate API key
valid = await client.validate_api_key()

# Register (get API key)
keys = await client.register(webhook="https://url.com")
```

## LangChain Tools

The skill provides `@tool` decorated functions for agent integration:

```python
from skills.todozi.scripts.todozi import TODOZI_TOOLS

# Available tools:
# - todozi_create_task(title, priority, due_date, description, thread_id, tags)
# - todozi_list_tasks(status, priority, thread_id, limit)
# - todozi_complete_task(task_id)
# - todozi_get_stats()
# - todozi_search(query, type_, status, priority, limit)
# - todozi_list_matrices()
```

## Categories

| Category | Description |
|----------|-------------|
| `do` | Do now (urgent + important) |
| `delegate` | Delegate (urgent + not important) |
| `defer` | Defer (not urgent + important) |
| `done` | Completed items |
| `dream` | Goals/dreams (not urgent + not important) |
| `dont` | Don't do (neither) |

## Common Patterns

**Auto-create default matrix:**
```python
task = await client.create_task("My task")  # Creates "Default" matrix if needed
```

**Get stats with completion rate:**
```python
stats = await client.get_stats()
rate = stats.completed_tasks / stats.total_tasks * 100 if stats.total_tasks > 0 else 0
```

**Search with multiple filters:**
```python
results = await client.search("feature", type_="task", status="pending", priority="high")
```

**Complete multiple tasks:**
```python
tasks = await client.list_tasks(status="todo")
ids = [t.id for t in tasks[:5]]
await client.bulk_complete(ids)
```
