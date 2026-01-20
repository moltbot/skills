#!/usr/bin/env python3
"""
Manage multiple OpenAI Codex accounts by swapping auth.json.
"""

import json
import os
import sys
import shutil
import base64
import argparse
from pathlib import Path

CODEX_DIR = Path.home() / ".codex"
AUTH_FILE = CODEX_DIR / "auth.json"
ACCOUNTS_DIR = CODEX_DIR / "accounts"

def ensure_dirs():
    if not ACCOUNTS_DIR.exists():
        ACCOUNTS_DIR.mkdir(parents=True)

def decode_jwt_payload(token):
    try:
        # JWT is header.payload.signature
        parts = token.split('.')
        if len(parts) != 3:
            return {}
        
        payload = parts[1]
        # Add padding if needed
        payload += '=' * (-len(payload) % 4)
        
        decoded = base64.urlsafe_b64decode(payload)
        return json.loads(decoded)
    except Exception:
        return {}

def _read_token_exp_seconds(data: dict) -> int | None:
    """Try to extract an expiry timestamp (unix seconds) from known JWT fields.

    Note: access/id tokens are intentionally short-lived (minutes/hours).
    """
    try:
        tokens = data.get('tokens', {}) if isinstance(data, dict) else {}
        if not isinstance(tokens, dict):
            return None

        # Prefer id_token (has email claim), fall back to access_token.
        for key in ("id_token", "access_token"):
            tok = tokens.get(key)
            if isinstance(tok, str) and tok.count('.') == 2:
                payload = decode_jwt_payload(tok)
                exp = payload.get('exp')
                if isinstance(exp, (int, float)) and exp > 0:
                    return int(exp)
        return None
    except Exception:
        return None


def get_account_info(auth_path):
    """Return email and other info from an auth.json file."""
    if not auth_path.exists():
        return None

    try:
        with open(auth_path, 'r') as f:
            data = json.load(f)

        exp = _read_token_exp_seconds(data)
        last_refresh = data.get('last_refresh') if isinstance(data, dict) else None

        # Look for id_token in tokens object
        tokens = data.get('tokens', {})
        id_token = tokens.get('id_token')

        if id_token:
            payload = decode_jwt_payload(id_token)
            return {
                'email': payload.get('email', 'unknown'),
                'name': payload.get('name'),
                'exp': exp,
                'last_refresh': last_refresh,
                'raw': data
            }

        # Fallback if structure is different
        return {'email': 'unknown', 'exp': exp, 'last_refresh': last_refresh, 'raw': data}
    except Exception as e:
        return {'email': 'error', 'error': str(e)}

def is_current(stored_path):
    """Check if the stored file matches the current auth.json."""
    if not AUTH_FILE.exists() or not stored_path.exists():
        return False
    
    # Simple content comparison
    with open(AUTH_FILE, 'rb') as f1, open(stored_path, 'rb') as f2:
        return f1.read() == f2.read()

def resolve_active_profile():
    """Return (name, email) for the currently active auth.json if it matches a saved profile."""
    if not AUTH_FILE.exists():
        return None

    for f in ACCOUNTS_DIR.glob("*.json"):
        if is_current(f):
            info = get_account_info(f) or {}
            return f.stem, info.get("email", "unknown")

    # Active but not saved
    info = get_account_info(AUTH_FILE) or {}
    return None, info.get("email", "unknown")


def _format_expiry(exp_seconds: int | None) -> str:
    """Format access/id token expiry (short-lived). Mostly useful for debugging."""
    if not exp_seconds:
        return ""
    try:
        import time
        now = int(time.time())
        delta = exp_seconds - now
        if delta <= 0:
            return "(token expired)"
        if delta < 60:
            return "(token <1m)"
        mins = delta // 60
        if mins < 120:
            return f"(token {mins}m)"
        hours = mins // 60
        rem_m = mins % 60
        if hours < 48:
            return f"(token {hours}h{rem_m:02d}m)"
        days = hours // 24
        return f"(token {days}d)"
    except Exception:
        return ""


