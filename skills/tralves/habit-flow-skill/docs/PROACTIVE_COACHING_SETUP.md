# Proactive Coaching Setup Guide

## Overview

HabitFlow's proactive coaching system automatically sends personalized coaching messages at optimal times using clawdbot's cron system. This guide explains how it works and how to set it up.

## Architecture

### How Messages Wake Up

```
Scheduled Time (e.g., 8am daily)
         ↓
Clawdbot Cron Triggers
         ↓
Isolated Agent Session Starts
         ↓
Runs: npx tsx scripts/proactive_coaching.ts --check-milestones --check-risks --send
         ↓
Script analyzes habits → generates messages → outputs to stdout
         ↓
Clawdbot's --deliver flag sends output to last active channel
         ↓
User receives coaching message (WhatsApp/Telegram/Discord/etc)
```

### Key Components

1. **Cron Jobs** - Scheduled triggers via `clawdbot cron`
2. **Isolated Sessions** - Fresh agent context for each run
3. **Pattern Analysis** - Risk scoring, milestone detection, insight discovery
4. **Message Generation** - Persona-specific templates
5. **Auto-Delivery** - `--deliver` flag sends output automatically

## Installation & Setup

### 1. First-Time Installation

When you first install HabitFlow, run the initialization script:

```bash
npx tsx scripts/init_skill.ts
```

This will:
- ✅ Create the data directory
- ✅ Set up cron jobs for proactive coaching
- ✅ Save the installed version

### 2. Manual Cron Setup (if needed)

If automatic setup fails or you want to recreate cron jobs:

```bash
# Sync all proactive coaching cron jobs
npx tsx scripts/sync_reminders.ts sync-coaching

# Verify they were created
clawdbot cron list | grep HabitFlow
```

Expected output:
```
HabitFlow: Daily Coaching Check (0 8 * * *)
HabitFlow: Weekly Check-in (0 19 * * 0)
HabitFlow: Pattern Insights (0 10 * * 3)
```

### 3. Check Cron Jobs Status

Use the check script to verify all jobs are configured:

```bash
# Check status
npx tsx scripts/check_cron_jobs.ts

# Check and auto-fix missing jobs
npx tsx scripts/check_cron_jobs.ts --auto-fix

# Verbose output
npx tsx scripts/check_cron_jobs.ts --verbose
```

## Scheduled Coaching Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| Daily Coaching Check | `0 8 * * *` | Milestone celebrations + risk warnings (8am daily) |
| Weekly Check-in | `0 19 * * 0` | Progress summary with trends (Sunday 7pm) |
| Pattern Insights | `0 10 * * 3` | Mid-week pattern detection (Wednesday 10am) |

## How Message Delivery Works

### Clawdbot's Isolated Session + --deliver

When a cron job runs with `--message` and `--deliver`:

1. **Clawdbot starts an isolated agent session** at the scheduled time
2. **The agent executes the message prompt** (runs the TypeScript script)
3. **Script outputs coaching message** to stdout
4. **Clawdbot's --deliver flag sends output** to the user's last active channel
5. **Attachments are handled** via the agent's sendAttachment tool (future enhancement)

### Message Format

The script outputs messages in this format:

```
📤 COACHING MESSAGES FOR DELIVERY

============================================================
🎉 7-Day Streak!

You've maintained meditation for 7 consecutive days—your longest streak yet.

Data shows perfect quality (forgiveness not used). The compound effect is beginning.

📊 Your Progress:
- Current streak: 7 days
- Quality: PERFECT
- New personal record

Next target: 14 days. One week at a time.

📎 Attachments to send: /tmp/streak-h_abc123-1234567890.png
============================================================

✅ Generated 1 coaching message(s)
```

### Delivery Channels

By default, messages go to your **last active channel**. This automatically works for:
- WhatsApp
- Telegram
- Discord
- iMessage
- Slack
- Any channel where you last chatted with your agent

**Optional:** Configure a specific phone number in `~/clawd/habit-flow-data/config.json`:

```json
{
  "timezone": "Europe/Lisbon",
  "activePersona": "flex",
  "userId": "default-user",
  "phoneNumber": "+351912345678"
}
```

## Updates & Maintenance

### When You Update HabitFlow

After pulling updates (e.g., v1.3.0 → v1.3.1):

