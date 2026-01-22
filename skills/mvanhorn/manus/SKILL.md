---
name: manus
description: Create and manage AI agent tasks via Manus API. Manus is an autonomous AI agent that can browse the web, use tools, and deliver complete work products.
homepage: https://manus.im
metadata: {"clawdbot":{"emoji":"🤖","requires":{"env":["MANUS_API_KEY"]},"primaryEnv":"MANUS_API_KEY"}}
---

# Manus AI Agent

Use the Manus API to create autonomous AI tasks. Manus can browse the web, use tools, and deliver complete results (reports, code, analysis, etc.).

## API Base

`https://api.manus.ai/v1`

## Authentication

Header: `API_KEY: <your-key>`

Set via:
- `MANUS_API_KEY` env var
- Or `skills.manus.apiKey` in clawdbot config

## Create a Task

```bash
curl -X POST "https://api.manus.ai/v1/tasks" \
  -H "API_KEY: $MANUS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Research the top 5 competitors in the AI agent space and create a comparison table",
    "agentProfile": "manus-1.6"
  }'
```

Response:
```json
{
  "task_id": "abc123",
  "task_title": "Competitor Research",
  "task_url": "https://manus.im/app/task/abc123",
  "share_url": "https://manus.im/share/abc123"
}
```

## Agent Profiles

| Profile | Description |
|---------|-------------|
| `manus-1.6` | Standard (default) |
| `manus-1.6-lite` | Faster, lighter tasks |
| `manus-1.6-max` | Complex, thorough tasks |

## Task Modes

| Mode | Description |
|------|-------------|
| `chat` | Conversational mode |
| `adaptive` | Auto-selects best approach |
| `agent` | Full autonomous agent mode |

## Get Task Status

```bash
curl "https://api.manus.ai/v1/tasks/{task_id}" \
  -H "API_KEY: $MANUS_API_KEY"
```

Status values: `pending`, `running`, `completed`, `failed`

## List Tasks

```bash
curl "https://api.manus.ai/v1/tasks" \
  -H "API_KEY: $MANUS_API_KEY"
```

## Optional Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `attachments` | array | Files/images to include |
| `taskMode` | string | `chat`, `adaptive`, or `agent` |
| `connectors` | array | Enable integrations (Gmail, Notion, etc.) |
| `hideInTaskList` | bool | Hide from Manus webapp |
| `createShareableLink` | bool | Generate public share URL |
| `interactiveMode` | bool | Allow follow-up questions |
| `projectId` | string | Associate with a project |

## Example: Research Task

```bash
curl -X POST "https://api.manus.ai/v1/tasks" \
  -H "API_KEY: $MANUS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Find the top 10 Y Combinator startups from W24 batch working on AI agents. Create a summary with funding info.",
    "agentProfile": "manus-1.6-max",
    "taskMode": "agent",
    "createShareableLink": true
  }'
```

## Docs

- API Reference: https://open.manus.ai/docs
- Main Docs: https://manus.im/docs
