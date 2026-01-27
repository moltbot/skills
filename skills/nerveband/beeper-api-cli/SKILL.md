---
name: beeper-api-cli
description: Read and send messages via Beeper CLI. Supports WhatsApp, Telegram, Signal, Instagram, Twitter/X, LinkedIn, Facebook Messenger and more.
metadata: {"clawdbot":{"emoji":"💬","os":["darwin","linux"]}}
---

# beeper-api-cli

LLM-friendly wrapper around the Beeper CLI for reading and sending messages across all connected chat networks.

## ⚠️ CRITICAL: Message Sending Policy

**🚨 NEVER SEND ANY MESSAGE WITHOUT EXPLICIT USER APPROVAL 🚨**

**MANDATORY PROTOCOL FOR ALL MESSAGING:**
1. **ALWAYS show the complete message draft first** - display full content
2. **WAIT for explicit verbal approval** - "send it", "looks good", "go ahead", etc.
3. **NEVER assume permission to send** - even if user says "draft a message"
4. **Apply to ALL platforms**: WhatsApp, Telegram, Signal, Instagram, Twitter, Facebook, LinkedIn, etc.
5. **NO EXCEPTIONS EVER** - This applies to new messages, replies, and forwards

This rule is NON-NEGOTIABLE and applies to ALL beeper send commands.

## Quick Start

### Step 1: Get Your Token from Beeper Desktop
```
1. Open Beeper Desktop
2. Settings → Advanced → API
3. Enable API access
4. Copy the Bearer token
```

### Step 2: Set Environment Variables
```bash
# REQUIRED: Set your token
export BEEPER_TOKEN="paste-your-token-here"

# OPTIONAL: Override default localhost URL
export BEEPER_API_URL="http://[::1]:23373"  # Default
```

### Step 3: Use the CLI
```bash
# Use the skill wrapper (recommended)
~/clawd/skills/beeper-api-cli/beeper.sh chats list --output json

# Or use the binary directly
/Users/ashrafali/clawd/beeper-api-cli/beeper chats list --output json
```

**⚠️ Important:** Without setting `BEEPER_TOKEN`, all commands will fail with "Unauthorized" errors.

## Prerequisites

### 1. Beeper Desktop Must Be Running
The CLI connects to Beeper Desktop's local API server.

### 2. Enable API Access in Beeper Desktop
**⚠️ REQUIRED: You must configure the API token in Beeper Desktop first!**

1. Open **Beeper Desktop**
2. Go to **Settings → Advanced → API**
3. **Enable API access**
4. **Generate and copy the Bearer token**
5. (Optional) Configure allowed IP addresses
   - Default: Only `localhost` (127.0.0.1 / ::1) is allowed
   - If running CLI from remote machine, add its IP address in Beeper settings

### 3. Set Environment Variables
You must set the token before the CLI will work:

```bash
# REQUIRED: Set your token from Beeper Desktop
export BEEPER_TOKEN="your-token-from-beeper-settings"

# OPTIONAL: Override API URL (default: http://[::1]:23373)
export BEEPER_API_URL="http://[::1]:23373"
```

**Where to get the token:**
- Beeper Desktop → Settings → Advanced → API → Copy Bearer Token

**Important:**
- ❌ The CLI will **NOT work** without setting `BEEPER_TOKEN`
- ⚠️ Default API URL is `localhost` (`http://[::1]:23373`)
- 🔒 If accessing from another machine, you must:
  1. Add that machine's IP in Beeper Desktop API settings
  2. Update `BEEPER_API_URL` to use the correct host IP

## Commands

### List All Chats

```bash
# JSON output (LLM-friendly)
~/clawd/skills/beeper-api-cli/beeper.sh chats list --output json

# Human-readable text
~/clawd/skills/beeper-api-cli/beeper.sh chats list --output text

# Markdown format
~/clawd/skills/beeper-api-cli/beeper.sh chats list --output markdown
```

**Example JSON output:**
```json
[
  {
    "id": "!wcn4YMCOtKUEtxYXYAq1:beeper.local",
    "title": "beeper-api-cli - Lion Bot",
    "type": "group",
    "network": "Telegram",
    "unreadCount": 15
  }
]
```

### Get Specific Chat

```bash
~/clawd/skills/beeper-api-cli/beeper.sh chats get <chat-id> --output json
```

### List Messages from Chat

```bash
# Get last 50 messages (default)
~/clawd/skills/beeper-api-cli/beeper.sh messages list --chat-id <chat-id>

# Get specific number of messages
~/clawd/skills/beeper-api-cli/beeper.sh messages list --chat-id <chat-id> --limit 20 --output json
```

