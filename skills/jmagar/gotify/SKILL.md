---
name: gotify
description: Send push notifications via Gotify when long-running tasks complete or important events occur. Use when the user asks to "send a Gotify notification", "notify me when this finishes", "push notification", "alert me via Gotify", or wants to be notified of task completion.
version: 1.0.0
metadata:
  clawdbot:
    emoji: "🔔"
    requires:
      bins: ["curl", "jq"]
---

# Gotify Notification Skill

Send push notifications to your Gotify server when long-running tasks complete or important events occur.

## Purpose

This skill enables Clawdbot to send push notifications via Gotify, useful for:
- Alerting when long-running tasks complete
- Sending status updates for background operations
- Notifying of important events or errors
- Integration with task completion hooks

## Setup

Create the credentials file: `~/.clawdbot/credentials/gotify/config.json`

```json
{
  "url": "https://gotify.example.com",
  "token": "YOUR_APP_TOKEN"
}
```

- `url`: Your Gotify server URL (no trailing slash)
- `token`: Application token from Gotify (Settings → Apps → Create Application)

## Usage

### Basic Notification

```bash
bash scripts/send.sh "Task completed successfully"
```

### With Title

```bash
bash scripts/send.sh --title "Build Complete" --message "skill-sync tests passed"
```

### With Priority (0-10)

```bash
bash scripts/send.sh -t "Critical Alert" -m "Service down" -p 10
```

### Markdown Support

```bash
bash scripts/send.sh --title "Deploy Summary" --markdown --message "
## Deployment Complete

- **Status**: ✅ Success
- **Duration**: 2m 34s
- **Commits**: 5 new
"
```

## Integration with Task Completion

### Option 1: Direct Call After Task

```bash
# Run long task
./deploy.sh && bash ~/clawd/skills/gotify/scripts/send.sh "Deploy finished"
```

### Option 2: Hook Integration (Future)

When Clawdbot supports task completion hooks, this skill can be triggered automatically:

```bash
# Example hook configuration (conceptual)
{
  "on": "task_complete",
  "run": "bash ~/clawd/skills/gotify/scripts/send.sh 'Task: {{task_name}} completed in {{duration}}'"
}
```

## Parameters

- `-m, --message <text>`: Notification message (required)
- `-t, --title <text>`: Notification title (optional)
- `-p, --priority <0-10>`: Priority level (default: 5)
  - 0-3: Low priority
  - 4-7: Normal priority
  - 8-10: High priority (may trigger sound/vibration)
- `--markdown`: Enable markdown formatting in message

## Examples

### Notify when subagent finishes

```bash
# After spawning subagent
sessions_spawn --task "Research topic" --label my-research
# ... wait for completion ...
bash scripts/send.sh -t "Research Complete" -m "Check session: my-research"
```

### Notify on error with high priority

```bash
if ! ./critical-task.sh; then
  bash scripts/send.sh -t "⚠️ Critical Failure" -m "Task failed, check logs" -p 10
fi
```

### Rich markdown notification

```bash
bash scripts/send.sh --markdown -t "Daily Summary" -m "
# System Status

## ✅ Healthy
- UniFi: 34 clients
- Sonarr: 1,175 shows
- Radarr: 2,551 movies

## 📊 Stats
- Uptime: 621h
- Network: All OK
"
```

## Workflow

When the user says:
- **"Notify me when this finishes"** → Add `&& bash scripts/send.sh "Task complete"` to their command
- **"Send a Gotify alert"** → Run `bash scripts/send.sh` with their message
- **"Push notification for task completion"** → Integrate into their workflow with appropriate title/priority

Always confirm the notification was sent successfully (check for JSON response with message ID).

## Notes

- Requires network access to your Gotify server
- App token must have "create message" permission
- Priority levels affect notification behavior on client devices
- Markdown support depends on Gotify client version (most modern clients support it)

## Reference

- Gotify API docs: https://gotify.net/docs/
- Gotify Android/iOS apps for receiving notifications
