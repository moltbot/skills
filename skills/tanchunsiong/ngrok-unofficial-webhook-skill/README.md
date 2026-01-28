# Ngrok Unofficial Webhook Skill

Start a public webhook endpoint via ngrok to receive incoming webhooks from any service. Auto-discovers installed skills that can handle specific webhook events and routes them accordingly.

> **Unofficial** — This skill is not affiliated with or endorsed by ngrok.

## Features

- **Public webhook URL** — Instant ngrok tunnel with optional static domain
- **Skill auto-discovery** — Scans sibling skill folders for `skill.json` with `webhookEvents`
- **Auto-forwarding** — Routes matching events to skills with `forwardPort` (e.g. RTMS service)
- **Auto-execution** — Runs shell commands for matching events via `webhookCommands` config
- **User notifications** — Sends WhatsApp/Telegram notifications with event details and skill options
- **Health check** — Built-in `/health` endpoint

## Quick Start

### 1. Install dependencies

```bash
cd skills/ngrok-unofficial-webhook-skill
npm install
```

### 2. Configure

Copy `.env.example` to `.env` and fill in:

```env
NGROK_AUTHTOKEN=your_ngrok_auth_token
NGROK_DOMAIN=your-static-domain.ngrok-free.app
CLAWDBOT_NOTIFY_TARGET=+1234567890
```

Get your auth token from https://dashboard.ngrok.com

### 3. Start

```bash
node scripts/webhook-server.js
```

The server prints its public URL:
```
NGROK_URL=https://your-domain.ngrok-free.app
Webhook endpoint: https://your-domain.ngrok-free.app/webhook
```

## How It Works

### Webhook arrives → Auto-routing

1. Server responds **200 OK** immediately
2. Discovers installed skills that declare `webhookEvents` in their `skill.json`
3. Routes the event:
   - **`forwardPort`** — HTTP POST to a local service (e.g. RTMS assistant on port 4048)
   - **`webhookCommands`** — Runs a shell command with the meeting ID extracted from the payload
   - **Neither** — Notifies user with payload and skill options to choose from

### Skill Discovery

Skills opt into webhook handling by declaring events in their `skill.json`:

```json
{
  "clawdbot": {
    "webhookEvents": ["meeting.rtms_started", "meeting.rtms_stopped"],
    "forwardPort": 4048,
    "forwardPath": "/"
  }
}
```

For command-based handling (no running service needed):

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

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `NGROK_AUTHTOKEN` | ✅ | — | ngrok auth token |
| `NGROK_DOMAIN` | — | random | Static ngrok domain for consistent URLs |
| `WEBHOOK_PORT` | — | `4040` | Local server port |
| `WEBHOOK_PATH` | — | `/webhook` | Webhook endpoint path |
| `CLAWDBOT_BIN` | — | `clawdbot` | Path to Clawdbot binary |
| `CLAWDBOT_NOTIFY_CHANNEL` | — | `whatsapp` | Notification channel |
| `CLAWDBOT_NOTIFY_TARGET` | — | — | Phone number / target for notifications |

## API Endpoints

```bash
# Health check
curl http://localhost:4040/health

# Webhooks are received at
POST http://localhost:4040/webhook
```

## Integration with Zoom

Typical flow with Zoom RTMS:
1. Start this webhook listener → get ngrok URL
2. Set the ngrok URL as your Zoom Marketplace app's webhook endpoint
3. Zoom sends `meeting.rtms_started` → auto-forwarded to RTMS Meeting Assistant
4. Zoom sends `meeting.rtms_stopped` → auto-forwarded, triggers cleanup

## Related Skills

- **[zoom-unofficial-community-skill](https://github.com/tanchunsiong/zoom-unofficial-community-skill)** — Zoom REST API CLI for meetings, recordings, and more
- **[zoom-meeting-assistance-rtms-unofficial-community](https://github.com/tanchunsiong/zoom-meeting-assistance-with-rtms-unofficial-community-skill)** — RTMS meeting capture and AI analysis

## Bug Reports & Contributing

Found a bug? Please raise an issue at:
👉 https://github.com/tanchunsiong/ngrok-unofficial-webhook-skill/issues

Pull requests are also welcome!

## License

MIT
