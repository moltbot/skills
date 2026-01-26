# Usage Guide

## Quick Start

```bash
./claude-wingman.sh \
  --workdir ~/code/myproject \
  --prompt "Your task for Claude Code"
```

## Examples

### Simple Task
```bash
./claude-wingman.sh \
  --workdir ~/code/test-project \
  --prompt "Create a hello.py file that prints 'Hello World'"
```

### Named Session
```bash
./claude-wingman.sh \
  --session my-task-123 \
  --workdir ~/code/semantic-router \
  --prompt "Add error handling to the API calls in src/api.py"
```

### Monitor Progress
```bash
./claude-wingman.sh \
  --workdir ~/code/myproject \
  --prompt "Fix the bug in line 42" \
  --monitor
```

### Wait for Completion
```bash
./claude-wingman.sh \
  --workdir ~/code/myproject \
  --prompt "Run tests and fix any failures" \
  --wait
```

## Options

| Flag | Description | Required |
|------|-------------|----------|
| `--prompt <text>` | Task for Claude Code | ✅ Yes |
| `--workdir <path>` | Working directory | No (default: current dir) |
| `--session <name>` | Session name | No (auto-generated) |
| `--monitor` | Monitor in real-time | No |
| `--wait` | Wait for completion | No |

## Managing Sessions

### Attach to a Running Session
```bash
tmux attach -t <session-name>
```

### Check Session Output
```bash
tmux capture-pane -t <session-name> -p
```

### View Auto-Approver Logs
```bash
cat /tmp/auto-approver-<session-name>.log
```

### Kill a Session
```bash
tmux kill-session -t <session-name>
```

### List All Sessions
```bash
tmux ls
```

## How It Works

1. **Spawns Claude Code** in a named tmux session
2. **Starts auto-approver** in background to handle permission prompts
3. **Submits your prompt** with reliable Enter key handling
4. **Auto-approves** all "Do you want..." prompts (option 2: allow for project/session)
5. **Claude Code executes** the task using your work's free API
6. **You can attach** anytime to see progress or take over

## Cost Savings

- **Without wingman:** Clawdbot does everything → uses your $20/month API budget
- **With wingman:** Clawdbot spawns Claude Code → uses work's free API ✅

Perfect for heavy coding tasks while keeping Clawdbot API costs minimal.

## Troubleshooting

### Prompt Doesn't Submit
- The wingman sends Enter twice with delays
- If still stuck, attach and press Enter manually: `tmux attach -t <session-name>`

### Auto-Approver Not Working
- Check logs: `cat /tmp/auto-approver-<session-name>.log`
- Look for "Approval prompt detected!" messages

### Claude Code Shows API Error
- Check if your work account has access to Claude Code
- Verify `claude` CLI is properly authenticated

### Session Already Exists
- Kill it first: `tmux kill-session -t <session-name>`
- Or use a different session name with `--session`
