---
name: wyoming-clawdbot
description: Wyoming Protocol bridge for Home Assistant voice assistant integration with Clawdbot.
---

# Wyoming-Clawdbot

Bridge Home Assistant Assist voice commands to Clawdbot via Wyoming Protocol.

## What it does

- Receives voice commands from Home Assistant Assist
- Forwards them to Clawdbot for processing  
- Returns AI responses to be spoken by Home Assistant TTS

## Setup

1. Clone and run the server:
```bash
git clone https://github.com/vglafirov/wyoming-clawdbot.git
cd wyoming-clawdbot
docker compose up -d
```

2. Add Wyoming integration in Home Assistant:
   - Settings → Devices & Services → Add Integration
   - Search "Wyoming Protocol"
   - Enter host:port (e.g., `192.168.1.100:10600`)

3. Configure Voice Assistant pipeline to use "clawdbot" as Conversation Agent

## Requirements

- Clawdbot running on the same host
- Home Assistant with Wyoming integration
- Docker (recommended) or Python 3.11+

## Links

- GitHub: https://github.com/vglafirov/wyoming-clawdbot
