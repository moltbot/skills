import json
import os
import re
import sys
from datetime import datetime, timezone


def die(message, code=1):
    print(message, file=sys.stderr)
    raise SystemExit(code)


def get_env(name, required=True, default=None):
    value = os.environ.get(name, default)
    if required and not value:
        die(f"Missing required environment variable: {name}")
    return value


def now_iso(ts=None):
    if ts is None:
        ts = datetime.now(timezone.utc)
    if isinstance(ts, datetime):
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        return ts.isoformat()
    return datetime.now(timezone.utc).isoformat()


def print_json(payload):
    json.dump(payload, sys.stdout, indent=2, sort_keys=False)
    print()


def normalize(text):
    if text is None:
        return ""
    return re.sub(r"\s+", " ", str(text)).strip().lower()


def match_channels(channels, query):
    if not query:
        return []
    needle = normalize(query)
    matches = []
    for ch in channels:
        haystack = " ".join(
            [
                normalize(ch.get("name")),
                normalize(ch.get("device")),
                normalize(ch.get("channel_num")),
            ]
        )
        if needle in haystack:
            matches.append(ch)
    return matches


def pick_total_channel(channels):
    if not channels:
        return None
    preferred = []
    fallback = []
    for ch in channels:
        name = normalize(ch.get("name"))
        channel_num = normalize(ch.get("channel_num"))
        if any(token in name for token in ["total", "mains", "main", "usage"]):
            preferred.append(ch)
        elif channel_num in ("1,2,3", "1,2"):
            preferred.append(ch)
        else:
            fallback.append(ch)
    if preferred:
        preferred.sort(key=lambda x: x.get("value") or 0, reverse=True)
        return preferred[0]
    fallback.sort(key=lambda x: x.get("value") or 0, reverse=True)
    return fallback[0]


def top_circuits(channels, total_channel, limit=5):
    items = [ch for ch in channels if ch is not total_channel]
    items.sort(key=lambda x: x.get("value") or 0, reverse=True)
    return items[:limit]
