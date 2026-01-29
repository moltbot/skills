# Luma Events Skill

Fetch upcoming tech events, startup meetups, and conferences from Luma (lu.ma) for any city worldwide.

## Installation

This skill is already available in your Clawdbot workspace at `~/clawd/skills/luma/`.

No dependencies or API keys needed - uses public event data.

## Quick Start

```bash
# Events in Bangalore this week
python3 ~/clawd/skills/luma/scripts/fetch_events.py bengaluru --days 7

# Multiple cities, next 2 weeks
python3 ~/clawd/skills/luma/scripts/fetch_events.py bengaluru mumbai san-francisco --days 14

# Get raw JSON for processing
python3 ~/clawd/skills/luma/scripts/fetch_events.py new-york --json
```

## How to Use with Clawdbot

Just ask naturally:

- "What tech events are happening in Bangalore this weekend?"
- "Any AI meetups in Mumbai next month?"
- "Show me startup events in SF"
- "Compare tech events in Bangalore vs San Francisco"

Clawdbot will fetch the events, save them to memory, and help you find what you're looking for.

## Popular Cities

### India
- bengaluru
- mumbai
- delhi
- hyderabad
- pune

### USA
- san-francisco
- new-york
- austin
- seattle
- boston

### Global
- london
- singapore
- dubai
- toronto
- sydney
- berlin
- amsterdam

## Output

Events are shown with:
- 🎯 Event name
- 📍 Venue and city
- 📅 Date and time
- 👥 Hosts (if listed)
- 👤 Guest count
- 🎫 Ticket status (Free/Paid/Sold Out/Available)
- 🔗 Direct link to lu.ma

## Event Memory

Fetched events are automatically saved to `~/clawd/memory/luma-events.json` so Clawdbot can:
- Remember events you're interested in
- Answer follow-up questions without re-fetching
- Track changes in ticket availability
- Help you plan across multiple cities

## Tech Details

- **No API**: Extracts data from Luma's public HTML (Next.js __NEXT_DATA__ tag)
- **Python stdlib only**: No external dependencies
- **Always fresh**: Gets live data directly from lu.ma
- **Fast**: Fetches and parses in ~1-2 seconds per city

## Examples

### Find weekend tech events
```bash
python3 ~/clawd/skills/luma/scripts/fetch_events.py bengaluru --days 3
```

### Check if events are selling out
```bash
python3 ~/clawd/skills/luma/scripts/fetch_events.py mumbai --json | jq '.[] | .events[] | select(.ticket_info.is_near_capacity)'
```

### Next 5 events in your city
```bash
python3 ~/clawd/skills/luma/scripts/fetch_events.py san-francisco --max 5
```

## Support

Part of Clawdbot skills. See `SKILL.md` for agent instructions.

Created: 2026-01-29
Version: 1.0.0
