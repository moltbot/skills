---
name: drafts
description: Manage Drafts app notes via CLI on macOS. Create, view, list, edit, append, prepend, and run actions on drafts. Use when a user asks to create a note, list drafts, search drafts, or manage their Drafts inbox. IMPORTANT - Drafts app must be running on macOS for this to work.
homepage: https://github.com/nerveband/drafts
metadata: {"clawdbot":{"emoji":"📋","os":["darwin"],"requires":{"bins":["drafts"]}}}
---

# Drafts CLI

Manage [Drafts](https://getdrafts.com) notes from the terminal on macOS.

## IMPORTANT REQUIREMENTS

> **This CLI ONLY works on macOS with Drafts app running.**

- **macOS only** - Uses AppleScript, will not work on Linux/Windows
- **Drafts must be RUNNING** - The app must be open for any command to work
- **Drafts Pro required** - Automation features require Pro subscription

If commands fail or hang, first check: `open -a Drafts`

## Setup

Install via Go:
```bash
go install github.com/nerveband/drafts/cmd/drafts@latest
```

Or build from source:
```bash
git clone https://github.com/nerveband/drafts
cd drafts && go build ./cmd/drafts
```

## Commands

### Create a Draft

```bash
# Simple draft
drafts create "Meeting notes for Monday"

# With tags
drafts create "Shopping list" -t groceries -t todo

# Flagged draft
drafts create "Urgent reminder" -f

# Create in archive
drafts create "Reference note" -a
```

### List Drafts

```bash
# List inbox (default)
drafts list

# List archived drafts
drafts list -f archive

# List trashed drafts
drafts list -f trash

# List all drafts
drafts list -f all

# Filter by tag
drafts list -t mytag
```

### Get a Draft

```bash
# Get specific draft
drafts get <uuid>

# Get active draft (currently open in Drafts)
drafts get
```

### Modify Drafts

```bash
# Prepend text
drafts prepend "New first line" -u <uuid>

# Append text
drafts append "Added at the end" -u <uuid>

# Replace entire content
drafts replace "Completely new content" -u <uuid>
```

### Edit in Editor

```bash
drafts edit <uuid>
```

### Run Actions

```bash
# Run action on text
drafts run "Copy" "Text to copy to clipboard"

# Run action on existing draft
drafts run "Copy" -u <uuid>
```

### Get Schema

```bash
# Full schema for LLM integration
drafts schema

# Schema for specific command
drafts schema create
```

## Output Format

**JSON (default)** - All commands return structured JSON:
```json
{
  "success": true,
  "data": {
    "uuid": "ABC123",
    "content": "Note content",
    "title": "Note title",
    "tags": ["tag1", "tag2"],
    "folder": "inbox"
  }
}
```

**Plain text** - Human-readable output:
```bash
drafts list --plain
```

## Common Workflows

### Quick Capture
```bash
drafts create "Remember to call dentist tomorrow" -t reminder
```

### Daily Journal
```bash
drafts append "$(date): Completed project review" -u <journal-uuid>
```

### Search and Review
```bash
# List all drafts with a specific tag
drafts list -t work

# Get full content of a draft
drafts get <uuid>
```

## Troubleshooting

**Commands fail or return empty:**
1. Is Drafts running? → `open -a Drafts`
2. Is Drafts Pro active? → Automation requires Pro
3. Permissions granted? → System Settings > Privacy > Automation

**Commands hang:**
- Check if Drafts is showing a dialog

## Notes

- macOS ONLY (AppleScript-based)
- Drafts app MUST be running
- Requires Drafts Pro subscription
- All UUIDs are Drafts-generated identifiers
- Tags are case-sensitive

## Version

Latest (from go install)
