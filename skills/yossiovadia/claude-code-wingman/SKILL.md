---
name: claude-code-wingman
description: Your Claude Code wingman - orchestrate multiple Claude Code sessions across projects, monitor them all from WhatsApp
metadata: {"clawdbot":{"emoji":"🦅","requires":{"anyBins":["claude","tmux"]}}}
---

# Claude Code Wingman

Your multi-session orchestrator - manage multiple Claude Code instances working on different projects simultaneously, all from WhatsApp.

**GitHub:** https://github.com/yossiovadia/claude-code-orchestrator

## ⚡ CRITICAL: Handle Approval Commands First

**When a user message matches these patterns, IMMEDIATELY run the corresponding command:**

| User Message Pattern | Command to Run |
|---------------------|----------------|
| `approve <session>` | `~/code/claude-code-orchestrator/lib/handle-approval.sh approve <session>` |
| `always <session>` | `~/code/claude-code-orchestrator/lib/handle-approval.sh always <session>` |
| `deny <session>` | `~/code/claude-code-orchestrator/lib/handle-approval.sh deny <session>` |

**Examples:**
- User: "approve vsr-bugfix" → Run: `~/code/claude-code-orchestrator/lib/handle-approval.sh approve vsr-bugfix`
- User: "always heartbeat-test" → Run: `~/code/claude-code-orchestrator/lib/handle-approval.sh always heartbeat-test`
- User: "deny proxy-refactor" → Run: `~/code/claude-code-orchestrator/lib/handle-approval.sh deny proxy-refactor`

**After running, respond with the command output** (e.g., "✓ Session 'vsr-bugfix' approved (once)")

**Why this is critical:** The master monitor daemon sends WhatsApp notifications when Claude Code sessions need approval. The user responds with these commands from their phone. Fast response = unblocked sessions.

### Quick Status Commands

| User Message | Command to Run |
|--------------|----------------|
| `sessions` or `status` | `~/code/claude-code-orchestrator/lib/session-status.sh --all --json` |
| `status <session>` | `~/code/claude-code-orchestrator/lib/session-status.sh <session> --json` |

Parse the JSON and respond with a human-readable summary.

---

## What It Does

Orchestrates multiple Claude Code sessions in parallel, each working on different tasks in different directories. You monitor and control everything remotely via WhatsApp/chat.

**The Vision:**
- **Multiple tmux sessions** running simultaneously
- **Each session = one Claude Code instance** in its own directory
- **Different tasks** happening in parallel (VSR fixes, Clawdbot features, proxy refactoring)
- **You orchestrate everything** via Clawdbot (this assistant) from WhatsApp
- **Real-time dashboard** showing all active sessions and their status

## 🎯 Real-World Example: Multi-Session Orchestration

**Morning - You (via WhatsApp):** "Start work on VSR issue #1131, Clawdbot authentication feature, and refactor the proxy"

**Clawdbot spawns 3 sessions:**
```
✅ Session: vsr-issue-1131     (~/code/semantic-router)
✅ Session: clawdbot-auth      (~/code/clawdbot)
✅ Session: proxy-refactor     (~/code/claude-code-proxy)
```

**During lunch - You:** "Show me the dashboard"

**Clawdbot:**
```
┌─────────────────────────────────────────────────────────┐
│ Active Claude Code Sessions                             │
├─────────────────┬──────────────────────┬────────────────┤
│ vsr-issue-1131  │ semantic-router      │ ✅ Working     │
│ clawdbot-auth   │ clawdbot             │ ✅ Working     │
│ proxy-refactor  │ claude-code-proxy    │ ⏳ Waiting approval │
└─────────────────┴──────────────────────┴────────────────┘
```

**You:** "How's the VSR issue going?"

**Clawdbot captures session output:**
"Almost done - fixed the schema validation bug, running tests now. 8/10 tests passing."

**You:** "Tell proxy-refactor to run tests next"

**Clawdbot sends command** to that specific session.

**Result:** 3 parallel tasks, full remote control from your phone. 🎯

## Installation

### Via Clawdbot (Recommended)

```bash
clawdbot skill install claude-code-wingman
```

Or visit: https://clawdhub.com/skills/claude-code-wingman

### Manual Installation

```bash
cd ~/code
git clone https://github.com/yossiovadia/claude-code-orchestrator.git
cd claude-code-orchestrator
chmod +x *.sh lib/*.sh
```

### Requirements

