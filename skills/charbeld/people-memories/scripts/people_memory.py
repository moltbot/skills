#!/usr/bin/env python3
import argparse
import calendar
import json
import os
import re
from datetime import date, datetime, timedelta
from pathlib import Path
from dateutil.parser import ParserError, parse

PEOPLE_FILE = os.path.expanduser("~/.clawdbot/people-memory.json")
WORD_RE = re.compile(r"\b[\w']+\b")

EVENT_TYPES = {"birthday", "anniversary"}
EVENT_KEYWORDS = {
    "birthday": {
        "tags": {"birthday", "birthdays", "birthdate", "bday"},
        "text": ["birthday", "bday", "born", "born on"],
    },
    "anniversary": {
        "tags": {"anniversary", "anniv", "wedding"},
        "text": ["anniversary", "wedding", "married on"],
    },
}


def find_event_type(note, tags, override=None):
    if override and override.lower() in EVENT_TYPES:
        return override.lower()
    normalized_tags = {t.lower() for t in tags if t}
    note_lower = note.lower()
    for event_type, criteria in EVENT_KEYWORDS.items():
        if normalized_tags & criteria["tags"]:
            return event_type
        if any(keyword in note_lower for keyword in criteria["text"]):
            return event_type
    return None


def parse_event_date(text, reference=None):
    if not text:
        return None
    reference = reference or datetime.utcnow()
    default = datetime(reference.year, 1, 1)
    try:
        parsed = parse(text, fuzzy=True, default=default)
        return parsed.date()
    except (ParserError, ValueError, OverflowError):
        return None


def build_event_metadata(event_type, date_obj, note, source):
    return {
        "type": event_type,
        "date": date_obj.isoformat(),
        "month": date_obj.month,
        "day": date_obj.day,
        "year": date_obj.year,
        "note": note.strip(),
        "source": source,
    }


def detect_event_metadata(note, tags, provided_type=None, provided_date=None, source="chat"):
    event_type = find_event_type(note, tags, provided_type)
    if not event_type:
        return None
    if provided_date:
        event_date = parse_event_date(provided_date)
        if not event_date:
            return None
    else:
        event_date = parse_event_date(note)
        if not event_date:
            return None
    return build_event_metadata(event_type, event_date, note, source)

def load_store():
    if os.path.exists(PEOPLE_FILE):
        with open(PEOPLE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"people": {}, "index": {}}


