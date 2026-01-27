# Ham Radio DX Monitor - Quick Start

Monitor DX clusters for rare station spots and get daily digests.

## Installation

```bash
# Run setup with YOUR callsign
./scripts/dx-monitoring-setup.sh YOUR_CALLSIGN

# Example:
./scripts/dx-monitoring-setup.sh KN4XYZ
```

This installs:
- ✅ DX spot monitoring every 5 minutes
- ✅ Daily digest at 9am
- ✅ Automatic logging

## Manual Usage

```bash
# Watch latest spots
python3 skills/ham-radio-dx/dx-monitor.py watch --callsign YOUR_CALL

# Only NEW spots (filters duplicates)
python3 skills/ham-radio-dx/dx-monitor.py watch --new-only --callsign YOUR_CALL

# Daily digest
python3 skills/ham-radio-dx/dx-monitor.py digest --callsign YOUR_CALL

# Specific cluster
python3 skills/ham-radio-dx/dx-monitor.py watch --cluster om0rx --callsign YOUR_CALL
```

## Available Clusters

- `ea7jxh` - Europe (default)
- `om0rx` - Europe
- `oh2aq` - Finland
- `ab5k` - USA
- `w6rk` - USA West Coast

## Log Files

- **New spots:** `/tmp/dx-new-spots.log`
- **Daily digest:** `~/dx-digest-YYYY-MM-DD.txt`

## Rare DX to Watch For

- VP8 (Falklands)
- VK0 (Heard Island)
- 3Y0 (Bouvet)
- P5 (North Korea)
- ZL (New Zealand)
- ZS (South Africa)

## Tips

1. Use your real callsign for best results
2. Check `/tmp/dx-new-spots.log` for alerts
3. Daily digest has band activity stats
4. Adjust cron timing if needed

73! 📻
