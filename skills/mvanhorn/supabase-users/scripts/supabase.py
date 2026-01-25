#!/usr/bin/env python3
"""
Supabase CLI - Query your Supabase projects
Usage: python3 supabase.py <command> [args]

Supports both:
- Legacy JWT service_role keys (eyJ...) - RECOMMENDED for full access
- New secret keys (sb_secret_...) - Limited functionality
"""

import os
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime, timedelta, timezone

try:
    import requests
except ImportError:
    print("Error: requests not installed. Run: pip3 install requests")
    sys.exit(1)

CONFIG_FILE = Path.home() / ".supabase_config.json"

def load_config():
    """Load saved config."""
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE) as f:
            return json.load(f)
    return {}

def save_config(config):
    """Save config to file."""
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=2)
    os.chmod(CONFIG_FILE, 0o600)  # Secure permissions
    print(f"✅ Config saved to {CONFIG_FILE}")

def get_credentials():
    """Get Supabase credentials from config or env."""
    config = load_config()
    
    url = os.environ.get("SUPABASE_URL") or config.get("url")
    key = os.environ.get("SUPABASE_SERVICE_KEY") or config.get("service_key")
    
    if not url or not key:
        print("❌ Supabase credentials not configured.")
        print("Run: python3 supabase.py auth")
        sys.exit(1)
    
    return url, key

def is_jwt_key(key: str) -> bool:
    """Check if key is a JWT (legacy) format."""
    return key.startswith("eyJ")

