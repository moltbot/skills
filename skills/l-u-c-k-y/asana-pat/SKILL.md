---
name: asana-pat
description: Manage Asana tasks and projects via Personal Access Token (PAT): briefs, status updates, timelines, custom fields, attachments.
license: MIT
allowed-tools: ["exec"]
user-invocable: true
metadata: {"clawdbot":{"skillKey":"asana-pat","primaryEnv":"ASANA_PAT","requires":{"env":["ASANA_PAT"]},"homepage":"https://developers.asana.com/docs/personal-access-token"}}
---

# Asana (PAT) skill

This skill provides a dependency-free Node.js CLI that lets the agent use the Asana REST API with a **Personal Access Token (PAT)**.

It is designed to support both:

- **Personal task management** (quick capture, triage, “my tasks”, lightweight planning), and
- **Project management workflows** (project briefs, status updates, timelines, dependencies/blockers, custom fields, stakeholder communication).

## Setup

### 1) Create a PAT

Create an Asana personal access token and store it securely. PATs are long-lived and act as the user who created them.

- Asana PAT docs: https://developers.asana.com/docs/personal-access-token
- Asana auth overview: https://developers.asana.com/docs/authentication

### 2) Configure the skill env var

This skill requires:

- `ASANA_PAT` (required): Asana PAT (Bearer token)

In Moltbot/Clawdbot, configure skill env vars via **skills config** (do not rely on host env vars when sandboxed).

- Skills config docs: https://docs.molt.bot/tools/skills-config

Example config snippet (conceptual):

```jsonc
{
  "skills": {
    "entries": {
      "asana-pat": {
        "enabled": true,
        "apiKey": "ASANA_PAT",
        "env": {
          "ASANA_PAT": "YOUR_TOKEN"
        }
      }
    }
  }
}
```

## How to call

All commands are executed via the CLI script:

```bash
node {baseDir}/scripts/asana.mjs <command> [args] [--flags]
```

Run:

```bash
node {baseDir}/scripts/asana.mjs help
```

for the full command list.

## Key capabilities

### Core: tasks + projects

- List tasks assigned to a user (`tasks-assigned`)
- List tasks in a project (`tasks-in-project`)
- Create/update/complete tasks (`create-task`, `update-task`, `complete-task`)
- Search tasks with filters (`search-tasks`)
- Read/update project metadata (`project`, `update-project`)
- Sections, project memberships, followers (common PM operations)

### Project manager conveniences

- **Project brief**: read + “upsert” (create or update) (`project-brief`, `upsert-project-brief`)
- **Status updates**: list, create, delete (`status-updates`, `create-status-update`, `delete-status-update`)
- **Dependencies / blockers**: query + modify (`dependencies`, `dependents`, `add-dependencies`, `remove-dependencies`, `project-blockers`)
- **Timeline shifting**: move dates by N days (`shift-task-dates`, `shift-project-tasks`)
- **Project dashboard**: computed summary snapshot (`project-dashboard`)

### Custom fields

Custom fields are first-class in PM usage. This skill supports:

- Listing a project’s custom fields (`project-custom-fields`)
- Reading a custom field definition (`custom-field`)
- Setting task custom fields when creating/updating tasks (`--custom_fields <json>`)

### Activity / updates (feed-like)

Asana does not provide a simple “Inbox API” for notifications, but you can approximate “recent changes” via:

- `events` (incremental changes for a resource; maintains a local sync token)
- `search-tasks` with `modified_at.after`, `created_at.after`, etc.

## Rich text formatting and @-mentions

Asana supports “rich text” fields using **XML-valid HTML fragments** wrapped in a `<body>` tag. The rich text version of a field is the same name prefixed by `html_` (e.g., `notes` -> `html_notes`).

Supported objects include tasks (`html_notes`), stories/comments (`html_text`), project briefs (`html_text`), and status updates (`html_text`).

- Rich text guide: https://developers.asana.com/docs/rich-text

### Creating a mention

To link/mention Asana objects (users, tasks, projects, etc.) in rich text, you can send a minimal link tag such as:

```html
<body>FYI <a data-asana-gid="USER_GID"/></body>
```

Asana will expand it into a full link when you have access.

### Ensuring mention notifications

When adding a comment (story), @-mentions only reliably generate notifications if the mentioned user is already a **follower** (or assignee) of the task. The recommended pattern is: add follower first, wait briefly, then create the story.

This skill’s `comment` command supports that pattern via:

- `--ensure_followers <csv>` (user gids/emails/me)
- `--wait_ms 2000` (optional)
- `--no_wait true` (optional)

## Attachments and images

### Uploading files (including images)

You can upload files (including images) as Asana attachments using:

- `upload-attachment --parent <task|project|project_brief_gid> --file <path>`

Asana’s attachments endpoint supports uploading a file (multipart/form-data) or creating an external URL attachment. Files are subject to size limits (commonly 100MB).

- Attachments reference: https://developers.asana.com/reference/createattachmentforobject

### Listing and inspecting attachments

- `attachments <parent_gid>`
- `attachment <attachment_gid>`

Note: attachment `download_url` values are short-lived (minutes). Prefer `permanent_url` for a stable Asana link.

### Inline images in task notes / project briefs

Asana rich text can include inline images via `<img>` tags. Inline images are stored as attachments; to embed them you must first upload/attach the image to the same target object, then reference the attachment GID in rich text.

This skill includes:

- `append-inline-image --attachment <attachment_gid> --task <task_gid>`
- `append-inline-image --attachment <attachment_gid> --project_brief <project_brief_gid>`

It verifies by default that the attachment is attached to the target object.

## Notes and non-goals

- Portfolio operations are intentionally omitted (premium feature; out of scope).
- This skill uses PAT auth only (not OAuth).
- Keep `opt_fields` tight for performance: request only what you need.
