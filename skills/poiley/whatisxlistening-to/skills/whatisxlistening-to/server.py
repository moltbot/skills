#!/usr/bin/env python3
"""HTTP server for the listening dashboard with local SQLite sync."""
import http.server
import json
import os
import sqlite3
import threading
import time
import urllib.request
import urllib.parse
from datetime import datetime
from pathlib import Path

WEB_DIR = Path(__file__).parent / "web"
PORT = int(os.environ.get('PORT', 8765))
DB_PATH = os.environ.get('DB_PATH', str(Path(__file__).parent / 'scrobbles.db'))
SYNC_INTERVAL = int(os.environ.get('SYNC_INTERVAL', 300))  # 5 minutes

# Cached config (loaded once at startup)
_config = None
_db_lock = threading.Lock()


def load_config():
    """Load config from env vars (container) or file (local dev)."""
    api_key = os.environ.get('LASTFM_API_KEY')
    username = os.environ.get('LASTFM_USERNAME')
    display_name = os.environ.get('DISPLAY_NAME', username)

    if api_key and username:
        return {'api_key': api_key, 'username': username, 'display_name': display_name}

    config_path = Path.home() / ".config/lastfm/config.json"
    if config_path.exists():
        cfg = json.loads(config_path.read_text())
        cfg.setdefault('display_name', cfg.get('username'))
        return cfg

    return None


def get_config():
    """Get cached config, loading once if needed."""
    global _config
    if _config is None:
        _config = load_config()
    return _config


def reset_config():
    """Reset config cache (for testing)."""
    global _config
    _config = None


def get_db_path():
    """Get database path (supports testing override)."""
    return DB_PATH


def init_db(db_path=None):
    """Initialize SQLite database with schema."""
    path = db_path or get_db_path()
    conn = sqlite3.connect(path)
    try:
        schema_path = Path(__file__).parent / 'schema.sql'
        if schema_path.exists():
            conn.executescript(schema_path.read_text())
        else:
            conn.executescript('''
                CREATE TABLE IF NOT EXISTS scrobbles (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp INTEGER NOT NULL,
                    artist TEXT NOT NULL,
                    album TEXT,
                    track TEXT NOT NULL,
                    artist_mbid TEXT,
                    album_mbid TEXT,
                    track_mbid TEXT,
                    loved INTEGER DEFAULT 0,
                    UNIQUE(timestamp, artist, track)
                );
                CREATE INDEX IF NOT EXISTS idx_timestamp ON scrobbles(timestamp);
                CREATE INDEX IF NOT EXISTS idx_artist ON scrobbles(artist);
                CREATE INDEX IF NOT EXISTS idx_album ON scrobbles(album);
                CREATE INDEX IF NOT EXISTS idx_track ON scrobbles(track);
                CREATE TABLE IF NOT EXISTS sync_state (
                    key TEXT PRIMARY KEY,
                    value TEXT
                );
                CREATE TABLE IF NOT EXISTS albums (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    artist TEXT NOT NULL,
                    album TEXT NOT NULL,
                    image_url TEXT,
                    UNIQUE(artist, album)
                );
                CREATE INDEX IF NOT EXISTS idx_albums_lookup ON albums(artist, album);
            ''')
    finally:
        conn.close()


def api_call(params, config):
    """Make Last.fm API call."""
    params['format'] = 'json'
    params['api_key'] = config['api_key']
    url = "https://ws.audioscrobbler.com/2.0/?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=10) as resp:
        return json.loads(resp.read().decode())


def get_now_playing(config):
    """Get current or last played track (from Last.fm API - real-time)."""
    data = api_call({'method': 'user.getrecenttracks', 'user': config['username'], 'limit': 1}, config)
    tracks = data.get('recenttracks', {}).get('track', [])
    if tracks:
        t = tracks[0]
        is_playing = t.get('@attr', {}).get('nowplaying') == 'true'
        result = {
            'playing': is_playing,
            'track': t.get('name', ''),
            'artist': t.get('artist', {}).get('#text') or t.get('artist', {}).get('name', ''),
            'album': t.get('album', {}).get('#text', ''),
            'image': (t.get('image') or [{}])[-1].get('#text', '')
        }
        if not is_playing:
            result['last'] = {k: v for k, v in result.items() if k != 'playing'}
        return result
    return {'playing': False}