```bash
# Re-run init to update cron jobs
npx tsx scripts/init_skill.ts

# Or manually check and fix
npx tsx scripts/check_cron_jobs.ts --auto-fix
```

The init script detects version changes and automatically:
- Updates cron jobs with new schedules/messages
- Migrates configuration if needed
- Shows what changed in the new version

### Troubleshooting

**Problem: Cron jobs aren't running**

```bash
# Check if jobs exist
clawdbot cron list | grep HabitFlow

# If missing, recreate
npx tsx scripts/sync_reminders.ts sync-coaching
```

**Problem: Messages not arriving**

- Make sure you've chatted with your agent recently (for "last channel" delivery)
- Check timezone in config.json matches your location
- Run manual test: `npx tsx scripts/proactive_coaching.ts --check-milestones --send`

**Problem: Wrong timezone**

Update `~/clawd/habit-flow-data/config.json`:

```json
{
  "timezone": "America/Los_Angeles"
}
```

Then resync: `npx tsx scripts/sync_reminders.ts sync-coaching`

## Testing

### Dry Run (No Delivery)

```bash
# See what would be sent (no --send flag)
npx tsx scripts/proactive_coaching.ts

# Test specific habit
npx tsx scripts/proactive_coaching.ts --habit-id h_abc123

# Test specific checks
npx tsx scripts/proactive_coaching.ts --check-milestones
npx tsx scripts/proactive_coaching.ts --check-risks
npx tsx scripts/proactive_coaching.ts --weekly-checkin
npx tsx scripts/proactive_coaching.ts --detect-insights
```

### Manual Trigger (With Delivery)

```bash
# Actually send messages (for testing)
npx tsx scripts/proactive_coaching.ts --send

# Send for specific habit
npx tsx scripts/proactive_coaching.ts --habit-id h_abc123 --send
```

Note: Manual `--send` just outputs the formatted message. True delivery requires the clawdbot cron context with `--deliver`.

### Full Test Suite

```bash
bash examples/test-proactive-coaching.sh
```

## Removing Proactive Coaching

To disable proactive coaching:

```bash
# Remove all coaching cron jobs
npx tsx scripts/sync_reminders.ts sync-coaching --remove

# Verify removal
clawdbot cron list | grep HabitFlow
```

You can still use manual coaching by chatting with your agent.

## Image Attachments ✅

The system now delivers coaching messages with Canvas dashboard visualizations!

**How it works:**
1. **Script generates images** - Creates PNG charts (streak, heatmap, trends)
2. **JSON output** - Outputs structured data with image paths when using `--format json`
3. **Agent reads images** - Cron message instructs agent to use Read tool on image files
4. **Complete delivery** - Agent formats message with text + images, delivered via --deliver

**Visualizations included:**
- 📊 **Milestone messages**: Streak chart showing progress
- ⚠️ **Risk warnings**: Heatmap showing completion patterns
- 📈 **Weekly check-ins**: Trends chart + heatmap
- 🔍 **Pattern insights**: Relevant chart based on insight type

**Testing:**
```bash
# Test image generation and attachment
bash examples/test-image-attachments.sh

# Expected: Valid PNG files created and included in JSON output
```

The agent automatically displays these images when delivering coaching messages, providing a rich visual coaching experience!

## Architecture Decisions

### Why Isolated Sessions?

- **Fresh context** each run (no conversation carry-over)
- **Stateless execution** (always analyzes latest data)
- **No token accumulation** (each run is independent)
- **Reliable delivery** (no dependency on conversation state)

### Why stdout + --deliver?

- **Simple integration** (no complex API calls)
- **Agent-agnostic** (works with any clawdbot agent)
- **Automatic persona** (uses user's active persona)
- **Built-in delivery** (clawdbot handles channels)

### Why Three Separate Cron Jobs?

- **Different frequencies** (daily vs weekly vs mid-week)
- **Independent scheduling** (can disable one without affecting others)
- **Clear separation** (milestone/risk vs progress vs insights)
- **Easy debugging** (test each job separately)

## Version Tracking

The system tracks installed version in `~/.clawd/habit-flow-data/.skill-version`:

- First install: Sets up everything
- Update detected: Recreates cron jobs with new configuration
- Same version: Skips redundant setup

This ensures cron jobs stay in sync with skill updates.
