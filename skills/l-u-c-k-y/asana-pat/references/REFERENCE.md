# Reference and implementation notes

This skill is intentionally **dependency-free** (no npm dependencies) and uses:

- Node.js built-in `fetch`, `FormData`, `Blob`
- Asana REST API v1 (`https://app.asana.com/api/1.0`)

## Asana API references

Authentication / PAT:

- Personal access token (PAT): https://developers.asana.com/docs/personal-access-token
- Authentication overview (PAT notes): https://developers.asana.com/docs/authentication

Rich text:

- Rich text guide: https://developers.asana.com/docs/rich-text

Key behaviors used by this skill:

- Rich text is sent via `html_*` fields (e.g., `html_notes`), wrapped in `<body>...</body>`.
- Mentions/links can be created with `<a data-asana-gid="..."/>` and Asana expands it.
- For @-mention notifications in stories: add follower first (and wait briefly) before creating the story.
- Inline images are stored as attachments; to embed inline you reference the attachment GID via `<img data-asana-gid="..."/>`.

Attachments:

- Upload attachment reference: https://developers.asana.com/reference/createattachmentforobject

Key behaviors:

- Uploads are `multipart/form-data`.
- `download_url` is short-lived; prefer `permanent_url` for stable links.

## Moltbot / Clawdbot references

Skills:

- Skills: https://docs.molt.bot/tools/skills
- Skills config: https://docs.molt.bot/tools/skills-config
- ClawdHub: https://docs.molt.bot/tools/clawdhub

## Design decisions

- **No Portfolios**: portfolio support is intentionally omitted (premium feature; not required).
- **Custom fields are first-class**: task create/update supports `--custom_fields` JSON.
- **Timeline support**: create/update tasks and projects with start/due fields; includes timeline shifting helpers.
- **Project brief support**: includes `upsert-project-brief` to keep briefs current.
- **Mentions done right**: `comment` supports `--ensure_followers` and a short wait to align with Asana mention notification guidance.
- **Output is JSON-only**: designed for agents and automation.
