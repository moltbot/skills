# Proactive Coaching Architecture

## Your Questions Answered

### Q: How does the agent wake up for proactive notifications?

**A: Via clawdbot's cron system with isolated sessions**

```
User's Schedule Time (e.g., 8am)
         ↓
Clawdbot Cron Daemon Triggers
         ↓
Spawns Isolated Agent Session
         ↓
Agent executes: npx tsx scripts/proactive_coaching.ts --check-milestones --check-risks --send
         ↓
Script outputs coaching message to stdout
         ↓
Clawdbot's --deliver flag sends stdout to user's last active channel
         ↓
Message arrives on WhatsApp/Telegram/Discord/etc
```

### Q: When are those proactive cron jobs created?

**A: They are NOT created automatically. You must run:**

```bash
# Option 1: Run init script (recommended)
npx tsx scripts/init_skill.ts

# Option 2: Manually sync coaching jobs
npx tsx scripts/sync_reminders.ts sync-coaching
```

**Key Points:**
- ❌ NOT created on `npm install`
- ❌ NOT created when skill is activated
- ✅ Created when you run `init_skill.ts` or `sync-coaching`
- ✅ Should be re-run after skill updates

### Q: Can we make a system to check and (re)create cron jobs for updates?

**A: Yes! We created two systems:**

#### 1. Version-Aware Init Script

`scripts/init_skill.ts` tracks the installed version and auto-updates:

```typescript
// Stored in ~/clawd/habit-flow-data/.skill-version
const SKILL_VERSION = '1.3.0';

// On first run: Creates everything
// On update (v1.2.0 → v1.3.0): Recreates cron jobs with new config
// On same version: Skips redundant setup
```

**Usage:**
```bash
# After pulling updates
git pull
npm install
npx tsx scripts/init_skill.ts  # Detects version change, updates cron jobs
```

#### 2. Cron Job Health Check Script

`scripts/check_cron_jobs.ts` validates all jobs exist:

```bash
# Check status
npx tsx scripts/check_cron_jobs.ts

# Output:
# ✅ HabitFlow: Daily Coaching Check
# ✅ HabitFlow: Weekly Check-in
# ❌ HabitFlow: Pattern Insights - MISSING

# Auto-fix missing jobs
npx tsx scripts/check_cron_jobs.ts --auto-fix
```

**Usage in CI/CD or hooks:**
```bash
# Git post-merge hook
#!/bin/bash
cd ~/clawd/skills/habit-flow
npx tsx scripts/check_cron_jobs.ts --auto-fix
```

## Complete Architecture

### File Structure

```
scripts/
├── proactive_coaching.ts       # Main coaching logic (analyzes habits, generates messages)
├── sync_reminders.ts           # Syncs cron jobs to clawdbot
│   └── sync-coaching command   # Creates/updates coaching cron jobs
├── init_skill.ts               # First-time setup + update detection
└── check_cron_jobs.ts          # Health check + auto-repair

src/
├── pattern-analyzer.ts         # Risk scoring, milestone detection, insights
├── coaching-engine.ts          # Message generation with persona integration
└── message-templates.ts        # Persona-specific templates (6 personas)

docs/
├── PROACTIVE_COACHING_SETUP.md         # User setup guide
└── PROACTIVE_COACHING_ARCHITECTURE.md  # This file (technical architecture)
```

### Data Flow

#### Setup Phase (One-time)

```bash
User runs: npx tsx scripts/init_skill.ts
         ↓
Checks version in ~/.clawd/habit-flow-data/.skill-version
         ↓
If first install or update detected:
         ↓
Calls: sync_reminders.ts sync-coaching
         ↓
Creates 3 cron jobs in clawdbot:
  - HabitFlow: Daily Coaching Check (0 8 * * *)
  - HabitFlow: Weekly Check-in (0 19 * * 0)
  - HabitFlow: Pattern Insights (0 10 * * 3)
         ↓
Saves current version to .skill-version
```

#### Runtime Phase (Scheduled)

```bash
Cron triggers at scheduled time (e.g., 8am)
         ↓
Clawdbot starts isolated agent session with:
  --message "Run HabitFlow proactive coaching check..."
  --deliver
  --channel last
         ↓
Agent executes the message prompt, which runs:
  npx tsx scripts/proactive_coaching.ts --check-milestones --check-risks --send
         ↓
Script loads habits from ~/clawd/habit-flow-data/
         ↓
Pattern analyzer calculates:
  - Risk scores (0-100)
  - Milestone detection (7, 14, 21, 30, 100 days)
  - Pattern insights (day-of-week, trends)
         ↓
Coaching engine generates messages using:
  - Active persona from config
  - Message templates
  - Canvas dashboard charts
         ↓
Script outputs formatted message to stdout:
  "🎉 7-Day Streak!
   You've maintained meditation for 7 consecutive days..."
         ↓
Clawdbot's --deliver flag captures stdout and sends to user
         ↓
Message arrives on user's last active channel
```

