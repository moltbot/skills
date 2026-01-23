---
name: gotrain
description: MTA system train departures (NYC Subway, LIRR, Metro-North). Use when the user wants train times, schedules, or service alerts for MTA transit. Covers MTA Subway, LIRR, and Metro-North across the greater New York area.
---

# gotrain

Atomic CLI for NYC transit departures (MTA Subway, LIRR, Metro-North).

## Commands

| Command | Description |
|---------|-------------|
| `gotrain stations [query]` | List/search stations |
| `gotrain departures <station-id>` | Show departures for a station |
| `gotrain alerts` | Active service alerts |
| `gotrain fav <id>` | Toggle favorite station |
| `gotrain favs` | List favorite stations |

## Common Station IDs

- `MNR-149` - New Haven
- `MNR-151` - New Haven-State St
- `MNR-1` - Grand Central
- `MNR-203` - Penn Station (MNR)
- `LIRR-349` - Grand Central
- `SUBWAY-631` - Grand Central-42 St

## Examples

```bash
# Search for Penn Station
gotrain stations penn

# New Haven to Grand Central departures
gotrain departures MNR-149

# Check service alerts
gotrain alerts

# Add favorite station
gotrain fav MNR-149
```

## Installation

```bash
curl -sL https://raw.githubusercontent.com/gumadeiras/gotrain-cli/main/install.sh | bash
```

Or manual: Copy `gotrain` to `~/.local/bin/` and ensure it's in PATH.
