# CamelCamelCamel Alerts Setup Guide

## Overview

This skill monitors **your personal** CamelCamelCamel RSS feed for Amazon price drops and sends you Telegram notifications.

⚠️ **Important**: Each user must use their own CamelCamelCamel feed URL. Do not share or reuse someone else's feed URL—you'll only see alerts for their watchlist.

## Prerequisites

- CamelCamelCamel RSS feed URL (e.g., `https://camelcamelcamel.com/alerts/YOUR_FEED_ID.xml`)
- Telegram setup (Clawdbot must have Telegram configured)
- Python 3 with urllib (built-in)

## Setup Steps

### 1. Retrieve Your CamelCamelCamel Feed URL

1. Go to [CamelCamelCamel](https://camelcamelcamel.com/)
2. Create alerts for products you want to track
3. Copy your personal RSS feed URL from the alerts page

Example format:
```
https://camelcamelcamel.com/alerts/46b7418010d2395d2f6fcea824e4ae18c699cfd3.xml
```

### 2. Configure Clawdbot to Check the Feed

Add a cron job to check the feed periodically (recommend every 1-6 hours):

```bash
cron --action add \
  --job '{
    "name": "camelcamelcamel-check",
    "schedule": "0 */4 * * *",
    "task": "Check CamelCamelCamel price alerts",
    "command": "python3 /home/goliso/clawd/skills/camelcamelcamel-alerts/scripts/fetch_rss.py <YOUR_FEED_URL> /tmp/camelcamelcamel | jq '.alerts' | /home/goliso/clawd/skills/camelcamelcamel-alerts/scripts/notify.sh"
  }'
```

Replace `<YOUR_FEED_URL>` with your actual feed URL.

### 3. Cache Directory

The script stores a cache at `/tmp/camelcamelcamel/cache.json` to track which alerts have been seen.

Clear the cache if you want to re-trigger notifications for existing alerts:
```bash
rm /tmp/camelcamelcamel/cache.json
```

## How It Works

1. **Fetch**: Downloads your RSS feed
2. **Parse**: Extracts price alert items
3. **Compare**: Checks against cache to identify new/updated items
4. **Notify**: Sends Telegram message for each new alert
5. **Cache**: Stores item hashes to avoid duplicate notifications

## RSS Feed Format

CamelCamelCamel RSS includes:
- **title**: Product name + price info
- **link**: Direct link to Amazon product
- **description**: Price details and historical context
- **pubDate**: When the alert was generated

## Customization

### Check Frequency

Adjust the cron schedule (6th field in cron expression):
- `0 */4 * * *` → every 4 hours
- `0 */1 * * *` → every hour
- `0 */6 * * *` → every 6 hours

### Notification Format

Edit the notification script to customize the Telegram message format.

## Troubleshooting

**No notifications:**
- Check that the feed URL is valid (test in browser)
- Verify cron job is running: `cron --action list`
- Check `/tmp/camelcamelcamel/cache.json` exists
- Clear cache to re-trigger alerts

**Duplicate notifications:**
- Cache file may have been corrupted; delete and restart

**Feed fetch errors:**
- Test the URL directly: `curl https://camelcamelcamel.com/alerts/YOUR_ID.xml`
- Ensure internet connectivity
