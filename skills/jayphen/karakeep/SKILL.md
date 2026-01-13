---
name: karakeep
description: Manage bookmarks and links in a Karakeep instance. Use when the user wants to save links, list recent bookmarks, or search their collection. Triggers on phrases like "hoard this link", "save to karakeep", or "search my bookmarks".
metadata: {"clawdbot":{"emoji":"📦","requires":{"bins":["uv"]}}}
---

# Karakeep Skill

Save and search bookmarks in a Karakeep instance.

## Setup

First, configure your instance URL and API key:
```bash
uv run --with requests skills/karakeep/scripts/karakeep-cli.py login --url <instance_url> <api_key>
```

## Commands

### Save a Link
Add a URL to your collection:
```bash
uv run --with requests skills/karakeep/scripts/karakeep-cli.py add <url>
```

### List Bookmarks
Show the most recent bookmarks:
```bash
uv run --with requests skills/karakeep/scripts/karakeep-cli.py list --limit 10
```

### Search Bookmarks
Find bookmarks matching a query. Supports complex syntax like `is:fav`, `title:word`, `#tag`, `after:YYYY-MM-DD`, etc.:
```bash
uv run --with requests skills/karakeep/scripts/karakeep-cli.py list --search "title:react is:fav"
```

## Troubleshooting
- Ensure `KARAKEEP_API_KEY` (or `HOARDER_API_KEY`) is set or run `login`.
- Verify the instance URL is correct in the script or config (`~/.config/karakeep/config.json`).
