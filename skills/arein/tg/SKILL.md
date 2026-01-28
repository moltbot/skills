---
name: tg
description: Telegram CLI for reading, searching, and sending messages. Use when the user asks about Telegram messages, wants to check inbox, search chats, send messages, or look up contacts and groups.
---

# Telegram CLI

Fast Telegram CLI for reading, searching, and sending messages.

## When to Use

Use this skill when the user:
- Asks to check Telegram messages or inbox
- Wants to search Telegram for a topic/keyword
- Wants to send a Telegram message to someone
- Asks about a Telegram group, contact, or chat
- Wants to see unread messages
- Needs to look up group members or admins

## Install

```bash
npm install -g @cyberdrk/tg
```

Or from source:
```bash
cd ~/Code/cyberdrk305/telegram && npm install && npm run build && npm link
```

## Authentication

First-time setup requires API credentials from https://my.telegram.org/apps

```bash
tg auth
```

## Commands

### Reading
```bash
tg inbox                               # Unread messages summary
tg chats                               # List all chats
tg read "ChatName" -n 50               # Read last 50 messages
tg read "ChatName" --since "1h"        # Messages from last hour
tg read @username -n 20                # Read DM with user
tg search "query" --chat "ChatName"    # Search within chat
tg search "query" --all                # Search all chats
```

### Writing
```bash
tg send @username "message"            # Send DM
tg send "GroupName" "message"          # Send to group
tg reply "ChatName" 12345 "response"   # Reply to message ID
```

### Contacts & Groups
```bash
tg contact @username                   # Get contact info
tg members "GroupName"                 # List group members
tg admins "GroupName"                  # List admins only
tg groups --admin                      # Groups where you're admin
```

### Status
```bash
tg whoami                              # Show logged-in account
tg check                               # Verify session
```

## Output Formats

All commands support `--json` for structured output suitable for processing:

```bash
tg inbox --json                        # JSON format
tg read "Chat" --json                  # JSON with messages array
tg chats --json                        # JSON with chat list
```

## Examples

Check inbox:
```bash
tg inbox
```

Read recent messages from a chat:
```bash
tg read "MetaDAO Community" -n 20
```

Search for a topic:
```bash
tg search "futarchy" --chat "MetaDAO"
```

Send a message:
```bash
tg send @username "Hello, checking in!"
```

## Notes

- Chat names can be partial matches (e.g., "MetaDAO" matches "MetaDAO Community")
- Usernames must start with @ (e.g., @username)
- Messages are returned in reverse chronological order (newest first)
- The `--since` flag accepts formats like "1h", "30m", "7d"
