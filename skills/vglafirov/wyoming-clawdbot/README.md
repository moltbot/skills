# Wyoming-Clawdbot

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Wyoming Protocol server that bridges [Home Assistant Assist](https://www.home-assistant.io/voice_control/) to [Clawdbot](https://clawd.bot) — enabling voice control of your AI assistant.

## Features

- 🎤 Voice commands through Home Assistant Assist
- 🤖 Powered by Clawdbot AI (Claude, GPT, etc.)
- 🏠 Full Home Assistant integration
- 🌍 Multilingual support (English, Russian, German, French, and more)
- 💬 Persistent conversation context

## How It Works

```
Voice → Home Assistant → STT → Wyoming-Clawdbot → Clawdbot → Response → TTS → Speaker
```

1. You speak to your Home Assistant voice satellite (ESPHome, etc.)
2. Speech-to-Text converts your voice to text
3. Wyoming-Clawdbot sends the text to Clawdbot
4. Clawdbot processes and returns a response
5. Text-to-Speech speaks the response

## Requirements

- [Clawdbot](https://clawd.bot) installed and running
- Home Assistant with Wyoming integration
- Python 3.11+ (or Docker)

## Installation

### Docker Compose (recommended)

```bash
git clone https://github.com/vglafirov/wyoming-clawdbot.git
cd wyoming-clawdbot
docker-compose up -d
```

### Manual

```bash
# Clone the repository
git clone https://github.com/vglafirov/wyoming-clawdbot.git
cd wyoming-clawdbot

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## Usage

### Basic

```bash
python wyoming_clawdbot.py --port 10600
```

### With persistent session (recommended)

```bash
python wyoming_clawdbot.py --port 10600 --session-id voice-assistant
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--host` | Host to bind to | `0.0.0.0` |
| `--port` | Port to listen on | `10400` |
| `--session-id` | Clawdbot session ID for context persistence | random |
| `--agent` | Clawdbot agent ID | default |
| `--debug` | Enable debug logging | false |

## Systemd Service

Create `/etc/systemd/system/wyoming-clawdbot.service`:

```ini
[Unit]
Description=Wyoming Clawdbot Bridge
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/wyoming-clawdbot
Environment="PATH=/usr/local/bin:/usr/bin:/bin"
ExecStart=/path/to/wyoming-clawdbot/venv/bin/python wyoming_clawdbot.py --port 10600 --session-id voice-assistant
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable wyoming-clawdbot
sudo systemctl start wyoming-clawdbot
```

## Home Assistant Configuration

1. Go to **Settings → Devices & Services → Add Integration**
2. Search for **Wyoming Protocol**
3. Enter the host and port (e.g., `192.168.1.100:10600`)
4. The "clawdbot" conversation agent will appear
5. Configure your Voice Assistant pipeline to use "clawdbot" as the Conversation Agent

## License

MIT License - see [LICENSE](LICENSE) for details.

## Credits

- [Clawdbot](https://clawd.bot) - AI assistant platform
- [Wyoming Protocol](https://github.com/rhasspy/wyoming) - Voice assistant protocol
- [Home Assistant](https://www.home-assistant.io/) - Home automation platform
