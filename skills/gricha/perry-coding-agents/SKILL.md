---
name: perry-coding-agents
description: Dispatch coding tasks to OpenCode or Claude Code on Perry workspaces. Use for development work, PR reviews, or any coding task requiring an isolated environment.
metadata: {"clawdbot":{"emoji":"🛠️"}}
---

# Coding Workflow (Perry + OpenCode/Claude Code)

Dispatch coding tasks to isolated Perry workspaces on your tailnet. Primary agents: **OpenCode** and **Claude Code**.

> **See also:** [perry-workspaces](../perry-workspaces/SKILL.md) for workspace management basics.

## Quick Reference

| Action | Command |
|--------|---------|
| List workspaces | `tailscale status \| grep -v offline` |
| Create workspace | `perry start <name> --clone git@github.com:user/repo.git` |
| Shell into workspace | `ssh workspace@<name>` |
| Run OpenCode task | `ssh workspace@<name> "cd ~/<projname> && opencode run 'task'"` |
| Run Claude Code | `ssh -t workspace@<name> "cd ~/<projname> && claude 'task'"` |
| Remove workspace | `perry remove <name>` |

---

## ⚠️ Important: Directory Structure

Projects are cloned to `~/<workspace-name>`, **not** `/workspace`.

```bash
# Correct - project directory
cd ~/my-project

# Wrong - /workspace is a different location
cd ~/<projname>
```

When dispatching tasks, always use the project directory: `cd ~/<projname>`

---

## Pattern: Dispatch → Schedule Follow-up → Done

### 1. Find or Create Workspace

```bash
# List available workspaces
tailscale status | grep -v offline

# Create new one for the task
perry start feat-new-feature --clone git@github.com:user/repo.git
```

Reuse existing workspaces when appropriate. If you create a new one for a task, remove it when done.

### 2. Get Wake Callback Info

Before dispatching, look up the gateway IP for wake callbacks:

```bash
# Get tailnet IP
tailscale status --self --json | jq -r '.Self.TailscaleIPs[0]'

# Gateway port: 18789
# Auth token: from gateway.auth.token in config
```

The wake callback URL: `http://<tailnet-ip>:18789/api/wake`

### 3. Dispatch Task with Wake Callback

Include wake instruction in the prompt so the agent notifies when done:

```bash
# Get wake IP first
WAKE_IP=$(tailscale status --self --json | jq -r '.Self.TailscaleIPs[0]')
TOKEN="<your-gateway-token>"

ssh -t workspace@<name> "cd ~/<projname> && opencode run 'Build feature X.

When completely finished, notify me by running:
curl -X POST http://${WAKE_IP}:18789/api/wake \\
  -H \"Content-Type: application/json\" \\
  -H \"Authorization: Bearer ${TOKEN}\" \\
  -d \"{\\\"text\\\": \\\"Done: Built feature X on <name>\\\", \\\"mode\\\": \\\"now\\\"}\"
'"
```

### 4. Schedule Follow-up (Always!)

After dispatching, schedule a cron reminder as backup:

```bash
clawdbot cron add --at +20m --message "Fallback check: <workspace> for <task>. The agent should have woken us by now. If not, check: ssh workspace@<name> 'cd ~/<projname> && git log -1 && git status'"
```

The agent *should* wake us when done. The cron is just insurance.

---

## OpenCode Tasks

OpenCode is the primary coding agent. It has a web UI at port 4096.

### One-shot task
```bash
ssh -t workspace@<name> "cd ~/<projname> && opencode run 'Your task here'"
```

### Background task
```bash
# Get wake IP first
WAKE_IP=$(tailscale status --self --json | jq -r '.Self.TailscaleIPs[0]')

# Dispatch with wake callback
ssh workspace@<name> "cd ~/<projname> && nohup opencode run 'Your task.

When done: curl -X POST http://${WAKE_IP}:18789/api/wake -H \"Authorization: Bearer <token>\" -d \"{\\\"text\\\":\\\"Done: task summary\\\"}\"
' > /tmp/opencode.log 2>&1 &"

# Schedule backup check
clawdbot cron add --at +20m --message "Fallback check: opencode on <name>"
```

---

## Claude Code Tasks

Use Claude Code when you need its specific capabilities.

### Interactive session
```bash
ssh -t workspace@<name> "cd ~/<projname> && claude"
```

### One-shot task
```bash
ssh -t workspace@<name> "cd ~/<projname> && claude 'Your task here'"
```

**Note:** Claude Code requires TTY (`-t` flag). No web UI.

---

## PR Reviews

