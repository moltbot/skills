---
name: linear
description: Interact with Linear for issue tracking. Use when creating, updating, listing, or searching issues. Supports viewing assigned issues, changing status, adding comments, and managing tasks.
---

# Linear

Manage Linear issues via `scripts/linear.sh`.

## Setup

Store API key in `~/.clawdbot/credentials/linear.json`:
```json
{"apiKey": "lin_api_..."}
```

## Commands

```bash
# List my assigned issues
scripts/linear.sh issues --mine

# List team issues
scripts/linear.sh issues --team TEAM_ID

# Get issue details
scripts/linear.sh get CLP-123

# Search issues
scripts/linear.sh search "auth bug"

# Create issue
scripts/linear.sh create --team TEAM_ID --title "Bug: login fails" --description "Details"

# Update issue (status, title, assignee, priority)
scripts/linear.sh update CLP-123 --state STATE_ID

# Add comment
scripts/linear.sh comment CLP-123 "Fixed in PR #42"

# List teams (to get TEAM_ID)
scripts/linear.sh teams

# List states (to get STATE_ID)
scripts/linear.sh states

# List users (to get assignee ID)
scripts/linear.sh users
```

Use `--json` flag for raw API output: `scripts/linear.sh --json issues --mine`

## Workflow Examples

**Create and assign a bug:**
```bash
# Find team ID
scripts/linear.sh teams
# Create with priority 2 (high)
scripts/linear.sh create --team abc123 --title "Critical: API down" --priority 2
```

**Move issue to In Progress:**
```bash
# Find state ID
scripts/linear.sh states
# Update
scripts/linear.sh update CLP-45 --state xyz789
```

See [references/api-examples.md](references/api-examples.md) for GraphQL details.
