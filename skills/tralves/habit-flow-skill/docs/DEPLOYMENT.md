# HabitFlow Deployment Guide

Quick reference for deploying and using the HabitFlow skill.

## Installation

### Step 1: Clone the Repository

**Workspace installation** (recommended):
```bash
cd ~/clawd/skills  # or your workspace path
git clone https://github.com/tralves/habit-flow-skill.git habit-flow
```

**Or shared installation**:
```bash
mkdir -p ~/.clawdbot/skills
cd ~/.clawdbot/skills
git clone https://github.com/tralves/habit-flow-skill.git habit-flow
```

### Step 2: Install Dependencies

```bash
cd habit-flow
npm install
```

**Time:** ~5 seconds

### Step 3: Activate in Clawdbot

**Option A: Via Agent**
```
User: "refresh skills"
```

**Option B: Restart Gateway**

If you're using a separate gateway, restart it to pick up the new skill.

**Status:** ✅ Skill will be automatically discovered

## Verification

Check that everything is installed correctly:

```bash
# Check TypeScript execution
npx tsx --version

# List installed dependencies
npm list --depth=0

# Verify file structure
ls -la scripts/
ls -la src/
ls -la references/
```

Expected output:
- tsx version displayed
- 6 dependencies listed
- All scripts and source files present

## First Use

The skill automatically initializes on first use. To manually initialize:

```bash
# Create data directory
mkdir -p ~/clawd/habit-flow-data/logs

# Create first habit
npx tsx scripts/manage_habit.ts create \
  --name "Test Habit" \
  --category other \
  --frequency daily \
  --target-count 1

# Verify data files were created
ls -la ~/clawd/habit-flow-data/
```

Expected files:
- `habits.json`
- `config.json`
- `logs/` directory

## Quick Start Commands

### View All Habits
```bash
cd ~/clawd/skills/habit-flow
npx tsx scripts/view_habits.ts --active --format markdown
```

### Log Today's Completion
```bash
cd ~/clawd/skills/habit-flow
npx tsx scripts/log_habit.ts --habit-id <your-habit-id> --status completed
```

### Check Statistics
```bash
cd ~/clawd/skills/habit-flow
npx tsx scripts/get_stats.ts --all --period 7
```

## Using Shell Utilities

For easier usage, load the utility functions:

```bash
# Add to ~/.bashrc or ~/.zshrc
source ~/clawd/skills/habit-flow/examples/utils.sh
```

Then use short commands:
```bash
hlist              # List all habits
hlog meditation    # Log meditation completion
hstats meditation  # View meditation statistics
hstreak meditation # View streak info
```

## Integration with Moltbot

### Activating the Skill

The skill activates automatically when users mention:
- "I want to start [habit name]"
- "I [did habit] today"
- "Show my habit streaks"
- "Remind me to [habit] at [time]"

### Natural Language Examples

**Creating Habits:**
- "I want to meditate every morning"
- "Help me track my daily reading"
- "Can you remind me to exercise at 6am?"

**Logging Completions:**
- "I meditated today"
- "Walked 3 miles yesterday"
- "I went to the gym Monday and Wednesday"
- "Forgot to drink water on Tuesday"

**Checking Progress:**
- "Show my meditation streak"
- "How am I doing with exercise?"
- "Display all my habits"

## Setting Up Reminders

### Step 1: Create Habit with Reminder
```bash
npx tsx scripts/manage_habit.ts create \
  --name "Morning meditation" \
  --category mindfulness \
  --frequency daily \
  --target-count 10 \
  --target-unit minutes \
  --reminder "07:00"
```

### Step 2: Sync to Moltbot Cron
```bash
npx tsx scripts/sync_reminders.ts --sync-all
```

### Step 3: Verify Cron Job
```bash
clawdbot cron list
```

You should see: `HabitFlow: Morning meditation`

## Troubleshooting

### Issue: "command not found: tsx"
**Solution:** Always use `npx tsx` not just `tsx`

### Issue: "Habit not found"
**Solution:**
```bash
# List all habits to get correct ID
npx tsx scripts/view_habits.ts --active

# Use the exact ID from the output
npx tsx scripts/log_habit.ts --habit-id h_exact_id_here --status completed
```

