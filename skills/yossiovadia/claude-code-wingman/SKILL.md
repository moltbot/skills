---
name: claude-code-wingman
version: 0.2.0
description: Run Claude Code as a Clawdbot skill - control it from WhatsApp, approve actions, and attach to watch live
metadata:
  clawdbot:
    emoji: "🦅"
    requires:
      anyBins:
        - claude
        - tmux
---

# Claude Code Wingman

Run Claude Code as a Clawdbot skill. Control it from WhatsApp, track progress, and approve actions - all without leaving your chat.

## What It Does

Clawdbot spawns Claude Code in a tmux session. When Claude Code needs permission to do something, **you get notified via WhatsApp** (or Clawdbot dashboard) and can approve or deny.

- **Give tasks via chat:** "Fix the bug in api.py"
- **Get approval requests:** "Claude Code wants to edit 3 files. Allow?"
- **Track progress:** Ask "what's the status?" anytime
- **Take over:** Attach to the tmux session to see or control Claude Code directly

## Install

```bash
clawdhub install claude-code-wingman
```

Then restart Clawdbot to pick up the new skill.

**Requirements:** tmux, Claude Code CLI (`claude`)

## Usage

Just ask Clawdbot to do coding tasks. It will spawn Claude Code and keep you in the loop.

**Example:** "Hey, fix the auth bug in api.py"

Clawdbot will:
1. Spawn Claude Code in a tmux session
2. Forward the task
3. Notify you when Claude Code needs approval
4. Report back when done

## Attach to Session

Want to see what Claude Code is doing? Attach to the tmux session:

```bash
tmux attach -t <session-name>
```

Detach with `Ctrl+B` then `D`. The session keeps running.

## Commands

| Command | Description |
|---------|-------------|
| `tmux attach -t <session>` | Watch/control Claude Code live |
| `tmux capture-pane -t <session> -p` | Get current output |
| `tmux kill-session -t <session>` | Stop a session |

## Links

- [GitHub](https://github.com/yossiovadia/claude-code-wingman)
