# Asana (PAT) skill for Moltbot / Clawdbot

A clean, dependency-free Asana CLI skill that authenticates with an **Asana Personal Access Token (PAT)** and supports both:

- **Personal productivity**: capture, triage, manage “My Tasks”.
- **Project management**: project briefs, status updates, dependencies/blockers, timelines, custom fields, and structured stakeholder updates.

This skill is intended to be published on **ClawdHub** and used via Moltbot/Clawdbot skills loading.

## What’s included

- `scripts/asana.mjs`: Node.js CLI (no external npm deps)
- `SKILL.md`: skill instructions + metadata
- `references/REFERENCE.md`: reference links and design notes
- `LICENSE.txt`: MIT

## Requirements

- Node.js **18+** (Node 20/22 recommended)
- An Asana PAT (acts as the user who created it)

## Security note

A PAT has the same permissions in the API as the user who generated it has in the Asana UI. Treat it like a password:
store securely, do not commit to git, and rotate if exposed.

## Configure in Moltbot/Clawdbot

This skill requires:

- `ASANA_PAT`

### Skills config

Use skills config to inject env vars (especially when the agent is sandboxed).

Docs:
- https://docs.molt.bot/tools/skills-config
- https://docs.molt.bot/tools/skills

Example snippet:

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

## Usage

Get command help:

```bash
node ./skills/asana-pat/scripts/asana.mjs help
```

### Common personal flows

List tasks assigned to me:

```bash
node ./skills/asana-pat/scripts/asana.mjs tasks-assigned --assignee me --all
```

Create a task:

```bash
node ./skills/asana-pat/scripts/asana.mjs create-task --workspace <workspace_gid> --name "Call the accountant" --due_on 2026-02-01
```

### Common PM flows

Get a project dashboard snapshot:

```bash
node ./skills/asana-pat/scripts/asana.mjs project-dashboard --project <project_gid> --all
```

Upsert a project brief (rich text):

```bash
node ./skills/asana-pat/scripts/asana.mjs upsert-project-brief <project_gid> --title "Weekly Brief" --html_text "<body><h1>Status</h1><ul><li>On track</li></ul></body>"
```

Create a project status update:

```bash
node ./skills/asana-pat/scripts/asana.mjs create-status-update --parent <project_gid> --status_type on_track --title "Weekly update" --text "All milestones are on track."
```

### Rich text mentions

Asana rich text uses XML-valid HTML wrapped in `<body>...</body>`.
To mention/link an object you can use `<a data-asana-gid="..."/>` and Asana will expand it (when you have access).

For comments, mention notifications typically require the user to already be a follower. This CLI supports that pattern:

```bash
node ./skills/asana-pat/scripts/asana.mjs comment <task_gid> --html_text "<body>FYI <a data-asana-gid=\"<user_gid>\"/></body>" --ensure_followers <user_gid>
```

### Attachments and inline images

Upload an image to a task:

```bash
node ./skills/asana-pat/scripts/asana.mjs upload-attachment --parent <task_gid> --file ./screenshot.png
```

List attachments on the task (to get the attachment GID):

```bash
node ./skills/asana-pat/scripts/asana.mjs attachments <task_gid> --all
```

Append that image inline into the task description:

```bash
node ./skills/asana-pat/scripts/asana.mjs append-inline-image --task <task_gid> --attachment <attachment_gid>
```

## Publishing to ClawdHub

Docs:
- https://docs.molt.bot/tools/clawdhub

Typical workflows:

- Search skills: `clawdhub search "asana"`
- Install: `clawdhub install <skill-slug>`
- Publish your skill folder: `clawdhub publish` (see docs for auth + versioning)

## License

MIT. See `LICENSE`.
