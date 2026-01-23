# Auto-Detection Flow

Visual guide to how notification settings are automatically detected and configured.

---

## Detection Flow Diagram

```
User runs: ./install.sh
           |
           v
    [Run verify-setup.sh]
           |
           v
    [Execute detect-notification-config.sh]
           |
           +-- Read ~/.clawdbot/clawdbot.json
           |         |
           |         +-- Check if file exists
           |         |        |
           |         |        +-- NO --> Try CLI detection
           |         |        |              |
           |         |        |              +-- clawdbot message telegram message search
           |         |        |              |         |
           |         |        |              |         +-- Parse chat ID from JSON
           |         |        |              |                    |
           |         |        |              |                    +-- SUCCESS --> return "telegram|123456"
           |         |        |              |                    |
           |         |        |              |                    +-- FAIL --> return error
           |         |        |
           |         |        +-- YES --> Parse JSON
           |         |                      |
           |         |                      +-- Find enabled channels
           |         |                      |
           |         |                      +-- For each channel:
           |         |                          |
           |         |                          +-- telegram: extract default_chat_id or user_id
           |         |                          +-- slack: extract user_id, prefix "user:"
           |         |                          +-- discord: extract user_id, prefix "user:"
           |         |                          +-- whatsapp: extract phone
           |         |                          +-- imessage: extract default_target
           |         |                          +-- signal: extract phone
           |         |                          |
           |         |                          +-- If target found --> return "channel|target"
           |         |
           |         +-- DETECTED
           |         |        |
           |         |        v
           |         |   SHOW: "✓ Auto-detected: telegram → 123456789"
           |         |        |
           |         |        v
           |         |   CREATE config.json:
           |         |   {
           |         |     "notification_channel": "telegram",
           |         |     "notification_target": "123456789"
           |         |   }
           |         |        |
           |         |        v
           |         |   PROCEED TO STEP [3/6] Testing...
           |         |
           |         +-- NOT DETECTED
           |                  |
           |                  v
           |             SHOW: "⚠ Could not auto-detect"
           |                  |
           |                  v
           |             CREATE config.json with placeholder:
           |             {
           |               "notification_channel": "telegram",
           |               "notification_target": "YOUR_CHAT_ID"
           |             }
           |                  |
           |                  v
           |             PROMPT: "Please configure manually..."
           |                  |
           |                  v
           |             WAIT: Press Enter...
           |                  |
           |                  v
           |             PROCEED TO STEP [3/6] Testing...
           |
           v
    Continue installation...
```

---

## Channel Priority

Detection tries channels in this order:

1. **Telegram** (most common)
   - Config: `.channels.telegram.default_chat_id` or `.channels.telegram.user_id`
   - CLI fallback: `clawdbot message telegram message search`

2. **Slack**
   - Config: `.channels.slack.user_id` → prefixed as `user:ID`

3. **Discord**
   - Config: `.channels.discord.user_id` → prefixed as `user:ID`

4. **WhatsApp**
   - Config: `.channels.whatsapp.phone`

5. **iMessage**
   - Config: `.channels.imessage.default_target`

6. **Signal**
   - Config: `.channels.signal.phone`

First enabled channel with a valid target wins.

---

## Config File Structure Expected

```json
{
  "channels": {
    "telegram": {
      "enabled": true,
      "default_chat_id": "123456789",
      "user_id": "123456789"
    },
    "slack": {
      "enabled": true,
      "user_id": "U01234ABCD"
    },
    "discord": {
      "enabled": false,
      "user_id": "123456789012345678"
    }
  }
}
```

**Note:** The exact field names may vary. The detection script tries multiple common patterns.

---

## Testing the Flow

### Preview detection:
```bash
./test-detection.sh
```

Output:
```
Testing notification auto-detection...

✓ Detection successful!

Would configure:
  notification_channel: telegram
  notification_target: 123456789

Generated config would be:
{
  "notification_channel": "telegram",
  "notification_target": "123456789"
}
```

### During installation:
```bash
./install.sh
```

Output:
```
[2/6] Setting up config...
✓ Auto-detected: telegram → 123456789
✓ Created config with auto-detected values
  → Channel: telegram
  → Target: 123456789
```

### Verify detection:
```bash
./verify-setup.sh
```

Output includes:
```
Checking Clawdbot config... ✓ Found
  → Auto-detected: telegram → 123456789
Checking config file... ✓ Found
```

---

## Manual Override

After installation, you can always override:

```bash
# Edit the generated config
nano config.json

# Change to your preferred channel
{
  "notification_channel": "slack",
  "notification_target": "user:U01234ABCD"
}
```

No need to reinstall - changes take effect on next refresh cycle (max 2 hours).

---

## Troubleshooting Detection

### Detection Failed

**Symptom:**
```
⚠ Could not auto-detect notification settings
Please configure your notification target:
  → Edit: config.json
```

**Causes:**
1. No `~/.clawdbot/clawdbot.json` file
2. No messaging channels enabled in Clawdbot
3. Config file missing target ID fields
4. `jq` not installed

**Solutions:**
```bash
# Check if config exists
ls -la ~/.clawdbot/clawdbot.json

# Check if jq is installed
which jq || brew install jq

# Test detection manually
./detect-notification-config.sh
# (should output: channel|target or nothing)

# If detection fails, configure manually
nano config.json
# See SKILL.md: "Finding Your Target ID"
```

---

## How It Helps

### Before (Manual Config)
```
Time to configure: 5-10 minutes
Steps:
  1. Open SKILL.md
  2. Find your messaging platform section
  3. Run CLI commands to get chat ID
  4. Copy chat ID
  5. Edit config.json
  6. Paste chat ID
  7. Resume installation
```

### After (Auto-Detection)
```
Time to configure: 0 seconds ⭐
Steps:
  1. Run ./install.sh
  (Done - config auto-populated!)
```

---

**Detection code:** See `detect-notification-config.sh` for implementation details.
