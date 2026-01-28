# AGENTS.md

This repository is an **AgentSkill** for Clawdbot/ClawdHub: **Asana (PAT)**.
It is intentionally small, dependency-free, and designed to work in sandboxed environments.

If you are a coding agent working in this repo, follow the guidance below.

## Project overview

Goal: provide a robust Node.js CLI (`scripts/asana.mjs`) that lets an agent:

- Authenticate with **Asana Personal Access Token (PAT)** (Bearer token)
- Work across **multiple workspaces/projects** (contexts)
- Support both:
  - **Personal task management** (my tasks, quick capture, triage)
  - **Project manager workflows** (project brief, status updates, timelines, custom fields, attachments, stakeholder comments)

Non-goals:

- Do not add Asana Portfolio features (premium) unless explicitly requested.
- Do not bake “bot personality” into the skill; keep it generic and configurable by the user/bot prompt.

## Repo layout

- `SKILL.md` — Clawdbot/ClawdHub skill definition + usage guide
- `README.md` — human-facing quickstart (install/config/run)
- `scripts/asana.mjs` — the only executable; dependency-free Node ESM CLI
- `references/REFERENCE.md` — API notes, links, and gotchas
- `LICENSE`

## Setup commands

No package manager required.

- Ensure Node.js **18+** (needs built-in `fetch` and ESM).
- Smoke test (requires `ASANA_PAT` in env):

  - Who am I:
    - `node scripts/asana.mjs me`

  - List workspaces:
    - `node scripts/asana.mjs workspaces`

## How to run checks

There is no test suite yet. If you change behavior, run at least:

- `node scripts/asana.mjs me`
- `node scripts/asana.mjs workspaces`
- `node scripts/asana.mjs projects --workspace <gid>`
- A write-path check in a throwaway task/project (create/update/comment + attachment upload)

## Conventions & patterns

### CLI behavior

- Always output **JSON** to stdout for machine parsing.
- Exit non-zero with a clear error message on failures.
- Preserve backwards compatibility of command names/flags where possible.
  - If you must change a flag, support the old one as an alias for at least one release.

### API calls

- Prefer explicit `opt_fields` defaults for predictable output.
- Handle pagination where it matters (Asana typically uses `limit` + `offset`).
- Treat 402 responses as “feature not available / premium required” and return a clear error.

### Code style

- Node ESM (`.mjs`), standard library only.
- Use small, testable functions (request helpers, parsing helpers, storage helpers).
- Keep “business logic” separate from transport (HTTP request) functions.

## Security

- **Never** commit tokens, PATs, or user config.
- Do not print PATs in logs or error messages.
- When adding new commands that accept user-supplied text/HTML, avoid echoing secrets back in errors.

## Rich text, mentions, and attachments

- Rich text uses Asana’s XML-valid HTML conventions (`html_*` fields).
- Mentions should be paired with follower management when notification delivery matters.
- Attachment uploads must use `multipart/form-data` and should return both `gid` and `permanent_url` if available.

## Release & publishing

- This skill is published to **ClawdHub** from the skill folder (no GitHub repo required).
- When preparing a release:
  - Update `README.md` / `SKILL.md` docs if command surface changed
  - Bump the semver version used during `clawdhub publish`
  - Validate install into a clean workspace via `clawdhub install <slug>`

## When unsure

Prefer minimal, composable primitives over many narrow “shortcut” commands.
Add helpers only when they reduce multi-step orchestration or statefulness (e.g., events sync tokens).
