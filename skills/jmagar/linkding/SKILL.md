---
name: linkding
version: 1.0.1
description: Manage bookmarks with Linkding. Use when the user asks to "save a bookmark", "add link", "search bookmarks", "list my bookmarks", "find saved links", "tag a bookmark", "archive bookmark", "check if URL is saved", "list tags", "create bundle", or mentions Linkding bookmark management.
---

# Linkding Bookmark Manager

Query and manage bookmarks via the Linkding REST API.

## Setup

Config: `~/.clawdbot/credentials/linkding/config.json`

```json
{
  "url": "https://linkding.example.com",
  "apiKey": "your-api-token"
}
```

Get your API token from Linkding Settings page.

## Quick Reference

### List/Search Bookmarks

```bash
# List recent bookmarks
./scripts/linkding-api.sh bookmarks

# Search bookmarks
./scripts/linkding-api.sh bookmarks --query "python tutorial"

# List archived
./scripts/linkding-api.sh bookmarks --archived

# Filter by date
./scripts/linkding-api.sh bookmarks --modified-since "2025-01-01T00:00:00Z"
```

### Create Bookmark

```bash
# Basic
./scripts/linkding-api.sh create "https://example.com"

# With metadata
./scripts/linkding-api.sh create "https://example.com" \
  --title "Example Site" \
  --description "A great resource" \
  --tags "reference,docs"

# Archive immediately
./scripts/linkding-api.sh create "https://example.com" --archived
```

### Check if URL Exists

```bash
./scripts/linkding-api.sh check "https://example.com"
```

Returns existing bookmark data if found, plus scraped metadata.

### Update Bookmark

```bash
./scripts/linkding-api.sh update 123 --title "New Title" --tags "newtag1,newtag2"
```

### Archive/Unarchive

```bash
./scripts/linkding-api.sh archive 123
./scripts/linkding-api.sh unarchive 123
```

### Delete

```bash
./scripts/linkding-api.sh delete 123
```

### Tags

```bash
# List all tags
./scripts/linkding-api.sh tags

# Create tag
./scripts/linkding-api.sh tag-create "mytag"
```

### Bundles (saved searches)

```bash
# List bundles
./scripts/linkding-api.sh bundles

# Create bundle
./scripts/linkding-api.sh bundle-create "Work Resources" \
  --search "productivity" \
  --any-tags "work,tools" \
  --excluded-tags "personal"
```

## Response Format

All responses are JSON. Bookmark object:

```json
{
  "id": 1,
  "url": "https://example.com",
  "title": "Example",
  "description": "Description",
  "notes": "Personal notes",
  "is_archived": false,
  "unread": false,
  "shared": false,
  "tag_names": ["tag1", "tag2"],
  "date_added": "2020-09-26T09:46:23.006313Z",
  "date_modified": "2020-09-26T16:01:14.275335Z"
}
```

## Common Patterns

**Save current page for later:**
```bash
./scripts/linkding-api.sh create "$URL" --tags "toread" --unread
```

**Quick search and display:**
```bash
./scripts/linkding-api.sh bookmarks --query "keyword" --limit 10 | jq -r '.results[] | "\(.title) - \(.url)"'
```

**Bulk tag update:** Update via API PATCH with new tag_names array.