### Issue: "Low confidence in natural language parsing"
**Solution:** Be more specific:
- ❌ "I did it" (too vague)
- ✅ "I meditated today" (clear)
- ✅ "Completed morning meditation" (very clear)

### Issue: "Streak seems incorrect"
**Solution:**
```bash
# Recalculate streaks
npx tsx scripts/calculate_streaks.ts --habit-id h_abc123 --update

# Check logs manually
cat ~/clawd/habit-flow-data/logs/h_abc123_2026.jsonl
```

### Issue: "Reminders not working"
**Solution:**
1. Check clawdbot cron is enabled
2. Verify WhatsApp channel is configured
3. Re-sync reminders: `npx tsx scripts/sync_reminders.ts --sync-all`

## Data Management

### Backup Data
```bash
# Backup all data
cp -r ~/clawd/habit-flow-data ~/habit-flow-backup-$(date +%Y%m%d)

# Or use tar
tar -czf ~/habit-flow-backup-$(date +%Y%m%d).tar.gz ~/clawd/habit-flow-data
```

### Restore Data
```bash
# Restore from backup
cp -r ~/habit-flow-backup-YYYYMMDD ~/clawd/habit-flow-data
```

### View Raw Data
```bash
# View habits
cat ~/clawd/habit-flow-data/habits.json | jq '.'

# View logs for a habit
cat ~/clawd/habit-flow-data/logs/h_abc123_2026.jsonl | jq '.'

# View config
cat ~/clawd/habit-flow-data/config.json
```

### Reset Everything
```bash
# WARNING: This deletes all data!
rm -rf ~/clawd/habit-flow-data
# Skill will reinitialize on next use
```

## Performance Optimization

### For Many Habits (10+)
- Use `--habit-id` instead of `--all` for statistics
- Consider archiving old/unused habits
- Logs are partitioned by year automatically

### For Large History (100+ logs)
- JSONL format is efficient for sequential reads
- Consider archiving old years if needed
- Streak calculation is O(n) where n = logs per year

## Updating the Skill

When new versions are released:

```bash
cd ~/clawd/skills/habit-flow
git pull  # If using git
npm install  # Update dependencies if needed
```

**Data is preserved** - stored separately in `~/clawd/habit-flow-data/`

## Monitoring

### Check Skill Health
```bash
# Verify all scripts work
npx tsx scripts/view_habits.ts --active
npx tsx scripts/get_stats.ts --all --period 1

# Check data directory size
du -sh ~/clawd/habit-flow-data

# Count total habits
jq '.habits | length' ~/clawd/habit-flow-data/habits.json

# Count total logs
find ~/clawd/habit-flow-data/logs -name "*.jsonl" -exec wc -l {} + | tail -1
```

### Common Metrics
- Habit count: Should be < 20 for optimal UX
- Log count: Grows ~365 per habit per year
- Data directory: ~1MB per 10,000 logs
- Parse confidence: Should average >0.7

## Security Notes

### Data Privacy
- All data stored locally in `~/clawd/habit-flow-data/`
- No external API calls (except clawdbot cron)
- Habit names and notes are stored in plain text

### Access Control
- Data directory: `~/clawd/habit-flow-data/` (user-only access)
- Scripts: Can be run by any user with access to the directory
- No authentication required (single-user system)

## Support Resources

- **Quick Start:** `QUICKSTART.md`
- **Full Documentation:** `SKILL.md`
- **Implementation Details:** `IMPLEMENTATION.md`
- **Troubleshooting:** `README.md` (Troubleshooting section)
- **Examples:** `examples/demo.sh`

## Getting Help

If you encounter issues:

1. Check this deployment guide
2. Review `QUICKSTART.md`
3. Run `examples/demo.sh` to verify installation
4. Check raw data files in `~/clawd/habit-flow-data/`
5. Refer to `SKILL.md` for complete documentation

## Production Checklist

Before regular use:

- [ ] Dependencies installed (`npm install`)
- [ ] Test habit created and logged
- [ ] Natural language parsing tested
- [ ] Statistics generated successfully
- [ ] Data directory initialized
- [ ] Utility functions loaded (optional)
- [ ] Reminders configured (if desired)
- [ ] Backup strategy established

---

**Status:** ✅ Ready for production use
**Last Updated:** 2026-01-28
**Version:** 1.0.0
