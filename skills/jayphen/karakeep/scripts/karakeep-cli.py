import os
import sys
import json
import argparse
import requests
import re

def get_config():
    # Precedence: env, then config file
    url = os.environ.get("KARAKEEP_URL") or os.environ.get("HOARDER_URL", "https://hoard.phen.boo")
    api_key = os.environ.get("KARAKEEP_API_KEY") or os.environ.get("HOARDER_API_KEY")
    
    config_path = os.path.expanduser("~/.config/karakeep/config.json")
    # Fallback to old hoarder config if karakeep doesn't exist
    old_config_path = os.path.expanduser("~/.config/hoarder/config.json")
    
    if not api_key:
        target_path = config_path if os.path.exists(config_path) else old_config_path
        if os.path.exists(target_path):
            with open(target_path, 'r') as f:
                config = json.load(f)
                url = config.get("url", url)
                api_key = config.get("api_key")
            
    return url, api_key

def save_config(url, api_key):
    config_path = os.path.expanduser("~/.config/karakeep/config.json")
    os.makedirs(os.path.dirname(config_path), exist_ok=True)
    with open(config_path, 'w') as f:
        json.dump({"url": url, "api_key": api_key}, f)

def make_request(method, endpoint, data=None, params=None):
    url, api_key = get_config()
    if not api_key:
        print("Error: KARAKEEP_API_KEY not set. Run 'login' or set the environment variable.")
        sys.exit(1)
        
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    full_url = f"{url.rstrip('/')}{endpoint}"
    
    try:
        response = requests.request(method, full_url, headers=headers, json=data, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        print(f"API Error: {e.response.text}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

def list_bookmarks(args):
    if args.search:
        # Use the specialized search endpoint for complex queries
        endpoint = "/api/v1/bookmarks/search"
        params = {"q": args.search, "limit": args.limit}
    else:
        # Use the standard listing endpoint
        endpoint = "/api/v1/bookmarks"
        params = {"limit": args.limit}
    
    data = make_request("GET", endpoint, params=params)
    bookmarks = data.get("bookmarks", data) if isinstance(data, dict) else data
    
    if not bookmarks:
        if args.search:
            print(f"No bookmarks found matching '{args.search}'.")
        else:
            print("No bookmarks found.")
        return

    for b in bookmarks:
        content = b.get("content", {})
        title = b.get("title") or content.get("title") or content.get("url") or "(No Title)"
        url = content.get("url")
        
        print(f"[{b.get('id')}] {title}")
        if url:
            print(f"    Link: {url}")
        elif content.get("text"):
            print(f"    Text: {content.get('text')[:100]}...")

def add_bookmark(args):
    # Attempt to determine type based on URL-like string
    if args.url.startswith(("http://", "https://")):
        data = {"type": "link", "url": args.url}
    else:
        data = {"type": "text", "text": args.url}
        
    result = make_request("POST", "/api/v1/bookmarks", data=data)
    print(f"Successfully hoarded: {result.get('title') or result.get('text') or args.url}")

def main():
    parser = argparse.ArgumentParser(description="Karakeep CLI")
    subparsers = parser.add_subparsers(dest="command")
    
    # Login command to save config
    login_parser = subparsers.add_parser("login")
    login_parser.add_argument("--url", help="Karakeep instance URL")
    login_parser.add_argument("api_key")
    
    # List command
    list_parser = subparsers.add_parser("list")
    list_parser.add_argument("--limit", type=int, default=20)
    list_parser.add_argument("--search", help="Search query (supports complex syntax)")
    list_parser.add_argument("-v", "--verbose", action="store_true")
    
    # Add command
    add_parser = subparsers.add_parser("add")
    add_parser.add_argument("url")
    
    args = parser.parse_known_args()[0]
    
    if args.command == "login":
        if not args.url:
            print("Error: Please provide your Karakeep instance URL with --url")
            sys.exit(1)
        save_config(args.url, args.api_key)
        print(f"Config saved to ~/.config/karakeep/config.json")
    elif args.command == "list":
        list_bookmarks(args)
    elif args.command == "add":
        add_bookmark(args)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
