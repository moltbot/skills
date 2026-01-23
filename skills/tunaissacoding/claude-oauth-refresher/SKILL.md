---
name: claude-oauth-refresher
description: Keep your Claude access token fresh 24/7. Automatically refreshes OAuth tokens before expiry so you never see authentication failures.
---

# claude-oauth-refresher

**Automatic OAuth token refresh for Claude Code CLI on macOS**

Keep your Claude account logged in 24/7 by automatically refreshing OAuth tokens before they expire.

---

## ⚠️ Requirements

This skill is **macOS-only** and requires:

1. **macOS** (uses Keychain for secure credential storage)
2. **Claude Code CLI** already installed (`claude` command available)
3. **Already logged into your Claude account** (run `claude` then `login` - stores tokens in Keychain)
4. **Clawdbot** installed and running

**Not sure if you're set up?** Run the verification script:
```bash
./verify-setup.sh
```

---

## What It Does

- **Monitors** your Claude CLI token expiration
- **Refreshes** tokens automatically before they expire (default: 30 min buffer)
- **Notifies** you with three notification types:
  - 🔄 Start: "Refreshing Claude token..." 
  - ✅ Success: "Claude token refreshed!"
  - ❌ Failure: Detailed error with troubleshooting steps
- **Logs** all refresh attempts for debugging

---

## Installation

### Quick Setup (Recommended)

```bash
cd ~/clawd/skills/claude-oauth-refresher
./install.sh
```

**This installer runs ONCE** and sets up automatic token refresh that runs every 2 hours.

The installer will:
1. Verify your system meets requirements
2. **Interactively configure** notification preferences
3. Auto-detect your notification target (Telegram, Slack, etc.)
4. Set up launchd for automatic refresh
5. Test the refresh immediately

**After installation:**
- Config changes apply automatically (refresh script reads config each run)
- Edit `claude-oauth-refresh-config.json` to change settings
- Ask Clawdbot to modify settings for you
- **Only re-run installer** if you need to reinstall or fix the job

### Interactive Notification Setup

During installation, you'll be prompted:

```
Configure Notifications:
💡 Recommendation: Keep all enabled for the first run to verify it works.
   You can disable them later by:
   1. Editing ~/clawd/claude-oauth-refresh-config.json
   2. Asking Clawdbot: "disable Claude refresh notifications"

Enable "🔄 Refreshing token..." notification? [Y/n]: 
Enable "✅ Token refreshed!" notification? [Y/n]: 
Enable "❌ Refresh failed" notification? [Y/n]: 
```

**Recommendation:** Keep all enabled initially to verify everything works, then disable start/success notifications once you're confident.

---

## Managing Notifications with Clawdbot

**You can ask Clawdbot to change notification settings for you!** No need to edit JSON manually.

### Examples

**Disable specific notification types:**
```
"disable Claude refresh start notifications"
"disable Claude refresh success notifications"
"turn off Claude token refresh start messages"
```

**Enable notification types:**
```
"enable Claude refresh start notifications"
"enable all Claude refresh notifications"
"turn on Claude token refresh success messages"
```

**Check current settings:**
```
"show Claude refresh notification settings"
"what are my Claude token refresh notification settings?"
```

**Disable all notifications:**
```
"disable all Claude refresh notifications"
"turn off all Claude token notifications"
```

**Reset to defaults:**
```
"reset Claude refresh notifications to defaults"
```

### How It Works

Clawdbot will:
1. Read your `~/clawd/claude-oauth-refresh-config.json`
2. Update the appropriate notification flags
3. Save the file
4. Confirm the changes

**Changes apply immediately** on the next refresh (no need to restart anything).

---

## Auto-Detection (Smart Defaults)

**The install script automatically detects your notification settings!**

It reads `~/.clawdbot/clawdbot.json` to find:
- Which messaging channels you have enabled
- Your chat ID, phone number, or user ID
- Automatically populates `claude-oauth-refresh-config.json` with these values

