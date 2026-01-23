#!/usr/bin/env python3
import json
import os
import sys
import urllib.request
import urllib.error
import time

# Environment variables
NPM_URL = os.environ.get("NPM_URL", "").rstrip("/")
NPM_EMAIL = os.environ.get("NPM_EMAIL", "")
NPM_PASSWORD = os.environ.get("NPM_PASSWORD", "")

TOKEN_FILE = "/root/.npm-token.json"

def get_token():
    """Retrieve or refresh the API token."""
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, "r") as f:
            data = json.load(f)
            # Check if token is still valid (using a 1-hour buffer)
            if data.get("expires_at", 0) > time.time() + 3600:
                return data["token"]

    # Login to get new token
    url = f"{NPM_URL}/api/tokens"
    payload = {"identity": NPM_EMAIL, "secret": NPM_PASSWORD}
    req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"})
    
    try:
        with urllib.request.urlopen(req) as res:
            result = json.loads(res.read().decode())
            token = result["token"]
            # Expiration is usually ISO string "2026-01-24T18:15:57.122Z"
            from datetime import datetime
            expires_str = result["expires"].replace("Z", "+00:00")
            expires_at = datetime.fromisoformat(expires_str).timestamp()
            
            with open(TOKEN_FILE, "w") as f:
                json.dump({"token": token, "expires_at": expires_at}, f)
            return token
    except Exception as e:
        print(f"Error authenticating with NPM: {e}", file=sys.stderr)
        sys.exit(1)

def api_call(endpoint, method="GET", payload=None):
    token = get_token()
    url = f"{NPM_URL}/api/{endpoint}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    data = json.dumps(payload).encode() if payload else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read().decode())
    except urllib.error.HTTPError as e:
        print(f"NPM API Error ({e.code}): {e.read().decode()}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error calling NPM API: {e}", file=sys.stderr)
        sys.exit(1)

def cmd_hosts():
    hosts = api_call("nginx/proxy-hosts")
    print(f"{'ID':<4} {'Domain':<30} {'Forward To':<30} {'SSL':<5} {'Status':<10}")
    print("-" * 85)
    for h in hosts:
        domain = h["domain_names"][0] if h["domain_names"] else "N/A"
        forward = f"{h['forward_host']}:{h['forward_port']}"
        ssl = "✅" if h["certificate_id"] else "❌"
        status = "🟢 ON" if h["enabled"] else "🔴 OFF"
        print(f"{h['id']:<4} {domain[:29]:<30} {forward[:29]:<30} {ssl:<5} {status:<10}")

def cmd_host(host_id):
    host = api_call(f"nginx/proxy-hosts/{host_id}")
    print(json.dumps(host, indent=2))

def cmd_toggle(host_id, enable=True):
    action = "enable" if enable else "disable"
    res = api_call(f"nginx/proxy-hosts/{host_id}/{action}", method="POST")
    print(f"Host {host_id} {action}d.")

def cmd_delete(host_id):
    api_call(f"nginx/proxy-hosts/{host_id}", method="DELETE")
    print(f"Host {host_id} deleted.")

def cmd_certs():
    certs = api_call("nginx/certificates")
    print(f"{'ID':<4} {'Nice Name':<30} {'Expires':<20}")
    print("-" * 55)
    for c in certs:
        print(f"{c['id']:<4} {c['nice_name'][:29]:<30} {c['expires_on'][:19]:<20}")

def main():
    if not NPM_URL or not NPM_EMAIL or not NPM_PASSWORD:
        print("Error: NPM_URL, NPM_EMAIL, and NPM_PASSWORD must be set in env.", file=sys.stderr)
        sys.exit(1)

    if len(sys.argv) < 2:
        print("Usage: npm_client.py <hosts|host|enable|disable|delete|certs> [args...]")
        sys.exit(0)

    cmd = sys.argv[1]
    if cmd == "hosts":
        cmd_hosts()
    elif cmd == "host":
        cmd_host(sys.argv[2])
    elif cmd == "enable":
        cmd_toggle(sys.argv[2], True)
    elif cmd == "disable":
        cmd_toggle(sys.argv[2], False)
    elif cmd == "delete":
        cmd_delete(sys.argv[2])
    elif cmd == "certs":
        cmd_certs()
    else:
        print(f"Unknown command: {cmd}")

if __name__ == "__main__":
    main()
