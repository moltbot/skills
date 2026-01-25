---
name: beeper
description: Search chats, list/read messages, and send messages via Beeper Desktop using the beeper-cli.
metadata: {"clawdbot":{"requires":{"bins":["beeper"]}}}
---

# beeper

Use this skill when you need to search chats, list/read messages, or send messages via **Beeper Desktop**.

## What this is
A CLI wrapper around the Beeper Desktop API. No MCP, no curl — just `beeper` commands.

Requires [beeper-cli](https://github.com/foeken/beeper-cli).

## Prereqs
- Beeper Desktop running with API enabled: Settings > Developers
- [beeper-cli](https://github.com/foeken/beeper-cli) installed
- Env var: `BEEPER_ACCESS_TOKEN` set (get from Beeper Desktop: Settings > Developers > API Access Token)

## Install beeper-cli

Download from [releases](https://github.com/foeken/beeper-cli/releases), or build:

```bash
go install github.com/foeken/beeper-cli@latest
```

## Commands

### Accounts
```bash
beeper accounts list
beeper accounts list -o table
```

### Chats
```bash
# List all chats (sorted by last activity)
beeper chats list

# Search chats
beeper chats search --query "John"
beeper chats search --query "project" --type group

# Get specific chat
beeper chats get "<chatID>"

# Archive
beeper chats archive "<chatID>"

# Create
beeper chats create --account-id "telegram:123" --participant "user1" --type dm

# Reminders
beeper chats reminders create "<chatID>" --time "2025-01-26T10:00:00Z"
beeper chats reminders delete "<chatID>"
```

### Messages
```bash
# List messages in a chat
beeper messages list "<chatID>"

# Search messages
beeper messages search --query "dinner"
beeper messages search --query "dinner" --limit 10
beeper messages search --query "meeting" --sender me
beeper messages search --query "budget" --after "2025-01-01T00:00:00Z"
beeper messages search --chat-ids "<chatID>" --media-type image

# Send a message
beeper messages send "<chatID>" "Hello!"

# Send with reply
beeper messages send "<chatID>" "Thanks!" --reply-to "<messageID>"

# Edit a message
beeper messages edit "<chatID>" "<messageID>" "Corrected text"
```

### Assets (attachments)
```bash
# Upload a file
beeper assets upload /path/to/image.png

# Download an asset
beeper assets download "mxc://beeper.local/abc123" --output /path/to/save.jpg

# Send with attachment (upload first)
beeper assets upload /path/to/photo.jpg  # returns uploadID
beeper messages send "<chatID>" "Check this!" --upload-id "<uploadID>"
```

### Other
```bash
# Focus Beeper window
beeper focus
beeper focus --chat-id "<chatID>"

# Global search
beeper search "important"
```

## Output formats
```bash
beeper chats list -o json   # default
beeper chats list -o table  # human-readable
```

## Workflow
1. Find the chat: `beeper chats search --query "Name"`
2. Read messages: `beeper messages list "<chatID>"`
3. Search content: `beeper messages search --query "phrase"`
4. Send: `beeper messages send "<chatID>" "message"`

## Safety
- Store `BEEPER_ACCESS_TOKEN` securely (e.g., in a password manager)
- When quoting messages, include only what's needed
- Confirm message text before sending unless explicit