def _format_refreshed(last_refresh: str | None, fallback_path: Path | None = None) -> str:
    """More useful than token exp: when this snapshot was last refreshed."""
    try:
        from datetime import datetime, timezone

        ts: datetime | None = None
        if isinstance(last_refresh, str) and last_refresh.strip():
            raw = last_refresh.strip()
            # Python doesn't like trailing Z with fromisoformat.
            if raw.endswith('Z'):
                raw = raw[:-1] + '+00:00'
            ts = datetime.fromisoformat(raw)
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
        elif fallback_path is not None and fallback_path.exists():
            ts = datetime.fromtimestamp(fallback_path.stat().st_mtime, tz=timezone.utc)

        if not ts:
            return "refreshed ?"

        now = datetime.now(timezone.utc)
        delta = now - ts
        seconds = int(delta.total_seconds())
        if seconds < 60:
            return "refreshed just now"
        mins = seconds // 60
        if mins < 120:
            return f"refreshed {mins}m ago"
        hours = mins // 60
        rem_m = mins % 60
        if hours < 48:
            return f"refreshed {hours}h{rem_m:02d}m ago"
        days = hours // 24
        return f"refreshed {days}d ago"
    except Exception:
        return "refreshed ?"


def _parse_refresh_dt(last_refresh: str | None, fallback_path: Path | None = None):
    try:
        from datetime import datetime, timezone

        ts: datetime | None = None
        if isinstance(last_refresh, str) and last_refresh.strip():
            raw = last_refresh.strip()
            if raw.endswith('Z'):
                raw = raw[:-1] + '+00:00'
            ts = datetime.fromisoformat(raw)
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
        elif fallback_path is not None and fallback_path.exists():
            ts = datetime.fromtimestamp(fallback_path.stat().st_mtime, tz=timezone.utc)
        return ts
    except Exception:
        return None


def cmd_list(verbose: bool = False, json_mode: bool = False):
    ensure_dirs()

    accounts = []
    max_name = 0

    for f in sorted(ACCOUNTS_DIR.glob("*.json")):
        name = f.stem
        max_name = max(max_name, len(name))
        active = is_current(f)
        info = get_account_info(f) or {}
        last_refresh = info.get('last_refresh')
        exp = info.get('exp')
        accounts.append((name, active, last_refresh, exp, f))

    if not accounts:
        if json_mode:
            print(json.dumps({"accounts": [], "active": None}, indent=2))
        else:
            print("(no accounts saved)")
        return

    if json_mode:
        from datetime import datetime, timezone
        import time

        now = datetime.now(timezone.utc)
        now_epoch = int(time.time())
        payload_accounts = []
        active_name = None

        for name, active, last_refresh, exp, path in accounts:
            if active:
                active_name = name
            ts = _parse_refresh_dt(last_refresh, fallback_path=path)
            age_s = int((now - ts).total_seconds()) if ts else None
            ttl_s = int(exp - now_epoch) if isinstance(exp, int) else None
            token_exp_iso = (
                datetime.fromtimestamp(exp, tz=timezone.utc).isoformat().replace('+00:00', 'Z')
                if isinstance(exp, int)
                else None
            )
            payload_accounts.append(
                {
                    "name": name,
                    "active": bool(active),
                    "last_refresh": last_refresh if isinstance(last_refresh, str) else None,
                    "refreshed_age_seconds": age_s,
                    "token_exp": token_exp_iso,
                    "token_ttl_seconds": ttl_s,
                }
            )

        print(
            json.dumps(
                {
                    "generated_at": now.isoformat(),
                    "active": active_name,
                    "accounts": payload_accounts,
                },
                indent=2,
            )
        )
        return

    lines = []
    for name, active, last_refresh, exp, path in accounts:
        display = f"**{name}**" if name else name

        if verbose:
            left = f"- {display.ljust(max_name + 4)}  {_format_refreshed(last_refresh, fallback_path=path)}"
            extra = _format_expiry(exp)
            if extra:
                left += f"  {extra}"
        else:
            left = f"- {display.ljust(max_name + 4)}"

        if active:
            left += "  ✅"
        lines.append(left)

    header = "Codex Accounts"
    underline = "—" * len(header)
    print(header + "\n" + underline + "\n" + "\n".join(lines))

