---
name: whatisxlistening-to
description: Query Last.fm listening data, show now playing, sync scrobble history to local DB, and deploy a personal "now playing" web dashboard. Use when user asks about current music, listening stats, scrobble history, or wants to set up a Last.fm dashboard.
---

# whatisxlistening.to

Last.fm CLI + real-time "now playing" web dashboard.

**Live demo**: https://whatisbenlistening.to

## Quick Start

### CLI

```bash
# 1. Initialize config
./lastfm init
# Edit ~/.config/lastfm/config.json with your API key

# 2. Test
./lastfm now
./lastfm stats
./lastfm recent
```

### Dashboard

```bash
# Docker
docker run -d -p 8765:8765 \
  -e LASTFM_API_KEY=your_key \
  -e LASTFM_USERNAME=your_user \
  -e TZ=America/Los_Angeles \
  ghcr.io/poiley/whatisxlistening.to:latest

# → http://localhost:8765
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `lastfm init` | Create config file template |
| `lastfm now` | Show current/last played track |
| `lastfm stats` | Show listening statistics |
| `lastfm recent [N]` | Show N recent tracks (default 10) |
| `lastfm backfill` | Download **full** listening history to local DB |
| `lastfm sync` | Sync new scrobbles (incremental) |
| `lastfm search <query>` | Search local DB by artist/track/album |
| `lastfm db` | Show local database statistics |

## Setup

### 1. Get Last.fm API Key

1. Go to https://www.last.fm/api/account/create
2. Create an application (any name)
3. Copy your API Key

### 2. Create Config

```bash
./lastfm init
# Then edit ~/.config/lastfm/config.json:
```

```json
{
  "api_key": "YOUR_API_KEY",
  "username": "YOUR_LASTFM_USERNAME"
}
```

## Clawdbot Usage

| User Says | Action |
|-----------|--------|
| "What am I listening to?" | `lastfm now` |
| "My listening stats" | `lastfm stats` |
| "What did I listen to recently?" | `lastfm recent` |
| "Search for Radiohead" | `lastfm search "Radiohead"` |

---

## Dashboard Deployment

### Docker

```bash
docker run -d -p 8765:8765 \
  -e LASTFM_API_KEY=your_key \
  -e LASTFM_USERNAME=your_user \
  -e DISPLAY_NAME="Your Name" \
  -e TZ=America/Los_Angeles \
  ghcr.io/poiley/whatisxlistening.to:latest
```

### Kubernetes

See `k8s/` directory and `README.md` for full deployment guide with Kustomize.

```bash
kubectl create namespace listening-dashboard
kubectl create secret generic lastfm-credentials \
  -n listening-dashboard \
  --from-literal=api_key=YOUR_KEY \
  --from-literal=username=YOUR_USER
kubectl apply -k k8s/
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `LASTFM_API_KEY` | ✅ | Last.fm API key |
| `LASTFM_USERNAME` | ✅ | Last.fm username |
| `DISPLAY_NAME` | ❌ | Name in header (defaults to username) |
| `TZ` | ❌ | Timezone for "today" stats (e.g., `America/Los_Angeles`) |
| `PORT` | ❌ | Server port (default: 8765) |

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | Now playing dashboard |
| `GET /history` | Listening history page |
| `GET /healthz` | Health check |
| `GET /api/config` | `{username, display_name}` |
| `GET /api/now` | Current/last track |
| `GET /api/stats` | Listening statistics (total, artists, today, streak) |
| `GET /api/recent?limit=N&page=N` | Recent tracks with album art |

## Files

```
whatisxlistening.to/
├── SKILL.md              # Clawdbot skill config
├── lastfm                # CLI symlink
├── lastfm_cli.py         # CLI source
├── config.example.json   # Config template
├── server.py             # Dashboard server
├── schema.sql            # SQLite schema
├── Dockerfile
├── README.md
├── web/
│   ├── index.html        # Now playing page
│   └── history.html      # History browser
├── k8s/                  # Kubernetes manifests
└── tests/                # 100% coverage
```

## License

MIT