def save_store(data):
    os.makedirs(os.path.dirname(PEOPLE_FILE), exist_ok=True)
    with open(PEOPLE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def ensure_person_entry(store, person_key, display_name):
    people = store["people"]
    if person_key not in people:
        people[person_key] = {"displayName": display_name.strip(), "notes": []}
    else:
        people[person_key]["displayName"] = display_name.strip()
    return people[person_key]


def add_to_index(store, person_key, keywords):
    index = store.setdefault("index", {})
    for keyword in keywords:
        keyword = keyword.lower()
        index.setdefault(keyword, []).append(person_key)
    for keyword in index:
        index[keyword] = sorted(set(index[keyword]))
    store["index"] = index


def add_note(person, note, source, tags, event_type=None, event_date=None):
    store = load_store()
    person_key = person.strip().lower()
    entry = ensure_person_entry(store, person_key, person.strip())
    timestamp = datetime.utcnow().isoformat() + "Z"
    clean_tags = [t.strip().lower() for t in tags if t.strip()]
    note_entry = {
        "timestamp": timestamp,
        "note": note.strip(),
        "source": source,
        "tags": clean_tags,
    }
    event = detect_event_metadata(note, clean_tags, provided_type=event_type, provided_date=event_date, source=source)
    if event:
        note_entry["event"] = event
        entry.setdefault("events", {})[event["type"]] = {**event, "updatedAt": timestamp}
    entry["notes"].append(note_entry)
    keywords = set(clean_tags)
    keywords.update(w.lower() for w in WORD_RE.findall(note))
    add_to_index(store, person_key, keywords)
    save_store(store)
    print(f"Saved note for {entry['displayName']}: {note}")


def recall(person, limit):
    store = load_store()
    person_key = person.strip().lower()
    entry = store.get("people", {}).get(person_key)
    if not entry or not entry.get("notes"):
        print(f"No notes found for {person.strip()}.")
        return
    notes = entry["notes"]
    for idx, note in enumerate(reversed(notes[-limit:]), 1):
        tags = f" [tags: {', '.join(note['tags'])}]" if note["tags"] else ""
        print(f"{idx}. {note['note']} (source: {note['source']}, {note['timestamp']}){tags}")


def summarize(person):
    store = load_store()
    person_key = person.strip().lower()
    entry = store.get("people", {}).get(person_key)
    if not entry or not entry.get("notes"):
        print(f"No notes found for {person.strip()}.")
        return
    notes = entry["notes"]
    last_updated = notes[-1]["timestamp"]
    tag_counts = {}
    for note in notes:
        for tag in note["tags"]:
            tag_counts[tag] = tag_counts.get(tag, 0) + 1
    tags = sorted(tag_counts, key=lambda k: (-tag_counts[k], k))[:5]
    print(f"Person: {entry['displayName']}")
    print(f"Notes count: {len(notes)}")
    print(f"Last updated: {last_updated}")
    if tags:
        print(f"Top tags: {', '.join(tags)}")
    print("Recent notes:")
    for note in notes[-3:]:
        print(f"- {note['note']} ({note['timestamp']})")


def search(query, limit):
    store = load_store()
    query_lower = query.lower()
    index = store.get("index", {})
    person_keys = index.get(query_lower, [])
    if person_keys:
        for idx, key in enumerate(person_keys[:limit], 1):
            person = store["people"][key]
            latest = person["notes"][-1]
            print(f"{idx}. {person['displayName']}: {latest['note']} ({latest['timestamp']})")
        return
    matches = []
    for person_key, person in store.get("people", {}).items():
        for note in person.get("notes", []):
            if query_lower in note["note"].lower():
                matches.append((person['displayName'], note))
    if not matches:
        print("No entries match that query.")
        return
    for idx, (person, note) in enumerate(matches[:limit], 1):
        tags = f" [tags: {', '.join(note['tags'])}]" if note['tags'] else ""
        print(f"{idx}. {person}: {note['note']} ({note['timestamp']}){tags}")


def list_people():
    store = load_store()
    people = sorted(store.get("people", {}).items(), key=lambda x: x[1]["displayName"].lower())
    if not people:
        print("No people stored yet.")
        return
    for _, entry in people:
        print(f"- {entry['displayName']} ({len(entry['notes'])} notes, updated {entry['notes'][-1]['timestamp']})")


def export_person(person, fmt, out_path):
    store = load_store()
    person_key = person.strip().lower()
    entry = store.get("people", {}).get(person_key)
    if not entry or not entry.get("notes"):
        print(f"No notes found for {person.strip()}.")
        return
    notes = entry["notes"]
    if fmt == "md":
        lines = [f"# {entry['displayName']}\n", f"*Updated {notes[-1]['timestamp']}*\n"]
        for note in notes:
            tags = f" (tags: {', '.join(note['tags'])})" if note['tags'] else ""
            lines.append(f"- {note['note']}{tags} [{note['timestamp']}]\n")
        out = "".join(lines)
    else:
        out = json.dumps(entry, ensure_ascii=False, indent=2)
    if out_path:
        Path(out_path).write_text(out, encoding="utf-8")
        print(f"Exported {entry['displayName']} to {out_path}.")
    else:
        print(out)


def next_occurrence(event, reference_date):
    month = event.get("month")
    day = event.get("day")
    if not month or not day:
        return None
    for year in (reference_date.year, reference_date.year + 1):
        if month == 2 and day == 29 and not calendar.isleap(year):
            continue
        try:
            candidate = date(year, month, day)
        except ValueError:
            continue
        if candidate >= reference_date:
            return candidate
    return None


def gather_upcoming_events(store, reference_date, lookahead=0, include_types=None):
    results = []
    people = store.get("people", {})
    for entry in people.values():
        display = entry.get("displayName", "Unknown")
        events = entry.get("events", {})
        for event_type, data in events.items():
            if include_types and event_type not in include_types:
                continue
            occurrence = next_occurrence(data, reference_date)
            if not occurrence:
                continue
            days_until = (occurrence - reference_date).days
            if 0 <= days_until <= lookahead:
                event_year = data.get("year")
                age = None
                if event_year and event_year <= occurrence.year:
                    age = occurrence.year - event_year
                results.append({
                    "person": display,
                    "event_type": event_type,
                    "occurrence": occurrence,
                    "note": data.get("note"),
                    "age": age,
                    "days_until": days_until,
                })
    results.sort(key=lambda e: (e["days_until"], e["person"].lower()))
    return results


def format_reminder_message(events, reference_date, lookahead, fmt="text"):
    if not events:
        return f"No birthday or anniversary reminders for {reference_date.strftime('%B %d, %Y')}"
    if lookahead == 0:
        header = f"People memories reminders for {reference_date.strftime('%B %d, %Y')}:"
    else:
        end_date = reference_date + timedelta(days=lookahead)
        header = (
            f"People memories reminders from {reference_date.strftime('%b %d')}"
            f" through {end_date.strftime('%b %d')}:"
        )
    lines = []
    for event in events:
        date_str = event["occurrence"].strftime("%b %d")
        suffix = ""
        if event["event_type"] == "birthday" and event["age"]:
            suffix = f" (turning {event['age']})"
        note_info = f": {event['note']}" if event['note'] else ""
        lines.append(
            f"- {event['person']} ({event['event_type'].title()}) on {date_str}{suffix}{note_info}"
        )
    if fmt == "message":
        return "\n".join(lines)
    return "\n".join([header] + lines)


def run_reminders(reference_offset=0, lookahead=0, type_filter="all", fmt="text"):
    store = load_store()
    reference_date = datetime.utcnow().date() + timedelta(days=reference_offset)
    types = None if type_filter == "all" else [type_filter]
    events = gather_upcoming_events(store, reference_date, lookahead, types)
    message = format_reminder_message(events, reference_date, lookahead, fmt)
    print(message)


def main():
    parser = argparse.ArgumentParser(description="Store and recall informal notes about people.")
    subparsers = parser.add_subparsers(dest="cmd", required=True)

    remember = subparsers.add_parser("remember", help="Save a note about someone.")
    remember.add_argument("--person", required=True)
    remember.add_argument("--note", required=True)
    remember.add_argument("--source", default="chat")
    remember.add_argument("--event-type", choices=["birthday", "anniversary"], help="Optional event type to associate with this note.")
    remember.add_argument("--event-date", help="Optional event date (natural language) for birthdays or anniversaries.")
    remember.add_argument("--tags", default="", help="Comma-separated keywords.")

    recall_parser = subparsers.add_parser("recall", help="Show latest notes for a person.")
    recall_parser.add_argument("--person", required=True)
    recall_parser.add_argument("--limit", type=int, default=5)

    summarize_parser = subparsers.add_parser("summarize", help="Summarize notes for a person.")
    summarize_parser.add_argument("--person", required=True)

    search_parser = subparsers.add_parser("search", help="Search notes by keyword.")
    search_parser.add_argument("--query", required=True)
    search_parser.add_argument("--limit", type=int, default=5)

    export_parser = subparsers.add_parser("export", help="Export a person’s notes.")
    export_parser.add_argument("--person", required=True)
    export_parser.add_argument("--format", choices=["md", "json"], default="md")
    export_parser.add_argument("--out", help="Optional output file path.")

    list_parser = subparsers.add_parser("list", help="List all people tracked.")

    remind_parser = subparsers.add_parser("reminders", help="List upcoming birthday/anniversary reminders.")
    remind_parser.add_argument("--days", type=int, default=0, help="Days from today to anchor the reminder window.")
    remind_parser.add_argument("--window", type=int, default=0, help="How many days forward (inclusive) to check for events.")
    remind_parser.add_argument("--event-types", choices=["all", "birthday", "anniversary"], default="all", help="Beware: choose a specific event type or all.")
    remind_parser.add_argument("--format", choices=["text", "message"], default="text", help="Output style for the reminder text.")
    args = parser.parse_args()
    if args.cmd == "remember":
        tags = args.tags.split(",") if args.tags else []
        add_note(
            args.person,
            args.note,
            args.source,
            tags,
            event_type=args.event_type,
            event_date=args.event_date,
        )
    elif args.cmd == "recall":
        recall(args.person, args.limit)
    elif args.cmd == "summarize":
        summarize(args.person)
    elif args.cmd == "search":
        search(args.query, args.limit)
    elif args.cmd == "export":
        export_person(args.person, args.format, args.out)
    elif args.cmd == "list":
        list_people()
    elif args.cmd == "reminders":
        run_reminders(
            reference_offset=args.days,
            lookahead=args.window,
            type_filter=args.event_types,
            fmt=args.format,
        )


if __name__ == "__main__":
    main()