def _resolve_matching_account_by_email(email: str) -> Path | None:
    """Find an existing saved account file whose stored email matches."""
    want = (email or "").strip().lower()
    if not want:
        return None

    matches: list[Path] = []
    for f in ACCOUNTS_DIR.glob("*.json"):
        info = get_account_info(f) or {}
        got = (info.get("email") or "").strip().lower()
        if got and got == want:
            matches.append(f)

    if not matches:
        return None

    # Prefer filename matching the local-part if present.
    local = want.split("@", 1)[0]
    for f in matches:
        if f.stem.strip().lower() == local:
            return f

    return matches[0]


def _resolve_unique_name_path(base_name: str) -> tuple[str, Path]:
    base = (base_name or "account").strip() or "account"
    target = ACCOUNTS_DIR / f"{base}.json"
    if not target.exists():
        return base, target

    suffix = 2
    while True:
        candidate_name = f"{base}-{suffix}"
        candidate = ACCOUNTS_DIR / f"{candidate_name}.json"
        if not candidate.exists():
            return candidate_name, candidate
        suffix += 1


def cmd_add(name_override: str | None = None):
    """Add accounts by ALWAYS running a fresh login flow.

    Behavior:
    - Always triggers a new browser login.
    - After login, detects the email from ~/.codex/auth.json.
    - If we already have a saved account with that SAME email: update that file.
    - Otherwise: save a new file named from the email local-part (or --name).

    Interactive (TTY): can repeat.
    Non-interactive (Clawdbot): single-shot.
    """
    ensure_dirs()

    interactive = bool(sys.stdin.isatty() and sys.stdout.isatty())

    while True:
        do_browser_login()

        if not AUTH_FILE.exists():
            print("❌ Login did not produce ~/.codex/auth.json.")
            if not interactive:
                return
            retry = input("Retry login? [Y/n] ").strip().lower()
            if retry == 'n':
                return
            continue

        info = get_account_info(AUTH_FILE) or {}
        email = info.get('email', 'unknown')
        current_email = (email or '').strip().lower() if isinstance(email, str) else ''
        print(f"Found active session for: {email}")

        suggested = (
            email.split('@', 1)[0]
            if isinstance(email, str) and '@' in email
            else "account"
        ).strip() or "account"

        # 1) If we already have this identity stored under ANY name, update that file.
        match = _resolve_matching_account_by_email(current_email)
        if match is not None:
            # Only overwrite if different.
            if is_current(match):
                print(f"ℹ️  '{match.stem}' already up to date for {current_email}")
            else:
                print(f"ℹ️  Updating existing account '{match.stem}' ({current_email})")
                shutil.copy2(AUTH_FILE, match)
            print(f"✅ Saved '{match.stem}' ({email})")
        else:
            # 2) Otherwise, create a new snapshot with default (or override) name.
            base_name = (name_override or suggested).strip() or suggested
            name, target = _resolve_unique_name_path(base_name)
            shutil.copy2(AUTH_FILE, target)
            print(f"✅ Saved '{name}' ({email})")

        if not interactive:
            return

        more = input("\nAdd another account? [y/N] ").strip().lower()
        if more != 'y':
            return

