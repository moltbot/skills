---
name: asana
description: "Integrate Asana with Clawdbot via the Asana REST API. Use when you need to list/search/create/update Asana tasks/projects/workspaces, or to set up Asana OAuth (authorization code grant) for a personal local-only integration (OOB/manual code paste)."
---

# Asana (Clawdbot skill)

This skill is designed for a **personal local-only** Asana integration using **OAuth** with an **out-of-band/manual code paste** flow.

## What this skill provides
- A small Node CLI to:
  - generate the Asana authorize URL
  - exchange an authorization code for access/refresh tokens
  - auto-refresh the access token
  - make basic API calls (e.g. `/users/me`, `/workspaces`, tasks)

## Setup (OAuth, OOB/manual code)

### 0) Create an Asana app
In Asana Developer Console (My apps):
- Create app
- Enable scopes you will need (typical: `tasks:read`, `tasks:write`, `projects:read`)
- Set redirect URI to the OOB value (manual code):
  - `urn:ietf:wg:oauth:2.0:oob`

### 1) Provide credentials (two options)

**Option A (recommended for Clawdbot):** save to a local credentials file:
```bash
node scripts/configure.mjs --client-id "..." --client-secret "..."
```
This writes `~/.clawdbot/asana/credentials.json`.

**Option B:** set environment variables (shell/session):
- `ASANA_CLIENT_ID`
- `ASANA_CLIENT_SECRET`

### 2) Run OAuth
From the repo root:

1) Print the authorize URL:
```bash
node scripts/oauth_oob.mjs authorize
```
2) Open the printed URL, click **Allow**, copy the code.
3) Exchange code and save tokens locally:
```bash
node scripts/oauth_oob.mjs token --code "PASTE_CODE_HERE"
```

Tokens are stored at:
- `~/.clawdbot/asana/token.json`

## Chat usage (support both explicit + natural language)

You can use either:
- **Explicit commands**: start the message with `/asana ...`
- **Natural language**: e.g. “list tasks assigned to me”

For Clawdbot, implement the mapping by translating the user request into the appropriate `asana_api.mjs` command.

Examples:
- `/asana tasks-assigned` → `tasks-assigned --assignee me`
- “list tasks assigned to me” → `tasks-assigned --assignee me`
- “list all tasks in <project>” → resolve `<project>` to a project gid, then `tasks-in-project --project <gid>`
- “list tasks due date from 2026-01-01 to 2026-01-15” → `search-tasks --assignee me --due_on.after 2026-01-01 --due_on.before 2026-01-15`

(Optional helper) `scripts/asana_chat.mjs` can map common phrases to a command skeleton.

## Using the API helper

Sanity check (who am I):
```bash
node scripts/asana_api.mjs me
```

List workspaces:
```bash
node scripts/asana_api.mjs workspaces
```

Set a default workspace (optional):
```bash
node scripts/asana_api.mjs set-default-workspace --workspace <workspace_gid>
```
After that, you can omit `--workspace` for commands that support it.

List projects in a workspace (explicit):
```bash
node scripts/asana_api.mjs projects --workspace <workspace_gid>
```
List projects using the default workspace:
```bash
node scripts/asana_api.mjs projects
```

List tasks in a project:
```bash
node scripts/asana_api.mjs tasks-in-project --project <project_gid>
```

List tasks assigned to me (workspace required by Asana):
```bash
node scripts/asana_api.mjs tasks-assigned --workspace <workspace_gid> --assignee me
```
Or using the default workspace:
```bash
node scripts/asana_api.mjs tasks-assigned --assignee me
```

Search tasks (advanced search):
```bash
node scripts/asana_api.mjs search-tasks --workspace <workspace_gid> --text "release" --assignee me
# also supports convenience: --project <project_gid>
```

View a task:
```bash
node scripts/asana_api.mjs task <task_gid>
```

Mark a task complete:
```bash
node scripts/asana_api.mjs complete-task <task_gid>
```

Update a task:
```bash
node scripts/asana_api.mjs update-task <task_gid> --name "New title" --due_on 2026-02-01
```

Comment on a task:
```bash
node scripts/asana_api.mjs comment <task_gid> --text "Update: shipped"
```

Create a task:
```bash
node scripts/asana_api.mjs create-task --workspace <workspace_gid> --name "Test task" --notes "from clawdbot" --projects <project_gid>
```

## Notes / gotchas
- OAuth access tokens expire; refresh tokens are used to obtain new access tokens.
- If you later want multi-user support, replace OOB with a real redirect/callback.
- Don’t log tokens.
