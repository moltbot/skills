#!/usr/bin/env python3
"""Query Polymarket prediction markets via public API."""

import argparse
import json
import urllib.request
import urllib.parse
from typing import Optional

BASE_URL = "https://gamma-api.polymarket.com"

def fetch(endpoint: str, params: dict = None) -> list | dict:
    """Fetch from Polymarket API."""
    url = f"{BASE_URL}{endpoint}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (compatible; polymarket-skill/1.0)",
        "Accept": "application/json"
    })
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())

def format_market(m: dict) -> str:
    """Format a single market for display."""
    q = m.get("question", "Unknown")[:80]
    prices = json.loads(m.get("outcomePrices", '["0","0"]'))
    yes_pct = float(prices[0]) * 100 if prices else 0
    no_pct = float(prices[1]) * 100 if len(prices) > 1 else 0
    vol24h = m.get("volume24hr", 0) or 0
    vol_total = m.get("volumeNum", 0) or 0
    closed = "🔒" if m.get("closed") else ""
    return f"{closed}{q}\n   Yes: {yes_pct:.1f}% | No: {no_pct:.1f}% | 24h: ${vol24h:,.0f} | Total: ${vol_total:,.0f}"

def top_markets(limit: int = 10) -> None:
    """Show top markets by 24h volume."""
    markets = fetch("/markets", {
        "active": "true",
        "closed": "false",
        "limit": limit,
        "order": "volume24hr",
        "ascending": "false"
    })
    print(f"📈 Top {len(markets)} Markets by 24h Volume\n")
    for m in markets:
        print(format_market(m))
        print()

def search_markets(query: str, limit: int = 10) -> None:
    """Search markets by text."""
    # The API doesn't have a search param, so we fetch more and filter
    markets = fetch("/markets", {
        "active": "true",
        "closed": "false",
        "limit": 100,
        "order": "volume24hr",
        "ascending": "false"
    })
    query_lower = query.lower()
    matches = [m for m in markets if query_lower in m.get("question", "").lower() 
               or query_lower in m.get("description", "").lower()][:limit]
    
    if not matches:
        print(f"No markets found matching '{query}'")
        return
    
    print(f"🔍 Markets matching '{query}'\n")
    for m in matches:
        print(format_market(m))
        print()

def get_market(slug: str) -> None:
    """Get a specific market by slug."""
    markets = fetch("/markets", {"slug": slug})
    if not markets:
        print(f"No market found with slug: {slug}")
        return
    
    m = markets[0]
    print(f"📊 {m.get('question', 'Unknown')}\n")
    prices = json.loads(m.get("outcomePrices", '["0","0"]'))
    outcomes = json.loads(m.get("outcomes", '["Yes","No"]'))
    
    for i, (outcome, price) in enumerate(zip(outcomes, prices)):
        pct = float(price) * 100
        print(f"   {outcome}: {pct:.1f}%")
    
    print(f"\n   24h Volume: ${m.get('volume24hr', 0):,.0f}")
    print(f"   Total Volume: ${m.get('volumeNum', 0):,.0f}")
    print(f"   Liquidity: ${m.get('liquidityNum', 0):,.0f}")
    print(f"   Status: {'Closed' if m.get('closed') else 'Open'}")
    if m.get("endDate"):
        print(f"   End Date: {m.get('endDate')[:10]}")
    if m.get("description"):
        desc = m.get("description", "")[:500]
        print(f"\n   {desc}{'...' if len(m.get('description', '')) > 500 else ''}")

def list_events(limit: int = 10) -> None:
    """List top events (grouped markets)."""
    events = fetch("/events", {
        "active": "true",
        "closed": "false",
        "limit": limit,
        "order": "volume24hr",
        "ascending": "false"
    })
    print(f"📅 Top {len(events)} Events\n")
    for e in events:
        title = e.get("title", "Unknown")[:70]
        vol = e.get("volume", 0) or 0
        markets_count = len(e.get("markets", []))
        print(f"• {title}")
        print(f"   Volume: ${vol:,.0f} | Markets: {markets_count}")
        print()

def main():
    parser = argparse.ArgumentParser(description="Query Polymarket prediction markets")
    parser.add_argument("--top", action="store_true", help="Show top markets by 24h volume")
    parser.add_argument("--search", "-s", type=str, help="Search markets by text")
    parser.add_argument("--slug", type=str, help="Get market by slug")
    parser.add_argument("--events", "-e", action="store_true", help="List top events")
    parser.add_argument("--limit", "-n", type=int, default=10, help="Number of results")
    parser.add_argument("--json", action="store_true", help="Output raw JSON")
    
    args = parser.parse_args()
    
    if args.json:
        if args.search:
            data = fetch("/markets", {"active": "true", "closed": "false", "limit": 100})
            data = [m for m in data if args.search.lower() in m.get("question", "").lower()][:args.limit]
        elif args.slug:
            data = fetch("/markets", {"slug": args.slug})
        elif args.events:
            data = fetch("/events", {"active": "true", "closed": "false", "limit": args.limit})
        else:
            data = fetch("/markets", {"active": "true", "closed": "false", "limit": args.limit, "order": "volume24hr", "ascending": "false"})
        print(json.dumps(data, indent=2))
        return
    
    if args.search:
        search_markets(args.search, args.limit)
    elif args.slug:
        get_market(args.slug)
    elif args.events:
        list_events(args.limit)
    else:
        top_markets(args.limit)

if __name__ == "__main__":
    main()