**Example:** If you have Telegram enabled with chat ID `123456789`, the installer creates:
```json
{
  "notification_channel": "telegram",
  "notification_target": "123456789"
}
```

**To override:** Simply edit `claude-oauth-refresh-config.json` after installation to use a different channel or target.

**If auto-detection fails:** The installer will prompt you to configure manually (see "Finding Your Target ID" below).

**Test detection before installing:**
```bash
./test-detection.sh
# Shows what would be auto-detected without modifying anything
```

---

## Finding Your Target ID

To receive notifications, you need to configure your `notification_target` in `claude-oauth-refresh-config.json`. Here's how to find it for each channel:

### Telegram

**Format:** Numeric chat ID (e.g., `123456789`)

**How to find:**
```bash
# Option 1: Use Clawdbot CLI
clawdbot message telegram account list

# Option 2: Message @userinfobot on Telegram
# Send any message, it will reply with your ID

# Option 3: Check recent messages
clawdbot message telegram message search --limit 1 --from-me true
```

**Example config:**
```json
{
  "notification_channel": "telegram",
  "notification_target": "123456789"
}
```

### Slack

**Format:** 
- Direct messages: `user:U01234ABCD`
- Channels: `channel:C01234ABCD`

**How to find:**
```bash
# List channels
clawdbot message slack channel list

# Find user ID
clawdbot message slack user list | grep "your.email@company.com"

# Or click on your profile in Slack → More → Copy member ID
```

**Example config:**
```json
{
  "notification_channel": "slack",
  "notification_target": "user:U01234ABCD"
}
```

### Discord

**Format:**
- Direct messages: `user:123456789012345678`
- Channels: `channel:123456789012345678`

**How to find:**
```bash
# Enable Developer Mode in Discord (Settings → Advanced → Developer Mode)
# Then right-click your username → Copy ID

# Or list channels
clawdbot message discord channel list
```

**Example config:**
```json
{
  "notification_channel": "discord",
  "notification_target": "user:123456789012345678"
}
```

### WhatsApp

**Format:** E.164 phone number (e.g., `+15551234567`)

**How to find:**
- Use your full phone number with country code
- Format: `+[country code][number]` (no spaces, dashes, or parentheses)

**Examples:**
- US: `+15551234567`
- UK: `+447911123456`
- Australia: `+61412345678`

**Example config:**
```json
{
  "notification_channel": "whatsapp",
  "notification_target": "+15551234567"
}
```

### iMessage

**Format (preferred):** `chat_id:123`

**How to find:**
```bash
# List recent chats to find your chat_id
clawdbot message imessage thread list --limit 10

# Find the chat with yourself or your preferred device
```

**Alternative formats:**
- Phone: `+15551234567` (E.164 format)
- Email: `your.email@icloud.com`

**Example config:**
```json
{
  "notification_channel": "imessage",
  "notification_target": "chat_id:123"
}
```

### Signal

**Format:** E.164 phone number (e.g., `+15551234567`)

**How to find:**
- Use your Signal-registered phone number
- Format: `+[country code][number]` (no spaces, dashes, or parentheses)

**Example config:**
```json
{
  "notification_channel": "signal",
  "notification_target": "+15551234567"
}
```

---

## Configuration

**File:** `claude-oauth-refresh-config.json`

