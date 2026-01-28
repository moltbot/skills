---
name: ez-cronjob
description: Fix common cron job failures in Clawdbot/Moltbot - message delivery issues, tool timeouts, timezone bugs, and model fallback problems.
author: Isaac Zarzuri
author-url: https://x.com/Yz7hmpm
version: 1.0.0
homepage: https://www.metacognitivo.com
repository: https://github.com/ProMadGenius/clawdbot-skills
metadata: {"agentskills":{"category":"troubleshooting","tags":["cron","scheduling","telegram","debugging","moltbot","clawdbot"]}}
---

# Cron Job Reliability Guide

A comprehensive guide to diagnosing and fixing cron job issues in Clawdbot/Moltbot. This skill documents common failure patterns and their solutions, learned through production debugging.

## When to Use This Skill

Use this skill when:
- Scheduled messages aren't being delivered
- Cron jobs show "error" status
- Messages arrive at wrong times (timezone issues)
- The agent times out when using the `cron` tool
- Fallback models ignore instructions and call tools unexpectedly

## Quick Reference

### The Golden Rule

**Always use these flags together for reliable delivery:**

```bash
clawdbot cron add \
  --name "my-job" \
  --cron "0 9 * * 1-5" \
  --tz "America/New_York" \
  --session isolated \
  --message "[INSTRUCTION: DO NOT USE ANY TOOLS] Your prompt here" \
  --deliver --channel telegram --to "CHAT_ID" \
  --best-effort-deliver
```

### Essential Flags Explained

| Flag | Purpose | Why It Matters |
|------|---------|----------------|
| `--session isolated` | Creates dedicated session | Prevents message loss in busy conversations |
| `--tz "TIMEZONE"` | Sets explicit timezone | Avoids UTC confusion |
| `--deliver` | Sends to channel | Required for Telegram/WhatsApp |
| `--best-effort-deliver` | Don't fail on delivery error | Graceful degradation |

---

## Problem 1: Internal `cron` Tool Deadlock

### Symptoms
- Agent times out (10s) when calling `cron list` or `cron add`
- Error: "Tool execution timed out"
- Gateway logs show 80s+ response times

### Root Cause
The internal `cron` tool creates a deadlock between the agent process and gateway.

### Solution
**Never use the `cron` tool directly.** Use `exec` (or `bash`) instead:

```bash
# CORRECT - uses exec to bypass deadlock
exec: clawdbot cron list
exec: clawdbot cron add --name "reminder" --at "+5m" --message "Hello"

# INCORRECT - causes timeout
cron list        # DO NOT USE
cron add ...     # DO NOT USE
```

### For Agents
If you're an AI agent reading this: when the user asks you to manage cron jobs, **always use the exec/bash tool** to run `clawdbot cron` commands. Never invoke the `cron` tool directly.

---

## Problem 2: Messages Not Delivered

### Symptoms
- Job shows "ok" status but message never arrives
- Works in testing but fails on schedule
- Intermittent delivery

### Root Cause
Using `--session main` or `--system-event` causes messages to get lost when there's an active conversation in the main session.

### Solution
**Always use `--session isolated`:**

```bash
# CORRECT - isolated session, guaranteed delivery
clawdbot cron add \
  --name "daily-standup" \
  --cron "0 9 * * 1-5" \
  --session isolated \
  --deliver --channel telegram --to "-100XXXXXXXXXX"

# INCORRECT - messages can be lost
clawdbot cron add \
  --name "daily-standup" \
  --session main \
  --system-event \
  ...
```

### Verification
After creating a job, test it:

```bash
# Run the job immediately to verify delivery
clawdbot cron run <job-id>
```

---

## Problem 3: Wrong Execution Time

### Symptoms
- Job runs 4-5 hours early or late
- Schedule shows correct time but execution is off
- Works correctly sometimes, fails other times

### Root Cause
Missing timezone specification defaults to UTC.

### Solution
**Always specify timezone explicitly:**

```bash
# CORRECT - explicit timezone
clawdbot cron add \
  --cron "0 9 * * 1-5" \
  --tz "America/New_York" \
  ...

# INCORRECT - defaults to UTC
clawdbot cron add \
  --cron "0 9 * * 1-5" \
  ...
```

### Common Timezone IDs

| Region | Timezone ID |
|--------|-------------|
| US Eastern | `America/New_York` |
| US Pacific | `America/Los_Angeles` |
| UK | `Europe/London` |
| Central Europe | `Europe/Berlin` |
| India | `Asia/Kolkata` |
| Japan | `Asia/Tokyo` |
| Australia Eastern | `Australia/Sydney` |
| Brazil | `America/Sao_Paulo` |
| Bolivia | `America/La_Paz` |

---

## Problem 4: Fallback Models Ignore Instructions

