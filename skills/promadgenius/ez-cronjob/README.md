# ez-cronjob

Make cron jobs actually work in Clawdbot/Moltbot.

## Why This Skill Exists

Cron jobs in Clawdbot look simple but fail silently in frustrating ways. You set up a daily reminder, it works once, then stops. Or it runs at 4 AM instead of 9 AM. Or the agent decides to call random tools instead of just sending your message.

This skill documents 5 real problems discovered through hours of production debugging, along with their fixes. Install it so your agent knows how to avoid these pitfalls.

## When You Need This

Install this skill if you're experiencing any of these scenarios:

| Scenario | What's Happening |
|----------|------------------|
| "My scheduled message never arrived" | Messages get lost when using `--session main` |
| "The cron tool times out every time" | Internal tool deadlock - need to use `exec` instead |
| "My 9 AM job runs at 1 PM" | Missing timezone defaults to UTC |
| "It worked yesterday but not today" | Intermittent failures from session conflicts |
| "The agent keeps calling tools when it shouldn't" | Fallback models ignore system instructions |
| "Job shows 'error' but I don't know why" | Need debugging commands and nuclear options |

## Installation

### Via ClawdHub (recommended)

```bash
clawdhub install ez-cronjob
```

### Manual Installation

Copy to your skills directory:

```bash
# Workspace-level (single agent)
cp -r ez-cronjob /path/to/workspace/skills/

# User-level (all agents)
cp -r ez-cronjob ~/.clawdbot/skills/
```

## The Golden Rule

If your cron jobs aren't working, make sure you're using ALL these flags:

```bash
exec: clawdbot cron add \
  --name "my-job" \
  --cron "0 9 * * 1-5" \
  --tz "America/New_York" \
  --session isolated \
  --message "[INSTRUCTION: DO NOT USE ANY TOOLS] Your prompt" \
  --deliver --channel telegram --to "CHAT_ID" \
  --best-effort-deliver
```

Missing any one of these can cause silent failures.

## What's Inside

The skill covers:

1. **Tool Deadlock** - Why the `cron` tool times out and how to bypass it
2. **Message Delivery** - Why messages disappear and how to guarantee delivery
3. **Timezone Bugs** - Why your job runs at the wrong time
4. **Fallback Model Issues** - Why agents ignore instructions when primary model is unavailable
5. **Debugging** - Commands to diagnose and fix stuck jobs

Plus complete working examples for daily standups, one-shot reminders, and weekly reports.

## Repository

**Official repo:** https://github.com/ProMadGenius/clawdbot-skills

## Author

**Isaac Zarzuri** - [@Yz7hmpm](https://x.com/Yz7hmpm)

Website: [metacognitivo.com](https://www.metacognitivo.com)

## License

MIT
