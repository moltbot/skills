---
name: ngrok-unofficial-webhook-skill
description: Start an ngrok tunnel to receive incoming webhooks and process them via the LLM. Use when the user asks to listen for webhooks, set up a webhook endpoint, start ngrok, or when another skill (like Zoom RTMS Meeting Assistant) needs a public webhook URL. Receives webhook payloads and lets the LLM decide how to handle them.
---

# Ngrok Webhook Listener

Start a public webhook endpoint via ngrok. Incoming webhooks are auto-routed to matching skills or presented to the user for manual handling.

## Prerequisites

```bash
cd skills/ngrok-unofficial-webhook-skill
npm install
```

## Environment Variables

Set in the skill's `.env` file (copy from `.env.example`).

**Required:**
- `NGROK_AUTHTOKEN` — ngrok auth token from https://dashboard.ngrok.com

**Optional:**
- `NGROK_DOMAIN` — stable ngrok domain for consistent URLs
- `WEBHOOK_PORT` — local port (default: `4040`)
- `WEBHOOK_PATH` — webhook path (default: `/webhook`)
- `CLAWDBOT_BIN` — path to clawdbot binary (default: `clawdbot`)
- `CLAWDBOT_NOTIFY_CHANNEL` — notification channel (default: `whatsapp`)
- `CLAWDBOT_NOTIFY_TARGET` — phone number / target for notifications

## Usage

### Start the webhook listener

Run as a **background process**:

```bash
cd skills/ngrok-unofficial-webhook-skill
node scripts/webhook-server.js
```

The server prints its public URL to stderr:
```
NGROK_URL=https://xxxx.ngrok-free.app
Webhook endpoint: https://xxxx.ngrok-free.app/webhook
```

For long-running use, launch with `nohup`:
```bash
nohup node scripts/webhook-server.js >> /tmp/ngrok-webhook.log 2>&1 &
```

### What happens when a webhook arrives

1. The server immediately responds **200 OK** to the sender
2. It discovers installed skills that declare `webhookEvents` in their `skill.json`
3. **Auto-routing** (no user intervention needed):
   - If a matching skill has `forwardPort` → HTTP POST to the local service
   - If a matching skill has `webhookCommands` → runs the configured shell command
4. **Manual routing** (user decides):
   - If no auto-route is available, sends a WhatsApp notification with the payload and a numbered list of matching skills
   - User replies with their choice

### Skill discovery

Skills opt into webhook handling by adding `webhookEvents` to their `skill.json`:

```json
{
  "clawdbot": {
    "webhookEvents": ["meeting.rtms_started", "meeting.rtms_stopped"],
    "forwardPort": 4048,
    "forwardPath": "/"
  }
}
```

For command-based auto-handling (no running service required):

```json
{
  "clawdbot": {
    "webhookEvents": ["recording.completed"],
    "webhookCommands": {
      "recording.completed": {
        "command": "python3 scripts/download.py {{meeting_id}}",
        "description": "Download cloud recording",
        "meetingIdPath": "payload.object.id"
      }
    }
  }
}
```

- `command` — shell command to run; `{{meeting_id}}` is replaced with the extracted value
- `meetingIdPath` — dot-separated path to extract the meeting ID from the webhook payload
- `description` — human-readable description for notifications

The ngrok skill scans all sibling skill folders for `skill.json` files with these fields.

### Stdout output

The server also writes each webhook as a JSON line to **stdout** for process polling:

```json
{
  "id": "uuid",
  "timestamp": "ISO-8601",
  "method": "POST",
  "path": "/webhook",
  "query": {},
  "body": {}
}
```

### Health check

```bash
curl http://localhost:4040/health
```

### Stop the listener

Kill the background process when done.

## Integration with Zoom

Typical flow:
1. Start this webhook listener → get ngrok URL
2. Configure the ngrok URL in your Zoom Marketplace app's webhook settings
3. When RTMS starts, Zoom sends `meeting.rtms_started` → auto-forwarded to the RTMS Meeting Assistant
4. When RTMS stops, Zoom sends `meeting.rtms_stopped` → auto-forwarded, triggers cleanup