**Example JSON output:**
```json
[
  {
    "id": "42113",
    "chatID": "!wcn4YMCOtKUEtxYXYAq1:beeper.local",
    "senderName": "ClawdBot",
    "text": "Hello world!",
    "timestamp": "2026-01-19T22:17:38.000Z",
    "isSender": true
  }
]
```

### Send a Message

```bash
# ⚠️ REQUIRES USER APPROVAL FIRST - see Message Sending Policy above
~/clawd/skills/beeper-api-cli/beeper.sh send --chat-id <chat-id> --message "Your message here"
```

**Example output:**
```json
{
  "success": true,
  "message_id": "msg_123",
  "chat_id": "!wcn4YMCOtKUEtxYXYAq1:beeper.local"
}
```

### Search Messages

```bash
# Search across all chats
~/clawd/skills/beeper-api-cli/beeper.sh search --query "keyword" --limit 10 --output json
```

### Auto-Discover API URL

```bash
~/clawd/skills/beeper-api-cli/beeper.sh discover
```

## LLM Workflows

### Find Chat and Send Message

```bash
# 1. List chats to find the right one
CHATS=$(~/clawd/skills/beeper-api-cli/beeper.sh chats list --output json)

# 2. Extract chat ID (using jq)
CHAT_ID=$(echo "$CHATS" | jq -r '.[] | select(.title | contains("Project")) | .id')

# 3. Send message
~/clawd/skills/beeper-api-cli/beeper.sh send --chat-id "$CHAT_ID" --message "Update ready!"
```

### Get Conversation Context

```bash
# Get recent messages for context
~/clawd/skills/beeper-api-cli/beeper.sh messages list --chat-id <chat-id> --limit 20 --output json | jq
```

### Monitor Unread Messages

```bash
# Get all chats with unread count
~/clawd/skills/beeper-api-cli/beeper.sh chats list --output json | jq '.[] | select(.unreadCount > 0) | {title, network, unread: .unreadCount}'
```

## Output Formats

### JSON (Default - LLM-Optimized)
- Structured data ready for parsing
- Perfect for programmatic use
- Pipe to `jq` for filtering

### Text (Human-Readable)
```
ID: !wcn4YMCOtKUEtxYXYAq1:beeper.local
Title: beeper-api-cli - Lion Bot
Type: group
Network: Telegram
Unread: 15
```

### Markdown (Documentation)
```markdown
## beeper-api-cli - Lion Bot

- **ID**: !wcn4YMCOtKUEtxYXYAq1:beeper.local
- **Type**: group
- **Network**: Telegram
- **Unread**: 15
```

## Chat ID Formats

Different networks use different ID formats:

- **Telegram**: `!wcn4YMCOtKUEtxYXYAq1:beeper.local`
- **WhatsApp**: Phone number format (e.g., `15551234567@s.whatsapp.net`)
- **Signal**: Phone number (e.g., `+15551234567`)
- **Instagram/Twitter**: Platform-specific IDs

Use `chats list` to discover the exact format for your chats.

## Environment Variables

### Required Configuration

**You MUST set these environment variables before using the CLI:**

#### BEEPER_TOKEN (Required)
```bash
export BEEPER_TOKEN="your-bearer-token-from-beeper-desktop"
```

**How to get your token:**
1. Open Beeper Desktop
2. Settings → Advanced → API
3. Enable API access
4. **Copy the Bearer token** shown in the settings
5. Set it as an environment variable

**Without this token, the CLI will return "Unauthorized" errors.**

#### BEEPER_API_URL (Optional)
```bash
export BEEPER_API_URL="http://[::1]:23373"  # Default value
```

**Default behavior:**
- Uses `http://[::1]:23373` (localhost on IPv6)
- This works when running CLI on the same machine as Beeper Desktop

**When to change:**
- Running CLI from a **remote machine**
- Beeper Desktop is on a different host
- Using a custom port

**If running remotely:**
1. Find the IP address of the machine running Beeper Desktop
2. In Beeper Desktop → Settings → Advanced → API → Add the remote machine's IP to allowed list
3. Set `BEEPER_API_URL` to: `http://<beeper-host-ip>:23373`

Example for remote access:
```bash
export BEEPER_API_URL="http://192.168.1.100:23373"
export BEEPER_TOKEN="your-token-here"
```

### Skill Wrapper Behavior

The skill wrapper (`beeper.sh`) will:
- ✅ Use `$BEEPER_TOKEN` from environment (you must set this!)
- ✅ Default `$BEEPER_API_URL` to `http://[::1]:23373` if not set
- ❌ **Fail with error** if `BEEPER_TOKEN` is not set

## Troubleshooting