- `claude` CLI (Claude Code)
- `tmux` (terminal multiplexer)
- `jq` (JSON processor)

## Core Philosophy: Always Use the Wingman Script

**CRITICAL:** When interacting with Claude Code sessions, ALWAYS use the wingman script (`claude-wingman.sh`). Never run raw tmux commands directly.

**Why:**
- ✅ Ensures proper Enter key handling (C-m)
- ✅ Consistent session management
- ✅ Future-proof for dashboard/tracking features
- ✅ Avoids bugs from manual tmux commands

**Wrong (DON'T DO THIS):**
```bash
tmux send-keys -t my-session "Run tests"
# ^ Might forget C-m, won't be tracked in dashboard
```

**Right (ALWAYS DO THIS):**
```bash
~/code/claude-code-orchestrator/claude-wingman.sh \
  --session my-session \
  --workdir ~/code/myproject \
  --prompt "Run tests"
```

---

## Usage from Clawdbot

### Start a New Session

When a user asks for coding work, spawn Claude Code:

```bash
~/code/claude-code-orchestrator/claude-wingman.sh \
  --session <session-name> \
  --workdir <project-directory> \
  --prompt "<task description>"
```

### Send Command to Existing Session

To send a new task to an already-running session:

```bash
~/code/claude-code-orchestrator/claude-wingman.sh \
  --session <existing-session-name> \
  --workdir <same-directory> \
  --prompt "<new task>"
```

**Note:** The script detects if the session exists and sends the command to it instead of creating a duplicate.

### Check Session Status

```bash
tmux capture-pane -t <session-name> -p -S -50
```

Parse the output to determine if Claude Code is:
- Working (showing tool calls/progress)
- Idle (showing prompt)
- Error state (showing errors)
- Waiting for approval (showing "Allow this tool call?")

---

## Example Patterns

**User:** "Fix the bug in api.py"

**Clawdbot:**
```
Spawning Claude Code session for this...

[Runs wingman script]

✅ Session started: vsr-bug-fix
📂 Directory: ~/code/semantic-router
🎯 Task: Fix bug in api.py
```

**User:** "What's the status?"

**Clawdbot:**
```bash
tmux capture-pane -t vsr-bug-fix -p -S -50
```

Then summarize: "Claude Code is running tests now, 8/10 passing"

**User:** "Tell it to commit the changes"

**Clawdbot:**
```bash
~/code/claude-code-orchestrator/claude-wingman.sh \
  --session vsr-bug-fix \
  --workdir ~/code/semantic-router \
  --prompt "Commit the changes with a descriptive message"
```

## Commands Reference

### Start New Session
```bash
~/code/claude-code-orchestrator/claude-wingman.sh \
  --session <name> \
  --workdir <dir> \
  --prompt "<task>"
```

### Send Command to Existing Session
```bash
~/code/claude-code-orchestrator/claude-wingman.sh \
  --session <existing-session> \
  --workdir <same-dir> \
  --prompt "<new command>"
```

### Monitor Session Progress
```bash
tmux capture-pane -t <session-name> -p -S -100
```

### List All Active Sessions
```bash
tmux ls
```

Filter for Claude Code sessions:
```bash
tmux ls | grep -E "(vsr|clawdbot|proxy|claude)"
```

### View Auto-Approver Log (if needed)
```bash
cat /tmp/auto-approver-<session-name>.log
```

### Kill Session When Done
```bash
tmux kill-session -t <session-name>
```

### Attach Manually (for user)
```bash
tmux attach -t <session-name>
# Detach: Ctrl+B, then D
```

---

## Roadmap: Multi-Session Dashboard (Coming Soon)

**Planned features:**

### `wingman dashboard`
Shows all active Claude Code sessions:
```
┌─────────────────────────────────────────────────────────┐
│ Active Claude Code Sessions                             │
├─────────────────┬──────────────────────┬────────────────┤
│ Session         │ Directory            │ Status         │
├─────────────────┼──────────────────────┼────────────────┤
│ vsr-issue-1131  │ ~/code/semantic-...  │ ✅ Working     │
│ clawdbot-feat   │ ~/code/clawdbot      │ ⏳ Waiting approval │
│ proxy-refactor  │ ~/code/claude-co...  │ ❌ Error       │
└─────────────────┴──────────────────────┴────────────────┘

Total: 3 sessions | Working: 1 | Waiting: 1 | Error: 1
```

### `wingman status <session>`
Detailed status for a specific session:
```
Session: vsr-issue-1131
Directory: ~/code/semantic-router
Started: 2h 15m ago
Last activity: 30s ago
Status: ✅ Working
Current task: Running pytest tests
Progress: 8/10 tests passing
```

### Session Registry
- Persistent tracking (survives Clawdbot restarts)
- JSON file storing session metadata
- Auto-cleanup of dead sessions

**For now:** Use tmux commands directly, but always via the wingman script for sending commands!

## Workflow

1. **User requests coding work** (fix bug, add feature, refactor, etc.)
2. **Clawdbot spawns Claude Code** via orchestrator script
3. **Auto-approver handles permissions** in background
4. **Clawdbot monitors and reports** progress
5. **User can attach anytime** to see/control directly
6. **Claude Code does the work** autonomously ✅

## Trust Prompt (First Time Only)

When running in a new directory, Claude Code asks:
> "Do you trust the files in this folder?"

**First run:** User must attach and approve (press Enter). After that, it's automatic.

**Handle it:**
```
User, Claude Code needs you to approve the folder trust (one-time). Please run:
tmux attach -t <session-name>

Press Enter to approve, then Ctrl+B followed by D to detach.
```

## Best Practices

### When to Use Orchestrator

✅ **Use orchestrator for:**
- Heavy code generation/refactoring
- Multi-file changes
- Long-running tasks
- Repetitive coding work

❌ **Don't use orchestrator for:**
- Quick file reads
- Simple edits
- When conversation is needed
- Planning/design discussions

### Session Naming

Use descriptive names:
- `vsr-issue-1131` - specific issue work
- `vsr-feature-auth` - feature development
- `project-bugfix-X` - bug fixes

## Troubleshooting

### Prompt Not Submitting
The orchestrator sends Enter twice with delays. If stuck, user can attach and press Enter manually.

### Auto-Approver Not Working
Check logs: `cat /tmp/auto-approver-<session-name>.log`

Should see: "Approval prompt detected! Navigating to option 2..."

### Session Already Exists
Kill it: `tmux kill-session -t <name>`

## Advanced: Update Memory

After successful tasks, update `TOOLS.md`:

```markdown
### Recent Claude Code Sessions
- 2026-01-26: VSR AWS check - verified vLLM server running ✅
- Session pattern: vsr-* for semantic-router work
```

## Pro Tips

- **Parallel sessions:** Run multiple tasks simultaneously in different sessions
- **Name consistently:** Use project prefixes (vsr-, myapp-, etc.)
- **Monitor periodically:** Check progress every few minutes
- **Let it finish:** Don't kill sessions early, let Claude Code complete

---

## 🔔 Approval Handling (WhatsApp Integration)

The master monitor daemon sends WhatsApp notifications when sessions need approval. Handle them with these commands:

### Approve Commands (from WhatsApp)

When you receive an approval notification, respond with:

**Clawdbot parses your message and runs:**
```bash
# Approve once
~/code/claude-code-orchestrator/lib/handle-approval.sh approve <session-name>

# Approve all similar (always)
~/code/claude-code-orchestrator/lib/handle-approval.sh always <session-name>

# Deny
~/code/claude-code-orchestrator/lib/handle-approval.sh deny <session-name>
```

### Example WhatsApp Flow

**Notification received:**
```
🔒 Session 'vsr-bugfix' needs approval

Bash(rm -rf ./build && npm run build)

Reply with:
• approve vsr-bugfix - Allow once
• always vsr-bugfix - Allow all similar
• deny vsr-bugfix - Reject
```

**You reply:** "approve vsr-bugfix"

**Clawdbot:**
```bash
~/code/claude-code-orchestrator/lib/handle-approval.sh approve vsr-bugfix
```

**Response:** "✓ Session 'vsr-bugfix' approved (once)"

### Start the Monitor Daemon

```bash
# Start monitoring all sessions (reads config from ~/.clawdbot/clawdbot.json)
~/code/claude-code-orchestrator/master-monitor.sh &

# With custom intervals
~/code/claude-code-orchestrator/master-monitor.sh --poll-interval 5 --reminder-interval 120 &

# Check if running
cat /tmp/claude-orchestrator/master-monitor.pid

# View logs
tail -f /tmp/claude-orchestrator/master-monitor.log

# Stop the daemon
kill $(cat /tmp/claude-orchestrator/master-monitor.pid)
```

No environment variables needed - phone and webhook token are read from Clawdbot config.

