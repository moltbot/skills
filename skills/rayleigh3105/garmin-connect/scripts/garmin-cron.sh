#!/bin/bash
# Cron wrapper for 5-minute Garmin sync checks
# Add to crontab: */5 * * * * /home/mamotec/clawd/garmin-connect-clawdbot/scripts/garmin-cron.sh

cd /home/mamotec/clawd/garmin-connect-clawdbot

# Run sync (with timeout to prevent hanging)
timeout 30 python3 scripts/garmin-sync.py > /tmp/garmin-sync.log 2>&1

# Check for significant changes and alert if needed
# (Would send to Telegram via Clawdbot message tool)

exit 0
