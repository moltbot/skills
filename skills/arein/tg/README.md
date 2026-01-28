# tg - Telegram CLI

Fast Telegram CLI for reading, searching, and sending messages. Designed for both interactive use and AI agent integration.

## Installation

```bash
npm install -g @cyberdrk/tg
```

Or install from source:

```bash
git clone https://github.com/cyberdrk305/telegram.git
cd telegram
npm install
npm run build
npm link
```

## Authentication

First, get your API credentials:
1. Go to https://my.telegram.org/apps
2. Log in with your phone number
3. Create a new application
4. Copy the `api_id` and `api_hash`

Then authenticate:

```bash
tg auth
```

## Commands

### Auth & Status

```bash
tg whoami                              # Show logged-in account
tg check                               # Verify session/credentials
```

### Reading

```bash
tg chats                               # List all chats
tg chats --type group                  # Filter by type (user, group, supergroup, channel)
tg read "MetaDAO Community" -n 50      # Read last 50 messages
tg read "MetaDAO" --since "1h"         # Messages from last hour
tg read @username -n 20                # Read DM with user
tg search "futarchy" --chat "MetaDAO"  # Search within chat
tg search "futarchy" --all             # Search all chats
tg inbox                               # Unread messages summary
```

### Writing

```bash
tg send @username "Hello"              # Send DM
tg send "GroupName" "Hello everyone"   # Send to group
tg reply "ChatName" 12345 "Response"   # Reply to message ID
```

### Contacts & Groups

```bash
tg contact @username                   # Get contact info
tg members "GroupName"                 # List group members
tg admins "GroupName"                  # List admins only
tg groups                              # List all groups
tg groups --admin                      # Groups where you're admin
```

### Utilities

```bash
tg sync --days 7                       # Sync last 7 days to markdown
tg sync --chat "MetaDAO" --days 30     # Sync specific chat
```

## Output Formats

All read commands support multiple output formats:

```bash
tg chats --json                        # JSON (for scripts/AI)
tg read "Chat" --markdown              # Markdown format
tg inbox --plain                       # Plain text (no colors)
```

## Configuration

Configuration is stored in `~/.config/tg/`:
- `config.json` - API credentials and session
- Session data is encrypted and stored securely

## Claude Code Skill

This package includes a Claude Code skill for AI agent integration. To install:

```bash
# Symlink the skill to your Claude skills directory
mkdir -p ~/.claude/skills
ln -s $(npm root -g)/@cyberdrk/tg/SKILL.md ~/.claude/skills/tg.md
```

Or if installed from source:
```bash
ln -s ~/Code/cyberdrk305/telegram/SKILL.md ~/.claude/skills/tg.md
```

## Development

```bash
npm install
npm run build
npm run dev                            # Watch mode
```

## License

MIT
