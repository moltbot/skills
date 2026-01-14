#!/usr/bin/env python3
import argparse
import datetime as dt
import json
import sys
import urllib.request
import xml.etree.ElementTree as ET


FEEDS = {
    # ORF provides RSS feeds; see https://rss.orf.at/
    # We'll merge them and dedupe by link.
    "news": "https://rss.orf.at/news.xml",
    "oesterreich": "https://rss.orf.at/oesterreich.xml",
    "sport": "https://rss.orf.at/sport.xml",
}

SPORT_HINTS = [
    "sport",
    "bundesliga",
    "champions league",
    "europa league",
    "ski",
    "skifahren",
    "tennis",
    "fußball",
    "fussball",
    "formel 1",
    "nba",
    "nfl",
]


def fetch(url: str) -> bytes:
    req = urllib.request.Request(
        url,
        headers={
            "accept": "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
            "user-agent": "clawdbot-orf-digest/1.0",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()


def parse_rss(xml_bytes: bytes) -> list[dict]:
    root = ET.fromstring(xml_bytes)
    items: list[dict] = []

    # ORF uses RSS 1.0 (RDF) with namespaces.
    # We avoid hardcoding the full namespace URIs by scanning for elements named "item".
    for el in root.iter():
        if not str(el.tag).endswith("item"):
            continue

        def find_text(name_suffix: str) -> str:
            for child in list(el):
                if str(child.tag).endswith(name_suffix) and child.text:
                    return child.text.strip()
            return ""

        title = find_text("title")
        link = find_text("link")
        pub_date = find_text("pubDate") or find_text("date")

        if title and link:
            items.append({"title": title, "link": link, "pubDate": pub_date})

    return items


def parse_date(dt_str: str) -> dt.datetime | None:
    if not dt_str:
        return None

    # RFC2822 (RSS 2.0)
    try:
        return dt.datetime.strptime(dt_str, "%a, %d %b %Y %H:%M:%S %z")
    except Exception:
        pass

    # ISO8601 (ORF RSS 1.0 uses dc:date)
    try:
        # e.g. 2026-01-14T12:03:32+01:00
        return dt.datetime.fromisoformat(dt_str)
    except Exception:
        return None


def age_text(published: dt.datetime | None, now: dt.datetime) -> str:
    if published is None:
        return ""

    delta = now - published.astimezone(now.tzinfo)
    seconds = max(0, int(delta.total_seconds()))

    if seconds < 60:
        return "just now"

    minutes = seconds // 60
    if minutes < 60:
        return f"{minutes}m ago"

    hours = minutes // 60
    if hours < 48:
        return f"{hours}h ago"

    days = hours // 24
    return f"{days}d ago"


def is_sportish(title: str, link: str) -> bool:
    t = (title or "").lower()
    l = (link or "").lower()
    if "/sport" in l:
        return True
    return any(h in t for h in SPORT_HINTS)


def score_item(title: str, focus: str) -> int:
    import re

    t = (title or "").lower()
    score = 0

    def has(patterns: list[str]) -> bool:
        return any(re.search(p, t) for p in patterns)

    # Default: politics + major news.
    politics = [
        r"\bregierung\b",
        r"\bparlament\b",
        r"\bkanzler\b",
        r"\bminister(in)?\b",
        r"\bwahl(en)?\b",
        r"\bkoalition\b",
        r"\bbudget\b",
        r"\bspö\b",
        r"\bövp\b",
        r"\bfpo\b|\bfpö\b",
        r"\bneos\b",
        r"\bgrüne\b|\bgruene\b",
    ]

    international = [
        r"\bukraine\b",
        r"\bruss\w*",
        r"\bisrael\b",
        r"\bgaza\b",
        r"\bchina\b",
        r"\busa\b|\bvereinigte(n)? staaten\b",
        r"\beu\b|\beuropa\b|\bbrüssel\b|\bbruessel\b",
        r"\bnato\b",
        r"\bkrieg\b",
    ]

    if has(politics) or has(international):
        score += 5

    # Slight boost for focus.
    if focus == "inland" and has([r"\bösterreich\b|\boesterreich\b", r"\bwien\b", r"\bparlament\b", r"\bregierung\b"]):
        score += 3
    if focus == "ausland" and has(international):
        score += 3

    return score


def main() -> int:
    ap = argparse.ArgumentParser(description="Fetch ORF RSS items (German), exclude sports, rank for politics.")
    ap.add_argument("--count", type=int, default=5)
    ap.add_argument("--focus", choices=["auto", "inland", "ausland"], default="auto")
    ap.add_argument("--format", choices=["json", "text"], default="json")
    args = ap.parse_args()

    count = max(1, min(int(args.count), 15))
    focus = args.focus

    now = dt.datetime.now(dt.timezone.utc)

    # Merge feeds; always exclude the sport feed.
    # Always include news; include regional Austria feed only when the user explicitly focuses on inland.
    feed_urls = [FEEDS["news"]] + ([FEEDS["oesterreich"]] if focus == "inland" else [])

    merged: list[dict] = []
    for url in feed_urls:
        merged.extend(parse_rss(fetch(url)))

    seen: set[str] = set()
    items: list[dict] = []

    for it in merged:
        link = it.get("link") or ""
        if not link or link in seen:
            continue
        seen.add(link)

        title = it.get("title") or ""
        if is_sportish(title, link):
            continue

        published = parse_date(it.get("pubDate") or "")
        items.append(
            {
                "title": title,
                "link": link,
                "published": published.isoformat() if published else None,
                "age": age_text(published, now),
                "score": score_item(title, "inland" if focus == "inland" else "ausland" if focus == "ausland" else "auto"),
            }
        )

    # Prefer high score; tie-break with recency.
    def sort_key(it: dict):
        published = it.get("published") or ""
        return (it.get("score", 0), published)

    ranked = sorted(items, key=sort_key, reverse=True)[:count]

    if args.format == "text":
        for it in ranked:
            sys.stdout.write(f"{it['title']}\n{it.get('age','')}\n{it['link']}\n\n")
        return 0

    sys.stdout.write(json.dumps({"items": ranked}, ensure_ascii=False, indent=2))
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
