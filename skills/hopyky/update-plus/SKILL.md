---
name: update-plus
description: Full backup, update, and restore for OpenClaw - config, workspace, and skills with auto-rollback
version: 4.0.3
metadata: {"openclaw":{"emoji":"🔄","requires":{"bins":["git","jq","rsync"]}}}
---

# 🔄 Update Plus

A comprehensive backup, update, and restore tool for your OpenClaw environment. Protect your config, workspace, and skills with automatic rollback, encrypted backups, and cloud sync.

## Quick Start

```bash
# Check for available updates
update-plus check

# Create a full backup
update-plus backup

# Update everything (creates backup first)
update-plus update

# Preview changes (no modifications)
update-plus update --dry-run

# Restore from backup
update-plus restore openclaw-backup-2026-01-25-12:00:00.tar.gz
```

## Features

| Feature | Description |
|---------|-------------|
| **Full Backup** | Backup entire environment (config, workspace, skills) |
| **Auto Backup** | Creates backup before every update |
| **Auto Rollback** | Reverts to previous commit if update fails |
| **Smart Restore** | Restore everything or specific parts (config, workspace) |
| **Multi-Directory** | Separate prod/dev skills with independent update settings |
| **Encrypted Backups** | Optional GPG encryption |
| **Cloud Sync** | Upload backups to Google Drive, S3, Dropbox via rclone |
| **Notifications** | Get notified via WhatsApp, Telegram, or Discord |
| **Connection Retry** | Auto-retry on network failure (configurable) |

## Installation

```bash
git clone https://github.com/hopyky/update-plus.git ~/.openclaw/skills/update-plus
```

### Add to PATH

```bash
mkdir -p ~/bin
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
ln -sf ~/.openclaw/skills/update-plus/bin/update-plus ~/bin/update-plus
```

## Configuration

Create `~/.openclaw/update-plus.json`:

```json
{
  "backup_dir": "~/.openclaw/backups",
  "backup_before_update": true,
  "backup_count": 5,
  "backup_paths": [
    {"path": "~/.openclaw", "label": "config", "exclude": ["backups", "logs"]},
    {"path": "~/.openclaw/workspace", "label": "workspace", "exclude": ["node_modules"]}
  ],
  "skills_dirs": [
    {"path": "~/.openclaw/skills", "label": "prod", "update": true}
  ],
  "notifications": {
    "enabled": false,
    "target": "+1234567890"
  },
  "connection_retries": 3,
  "connection_retry_delay": 60
}
```

## Commands

| Command | Description |
|---------|-------------|
| `update-plus check` | Check for available updates |
| `update-plus backup` | Create a full backup |
| `update-plus update` | Update OpenClaw and all skills |
| `update-plus update --dry-run` | Preview changes |
| `update-plus restore <file>` | Restore from backup |
| `update-plus install-cron` | Install automatic updates (daily 2 AM) |
| `update-plus uninstall-cron` | Remove cron job |

## Changelog

### v4.0.3
- Check for updates BEFORE backup (skip backup if already up to date)
- No more wasted bandwidth/storage when nothing to update

### v4.0.2
- Use curl instead of ping for connection check (more reliable)
- Works through firewalls and when Mac wakes from sleep

### v4.0.1
- Added Homebrew path detection (`/opt/homebrew/bin`) for cron jobs
- Added `~/bin` to cron PATH for local symlinks
- Updated example config with clearer workspace structure

### v4.0.0
- OpenClaw only (removed moltbot/clawdbot legacy support)
- Simplified configuration and paths
- Config: ~/.openclaw/update-plus.json

### v3.x
- Multi-bot support (openclaw, moltbot, clawdbot)
- Connection retry for cron jobs

## Author

Created by **hopyky**

## License

MIT