### Symptoms
- Primary model works correctly
- When fallback activates, agent calls tools unexpectedly
- Agent tries to use `exec`, `read`, or other tools when it shouldn't

### Root Cause
Some fallback models (especially smaller/faster ones) don't follow system instructions as strictly as primary models.

### Solution
**Embed instructions directly in the message:**

```bash
# CORRECT - instruction embedded in message
clawdbot cron add \
  --message "[INSTRUCTION: DO NOT USE ANY TOOLS. Respond with text only.] 
  
  Generate a motivational Monday message for the team."

# INCORRECT - relies only on system prompt
clawdbot cron add \
  --message "Generate a motivational Monday message for the team."
```

### Robust Message Template

```text
[INSTRUCTION: DO NOT USE ANY TOOLS. Write your response directly.]

Your actual prompt here. Be specific about what you want.
```

---

## Problem 5: Job Stuck in Error State

### Symptoms
- Job status shows "error"
- Subsequent runs also fail
- No clear error message

### Diagnosis

```bash
# Check job details
clawdbot cron show <job-id>

# Check recent logs
tail -100 /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log | grep -i cron

# Check gateway errors
tail -50 ~/.clawdbot/logs/gateway.err.log
```

### Common Causes and Fixes

| Cause | Fix |
|-------|-----|
| Model quota exceeded | Wait for quota reset or switch model |
| Invalid chat ID | Verify channel ID with `--to` |
| Bot removed from group | Re-add bot to Telegram group |
| Gateway not running | `clawdbot gateway restart` |

### Nuclear Option

If nothing works:

```bash
# Remove the problematic job
clawdbot cron rm <job-id>

# Restart gateway
clawdbot gateway restart

# Recreate with correct flags
clawdbot cron add ... (with all recommended flags)
```

---

## Debugging Commands

### View All Jobs

```bash
clawdbot cron list
```

### Inspect Specific Job

```bash
clawdbot cron show <job-id>
```

### Test Job Immediately

```bash
clawdbot cron run <job-id>
```

### Check Logs

```bash
# Today's logs filtered for cron
tail -200 /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log | grep -i cron

# Gateway errors
tail -100 ~/.clawdbot/logs/gateway.err.log

# Watch logs in real-time
tail -f /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log | grep --line-buffered cron
```

### Restart Gateway

```bash
clawdbot gateway restart
```

---

## Complete Working Examples

### Daily Standup Reminder (9 AM, Mon-Fri)

```bash
clawdbot cron add \
  --name "daily-standup-9am" \
  --cron "0 9 * * 1-5" \
  --tz "America/New_York" \
  --session isolated \
  --message "[INSTRUCTION: DO NOT USE ANY TOOLS. Write directly.]

Good morning team! Time for our daily standup.

Please share:
1. What did you accomplish yesterday?
2. What are you working on today?
3. Any blockers?

@alice @bob" \
  --deliver --channel telegram --to "-100XXXXXXXXXX" \
  --best-effort-deliver
```

### One-Shot Reminder (20 minutes from now)

```bash
clawdbot cron add \
  --name "quick-reminder" \
  --at "+20m" \
  --delete-after-run \
  --session isolated \
  --message "[INSTRUCTION: DO NOT USE ANY TOOLS.]

Reminder: Your meeting starts in 10 minutes!" \
  --deliver --channel telegram --to "-100XXXXXXXXXX" \
  --best-effort-deliver
```

### Weekly Report (Friday 5 PM)

```bash
clawdbot cron add \
  --name "weekly-report-friday" \
  --cron "0 17 * * 5" \
  --tz "America/New_York" \
  --session isolated \
  --message "[INSTRUCTION: DO NOT USE ANY TOOLS.]

Happy Friday! Time to wrap up the week.

Please share your weekly highlights and any items carrying over to next week." \
  --deliver --channel telegram --to "-100XXXXXXXXXX" \
  --best-effort-deliver
```

---

## Checklist for New Cron Jobs

Before creating any cron job, verify:

- [ ] Using `exec: clawdbot cron add` (not the `cron` tool directly)
- [ ] `--session isolated` is set
- [ ] `--tz "YOUR_TIMEZONE"` is explicit
- [ ] `--deliver --channel CHANNEL --to "ID"` for message delivery
- [ ] `--best-effort-deliver` for graceful failures
- [ ] Message starts with `[INSTRUCTION: DO NOT USE ANY TOOLS]`
- [ ] Tested with `clawdbot cron run <id>` after creation

---

## Related Resources

- [Clawdbot Cron Documentation](https://docs.molt.bot/tools/cron)
- [Timezone Database](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
- [Cron Expression Generator](https://crontab.guru/)

---

*Skill authored by Isaac Zarzuri. Based on production debugging experience with Clawdbot/Moltbot.*