def get_stats(config, db_path=None):
    """Get listening statistics (from local DB for speed, with API fallback)."""
    path = db_path or get_db_path()
    
    # Try local DB first
    try:
        with _db_lock:
            conn = sqlite3.connect(path)
            try:
                cur = conn.cursor()
                
                # Total scrobbles
                cur.execute('SELECT COUNT(*) FROM scrobbles')
                total = cur.fetchone()[0]
                
                # Unique artists
                cur.execute('SELECT COUNT(DISTINCT artist) FROM scrobbles')
                artists = cur.fetchone()[0]
                
                # Today's scrobbles
                today_start = int(datetime.now().replace(hour=0, minute=0, second=0).timestamp())
                cur.execute('SELECT COUNT(*) FROM scrobbles WHERE timestamp >= ?', (today_start,))
                today = cur.fetchone()[0]
                
                # Calculate streak (consecutive days with scrobbles)
                streak = 0
                cur.execute('''
                    SELECT DISTINCT date(timestamp, 'unixepoch', 'localtime') as day
                    FROM scrobbles
                    ORDER BY day DESC
                ''')
                days = [row[0] for row in cur.fetchall()]
                
                if days:
                    from datetime import date, timedelta
                    today_date = date.today()
                    # Start from today or yesterday
                    check_date = today_date if days[0] == str(today_date) else today_date - timedelta(days=1)
                    
                    for day_str in days:
                        if day_str == str(check_date):
                            streak += 1
                            check_date -= timedelta(days=1)
                        elif day_str < str(check_date):
                            break
                
                # If we have data, return it
                if total > 0:
                    return {'total': total, 'artists': artists, 'today': today, 'streak': streak}
            finally:
                conn.close()
    except (sqlite3.Error, FileNotFoundError):
        pass
    
    # Fallback to API
    user_data = api_call({'method': 'user.getinfo', 'user': config['username']}, config)
    user = user_data.get('user', {})
    total = int(user.get('playcount', 0))

    artists_data = api_call({'method': 'user.gettopartists', 'user': config['username'], 'limit': 1}, config)
    artists = int(artists_data.get('topartists', {}).get('@attr', {}).get('total', 0))

    recent = api_call({'method': 'user.getrecenttracks', 'user': config['username'], 'limit': 200}, config)
    today_start = datetime.now().replace(hour=0, minute=0, second=0).timestamp()
    today = sum(1 for t in recent.get('recenttracks', {}).get('track', [])
                if t.get('date', {}).get('uts') and int(t['date']['uts']) >= today_start)
    
    # Calculate streak from recent tracks
    from datetime import date, timedelta
    streak = 0
    days_with_scrobbles = set()
    for t in recent.get('recenttracks', {}).get('track', []):
        ts = t.get('date', {}).get('uts')
        if ts:
            day = date.fromtimestamp(int(ts))
            days_with_scrobbles.add(day)
    
    if days_with_scrobbles:
        today_date = date.today()
        check_date = today_date if today_date in days_with_scrobbles else today_date - timedelta(days=1)
        while check_date in days_with_scrobbles:
            streak += 1
            check_date -= timedelta(days=1)

    return {'total': total, 'artists': artists, 'today': today, 'streak': streak}


