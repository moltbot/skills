---
name: gkeep
description: Google Keep notes via gkeepapi. List, search, create, and manage notes.
homepage: https://github.com/kiwiz/gkeepapi
metadata: {"clawdbot":{"emoji":"📝","requires":{"bins":["gkeep"]}}}
---

# gkeep

CLI wrapper for Google Keep using gkeepapi (unofficial API).

## Setup

Login with your Google account:
```bash
gkeep login your.email@gmail.com
```

**Important:** Use an [App Password](https://myaccount.google.com/apppasswords), not your regular password. 2FA must be enabled.

## Commands

List notes:
```bash
gkeep list
gkeep list --limit 10
```

Search:
```bash
gkeep search "shopping"
```

Get a specific note:
```bash
gkeep get <note_id>
```

Create a note:
```bash
gkeep create "Title" "Body text here"
```

Archive:
```bash
gkeep archive <note_id>
```

Delete (trash):
```bash
gkeep delete <note_id>
```

## Notes

- This uses an unofficial API that reverse-engineers Google Keep
- Could break if Google changes their internal API
- Token stored in `~/.config/gkeep/token.json`
- Active project with recent updates (as of Jan 2026)
