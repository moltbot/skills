#!/usr/bin/env python3
"""Last.fm CLI - query listening data and manage local history."""
import json
import os
import sys
import sqlite3
import time
import urllib.request
import urllib.parse
from datetime import datetime
from pathlib import Path

CONFIG_PATH = Path.home() / ".config/lastfm/config.json"
DB_PATH = Path.home() / ".local/share/lastfm/scrobbles.db"
API_BASE = "https://ws.audioscrobbler.com/2.0/"

def load_config():
    if not CONFIG_PATH.exists():
        print("❌ Not configured yet. Run: lastfm setup", file=sys.stderr)
        sys.exit(1)
    config = json.loads(CONFIG_PATH.read_text())
    if config.get('api_key', '').startswith('YOUR_'):
        print("❌ Config not complete. Run: lastfm setup", file=sys.stderr)
        sys.exit(1)
    return config

def api_call(method, config, **params):
    params.update({
        'method': method,
        'api_key': config['api_key'],
        'user': config['username'],
        'format': 'json'
    })
    url = API_BASE + '?' + urllib.parse.urlencode(params)
    try:
        with urllib.request.urlopen(url, timeout=30) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        if e.code == 403:
            print("❌ Invalid API key. Get one at: https://www.last.fm/api/account/create", file=sys.stderr)
        elif e.code == 404:
            print(f"❌ User '{config['username']}' not found on Last.fm", file=sys.stderr)
        else:
            print(f"❌ API error: {e.code} {e.reason}", file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"❌ Network error: {e.reason}", file=sys.stderr)
        sys.exit(1)

