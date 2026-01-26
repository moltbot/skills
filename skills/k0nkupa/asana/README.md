# clawdbot-asana-skill

Asana OAuth (local-only) + task/project commands for Clawdbot.

This repo contains a small **Asana skill** (an AgentSkill folder) that you can:
- use locally on your Clawdbot host
- publish/share so other Clawdbot users can install and run it

It uses **Asana OAuth 2.0 Authorization Code Grant** with an **out-of-band (OOB) / manual code paste** redirect URI:

- `urn:ietf:wg:oauth:2.0:oob`

No public callback server is required.

---

## What you get

Commands (via Node scripts):
- Auth helpers: generate authorize URL, exchange code, refresh access token
- List workspaces, list projects, list tasks
- View task, update task, mark complete, comment

Tokens and config are stored locally under:
- `~/.clawdbot/asana/credentials.json` (client id + secret)
- `~/.clawdbot/asana/token.json` (OAuth tokens)
- `~/.clawdbot/asana/config.json` (default workspace)

---

## Prerequisites

- Node.js 22+
- An Asana account with access to the workspace(s) you want

---

## 1) Create an Asana “Custom App” (Developer Console)

1. Open the Asana Developer Console:
   - https://app.asana.com/0/my-apps
2. Create a new app.
3. **Distribution (important):**
   - Your OAuth app must be **available in the workspace** the user is authorizing from.
   - In the developer console, configure **Manage distribution** so the app is available to the target workspace(s).
   - If distribution/workspace availability is misconfigured, authorization can fail even if the URL is correct.
4. OAuth settings:
   - **Redirect URI:**
     - `urn:ietf:wg:oauth:2.0:oob`
   - Copy the **Client ID** and **Client Secret**.

### Scopes (must match what you request)

In the Asana Developer Console, go to **OAuth → Permission scopes** and enable the scopes you plan to request.

Important rules:
- The scopes you request in the authorize URL **must be a subset of** the scopes enabled in the console.
- If you request a scope that is not enabled, you’ll get a `forbidden_scopes` error.

Recommended “full task management” scope set:

- `tasks:read` `tasks:write` `tasks:delete`
- `projects:read` `projects:write`
- `attachments:read` `attachments:write`
- `custom_fields:read` `custom_fields:write`
- `tags:read` `tags:write`
- `task_custom_types:read`
- `teams:read`
- `users:read`
- `workspaces:read`

---

## 2) Configure credentials locally

Save your Asana OAuth client id/secret to a local file:

```bash
node scripts/configure.mjs \
  --client-id "YOUR_CLIENT_ID" \
  --client-secret "YOUR_CLIENT_SECRET"
```

This writes:
- `~/.clawdbot/asana/credentials.json`

(Alternative: you can set `ASANA_CLIENT_ID` and `ASANA_CLIENT_SECRET` as environment variables, but the credentials file is recommended for Clawdbot.)

---

## 3) Authorize (OOB) and save tokens

### 3.1 Generate the authorize URL

```bash
node scripts/oauth_oob.mjs authorize \
  --scope "tasks:read tasks:write projects:read"
```

Open the printed URL in your browser, click **Allow**, then copy the code.

### 3.2 Exchange the code for tokens

```bash
node scripts/oauth_oob.mjs token --code "PASTE_CODE_HERE"
```

This writes:
- `~/.clawdbot/asana/token.json`

---

## 4) (Optional) set a default workspace

List workspaces:

```bash
node scripts/asana_api.mjs workspaces
```

Set default workspace:

```bash
node scripts/asana_api.mjs set-default-workspace --workspace <workspace_gid>
```

This writes:
- `~/.clawdbot/asana/config.json`

Commands that require a workspace will use the default if `--workspace` is omitted.

---

## 5) Common commands

Who am I:
```bash
node scripts/asana_api.mjs me
```

List projects (default workspace):
```bash
node scripts/asana_api.mjs projects
```

List tasks assigned to me:
```bash
node scripts/asana_api.mjs tasks-assigned --assignee me
```

List all tasks in a project:
```bash
node scripts/asana_api.mjs tasks-in-project --project <project_gid>
```

View a task:
```bash
node scripts/asana_api.mjs task <task_gid>
```

Mark complete:
```bash
node scripts/asana_api.mjs complete-task <task_gid>
```

Comment:
```bash
node scripts/asana_api.mjs comment <task_gid> --text "Update: shipped"
```

Advanced search (workspace required; default is used if set):
```bash
node scripts/asana_api.mjs search-tasks --text "release" --assignee me
```

---

## Install into Clawdbot (local)

If your Clawdbot workspace is `/Users/tony/clawd`, copy the skill folder into:

- `/Users/tony/clawd/skills/asana/`

and restart Clawdbot if needed.

---

## Notes

- Access tokens expire; the scripts will refresh using the refresh token.
- Keep `credentials.json` and `token.json` secret.
- If you publish this, document that users must configure **distribution** + **scopes** in the Asana console to match what they request in `authorize`.
