---
name: garmin-connect
description: "Garmin Connect integration for Clawdbot: sync fitness data (steps, HR, calories, workouts, sleep) every 5 minutes using OAuth."
---

# Garmin Connect Skill

Sync all your Garmin fitness data to Clawdbot:
- 🚶 **Daily Activity**: Steps, heart rate, calories, active minutes, distance
- 😴 **Sleep**: Duration, quality, deep/REM/light sleep breakdown
- 🏋️ **Workouts**: Recent activities with distance, duration, calories, heart rate
- ⏱️ **Real-time sync**: Every 5 minutes via cron

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. OAuth Authentication (One-time)

```bash
python3 scripts/garmin-auth.py your-email@gmail.com your-password
```

This saves your OAuth session to `~/.garth/session.json` — fully local and secure.

### 3. Test Sync

```bash
python3 scripts/garmin-sync.py
```

You should see JSON output with today's stats.

### 4. Set Up 5-Minute Cron

Add to your crontab:

```bash
*/5 * * * * /home/user/garmin-connect-clawdbot/scripts/garmin-cron.sh
```

Or manually:

```bash
*/5 * * * * python3 /home/user/garmin-connect-clawdbot/scripts/garmin-sync.py ~/.clawdbot/.garmin-cache.json
```

### 5. Use in Clawdbot

Import and use in your scripts:

```python
from scripts.garmin_formatter import format_all, get_as_dict

# Get all formatted data
print(format_all())

# Or get raw dict
data = get_as_dict()
print(f"Steps today: {data['summary']['steps']}")
```

## Features

✅ OAuth-based (secure, no password storage)
✅ All metrics: activity, sleep, workouts
✅ Local caching (fast access)
✅ Cron-friendly (5-minute intervals)
✅ Easy Clawdbot integration
✅ Multi-user support

## Data Captured

### Daily Activity (`summary`)
- `steps`: Daily step count
- `heart_rate_resting`: Resting heart rate (bpm)
- `calories`: Total calories burned
- `active_minutes`: Intensity minutes
- `distance_km`: Distance traveled

### Sleep (`sleep`)
- `duration_hours`: Total sleep time
- `duration_minutes`: Sleep in minutes
- `quality_percent`: Sleep quality score (0-100)
- `deep_sleep_hours`: Deep sleep duration
- `rem_sleep_hours`: REM sleep duration
- `light_sleep_hours`: Light sleep duration
- `awake_minutes`: Time awake during sleep

### Workouts (`workouts`)
For each recent workout:
- `type`: Activity type (Running, Cycling, etc.)
- `name`: Activity name
- `distance_km`: Distance traveled
- `duration_minutes`: Duration of activity
- `calories`: Calories burned
- `heart_rate_avg`: Average heart rate
- `heart_rate_max`: Max heart rate

## Cache Location

By default, data is cached at: `~/.clawdbot/.garmin-cache.json`

Customize with:
```bash
python3 scripts/garmin-sync.py /custom/path/cache.json
```

## Files

| File | Purpose |
|------|---------|
| `garmin-auth.py` | OAuth setup (run once) |
| `garmin-sync.py` | Main sync logic (run every 5 min) |
| `garmin-formatter.py` | Format data for display |
| `garmin-cron.sh` | Cron wrapper script |
| `requirements.txt` | Python dependencies |

## Troubleshooting

### OAuth authentication fails

- Check email/password
- Disable 2FA on Garmin account (or use app password)
- Garmin servers might be rate-limiting — wait 5 minutes

### No data appears

1. Sync your Garmin device with the Garmin Connect app
2. Wait 2-3 minutes for data to sync
3. Check that data appears in Garmin Connect web/app
4. Then run `garmin-sync.py` again

### Permission denied on cron

```bash
chmod +x scripts/garmin-cron.sh
chmod +x scripts/garmin-sync.py
chmod +x scripts/garmin-auth.py
```

### Cache file not found

Run `garmin-sync.py` at least once to create cache:
```bash
python3 scripts/garmin-sync.py
```

## Usage Examples

```python
from scripts.garmin_formatter import format_all, get_as_dict

# Get formatted output
print(format_all())

# Get raw data
data = get_as_dict()
if data:
    print(f"Sleep: {data['sleep']['duration_hours']}h")
    print(f"Steps: {data['summary']['steps']:,}")
```

## License

MIT — Use, fork, modify freely.

---

Made for [Clawdbot](https://clawd.bot) | Available on [ClawdHub](https://clawdhub.com)
