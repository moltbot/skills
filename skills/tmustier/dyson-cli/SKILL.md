---
name: dyson-cli
description: Control Dyson air purifiers, fans, and heaters via local MQTT. Use when asked to control Dyson devices, adjust fan speed, set temperature/heat, enable oscillation, or check room temperature/humidity. Requires being on the same WiFi network as the device.
---

# Dyson CLI

## Prerequisites

1. CLI installed at `~/dyson-cli` with venv
2. **Must be on same WiFi as the Dyson** - local MQTT only, won't work remotely

**Quick check:**
```bash
cd ~/dyson-cli && source .venv/bin/activate && dyson list --check
```

## Commands

### Power
```bash
dyson on                      # Turn on
dyson off                     # Turn off
```

### Fan Control
```bash
dyson fan speed 5             # Speed 1-10
dyson fan speed auto          # Auto mode
dyson fan oscillate on        # Enable oscillation
dyson fan oscillate on -a 90  # 90° sweep (45/90/180/350)
dyson fan oscillate off       # Disable oscillation
```

### Heat Control (Hot+Cool models)
```bash
dyson heat on                 # Enable heating
dyson heat off                # Disable heating
dyson heat target 22          # Set target temp (°C)
```

### Other
```bash
dyson night on                # Night mode on
dyson night off               # Night mode off
dyson status                  # Show current state
dyson status --json           # JSON output
```

### Multiple Devices

Use `-d <name>` to target a specific device:
```bash
dyson on -d "Bedroom"
dyson fan speed auto -d "Office"
```

## Common Patterns

```bash
# "Turn on the Dyson and set to auto"
dyson on && dyson fan speed auto

# "Heat to 23 degrees"
dyson heat on && dyson heat target 23

# "Turn on with gentle oscillation"
dyson on && dyson fan speed 3 && dyson fan oscillate on -a 45

# "What's the current temperature?"
dyson status --json | python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"Temp: {d['temperature']-273:.1f}°C, Humidity: {d['humidity']}%\")"
```

## Troubleshooting

If commands fail:
1. Check device is online: `dyson list --check`
2. Ensure on same WiFi network as the Dyson
3. Re-run setup if credentials expired: `dyson setup`

For installation, device setup, and full documentation, see [README.md](README.md).
