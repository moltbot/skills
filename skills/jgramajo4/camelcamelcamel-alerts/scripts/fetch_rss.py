#!/usr/bin/env python3
"""
Fetch and parse CamelCamelCamel RSS alerts.
Compares against cache to detect new/updated items.
"""

import os
import sys
import json
import xml.etree.ElementTree as ET
from urllib.request import urlopen
from urllib.error import URLError
from datetime import datetime
from pathlib import Path

def load_cache(cache_file):
    """Load cached item hashes."""
    if os.path.exists(cache_file):
        with open(cache_file, 'r') as f:
            return json.load(f)
    return {}

def save_cache(cache_file, cache_data):
    """Save item hashes to cache."""
    os.makedirs(os.path.dirname(cache_file), exist_ok=True)
    with open(cache_file, 'w') as f:
        json.dump(cache_data, f, indent=2)

def fetch_rss(feed_url):
    """Fetch RSS feed from URL."""
    try:
        with urlopen(feed_url, timeout=10) as response:
            return response.read().decode('utf-8')
    except URLError as e:
        print(f"Error fetching feed: {e}", file=sys.stderr)
        return None

def parse_rss(xml_content):
    """Parse RSS XML and extract alert items."""
    try:
        root = ET.fromstring(xml_content)
        items = []
        
        # CamelCamelCamel RSS structure
        for item in root.findall('.//item'):
            title_elem = item.find('title')
            link_elem = item.find('link')
            desc_elem = item.find('description')
            pubdate_elem = item.find('pubDate')
            
            if title_elem is not None:
                item_data = {
                    'title': title_elem.text or '',
                    'link': link_elem.text if link_elem is not None else '',
                    'description': desc_elem.text if desc_elem is not None else '',
                    'pubDate': pubdate_elem.text if pubdate_elem is not None else '',
                }
                items.append(item_data)
        
        return items
    except ET.ParseError as e:
        print(f"Error parsing RSS: {e}", file=sys.stderr)
        return []

def extract_price_info(description):
    """Extract current price and drop info from description."""
    # CamelCamelCamel descriptions typically contain: current price, historical low, etc.
    # Return parsed info or raw description if parsing fails
    return description

def main():
    if len(sys.argv) < 2:
        print("Usage: fetch_rss.py <feed_url> [cache_dir]")
        sys.exit(1)
    
    feed_url = sys.argv[1]
    cache_dir = sys.argv[2] if len(sys.argv) > 2 else "/tmp/camelcamelcamel"
    cache_file = os.path.join(cache_dir, "cache.json")
    
    # Fetch feed
    xml_content = fetch_rss(feed_url)
    if not xml_content:
        sys.exit(1)
    
    # Parse items
    items = parse_rss(xml_content)
    if not items:
        print("No items found in feed")
        sys.exit(0)
    
    # Load cache
    cache = load_cache(cache_file)
    
    # Detect new/updated items
    new_alerts = []
    for item in items:
        # Create simple hash of title + description
        item_key = f"{item['title']}|{item['description'][:100]}"
        item_hash = hash(item_key) % (2**31)  # Keep it reasonable
        
        if str(item_hash) not in cache:
            new_alerts.append({
                'hash': item_hash,
                'title': item['title'],
                'link': item['link'],
                'description': item['description'],
                'pubDate': item['pubDate'],
                'detected_at': datetime.utcnow().isoformat()
            })
            cache[str(item_hash)] = item['pubDate']
    
    # Save updated cache
    save_cache(cache_file, cache)
    
    # Output new alerts as JSON (for processing by cron/notification handler)
    if new_alerts:
        output = {
            'timestamp': datetime.utcnow().isoformat(),
            'alerts': new_alerts,
            'count': len(new_alerts)
        }
        print(json.dumps(output, indent=2))
    else:
        print(json.dumps({'timestamp': datetime.utcnow().isoformat(), 'alerts': [], 'count': 0}))

if __name__ == '__main__':
    main()
