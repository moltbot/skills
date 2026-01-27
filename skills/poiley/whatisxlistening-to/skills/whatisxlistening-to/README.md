# Listening Dashboard

A real-time Last.fm "now playing" dashboard with local SQLite sync. Fork and deploy your own.

![Dashboard Preview](https://img.shields.io/badge/Last.fm-D51007?logo=lastdotfm&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

- **Now Playing** — Live track with album art and spinning vinyl effect
- **Quick Stats** — Total scrobbles, unique artists, today's plays (from local DB)
- **History** — Paginated listening history at `/history`
- **Auto-refresh** — Updates every 5 seconds
- **Local SQLite Sync** — Background sync to local database for fast stats/history
- **Health Endpoint** — `/healthz` for Kubernetes probes
- **Error Handling** — Graceful error UI when Last.fm is unavailable

## Architecture

The server uses a hybrid approach:
- **`/api/now`** — Real-time from Last.fm API (always fresh)
- **`/api/stats`** — From local SQLite DB (fast, with API fallback)
- **`/api/recent`** — From local SQLite DB (fast, with API fallback)
- **Background sync** — Periodically syncs scrobbles to local DB

## Quick Start

### Local Development

```bash
# 1. Create config
mkdir -p ~/.config/lastfm
echo '{"api_key": "YOUR_KEY", "username": "YOUR_USER", "display_name": "Your Name"}' > ~/.config/lastfm/config.json

# 2. Run
python3 server.py
# → http://localhost:8765
```

### Docker

```bash
docker run -d -p 8765:8765 \
  -e LASTFM_API_KEY=your_key \
  -e LASTFM_USERNAME=your_lastfm_user \
  -e DISPLAY_NAME="Your Name" \
  -e TZ=America/Los_Angeles \
  ghcr.io/your-username/listening-dashboard:latest
```

### Kubernetes

Uses Kustomize for configuration. See `k8s/` directory.

```bash
# 1. Create namespace
kubectl create namespace listening-dashboard

# 2. Create secret
kubectl create secret generic lastfm-credentials \
  --namespace=listening-dashboard \
  --from-literal=api_key=YOUR_KEY \
  --from-literal=username=YOUR_USER \
  --from-literal=display_name="Your Name"

# 3. Create overlay for your domain
mkdir -p k8s/overlays/prod
cat > k8s/overlays/prod/kustomization.yaml << EOF
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - ../../
images:
  - name: listening-dashboard
    newName: ghcr.io/your-username/listening-dashboard
    newTag: v1.0.0
patches:
  - target:
      kind: Ingress
      name: listening-dashboard
    patch: |
      - op: replace
        path: /spec/rules/0/host
        value: listening.your-domain.com
      - op: replace
        path: /spec/tls/0/hosts/0
        value: listening.your-domain.com
EOF

# 4. Apply
kustomize build k8s/overlays/prod | kubectl apply -f -
```

## Configuration

| Env Var | Description |
|---------|-------------|
| `LASTFM_API_KEY` | Your Last.fm API key ([get one](https://www.last.fm/api/account/create)) |
| `LASTFM_USERNAME` | Your Last.fm username |
| `DISPLAY_NAME` | Name shown in header (defaults to username) |
| `PORT` | Server port (default: 8765) |
| `DB_PATH` | SQLite database path (default: `./scrobbles.db`) |
| `SYNC_INTERVAL` | Sync interval in seconds (default: 300) |
| `TZ` | Timezone for "today" stats (e.g., `America/Los_Angeles`) |

## API Endpoints

| Endpoint | Description | Source |
|----------|-------------|--------|
| `/api/config` | Get display config (username, display_name) | Config |
| `/api/now` | Current/last played track | Last.fm API |
| `/api/stats` | Listening statistics | Local DB (API fallback) |
| `/api/recent?limit=N&page=N` | Recent tracks | Local DB (API fallback) |
| `/healthz` | Health check (200 OK) | N/A |
| `/history` | History page | Static |

## Customization

- **Colors**: Edit CSS variables in `web/index.html`
- **Fonts**: Change Google Fonts imports
- **Layout**: Modify the HTML structure

## Development

```bash
# Install test dependencies
pip install -r requirements-test.txt

# Run tests with coverage
pytest --cov=server --cov-report=term-missing

# Run server locally
python server.py
```

## License

MIT License - see [LICENSE](LICENSE)
