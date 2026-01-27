# Garmin Connect Integration for Clawdbot

Sync your Garmin fitness data (steps, HR, calories, workouts, sleep) automatically to Clawdbot every 5 minutes.

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Authenticate with OAuth

Run the authentication script:

```bash
python3 scripts/garmin-auth.py your-email@gmail.com your-password
```

This saves your OAuth session to `~/.garth/session.json` (local, secure).

⚠️ **Keep this file safe** — it contains your Garmin OAuth token.

### 3. Test

```bash
python3 scripts/garmin-sync.py
```

You should see JSON output with your current Garmin data.

### 4. Set Up Cron (5-minute sync)

Add to your crontab:

```bash
*/5 * * * * python3 /path/to/scripts/garmin-sync.py
```

### 5. Use in Your Scripts

Import Garmin data in any Clawdbot script:

```python
from garmin_connect_clawdbot.scripts.garmin_formatter import format_all, get_as_dict

# Get all formatted data
all_data = format_all()
print(all_data)

# Or get raw dictionary
data = get_as_dict()
steps = data['summary']['steps']
sleep_hours = data['sleep']['duration_hours']
```

## Features

- ✅ OAuth-based authentication (secure)
- ✅ Real-time sync every 5 minutes
- ✅ Sleep quality tracking (duration, deep/REM/light sleep)
- ✅ Daily activity metrics (steps, HR, calories, distance)
- ✅ Workout tracking (all activity types)
- ✅ Body battery monitoring
- ✅ Local caching (JSON)
- ✅ Easy Clawdbot integration

## Scripts

| Script | Purpose |
|--------|---------|
| `garmin-auth.py` | OAuth authentication (run once) |
| `garmin-sync.py` | Sync all data from Garmin |
| `garmin-formatter.py` | Format data for display |
| `garmin-cron.sh` | Wrapper for cron jobs |

## Data Caching

Data is cached locally in JSON format for quick access without constant API calls.

### Data Structure

The cached data contains:

- **summary**: Daily activity (steps, heart rate, calories, active minutes, distance)
- **sleep**: Sleep metrics (duration, quality, deep/REM/light sleep breakdown)
- **workouts**: Recent activities (type, distance, duration, calories, heart rate)

## Usage Examples

### Format All Data

```python
from scripts.garmin_formatter import format_all

output = format_all()  # Returns formatted string
print(output)
```

### Access Raw Data

```python
from scripts.garmin_formatter import get_as_dict

data = get_as_dict()
if data:
    print(f"Sleep: {data['sleep']['duration_hours']}h")
    print(f"Steps: {data['summary']['steps']:,}")
    print(f"Workouts: {len(data['workouts'])} activities")
```

### Format Specific Metrics

```python
from scripts.garmin_formatter import format_daily_summary, format_sleep, format_workouts

# Use individually
print(format_daily_summary())
print(format_sleep())
print(format_workouts())
```

## Troubleshooting

### Authentication Failed

- Check email/password
- Ensure 2FA is **OFF** on Garmin (or use app-specific password)
- Garmin servers might rate-limit — wait 5 minutes

### No Sleep Data

- Sync your Garmin device with the Garmin Connect app
- Sleep must be tracked while wearing device
- Data available ~1 hour after waking

### Missing Workouts

- Sync device → Garmin Connect app
- Confirm workout saved in Garmin app
- Check `garmin-sync.py` logs

### Data not syncing

Run the sync script manually:

```bash
python3 scripts/garmin-sync.py
```

Check the output for errors.

## License

MIT — Use freely, fork, modify as needed.

---

Made for [Clawdbot](https://clawd.bot) | Available on [ClawdHub](https://clawdhub.com)