def get_recent(config, limit=50, page=1, db_path=None):
    """Get recent tracks (from local DB for speed, with API fallback)."""
    path = db_path or get_db_path()
    
    # Try local DB first
    try:
        with _db_lock:
            conn = sqlite3.connect(path)
            try:
                cur = conn.cursor()
                
                offset = (page - 1) * limit
                cur.execute('''
                    SELECT s.timestamp, s.artist, s.album, s.track, a.image_url
                    FROM scrobbles s
                    LEFT JOIN albums a ON s.artist = a.artist AND s.album = a.album
                    ORDER BY s.timestamp DESC 
                    LIMIT ? OFFSET ?
                ''', (limit, offset))
                rows = cur.fetchall()
                
                # If we have data, return it
                if rows:
                    tracks = []
                    for ts, artist, album, track, image_url in rows:
                        dt = datetime.fromtimestamp(ts)
                        tracks.append({
                            'track': track,
                            'artist': artist,
                            'album': album or '',
                            'image': image_url or '',
                            'time': dt.strftime('%b %d, %H:%M')
                        })
                    return {'tracks': tracks}
            finally:
                conn.close()
    except (sqlite3.Error, FileNotFoundError):
        pass
    
    # Fallback to API
    data = api_call({'method': 'user.getrecenttracks', 'user': config['username'], 'limit': limit, 'page': page}, config)
    tracks = []
    for t in data.get('recenttracks', {}).get('track', []):
        if t.get('@attr', {}).get('nowplaying'):
            continue
        ts = t.get('date', {}).get('uts')
        dt = datetime.fromtimestamp(int(ts)) if ts else None
        tracks.append({
            'track': t.get('name', ''),
            'artist': t.get('artist', {}).get('#text') or t.get('artist', {}).get('name', ''),
            'album': t.get('album', {}).get('#text', ''),
            'image': (t.get('image') or [{}])[1].get('#text', '') if len(t.get('image') or []) > 1 else '',
            'time': dt.strftime('%b %d, %H:%M') if dt else ''
        })
    return {'tracks': tracks}


def sync_scrobbles(config, db_path=None, full_backfill=False):
    """Sync scrobbles from Last.fm to local database."""
    path = db_path or get_db_path()
    
    # Get last synced timestamp (quick lock)
    from_ts = None
    if not full_backfill:
        with _db_lock:
            conn = sqlite3.connect(path)
            try:
                cur = conn.cursor()
                cur.execute('SELECT MAX(timestamp) FROM scrobbles')
                row = cur.fetchone()
                if row[0]:
                    from_ts = row[0] + 1
            finally:
                conn.close()
    
    page = 1
    total_added = 0
    
    while True:
        # API call without holding lock
        params = {
            'method': 'user.getrecenttracks',
            'user': config['username'],
            'limit': 200,
            'page': page,
            'extended': 1
        }
        if from_ts:
            params['from'] = from_ts
        
        try:
            data = api_call(params, config)
        except Exception:
            break
        
        tracks = data.get('recenttracks', {}).get('track', [])
        if not tracks:
            break
        
        # Prepare records to insert
        records = []
        album_cache = {}  # (artist, album) -> image_url
        for t in tracks:
            if t.get('@attr', {}).get('nowplaying'):
                continue
            ts = t.get('date', {}).get('uts')
            if not ts:
                continue
            
            artist = t.get('artist', {}).get('#text') or t.get('artist', {}).get('name', '')
            album = t.get('album', {}).get('#text', '')
            
            # Extract image URL (prefer medium size, index 1)
            images = t.get('image') or []
            image_url = ''
            if len(images) > 1 and images[1].get('#text'):
                image_url = images[1]['#text']
            elif len(images) > 0 and images[0].get('#text'):
                image_url = images[0]['#text']
            
            # Cache album art (only if we have an image and album name)
            if album and image_url:
                album_cache[(artist, album)] = image_url
            
            records.append((
                int(ts),
                artist,
                album,
                t.get('name', ''),
                t.get('artist', {}).get('mbid', ''),
                t.get('album', {}).get('mbid', ''),
                t.get('mbid', ''),
                1 if t.get('loved') == '1' else 0
            ))
        
        # Insert with short lock
        if records or album_cache:
            with _db_lock:
                conn = sqlite3.connect(path)
                try:
                    cur = conn.cursor()
                    if records:
                        cur.executemany('''INSERT OR IGNORE INTO scrobbles 
                            (timestamp, artist, album, track, artist_mbid, album_mbid, track_mbid, loved)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)''', records)
                        total_added += cur.rowcount
                    # Update album cache
                    if album_cache:
                        cur.executemany('''INSERT OR REPLACE INTO albums 
                            (artist, album, image_url) VALUES (?, ?, ?)''',
                            [(a, al, img) for (a, al), img in album_cache.items()])
                    conn.commit()
                finally:
                    conn.close()
        
        total_pages = int(data.get('recenttracks', {}).get('@attr', {}).get('totalPages', 1))
        if page >= total_pages:
            break
        
        page += 1
        time.sleep(0.25)  # Be nice to API
    
    return total_added


