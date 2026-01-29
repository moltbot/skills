#!/usr/bin/env python3
"""
Fetch Luma events from city pages by extracting __NEXT_DATA__ JSON.
No API key required.
"""

import urllib.request
import json
import re
import argparse
from datetime import datetime, timedelta
from html import unescape

def fetch_luma_events(city_slug):
    """Fetch events for a city from Luma."""
    url = f"https://lu.ma/{city_slug}"
    
    try:
        # Add headers to avoid 403
        req = urllib.request.Request(
            url,
            headers={
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            html = response.read().decode('utf-8')
        
        # Extract __NEXT_DATA__ JSON
        match = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL)
        if not match:
            return {"error": f"Could not find __NEXT_DATA__ in {url}"}
        
        data = json.loads(unescape(match.group(1)))
        
        # Navigate to events array
        try:
            events = data['props']['pageProps']['initialData']['data']['events']
            return {"city": city_slug, "events": events, "url": url}
        except KeyError as e:
            return {"error": f"Unexpected data structure: {e}", "url": url}
    
    except Exception as e:
        return {"error": str(e), "url": f"https://lu.ma/{city_slug}"}

def format_event_human(event_data, city_slug):
    """Format event for human-readable output."""
    event = event_data.get('event', {})
    hosts = event_data.get('hosts', [])
    ticket = event_data.get('ticket_info', {})
    guest_count = event_data.get('guest_count', 0)
    
    name = event.get('name', 'Unnamed Event')
    start = event.get('start_at')
    geo = event.get('geo_address_info', {})
    venue = geo.get('address', 'Online')
    city = geo.get('city', city_slug.title())
    url_slug = event.get('url', '')
    
    # Format date
    if start:
        try:
            dt = datetime.fromisoformat(start.replace('Z', '+00:00'))
            date_str = dt.strftime('%b %d, %Y %I:%M %p %Z')
        except:
            date_str = start
    else:
        date_str = "TBA"
    
    # Ticket status
    if ticket.get('is_sold_out'):
        ticket_status = "🔴 Sold Out"
    elif ticket.get('is_free'):
        spots = ticket.get('spots_remaining')
        if spots and spots > 0:
            ticket_status = f"🟢 Free ({spots} spots)"
        else:
            ticket_status = "🟢 Free"
    else:
        spots = ticket.get('spots_remaining')
        if spots and spots > 0:
            ticket_status = f"🎫 Available ({spots} spots)"
        elif ticket.get('is_near_capacity'):
            ticket_status = "🟡 Nearly Full"
        else:
            ticket_status = "🎫 Paid"
    
    # Hosts
    host_str = ""
    if hosts:
        host_names = [h.get('name', '') for h in hosts[:2]]
        host_str = f"👥 {', '.join(filter(None, host_names))}\n"
    
    # Guest count
    guest_str = f"👤 {guest_count} going\n" if guest_count > 0 else ""
    
    output = f"""
🎯 {name}
📍 {venue}, {city}
📅 {date_str}
{host_str}{guest_str}{ticket_status}
🔗 https://lu.ma/{url_slug}
""".strip()
    
    return output

def filter_events(events, days=None, max_events=None):
    """Filter events by date range and limit."""
    filtered = []
    cutoff = None
    
    if days:
        cutoff = datetime.now() + timedelta(days=days)
    
    for event_data in events:
        event = event_data.get('event', {})
        start = event.get('start_at')
        
        # Filter by date
        if start and cutoff:
            try:
                dt = datetime.fromisoformat(start.replace('Z', '+00:00'))
                if dt.replace(tzinfo=None) > cutoff:
                    continue
            except:
                pass
        
        filtered.append(event_data)
        
        # Limit results
        if max_events and len(filtered) >= max_events:
            break
    
    return filtered

def main():
    parser = argparse.ArgumentParser(
        description="Fetch Luma events from city pages"
    )
    parser.add_argument(
        'cities',
        nargs='+',
        help='City slugs (e.g., bengaluru, mumbai, san-francisco)'
    )
    parser.add_argument(
        '--days',
        type=int,
        default=30,
        help='Only show events within N days (default: 30)'
    )
    parser.add_argument(
        '--max',
        type=int,
        default=20,
        help='Maximum events per city (default: 20)'
    )
    parser.add_argument(
        '--json',
        action='store_true',
        help='Output raw JSON instead of formatted text'
    )
    
    args = parser.parse_args()
    
    all_results = []
    
    for city in args.cities:
        result = fetch_luma_events(city)
        
        if 'error' in result:
            print(f"\n❌ {city}: {result['error']}", flush=True)
            if args.json:
                all_results.append(result)
            continue
        
        events = result.get('events', [])
        filtered = filter_events(events, args.days, args.max)
        
        if args.json:
            all_results.append({
                "city": city,
                "count": len(filtered),
                "events": filtered
            })
        else:
            print(f"\n{'='*60}", flush=True)
            print(f"📍 {city.upper()} — {len(filtered)} events", flush=True)
            print(f"{'='*60}", flush=True)
            
            for event_data in filtered:
                print(format_event_human(event_data, city), flush=True)
                print("", flush=True)
    
    if args.json:
        print(json.dumps(all_results, indent=2), flush=True)

if __name__ == '__main__':
    main()
