# Troubleshooting LinkedIn Monitor

## Common Issues

### "Browser not running"

**Problem:** The clawd browser isn't running.

**Solution:**
```bash
clawdbot browser start --profile clawd
```

Then log into LinkedIn if needed.

### "LinkedIn logged out"

**Problem:** Your LinkedIn session expired.

**Solution:**
1. Find the clawd browser (usually on second desktop)
2. Log back into LinkedIn manually
3. Run `linkedin-monitor health` to verify

### "Config not found"

**Problem:** Setup hasn't been run.

**Solution:**
```bash
linkedin-monitor setup
```

### "Alert channel not configured"

**Problem:** Discord channel ID is missing.

**Solution:**
```bash
linkedin-monitor setup
# Or edit directly:
linkedin-monitor config alertChannelId YOUR_CHANNEL_ID
```

### "Cron not installed"

**Problem:** Hourly monitoring isn't enabled.

**Solution:**
```bash
linkedin-monitor enable
```

### "Duplicate notifications"

**Problem:** Same message reported multiple times.

**Solution:** This shouldn't happen with the new system, but if it does:
```bash
linkedin-monitor reset
```

This clears the state file. Next check will treat all messages as new.

### "Watchdog alert: Monitor may be down"

**Problem:** The hourly check hasn't run in 2+ hours.

**Solution:**
1. Run `linkedin-monitor health` to find the issue
2. Fix whatever's broken (usually browser or auth)
3. Run `linkedin-monitor check` to restart

### "No messages appearing"

**Problem:** Monitor runs but never reports anything.

**Possible causes:**
1. No one has messaged you (check LinkedIn directly)
2. Browser is on wrong page (should be linkedin.com/messaging/)
3. State file has all messages marked as seen

**Solution:**
```bash
# Check what the monitor sees
linkedin-monitor check --debug

# If needed, reset state
linkedin-monitor reset
```

## Debug Mode

Run with debug output:
```bash
DEBUG=1 linkedin-monitor check
```

This shows detailed logs of what's happening.

## View Logs

```bash
# Recent activity
linkedin-monitor logs

# Full log file
cat ~/.clawdbot/linkedin-monitor/logs/activity.log
```

## Reset Everything

Nuclear option — start fresh:
```bash
linkedin-monitor disable
linkedin-monitor reset
rm -rf ~/.clawdbot/linkedin-monitor
linkedin-monitor setup
linkedin-monitor enable
```

## Still Stuck?

1. Check Clawdbot is running: `clawdbot status`
2. Check browser is running: `clawdbot browser status --profile clawd`
3. Check cron is installed: `crontab -l | grep linkedin`
4. Open an issue on GitHub with your `linkedin-monitor health` output