def init_db():
    """Initialize the local database."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''CREATE TABLE IF NOT EXISTS scrobbles (
        timestamp INTEGER PRIMARY KEY,
        artist TEXT NOT NULL,
        album TEXT,
        track TEXT NOT NULL,
        artist_mbid TEXT,
        album_mbid TEXT,
        track_mbid TEXT,
        loved INTEGER DEFAULT 0
    )''')
    conn.execute('CREATE INDEX IF NOT EXISTS idx_artist ON scrobbles(artist)')
    conn.execute('CREATE INDEX IF NOT EXISTS idx_track ON scrobbles(track)')
    conn.commit()
    return conn

def parse_tracks(data):
    """Parse tracks from API response."""
    tracks = []
    for t in data.get('recenttracks', {}).get('track', []):
        if t.get('@attr', {}).get('nowplaying'):
            continue
        ts = t.get('date', {}).get('uts')
        if not ts:
            continue
        tracks.append({
            'timestamp': int(ts),
            'artist': t.get('artist', {}).get('#text') or t.get('artist', {}).get('name', ''),
            'album': t.get('album', {}).get('#text', ''),
            'track': t.get('name', ''),
            'artist_mbid': t.get('artist', {}).get('mbid', ''),
            'album_mbid': t.get('album', {}).get('mbid', ''),
            'track_mbid': t.get('mbid', ''),
            'loved': 1 if t.get('loved') == '1' else 0
        })
    return tracks

def cmd_setup():
    """Interactive setup wizard."""
    print("🎵 Last.fm CLI Setup\n")
    
    # Check existing config
    if CONFIG_PATH.exists():
        try:
            existing = json.loads(CONFIG_PATH.read_text())
            if not existing.get('api_key', '').startswith('YOUR_'):
                print(f"Config already exists at {CONFIG_PATH}")
                resp = input("Overwrite? [y/N] ").strip().lower()
                if resp != 'y':
                    print("Setup cancelled.")
                    return
        except:
            pass  # pragma: no cover
    
    print("You'll need a Last.fm API key.")
    print("Get one free at: https://www.last.fm/api/account/create\n")
    
    # Get API key
    api_key = input("API Key: ").strip()
    if not api_key:
        print("❌ API key required")
        return
    
    # Get username
    username = input("Last.fm username: ").strip()
    if not username:
        print("❌ Username required")
        return
    
    # Test the credentials
    print("\nTesting credentials...", end=" ", flush=True)
    test_config = {'api_key': api_key, 'username': username}
    try:
        params = {
            'method': 'user.getinfo',
            'api_key': api_key,
            'user': username,
            'format': 'json'
        }
        url = API_BASE + '?' + urllib.parse.urlencode(params)
        with urllib.request.urlopen(url, timeout=10) as r:
            data = json.loads(r.read().decode())
            playcount = data.get('user', {}).get('playcount', 0)
            print(f"✅ Found {int(playcount):,} scrobbles!\n")
    except urllib.error.HTTPError as e:
        if e.code == 403:
            print("❌ Invalid API key")
        elif e.code == 404:
            print(f"❌ User '{username}' not found")
        else:
            print(f"❌ Error: {e.code}")
        return
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    # Save config
    CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
    CONFIG_PATH.write_text(json.dumps({
        'api_key': api_key,
        'username': username
    }, indent=2))
    
    print(f"✅ Config saved to {CONFIG_PATH}")
    print("\nYou're all set! Try these commands:")
    print("  lastfm now       - See what's playing")
    print("  lastfm stats     - Your listening stats")
    print("  lastfm backfill  - Download full history (optional)")

def cmd_now(config):
    """Show current/last played track."""
    data = api_call('user.getrecenttracks', config, limit=1)
    tracks = data.get('recenttracks', {}).get('track', [])
    if not tracks:
        print("No recent tracks")
        return
    t = tracks[0]
    playing = t.get('@attr', {}).get('nowplaying') == 'true'
    artist = t.get('artist', {}).get('#text', t.get('artist', {}).get('name', ''))
    track = t.get('name', '')
    album = t.get('album', {}).get('#text', '')
    
    status = "🎵 Now playing" if playing else "⏸️  Last played"
    print(f"{status}: {artist} - {track}")
    if album:
        print(f"   Album: {album}")

def cmd_stats(config):
    """Show listening statistics."""
    user = api_call('user.getinfo', config).get('user', {})
    artists = api_call('user.gettopartists', config, limit=1)
    artist_count = artists.get('topartists', {}).get('@attr', {}).get('total', 0)
    
    print(f"Total scrobbles: {int(user.get('playcount', 0)):,}")
    print(f"Unique artists:  {int(artist_count):,}")
    
    reg = user.get('registered', {}).get('#text', '')
    if reg:
        try:
            reg_date = datetime.fromtimestamp(int(user.get('registered', {}).get('unixtime', 0)))
            print(f"Member since:    {reg_date.strftime('%B %Y')}")
        except:  # pragma: no cover
            pass  # pragma: no cover
    
    # Local DB stats if available
    if DB_PATH.exists():
        conn = sqlite3.connect(DB_PATH)
        cur = conn.execute('SELECT COUNT(*), COUNT(DISTINCT artist) FROM scrobbles')
        local_total, local_artists = cur.fetchone()
        conn.close()
        print(f"\n📀 Local DB: {local_total:,} scrobbles, {local_artists:,} artists")

def cmd_recent(config, limit=10):
    """Show recent tracks."""
    data = api_call('user.getrecenttracks', config, limit=limit)
    for t in data.get('recenttracks', {}).get('track', []):
        if t.get('@attr', {}).get('nowplaying'):
            prefix = "▶️  "
        else:
            ts = t.get('date', {}).get('uts')
            prefix = datetime.fromtimestamp(int(ts)).strftime('%H:%M') + " " if ts else ""
        artist = t.get('artist', {}).get('#text', t.get('artist', {}).get('name', ''))
        print(f"{prefix}{artist} - {t.get('name', '')}")

def cmd_backfill(config):
    """Backfill entire listening history to local DB."""
    conn = init_db()
    page, total_added = 1, 0
    
    print(f"📥 Backfilling {config['username']}...")
    print("   (This may take a few minutes for large libraries)\n")
    
    while True:
        print(f"  Page {page}...", end=' ', flush=True)
        try:
            data = api_call('user.getrecenttracks', config, limit=1000, page=page, extended=1)
        except SystemExit:
            break
            
        tracks = parse_tracks(data)
        if not tracks:
            print("done")
            break
        
        added = 0
        for t in tracks:
            try:
                conn.execute('''INSERT OR IGNORE INTO scrobbles 
                    (timestamp, artist, album, track, artist_mbid, album_mbid, track_mbid, loved)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                    (t['timestamp'], t['artist'], t['album'], t['track'],
                     t['artist_mbid'], t['album_mbid'], t['track_mbid'], t['loved']))
                added += conn.total_changes - total_added - added
            except:  # pragma: no cover
                pass  # pragma: no cover
        
        conn.commit()
        total_added += added
        print(f"+{added} ({total_added:,} total)")
        
        total_pages = int(data.get('recenttracks', {}).get('@attr', {}).get('totalPages', 1))
        if page >= total_pages:
            break
        page += 1
        time.sleep(0.25)  # Rate limit
    
    conn.close()
    print(f"\n✅ Backfill complete: {total_added:,} scrobbles")
    print(f"   Database: {DB_PATH}")

def cmd_sync(config):
    """Sync recent scrobbles to local DB (incremental)."""
    conn = init_db()
    
    # Get last timestamp
    cur = conn.execute('SELECT MAX(timestamp) FROM scrobbles')
    last = cur.fetchone()[0] or 0
    
    # Fetch new scrobbles
    params = {'limit': 200, 'extended': 1}
    if last:
        params['from'] = last + 1
    
    data = api_call('user.getrecenttracks', config, **params)
    tracks = parse_tracks(data)
    
    added = 0
    for t in tracks:
        try:
            conn.execute('''INSERT OR IGNORE INTO scrobbles 
                (timestamp, artist, album, track, artist_mbid, album_mbid, track_mbid, loved)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                (t['timestamp'], t['artist'], t['album'], t['track'],
                 t['artist_mbid'], t['album_mbid'], t['track_mbid'], t['loved']))
            added += 1
        except:  # pragma: no cover
            pass  # pragma: no cover
    
    conn.commit()
    conn.close()
    print(f"✅ Synced {added} new scrobbles")

def cmd_search(config, query):
    """Search local scrobble history."""
    if not DB_PATH.exists():
        print("❌ No local database. Run 'lastfm backfill' first.", file=sys.stderr)
        sys.exit(1)
    
    conn = sqlite3.connect(DB_PATH)
    cur = conn.execute('''
        SELECT timestamp, artist, track, album 
        FROM scrobbles 
        WHERE artist LIKE ? OR track LIKE ? OR album LIKE ?
        ORDER BY timestamp DESC 
        LIMIT 25
    ''', (f'%{query}%', f'%{query}%', f'%{query}%'))
    
    results = cur.fetchall()
    if not results:
        print(f"No results for '{query}'")
        conn.close()
        return
    
    print(f"🔍 Found {len(results)} matches for '{query}':\n")
    for ts, artist, track, album in results:
        dt = datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M')
        print(f"  {dt}  {artist} - {track}")
    
    conn.close()

def cmd_db_stats():
    """Show local database statistics."""
    if not DB_PATH.exists():
        print("❌ No local database. Run 'lastfm backfill' first.", file=sys.stderr)
        sys.exit(1)
    
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    cur.execute('SELECT COUNT(*) FROM scrobbles')
    total = cur.fetchone()[0]
    
    cur.execute('SELECT COUNT(DISTINCT artist) FROM scrobbles')
    artists = cur.fetchone()[0]
    
    cur.execute('SELECT COUNT(DISTINCT track) FROM scrobbles')
    tracks = cur.fetchone()[0]
    
    cur.execute('SELECT MIN(timestamp), MAX(timestamp) FROM scrobbles')
    first, last = cur.fetchone()
    
    cur.execute('SELECT artist, COUNT(*) as c FROM scrobbles GROUP BY artist ORDER BY c DESC LIMIT 5')
    top_artists = cur.fetchall()
    
    conn.close()
    
    print(f"📀 Local Database\n")
    print(f"   Location:   {DB_PATH}")
    print(f"   Scrobbles:  {total:,}")
    print(f"   Artists:    {artists:,}")
    print(f"   Tracks:     {tracks:,}")
    if first and last:
        print(f"   Range:      {datetime.fromtimestamp(first).strftime('%Y-%m-%d')} → {datetime.fromtimestamp(last).strftime('%Y-%m-%d')}")
    print(f"\n🏆 Top Artists:")
    for artist, count in top_artists:
        print(f"   {count:>6,}  {artist}")

def main():
    if len(sys.argv) < 2:
        print("🎵 Last.fm CLI\n")
        print("Usage: lastfm <command>\n")
        print("Commands:")
        print("  setup     Configure API credentials (start here!)")
        print("  now       What's currently playing")
        print("  stats     Your listening statistics")
        print("  recent    Recent tracks")
        print("  backfill  Download full history to local DB")
        print("  sync      Sync new scrobbles to local DB")
        print("  search    Search your local history")
        print("  db        Local database stats")
        return
    
    cmd = sys.argv[1]
    
    if cmd in ('setup', 'init'):
        cmd_setup()
        return
    
    config = load_config()
    
    if cmd == 'now':
        cmd_now(config)
    elif cmd == 'stats':
        cmd_stats(config)
    elif cmd == 'recent':
        limit = int(sys.argv[2]) if len(sys.argv) > 2 else 10
        cmd_recent(config, limit)
    elif cmd == 'backfill':
        cmd_backfill(config)
    elif cmd == 'sync':
        cmd_sync(config)
    elif cmd == 'search' and len(sys.argv) > 2:
        cmd_search(config, ' '.join(sys.argv[2:]))
    elif cmd == 'db':
        cmd_db_stats()
    else:
        print(f"❌ Unknown command: {cmd}")
        print("Run 'lastfm' for help")

if __name__ == '__main__':
    main()
