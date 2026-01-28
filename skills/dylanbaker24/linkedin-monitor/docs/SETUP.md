# LinkedIn Monitor Setup Guide

## Prerequisites

1. **Clawdbot** installed and running
2. **jq** installed (`brew install jq` on macOS)
3. A **Discord server** with a channel for alerts

## Step-by-Step Setup

### 1. Install the Skill

```bash
clawdhub install linkedin-monitor
```

Or clone manually:
```bash
cd ~/.clawdbot/skills
git clone https://github.com/dylanbaker/linkedin-monitor
```

### 2. Set Up Browser Profile

The monitor uses Clawdbot's browser tool to check your LinkedIn inbox.

```bash
# Start the browser
clawdbot browser start --profile clawd
```

A Chrome window will open. **Log into LinkedIn** and leave the browser open.

> **Important:** This browser needs to stay running 24/7. Put it on a second desktop/workspace.

### 3. Get Your Discord Channel ID

1. Open Discord
2. Go to Settings → Advanced → Enable "Developer Mode"
3. Right-click the channel where you want alerts
4. Click "Copy ID"

### 4. Run Setup

```bash
linkedin-monitor setup
```

Enter:
- Your Discord channel ID
- Your calendar link (optional)
- Your timezone

### 5. Verify Health

```bash
linkedin-monitor health
```

All checks should pass:
```
✓ jq installed
✓ Browser profile ready
✓ LinkedIn logged in
✓ Config file exists
✓ Alert channel configured
```

### 6. Test Manually

```bash
linkedin-monitor check
```

This runs one monitoring cycle. You should see either:
- "No new messages" (silent)
- An alert in your Discord channel

### 7. Enable Hourly Monitoring

```bash
linkedin-monitor enable
```

Done! The monitor will now check your inbox every hour.

## Verify It's Working

Check cron is installed:
```bash
crontab -l | grep linkedin
```

Check recent activity:
```bash
linkedin-monitor logs
```

Check status:
```bash
linkedin-monitor status
```

## What Happens Next

1. Every hour, the monitor checks your LinkedIn inbox
2. If someone new messaged you, you get a Discord alert
3. The alert includes a draft reply in your communication style
4. Reply "send [name]" to approve and send
5. Or edit/skip as needed

## Need Help?

- Run `linkedin-monitor health` to diagnose issues
- Check `linkedin-monitor logs` for errors
- See TROUBLESHOOT.md for common problems
