---
name: tesla-commands
description: Control your Tesla via MyTeslaMate API. Supports multi-vehicle accounts, climate control, and charging schedules.
metadata: {"tags": ["tesla", "myteslamate", "ev", "car-control", "automation"]}
---

# Tesla Commands Skill 🚗

This skill allows you to monitor and control your Tesla vehicle using the MyTeslaMate API.

## Prerequisites

To use this skill, you must have:
1.  A **MyTeslaMate** account with a configured vehicle.
2.  An **API Token** from MyTeslaMate (Get it at [app.myteslamate.com/fleet](https://app.myteslamate.com/fleet)).
3.  The **VIN** of your vehicle.

### Environment Variables
The following environment variables must be set for the skill to work:
- `TESLA_MATE_TOKEN`: Your MyTeslaMate API token.
- `TESLA_VIN`: Your vehicle's VIN (optional if you specify it via command line).

## Tools

### tesla-control

Manage vehicle status, climate, charging, and schedules.

**Usage:**
`public-skills/tesla-commands/bin/tesla-control.py [options]`

**Options:**
- `--list`: List all vehicles on the account and their VINs.
- `--status`: Fetch full vehicle data (battery, climate, location, locks, etc.).
- `--wake`: Wake up the vehicle from sleep mode.
- `--climate [on|off]`: Start or stop the climate control.
- `--charge-limit [50-100]`: Set the battery charge limit percentage.
- `--set-schedule [HH:MM]`: Set a scheduled charging start time.
- `--clear-schedule`: Disable scheduled charging.
- `--vin [VIN]`: Target a specific vehicle (overrides the default `TESLA_VIN`).

## Examples

**Wake up the car:**
```bash
./bin/tesla-control.py --wake
```

**Set charge limit to 80%:**
```bash
./bin/tesla-control.py --charge-limit 80
```

**Set charging to start at 02:00:**
```bash
./bin/tesla-control.py --set-schedule 02:00
```
