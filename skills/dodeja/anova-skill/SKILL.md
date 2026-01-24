---
name: anova-oven
description: Control Anova Precision Ovens and Precision Cookers (sous vide) via WiFi WebSocket API. Start cooking modes (sous vide, roasting, steam), set temperatures, monitor status, and stop cooking remotely.
license: Apache-2.0
compatibility: Requires Python 3.7+, websockets library, and internet access to Anova cloud API
metadata:
  author: Akshay Dodeja
  version: "1.0.0"
  repository: https://github.com/dodeja/anova-skill
---

# Anova Oven & Precision Cooker Control

Control Anova WiFi devices including Precision Ovens (APO) and Precision Cookers (APC) via WebSocket API.

## Prerequisites

1. **Personal Access Token** from Anova app
   - Download Anova Oven app (iOS/Android)
   - Go to: More → Developer → Personal Access Tokens
   - Create token (starts with `anova-`)
   - Store in `~/.config/anova/token`

2. **Python dependencies**
   ```bash
   pip3 install websockets
   ```

3. **Device Setup**
   - Anova device connected to WiFi
   - Paired with your Anova account

## Installation

```bash
# Install Python dependency
pip3 install websockets

# Store your token
mkdir -p ~/.config/anova
echo "anova-YOUR_TOKEN_HERE" > ~/.config/anova/token
chmod 600 ~/.config/anova/token
```

## Usage

### List Devices
```bash
python3 scripts/anova.py list
```

### Basic Cooking
```bash
# Simple cook at 350°F for 30 minutes
python3 scripts/anova.py cook --temp 350 --duration 30

# Cook at 175°C for 45 minutes
python3 scripts/anova.py cook --temp 175 --unit C --duration 45
```

### Advanced Controls

**Custom Elements:**
```bash
# Rear element only (low-temp slow cook)
python3 scripts/anova.py cook --temp 225 --elements rear --duration 180

# Bottom + rear (standard roasting)
python3 scripts/anova.py cook --temp 375 --elements bottom,rear --duration 45

# All elements (maximum heat)
python3 scripts/anova.py cook --temp 450 --elements top,bottom,rear --duration 20
```

**Custom Fan Speed:**
```bash
# Low fan (gentle cooking)
python3 scripts/anova.py cook --temp 250 --fan-speed 25 --duration 120

# High fan (fast heat circulation)
python3 scripts/anova.py cook --temp 400 --fan-speed 100 --duration 30
```

**Probe Cooking:**
```bash
# Cook to internal temperature (not time-based)
python3 scripts/anova.py cook --temp 350 --probe-temp 165

# Low-temp probe cook
python3 scripts/anova.py cook --temp 225 --elements rear --fan-speed 25 --probe-temp 135
```

**Combined Advanced Settings:**
```bash
# Precision low-temp cook
python3 scripts/anova.py cook --temp 225 --elements rear --fan-speed 25 --duration 180

# High-heat sear
python3 scripts/anova.py cook --temp 500 --elements top,bottom,rear --fan-speed 100 --duration 5
```

### Stop Cooking
```bash
python3 scripts/anova.py stop
```

### Monitor (Real-time Stream)
```bash
python3 scripts/anova.py monitor --monitor-duration 60
```

## Natural Language Examples

**Agent prompts:**
- "Preheat the oven to 375°F for roasting"
- "Start sous vide at 135°F for 2 hours"
- "What's the current oven temperature?"
- "Stop cooking"
- "Steam vegetables at 212°F for 15 minutes"

## Features

### Anova Precision Oven (APO)
- Sous vide cooking (wet bulb mode)
- Roasting (dry bulb mode)
- Steam cooking with humidity control
- Temperature control (C/F)
- Real-time status monitoring
- Telemetry export

### Anova Precision Cooker (APC)
- Sous vide cooking
- Temperature control
- Timer management
- Real-time status

## API Reference

**WebSocket Endpoint:** Via Anova cloud service
**Authentication:** Personal Access Token (Bearer token)
**Protocol:** WebSocket with JSON messages

## Configuration

**Token file:** `~/.config/anova/token`
**Default device:** First device found (or specify with `--device-id`)

## Troubleshooting

**"No token found":**
```bash
echo "anova-YOUR_TOKEN" > ~/.config/anova/token
```

**"No devices found":**
- Check device is online in Anova app
- Verify WiFi connection
- Generate new token

**"Connection failed":**
- Check internet connection
- Verify token is valid
- Ensure device is paired with account

## Safety Notes

- Always verify temperature before starting long cooks
- Use timers to prevent overcooking
- Monitor remotely but check in-person for safety
- Default timeout: 4 hours max

## References

- [Anova Developer Portal](https://developer.anovaculinary.com)
- [GitHub: anova-wifi-device-controller](https://github.com/anova-culinary/developer-project-wifi)
