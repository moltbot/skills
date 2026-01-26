---
name: git-crypt-backup
description: Backup Clawdbot workspace and config to GitHub with git-crypt encryption. Use for daily automated backups or manual backup/restore operations.
---

# Git-Crypt Backup

Automated backup of Clawdbot workspace (`~/clawd`) and config (`~/.clawdbot`) to GitHub with sensitive files encrypted via git-crypt.

## Setup

### 1. Create GitHub repos (private recommended)

```bash
# Create two private repos on GitHub:
# - <username>/clawdbot-workspace
# - <username>/clawdbot-config
```

### 2. Initialize git-crypt

```bash
# Install git-crypt
brew install git-crypt  # macOS
# apt install git-crypt  # Linux

# Workspace repo
cd ~/clawd
git init
git-crypt init
git remote add origin git@github.com:<username>/clawdbot-workspace.git

# Config repo
cd ~/.clawdbot
git init
git-crypt init
git remote add origin git@github.com:<username>/clawdbot-config.git
```

### 3. Configure encryption

**Workspace `.gitattributes`:**
```
SOUL.md filter=git-crypt diff=git-crypt
USER.md filter=git-crypt diff=git-crypt
HEARTBEAT.md filter=git-crypt diff=git-crypt
MEMORY.md filter=git-crypt diff=git-crypt
memory/** filter=git-crypt diff=git-crypt
```

**Config `.gitattributes`:**
```
clawdbot.json filter=git-crypt diff=git-crypt
.env filter=git-crypt diff=git-crypt
credentials/** filter=git-crypt diff=git-crypt
telegram/** filter=git-crypt diff=git-crypt
identity/** filter=git-crypt diff=git-crypt
agents/**/sessions/** filter=git-crypt diff=git-crypt
nodes/** filter=git-crypt diff=git-crypt
```

**Config `.gitignore`:**
```
*.bak
*.bak.*
.DS_Store
logs/
media/
browser/
subagents/
memory/
update-check.json
*.lock
```

### 4. Export keys (important!)

```bash
mkdir -p ~/clawdbot-keys
cd ~/clawd && git-crypt export-key ~/clawdbot-keys/workspace.key
cd ~/.clawdbot && git-crypt export-key ~/clawdbot-keys/config.key
```

⚠️ **Store these keys securely** (1Password, iCloud Keychain, USB drive, etc.)

### 5. Initial commit & push

```bash
cd ~/clawd && git add -A && git commit -m "Initial backup" && git push -u origin main
cd ~/.clawdbot && git add -A && git commit -m "Initial backup" && git push -u origin main
```

## Daily Backup

Run `scripts/backup.sh`:

```bash
~/clawd/skills/git-crypt-backup/scripts/backup.sh
```

Or set up a cron job for automatic daily backups.

## Restore on New Machine

```bash
# 1. Clone repos
git clone git@github.com:<username>/clawdbot-workspace.git ~/clawd
git clone git@github.com:<username>/clawdbot-config.git ~/.clawdbot

# 2. Unlock with keys
cd ~/clawd && git-crypt unlock /path/to/workspace.key
cd ~/.clawdbot && git-crypt unlock /path/to/config.key
```

## What Gets Encrypted

| Repo | Encrypted | Plain |
|------|-----------|-------|
| workspace | SOUL/USER/HEARTBEAT/MEMORY.md, memory/** | AGENTS.md, IDENTITY.md, TOOLS.md, drafts/** |
| config | clawdbot.json, .env, credentials/**, sessions/** | cron/jobs.json, settings/** |
