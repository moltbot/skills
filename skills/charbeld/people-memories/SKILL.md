---
name: people-memories
description: Capture short personal notes about people you mention, store them in a lightweight DB, and recall those details whenever you ask about them later. Use when you want to remember preferences, reminders, or the context around a person without digging through past chats.
---

# People memories skill

## Purpose
Keep a short-lived, searchable memory vault about people you talk to so your assistant can recall follow-ups instantly. The skill handles:
- `remember` cues (voice or text) to persist comments, preferences, and context.
- Summaries + exports so you can package a person’s “fact card.”
- Search, recall, and list commands for quick lookups.
- Optional auto-trigger from voice transcripts (when you say “remember …”).

## Structure & storage
`~/.clawdbot/people-memory.json` now stores:
```
{
  "people": {
    "alex": {
      "displayName": "Alex",
      "notes": [
        {
          "timestamp": "2026-01-29T12:05:00Z",
          "note": "Likes cats and doing late-night music practice",
          "source": "voice",
          "tags": ["pets", "music"]
        }
      ]
    }
  },
  "index": {
    "music": ["alex"],
    "cats": ["alex"]
  }
}
```
- Names are normalized (lowercase keys) but store the display name.
- Each note captures `timestamp`, `note`, `source`, and `tags`.
- An `index` map keeps keywords → people for super-fast lookups.

## CLI commands
Use the bundled script to manage the database:
```
skills/people-memories/scripts/people_memory.py <command> [options]
```
- `remember --person Alex --note "loves chai" --tags drinks,preferences` – adds a note.
- `recall --person Alex --limit 3` – reads the latest notes.
- `summarize --person Alex` – prints fact card with counts, tags, last updates.
- `search --query coffee` – finds people whose notes mention “coffee”.
- `export --person Alex --format md --out ~/Desktop/alex.md` – dumps the notes as Markdown (or JSON). 
- `list` – enumerates everyone stored plus note counts.

## Auto capture (voice/chat)
The `extensions/people-memories` extension listens to `/voice-chat` transcripts. When you say something like “remember Alex likes cats,” it automatically runs the `remember` command and logs the note. The index updates in the background, and we keep confirmations quiet unless you explicitly ask for them.

## Reminders & automation
Event metadata (type + date) is attached whenever a note mentions birthdays or anniversaries. A helper cron job runs `python3 skills/people-memories/scripts/people_memory.py reminders --days 0 --window 7 --format message` each morning and delivers the resulting digest over Telegram so you’re nudged about the next week’s birthdays/anniversaries without manual effort. If you prefer a different cadence or channel, rerun the command yourself or update the schedule.

## Enhancements in this version
1. **Smart indexing** – Tags + keyword extraction keep the lookup index updated so searches find matching people even when you reuse adjectives.
2. **Summaries & exports** – Quickly produce a fact card or shareable Markdown/JSON of anyone’s notes.
3. **Voice integration + logging** – transcripts feed the database so you don’t type commands manually.
4. **Structured data** – normalized keys + timestamps plus tag metadata make it easy for other tools (cron, dashboards) to consume the memory store.

## Next steps / nice-to-haves
- Add optional confirmation responses “Noted, saved for Alex.” via the runtime `api.message` helper.
- Integrate with reminders/cron so tagged notes like `birthday` trigger alerts.
- Build a simple watch UI (web or terminal) that previews the latest people cards.

Let me know which direction to automate next (priority filters, notifications, cross-agent sync, etc.)."}