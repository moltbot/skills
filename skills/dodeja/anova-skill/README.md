# Anova Oven & Precision Cooker Skill

An Agent Skill for controlling Anova Precision Ovens (APO) and Precision Cookers (APC) via their WiFi WebSocket API.

**Example prompts:**
- "Start sous vide at 135°F for 2 hours"
- "Preheat to 375°F for roasting"
- "What's the oven temperature?"
- "Stop cooking"

See [AGENTS.md](AGENTS.md) for agent instructions. Works with Claude, Cursor, ChatGPT, and other LLMs.

## Prerequisites

1. **Anova Device**
   - Anova Precision Oven (APO) or Precision Cooker (APC)
   - Connected to WiFi and paired with your Anova account

2. **Personal Access Token**
   - Download the Anova Oven app (iOS/Android)
   - Navigate to: More → Developer → Personal Access Tokens
   - Generate a new token (starts with `anova-`)
3. **Python Environment**
   - Python 3.7 or higher
   - `websockets` library: `pip3 install websockets`

## Installation

1. **Store your Anova token:**
   ```bash
   mkdir -p ~/.config/anova
   echo "anova-YOUR_TOKEN_HERE" > ~/.config/anova/token
   chmod 600 ~/.config/anova/token
   ```

2. **Install Python dependencies:**
   ```bash
   pip3 install websockets
   ```

3. **Test the connection:**
   ```bash
   python3 scripts/anova.py list
   ```

## Usage

See [SKILL.md](SKILL.md) for complete usage instructions and examples.

**Quick examples:**
```bash
# List your devices
python3 scripts/anova.py list

# Basic cooking
python3 scripts/anova.py cook --temp 350 --duration 30

# Advanced: Custom elements and fan speed
python3 scripts/anova.py cook --temp 225 --elements rear --fan-speed 25 --duration 180

# Probe cooking (cook to internal temperature)
python3 scripts/anova.py cook --temp 350 --probe-temp 165

# Monitor real-time status
python3 scripts/anova.py monitor --monitor-duration 60

# Stop cooking
python3 scripts/anova.py stop
```

## Advanced Controls

The skill supports full control over:
- **Temperature**: Any value in °F or °C
- **Heating Elements**: Individual control (top, bottom, rear) or combinations
- **Fan Speed**: 0-100 for precise air circulation control
- **Cooking Mode**: Timer-based or probe-based (cook to internal temperature)

This enables advanced techniques like:
- Low-temp slow roasting (rear element only, low fan)
- High-heat searing (all elements, high fan)
- Probe-based cooking (stop when meat reaches target temp)

## Safety Notes

- Always verify temperatures before starting long cooks
- Monitor cooking remotely but check in person for safety
- Use timers to prevent overcooking
- Default timeout: 4 hours maximum

## Testing

Tested January 2026 with Anova Precision Oven (APO).

| Feature | Status |
|---------|--------|
| Device discovery | ✓ |
| Sous-vide mode | ✓ |
| Roast mode | ✓ |
| Steam mode | ✓ |
| Stop cooking | ✓ |
| Real-time monitoring | ✓ |
| Temperature units (F/C) | ✓ |
| APC (Precision Cooker) | Not tested |

## License

Apache 2.0 - See [LICENSE](LICENSE) for details.

## Credits

Built with the [Anova Developer API](https://developer.anovaculinary.com).

## Contributing

Issues and pull requests welcome! This skill is part of the [Agent Skills](https://agentskills.io) ecosystem.