def start_sync_thread(config, db_path=None):
    """Start background sync thread."""
    def sync_loop():
        path = db_path or get_db_path()
        init_db(path)
        
        # Initial sync
        try:
            sync_scrobbles(config, path)
        except Exception:
            pass
        
        # Periodic sync
        while True:
            time.sleep(SYNC_INTERVAL)
            try:
                sync_scrobbles(config, path)
            except Exception:
                pass
    
    thread = threading.Thread(target=sync_loop, daemon=True)
    thread.start()
    return thread


class Handler(http.server.SimpleHTTPRequestHandler):
    """HTTP request handler with Last.fm API endpoints."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB_DIR), **kwargs)

    def do_GET(self):
        """Handle GET requests."""
        try:
            parsed = urllib.parse.urlparse(self.path)
            path = parsed.path
            
            # Health check - no config required
            if path == '/healthz':
                self.send_response(200)
                self.send_header('Content-Type', 'text/plain')
                self.end_headers()
                self.wfile.write(b'ok')
                return
            
            config = get_config()
            if config is None:
                self.send_error_json(503, 'Not configured. Set LASTFM_API_KEY and LASTFM_USERNAME.')
                return

            query = urllib.parse.parse_qs(parsed.query)

            if path == '/api/config':
                self.send_json({
                    'username': config['username'],
                    'display_name': config.get('display_name', config['username'])
                })
            elif path == '/api/now':
                self.send_json(get_now_playing(config))
            elif path == '/api/stats':
                self.send_json(get_stats(config))
            elif path == '/api/recent':
                limit = int(query.get('limit', [50])[0])
                page = int(query.get('page', [1])[0])
                self.send_json(get_recent(config, limit, page))
            elif path == '/history':
                self.serve_file('history.html')
            else:
                super().do_GET()
        except urllib.error.HTTPError as e:
            self.send_error_json(502, f'Last.fm API error: {e.code}')
        except urllib.error.URLError as e:
            self.send_error_json(502, f'Network error: {e.reason}')
        except Exception as e:
            self.send_error_json(500, f'Internal error: {str(e)}')

    def serve_file(self, filename):
        """Serve a file from WEB_DIR."""
        filepath = WEB_DIR / filename
        if filepath.exists():
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(filepath.read_bytes())
        else:
            self.send_error(404)

    def send_json(self, data):
        """Send JSON response."""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def send_error_json(self, code, message):
        """Send JSON error response."""
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({'error': message}).encode())

    def log_message(self, format, *args):
        """Suppress default logging."""
        pass


def main():
    """Main entry point."""
    config = get_config()
    if config is None:
        print("❌ Not configured. Set LASTFM_API_KEY and LASTFM_USERNAME env vars.")
        print("   Or create ~/.config/lastfm/config.json")
        return 1
    
    # Initialize DB and start background sync
    init_db()
    start_sync_thread(config)
    
    print(f"🎵 Dashboard: http://localhost:{PORT}")
    print(f"📊 Syncing scrobbles every {SYNC_INTERVAL}s")
    http.server.HTTPServer(('', PORT), Handler).serve_forever()
    return 0


def run():
    """Entry point for module execution."""
    exit(main())


if __name__ == '__main__':  # pragma: no cover
    run()
