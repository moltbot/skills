# 🐦💨 roadrunner — Beeper Desktop CLI: chats, messages, search, reminders.

Beeper Desktop in your terminal — CLI for chats, messages, search, and reminders.

## Features

- Authenticate once with your Beeper Desktop token
- List/search chats and messages
- Send messages and manage reminders
- Global search across chats and messages
- Doctor command for diagnostics
- Focus the Beeper Desktop window (optionally open a chat or draft)
- JSON/Plain output for scripting

## Install

### Homebrew (macOS)

```bash
brew install johntheyoung/tap/roadrunner
```

### Go install

```bash
go install github.com/johntheyoung/roadrunner/cmd/rr@latest
```

Or download a binary from the [releases page](https://github.com/johntheyoung/roadrunner/releases).

## Requirements

- [Beeper Desktop](https://www.beeper.com/) **v4.1.169 or later** running locally

## Setup

1. Open Beeper Desktop → **Settings** → **Developers**
2. Toggle **Beeper Desktop API** to enable it (server starts at `localhost:23373`)
3. Click **+** next to "Approved connections" to create a token
4. Configure the CLI:

```bash
rr auth set <your-token>
rr doctor  # verify setup
```

Token is stored in `~/.config/beeper/config.json`. `BEEPER_TOKEN` env var overrides the config file.

## Quick Start

```bash
# List your chats
rr chats list

# Search for a chat
rr chats search "John"

# Send a message
rr messages send "!chatid:beeper.com" "Hello!"

# Global search
rr search "dinner" --json
```

## Commands

| Command | Description |
|---------|-------------|
| `rr auth set/status/clear` | Manage authentication |
| `rr accounts list` | List messaging accounts |
| `rr chats list/search/get/archive` | Manage chats |
| `rr messages list/search/send` | Manage messages |
| `rr reminders set/clear` | Manage chat reminders |
| `rr search <query>` | Global search |
| `rr focus` | Focus Beeper Desktop (optionally open a chat or draft) |
| `rr doctor` | Diagnose configuration |
| `rr completion <shell>` | Generate shell completions |

Run `rr --help` or `rr <command> --help` for details.

## Help

- `rr --help` shows the command tree.
- `rr <command> --help` drills into subcommands.
- `BEEPER_HELP=full rr --help` shows the full expanded command list.

## Output Modes

```bash
# Human-readable (default)
rr chats list

# JSON for scripting
rr chats list --json

# Plain TSV
rr chats list --plain
```

JSON/Plain output is written to stdout. Errors and hints are written to stderr.

## Non-interactive Safety

Destructive commands require confirmation. If stdin is not a TTY or `--no-input`/`BEEPER_NO_INPUT` is set, the command fails unless `--force` is provided.

## Search Notes

- Message search is literal word match; all words must match exactly.
- Global `rr search` can page message results with `--messages-cursor`, `--messages-direction`, and `--messages-limit` (max 20).
- Use `rr chats search --scope=participants` to search by participant names.
- JSON output includes `display_name` for single chats (derived from participants).

```bash
# Paginate message results within global search
rr search "dinner" --messages-limit=20 --json
rr search "dinner" --messages-cursor="<cursor>" --messages-direction=before --json

# Search chats by participant name
rr chats search "Jamie" --scope=participants --json
```

## Scripting Examples

```bash
# Find chat ID and send message
CHAT_ID=$(rr chats search "John" --json | jq -r '.items[0].id')
rr messages send "$CHAT_ID" "Hey!"

# List unread chats
rr chats search --inbox=primary --unread-only --json

# Set a reminder for 2 hours from now
rr reminders set "$CHAT_ID" "2h"

# Focus a chat and pre-fill a draft
rr focus --chat-id="$CHAT_ID" --draft-text="Hello!"
```

## Shell Completions

```bash
# Bash
rr completion bash >> ~/.bashrc

# Zsh
rr completion zsh >> ~/.zshrc

# Fish
rr completion fish > ~/.config/fish/completions/rr.fish
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `BEEPER_TOKEN` | API token (overrides config) |
| `BEEPER_URL` | API base URL (default: http://localhost:23373) |
| `BEEPER_TIMEOUT` | API timeout in seconds (0 disables) |
| `BEEPER_COLOR` | Color mode: auto|always|never |
| `BEEPER_JSON` | Default to JSON output |
| `BEEPER_PLAIN` | Default to plain output |
| `BEEPER_NO_INPUT` | Never prompt, fail instead |
| `BEEPER_HELP` | Set to `full` for expanded help |
| `NO_COLOR` | Disable colored output |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Usage error |

## Docs

- Desktop API: https://developers.beeper.com/desktop-api
- Troubleshooting: docs/troubleshooting.md
- API notes: docs/api-notes.md

## License

MIT
