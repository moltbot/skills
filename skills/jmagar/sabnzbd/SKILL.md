---
name: sabnzbd
version: 1.0.0
description: Manage Usenet downloads with SABnzbd. Use when the user asks to "check SABnzbd", "list NZB queue", "add NZB", "pause downloads", "resume downloads", "SABnzbd status", "Usenet queue", "NZB history", or mentions SABnzbd/sab download management.
---

# SABnzbd API

Manage Usenet downloads via SABnzbd's REST API.

## Setup

Config: `~/.clawdbot/credentials/sabnzbd/config.json`

```json
{
  "url": "http://localhost:8080",
  "apiKey": "your-api-key-from-config-general"
}
```

Get your API key from SABnzbd Config → General → Security.

## Quick Reference

### Queue Status

```bash
# Full queue
./scripts/sab-api.sh queue

# With filters
./scripts/sab-api.sh queue --limit 10 --category tv

# Specific job
./scripts/sab-api.sh queue --nzo-id SABnzbd_nzo_xxxxx
```

### Add NZB

```bash
# By URL (indexer link)
./scripts/sab-api.sh add "https://indexer.com/get.php?guid=..."

# With options
./scripts/sab-api.sh add "URL" --name "My Download" --category movies --priority high

# By local file
./scripts/sab-api.sh add-file /path/to/file.nzb --category tv
```

Priority: `force`, `high`, `normal`, `low`, `paused`, `duplicate`

### Control Queue

```bash
./scripts/sab-api.sh pause              # Pause all
./scripts/sab-api.sh resume             # Resume all
./scripts/sab-api.sh pause-job <nzo_id>
./scripts/sab-api.sh resume-job <nzo_id>
./scripts/sab-api.sh delete <nzo_id>    # Keep files
./scripts/sab-api.sh delete <nzo_id> --files  # Delete files too
./scripts/sab-api.sh purge              # Clear queue
```

### Speed Control

```bash
./scripts/sab-api.sh speedlimit 50      # 50% of max
./scripts/sab-api.sh speedlimit 5M      # 5 MB/s
./scripts/sab-api.sh speedlimit 0       # Unlimited
```

### History

```bash
./scripts/sab-api.sh history
./scripts/sab-api.sh history --limit 20 --failed
./scripts/sab-api.sh retry <nzo_id>     # Retry failed
./scripts/sab-api.sh retry-all          # Retry all failed
./scripts/sab-api.sh delete-history <nzo_id>
```

### Categories & Scripts

```bash
./scripts/sab-api.sh categories
./scripts/sab-api.sh scripts
./scripts/sab-api.sh change-category <nzo_id> movies
./scripts/sab-api.sh change-script <nzo_id> notify.py
```

### Status & Info

```bash
./scripts/sab-api.sh status             # Full status
./scripts/sab-api.sh version
./scripts/sab-api.sh warnings
./scripts/sab-api.sh server-stats       # Download stats
```

## Response Format

Queue slot includes:
- `nzo_id`, `filename`, `status`
- `mb`, `mbleft`, `percentage`
- `timeleft`, `priority`, `cat`
- `script`, `labels`

Status values: `Downloading`, `Queued`, `Paused`, `Propagating`, `Fetching`

History status: `Completed`, `Failed`, `Queued`, `Verifying`, `Repairing`, `Extracting`