### Cron Job Configuration

Each cron job uses this structure:

```bash
clawdbot cron add \
  --name "HabitFlow: Daily Coaching Check" \
  --cron "0 8 * * *" \
  --tz "Europe/Lisbon" \
  --session isolated \
  --message "Run the HabitFlow proactive coaching check for milestones and risk warnings. Execute: npx tsx scripts/proactive_coaching.ts --check-milestones --check-risks --send" \
  --deliver \
  --channel last
```

**Key flags:**
- `--session isolated`: Fresh agent context (no conversation carry-over)
- `--message`: Prompt that executes the TypeScript script
- `--deliver`: Auto-sends agent output to user
- `--channel last`: Uses last place user chatted with agent

### Message Delivery Mechanism

**Old approach (doesn't work for attachments):**
```bash
--command "cd ~/clawd/skills/habit-flow && npx tsx scripts/proactive_coaching.ts --send"
```
❌ Problem: Can't send image attachments, no agent context

**New approach (supports attachments):**
```bash
--message "Run HabitFlow coaching... Execute: npx tsx scripts/proactive_coaching.ts --send"
--deliver
```
✅ Benefit: Agent session can use sendAttachment tool for images

**How stdout becomes a message:**
1. Script outputs formatted text to stdout
2. Clawdbot captures stdout from the isolated session
3. `--deliver` flag sends captured output to `--channel last`
4. User receives the message on WhatsApp/Telegram/etc

## Update Workflow

### Scenario: Skill Updated (v1.3.0 → v1.3.1)

```bash
# User pulls updates
cd ~/clawd/skills/habit-flow
git pull

# Option 1: Run init script (recommended)
npx tsx scripts/init_skill.ts

# Output:
# 📦 Update detected: v1.3.0 → v1.3.1
# 📅 Setting up proactive coaching cron jobs...
# ✅ Proactive coaching cron jobs synced:
#    - HabitFlow: Daily Coaching Check (0 8 * * *)
#    - HabitFlow: Weekly Check-in (0 19 * * 0)
#    - HabitFlow: Pattern Insights (0 10 * * 3)
# ✅ Version saved: v1.3.1

# Option 2: Check and auto-fix
npx tsx scripts/check_cron_jobs.ts --auto-fix
```

### Scenario: Cron Job Accidentally Deleted

```bash
# Check status
npx tsx scripts/check_cron_jobs.ts

# Output:
# ✅ HabitFlow: Daily Coaching Check
# ❌ HabitFlow: Weekly Check-in - MISSING
# ✅ HabitFlow: Pattern Insights

# Auto-fix
npx tsx scripts/check_cron_jobs.ts --auto-fix

# Output:
# 🔧 Auto-fixing missing cron jobs...
# ✅ Created: HabitFlow: Weekly Check-in
```

## Future Enhancements

### Image Attachments (Pending)

Currently, Canvas dashboard images are generated but not attached to messages. To implement:

1. **Update proactive_coaching.ts** to use clawdbot's sendAttachment tool:
```typescript
// Instead of outputting to stdout
console.log(message.body);

// Use sendAttachment tool (when available in isolated sessions)
await agent.sendAttachment({
  text: message.body,
  attachments: message.attachments.map(path => ({
    type: 'image/png',
    path: path
  }))
});
```

2. **Research clawdbot's sendAttachment API** for isolated sessions
3. **Test multi-part message delivery** (text + image)

### Programmatic Send API

Currently relies on stdout + --deliver. Could add direct send API:

```typescript
import { ClawdbotClient } from 'clawdbot-sdk'; // hypothetical

async function sendMessages(messages: CoachingMessage[]) {
  const client = new ClawdbotClient();
  for (const message of messages) {
    await client.send({
      channel: 'last',
      text: message.body,
      attachments: message.attachments
    });
  }
}
```

### Smart Scheduling

Dynamic scheduling based on user patterns:

```typescript
// Analyze when user typically checks messages
const optimalTime = analyzeUserActivityPatterns();

// Update cron schedule
await updateCronSchedule('Daily Coaching Check', optimalTime);
```

## Testing

### Manual Testing

```bash
# Dry run (no delivery)
npx tsx scripts/proactive_coaching.ts

# Simulate send (outputs formatted message)
npx tsx scripts/proactive_coaching.ts --send

# Test specific checks
npx tsx scripts/proactive_coaching.ts --check-milestones
npx tsx scripts/proactive_coaching.ts --check-risks
npx tsx scripts/proactive_coaching.ts --weekly-checkin
npx tsx scripts/proactive_coaching.ts --detect-insights
```

### Integration Testing

```bash
# Test cron job creation
npx tsx scripts/sync_reminders.ts sync-coaching

# Verify jobs exist
clawdbot cron list | grep HabitFlow

# Test health check
npx tsx scripts/check_cron_jobs.ts --verbose

# Test auto-fix
npx tsx scripts/sync_reminders.ts sync-coaching --remove
npx tsx scripts/check_cron_jobs.ts --auto-fix

# Test version tracking
rm ~/clawd/habit-flow-data/.skill-version
npx tsx scripts/init_skill.ts  # Should treat as first install
```

### Full Test Suite

```bash
bash examples/test-proactive-coaching.sh
```

## Monitoring & Debugging

### Check Cron Job Status

```bash
# List all HabitFlow cron jobs
clawdbot cron list | grep HabitFlow

# Check specific job
clawdbot cron list | grep "Daily Coaching Check"
```

### View Cron Logs

```bash
# If clawdbot provides log access
clawdbot cron logs "HabitFlow: Daily Coaching Check"
```

### Manually Trigger Cron Job

```bash
# Simulate what cron would execute
cd ~/clawd/skills/habit-flow
npx tsx scripts/proactive_coaching.ts --check-milestones --check-risks --send
```

### Debug Message Generation

```bash
# See what messages would be generated
npx tsx scripts/proactive_coaching.ts --habit-id h_abc123

# Test with different personas
# Edit ~/clawd/habit-flow-data/config.json → change activePersona
npx tsx scripts/proactive_coaching.ts --weekly-checkin
```

## Security & Privacy

- ✅ All data stored locally in `~/clawd/habit-flow-data/`
- ✅ No external API calls for analysis
- ✅ Cron jobs run in user's local environment
- ✅ Messages sent through user's clawdbot instance
- ✅ No telemetry or tracking

## Image Attachments Implementation ✅

**Status: COMPLETE**

The system now delivers coaching messages with Canvas dashboard visualizations using an agent-based approach:

### How It Works

1. **JSON Output Format**
   ```bash
   npx tsx scripts/proactive_coaching.ts --weekly-checkin --format json
   ```
   Outputs structured data:
   ```json
   {
     "messages": [{
       "subject": "📊 Weekly Progress",
       "body": "This week: 6/7 days...",
       "attachments": [
         "/tmp/trends-h_abc123-123456.png",
         "/tmp/heatmap-h_abc123-123456.png"
       ]
     }]
   }
   ```

2. **Agent-Based Delivery**
   Cron message instructs the agent to:
   - Execute the script with `--format json`
   - Parse the JSON output
   - Use Read tool to display each image file
   - Format complete message with visualizations
   - Output is delivered via --deliver flag

3. **Benefits**
   - ✅ Agent can display images using Read tool
   - ✅ Images are embedded in the message
   - ✅ Works with clawdbot's delivery system
   - ✅ No need for separate sendAttachment API

### Testing

```bash
# Test image generation and JSON output
bash examples/test-image-attachments.sh

# Expected output:
# ✅ Valid JSON output
# ✅ Valid PNG images generated
# ✅ Attachment paths included in JSON
```

## Summary

**Proactive coaching works by:**
1. **Scheduled cron jobs** trigger at optimal times (daily, weekly, mid-week)
2. **Isolated agent sessions** run the proactive coaching script with `--format json`
3. **Pattern analysis** generates personalized insights
4. **Canvas visualizations** created as PNG files
5. **Agent-based delivery** - agent reads images and formats message
6. **Automatic delivery** via clawdbot's --deliver flag to user's channel

**Setup requires:**
1. Run `npx tsx scripts/init_skill.ts` after installation
2. Re-run after skill updates to refresh cron jobs
3. Optionally monitor with `check_cron_jobs.ts`

**Key innovations:**
- Using `--message` + `--deliver` enables agent tool usage in isolated sessions
- JSON format allows structured data parsing by the agent
- Agent's Read tool displays images directly in messages
- Complete coaching experience with text + visualizations
