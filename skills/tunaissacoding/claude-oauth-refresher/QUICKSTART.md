# Quickstart Guide

Get up and running in under 2 minutes.

---

## 1. Test Auto-Detection (Optional)

See what notification settings will be auto-detected:

```bash
./test-detection.sh
```

**Example output:**
```
✓ Detection successful!

Would configure:
  notification_channel: telegram
  notification_target: 123456789
```

---

## 2. Verify System

Check that all requirements are met:

```bash
./verify-setup.sh
```

**Should show:**
- ✓ macOS version
- ✓ Claude CLI installed
- ✓ Keychain credentials
- ✓ Clawdbot running
- ✓ Auto-detected: telegram → 123456789

---

## 3. Install

One command to set everything up:

```bash
./install.sh
```

**What it does:**
1. Runs verification
2. **Auto-detects** your notification settings
3. **Interactively configures** notification types (start/success/failure)
4. Creates claude-oauth-refresh-config.json with your preferences
5. Tests token refresh immediately
6. Sets up launchd (runs every 2 hours)
7. Starts the service

**Expected output:**
```
[1/6] Running verification...
[2/6] Setting up config...
  ✓ Auto-detected: telegram → 123456789
  ✓ Created config with auto-detected values
[3/6] Testing token refresh...
  ✓ Refresh successful
[4/6] Creating launchd service...
  ✓ Created plist
[5/6] Installing launchd service...
  ✓ Loaded service
[6/6] Verifying installation...
  ✓ Service is running

✓ Installation complete!
```

---

## 4. Monitor (Optional)

Watch the logs to see refreshes happen:

```bash
tail -f ~/clawd/logs/claude-oauth-refresh.log
```

**You should see:**
```
[2026-01-23 10:05:30] Starting token refresh check...
[2026-01-23 10:05:31] Token expires in 720 minutes
[2026-01-23 10:05:31] Token still valid, no refresh needed (buffer: 30 min)
```

---

## Done! 🎉

Your Claude CLI will now:
- Automatically refresh tokens before they expire
- Notify you if anything goes wrong
- Log all activity to `~/clawd/logs/`

---

## Customization

### Change Notification Settings

Edit `claude-oauth-refresh-config.json`:

```bash
nano claude-oauth-refresh-config.json
```

Change notification types, channel, or target as needed. Changes apply automatically!

### Test Manual Refresh

Run the refresh script directly:

```bash
./refresh-token.sh
```

### Check Service Status

```bash
launchctl list | grep claude-oauth-refresher
```

---

## Troubleshooting

**Problem:** Auto-detection didn't find my channel

**Solution:** Edit `claude-oauth-refresh-config.json` manually and set your preferred channel. See SKILL.md section "Finding Your Target ID" for examples.

---

**Problem:** Service not running after install

**Solution:**
```bash
# Load manually
launchctl load ~/Library/LaunchAgents/com.clawdbot.claude-oauth-refresher.plist

# Check status
launchctl list | grep claude-oauth-refresher
```

---

**Problem:** Want to change notification settings

**Solution:** Just edit the config - no reinstall needed:
```bash
nano claude-oauth-refresh-config.json
# Change notifications, channel, or target
# Changes apply automatically on next refresh
```

Or ask Clawdbot:
```
"disable Claude refresh start notifications"
"enable all Claude refresh notifications"
```

---

## Uninstall

```bash
./uninstall.sh
```

Removes the service but keeps your scripts and config.

---

**Need more details?** See [SKILL.md](SKILL.md) for complete documentation.
