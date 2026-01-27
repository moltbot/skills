---
name: yt-api-cli
description: Manage your YouTube account from the command line. Complete CLI for YouTube Data API v3 - list/search videos, upload, manage playlists, and more.
metadata: {"clawdbot":{"emoji":"▶️","os":["darwin","linux"],"requires":{"env":["YT_API_AUTH_TYPE", "YT_API_CLIENT_ID", "YT_API_CLIENT_SECRET"]}}}
---

# yt-api-cli

Manage your YouTube account from the terminal. A complete CLI for the YouTube Data API v3.

## Installation

```bash
# Using go install
go install github.com/nerveband/youtube-api-cli/cmd/yt-api@latest

# Or download from releases
curl -L -o yt-api https://github.com/nerveband/youtube-api-cli/releases/latest/download/yt-api-darwin-arm64
chmod +x yt-api
sudo mv yt-api /usr/local/bin/
```

## Setup

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create/enable YouTube Data API v3
3. Create OAuth 2.0 credentials (Desktop app)
4. Download client configuration

### 2. Configure yt-api

```bash
mkdir -p ~/.yt-api
cat > ~/.yt-api/config.yaml << EOF
default_auth: oauth
default_output: json
oauth:
  client_id: "YOUR_CLIENT_ID"
  client_secret: "YOUR_CLIENT_SECRET"
EOF
```

### 3. Authenticate

```bash
yt-api auth login  # Opens browser for Google login
yt-api auth status # Check auth state
```

## Commands

### List Operations

```bash
# List your videos
yt-api list videos --mine

# List channel videos
yt-api list videos --channel-id UC_x5XG1OV2P6uZZ5FSM9Ttw

# List playlists
yt-api list playlists --mine

# List subscriptions
yt-api list subscriptions --mine
```

### Search

```bash
# Basic search
yt-api search --query "golang tutorial"

# With filters
yt-api search --query "music" --type video --duration medium --order viewCount
```

### Upload Operations

```bash
# Upload video
yt-api upload video ./video.mp4 \
  --title "My Video" \
  --description "Description here" \
  --tags "tag1,tag2" \
  --privacy public

# Upload thumbnail
yt-api upload thumbnail ./thumb.jpg --video-id VIDEO_ID
```

### Playlist Management

```bash
# Create playlist
yt-api insert playlist --title "My Playlist" --privacy private

# Add video to playlist
yt-api insert playlist-item --playlist-id PLxxx --video-id VIDxxx
```

### Channel Operations

```bash
# Get channel info
yt-api list channels --id UCxxx --part snippet,statistics

# Update channel description
yt-api update channel --id UCxxx --description "New description"
```

## Output Formats

```bash
# JSON (default - LLM-friendly)
yt-api list videos --mine

# Table (human-readable)
yt-api list videos --mine -o table

# YAML
yt-api list videos --mine -o yaml

# CSV
yt-api list videos --mine -o csv > videos.csv
```

## Global Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--output` | `-o` | Output format: json (default), yaml, csv, table |
| `--quiet` | `-q` | Suppress stderr messages |
| `--config` | | Path to config file |
| `--auth-type` | | Auth method: oauth (default), service-account |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `YT_API_AUTH_TYPE` | Auth method: oauth or service-account |
| `YT_API_OUTPUT` | Default output format |
| `YT_API_CLIENT_ID` | OAuth client ID |
| `YT_API_CLIENT_SECRET` | OAuth client secret |
| `YT_API_CREDENTIALS` | Path to service account JSON |

## Authentication Methods

### OAuth 2.0 (Default)
Best for interactive use and accessing your own YouTube account.

```bash
yt-api auth login  # Opens browser
```

### Service Account
Best for server-side automation.

```bash
yt-api --auth-type service-account --credentials ./key.json list videos
```

## Quick Diagnostic Commands

```bash
yt-api info                      # Full system state
yt-api info --test-connectivity  # Verify API access
yt-api info --test-permissions   # Check credential capabilities
yt-api auth status               # Authentication details
yt-api version                   # Version info
```

## Error Handling

Exit codes:
- `0` - Success
- `1` - General error
- `2` - Authentication error
- `3` - API error (quota, permissions)
- `4` - Input error

## For LLMs and Automation

- JSON output by default
- Structured errors as JSON objects
- `--quiet` mode for parsing
- `--dry-run` validates without executing
- Stdin support for piping data

## Notes

- Requires valid Google Cloud credentials with YouTube Data API v3 enabled
- OAuth tokens stored in `~/.yt-api/tokens.json` (0600 permissions)
- Default output is JSON (LLM-optimized)
- Supports all YouTube Data API v3 resources

## Source

GitHub: https://github.com/nerveband/youtube-api-cli
