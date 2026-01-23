# Upgrade Guide

## What's New

This update brings significant improvements to notification handling and user experience:

### 🎉 Major Features

1. **Three Notification Types** - Fine-grained control:
   - 🔄 Start: "Refreshing Claude token..."
   - ✅ Success: "Claude token refreshed!"
   - ❌ Failure: Detailed error with troubleshooting

2. **Interactive Installation** - Prompts during setup:
   - Configure which notification types you want
   - Smart recommendations
   - Easy to change later

3. **Clawdbot Control** - Voice/text commands to manage settings:
   - "disable Claude refresh start notifications"
   - "show Claude refresh notification settings"
   - "enable all Claude refresh notifications"

4. **Detailed Failure Messages** - Context-specific troubleshooting:
   - Network errors → connection troubleshooting
   - Invalid token → re-authentication steps
   - Keychain issues → permission fixes

5. **One-Time Installer** - Clearer workflow:
   - Install ONCE to set up recurring job
   - Config changes apply automatically
   - Only re-run to reinstall/fix

6. **Config File Renamed**:
   - Old: `config.json`
   - New: `claude-oauth-refresh-config.json`
   - More descriptive and avoids conflicts

---

## Upgrading from Previous Version

### Automatic Migration (Recommended)

Simply re-run the installer:

```bash
cd ~/clawd/skills/claude-oauth-refresher
./install.sh
```

The installer will:
1. ✅ Detect your old `config.json`
2. ✅ Migrate to new `claude-oauth-refresh-config.json` format
3. ✅ Add new notification type structure
4. ✅ Preserve your existing settings
5. ✅ Prompt for notification preferences
6. ✅ Update the launchd job
7. ✅ Clean up old config file

### Manual Migration

If you prefer manual control:

1. **Backup your current config:**
   ```bash
   cp config.json config.json.backup
   ```

2. **Create new config with your settings:**
   ```bash
   cat > claude-oauth-refresh-config.json << 'EOF'
   {
     "refresh_buffer_minutes": 30,
     "log_file": "~/clawd/logs/claude-oauth-refresh.log",
     "notifications": {
       "on_start": false,
       "on_success": false,
       "on_failure": true
     },
     "notification_channel": "telegram",
     "notification_target": "YOUR_CHAT_ID_HERE"
   }
   EOF
   ```

3. **Copy your old notification_target:**
   ```bash
   # Extract from old config
   OLD_TARGET=$(jq -r '.notification_target' config.json)
   
   # Update new config
   jq --arg target "$OLD_TARGET" '.notification_target = $target' \
     claude-oauth-refresh-config.json > tmp.json && \
     mv tmp.json claude-oauth-refresh-config.json
   ```

4. **Remove old config:**
   ```bash
   rm config.json config.json.backup
   ```

5. **Test the new config:**
   ```bash
   ./refresh-token.sh
   ```

---

## What Changed

### Config Structure

**Before (config.json):**
```json
{
  "refresh_buffer_minutes": 30,
  "log_file": "~/clawd/logs/claude-oauth-refresh.log",
  "notify_on_success": false,
  "notify_on_failure": true,
  "notification_channel": "telegram",
  "notification_target": "123456789"
}
```

**After (claude-oauth-refresh-config.json):**
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
  "notification_target": "123456789"
}
```

### Script Updates

**refresh-token.sh:**
- ✅ Reads new config filename
- ✅ Supports three notification types
- ✅ Enhanced error messages with troubleshooting
- ✅ Detailed failure notifications
- ✅ Better HTTP error handling
- ✅ Network timeout detection

**install.sh:**
- ✅ Interactive notification prompts
- ✅ Migrates old config automatically
- ✅ Shows notification preferences summary
- ✅ Explains one-time installation model
- ✅ Better user guidance

**verify-setup.sh:**
- ✅ Checks for both old and new config filenames
- ✅ Suggests migration if old config found

**uninstall.sh:**
- ✅ Removes both old and new config files

---

## Breaking Changes

### Config File Location

The config file is now named `claude-oauth-refresh-config.json` instead of `config.json`.

**Impact:** Minimal - installer handles migration automatically.

**Action Required:** 
- If you run installer: None (automatic)
- If you skip installer: Rename manually and update structure

### Notification Fields

The `notify_on_success` and `notify_on_failure` fields are replaced with:
```json
"notifications": {
  "on_start": true,
  "on_success": true,
  "on_failure": true
}
```

**Impact:** Old configs won't work with new scripts.

**Action Required:**
- Run installer for automatic migration
- Or manually update config structure

---

## New Features You'll Love

### 1. Disable Noisy Notifications

After verifying the setup works:

```bash
# Option 1: Ask Clawdbot
"disable Claude refresh start notifications"
"disable Claude refresh success notifications"

# Option 2: Edit config
nano claude-oauth-refresh-config.json
# Set on_start and on_success to false
```

**Recommended:** Keep only `on_failure: true` for production.

### 2. Detailed Troubleshooting

Failure notifications now include:
- Specific error message
- Detailed context
- Targeted troubleshooting steps
- Log file location
- Help resources

**Example:**
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

### 3. Config Changes Apply Automatically

No more reinstalling! Just edit the config file and changes apply on the next refresh.

```bash
# Edit anytime
nano claude-oauth-refresh-config.json

# Test immediately (optional)
./refresh-token.sh

# Or wait for next scheduled refresh (every 2 hours)
```

---

## FAQ

**Q: Do I need to uninstall first?**

A: No! Just run `./install.sh` and it will handle everything.

---

**Q: Will I lose my notification settings?**

A: No. The installer migrates your existing `notification_target` and `notification_channel`.

---

**Q: What if I already have claude-oauth-refresh-config.json?**

A: The installer will ask if you want to reconfigure or keep your existing settings.

---

**Q: Can I disable all notifications?**

A: Yes, set all three notification types to `false` in the config. But we recommend keeping `on_failure: true` so you know about issues.

---

**Q: Do I need to restart anything after changing config?**

A: No! The refresh script reads the config file each time it runs. Changes apply automatically.

---

**Q: I want the old behavior (only notify on failure)**

A: Edit your config:
```json
"notifications": {
  "on_start": false,
  "on_success": false,
  "on_failure": true
}
```

---

## Rollback (If Needed)

If you encounter issues and need to roll back:

1. **Uninstall current version:**
   ```bash
   ./uninstall.sh
   ```

2. **Restore old config:**
   ```bash
   mv claude-oauth-refresh-config.json.backup config.json
   # (if you made a backup)
   ```

3. **Reinstall old version:**
   ```bash
   git checkout <previous-commit>
   ./install.sh
   ```

**But first:** Please report issues so we can fix them!

---

## Support

**Issues?** Check:
1. Run `./verify-setup.sh`
2. Check logs: `tail -20 ~/clawd/logs/claude-oauth-refresh.log`
3. Test manually: `./refresh-token.sh`
4. Check config: `cat claude-oauth-refresh-config.json | jq`

**Still stuck?** Open an issue with:
- Output of `./verify-setup.sh`
- Relevant log excerpts
- Config file (redact notification_target)

---

## Summary

✅ **Run installer to upgrade** - handles everything automatically
✅ **Config migrated** - preserves your settings
✅ **New notification types** - finer control
✅ **Better error messages** - easier troubleshooting
✅ **Clawdbot integration** - voice/text control
✅ **No breaking workflow** - still runs every 2 hours

**Recommended next steps:**
1. Run `./install.sh`
2. Choose notification preferences
3. Disable start/success notifications after verifying it works
4. Enjoy hands-free token management!
