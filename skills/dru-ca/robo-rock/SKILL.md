---
name: roborock
description: Control Roborock robot vacuums (status, clean, maps, consumables). Use when asked to vacuum, check vacuum status, control robot vacuum, or manage cleaning schedules. Triggers on vacuum, roborock, clean floor, hoover, robot cleaner keywords.
metadata: {"clawdbot":{"emoji":"🧹","requires":{"bins":["roborock"]},"install":[{"id":"pipx","kind":"pipx","package":"python-roborock","bins":["roborock"],"label":"Install roborock CLI (pipx)"}]}}
---

# Roborock Vacuum Control

Control Roborock robot vacuums via the `roborock` CLI.

## First-Time Setup

### 1. Install CLI
```bash
pipx install python-roborock
```

### 2. Login to Roborock Account
```bash
roborock login
```
Enter your Roborock/Xiaomi Home app email and password.

### 3. Find Your Device ID
```bash
roborock list-devices
```
Note your device ID (looks like `AbCdEf123456789XyZ`).

### 4. Store Device ID (Optional)
Add to your TOOLS.md for easy reference:
```markdown
## Roborock Vacuum
- **Device ID:** your-device-id-here
- **Model:** Roborock S7 Max Ultra (or your model)
```

## Quick Commands

All commands need `--device_id "YOUR_DEVICE_ID"` — replace with your actual device ID.

### Check Status
```bash
roborock status --device_id "YOUR_DEVICE_ID"
```

### Start Cleaning
```bash
roborock command --device_id "YOUR_DEVICE_ID" start
```

### Stop/Pause
```bash
roborock command --device_id "YOUR_DEVICE_ID" stop
roborock command --device_id "YOUR_DEVICE_ID" pause
```

### Return to Dock
```bash
roborock command --device_id "YOUR_DEVICE_ID" home
```

### Clean Specific Room
First get room IDs:
```bash
roborock rooms --device_id "YOUR_DEVICE_ID"
```
Then clean specific rooms:
```bash
roborock command --device_id "YOUR_DEVICE_ID" segment_clean --rooms 16,17
```

## Maintenance Commands

### Check Consumables
```bash
roborock consumables --device_id "YOUR_DEVICE_ID"
```
Shows filter, brush, sensor lifespans.

### Reset Consumable
```bash
roborock reset-consumable filter --device_id "YOUR_DEVICE_ID"
roborock reset-consumable main_brush --device_id "YOUR_DEVICE_ID"
roborock reset-consumable side_brush --device_id "YOUR_DEVICE_ID"
```

### Last Clean Record
```bash
roborock clean-record --device_id "YOUR_DEVICE_ID"
```

### Clean Summary (All Time)
```bash
roborock clean-summary --device_id "YOUR_DEVICE_ID"
```

## Maps & Rooms

### Get Maps
```bash
roborock maps --device_id "YOUR_DEVICE_ID"
```

### Cache Home Layout
```bash
roborock home
```

### Save Map Image
```bash
roborock map-image --device_id "YOUR_DEVICE_ID" --output /tmp/vacuum-map.png
```

### Room Features
```bash
roborock features --device_id "YOUR_DEVICE_ID"
```

## Settings

### Volume
```bash
roborock volume --device_id "YOUR_DEVICE_ID"
roborock set-volume 50 --device_id "YOUR_DEVICE_ID"
```

### Do Not Disturb
```bash
roborock dnd --device_id "YOUR_DEVICE_ID"
```

### LED Status
```bash
roborock led-status --device_id "YOUR_DEVICE_ID"
```

### Child Lock
```bash
roborock child-lock --device_id "YOUR_DEVICE_ID"
```

## Interactive Session
For multiple commands without repeating device ID:
```bash
roborock session --device_id "YOUR_DEVICE_ID"
```

## Troubleshooting

**Commands fail silently:**
1. Check login: `roborock login`
2. Use debug mode: `roborock -d status --device_id "YOUR_DEVICE_ID"`
3. Ensure vacuum is online and connected to WiFi

**"Device not found":**
- Run `roborock list-devices` to verify device ID
- Make sure you're logged into the correct Roborock account

**"Authentication failed":**
- Re-run `roborock login`
- Check you're using the same account as your Xiaomi Home / Roborock app

## Common Tasks

**"Vacuum the house":**
```bash
roborock command --device_id "YOUR_DEVICE_ID" start
```

**"Vacuum the kitchen":**
```bash
roborock rooms --device_id "YOUR_DEVICE_ID"  # find kitchen room ID
roborock command --device_id "YOUR_DEVICE_ID" segment_clean --rooms <kitchen_id>
```

**"Is the vacuum done?":**
```bash
roborock status --device_id "YOUR_DEVICE_ID"
```

**"Send vacuum home":**
```bash
roborock command --device_id "YOUR_DEVICE_ID" home
```

**"When did it last clean?":**
```bash
roborock clean-record --device_id "YOUR_DEVICE_ID"
```

**"Check brush/filter life":**
```bash
roborock consumables --device_id "YOUR_DEVICE_ID"
```

## Supported Models

Works with most Roborock vacuums including:
- Roborock S series (S4, S5, S6, S7, S8)
- Roborock Q series (Q5, Q7, Q8)
- Roborock E series
- Xiaomi Mi Robot Vacuum (Roborock-based)

## Credits

Uses the [python-roborock](https://github.com/humbertogontijo/python-roborock) library.
