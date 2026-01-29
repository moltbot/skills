# Market Monitoring Setup

24/7 monitoring via clawdbot cron jobs.

## Overview

```
[User provides URL] → [Extract market ID] → [Create cron job] → [Monitor loop]
                                                                      ↓
                                              [Price change?] → [Alert user]
                                              [Whale trade?]  → [Alert user]
                                              [Arb opportunity?] → [Alert user]
```

## Step 1: Parse Market URL

Extract from `polymarket.com/event/{slug}/{condition-id}`:
```python
import re
url = "https://polymarket.com/event/what-price-will-bitcoin-hit-before-2027/will-bitcoin-reach-200000"
match = re.search(r'polymarket\.com/event/([^/]+)/([^/\?]+)', url)
slug, condition_id = match.groups() if match else (None, None)
```

## Step 2: Create Monitoring Cron Job

Use clawdbot's cron tool to create isolated job:

```json
{
  "action": "add",
  "job": {
    "name": "Polymarket Monitor: [Market Name]",
    "schedule": {
      "kind": "every",
      "everyMs": 300000
    },
    "sessionTarget": "isolated",
    "payload": {
      "kind": "agentTurn",
      "message": "Monitor Polymarket market [URL]. Check for: 1) Price changes >5%, 2) Trades >$5000, 3) Pair cost <$0.98. Compare to previous state in .claude/skills/polymarket-analysis/state/[market-id].json. Alert if thresholds exceeded.",
      "timeoutSeconds": 120,
      "deliver": true,
      "channel": "last"
    },
    "enabled": true
  }
}
```

### CLI Alternative

```bash
clawdbot cron add \
  --name "Polymarket: BTC $200k" \
  --every "5m" \
  --session isolated \
  --message "Monitor polymarket.com/event/... for price/whale alerts" \
  --deliver \
  --channel last
```

## Step 3: State Management

Store previous state for comparison:

**State file:** `.claude/skills/polymarket-analysis/state/{market-id}.json`

```json
{
  "marketId": "condition-id",
  "lastCheck": "2026-01-28T10:00:00Z",
  "lastPrices": {
    "yes": 0.81,
    "no": 0.21
  },
  "lastVolume": 9562827,
  "alerts": []
}
```

## Step 4: Alert Logic

On each cron run, the agent:

1. **Fetch current data** via Gamma API
2. **Load previous state** from state file
3. **Compare thresholds:**

| Check | Condition | Alert |
|-------|-----------|-------|
| Price change | `abs(new - old) / old > 0.05` | "Price moved X%" |
| Whale trade | `volume_delta > 5000` in short period | "Large trade detected" |
| Pair cost | `yes_price + no_price < 0.98` | "Arbitrage opportunity" |
| Volume spike | `current_vol > 2 * avg_vol` | "Volume spike" |

4. **Update state file** with current values
5. **Send alert** if thresholds exceeded

## Cron Management

### List active monitors
```bash
clawdbot cron list
```

### Pause monitoring
```bash
clawdbot cron edit <jobId> --disable
```

### Resume monitoring
```bash
clawdbot cron edit <jobId> --enable
```

### Remove monitor
```bash
clawdbot cron remove <jobId>
```

### Check run history
```bash
clawdbot cron runs --id <jobId> --limit 10
```

## Monitoring Intervals

| Market Type | Recommended Interval |
|-------------|---------------------|
| Short-term (<24h resolution) | 1-5 minutes |
| Medium-term (1-7 days) | 15-30 minutes |
| Long-term (>7 days) | 1-4 hours |

## Alert Delivery

Configure delivery channel in cron job:

```bash
# WhatsApp
--channel whatsapp --to "+1234567890"

# Telegram
--channel telegram --to "-100123456789"

# Discord
--channel discord --to "channel:123456789"

# Last used channel
--channel last
```