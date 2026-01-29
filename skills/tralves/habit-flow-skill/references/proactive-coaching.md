# Proactive Coaching System

## Overview

The Proactive Coaching system automatically initiates coaching interactions at optimal moments without requiring user prompts. It analyzes habit data to detect milestones, risks, patterns, and opportunities for coaching intervention.

## Architecture

### Components

1. **Pattern Analyzer** (`src/pattern-analyzer.ts`)
   - Risk assessment scoring (0-100)
   - Milestone detection (7, 14, 21, 30, 100 days)
   - Pattern insight discovery (day-of-week, trends, consistency)

2. **Coaching Engine** (`src/coaching-engine.ts`)
   - Message generation with persona integration
   - Canvas dashboard attachment
   - Priority assignment

3. **Message Templates** (`src/message-templates.ts`)
   - Persona-specific templates (Flex, Coach Blaze, Luna, Ava, Max, The Monk)
   - Message types: milestone, risk, weekly, insight

4. **Proactive Coaching Script** (`scripts/proactive_coaching.ts`)
   - CLI tool for generating messages
   - Dry run and send modes
   - Filtering by habit or message type

5. **Cron Integration** (`scripts/sync_reminders.ts`)
   - Daily checks (8am): milestones + risks
   - Weekly check-in (Sunday 7pm)
   - Pattern insights (Wednesday 10am)

## Coaching Triggers

### 1. Milestone Celebrations

**When:** Streak reaches 7, 14, 21, 30, or 100 days

**Example Message (Flex):**
```
🎉 Milestone Alert: 7-Day Streak

You've maintained meditation for 7 consecutive days—your longest streak yet.

Data shows perfect quality (forgiveness not used). The compound effect is beginning.

📊 Your Progress:
- Current streak: 7 days
- Quality: PERFECT
- New personal record

Next target: 14 days. One week at a time.
```

**Attachments:** Streak chart

**Priority:** High

### 2. Risk Warnings

**When:** Risk score ≥ 60 (based on missed days, weak day patterns, weekend ahead, declining trends)

**Risk Factors:**
- Missed yesterday (+40 risk)
- Tomorrow is historically weak day (+30 risk)
- Weekend approaching (+20 risk)
- Declining trend in last 7 days (+10 risk)

**Example Message (Coach Blaze):**
```
⚠️ HEADS UP, WARRIOR!

I've been watching your meditation data, and we need to TALK!

🚨 Risk factors:
• Missed yesterday
• Sunday is historically difficult (30% success)
• Weekend ahead—routine disruption

You're on a 12-day streak! We're NOT letting this die!

🛡️ BATTLE PLAN:
• Use 2-minute rule—just show up
• Set a specific time and location for tomorrow
• Plan weekend habit first thing in morning

You got this! LOCK IN and EXECUTE! 💪
```

**Attachments:** Heatmap

**Priority:** High

### 3. Weekly Check-ins

**When:** Every Sunday at 7pm

**Stats Included:**
- Days completed this week (X/7)
- Completion rate percentage
- Current streak length
- Week-over-week trend

**Example Message (Luna):**
```
🌙 Your Weekly Reflection

This week, you showed up for meditation 6 out of 7 days—a 85% expression of your commitment.

Your 9-day streak continues to grow.

Something shifted this week (+15%). What changed?

Let's hold space for what this journey means to you.
```

**Attachments:** Trends chart + heatmap

**Priority:** Medium

### 4. Pattern Insights

**When:** Significant patterns detected (checked Wednesday 10am)

**Pattern Types:**
- Day-of-week disparity (>30% difference between best and worst days)
- Significant improvement (>20% increase in completion rate)
- High consistency (≥85% completion)
- Declining trend (>20% decrease)

**Example Message (Flex):**
```
🔍 Pattern Detection: Meditation

Analysis reveals: Your Monday success rate (45%) is much higher than Saturday (15%)

Best: Monday (45%)
Worst: Saturday (15%)

This data point may inform optimization strategies. Worth exploring?
```

**Attachments:** Heatmap or trends chart

**Priority:** Low

## Risk Scoring Algorithm

```typescript
Risk = 0

if (missed yesterday)           Risk += 40
if (tomorrow is weak day <50%)  Risk += 30
if (weekend approaching)        Risk += 20
if (declining trend)            Risk += 10

Total Risk = min(100, Risk)

Send warning if Risk >= 60
```

## Pattern Detection Algorithm

**Day-of-Week Pattern:**
1. Group logs by day of week
2. Calculate success rate per day
3. If (best_day - worst_day) > 30%, generate insight

**Improvement/Decline:**
1. Calculate completion rate last 7 days
2. Calculate completion rate prior 7 days
3. If difference > 20%, generate insight

**Consistency:**
1. Calculate completion rate last 7 days
2. If rate >= 85%, generate insight

## Message Personalization

All messages adapt to the user's active persona:

- **Flex:** Professional, data-driven, analytical
- **Coach Blaze:** Energetic, motivational, caps-heavy
- **Luna:** Gentle, reflective, question-based
- **Ava:** Friendly, practical, straightforward
- **Max:** Concise, bullet-point style, matter-of-fact
- **The Monk:** Wise, minimalist, philosophical

## Canvas Dashboard Integration

Coaching messages automatically include relevant visualizations:

- **Milestones:** Streak chart showing growth over time
- **Risk warnings:** Heatmap showing completion patterns
- **Weekly check-ins:** Trends chart + heatmap
- **Pattern insights:** Heatmap (day patterns) or trends chart (improvements)

Charts are generated at message creation time and attached as images.

## Cron Schedule

| Job | Schedule | Description |
|-----|----------|-------------|
| Daily Coaching Check | `0 8 * * *` | Milestone + risk detection (8am daily) |
| Weekly Check-in | `0 19 * * 0` | Progress summary (Sunday 7pm) |
| Pattern Insights | `0 10 * * 3` | Mid-week insights (Wednesday 10am) |

## Usage

### Manual Testing

```bash
# Dry run - see what would be sent
npx tsx scripts/proactive_coaching.ts

# Test specific habit
npx tsx scripts/proactive_coaching.ts --habit-id h_abc123

# Check only milestones
npx tsx scripts/proactive_coaching.ts --check-milestones

# Check only risks
npx tsx scripts/proactive_coaching.ts --check-risks

# Generate weekly check-in
npx tsx scripts/proactive_coaching.ts --weekly-checkin

# Detect insights
npx tsx scripts/proactive_coaching.ts --detect-insights

# Actually send (not dry run)
npx tsx scripts/proactive_coaching.ts --send
```

### Syncing Cron Jobs

```bash
# Add/update all proactive coaching jobs
npx tsx scripts/sync_reminders.ts sync-coaching

# Remove all proactive coaching jobs
npx tsx scripts/sync_reminders.ts sync-coaching --remove

# List current cron jobs
clawdbot cron list
```

## Design Principles

1. **Non-Intrusive** - Only send high-value messages, avoid spam
2. **Persona-Consistent** - All messages match user's chosen persona
3. **Data-Driven** - Base coaching on actual patterns, not assumptions
4. **Actionable** - Every message includes clear next steps
5. **Visual** - Leverage Canvas dashboards for impact
6. **Privacy-First** - All analysis happens locally, no external APIs
7. **Opt-Out Friendly** - Easy to disable specific message types

## Future Enhancements (Phase 4+)

- Time-of-day optimization (requires logTime data collection)
- Adaptive technique learning (A/B testing which techniques work)
- Multi-turn coaching conversations with state management
- Social accountability features (partner challenges)
- Predictive ML models for streak forecasting
