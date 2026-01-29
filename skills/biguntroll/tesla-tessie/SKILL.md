---
name: tesla
description: Control and monitor Tesla vehicles via the Tessie API. Use when you need to check Tesla status (battery, location, charging), control climate (heat/cool), lock/unlock doors, start/stop charging, honk/flash lights, open charge port or trunks, or any other Tesla vehicle command. Requires TESSIE_API_KEY environment variable.
---

# Tesla Control via Tessie

Control Tesla vehicles using the Tessie API through Python scripts.

## Prerequisites

**Python 3 with requests library:**
```bash
pip install requests
```

**Set the `TESSIE_API_KEY` environment variable** with your Tessie API key from https://my.tessie.com/settings/api

```bash
# Linux/macOS
export TESSIE_API_KEY="your-api-key-here"

# Windows (PowerShell)
$env:TESSIE_API_KEY = "your-api-key-here"

# Windows (cmd)
set TESSIE_API_KEY=your-api-key-here
```

For persistent storage, add to your shell profile (.bashrc, .zshrc, PowerShell profile, etc.).

## Common Commands

All commands use the `scripts/tessie.py` script. Most commands require a VIN (Vehicle Identification Number).

### Get Vehicle List

```bash
python scripts/tessie.py vehicles
```

Returns all vehicles associated with your Tessie account with their VINs.

### Check Status

```bash
python scripts/tessie.py status --vin <VIN>
```

Returns comprehensive vehicle status including battery, location, climate, charging state, and more.

### Battery Info

```bash
python scripts/tessie.py battery --vin <VIN>
```

Returns battery level, range, and charging information.

### Location

```bash
python scripts/tessie.py location --vin <VIN>
```

Returns current vehicle location (latitude, longitude, heading).

### Lock & Unlock

```bash
python scripts/tessie.py lock --vin <VIN>
python scripts/tessie.py unlock --vin <VIN>
```

### Climate Control

```bash
# Start climate
python scripts/tessie.py start_climate --vin <VIN>

# Stop climate
python scripts/tessie.py stop_climate --vin <VIN>

# Set temperature (Celsius)
python scripts/tessie.py set_temperature --vin <VIN> --value 22
```

### Charging

```bash
# Start charging
python scripts/tessie.py start_charging --vin <VIN>

# Stop charging
python scripts/tessie.py stop_charging --vin <VIN>

# Set charge limit (0-100)
python scripts/tessie.py set_charge_limit --vin <VIN> --value 80

# Open/close charge port
python scripts/tessie.py open_charge_port --vin <VIN>
python scripts/tessie.py close_charge_port --vin <VIN>
```

### Honk, Flash & Fart

```bash
python scripts/tessie.py honk --vin <VIN>
python scripts/tessie.py flash --vin <VIN>
python scripts/tessie.py fart --vin <VIN>
```

Note: Fart requires firmware 2022.40.25 or newer.

### Trunks

```bash
python scripts/tessie.py open_frunk --vin <VIN>
python scripts/tessie.py open_trunk --vin <VIN>
```

### Software Updates

```bash
# Schedule update immediately
python scripts/tessie.py schedule_update --vin <VIN>

# Schedule update in 2 hours (7200 seconds)
python scripts/tessie.py schedule_update --vin <VIN> --value 7200

# Cancel scheduled update
python scripts/tessie.py cancel_update --vin <VIN>

# Check for available updates
python scripts/check-updates.py --vin <VIN>
```

The check-updates script returns one of:
- `UPDATE_AVAILABLE: Software update X.X.X is ready to install!`
- `UPDATE_DOWNLOADING: Downloading update X.X.X (XX%)`
- `UPDATE_INSTALLING: Installing update X.X.X (XX%)`
- `UPDATE_SCHEDULED: Update X.X.X is scheduled`
- `NO_UPDATE`

### Wake Vehicle

If the vehicle is asleep, wake it first:

```bash
python scripts/tessie.py wake --vin <VIN>
```

## Automatic Update Notifications

To get notified when software updates are available, set up a cron job:

```bash
# Check for updates every 6 hours and notify if available
cron add \
  --schedule "0 */6 * * *" \
  --text "Check my Tesla for software updates and notify me if one is available" \
  --description "Tesla software update check"
```

When an update is available, you'll get a notification with the version number.

## Workflow

1. First time: Get VIN with `vehicles` action
2. For most commands: Use the VIN to target specific vehicle
3. If vehicle is asleep: Use `wake` first, then retry command
4. Check status with `status`, `battery`, or `location` as needed

## Reference

For complete API documentation, see `references/api.md`.