```json
{
  "refresh_buffer_minutes": 30,
  "log_file": "~/clawd/logs/claude-oauth-refresh.log",
  "notifications": {
    "on_start": true,
    "on_success": true,
    "on_failure": true
  },
  "notification_channel": "telegram",
  "notification_target": "YOUR_CHAT_ID"
}
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `refresh_buffer_minutes` | number | `30` | Refresh tokens this many minutes before expiry |
| `log_file` | string | `~/clawd/logs/claude-oauth-refresh.log` | Where to write logs |
| `notifications.on_start` | boolean | `true` | Send "🔄 Refreshing token..." notification |
| `notifications.on_success` | boolean | `true` | Send "✅ Token refreshed!" notification |
| `notifications.on_failure` | boolean | `true` | Send "❌ Refresh failed" notification with details |
| `notification_channel` | string | `telegram` | Channel to use (see above for options) |
| `notification_target` | string | `YOUR_CHAT_ID` | Target ID (see "Finding Your Target ID") |

### Notification Types Explained

**🔄 Start (`on_start`)**
- Sent when refresh process begins
- Useful for debugging or knowing when refresh runs
- **Recommendation:** Disable once you verify it works (can be noisy)

**✅ Success (`on_success`)**
- Sent when token successfully refreshed
- Includes validity duration (e.g., "valid for 24h")
- **Recommendation:** Disable once you trust the setup (can be noisy)

**❌ Failure (`on_failure`)**
- Sent when refresh fails with detailed error info
- Includes troubleshooting steps based on error type
- **Recommendation:** Keep enabled! You want to know about failures.

### Example Configurations

**Minimal (failures only):**
```json
{
  "notifications": {
    "on_start": false,
    "on_success": false,
    "on_failure": true
  }
}
```

**Verbose (all notifications):**
```json
{
  "notifications": {
    "on_start": true,
    "on_success": true,
    "on_failure": true
  }
}
```

**Silent (no notifications):**
```json
{
  "notifications": {
    "on_start": false,
    "on_success": false,
    "on_failure": false
  }
}
```

---

## Detailed Failure Messages

When a refresh fails, you'll receive a detailed notification with:

1. **Error message** - What went wrong
2. **Details** - Additional context (HTTP codes, error responses, etc.)
3. **Troubleshooting** - Specific steps based on the error type
4. **Help** - Where to find logs and get support

### Example Failure Notification

```
❌ Claude token refresh failed

Error: Network timeout connecting to auth.anthropic.com
Details: Connection timed out after 30s

Troubleshooting:
- Check your internet connection
- Verify you can reach auth.anthropic.com
- Try running manually: ~/clawd/skills/claude-oauth-refresher/refresh-token.sh

Need help? Message Clawdbot or check logs:
~/clawd/logs/claude-oauth-refresh.log
```

### Common Errors and Solutions

**Network/Timeout Errors**
```
Troubleshooting:
- Check your internet connection
- Verify you can reach auth.anthropic.com
- Try running manually: ./refresh-token.sh
```

**Invalid Refresh Token**
```
Troubleshooting:
- Your refresh token may have expired
- Re-authenticate: claude auth logout && claude auth
- Verify Keychain access: security find-generic-password -s 'claude-cli-auth' -a 'default'
```

**Keychain Access Denied**
```
Troubleshooting:
- Check Keychain permissions
- Re-run authentication: claude auth
- Verify setup: ./verify-setup.sh
```

**Missing Auth Profile**
```
Troubleshooting:
- Run: claude auth
- Verify file exists: ~/.config/claude/auth-profiles.json
- Check file permissions: chmod 600 ~/.config/claude/auth-profiles.json
```

---

## Usage

### Check Status

```bash
# View recent logs
tail -f ~/clawd/logs/claude-oauth-refresh.log

# Check launchd status
launchctl list | grep claude-oauth-refresher

# Manual refresh (for testing)
cd ~/clawd/skills/claude-oauth-refresher
./refresh-token.sh
```

### Modify Settings

**Option 1: Ask Clawdbot (easiest)**
```
"disable Claude refresh start notifications"
"show Claude refresh notification settings"
```

**Option 2: Edit config file**
```bash
nano ~/clawd/skills/claude-oauth-refresher/claude-oauth-refresh-config.json
```

Changes apply automatically on next refresh (every 2 hours, or when you run manually).

**No need to restart anything!** The refresh script reads the config file each time it runs.

---

## Troubleshooting

### Problem: `verify-setup.sh` says Claude CLI not found

**Solution:**
```bash
# Install Claude CLI
brew install claude

