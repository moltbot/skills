---
name: luma
description: Fetch upcoming events from Luma (lu.ma) for any city. Use when the user asks about tech events, startup meetups, networking events, conferences, or things happening in cities like Bangalore, Mumbai, Delhi, San Francisco, New York, etc.
version: 1.0.0
author: Clawd
---

# Luma Events Skill

Fetch structured event data from Luma (lu.ma) without authentication. Luma is a popular platform for tech meetups, startup events, conferences, and community gatherings.

## How It Works

Luma is a Next.js SSR app. All event data is embedded in the HTML as JSON inside a `<script id="__NEXT_DATA__">` tag. The Python script extracts this data - no API key needed.

## Quick Start

```bash
python3 scripts/fetch_events.py bengaluru mumbai --days 14
```

## Usage

```bash
python3 scripts/fetch_events.py <city> [cities...] [--days N] [--max N] [--json]
```

### Parameters

- **`city`**: City slug (bengaluru, mumbai, delhi, san-francisco, new-york, london, etc.)
- **`--days N`**: Only show events within N days (default: 30)
- **`--max N`**: Maximum events per city (default: 20)
- **`--json`**: Output raw JSON instead of formatted text

### Popular City Slugs

- **India**: bengaluru, mumbai, delhi, hyderabad, pune
- **USA**: san-francisco, new-york, austin, seattle, boston
- **Global**: london, singapore, dubai, toronto, sydney

## Output Format

### Human-readable (default)

```
============================================================
📍 BENGALURU — 5 events
============================================================

🎯 AI Engineers Day with OpenAI
📍 Whitefield, Bengaluru
📅 Jan 31, 2026 10:30 AM IST
👥 OpenAI, Google AI
👤 1411 going
🎫 Available (150 spots)
🔗 https://lu.ma/57tarlkp

🎯 Startup Fundraising Masterclass
📍 Koramangala, Bengaluru
📅 Feb 02, 2026 06:00 PM IST
🟢 Free (50 spots)
🔗 https://lu.ma/startup-funding
```

### JSON output (`--json`)

```json
[
  {
    "city": "bengaluru",
    "count": 5,
    "events": [
      {
        "event": {
          "name": "AI Engineers Day",
          "start_at": "2026-01-31T05:00:00.000Z",
          "end_at": "2026-01-31T12:30:00.000Z",
          "url": "57tarlkp",
          "geo_address_info": {
            "city": "Bengaluru",
            "address": "Whitefield",
            "full_address": "..."
          }
        },
        "hosts": [{"name": "OpenAI", "linkedin_handle": "/company/openai"}],
        "guest_count": 1411,
        "ticket_info": {
          "is_free": false,
          "is_sold_out": false,
          "spots_remaining": 150
        }
      }
    ]
  }
]
```

## Event Persistence

**Always save fetched events to `~/clawd/memory/luma-events.json` for future reference.**

This allows you to:
- Answer questions about events without repeated fetches
- Track which events the user is interested in
- Compare events across cities
- Build context about upcoming plans

**When to save:**
- After fetching events for any city
- Merge with existing data (by event URL)
- Keep events for next 60 days only
- Add `lastFetched` timestamp

**Format:**

```json
[
  {
    "city": "bengaluru",
    "name": "AI Engineers Day",
    "start": "2026-01-31T05:00:00.000Z",
    "end": "2026-01-31T12:30:00.000Z",
    "url": "https://lu.ma/57tarlkp",
    "venue": "Whitefield, Bengaluru",
    "hosts": ["OpenAI", "Google AI"],
    "guestCount": 1411,
    "ticketStatus": "available",
    "spotsRemaining": 150,
    "isFree": false,
    "lastFetched": "2026-01-29T12:54:00Z"
  }
]
```

## Common Use Cases

### Find tech events this week
```bash
python3 scripts/fetch_events.py bengaluru --days 7
```

### Check multiple cities for AI events
```bash
python3 scripts/fetch_events.py bengaluru mumbai san-francisco --days 14 --json | jq '.[] | .events[] | select(.event.name | contains("AI"))'
```

### Get next 5 events in a city
```bash
python3 scripts/fetch_events.py new-york --max 5
```

## Example Queries

**User:** "What tech events are happening in Bangalore this weekend?"
→ Fetch Bengaluru events for next 7 days, save to memory

**User:** "Any AI meetups in Mumbai next month?"
→ Fetch Mumbai events for next 30 days, filter for AI-related, save to memory

**User:** "Compare startup events in SF vs NYC"
→ Fetch both cities, compare, save both to memory

## Notes

- **No authentication**: Luma event pages are public
- **City slugs**: Use lowercase, hyphenated slugs (san-francisco, not San Francisco)
- **Rate limiting**: Respectful fetching only (don't hammer the servers)
- **Data freshness**: Events are live data from the HTML, always current
- **Timezone**: Times are in the event's local timezone (extracted from start_at)

## Troubleshooting

**"Could not find __NEXT_DATA__"** → Luma changed their HTML structure, script needs updating

**"Unexpected data structure"** → The JSON path changed, check the latest HTML

**No events returned** → City slug might be wrong, or no upcoming events for that city

**Timeout errors** → Network issue, retry or check internet connection

## Dependencies

- Python 3.6+ (stdlib only - no external packages needed)
- `urllib`, `json`, `re`, `argparse`, `datetime` (all built-in)

## Changelog

### v1.0.0 (2026-01-29)
- Initial release
- Support for multiple cities
- Human-readable and JSON output
- Date filtering (--days)
- Event limit per city (--max)
- Event persistence to memory file
