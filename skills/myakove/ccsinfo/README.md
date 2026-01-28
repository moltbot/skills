# ccsinfo Skill

A Moltbot skill for querying and analyzing Claude Code session data from a remote ccsinfo server.

## Installation

### On the Server (where Claude Code runs)

Run the ccsinfo server:
```bash
ccsinfo serve --host 0.0.0.0 --port 9999
```

### On the Client (where Moltbot runs)

1. **Set the server URL** in your environment or config:
   ```bash
   export CCSINFO_SERVER_URL=http://192.168.10.241:9999
   ```

2. **Install the skill** by placing it in your skills directory

3. **Install the CLI tool** (first time only):
   ```bash
   cd skills/ccsinfo
   bash scripts/install.sh
   ```

## Usage

Once configured, simply ask the agent questions like:

- "Show me my recent Claude Code sessions"
- "What's in session 933fcc44?"
- "Search my Claude sessions for 'refactor'"
- "Show me pending tasks"
- "What are my Claude Code usage stats?"

The agent will automatically use the ccsinfo CLI to query your remote server.

## Manual CLI Usage

You can also use the CLI directly:

```bash
# List sessions
ccsinfo sessions list

# Show session details
ccsinfo sessions show 933fcc44

# View messages
ccsinfo sessions messages 933fcc44

# Search
ccsinfo search sessions "keyword"

# Stats
ccsinfo stats global
```

## Files

- `SKILL.md` - Main skill instructions
- `scripts/install.sh` - Installs ccsinfo CLI via uv
- `scripts/ccs.sh` - Wrapper script (optional)
- `references/cli-commands.md` - Complete CLI reference

## Package

The skill is packaged as:
- `ccsinfo.skill.tar.gz` - Compressed archive for distribution

## Requirements

- `uv` package manager (for installation)
- `CCSINFO_SERVER_URL` environment variable
- Network access to the ccsinfo server
