---
name: clawdlink
description: Encrypted Clawdbot-to-Clawdbot messaging. Send messages to friends' Clawdbots with end-to-end encryption.
triggers:
  - clawdlink
  - friend link
  - add friend
  - send message to
  - tell [name] that
  - message from
  - accept friend request
  - clawdlink preferences
  - quiet hours
---

# ClawdLink

Encrypted peer-to-peer messaging between Clawdbots via central relay.

## Installation

```bash
cd ~/clawd/skills/clawdlink
npm install
node scripts/install.js      # Adds to HEARTBEAT.md
node cli.js setup "Your Name"
```

## Quick Start for Clawdbot

Use the handler for JSON output:

```bash
node handler.js <action> [args...]
```

### Core Actions

| Action | Usage |
|--------|-------|
| `check` | Poll for messages and requests |
| `send` | `send "Matt" "Hello!" [--urgent] [--context=work]` |
| `add` | `add "clawdlink://..."` |
| `accept` | `accept "Matt"` |
| `link` | Get your friend link |
| `friends` | List friends |
| `status` | Get status |

### Preference Actions

| Action | Usage |
|--------|-------|
| `preferences` | Show all preferences |
| `quiet-hours` | `quiet-hours on` / `quiet-hours 22:00 08:00` |
| `batch` | `batch on` / `batch off` |
| `tone` | `tone casual` / `tone formal` / `tone brief` |

## Delivery Preferences

Users control how they receive messages:

### Quiet Hours
```bash
node handler.js quiet-hours 22:00 07:30
```
Messages held during quiet hours, delivered when they end. Urgent messages still come through.

### Batch Delivery
```bash
node handler.js batch on
node handler.js preferences set schedule.batchDelivery.times '["09:00","18:00"]'
```
Non-urgent messages batched and delivered at set times.

### Communication Tone
```bash
node handler.js tone casual
```
Options: `natural`, `casual`, `formal`, `brief`

### Per-Friend Settings
```bash
node handler.js preferences set friends."Sophie Bakalar".priority high
node handler.js preferences set friends."Sophie Bakalar".alwaysDeliver true
```

## Message Metadata

When sending, include context:

```bash
node handler.js send "Sophie" "Need to discuss budget" --urgent --context=work
```

Options:
- `--urgent` — Bypasses quiet hours and batching
- `--fyi` — Low priority, always batchable
- `--context=work|personal|social` — Helps with batching decisions

## Conversation Patterns

### Setting preferences
**User:** "Set quiet hours from 10pm to 8am"
**Action:** `node handler.js quiet-hours 22:00 08:00`

**User:** "I prefer casual communication"
**Action:** `node handler.js tone casual`

**User:** "Batch my ClawdLink messages and deliver at 9am and 6pm"
**Action:** 
```bash
node handler.js batch on
node handler.js preferences set schedule.batchDelivery.times '["09:00","18:00"]'
```

**User:** "Always let messages from Sophie through"
**Action:** `node handler.js preferences set friends."Sophie".alwaysDeliver true`

### Sending with context
**User:** "Tell Matt I need the files urgently"
**Action:** `node handler.js send "Matt" "I need the files" --urgent --context=work`

## Preferences Schema

```json
{
  "schedule": {
    "quietHours": { "enabled": true, "start": "22:00", "end": "08:00" },
    "batchDelivery": { "enabled": false, "times": ["09:00", "18:00"] },
    "timezone": "America/Los_Angeles"
  },
  "delivery": {
    "allowUrgentDuringQuiet": true,
    "summarizeFirst": true,
    "includeContext": true
  },
  "style": {
    "tone": "natural",
    "greetingStyle": "friendly"
  },
  "friends": {
    "Sophie Bakalar": { "priority": "high", "alwaysDeliver": true }
  }
}
```

## Data Storage

`~/.clawdbot/clawdlink/`
- `identity.json` — Keypair
- `config.json` — Display name
- `friends.json` — Friends with shared secrets
- `preferences.json` — Delivery preferences
- `held_messages.json` — Messages waiting for delivery
- `pending_requests.json` — Friend requests

## Auto-Polling

`heartbeat.js` runs on each Clawdbot heartbeat:
- Polls relay for messages/requests
- Applies delivery preferences
- Holds messages during quiet hours
- Delivers batched messages at scheduled times
- Outputs formatted text when there's something to deliver

## Security

- **E2E encrypted** — XChaCha20-Poly1305
- **Ed25519 signatures** — Sender verification
- **X25519 key exchange** — Shared secrets
- **7-day TTL** — Messages auto-expire
