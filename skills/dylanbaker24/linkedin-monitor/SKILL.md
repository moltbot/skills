---
name: linkedin-monitor
description: Bulletproof LinkedIn inbox monitoring with progressive autonomy. Monitors messages hourly, drafts replies in your voice, and alerts you to new conversations. Supports 4 autonomy levels from monitor-only to full autonomous.
version: 1.0.0
author: Dylan Baker / lilAgents
---

# LinkedIn Monitor

Reliable LinkedIn inbox monitoring for Clawdbot.

## Features

- **Hourly monitoring** — Checks inbox every hour, 24/7
- **Deterministic state** — No duplicate notifications, ever
- **Progressive autonomy** — Start supervised, graduate to autonomous
- **Health checks** — Alerts when auth expires or things break
- **Your voice** — Drafts replies using your communication style

## Quick Start

```bash
# 1. Setup (interactive)
linkedin-monitor setup

# 2. Verify health
linkedin-monitor health

# 3. Run manually (test)
linkedin-monitor check

# 4. Enable cron (hourly)
linkedin-monitor enable
```

## Autonomy Levels

| Level | Name | Behavior |
|-------|------|----------|
| 0 | Monitor Only | Alerts to new messages only |
| 1 | Draft + Approve | Drafts replies, waits for approval |
| 2 | Auto-Reply Simple | Auto-handles acknowledgments, scheduling |
| 3 | Full Autonomous | Replies as you, books meetings, networks |

**Default: Level 1** — Change with `linkedin-monitor config autonomyLevel 2`

## Commands

```bash
linkedin-monitor setup      # Interactive setup wizard
linkedin-monitor health     # Check auth status
linkedin-monitor check      # Run one check cycle
linkedin-monitor enable     # Enable hourly cron
linkedin-monitor disable    # Disable cron
linkedin-monitor status     # Show current state
linkedin-monitor config     # View/edit configuration
linkedin-monitor logs       # View recent activity
linkedin-monitor reset      # Clear state (start fresh)
```

## Configuration

Location: `~/.clawdbot/linkedin-monitor/config.json`

```json
{
  "autonomyLevel": 1,
  "alertChannel": "discord",
  "alertChannelId": "YOUR_CHANNEL_ID",
  "calendarLink": "cal.com/yourname",
  "communicationStyleFile": "USER.md",
  "timezone": "America/New_York",
  "schedule": "0 * * * *",
  "morningDigest": {
    "enabled": true,
    "hour": 9,
    "timezone": "Asia/Bangkok"
  },
  "safetyLimits": {
    "maxMessagesPerDay": 50,
    "escalationKeywords": ["angry", "legal", "refund"],
    "dailyDigest": true
  }
}
```

## How It Works

### Monitoring Flow

```
1. Health Check
   └── Verify LinkedIn auth (lk CLI)
   
2. Fetch Messages
   └── lk message list --json
   
3. Compare State
   └── Filter: only messages not in state file
   
4. For Each New Message
   ├── Level 0: Alert only
   ├── Level 1: Draft reply → Alert → Wait for approval
   ├── Level 2: Simple = auto-reply, Complex = draft
   └── Level 3: Full autonomous response
   
5. Update State
   └── Record message IDs (prevents duplicates)
```

### State Management

State is managed by scripts, not the LLM. This guarantees:
- No duplicate notifications
- Consistent behavior across sessions
- Visible state for debugging

State files: `~/.clawdbot/linkedin-monitor/state/`

## Sending Approved Messages

When at Level 1, approve drafts with:

```
send [name]           # Send draft to [name]
send all              # Send all pending drafts
edit [name] [text]    # Edit draft before sending
skip [name]           # Discard draft
```

## Troubleshooting

### "Auth expired"
```bash
lk auth login
linkedin-monitor health
```

### "No messages found"
```bash
linkedin-monitor check --debug
```

### Duplicate notifications
```bash
linkedin-monitor reset  # Clear state
linkedin-monitor check  # Fresh start
```

## Dependencies

- `lk` CLI (LinkedIn CLI) — `npm install -g lk`
- `jq` (JSON processor) — `brew install jq`

## Files

```
~/.clawdbot/linkedin-monitor/
├── config.json          # Your configuration
├── state/
│   ├── messages.json    # Seen message IDs
│   ├── lastrun.txt      # Last check timestamp
│   └── drafts.json      # Pending drafts
└── logs/
    └── activity.log     # Activity history
```
