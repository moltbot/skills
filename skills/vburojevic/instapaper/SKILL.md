---
name: instapaper
description: "Use when operating the instapaper-cli (ip) tool or troubleshooting it: authenticating, listing/exporting/importing bookmarks, bulk mutations, folders/highlights/text, choosing output formats (ndjson/json/plain), cursor-based sync, and interpreting stderr-json/exit codes for automation."
---

# Instapaper CLI

## Overview

Use this skill to handle Instapaper operations via the `ip` CLI, especially when you need reliable automation, structured output, or troubleshooting guidance.

## Workflow (fast path)

1. Verify setup
   - Ensure `INSTAPAPER_CONSUMER_KEY` and `INSTAPAPER_CONSUMER_SECRET` are set or passed during login.
   - Prefer `--password-stdin` for auth; never store the password.
   - Run `ip doctor --json` (or `ip auth status`) before long jobs.

2. Pick output format for automation
   - Default is `--ndjson` (streaming, one object per line).
   - Use `--json` for single objects or compact arrays.
   - Use `--plain` for stable, line-oriented text.
   - Add `--stderr-json` for structured errors and `--progress-json` for long runs.

3. Read data deterministically
   - Use `list` or `export` with `--cursor`/`--cursor-dir` or `--since/--until` bounds.
   - Use `--updated-since` for incremental sync.
   - Use `--select` for client-side filtering when the API does not support it.

4. Mutate safely
   - Use `--dry-run` or `--idempotent` when possible.
   - For bulk actions, use `--ids` or `--stdin` and consider `--batch`.
   - Deletions require explicit confirmation flags.

5. Handle extras
   - Text view: `ip text` for article HTML.
   - Highlights: `ip highlights list/add/delete`.
   - Folders: `ip folders list/add/delete/order`.

6. Troubleshoot
   - Use `--debug` for request timing and status.
   - Use `--stderr-json` and map `exit_code` to action.

## Command reference

Read these when you need exact flags, formats, or examples:

- `references/commands.md`: command-by-command examples for auth, list/export/import, mutations, folders, highlights, and text.
- `references/output-and-sync.md`: output formats, progress streams, cursor/bounds syntax, and filtering.
- `references/errors.md`: exit codes and structured stderr error codes.

## Guardrails

- Avoid `--format table` for parsing; it is for humans only.
- Use `--output` or `--output-dir` for large exports to avoid stdout pressure.
- Prefer `--password-stdin` on Windows to avoid echoing passwords.
