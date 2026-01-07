# dyson-cli

A command-line interface for controlling Dyson air purifiers, fans, and heaters.

## Features

- 🔌 **Local control** - Communicates directly with your Dyson device over MQTT (no cloud required after setup)
- 🌡️ **Full control** - Power, fan speed, oscillation angles, heat mode, target temperature
- 📊 **Status monitoring** - View current state, air quality, and environmental data
- 🔐 **Easy setup** - Fetch credentials automatically via your Dyson account

## Supported Devices

- Dyson Pure Cool Link (TP02, DP01)
- Dyson Pure Cool (TP04, DP04)
- Dyson Pure Hot+Cool Link (HP02)
- Dyson Pure Hot+Cool (HP04, HP06, HP07)
- Dyson Purifier Hot+Cool Formaldehyde (HP09)
- Dyson Pure Humidify+Cool (PH01, PH03, PH04)
- Dyson Purifier Big+Quiet (BP02, BP03, BP04)

## Installation

```bash
pip install git+https://github.com/tmustier/dyson-cli.git
```

Or install from source:

```bash
git clone https://github.com/tmustier/dyson-cli.git
cd dyson-cli
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
```

## Quick Start

### 1. Setup (one-time)

Fetch your device credentials via your Dyson account:

```bash
dyson setup --email you@example.com --region GB
```

This will:
1. Send an OTP to your Dyson account email
2. Prompt for OTP and your Dyson account password
3. Fetch your device credentials
4. Save them to `~/.dyson/config.json`

**Note:** Use country codes for region (GB, US, DE, FR, etc.), not "EU".

### 2. List devices

```bash
dyson list              # Show configured devices
dyson list --check      # Also check if devices are online
```

### 3. Control your device

```bash
# Power
dyson on
dyson off

# Fan
dyson fan speed 5              # Set speed (1-10)
dyson fan speed auto           # Auto mode
dyson fan oscillate on         # Enable oscillation
dyson fan oscillate on -a 90   # 90° oscillation range
dyson fan oscillate on -a 180  # 180° sweep
dyson fan oscillate off        # Disable

# Heat (Hot+Cool models only)
dyson heat on
dyson heat off
dyson heat target 22           # Set target temperature (°C)

# Night mode
dyson night on
dyson night off

# Status
dyson status                   # Show current state
dyson status --json            # JSON output for scripting
```

## Commands

| Command | Description |
|---------|-------------|
| `dyson setup` | Configure device credentials |
| `dyson list` | List configured devices |
| `dyson list --check` | List with online/offline status |
| `dyson status` | Show device status |
| `dyson on` | Turn device on |
| `dyson off` | Turn device off |
| `dyson fan speed <1-10\|auto>` | Set fan speed or auto mode |
| `dyson fan oscillate <on\|off> [-a ANGLE]` | Control oscillation (45/90/180/350°) |
| `dyson heat on\|off` | Control heat mode |
| `dyson heat target <temp>` | Set target temperature (1-37°C) |
| `dyson night <on\|off>` | Control night mode |
| `dyson default <name>` | Set default device |
| `dyson remove <name>` | Remove a device from config |

### Multiple Devices

If you have multiple Dyson devices, use `-d` to target a specific one:

```bash
dyson status -d "Bedroom"
dyson on -d "Living Room"
dyson fan speed 5 -d "Office"
```

Set a default device:
```bash
dyson default "Living Room"
```

## Configuration

Credentials are stored in `~/.dyson/config.json`:

```json
{
  "devices": [
    {
      "name": "Living Room",
      "serial": "XXX-XX-XXXXXXXX",
      "credential": "...",
      "product_type": "527K",
      "ip": "192.168.1.100"
    }
  ],
  "default_device": "Living Room"
}
```

The IP address is auto-discovered on first `dyson status` call via mDNS.

## How It Works

Dyson devices communicate locally via MQTT on port 1883. After initial setup (which requires your Dyson account), all control happens directly on your local network - no cloud required.

**Important:** You must be connected to the same WiFi network as your Dyson device. The CLI will not work remotely or from a different network.

## Credits

Built on top of [libdyson-neon](https://github.com/libdyson-wg/libdyson-neon), the actively maintained fork of libdyson that powers the Home Assistant Dyson integration.

## License

MIT
