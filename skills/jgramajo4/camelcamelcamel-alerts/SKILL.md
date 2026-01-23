---
name: camelcamelcamel-alerts
description: Monitor CamelCamelCamel price drop alerts via RSS and send Telegram notifications when items go on sale. Use when setting up automatic price tracking for Amazon products with CamelCamelCamel price alerts.
---

# CamelCamelCamel Alerts

Automatically monitor your CamelCamelCamel RSS feed for Amazon price drops and get notified on Telegram.

## Quick Start

1. **Get your RSS feed URL** from CamelCamelCamel:
   - Go to https://camelcamelcamel.com/ and set up price alerts
   - Get your personal RSS feed URL (format: `https://camelcamelcamel.com/alerts/YOUR_UNIQUE_ID.xml`)

2. **Create a cron job** with YOUR feed URL (not someone else's!):

```bash
cron add \
  --job '{
    "name": "camelcamelcamel-monitor",
    "schedule": "0 */12 * * *",
    "task": "Monitor CamelCamelCamel price alerts",
    "command": "python3 /path/to/scripts/fetch_rss.py https://camelcamelcamel.com/alerts/YOUR_UNIQUE_ID.xml"
  }'
```

**Important**: Replace `YOUR_UNIQUE_ID` with your own feed ID from step 1. Each person needs their own feed URL!

3. **Clawdbot will**:
   - Fetch your feed every 4 hours
   - Detect new price alerts
   - Send you Telegram notifications

## How It Works

The skill uses two components:

### `scripts/fetch_rss.py`
- Fetches your CamelCamelCamel RSS feed
- Parses price alert items
- Compares against local cache to find new alerts
- Outputs JSON with new items detected
- Caches item hashes to avoid duplicate notifications

### Cron Integration
- Runs on a schedule you define
- Triggers fetch_rss.py
- Can be configured to run hourly, every 4 hours, daily, etc.

## Setup & Configuration

**See [SETUP.md](references/SETUP.md)** for:
- How to get your CamelCamelCamel RSS feed URL
- Step-by-step cron configuration
- Customizing check frequency
- Cache management
- Troubleshooting

## Alert Cache

The script maintains a cache at `/tmp/camelcamelcamel/cache.json` to track which alerts have been notified. This prevents duplicate notifications.

**Clear the cache** to re-test notifications:
```bash
rm /tmp/camelcamelcamel/cache.json
```

## Notification Format

When a new price drop is detected, you'll receive a Telegram message like:

```
🛒 *Price Alert*

*PRODUCT NAME - $XX.XX (Down from $YY.YY)*

Current price: $XX.XX
Historical low: $ZZ.ZZ
Last checked: [timestamp]

View on Amazon: [link]
```

## Customization

### Check Frequency

Adjust the cron schedule (6th parameter in the `schedule` field):
- `0 * * * *` → every hour
- `0 */4 * * *` → every 4 hours (default)
- `0 */6 * * *` → every 6 hours
- `0 0 * * *` → daily

### Message Format

Edit `scripts/notify.sh` to customize the Telegram message layout and emoji.

## Technical Details

- **Language**: Python 3 (built-in libraries only)
- **Cache**: JSON file at `/tmp/camelcamelcamel/cache.json`
- **Feed Format**: Standard RSS/XML
- **Dependencies**: None beyond Python standard library
- **Timeout**: 10 seconds per feed fetch

## Troubleshooting

If you're not receiving notifications:

1. **Verify the feed URL** works in your browser
2. **Check the cron job** exists: `cron list`
3. **Test manually**:
   ```bash
   python3 scripts/fetch_rss.py <YOUR_FEED_URL> /tmp/camelcamelcamel
   ```
4. **Clear the cache** to reset:
   ```bash
   rm /tmp/camelcamelcamel/cache.json
   ```
5. **Check Telegram** is configured in Clawdbot

See [SETUP.md](references/SETUP.md) for more details.
