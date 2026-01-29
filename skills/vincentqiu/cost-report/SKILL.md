---
name: clawdbot-cost-tracker
description: Track Clawdbot AI model usage and estimate costs. Use when reporting daily/weekly costs, analyzing token usage across sessions, or monitoring AI spending. Supports Claude (opus/sonnet), GPT, and Codex models.
---

# Clawdbot Cost Tracker

Track token usage and estimate API costs across all Clawdbot sessions.

## Quick Start

### Get Current Usage

```bash
# Use sessions_list to get token data
sessions_list --limit 20 --messageLimit 0
```

Extract `totalTokens` and `model` from each session.

### Calculate Cost

Model pricing (USD per million tokens):

| Model | Input | Output | Avg Ratio |
|-------|-------|--------|-----------|
| claude-opus-4-5 | $15 | $75 | 30/70 |
| claude-sonnet-4 | $3 | $15 | 30/70 |
| codex-mini-latest | $1 | $5 | 30/70 |
| gpt-4o | $2.5 | $10 | 30/70 |
| gpt-4o-mini | $0.15 | $0.6 | 30/70 |

Cost formula (assuming 30% input, 70% output):
```
cost = tokens * (0.3 * input_price + 0.7 * output_price) / 1,000,000
```

## Daily Tracking

### Save Usage Snapshot

Store daily snapshots in `memory/usage/YYYY-MM-DD.json`:

```json
{
  "date": "2026-01-29",
  "timestamp": "2026-01-29T08:20:00+08:00",
  "sessions": {
    "session_key": {
      "model": "claude-opus-4-5",
      "totalTokens": 123456,
      "channel": "discord"
    }
  },
  "summary": {
    "totalTokens": 250000,
    "byModel": {
      "claude-opus-4-5": 220000,
      "codex-mini-latest": 30000
    }
  }
}
```

### Calculate Daily Cost

Compare consecutive days to get daily usage:
```
daily_tokens = today.totalTokens - yesterday.totalTokens
daily_cost = estimate_cost(daily_tokens, model)
```

## Scripts

### `scripts/snapshot-usage.js`

Creates a usage snapshot from current session data.

```bash
node scripts/snapshot-usage.js [output-dir]
# Default output: memory/usage/YYYY-MM-DD.json
```

### `scripts/calculate-cost.js`

Calculates cost for a date range.

```bash
node scripts/calculate-cost.js [date]
# Default: today
# Output: JSON with token delta and estimated cost
```

## Integration with Daily Report

Add to HEARTBEAT.md:
1. Call `sessions_list` to get current tokens
2. Load previous day's snapshot from `memory/usage/`
3. Calculate delta and estimate cost
4. Include in daily report format:
   ```
   💰 **Clawdbot Cost** (yesterday)
   • Used: 45.2k tokens
   • Estimated: ~$1.23
   ```

## Color Conventions (Chinese Style)

For financial displays in Chinese context:
- 🔴 Red = Up/Increase
- 🟢 Green = Down/Decrease
