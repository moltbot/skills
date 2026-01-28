#!/usr/bin/env python3
"""
TinyFish web extract/scrape helper

Usage:
    extract.py <url> <goal> [--stealth] [--proxy US]

Best practice: Specify the JSON format you want in the goal for better results.

Examples:
    extract.py "https://example.com" "Extract product as JSON: {\"name\": str, \"price\": str}"
    extract.py "https://site.com" "Get all links as JSON: [{\"text\": str, \"url\": str}]" --stealth
    extract.py "https://site.com" "Extract items as JSON: [{\"title\": str, \"price\": str}]" --stealth --proxy US
"""

import os
import sys
import json
import urllib.request
import argparse


def extract(url, goal, stealth=False, proxy_country=None):
    """Extract/scrape data from a website using TinyFish"""
    api_key = os.environ.get("MINO_API_KEY")
    if not api_key:
        print("Error: MINO_API_KEY environment variable not set", file=sys.stderr)
        sys.exit(1)

    payload = {
        "url": url,
        "goal": goal,
    }

    if stealth:
        payload["browser_profile"] = "stealth"

    if proxy_country:
        payload["proxy_config"] = {
            "enabled": True,
            "country_code": proxy_country,
        }

    req = urllib.request.Request(
        "https://mino.ai/v1/automation/run-sse",
        data=json.dumps(payload).encode(),
        headers={
            "X-API-Key": api_key,
            "Content-Type": "application/json",
        }
    )

    print(f"Extracting from {url}...", file=sys.stderr)

    with urllib.request.urlopen(req) as response:
        for line in response:
            line_str = line.decode("utf-8").strip()
            if line_str.startswith("data: "):
                event = json.loads(line_str[6:])

                # Print status updates
                if event.get("type") == "STATUS_UPDATE":
                    print(f"[{event.get('status')}] {event.get('message', '')}", file=sys.stderr)

                # Print final result
                if event.get("type") == "COMPLETE" and event.get("status") == "COMPLETED":
                    print(json.dumps(event["resultJson"], indent=2))
                    return event["resultJson"]


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="TinyFish web extract/scrape tool")
    parser.add_argument("url", help="URL to extract/scrape from")
    parser.add_argument("goal", help="What to extract (natural language)")
    parser.add_argument("--stealth", action="store_true", help="Use stealth mode")
    parser.add_argument("--proxy", help="Proxy country code (e.g., US, UK, DE)")

    args = parser.parse_args()
    extract(args.url, args.goal, args.stealth, args.proxy)