### "Connection refused"
```bash
# Check if Beeper Desktop is running
ps aux | grep -i beeper

# Start Beeper Desktop
open -a "Beeper Desktop"  # macOS
```

### "Unauthorized" or "Invalid or missing token"

**This means you haven't set BEEPER_TOKEN or it's invalid.**

**Fix:**
```bash
# 1. Check if token is set
echo $BEEPER_TOKEN

# If empty or wrong, get a new token from Beeper Desktop:
# - Open Beeper Desktop
# - Settings → Advanced → API
# - Enable API if not already enabled
# - Copy the Bearer token shown
# - Set it in your environment:

export BEEPER_TOKEN="paste-the-token-here"

# Test it works:
~/clawd/skills/beeper-api-cli/beeper.sh chats list
```

**Important Notes:**
- The token is generated in **Beeper Desktop settings**, not in this CLI
- You **must copy it exactly** from Settings → Advanced → API
- Without a valid token, **no commands will work**
- Tokens don't expire unless you regenerate them in Beeper settings

### "Chat not found"
```bash
# List all chats to find correct ID
~/clawd/skills/beeper-api-cli/beeper.sh chats list --output text | grep -i "search-term"
```

### Remote Access (CLI on different machine than Beeper Desktop)

**If you want to run the CLI from a different computer:**

**1. Configure Beeper Desktop to allow remote access:**
```
- Open Beeper Desktop (on the machine running Beeper)
- Settings → Advanced → API
- Find the "Allowed IP Addresses" section
- Add the IP address of the machine running the CLI
- Example: 192.168.1.50
```

**2. Set BEEPER_API_URL to point to the remote machine:**
```bash
# On the machine running the CLI:
export BEEPER_API_URL="http://<beeper-desktop-ip>:23373"
export BEEPER_TOKEN="your-token"

# Example:
export BEEPER_API_URL="http://192.168.1.100:23373"
```

**Default behavior (localhost only):**
- Default URL: `http://[::1]:23373` (IPv6 localhost)
- Only works when CLI is on **same machine** as Beeper Desktop
- **No remote access** unless you configure allowed IPs in Beeper settings

## Examples

### Example 1: Check Unread Messages
```bash
#!/bin/bash
BEEPER="$HOME/clawd/skills/beeper-api-cli/beeper.sh"

# Get chats with unread messages
$BEEPER chats list --output json | \
  jq -r '.[] | select(.unreadCount > 0) | "\(.title) (\(.network)): \(.unreadCount) unread"'
```

### Example 2: Read Recent Messages
```bash
#!/bin/bash
BEEPER="$HOME/clawd/skills/beeper-api-cli/beeper.sh"
CHAT_ID="!wcn4YMCOtKUEtxYXYAq1:beeper.local"

# Get last 10 messages in readable format
$BEEPER messages list --chat-id "$CHAT_ID" --limit 10 --output text
```

### Example 3: Search and Respond
```bash
#!/bin/bash
BEEPER="$HOME/clawd/skills/beeper-api-cli/beeper.sh"

# Search for mentions
RESULTS=$($BEEPER search --query "@clawdbot" --limit 5 --output json)

# Process results and respond (LLM integration point)
echo "$RESULTS" | jq
```

## Integration with Clawdbot

When using from Clawdbot tools, the environment variables are already configured:

```bash
# Direct usage from exec tool
~/clawd/skills/beeper-api-cli/beeper.sh chats list --output json
```

The skill wrapper handles:
- ✅ Auto-configuration of `BEEPER_API_URL` and `BEEPER_TOKEN`
- ✅ Error checking for required environment variables
- ✅ Clean passthrough of all CLI arguments

## Binary Location

- **Skill wrapper**: `~/clawd/skills/beeper-api-cli/beeper.sh`
- **Beeper CLI binary**: `/Users/ashrafali/clawd/beeper-api-cli/beeper`
- **Source code**: https://github.com/nerveband/beeper-api-cli

## Features

✅ Read-only and write operations (unlike other tools)  
✅ LLM-optimized JSON output  
✅ Human-readable text and markdown formats  
✅ Auto-discovery of Beeper Desktop API  
✅ Cross-platform binaries (macOS, Linux, Windows)  
✅ Environment variable configuration  
✅ Comprehensive error messages  
✅ Unix pipeline friendly  

## Notes

- The skill requires Beeper Desktop to be running
- API access must be enabled in Beeper Desktop settings
- Token is stored in Clawdbot config (already configured)
- All networks connected to Beeper are accessible (WhatsApp, Telegram, Signal, etc.)
- Use JSON output for LLM processing, text for human reading

## Version

Latest (dev build from source)
