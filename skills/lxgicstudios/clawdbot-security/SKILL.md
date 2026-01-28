---
name: clawdbot-security
description: Security audit and hardening for Clawdbot/Moltbot installations. Detects exposed gateways, fixes permissions, enables authentication, and guides firewall/Tailscale setup.
version: 1.0.0
author: lxgicstudios
keywords: clawdbot, moltbot, security, audit, hardening, firewall, tailscale, permissions
---

# Clawdbot Security Audit

Comprehensive security scanner and hardening guide for Clawdbot/Moltbot installations.

**Why this matters**: 1,673+ Clawdbot gateways were found exposed on Shodan. If you installed Clawdbot on a server or VPS, you might be one of them.

---

## Quick Start

```bash
# Scan for issues
npx clawdbot-security-audit

# Scan and auto-fix
npx clawdbot-security-audit --fix

# Deep scan (includes network check)
npx clawdbot-security-audit --deep --fix
```

---

## What Gets Checked

### 1. Gateway Binding
- **Safe**: `bind: "loopback"` (127.0.0.1)
- **DANGER**: `bind: "lan"` or `bind: "0.0.0.0"`

### 2. File Permissions
- Config directory: 700 (owner only)
- Config file: 600 (owner read/write only)
- Credentials: 700 (owner only)

### 3. Authentication
- Token auth or password auth should be enabled
- Without auth, anyone who finds your gateway has full access

### 4. Node.js Version
- Minimum: 20.x
- Recommended: 22.12.0+
- Older versions have known vulnerabilities

### 5. mDNS Broadcasting
- Clawdbot uses Bonjour for local discovery
- On servers, this should be disabled

### 6. External Accessibility (--deep)
- Checks if your gateway port is reachable from the internet
- Uses your public IP to test

---

## Manual Hardening Steps

### Step 1: Bind to Localhost Only

```json
// ~/.clawdbot/clawdbot.json
{
  "gateway": {
    "bind": "loopback",
    "port": 18789
  }
}
```

### Step 2: Lock File Permissions

```bash
chmod 700 ~/.clawdbot
chmod 600 ~/.clawdbot/clawdbot.json
chmod 700 ~/.clawdbot/credentials
```

### Step 3: Enable Authentication

```json
{
  "gateway": {
    "auth": {
      "mode": "token"
    }
  }
}
```

Then set the token:
```bash
export CLAWDBOT_GATEWAY_TOKEN=$(openssl rand -hex 32)
```

### Step 4: Disable mDNS

```bash
export CLAWDBOT_DISABLE_BONJOUR=1
```

### Step 5: Set Up Firewall (UFW)

```bash
# Default deny incoming
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (don't lock yourself out!)
sudo ufw allow ssh

# Allow Tailscale if using
sudo ufw allow in on tailscale0

# Enable firewall
sudo ufw enable

# DO NOT allow port 18789 publicly!
```

### Step 6: Set Up Tailscale (Recommended)

```bash
# Install
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# Configure Clawdbot
# Add to clawdbot.json:
{
  "gateway": {
    "bind": "loopback",
    "tailscale": {
      "mode": "serve"
    }
  }
}
```

---

## What Gets Exposed When Vulnerable

When a Clawdbot gateway is exposed:

- ❌ Complete conversation histories (Telegram, WhatsApp, Signal, iMessage)
- ❌ API keys (Claude, OpenAI, etc.)
- ❌ OAuth tokens and bot credentials
- ❌ Full shell access to the host machine
- ❌ All files in the workspace

**Prompt injection attacks** can extract this data with a single email or message.

---

## Checklist

- [ ] Gateway bound to loopback only
- [ ] File permissions locked down (700/600)
- [ ] Authentication enabled (token or password)
- [ ] Node.js 22.12.0+
- [ ] mDNS disabled on servers
- [ ] Firewall configured (UFW)
- [ ] Tailscale for remote access (not port forwarding)
- [ ] SSH key-only auth (no passwords)

---

## Installation

```bash
# npm
npm install -g clawdbot-security-audit

# ClawdHub
clawdhub install lxgicstudios/clawdbot-security
```

---

Built by **LXGIC Studios** - [@lxgicstudios](https://x.com/lxgicstudios)
