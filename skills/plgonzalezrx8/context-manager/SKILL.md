---
name: context-manager
description: AI-powered context management for Clawdbot/Moltbot sessions
user-invocable: true
---

# Context Manager Skill

AI-powered context management for Clawdbot/Moltbot sessions. Uses the agent itself to generate intelligent summaries, then resets the session with compressed context.

## Quick Start

```bash
# List all sessions with usage stats
~/clawd/skills/context-manager/compress.sh list

# Check status of a specific session
~/clawd/skills/context-manager/compress.sh status agent:main:main

# Generate AI summary (read-only, safe)
~/clawd/skills/context-manager/compress.sh summarize agent:main:main

# Compress session: generate summary, reset, inject (DESTRUCTIVE)
~/clawd/skills/context-manager/compress.sh summarize agent:main:main --replace
```

## When to Use

- Context usage approaching 70-80%+
- Long sessions with extensive conversation history  
- Before the session becomes slow or loses coherence
- Proactively to maintain fast, focused sessions

## How It Works

1. **AI Summarization**: Sends a prompt to the agent asking it to summarize its own context
2. **Backup**: Saves the original JSONL session file to `memory/compressed/`
3. **Reset**: Deletes the JSONL file (official reset method per Moltbot docs)
4. **Inject**: Sends the AI-generated summary as the first message in the fresh session
5. **Result**: Same session key, new session ID, compressed context

**Key insight**: The agent has full visibility into its own context, so it generates the best possible summary.

## Commands

### Session Commands

| Command | Description |
|---------|-------------|
| `list` | List all sessions with token usage |
| `status [KEY]` | Show detailed status for a session |
| `summarize [KEY]` | Generate AI summary (read-only) |
| `summarize [KEY] --replace` | Summarize AND reset session with compressed context |
| `compress [KEY]` | Legacy grep-based extraction (not recommended) |
| `check [KEY]` | Check if session exceeds threshold |
| `check-all` | Check all sessions at once |

### Configuration Commands

| Command | Description |
|---------|-------------|
| `set-threshold N` | Set compression threshold (50-99%, default: 80) |
| `set-depth LEVEL` | Set depth: brief/balanced/comprehensive |
| `set-quiet-hours HH` | Set quiet hours (e.g., "23:00-07:00") |
| `help` | Show help and usage examples |

## Examples

### List All Sessions

```bash
$ ~/clawd/skills/context-manager/compress.sh list
📋 Available Sessions (4 total)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#    SESSION KEY                              KIND       TOKENS    USAGE
1    agent:main:main                          direct      70188      70%
2    agent:main:slack:channel:c0aaruq2en9     group       20854      20%
3    agent:main:cron:0d02af4b-...             direct      18718      18%
```

### Check Session Status

```bash
$ ~/clawd/skills/context-manager/compress.sh status agent:main:main
📊 Context Manager Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Session Key: agent:main:main
  Session ID:  fc192a2d-091c-48c7-9fad-12bf34687454
  Kind:        direct
  Model:       gemini-3-flash
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Threshold:   80%
  Tokens:      70188 / 100000
  Usage:       70%
```

### Generate AI Summary (Safe, Read-Only)

```bash
$ ~/clawd/skills/context-manager/compress.sh summarize agent:main:main
🧠 Requesting AI summary for session: agent:main:main
  Session ID: fc192a2d-091c-48c7-9fad-12bf34687454

✅ AI Summary generated!
  Saved to: memory/compressed/20260127-123146.ai-summary.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### Session Summary: January 27, 2026

#### 1. What was accomplished
- System audit completed
- Essay generation with sub-agents
...
```

### Full Compression (Summarize + Reset + Inject)

```bash
$ ~/clawd/skills/context-manager/compress.sh summarize agent:main:main --replace
🧠 Requesting AI summary for session: agent:main:main
  Session ID: fc192a2d-091c-48c7-9fad-12bf34687454
  Mode: REPLACE (will reset session after summary)

✅ AI Summary generated!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[AI-generated summary displayed]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔄 Resetting session and injecting compressed context...
  Backing up session file...
  Backup saved: memory/compressed/20260127-123146.session-backup.jsonl
  Deleting session JSONL to reset...
  Injecting compressed context into fresh session...
✅ Session compressed successfully!
  Old session ID: fc192a2d-091c-48c7-9fad-12bf34687454
  New session ID: a1b2c3d4-...
  Session is ready to continue with compressed context
```

**Result**: 70k tokens → 16k tokens (77% reduction)

## Output Files

When compression occurs, these files are created in `memory/compressed/`:

| File | Description |
|------|-------------|
| `{timestamp}.ai-summary.md` | AI-generated session summary |
| `{timestamp}.session-backup.jsonl` | Full backup of original session (can restore if needed) |
| `{timestamp}.transcript.md` | Raw transcript extraction (legacy) |
| `{timestamp}.summary.md` | Grep-based summary (legacy) |

## Requirements

- **clawdbot/moltbot** - Gateway must be running
- **jq** - JSON parsing (`brew install jq`)
- **Gateway access** - Script uses `clawdbot agent` and `clawdbot sessions`

## Technical Details

### Session Reset Method

The script uses JSONL deletion to reset sessions (official method per Moltbot docs):

1. Backup JSONL to `memory/compressed/`
2. Delete `~/.clawdbot/agents/{agent}/sessions/{sessionId}.jsonl`
3. Send compressed context via `clawdbot agent --to main`
4. New session is created automatically with summary as first message

### Why Not /reset?

The `/reset` slash command only works in the chat interface. When sent via `clawdbot agent --session-id`, it's treated as a regular message and the agent tries to interpret it as a task.

### AI Summarization Prompt

The script asks the agent to provide:
1. What was accomplished (key tasks)
2. Key decisions made (with rationale)
3. Current state (where we left off)
4. Pending tasks (what still needs doing)
5. Important context (critical info to remember)

## Troubleshooting

### Summary Text Empty

If the AI summary extraction fails, check stderr redirect:
```bash
# The script uses 2>/dev/null to avoid Node deprecation warnings breaking JSON
clawdbot agent --session-id $ID -m "..." --json 2>/dev/null
```

### Session Not Resetting

Verify the JSONL file path:
```bash
ls ~/.clawdbot/agents/main/sessions/
```

### Restore From Backup

If something goes wrong:
```bash
cp memory/compressed/{timestamp}.session-backup.jsonl \
   ~/.clawdbot/agents/main/sessions/{sessionId}.jsonl
```

### Check Logs

Use `clawdbot logs` to troubleshoot:
```bash
clawdbot logs --limit 50 --json | grep -i "error\|fail"
```

## Best Practices

1. **Backup first**: The script auto-backs up, but you can also manually backup before testing
2. **Test on non-critical sessions first**: Try on a Slack channel or cron session before main
3. **Check the summary**: Run `summarize` without `--replace` first to verify the summary quality
4. **Monitor token count**: Use `status` to verify compression worked

## See Also

- [Moltbot Session Management](https://docs.molt.bot/concepts/session)
- [Moltbot Compaction](https://docs.molt.bot/concepts/compaction)
- `clawdbot sessions --help`
- `clawdbot agent --help`
