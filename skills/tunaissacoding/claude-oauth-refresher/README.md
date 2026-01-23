# Claude OAuth Refresher 🔐

Auto-refresh system for Claude Code OAuth tokens on macOS. Prevents authentication failures by automatically renewing tokens before they expire (~8 hours).

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform: macOS](https://img.shields.io/badge/platform-macOS-lightgrey.svg)](https://www.apple.com/macos/)

## Features

- ✅ **Automatic token refresh** - Runs 30 minutes before expiry
- ✅ **Smart notifications** - Configurable alerts via Telegram, Slack, Discord, WhatsApp, iMessage, or Signal
- ✅ **Pre-flight verification** - Checks all requirements before installation
- ✅ **One-command setup** - Interactive installation with auto-detection
- ✅ **Zero maintenance** - Config changes apply automatically
- ✅ **Detailed error reporting** - Context-specific troubleshooting when things break

## Requirements

⚠️ **Must have:**
- **macOS 10.13 (High Sierra) or newer** - Requires Keychain access
- **Claude Code CLI** installed - [Get it here](https://code.claude.com/docs/en/setup)
- **Already authenticated** via `claude auth`
- **Clawdbot running** - [Install Clawdbot](https://docs.clawd.bot/start/getting-started) or run: `curl -fsSL https://clawd.bot/install.sh | bash`

## Quick Start

```bash
# 1. Verify your setup
cd ~/clawd/skills/claude-oauth-refresher
./verify-setup.sh

# 2. Install (interactive, ~1 minute)
./install.sh

# 3. Done! Token refreshes automatically
```

## What You'll See

### During Installation

The installer will:
1. ✅ Verify all requirements
2. ✅ Auto-detect your Clawdbot channel (Telegram, WhatsApp, etc.)
3. ✅ Configure notifications interactively
4. ✅ Test refresh immediately
5. ✅ Set up automatic scheduling

### During Operation

**When refresh starts:**
```
🔄 Refreshing Claude token...
```

**When refresh succeeds:**
```
✅ Claude token refreshed!
New expiry: 2026-01-23 18:30:00
```

**When refresh fails:**
```
❌ Claude token refresh failed

Error: Network timeout connecting to auth.anthropic.com
Details: Connection timed out after 30s

Troubleshooting:
- Check internet connection
- Verify Keychain has valid refresh token
- Run: ./verify-setup.sh

Need help? Check logs:
~/clawd/logs/claude-oauth-refresh.log
```

## Configuration

Edit anytime: `~/clawd/claude-oauth-refresh-config.json`

```json
{
  "refresh_buffer_minutes": 30,
  "log_file": "~/clawd/logs/claude-oauth-refresh.log",
  
  "notifications": {
    "on_start": true,      // "Refreshing token..."
    "on_success": true,    // "Token refreshed!"
    "on_failure": true     // "Refresh failed: ..."
  },
  
  "notification_channel": "telegram",
  "notification_target": "123456789"
}
```

Changes apply automatically on next refresh - no need to reinstall!

### Notification Channels

Supports all Clawdbot channels:
- **Telegram** - `notification_target`: chat ID (e.g., `123456789`)
- **Slack** - `notification_target`: `user:<id>` or `channel:<id>`
- **Discord** - `notification_target`: `user:<id>` or `channel:<id>`
- **WhatsApp** - `notification_target`: E.164 phone (e.g., `+15551234567`)
- **iMessage** - `notification_target`: `chat_id:123` or phone/email
- **Signal** - `notification_target`: E.164 phone (e.g., `+15551234567`)

See [SKILL.md](SKILL.md) for detailed instructions on finding your target ID.

### Control via Clawdbot

You can also ask Clawdbot to manage notifications:
- "disable Claude refresh success notifications"
- "enable all Claude refresh notifications"
- "show Claude refresh notification settings"

## How It Works

1. **Smart refresh** - Runs 30 minutes before token expiration
2. **Dual update** - Updates both `auth-profiles.json` AND Keychain
3. **Auto-reschedule** - Calculates next refresh based on new expiry
4. **Fail-safe** - Detailed error messages with troubleshooting steps

Claude tokens expire ~8 hours after refresh, so the next refresh happens in ~7.5 hours.

## Uninstall

```bash
./uninstall.sh
```

Removes the refresh service but preserves config and logs. To reinstall: `./install.sh`

## Documentation

- **[SKILL.md](SKILL.md)** - Complete documentation
- **[QUICKSTART.md](QUICKSTART.md)** - Quick reference
- **[UPGRADE.md](UPGRADE.md)** - Migration guide from older versions

## Troubleshooting

**Installation fails?**
```bash
./verify-setup.sh
```
This runs 11 pre-flight checks and tells you exactly what's missing.

**Refresh not working?**
Check logs:
```bash
tail -f ~/clawd/logs/claude-oauth-refresh.log
```

**Common issues:**
- **"Not macOS"** → This skill requires macOS for Keychain access
- **"Claude CLI not found"** → Install: `brew install claude`
- **"No Keychain credentials"** → Run: `claude auth`
- **"Clawdbot not running"** → Start: `clawdbot gateway start`

See [SKILL.md](SKILL.md) for comprehensive troubleshooting.

## Credits

Built by [Tuna](https://github.com/TunaIssaCoding) for the Clawdbot community.

Extracted from my personal Claude workflow automation and generalized for everyone.

## License

MIT License - see LICENSE file for details.

## Contributing

Issues and PRs welcome! This is a community tool.

---

**Install via ClawdHub:**
```bash
clawdhub install claude-oauth-refresher
```

**Links:**
- [ClawdHub Page](#) (coming soon)
- [GitHub Repository](https://github.com/TunaIssaCoding/claude-oauth-refresher)
- [Clawdbot](https://clawdbot.com)
