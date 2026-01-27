# Linear Skill for Clawdbot

A [Clawdbot](https://github.com/clawdbot/clawdbot) skill for managing Linear issues directly from your AI assistant.

## Features

- List assigned issues or team issues
- Create, update, and search issues
- Change issue status, assignee, and priority
- Add comments to issues
- List teams, workflow states, and users

## Installation

### From ClawdHub

```bash
clawdhub install linear
```

### Manual

Clone into your Clawdbot skills directory:

```bash
git clone https://github.com/mrklnc/clawdbot-skill-linear.git ~/.clawdbot/skills/linear
```

## Setup

1. Get a Linear API key from [linear.app/settings/api](https://linear.app/settings/api)

2. Store it in `~/.clawdbot/credentials/linear.json`:
   ```json
   {"apiKey": "lin_api_..."}
   ```

   Or set the `LINEAR_API_KEY` environment variable.

## Usage Examples

Once installed, just ask your Clawdbot:

- "Show me my Linear issues"
- "Create a bug report for the login page"
- "Move CLP-123 to In Progress"
- "What's the status of the auth refactor?"
- "Add a comment to CLP-456 saying it's fixed"

## Commands

| Command | Description |
|---------|-------------|
| `issues --mine` | List your assigned issues |
| `issues --team ID` | List issues for a team |
| `get ISSUE` | Get issue details |
| `search "query"` | Search issues |
| `create --team ID --title "..."` | Create an issue |
| `update ISSUE --state ID` | Update an issue |
| `comment ISSUE "text"` | Add a comment |
| `teams` | List teams |
| `states` | List workflow states |
| `users` | List workspace users |

Use `--json` for raw API output.

## License

MIT