# Or download from https://github.com/anthropics/claude-cli
```

---

### Problem: `verify-setup.sh` says no refresh token found

**Solution:**
```bash
# Authenticate with Claude
claude auth

# Follow the prompts to log in
```

---

### Problem: Notifications not arriving

**Solution:**
1. Check your `notification_target` format matches the examples above
2. Test manually:
   ```bash
   clawdbot message [channel] send --target "[your_target]" --message "Test"
   ```
3. Check Clawdbot is running: `clawdbot gateway status`
4. Verify notification settings:
   ```bash
   cat ~/clawd/skills/claude-oauth-refresher/claude-oauth-refresh-config.json | jq .notifications
   ```

---

### Problem: Token refresh fails with "invalid_grant"

**Solution:**
```bash
# Re-authenticate from scratch
claude auth logout
claude auth

# Test refresh again
cd ~/clawd/skills/claude-oauth-refresher
./refresh-token.sh
```

---

### Problem: "Config file not found" after upgrade

**Solution:**
The config file was renamed from `config.json` to `claude-oauth-refresh-config.json`.

```bash
# If you have an old config.json, run the installer to migrate:
cd ~/clawd/skills/claude-oauth-refresher
./install.sh
# Choose to keep existing config when prompted
```

---

### Problem: Want to reinstall or fix the job

**Solution:**
```bash
# Re-run the installer (safe to run multiple times)
cd ~/clawd/skills/claude-oauth-refresher
./install.sh
```

The installer will:
- Detect existing config and ask if you want to keep it
- Update the launchd job
- Test the refresh

---

## Uninstall

```bash
cd ~/clawd/skills/claude-oauth-refresher
./uninstall.sh
```

This will:
- Stop and unload the launchd service
- Remove the plist file
- Optionally delete logs and config

---

## How It Works

1. **Installer (`install.sh`)** - Run ONCE to set up:
   - Auto-detects notification target
   - Interactively configures notification types
   - Creates launchd job
   - Tests refresh immediately

2. **Launchd** - Runs `refresh-token.sh` every 2 hours automatically

3. **Refresh Script (`refresh-token.sh`)** - Each run:
   - Reads config file (changes apply automatically!)
   - Checks token expiration from `~/.config/claude/auth-profiles.json`
   - If token expires within buffer window (default 30 min):
     - Sends start notification (if enabled)
     - Retrieves refresh token from Keychain
     - Calls OAuth endpoint to get new tokens
     - Updates auth profile and Keychain
     - Sends success notification (if enabled)
   - If refresh fails:
     - Sends detailed failure notification with troubleshooting
   - All activity logged to `~/clawd/logs/claude-oauth-refresh.log`

4. **Config Changes** - Applied automatically:
   - Edit `claude-oauth-refresh-config.json` anytime
   - Ask Clawdbot to edit for you
   - Changes take effect on next refresh
   - No restart needed!

---

## Security

- **Tokens are never written to logs or config files**
- Refresh tokens stored securely in macOS Keychain
- Access tokens cached in `~/.config/claude/auth-profiles.json` (permissions: 600)
- All HTTP requests use Claude's official OAuth endpoints
- Config file is world-readable (contains no secrets)

---

## Support

**Logs:** `~/clawd/logs/claude-oauth-refresh.log`

**Issues:**
1. Run `./verify-setup.sh` to diagnose
2. Check logs for detailed error messages
3. Test manual refresh: `./refresh-token.sh`
4. Check notification settings: `cat claude-oauth-refresh-config.json | jq .notifications`

**Need help?** Open an issue with:
- Output of `./verify-setup.sh`
- Last 20 lines of logs: `tail -20 ~/clawd/logs/claude-oauth-refresh.log`
- macOS version: `sw_vers`
- Config (redacted): `cat claude-oauth-refresh-config.json | jq 'del(.notification_target)'`