### Single PR Review
```bash
# Create workspace for the review
perry start review-pr-130 --clone git@github.com:user/repo.git

# Checkout and review
ssh workspace@review-pr-130 "cd ~/<projname> && gh pr checkout 130"
ssh -t workspace@review-pr-130 "cd ~/<projname> && opencode run 'Review this PR for bugs, security issues, and improvements. Run: git diff origin/main...HEAD'"

# Cleanup after
perry remove review-pr-130
```

### Batch PR Review (Army Mode)

Spin up parallel workspaces for multiple PRs:

```bash
# Create workspace per PR
perry start review-pr-86 --clone git@github.com:user/repo.git
perry start review-pr-87 --clone git@github.com:user/repo.git
perry start review-pr-88 --clone git@github.com:user/repo.git

# Dispatch reviews in parallel
for pr in 86 87 88; do
  ssh workspace@review-pr-${pr} "cd ~/<projname> && gh pr checkout ${pr}"
  ssh workspace@review-pr-${pr} "cd ~/<projname> && nohup opencode run 'Review PR #${pr}. Check for bugs, security, style.' > /tmp/review.log 2>&1 &"
done

# Schedule backup check
clawdbot cron add --at +20m --message "Fallback check: PR review batch (86, 87, 88)"

# After done: collect results and post
for pr in 86 87 88; do
  REVIEW=$(ssh workspace@review-pr-${pr} "cat /tmp/review.log | tail -100")
  gh pr comment $pr --body "$REVIEW"
  perry remove review-pr-${pr}
done
```

---

## Parallel Issue Fixes

One workspace per issue:

```bash
# Create workspaces
perry start fix-issue-78 --clone git@github.com:user/repo.git
perry start fix-issue-99 --clone git@github.com:user/repo.git

# Dispatch fixes with wake callbacks
ssh workspace@fix-issue-78 "cd ~/<projname> && git checkout -b fix/issue-78 && nohup opencode run 'Fix issue #78: description. Commit when done.

When finished: curl -X POST http://<WAKE_IP>:18789/api/wake ...' > /tmp/fix.log 2>&1 &"

ssh workspace@fix-issue-99 "cd ~/<projname> && git checkout -b fix/issue-99 && nohup opencode run 'Fix issue #99: description. Commit when done.

When finished: curl -X POST http://<WAKE_IP>:18789/api/wake ...' > /tmp/fix.log 2>&1 &"

# Schedule backup check
clawdbot cron add --at +20m --message "Fallback check: issue fixes 78, 99"

# After completion: push and PR
ssh workspace@fix-issue-78 "cd ~/<projname> && git push -u origin fix/issue-78"
gh pr create --repo user/repo --head fix/issue-78 --title "fix: issue 78" --body "..."

# Cleanup
perry remove fix-issue-78
perry remove fix-issue-99
```

---

## Fallback: Manual Check

If the wake callback didn't fire and the cron reminder triggers, check manually:

```bash
# What happened?
ssh workspace@<name> "cd ~/<projname> && git log --oneline -5 && git status"

# Is the agent still running?
ssh workspace@<name> "ps aux | grep -E 'opencode|claude'"

# Check logs
ssh workspace@<name> "tail -50 /tmp/opencode.log"

# OpenCode web UI (if still running)
# Browser: http://<workspace-ip>:4096
```

This should be rare. If wake callbacks fail often, debug the networking.

---

## ⚠️ Rules

1. **Always schedule backup cron** - 20 min after dispatching background tasks
2. **Look up wake IP dynamically** - `tailscale status --self --json`
3. **Clean up task-specific workspaces** - If you create a workspace for a task, `perry remove` it when done
4. **Use `-t` for interactive** - SSH needs TTY for Claude Code
5. **Keep user informed** - Message when starting, when done, or if something fails
6. **Don't take over** - If agent fails, report it; don't silently do the work yourself

---

## Troubleshooting

**Can't reach workspace:**
```bash
tailscale status | grep <name>  # Check if online
tailscale ping <name>           # Test connectivity
```

**MagicDNS not resolving:**
Use IP addresses. MagicDNS doesn't work inside Perry containers.
```bash
tailscale status  # Get IP from listing
ssh workspace@100.x.x.x "..."
```

**Commands not found (opencode, claude):**
SSH non-login shells don't source `.bashrc`. Use full paths:
```bash
# Instead of: opencode run '...'
/home/workspace/.opencode/bin/opencode run '...'

# Instead of: claude '...'
/home/workspace/.local/bin/claude '...'
```

**Wake callback not firing:**
- Check the agent actually finished (logs)
- Verify the IP/token are correct
- Test manually: `curl -X POST http://<ip>:18789/api/wake ...`
