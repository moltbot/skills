---
name: roku
description: Control Roku devices via CLI. Discovery, remote control, app launching, search, and HTTP bridge mode for real-time control.
homepage: https://github.com/gumadeiras/roku-cli
repository: https://github.com/gumadeiras/roku-cli
metadata: {"clawdbot":{"emoji":"📺","requires":{"bins":["roku"]},"install":[{"id":"node","kind":"node","package":"roku-ts-cli","bins":["roku"],"label":"Install Roku CLI (npm)"}]}}
---

# Roku CLI

Fast TypeScript CLI for controlling Roku devices via the ECP API.

## Installation

```bash
npm install -g roku-ts-cli@latest
```

## Quick Start

```bash
# Discover devices and save an alias
roku discover --save livingroom --index 1

# Use the alias
roku --host livingroom device-info
roku --host livingroom apps
```

## Commands

| Command | Description |
|---------|-------------|
| `roku discover` | Find Roku devices on network |
| `roku --host <ip> device-info` | Get device info |
| `roku --host <ip> apps` | List installed apps |
| `roku --host <ip> command <key>` | Send remote key |
| `roku --host <ip> literal <text>` | Type text |
| `roku --host <ip> search --title <query>` | Search content |
| `roku --host <ip> launch <app>` | Launch app |
| `roku --host <ip> interactive` | Interactive remote mode |

## Interactive Mode

```bash
roku livingroom                    # interactive control
roku --host livingroom interactive # same thing
```

Use arrow keys, enter, escape for remote-like control.

## Bridge Service

Run a persistent HTTP bridge as a native OS service:

```bash
# Install and start the service
roku bridge install-service --port 19839 --token secret --host livingroom --user
roku bridge start --user

# Service management
roku bridge status --user
roku bridge stop --user
roku bridge uninstall --user
```

Send commands via HTTP:

```bash
# Send key
curl -X POST http://127.0.0.1:19839/key \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer secret" \
  -d '{"key":"home"}'

# Type text
curl -X POST http://127.0.0.1:19839/text \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer secret" \
  -d '{"text":"hello"}'

# Launch app
curl -X POST http://127.0.0.1:19839/launch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer secret" \
  -d '{"app":"plex"}'

# Health check
curl http://127.0.0.1:19839/health -H "Authorization: Bearer secret"
```

### Bridge Endpoints

| Endpoint | Body |
|----------|------|
| `POST /key` | `{"key": "home"}` |
| `POST /text` | `{"text": "hello"}` |
| `POST /search` | `{"title": "Stargate"}` |
| `POST /launch` | `{"app": "plex"}` |
| `GET /health` | — |
| `GET /health?deep=1` | Deep health check (probes Roku) |

## Aliases

```bash
# Save device alias
roku discover --save livingroom --index 1
roku alias set office 192.168.1.20

# Save app alias  
roku alias set plex 13535

# List aliases
roku alias list

# Use aliases
roku --host livingroom launch plex
```

## Remote Keys

home, back, select, up, down, left, right, play, pause, rev, fwd, replay, info, power, volume_up, volume_down, mute

## Notes

- Roku must be on the same network as the CLI
- Bridge service runs as a native launchd (macOS) or systemd (Linux) service
- Use `--user` flag for user-space service (no sudo required)
- Use `--token` for authentication in bridge mode

## Source

https://github.com/gumadeiras/roku-cli
