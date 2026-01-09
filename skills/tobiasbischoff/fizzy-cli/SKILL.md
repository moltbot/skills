---
name: fizzy-cli
description: Use the fizzy-cli tool to authenticate and manage Fizzy kanban boards, cards, comments, tags, columns, users, and notifications from the command line. Apply this skill when you need to list, create, update, or delete Fizzy resources or when scripting Fizzy workflows.
metadata:
  author: tobiasbischoff
  version: "1.0"
---

# Fizzy CLI Skill

Use this skill to operate the Fizzy kanban board via the `fizzy-cli` command. It covers authentication, configuration, and common CRUD workflows.

## Quick Start

1) Authenticate
- Token:
  - `fizzy-cli auth login --token $FIZZY_TOKEN`
- Magic link:
  - `fizzy-cli auth login --email user@example.com`
  - If non-interactive, pass `--code ABC123`.

2) Set defaults
- Account only: `fizzy-cli account set 897362094`
- Persist base URL + account: `fizzy-cli config set --base-url https://app.fizzy.do --account 897362094`

3) Verify access
- `fizzy-cli auth status`
- `fizzy-cli account list`

## Common Tasks

### Boards
- List: `fizzy-cli board list`
- Create: `fizzy-cli board create --name "Roadmap"`
- Update: `fizzy-cli board update <board-id> --name "New name"`
- Delete: `fizzy-cli board delete <board-id>`

### Cards
- List cards on a board:
  - `fizzy-cli card list --board-id <board-id>`
- Create card:
  - `fizzy-cli card create --board-id <board-id> --title "Add dark mode" --description "Switch theme"`
- Upload image:
  - `fizzy-cli card create --board-id <board-id> --title "Add hero" --image ./hero.png`
- Update card:
  - `fizzy-cli card update <card-number> --title "Updated" --tag-id <tag-id>`
- Move to Not Now:
  - `fizzy-cli card not-now <card-number>`
- Close / reopen:
  - `fizzy-cli card close <card-number>`
  - `fizzy-cli card reopen <card-number>`
- Triage / untriage:
  - `fizzy-cli card triage <card-number> --column-id <column-id>`
  - `fizzy-cli card untriage <card-number>`

### Comments
- List comments:
  - `fizzy-cli comment list <card-number>`
- Create comment:
  - `fizzy-cli comment create <card-number> --body "Looks good"`

### Tags, Columns, Users, Notifications
- Tags: `fizzy-cli tag list`
- Columns: `fizzy-cli column list --board-id <board-id>`
- Users: `fizzy-cli user list`
- Notifications: `fizzy-cli notification list --unread`

## Output Modes
- Default: human-readable tables.
- Machine output:
  - `--json` for raw API JSON.
  - `--plain` for stable line-based output.

## Config & Auth Notes
- Config file: `~/.config/fizzy/config.json`.
- Env vars: `FIZZY_BASE_URL`, `FIZZY_TOKEN`, `FIZZY_ACCOUNT`, `FIZZY_CONFIG`.
- Precedence: flags > env > config file > defaults.

## Troubleshooting
- If requests fail with auth errors, run `fizzy-cli auth status` and re-login.
- If account is missing, set it via `fizzy-cli account set <slug>` or `fizzy-cli config set --account <slug>`.
- Use `fizzy-cli --help` or `fizzy-cli help <command>` for full usage.
