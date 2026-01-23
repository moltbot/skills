# Auto-Detection Examples

This document shows what the auto-detection script looks for in `~/.clawdbot/clawdbot.json`.

## Detection Logic

The script checks channels in this priority order:
1. Telegram (most common)
2. Slack
3. Discord
4. WhatsApp
5. iMessage
6. Signal

For each enabled channel, it tries to extract the target ID from the config.

---

## Telegram

**What it looks for in `~/.clawdbot/clawdbot.json`:**

```json
{
  "channels": {
    "telegram": {
      "enabled": true,
      "default_chat_id": "123456789",
      "user_id": "123456789"
    }
  }
}
```

**Detected config:**
```json
{
  "notification_channel": "telegram",
  "notification_target": "123456789"
}
```

**Fallback:** If not in config file, runs:
```bash
clawdbot message telegram message search --limit 1 --from-me true
```
Parses chat ID from output.

---

## Slack

**What it looks for:**

```json
{
  "channels": {
    "slack": {
      "enabled": true,
      "user_id": "U01234ABCD"
    }
  }
}
```

**Detected config:**
```json
{
  "notification_channel": "slack",
  "notification_target": "user:U01234ABCD"
}
```

**Note:** Automatically prefixes with `user:` for DMs.

---

## Discord

**What it looks for:**

```json
{
  "channels": {
    "discord": {
      "enabled": true,
      "user_id": "123456789012345678"
    }
  }
}
```

**Detected config:**
```json
{
  "notification_channel": "discord",
  "notification_target": "user:123456789012345678"
}
```

**Note:** Automatically prefixes with `user:` for DMs.

---

## WhatsApp

**What it looks for:**

```json
{
  "channels": {
    "whatsapp": {
      "enabled": true,
      "phone": "+15551234567"
    }
  }
}
```

**Detected config:**
```json
{
  "notification_channel": "whatsapp",
  "notification_target": "+15551234567"
}
```

---

## iMessage

**What it looks for:**

```json
{
  "channels": {
    "imessage": {
      "enabled": true,
      "default_target": "chat_id:123"
    }
  }
}
```

**Detected config:**
```json
{
  "notification_channel": "imessage",
  "notification_target": "chat_id:123"
}
```

**Note:** Also accepts phone numbers or email addresses.

---

## Signal

**What it looks for:**

```json
{
  "channels": {
    "signal": {
      "enabled": true,
      "phone": "+15551234567"
    }
  }
}
```

**Detected config:**
```json
{
  "notification_channel": "signal",
  "notification_target": "+15551234567"
}
```

---

## Manual Override

After installation, you can always edit `config.json` to use a different channel or target:

```bash
# Check what was detected
cat config.json

# Override if needed
nano config.json
```

No need to reinstall - just edit and the new settings take effect on the next refresh run.

---

## Testing Detection

To see what the script would detect:

```bash
./detect-notification-config.sh
# Output examples:
#   telegram|123456789
#   slack|user:U01234ABCD
#   discord|user:123456789012345678
#   (empty if nothing detected)
```

Then check your config:

```bash
cat config.json | jq -r '"\(.notification_channel)|\(.notification_target)"'
```

They should match!