def do_browser_login():
    import subprocess
    import time

    print("\n🚀 Starting browser login (codex logout && codex login)...")

    before_mtime = AUTH_FILE.stat().st_mtime if AUTH_FILE.exists() else 0

    subprocess.run(["codex", "logout"], capture_output=True)

    # This typically opens the system browser and completes via localhost callback.
    # Prevent auto-opening the default browser. This avoids instantly re-logging
    # into whatever account is already signed into your primary browser profile.
    # You'll open the printed URL in the browser/profile you want.
    env = dict(os.environ)
    env["BROWSER"] = "/usr/bin/false"

    process = subprocess.Popen(
        ["codex", "login"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        env=env,
    )

    # Stream output (so you can see errors) and watch auth.json for changes.
    start = time.time()
    timeout_s = 15 * 60
    
    while True:
        # Non-blocking-ish read: poll process and attempt readline
        if process.stdout:
            line = process.stdout.readline()
            if line:
                print(line.rstrip())
                # Common device-auth policy message; helpful to surface
                if "device code" in line.lower() and "admin" in line.lower():
                    pass

        if AUTH_FILE.exists():
            mtime = AUTH_FILE.stat().st_mtime
            if mtime > before_mtime:
                # auth.json updated; likely success
                break

        if process.poll() is not None:
            # Process ended; if auth didn't change, it's likely failure
            break

        if time.time() - start > timeout_s:
            process.kill()
            print("\n❌ Login timed out after 15 minutes.")
            return

        time.sleep(0.2)

    process.wait(timeout=5)

    if AUTH_FILE.exists() and AUTH_FILE.stat().st_mtime > before_mtime:
        print("\n✅ Login successful (auth.json updated).")
    else:
        print("\n❌ Login did not update auth.json (may have failed).")


def do_device_login():
    import subprocess
    import re
    
    print("\n🚀 Starting Device Flow Login...")
    
    # 1. Logout first to be safe
    subprocess.run(["codex", "logout"], capture_output=True)
    
    # 2. Start login process
    process = subprocess.Popen(
        ["codex", "login", "--device-auth"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    
    url = None
    code = None
    
    print("Waiting for code...")
    
    # Read output line by line to find URL and code
    while True:
        line = process.stdout.readline()
        if not line and process.poll() is not None:
            break
        if not line:
            continue
            
        # print(f"DEBUG: {line.strip()}")
        
        # Capture URL
        if "https://auth.openai.com" in line:
            url = line.strip()
            # Remove ANSI color codes
            url = re.sub(r'\x1b\[[0-9;]*m', '', url)
        
        # Capture Code (usually 8 chars like ABCD-1234)
        # Regex for code: 4 chars - 5 chars (actually usually 4-4 or 4-5)
        # The output says: "Enter this one-time code"
        # Then next line has the code
        if "Enter this one-time code" in line:
            # The next line should be the code
            code_line = process.stdout.readline()
            code = code_line.strip()
            code = re.sub(r'\x1b\[[0-9;]*m', '', code)
            
            if url and code:
                print("\n" + "="*50)
                print(f"👉 OPEN THIS: {url}")
                print(f"🔑 ENTER CODE: {code}")
                print("="*50 + "\n")
                print("Waiting for you to complete login in browser...")
                break
    
    # Wait for process to finish (it exits after successful login)
    process.wait()
    
    if process.returncode == 0:
        print("\n✅ Login successful!")
    else:
        print("\n❌ Login failed or timed out.")

def _get_quota_cache_file(name):
    """Get path to quota cache file for an account."""
    return ACCOUNTS_DIR / f".{name}.quota.json"

def _save_quota_cache(name, limits):
    """Save quota to cache file."""
    import time
    cache_file = _get_quota_cache_file(name)
    try:
        with open(cache_file, 'w') as f:
            json.dump({
                'rate_limits': limits,
                'cached_at': time.time()
            }, f)
    except:
        pass

def _load_quota_cache(name, max_age_hours=24):
    """Load quota from cache if fresh enough."""
    import time
    cache_file = _get_quota_cache_file(name)
    if not cache_file.exists():
        return None
    try:
        with open(cache_file, 'r') as f:
            data = json.load(f)
        cached_at = data.get('cached_at', 0)
        if time.time() - cached_at < max_age_hours * 3600:
            return data.get('rate_limits')
    except:
        pass
    return None

def _get_quota_for_account(name):
    """Get quota info for an account by switching to it and pinging Codex."""
    import subprocess
    import time
    from datetime import datetime
    
    source = ACCOUNTS_DIR / f"{name}.json"
    if not source.exists():
        return None
    
    # Switch to account
    shutil.copy(source, AUTH_FILE)
    
    # Record time before ping to only look at sessions created after
    before_ping = time.time()
    
    # Ping codex to get fresh session
    try:
        subprocess.run(
            ["codex", "-p", "PING"],
            capture_output=True,
            timeout=30
        )
    except Exception:
        pass
    
    time.sleep(0.5)
    
    # Find sessions created AFTER our ping and extract rate limits
    sessions_dir = CODEX_DIR / "sessions"
    now = datetime.now()
    
    for day_offset in range(2):
        date = datetime.fromordinal(now.toordinal() - day_offset)
        day_dir = sessions_dir / f"{date.year:04d}" / f"{date.month:02d}" / f"{date.day:02d}"
        
        if not day_dir.exists():
            continue
        
        # Only consider sessions created after our ping
        jsonl_files = [f for f in day_dir.glob("*.jsonl") if f.stat().st_mtime > before_ping]
        if not jsonl_files:
            continue
            
        # Check each new session for rate_limits
        for session_file in sorted(jsonl_files, key=lambda f: f.stat().st_mtime, reverse=True):
            with open(session_file, 'r') as f:
                lines = f.readlines()
            
            for line in reversed(lines):
                if not line.strip():
                    continue
                try:
                    event = json.loads(line)
                    if (event.get('payload', {}).get('type') == 'token_count' and
                        event.get('payload', {}).get('rate_limits')):
                        limits = event['payload']['rate_limits']
                        _save_quota_cache(name, limits)
                        return limits
                except json.JSONDecodeError:
                    continue
    
    # No fresh rate_limits - try cached data
    cached = _load_quota_cache(name)
    if cached:
        return cached
    
    return None

def cmd_auto(json_mode=False):
    """Switch to the account with the most quota available."""
    ensure_dirs()
    
    accounts = [f.stem for f in ACCOUNTS_DIR.glob("*.json") if not f.name.startswith('.')]
    if not accounts:
        if json_mode:
            print('{"error": "No accounts found"}')
        else:
            print("❌ No accounts found")
        return
    
    # Save current account to restore if needed
    original_account = None
    if AUTH_FILE.exists():
        for acct_file in ACCOUNTS_DIR.glob("*.json"):
            if acct_file.read_bytes() == AUTH_FILE.read_bytes():
                original_account = acct_file.stem
                break
    
    if not json_mode:
        print(f"🔄 Checking quota for {len(accounts)} account(s)...\n")
    
    results = {}
    for name in accounts:
        if not json_mode:
            print(f"  → {name}...", end=" ", flush=True)
        
        limits = _get_quota_for_account(name)
        
        if limits:
            weekly_pct = limits['secondary']['used_percent']
            daily_pct = limits['primary']['used_percent']
            results[name] = {
                'weekly_used': weekly_pct,
                'daily_used': daily_pct,
                'available': 100 - weekly_pct
            }
            if not json_mode:
                print(f"weekly {weekly_pct:.0f}% used")
        else:
            results[name] = {'error': 'could not get quota'}
            if not json_mode:
                print("❌ failed")
    
    # Find best account (lowest weekly usage)
    valid = {k: v for k, v in results.items() if 'available' in v}
    
    if not valid:
        if original_account:
            shutil.copy(ACCOUNTS_DIR / f"{original_account}.json", AUTH_FILE)
        if json_mode:
            print(json.dumps({"error": "No valid quota data", "results": results}))
        else:
            print("\n❌ Could not get quota for any account")
        return
    
    best = max(valid.keys(), key=lambda k: valid[k]['available'])
    
    # Check if already on best account
    already_active = (original_account == best)
    
    # Only switch if not already active
    if not already_active:
        shutil.copy(ACCOUNTS_DIR / f"{best}.json", AUTH_FILE)
    
    if json_mode:
        print(json.dumps({
            "switched_to": best,
            "already_active": already_active,
            "weekly_used": valid[best]['weekly_used'],
            "available": valid[best]['available'],
            "all_accounts": results
        }, indent=2))
    else:
        if already_active:
            print(f"\n✅ Already on best account: {best}")
        else:
            print(f"\n✅ Switched to: {best}")
        print(f"   Weekly quota: {valid[best]['weekly_used']:.0f}% used ({valid[best]['available']:.0f}% available)")
        
        # Show comparison
        print(f"\nAll accounts:")
        for name, data in sorted(results.items(), key=lambda x: x[1].get('weekly_used', 999)):
            if 'error' in data:
                print(f"   {name}: {data['error']}")
            else:
                marker = " ←" if name == best else ""
                print(f"   {name}: {data['weekly_used']:.0f}% weekly{marker}")

def cmd_use(name):
    ensure_dirs()
    source = ACCOUNTS_DIR / f"{name}.json"
    
    if not source.exists():
        print(f"❌ Account '{name}' not found.")
        print("Available accounts:")
        for f in ACCOUNTS_DIR.glob("*.json"):
            print(f" - {f.stem}")
        return
    
    # Backup current if it's not saved? 
    # Maybe risky to overwrite silently, but that's what a switcher does.
    
    shutil.copy2(source, AUTH_FILE)
    info = get_account_info(source)
    print(f"✅ Switched to account: {name} ({info.get('email')})")

def sync_current_login_to_snapshot() -> None:
    """Persist the CURRENT ~/.codex/auth.json back into the matching named snapshot.

    This makes snapshots behave like "last known good refreshed token state".

    Rules:
    - If the current login's email matches an existing snapshot (any name), update that file.
    - If it doesn't match any snapshot, create a new snapshot using the email local-part.

    This runs silently (no prints) because it's executed on every invocation.
    """
    try:
        ensure_dirs()
        if not AUTH_FILE.exists():
            return

        info = get_account_info(AUTH_FILE) or {}
        email = (info.get("email") or "").strip().lower()
        if not email or email in ("unknown", "error"):
            return

        match = _resolve_matching_account_by_email(email)
        if match is not None:
            if not is_current(match):
                shutil.copy2(AUTH_FILE, match)
            return

        # No match: create a new snapshot with local-part name
        suggested = email.split("@", 1)[0].strip() or "account"
        name, target = _resolve_unique_name_path(suggested)
        shutil.copy2(AUTH_FILE, target)
    except Exception:
        # Never fail the command because of sync.
        return


def main():
    parser = argparse.ArgumentParser(description="Codex Account Switcher")
    subparsers = parser.add_subparsers(dest="command")

    list_parser = subparsers.add_parser("list", help="List saved accounts")
    list_parser.add_argument(
        "--verbose",
        action="store_true",
        help="Show extra diagnostics (refresh age + token TTL)",
    )
    list_parser.add_argument(
        "--json",
        action="store_true",
        help="Output verbose information as JSON",
    )

    add_parser = subparsers.add_parser("add", help="Run a fresh login and save as an account")
    add_parser.add_argument(
        "--name",
        help="Optional account name (non-interactive default). If omitted, uses email local-part.",
    )

    use_parser = subparsers.add_parser("use", help="Switch to an account")
    use_parser.add_argument("name", help="Name of the account to switch to")

    auto_parser = subparsers.add_parser("auto", help="Switch to the account with most quota available")
    auto_parser.add_argument("--json", action="store_true", help="Output as JSON")

    args = parser.parse_args()

    # Always persist the currently active login back into its named snapshot.
    sync_current_login_to_snapshot()

    if args.command == "add":
        cmd_add(name_override=getattr(args, "name", None))
    elif args.command == "use":
        cmd_use(args.name)
    elif args.command == "auto":
        cmd_auto(json_mode=bool(getattr(args, "json", False)))
    else:
        cmd_list(
            verbose=bool(getattr(args, "verbose", False)),
            json_mode=bool(getattr(args, "json", False)),
        )

if __name__ == "__main__":
    main()
