---
name: ccsinfo
description: Query and analyze Claude Code session data from a remote server. Use when asked to inspect Claude Code sessions, view conversation history, check tool calls, track tasks, search prompts, or view usage statistics. Requires CCSINFO_SERVER_URL to be set and a ccsinfo server running.
---

# ccsinfo - Claude Code Session Info

Access and analyze Claude Code session data from a remote ccsinfo server running on the user's machine.

**Server Repository**: https://github.com/myk-org/ccsinfo

## Requirements

### 1. Server Setup (on the machine with Claude Code data)

The ccsinfo server must be running on the machine that has Claude Code session data.

Install and run the server:
```bash
# Install ccsinfo
uv tool install git+https://github.com/myk-org/ccsinfo.git

# Start the server (accessible on LAN)
ccsinfo serve --host 0.0.0.0 --port 9999
```

The server reads Claude Code session data from `~/.claude/projects/` and exposes it via REST API.

For full server documentation, see: https://github.com/myk-org/ccsinfo

### 2. Client Setup (where this skill runs)

The `ccsinfo` CLI tool must be installed. Check if installed:

```bash
which ccsinfo
```

If not installed, run the installation script:

```bash
bash scripts/install.sh
```

### 3. Configuration

Set the `CCSINFO_SERVER_URL` environment variable to point to your server:

```bash
export CCSINFO_SERVER_URL=http://192.168.1.100:9999
```

Add this to your shell profile (`.bashrc`, `.zshrc`, etc.) to persist across sessions.

## Quick Start

All commands automatically connect to the remote server via `$CCSINFO_SERVER_URL`.

### List recent sessions
```bash
ccsinfo sessions list
```

### Show session details (supports partial ID matching)
```bash
ccsinfo sessions show <session-id>
```

### View conversation messages
```bash
ccsinfo sessions messages <session-id>
```

### Search sessions by content
```bash
ccsinfo search sessions "search term"
```

### View global statistics
```bash
ccsinfo stats global
```

## Common Workflows

### Inspect a specific session

1. List sessions to find the ID:
   ```bash
   ccsinfo sessions list
   ```

2. Show session details:
   ```bash
   ccsinfo sessions show <id>
   ```

3. View messages:
   ```bash
   ccsinfo sessions messages <id>
   ```

4. Check tool calls:
   ```bash
   ccsinfo sessions tools <id>
   ```

### Find sessions by content

```bash
# Search across all sessions
ccsinfo search sessions "refactor"

# Search message content
ccsinfo search messages "fix bug"

# Search prompt history
ccsinfo search history "implement feature"
```

### Track tasks

```bash
# Show all pending tasks
ccsinfo tasks pending

# List tasks for a session
ccsinfo tasks list -s <session-id>

# Show specific task details
ccsinfo tasks show <task-id> -s <session-id>
```

### View statistics and trends

```bash
# Overall usage stats
ccsinfo stats global

# Daily activity breakdown
ccsinfo stats daily

# Analyze trends over time
ccsinfo stats trends
```

### Work with projects

```bash
# List all projects
ccsinfo projects list

# Show project details
ccsinfo projects show <project-id>

# Project statistics
ccsinfo projects stats <project-id>
```

## Output Formats

Most commands support `--json` for machine-readable output:

```bash
ccsinfo sessions list --json
ccsinfo stats global --json
```

This is useful for parsing results programmatically or filtering with `jq`.

## Session ID Matching

Session IDs support partial matching - use the first few characters:

```bash
ccsinfo sessions show a1b2c3  # matches a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

## Reference

For complete command reference, see [cli-commands.md](references/cli-commands.md).

## Troubleshooting

### Check server connectivity
```bash
# Verify server URL is set
echo $CCSINFO_SERVER_URL

# Test connection (list sessions)
ccsinfo sessions list
```

### Verify installation
```bash
# Check if ccsinfo is installed
which ccsinfo

# Check version
ccsinfo --version
```

### Reinstall if needed
```bash
bash scripts/install.sh
```
