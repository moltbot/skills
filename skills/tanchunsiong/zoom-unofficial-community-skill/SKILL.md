---
name: zoom-unofficial-community-skill
description: Zoom API integration for meetings, calendar, chat, and user management. Use when the user asks to schedule meetings, check Zoom calendar, list recordings, send Zoom chat messages, manage contacts, or interact with any Zoom Workplace feature. Supports Server-to-Server OAuth and OAuth apps.
---

# Zoom

Use `scripts/zoom.py` to interact with Zoom's REST API.

## Prerequisites

```bash
pip3 install requests PyJWT --break-system-packages
```

## Authentication

Set these in `.env`:

- `ZOOM_ACCOUNT_ID` — Account ID (from Zoom Marketplace app)
- `ZOOM_CLIENT_ID` — OAuth Client ID
- `ZOOM_CLIENT_SECRET` — OAuth Client Secret
- `ZOOM_USER_EMAIL` — Email of the Zoom user to act as (required for S2S apps; defaults to `me` if unset)

Create a **Server-to-Server OAuth** app at https://marketplace.zoom.us/ for full API access.
See [references/AUTH.md](references/AUTH.md) for detailed setup guide.

## Commands

### Meetings

```bash
# List upcoming meetings
python3 scripts/zoom.py meetings list

# Get meeting details
python3 scripts/zoom.py meetings get <meeting_id>

# Schedule a new meeting
python3 scripts/zoom.py meetings create --topic "Standup" --start "2026-01-28T10:00:00" --duration 30

# Schedule with options
python3 scripts/zoom.py meetings create --topic "Review" --start "2026-01-28T14:00:00" --duration 60 --agenda "Sprint review" --password "abc123"

# Delete a meeting
python3 scripts/zoom.py meetings delete <meeting_id>

# Update a meeting
python3 scripts/zoom.py meetings update <meeting_id> --topic "New Title" --start "2026-01-29T10:00:00"
```

### Calendar (upcoming schedule)

```bash
# Today's meetings
python3 scripts/zoom.py meetings list --from today --to today

# This week's meetings
python3 scripts/zoom.py meetings list --from today --days 7
```

### Recordings

```bash
# List cloud recordings
python3 scripts/zoom.py recordings list

# List recordings for date range
python3 scripts/zoom.py recordings list --from "2026-01-01" --to "2026-01-31"

# Get recording details
python3 scripts/zoom.py recordings get <meeting_id>

# Download recording files
python3 scripts/zoom.py recordings download <meeting_id>
python3 scripts/zoom.py recordings download <meeting_id> --output ~/Downloads

# Delete a recording
python3 scripts/zoom.py recordings delete <meeting_id>
```

### AI Meeting Summary (AI Companion)

```bash
# List meeting summaries
python3 scripts/zoom.py summary list
python3 scripts/zoom.py summary list --from "2026-01-01" --to "2026-01-31"

# Get AI summary for a specific meeting
python3 scripts/zoom.py summary get <meeting_id>
```

### Users

```bash
# Get my profile
python3 scripts/zoom.py users me

# List users (admin)
python3 scripts/zoom.py users list
```

### Team Chat

```bash
# List chat channels
python3 scripts/zoom.py chat channels

# List messages in a channel
python3 scripts/zoom.py chat messages <channel_id>

# Send a message to a channel
python3 scripts/zoom.py chat send <channel_id> "Hello team!"

# Send a direct message
python3 scripts/zoom.py chat dm <email> "Hey, are you free?"

# List contacts
python3 scripts/zoom.py chat contacts
```

### Phone (Zoom Phone)

```bash
# List call logs
python3 scripts/zoom.py phone calls --from "2026-01-01" --to "2026-01-31"
```

## Scopes Required

For Server-to-Server OAuth, enable these scopes in your Zoom Marketplace app.
Only add the scopes you need — each command group requires specific scopes:

| Command Group | Scopes Needed |
|---|---|
| `users me` / `users list` | `user:read:admin` |
| `meetings list/get/create/update/delete` | `meeting:read:admin`, `meeting:write:admin` |
| `recordings list/get/delete` | `recording:read:admin`, `recording:write:admin` |
| `chat channels/messages/send/dm` | `chat_channel:read:admin`, `chat_message:read:admin`, `chat_message:write:admin` |
| `chat contacts` | `contact:read:admin` |
| `summary list/get` | `meeting_summary:read:admin` |
| `phone calls` | `phone:read:admin` (requires Zoom Phone enabled on account) |

**If you get a scope error**, go to https://marketplace.zoom.us/ → your app → Scopes, and add the missing scope listed in the error message.

## Rate Limits

Zoom API has rate limits (varies by endpoint, typically 30-100 req/sec). The script handles 429 responses with automatic retry.
