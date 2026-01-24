---
name: perry-coding-agents
description: Dispatch coding tasks to OpenCode or Claude Code on Perry workspaces. Use for development work, PR reviews, or any coding task requiring an isolated environment.
metadata: {"clawdbot":{"emoji":"🛠️"}}
---

# Perry Coding Agents

Dispatch tasks to OpenCode/Claude Code on Perry workspaces.

## Rules
- **Always create dex task FIRST** — before any dispatch, no exceptions
- **No hard timeouts** — background dispatch, let agent run
- **Use IPs** — MagicDNS broken in containers (`tailscale status` for IPs)
- **One task per PR** — same session continues until done
- **Reuse sessions** — OpenCode keeps context in `~/.opencode/`
- **Never code directly** — always dispatch to agents

## Commands
```bash
# OpenCode (primary)
ssh -o StrictHostKeyChecking=no workspace@<IP> "cd ~/<project> && /home/workspace/.opencode/bin/opencode run 'task'" &

# Claude Code (needs TTY)
ssh -t workspace@<IP> "cd ~/<project> && /home/workspace/.local/bin/claude 'task'"
```

## Dispatch Pattern
```bash
WAKE_IP=$(tailscale status --self --json | jq -r '.Self.TailscaleIPs[0]')

ssh -o StrictHostKeyChecking=no workspace@<IP> "cd ~/<project> && /home/workspace/.opencode/bin/opencode run 'Your task.

When done: curl -X POST http://${WAKE_IP}:18789/hooks/wake -H \"Content-Type: application/json\" -H \"Authorization: Bearer <hooks-token>\" -d \"{\\\"text\\\": \\\"Done: summary\\\", \\\"mode\\\": \\\"now\\\"}\"
'" &
```

## Task Tracking
Create task before dispatch with: workspace IP, branch, goal, done criteria.
Same task until CI green. Complete with result summary.

## Example: Full PR Flow

```bash
# 1. Create task
# Track: workspace feat1 (100.109.173.45), branch feat/auth, goal: add auth

# 2. Get wake info
WAKE_IP=$(tailscale status --self --json | jq -r '.Self.TailscaleIPs[0]')

# 3. Dispatch (background, no timeout)
ssh -o StrictHostKeyChecking=no workspace@100.109.173.45 "cd ~/perry && /home/workspace/.opencode/bin/opencode run 'Add bearer token auth to all API endpoints. Create PR when done.

When finished: curl -X POST http://${WAKE_IP}:18789/hooks/wake -H \"Content-Type: application/json\" -H \"Authorization: Bearer <token>\" -d \"{\\\"text\\\": \\\"Done: Auth PR created\\\", \\\"mode\\\": \\\"now\\\"}\"
'" &

# 4. Wake received → check CI
ssh workspace@100.109.173.45 "cd ~/perry && gh pr checks 145"

# 5. CI fails → dispatch follow-up (same task, agent has context)
ssh -o StrictHostKeyChecking=no workspace@100.109.173.45 "cd ~/perry && /home/workspace/.opencode/bin/opencode run 'CI failing: test/auth.test.ts line 42. Fix and push.

When fixed: curl -X POST http://${WAKE_IP}:18789/hooks/wake ...'" &

# 6. CI green → complete task with result
```

## Troubleshooting
- **Can't reach**: `tailscale status | grep <name>`
- **Commands not found**: Use full paths (`/home/workspace/.opencode/bin/opencode`)
- **Wake not firing**: Check IP/token, test with curl