def get_headers(key: str) -> dict:
    """Get appropriate headers based on key type."""
    if key.startswith("sb_secret_"):
        # New format secret key (limited functionality)
        return {
            "x-secret-key": key,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
    else:
        # Legacy JWT service_role key (full access)
        return {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

def auth():
    """Interactive auth setup."""
    print("🔐 Supabase Authentication Setup")
    print("=" * 40)
    
    print("\n📍 Where to find your credentials:")
    print("   Supabase Dashboard → Project Settings → API")
    print("   (Under 'Legacy anon, service_role API keys' tab)")
    print()
    
    url = input("Project URL (https://xxxxx.supabase.co): ").strip()
    if not url.startswith("https://"):
        url = f"https://{url}"
    if not url.endswith(".supabase.co"):
        print("⚠️  URL should end with .supabase.co")
    
    print("\n🔑 Key options:")
    print("   • service_role JWT (eyJ...) - RECOMMENDED, full access")
    print("   • sb_secret_... - Limited, can't list users")
    print()
    
    key = input("Service Role Key: ").strip()
    if key.startswith("eyJ"):
        print("✅ Using JWT service_role key (full access)")
    elif key.startswith("sb_secret_"):
        print("⚠️  Using new secret key (limited - can't access admin APIs)")
        print("   For full functionality, use the JWT key from 'Legacy' tab")
    else:
        print("⚠️  Unrecognized key format")
    
    # Test connection
    print("\n🔄 Testing connection...")
    try:
        headers = get_headers(key)
        resp = requests.get(f"{url}/rest/v1/", headers=headers, timeout=10)
        if resp.status_code in [200, 404, 400]:
            print("✅ Connection successful!")
        else:
            print(f"⚠️  Got status {resp.status_code}, but saving anyway...")
    except Exception as e:
        print(f"⚠️  Connection test failed: {e}")
        print("Saving credentials anyway...")
    
    save_config({"url": url, "service_key": key})

def list_users(limit: int = 10, time_filter: str = None):
    """List users via Admin API (requires JWT key)."""
    url, key = get_credentials()
    
    if not is_jwt_key(key):
        print("❌ list-users requires a JWT service_role key (eyJ...)")
        print("   The sb_secret_ keys don't have admin API access.")
        print("   Get the JWT key from: Project Settings → API → Legacy tab → service_role")
        return None
    
    headers = get_headers(key)
    
    try:
        resp = requests.get(
            f"{url}/auth/v1/admin/users",
            headers=headers,
            params={"per_page": 1000},  # Get all users
            timeout=30
        )
        
        if not resp.ok:
            print(f"Error: {resp.status_code} - {resp.text}")
            return None
        
        data = resp.json()
        users = data.get("users", [])
        
        # Filter by time if specified
        if time_filter:
            now = datetime.now(timezone.utc)
            if time_filter == "today":
                cutoff = now - timedelta(hours=24)
            elif time_filter == "week":
                cutoff = now - timedelta(days=7)
            else:
                cutoff = None
            
            if cutoff:
                filtered = []
                for u in users:
                    created = u.get("created_at", "")
                    if created:
                        try:
                            # Parse ISO format
                            created_dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
                            if created_dt > cutoff:
                                filtered.append(u)
                        except:
                            pass
                users = filtered
        
        # Sort by created_at descending
        users.sort(key=lambda u: u.get("created_at", ""), reverse=True)
        
        # Limit results
        return {"users": users[:limit], "total": len(users)}
    
    except Exception as e:
        print(f"Error: {e}")
        return None

def count_users(time_filter: str = None):
    """Count users via Admin API."""
    url, key = get_credentials()
    
    if not is_jwt_key(key):
        print("❌ count requires a JWT service_role key (eyJ...)")
        return None
    
    headers = get_headers(key)
    
    try:
        resp = requests.get(
            f"{url}/auth/v1/admin/users",
            headers=headers,
            params={"per_page": 1000},
            timeout=30
        )
        
        if not resp.ok:
            print(f"Error: {resp.status_code} - {resp.text}")
            return None
        
        data = resp.json()
        users = data.get("users", [])
        
        # Filter by time if specified
        if time_filter:
            now = datetime.now(timezone.utc)
            if time_filter == "today":
                cutoff = now - timedelta(hours=24)
            elif time_filter == "week":
                cutoff = now - timedelta(days=7)
            else:
                cutoff = None
            
            if cutoff:
                count = 0
                for u in users:
                    created = u.get("created_at", "")
                    if created:
                        try:
                            created_dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
                            if created_dt > cutoff:
                                count += 1
                        except:
                            pass
                return {"count": count}
        
        return {"count": len(users)}
    
    except Exception as e:
        print(f"Error: {e}")
        return None

def run_query(sql: str):
    """Run a SQL query via RPC (requires setup)."""
    url, key = get_credentials()
    headers = get_headers(key)
    
    # Try calling exec_sql RPC if it exists
    try:
        resp = requests.post(
            f"{url}/rest/v1/rpc/exec_sql",
            headers=headers,
            json={"query": sql},
            timeout=30
        )
        
        if resp.status_code == 404:
            print("❌ Custom SQL queries require an RPC function.")
            print("   Create one in Supabase SQL Editor, or use list-users/users commands.")
            return None
        
        if resp.ok:
            return resp.json()
        else:
            print(f"Error: {resp.status_code} - {resp.text}")
            return None
    except Exception as e:
        print(f"Error: {e}")
        return None

def list_tables():
    """List all tables exposed via REST API."""
    url, key = get_credentials()
    headers = get_headers(key)
    
    try:
        resp = requests.get(f"{url}/rest/v1/", headers=headers, timeout=30)
        if resp.ok:
            spec = resp.json()
            if "definitions" in spec:
                tables = list(spec["definitions"].keys())
                return {"tables": tables}
            elif "paths" in spec:
                tables = [p.strip("/") for p in spec["paths"].keys() if p != "/"]
                return {"tables": tables}
        return {"tables": []}
    except Exception as e:
        print(f"Error: {e}")
        return None

def project_info():
    """Get project info."""
    url, key = get_credentials()
    project_ref = url.replace("https://", "").replace(".supabase.co", "")
    key_type = "JWT service_role" if is_jwt_key(key) else "sb_secret (limited)"
    
    return {
        "project_url": url,
        "project_ref": project_ref,
        "key_type": key_type,
        "status": "connected"
    }

def format_user(u: dict) -> str:
    """Format a user for display."""
    email = u.get("email", "no email")
    meta = u.get("user_metadata", {})
    name = meta.get("full_name") or meta.get("name") or ""
    created = u.get("created_at", "")[:10]
    provider = u.get("app_metadata", {}).get("provider", "email")
    
    if name:
        return f"{name} <{email}> ({provider}) - {created}"
    else:
        return f"{email} ({provider}) - {created}"

def main():
    parser = argparse.ArgumentParser(description="Supabase CLI")
    parser.add_argument("command", nargs="?", help="Command to run")
    parser.add_argument("args", nargs="*", help="Command arguments")
    parser.add_argument("--json", "-j", action="store_true", help="JSON output")
    parser.add_argument("--limit", "-n", type=int, default=10, help="Limit results")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        print("\nCommands:")
        print("  auth           - Set up authentication")
        print("  info           - Project info & key type")
        print("  users          - Count total users")
        print("  users-today    - Count new users (24h)")
        print("  users-week     - Count new users (7 days)")
        print("  list-users     - List users with details")
        print("  list-users-today - List new users (24h)")
        print("  tables         - List REST-exposed tables")
        print("  query <sql>    - Run SQL (requires RPC setup)")
        sys.exit(0)
    
    cmd = args.command.lower()
    
    if cmd == "auth":
        auth()
    
    elif cmd == "info":
        result = project_info()
        if result:
            print(f"⚡ Supabase Project")
            print(f"   URL: {result['project_url']}")
            print(f"   Ref: {result['project_ref']}")
            print(f"   Key: {result['key_type']}")
            print(f"   Status: {result['status']}")
    
    elif cmd == "users":
        result = count_users()
        if result:
            print(f"👥 Total users: {result.get('count', 'unknown')}")
    
    elif cmd == "users-today":
        result = count_users("today")
        if result:
            print(f"📈 New users (24h): {result.get('count', 'unknown')}")
    
    elif cmd == "users-week":
        result = count_users("week")
        if result:
            print(f"📊 New users (7 days): {result.get('count', 'unknown')}")
    
    elif cmd == "list-users":
        result = list_users(limit=args.limit)
        if result:
            if args.json:
                print(json.dumps(result, indent=2))
            else:
                print(f"👥 Users ({result['total']} total, showing {len(result['users'])}):\n")
                for u in result["users"]:
                    print(f"  • {format_user(u)}")
    
    elif cmd == "list-users-today":
        result = list_users(limit=args.limit, time_filter="today")
        if result:
            if args.json:
                print(json.dumps(result, indent=2))
            else:
                print(f"📈 New users in last 24h ({result['total']} total):\n")
                for u in result["users"]:
                    print(f"  • {format_user(u)}")
    
    elif cmd == "tables":
        result = list_tables()
        if result:
            tables = result.get("tables", [])
            if tables:
                print("📋 Tables exposed via REST API:")
                for t in tables:
                    print(f"  • {t}")
            else:
                print("📋 No tables exposed via REST API")
                print("   (auth.users is internal, use list-users command)")
    
    elif cmd == "query":
        sql = " ".join(args.args) if args.args else input("SQL: ")
        result = run_query(sql)
        if result:
            print(json.dumps(result, indent=2))
    
    else:
        print(f"Unknown command: {cmd}")
        print("Run without arguments to see available commands.")
        sys.exit(1)

if __name__ == "__main__":
    main()
