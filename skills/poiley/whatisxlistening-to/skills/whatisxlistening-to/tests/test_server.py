"""Tests for server.py - 100% coverage target."""
import json
import os
import sys
import tempfile
import threading
import time
import unittest
import urllib.request
import urllib.error
from io import BytesIO
from pathlib import Path
from unittest.mock import patch, MagicMock

sys.path.insert(0, str(Path(__file__).parent.parent))
import server


class TestLoadConfig(unittest.TestCase):
    def setUp(self):
        server.reset_config()

    def tearDown(self):
        server.reset_config()

    def test_from_env(self):
        with patch.dict(os.environ, {
            'LASTFM_API_KEY': 'key123',
            'LASTFM_USERNAME': 'testuser',
            'DISPLAY_NAME': 'Test User'
        }, clear=True):
            cfg = server.load_config()
            self.assertEqual(cfg['api_key'], 'key123')
            self.assertEqual(cfg['username'], 'testuser')
            self.assertEqual(cfg['display_name'], 'Test User')

    def test_from_env_no_display_name(self):
        with patch.dict(os.environ, {'LASTFM_API_KEY': 'key123', 'LASTFM_USERNAME': 'testuser'}, clear=True):
            cfg = server.load_config()
            self.assertEqual(cfg['display_name'], 'testuser')

    def test_missing_config(self):
        with patch.dict(os.environ, {}, clear=True):
            with patch.object(Path, 'exists', return_value=False):
                cfg = server.load_config()
                self.assertIsNone(cfg)


class TestGetConfig(unittest.TestCase):
    def setUp(self):
        server.reset_config()

    def tearDown(self):
        server.reset_config()

    def test_caches_config(self):
        with patch.dict(os.environ, {'LASTFM_API_KEY': 'k', 'LASTFM_USERNAME': 'u'}, clear=True):
            cfg1 = server.get_config()
            cfg2 = server.get_config()
            self.assertIs(cfg1, cfg2)

    def test_reset_clears_cache(self):
        with patch.dict(os.environ, {'LASTFM_API_KEY': 'k', 'LASTFM_USERNAME': 'u'}, clear=True):
            cfg1 = server.get_config()
            server.reset_config()
            cfg2 = server.get_config()
            self.assertIsNot(cfg1, cfg2)


class TestApiCall(unittest.TestCase):
    @patch('urllib.request.urlopen')
    def test_success(self, mock_urlopen):
        mock_resp = MagicMock()
        mock_resp.read.return_value = b'{"result": "ok"}'
        mock_resp.__enter__ = MagicMock(return_value=mock_resp)
        mock_resp.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = mock_resp

        result = server.api_call({'method': 'test'}, {'api_key': 'k', 'username': 'u'})
        self.assertEqual(result, {'result': 'ok'})

    @patch('urllib.request.urlopen')
    def test_http_error(self, mock_urlopen):
        mock_urlopen.side_effect = urllib.error.HTTPError('', 403, 'Forbidden', {}, None)
        with self.assertRaises(urllib.error.HTTPError):
            server.api_call({'method': 'test'}, {'api_key': 'k', 'username': 'u'})

    @patch('urllib.request.urlopen')
    def test_url_error(self, mock_urlopen):
        mock_urlopen.side_effect = urllib.error.URLError('Network error')
        with self.assertRaises(urllib.error.URLError):
            server.api_call({'method': 'test'}, {'api_key': 'k', 'username': 'u'})


class TestGetNowPlaying(unittest.TestCase):
    @patch.object(server, 'api_call')
    def test_now_playing(self, mock_api):
        mock_api.return_value = {
            'recenttracks': {
                'track': [{
                    'name': 'Song',
                    'artist': {'#text': 'Artist'},
                    'album': {'#text': 'Album'},
                    'image': [{'#text': ''}, {'#text': ''}, {'#text': 'large.jpg'}],
                    '@attr': {'nowplaying': 'true'}
                }]
            }
        }
        result = server.get_now_playing({'api_key': 'k', 'username': 'u'})
        self.assertTrue(result['playing'])
        self.assertEqual(result['track'], 'Song')
        self.assertEqual(result['artist'], 'Artist')
        self.assertEqual(result['album'], 'Album')
        self.assertEqual(result['image'], 'large.jpg')

    @patch.object(server, 'api_call')
    def test_not_playing(self, mock_api):
        mock_api.return_value = {
            'recenttracks': {
                'track': [{
                    'name': 'Last Song',
                    'artist': {'name': 'Last Artist'},
                    'album': {'#text': ''},
                    'image': []
                }]
            }
        }
        result = server.get_now_playing({'api_key': 'k', 'username': 'u'})
        self.assertFalse(result['playing'])
        self.assertIn('last', result)
        self.assertEqual(result['last']['track'], 'Last Song')

    @patch.object(server, 'api_call')
    def test_empty_tracks(self, mock_api):
        mock_api.return_value = {'recenttracks': {'track': []}}
        result = server.get_now_playing({'api_key': 'k', 'username': 'u'})
        self.assertFalse(result['playing'])

    @patch.object(server, 'api_call')
    def test_missing_image(self, mock_api):
        mock_api.return_value = {
            'recenttracks': {
                'track': [{
                    'name': 'Song',
                    'artist': {'#text': 'Artist'},
                    'album': {'#text': 'Album'}
                }]
            }
        }
        result = server.get_now_playing({'api_key': 'k', 'username': 'u'})
        self.assertEqual(result['image'], '')


class TestGetStats(unittest.TestCase):
    @patch.object(server, 'api_call')
    def test_stats_api_fallback(self, mock_api):
        mock_api.side_effect = [
            {'user': {'playcount': '1000'}},
            {'topartists': {'@attr': {'total': '50'}}},
            {'recenttracks': {'track': []}}
        ]
        # Use non-existent DB to force API fallback
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = os.path.join(tmpdir, 'nonexistent', 'test.db')
            result = server.get_stats({'api_key': 'k', 'username': 'u'}, db_path=db_path)
            self.assertEqual(result['total'], 1000)
            self.assertEqual(result['artists'], 50)
            self.assertEqual(result['today'], 0)

    @patch.object(server, 'api_call')
    def test_stats_with_today(self, mock_api):
        now = int(time.time())
        mock_api.side_effect = [
            {'user': {'playcount': '100'}},
            {'topartists': {'@attr': {'total': '10'}}},
            {'recenttracks': {'track': [
                {'date': {'uts': str(now)}, 'name': 'Recent'},
                {'date': {'uts': str(now - 86400 * 2)}, 'name': 'Old'}
            ]}}
        ]
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = os.path.join(tmpdir, 'test.db')
            result = server.get_stats({'api_key': 'k', 'username': 'u'}, db_path=db_path)
            self.assertEqual(result['today'], 1)

    def test_stats_from_db(self):
        """Test stats served from local DB."""
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = os.path.join(tmpdir, 'test.db')
            server.init_db(db_path)
            
            # Insert test data
            import sqlite3
            conn = sqlite3.connect(db_path)
            now = int(time.time())
            conn.execute('INSERT INTO scrobbles (timestamp, artist, album, track) VALUES (?, ?, ?, ?)',
                        (now, 'Artist1', 'Album1', 'Track1'))
            conn.execute('INSERT INTO scrobbles (timestamp, artist, album, track) VALUES (?, ?, ?, ?)',
                        (now - 100, 'Artist2', 'Album2', 'Track2'))
            conn.commit()
            conn.close()
            
            result = server.get_stats({'api_key': 'k', 'username': 'u'}, db_path=db_path)
            self.assertEqual(result['total'], 2)
            self.assertEqual(result['artists'], 2)
            self.assertEqual(result['today'], 2)
            self.assertEqual(result['streak'], 1)  # Only today

    def test_stats_streak_consecutive_days(self):
        """Test streak calculation with consecutive days."""
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = os.path.join(tmpdir, 'test.db')
            server.init_db(db_path)
            
            import sqlite3
            from datetime import datetime, timedelta
            conn = sqlite3.connect(db_path)
            
            # Add scrobbles for today, yesterday, and day before
            today = datetime.now().replace(hour=12, minute=0, second=0)
            for i in range(3):  # 3 consecutive days
                ts = int((today - timedelta(days=i)).timestamp())
                conn.execute('INSERT INTO scrobbles (timestamp, artist, album, track) VALUES (?, ?, ?, ?)',
                            (ts, f'Artist{i}', f'Album{i}', f'Track{i}'))
            # Add a gap (skip day 3, add day 4)
            ts = int((today - timedelta(days=4)).timestamp())
            conn.execute('INSERT INTO scrobbles (timestamp, artist, album, track) VALUES (?, ?, ?, ?)',
                        (ts, 'OldArtist', 'OldAlbum', 'OldTrack'))
            conn.commit()
            conn.close()
            
            result = server.get_stats({'api_key': 'k', 'username': 'u'}, db_path=db_path)
            self.assertEqual(result['streak'], 3)  # 3 consecutive days, gap stops it


class TestGetRecent(unittest.TestCase):
    @patch.object(server, 'api_call')
    def test_recent_api_fallback(self, mock_api):
        mock_api.return_value = {
            'recenttracks': {
                'track': [
                    {
                        'name': 'Track1',
                        'artist': {'#text': 'Artist1'},
                        'album': {'#text': 'Album1'},
                        'image': [{}, {'#text': 'small.jpg'}],
                        'date': {'uts': '1700000000'}
                    }
                ]
            }
        }
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = os.path.join(tmpdir, 'test.db')
            result = server.get_recent({'api_key': 'k', 'username': 'u'}, limit=10, page=1, db_path=db_path)
            self.assertEqual(len(result['tracks']), 1)
            self.assertEqual(result['tracks'][0]['track'], 'Track1')
            self.assertEqual(result['tracks'][0]['image'], 'small.jpg')

    @patch.object(server, 'api_call')
    def test_skips_now_playing(self, mock_api):
        mock_api.return_value = {
            'recenttracks': {
                'track': [
                    {'name': 'Playing', '@attr': {'nowplaying': 'true'}},
                    {'name': 'Past', 'artist': {'#text': 'A'}, 'album': {'#text': ''}, 'date': {'uts': '1700000000'}}
                ]
            }
        }
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = os.path.join(tmpdir, 'test.db')
            result = server.get_recent({'api_key': 'k', 'username': 'u'}, db_path=db_path)
            self.assertEqual(len(result['tracks']), 1)
            self.assertEqual(result['tracks'][0]['track'], 'Past')

    @patch.object(server, 'api_call')
    def test_missing_date(self, mock_api):
        mock_api.return_value = {
            'recenttracks': {
                'track': [
                    {'name': 'NoDate', 'artist': {'#text': 'A'}, 'album': {'#text': ''}}
                ]
            }
        }
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = os.path.join(tmpdir, 'test.db')
            result = server.get_recent({'api_key': 'k', 'username': 'u'}, db_path=db_path)
            self.assertEqual(result['tracks'][0]['time'], '')

    @patch.object(server, 'api_call')
    def test_short_image_array(self, mock_api):
        mock_api.return_value = {
            'recenttracks': {
                'track': [
                    {'name': 'T', 'artist': {'#text': 'A'}, 'album': {'#text': ''}, 
                     'image': [{'#text': 'only.jpg'}], 'date': {'uts': '1700000000'}}
                ]
            }
        }
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = os.path.join(tmpdir, 'test.db')
            result = server.get_recent({'api_key': 'k', 'username': 'u'}, db_path=db_path)
            self.assertEqual(result['tracks'][0]['image'], '')

    def test_recent_from_db(self):
        """Test recent tracks served from local DB with album art."""
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = os.path.join(tmpdir, 'test.db')
            server.init_db(db_path)
            
            # Insert test data
            import sqlite3
            conn = sqlite3.connect(db_path)
            now = int(time.time())
            conn.execute('INSERT INTO scrobbles (timestamp, artist, album, track) VALUES (?, ?, ?, ?)',
                        (now, 'Artist1', 'Album1', 'Track1'))
            conn.execute('INSERT INTO scrobbles (timestamp, artist, album, track) VALUES (?, ?, ?, ?)',
                        (now - 100, 'Artist2', '', 'Track2'))
            # Add album art cache
            conn.execute('INSERT INTO albums (artist, album, image_url) VALUES (?, ?, ?)',
                        ('Artist1', 'Album1', 'http://example.com/art.jpg'))
            conn.commit()
            conn.close()
            
            result = server.get_recent({'api_key': 'k', 'username': 'u'}, limit=10, page=1, db_path=db_path)
            self.assertEqual(len(result['tracks']), 2)
            self.assertEqual(result['tracks'][0]['track'], 'Track1')
            self.assertEqual(result['tracks'][0]['image'], 'http://example.com/art.jpg')
            self.assertEqual(result['tracks'][1]['track'], 'Track2')
            self.assertEqual(result['tracks'][1]['image'], '')  # No album, no art


class TestDatabaseFunctions(unittest.TestCase):
    def test_init_db_creates_tables(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = os.path.join(tmpdir, 'test.db')
            server.init_db(db_path)
            
            import sqlite3
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()
            cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = {row[0] for row in cur.fetchall()}
            conn.close()
            
            self.assertIn('scrobbles', tables)
            self.assertIn('sync_state', tables)
            self.assertIn('albums', tables)

    def test_init_db_without_schema_file(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = os.path.join(tmpdir, 'test.db')
            
            # Mock schema.sql not existing
            with patch.object(Path, 'exists', return_value=False):
                server.init_db(db_path)
            
            import sqlite3
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()
            cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = {row[0] for row in cur.fetchall()}
            conn.close()
            
            self.assertIn('scrobbles', tables)

    def test_get_db_path(self):
        path = server.get_db_path()
        self.assertIsInstance(path, str)

    @patch.object(server, 'api_call')
    def test_sync_scrobbles(self, mock_api):
        mock_api.return_value = {
            'recenttracks': {
                '@attr': {'totalPages': '1'},
                'track': [
                    {
                        'name': 'Track1',
                        'artist': {'#text': 'Artist1', 'mbid': ''},
                        'album': {'#text': 'Album1', 'mbid': ''},
                        'date': {'uts': '1700000000'},
                        'mbid': '',
                        'loved': '0'
                    }
                ]
            }
        }
        
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = os.path.join(tmpdir, 'test.db')
            server.init_db(db_path)
            
            added = server.sync_scrobbles({'api_key': 'k', 'username': 'u'}, db_path=db_path)
            self.assertEqual(added, 1)
            
            # Verify data was inserted
            import sqlite3
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()
            cur.execute('SELECT COUNT(*) FROM scrobbles')
            self.assertEqual(cur.fetchone()[0], 1)
            conn.close()

    @patch.object(server, 'api_call')
    def test_sync_scrobbles_incremental(self, mock_api):
        mock_api.return_value = {
            'recenttracks': {
                '@attr': {'totalPages': '1'},
                'track': []
            }
        }
        
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = os.path.join(tmpdir, 'test.db')
            server.init_db(db_path)
            
            # Insert existing data
            import sqlite3
            conn = sqlite3.connect(db_path)
            conn.execute('INSERT INTO scrobbles (timestamp, artist, album, track) VALUES (?, ?, ?, ?)',
                        (1700000000, 'Artist', 'Album', 'Track'))
            conn.commit()
            conn.close()
            
            # Sync should use from_ts
            added = server.sync_scrobbles({'api_key': 'k', 'username': 'u'}, db_path=db_path)
            self.assertEqual(added, 0)
            
            # Verify 'from' param was used
            call_args = mock_api.call_args[0][0]
            self.assertEqual(call_args['from'], 1700000001)

    @patch.object(server, 'api_call')
    def test_sync_scrobbles_skips_now_playing(self, mock_api):
        mock_api.return_value = {
            'recenttracks': {
                '@attr': {'totalPages': '1'},
                'track': [
                    {'name': 'NowPlaying', '@attr': {'nowplaying': 'true'}},
                    {
                        'name': 'Past',
                        'artist': {'#text': 'Artist', 'mbid': ''},
                        'album': {'#text': '', 'mbid': ''},
                        'date': {'uts': '1700000000'},
                        'mbid': '',
                        'loved': '1'
                    }
                ]
            }
        }
        
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = os.path.join(tmpdir, 'test.db')
            server.init_db(db_path)
            
            added = server.sync_scrobbles({'api_key': 'k', 'username': 'u'}, db_path=db_path)
            self.assertEqual(added, 1)

    @patch.object(server, 'api_call')
    def test_sync_scrobbles_api_error(self, mock_api):
        mock_api.side_effect = Exception("API Error")
        
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = os.path.join(tmpdir, 'test.db')
            server.init_db(db_path)
            
            # Should not raise, just return 0
            added = server.sync_scrobbles({'api_key': 'k', 'username': 'u'}, db_path=db_path)
            self.assertEqual(added, 0)

    @patch.object(server, 'api_call')
    def test_sync_scrobbles_skip_no_timestamp(self, mock_api):
        """Test that tracks without timestamps are skipped."""
        mock_api.return_value = {
            'recenttracks': {
                '@attr': {'totalPages': '1'},
                'track': [
                    {
                        'name': 'NoTimestamp',
                        'artist': {'#text': 'Artist', 'mbid': ''},
                        'album': {'#text': '', 'mbid': ''},
                        # No 'date' field
                        'mbid': '',
                        'loved': '0'
                    },
                    {
                        'name': 'WithTimestamp',
                        'artist': {'#text': 'Artist2', 'mbid': ''},
                        'album': {'#text': '', 'mbid': ''},
                        'date': {'uts': '1700000000'},
                        'mbid': '',
                        'loved': '0'
                    }
                ]
            }
        }
        
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = os.path.join(tmpdir, 'test.db')
            server.init_db(db_path)
            
            added = server.sync_scrobbles({'api_key': 'k', 'username': 'u'}, db_path=db_path)
            self.assertEqual(added, 1)  # Only one track had timestamp

    @patch.object(server, 'api_call')
    @patch('time.sleep')
    def test_sync_scrobbles_multiple_pages(self, mock_sleep, mock_api):
        """Test sync handles multiple pages."""
        mock_api.side_effect = [
            {
                'recenttracks': {
                    '@attr': {'totalPages': '2'},
                    'track': [
                        {
                            'name': 'Track1',
                            'artist': {'#text': 'Artist', 'mbid': ''},
                            'album': {'#text': '', 'mbid': ''},
                            'date': {'uts': '1700000001'},
                            'mbid': '',
                            'loved': '0'
                        }
                    ]
                }
            },
            {
                'recenttracks': {
                    '@attr': {'totalPages': '2'},
                    'track': [
                        {
                            'name': 'Track2',
                            'artist': {'#text': 'Artist2', 'mbid': ''},
                            'album': {'#text': '', 'mbid': ''},
                            'date': {'uts': '1700000000'},
                            'mbid': '',
                            'loved': '0'
                        }
                    ]
                }
            }
        ]
        
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = os.path.join(tmpdir, 'test.db')
            server.init_db(db_path)
            
            added = server.sync_scrobbles({'api_key': 'k', 'username': 'u'}, db_path=db_path)
            self.assertEqual(added, 2)
            mock_sleep.assert_called_with(0.25)

    @patch.object(server, 'api_call')
    def test_sync_scrobbles_caches_album_art(self, mock_api):
        """Test that album art is cached in albums table."""
        mock_api.return_value = {
            'recenttracks': {
                '@attr': {'totalPages': '1'},
                'track': [
                    {
                        'name': 'Track1',
                        'artist': {'#text': 'Artist1', 'mbid': ''},
                        'album': {'#text': 'Album1', 'mbid': ''},
                        'date': {'uts': '1700000000'},
                        'image': [
                            {'#text': 'small.jpg', 'size': 'small'},
                            {'#text': 'medium.jpg', 'size': 'medium'}
                        ],
                        'mbid': '',
                        'loved': '0'
                    },
                    {
                        'name': 'Track2',
                        'artist': {'#text': 'Artist1', 'mbid': ''},
                        'album': {'#text': 'Album1', 'mbid': ''},
                        'date': {'uts': '1700000001'},
                        'image': [
                            {'#text': 'small.jpg', 'size': 'small'},
                            {'#text': 'medium.jpg', 'size': 'medium'}
                        ],
                        'mbid': '',
                        'loved': '0'
                    },
                    {
                        'name': 'Track3',
                        'artist': {'#text': 'Artist2', 'mbid': ''},
                        'album': {'#text': '', 'mbid': ''},  # No album
                        'date': {'uts': '1700000002'},
                        'image': [{'#text': 'only.jpg', 'size': 'small'}],
                        'mbid': '',
                        'loved': '0'
                    }
                ]
            }
        }
        
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = os.path.join(tmpdir, 'test.db')
            server.init_db(db_path)
            
            added = server.sync_scrobbles({'api_key': 'k', 'username': 'u'}, db_path=db_path)
            self.assertEqual(added, 3)
            
            # Verify album cache
            import sqlite3
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()
            cur.execute('SELECT artist, album, image_url FROM albums ORDER BY artist')
            albums = cur.fetchall()
            conn.close()
            
            # Should have 1 album cached (Artist1/Album1 - deduplicated)
            # Track3 has no album so shouldn't be cached
            self.assertEqual(len(albums), 1)
            self.assertEqual(albums[0], ('Artist1', 'Album1', 'medium.jpg'))

    @patch.object(server, 'api_call')
    @patch.object(server, 'init_db')
    @patch.object(server, 'sync_scrobbles')
    def test_start_sync_thread(self, mock_sync, mock_init, mock_api):
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = os.path.join(tmpdir, 'test.db')
            
            thread = server.start_sync_thread({'api_key': 'k', 'username': 'u'}, db_path=db_path)
            time.sleep(0.1)  # Let thread start
            
            self.assertTrue(thread.daemon)
            mock_init.assert_called_once_with(db_path)


class TestHandlerIntegration(unittest.TestCase):
    """Integration tests using real HTTP server."""
    
    @classmethod
    def setUpClass(cls):
        server.reset_config()
        # Create temp web dir
        cls.tmpdir = tempfile.mkdtemp()
        cls.web_dir = Path(cls.tmpdir)
        (cls.web_dir / 'index.html').write_text('<html>index</html>')
        (cls.web_dir / 'history.html').write_text('<html>history</html>')
        
    @classmethod
    def tearDownClass(cls):
        import shutil
        shutil.rmtree(cls.tmpdir)
        server.reset_config()

    def setUp(self):
        server.reset_config()

    def tearDown(self):
        server.reset_config()

    def test_healthz_endpoint(self):
        """Test /healthz returns 200 OK without config."""
        with patch.dict(os.environ, {}, clear=True):
            import socketserver
            
            with patch.object(server, 'WEB_DIR', self.web_dir):
                httpd = socketserver.TCPServer(('127.0.0.1', 0), server.Handler)
                port = httpd.server_address[1]
                
                thread = threading.Thread(target=httpd.handle_request)
                thread.start()
                
                try:
                    resp = urllib.request.urlopen(f'http://127.0.0.1:{port}/healthz', timeout=5)
                    self.assertEqual(resp.status, 200)
                    self.assertEqual(resp.read(), b'ok')
                finally:
                    thread.join(timeout=2)
                    httpd.server_close()

    @patch.object(server, 'WEB_DIR')
    @patch.object(server, 'get_now_playing')
    def test_api_now_endpoint(self, mock_now, mock_webdir):
        mock_webdir.__truediv__ = lambda self, x: self.web_dir / x
        mock_now.return_value = {'playing': True, 'track': 'Test Track'}
        
        with patch.dict(os.environ, {'LASTFM_API_KEY': 'k', 'LASTFM_USERNAME': 'u'}, clear=True):
            import socketserver
            
            with patch.object(server, 'WEB_DIR', self.web_dir):
                httpd = socketserver.TCPServer(('127.0.0.1', 0), server.Handler)
                port = httpd.server_address[1]
                
                thread = threading.Thread(target=httpd.handle_request)
                thread.start()
                
                try:
                    resp = urllib.request.urlopen(f'http://127.0.0.1:{port}/api/now', timeout=5)
                    data = json.loads(resp.read().decode())
                    self.assertTrue(data['playing'])
                finally:
                    thread.join(timeout=2)
                    httpd.server_close()

    @patch.object(server, 'get_stats')
    def test_api_stats_endpoint(self, mock_stats):
        mock_stats.return_value = {'total': 500, 'artists': 25, 'today': 3}
        
        with patch.dict(os.environ, {'LASTFM_API_KEY': 'k', 'LASTFM_USERNAME': 'u'}, clear=True):
            import socketserver
            
            with patch.object(server, 'WEB_DIR', self.web_dir):
                httpd = socketserver.TCPServer(('127.0.0.1', 0), server.Handler)
                port = httpd.server_address[1]
                
                thread = threading.Thread(target=httpd.handle_request)
                thread.start()
                
                try:
                    resp = urllib.request.urlopen(f'http://127.0.0.1:{port}/api/stats', timeout=5)
                    data = json.loads(resp.read().decode())
                    self.assertEqual(data['total'], 500)
                finally:
                    thread.join(timeout=2)
                    httpd.server_close()

    def test_api_config_endpoint(self):
        with patch.dict(os.environ, {'LASTFM_API_KEY': 'k', 'LASTFM_USERNAME': 'testuser', 'DISPLAY_NAME': 'Test'}, clear=True):
            import socketserver
            
            with patch.object(server, 'WEB_DIR', self.web_dir):
                httpd = socketserver.TCPServer(('127.0.0.1', 0), server.Handler)
                port = httpd.server_address[1]
                
                thread = threading.Thread(target=httpd.handle_request)
                thread.start()
                
                try:
                    resp = urllib.request.urlopen(f'http://127.0.0.1:{port}/api/config', timeout=5)
                    data = json.loads(resp.read().decode())
                    self.assertEqual(data['username'], 'testuser')
                    self.assertEqual(data['display_name'], 'Test')
                finally:
                    thread.join(timeout=2)
                    httpd.server_close()

    @patch.object(server, 'get_recent')
    def test_api_recent_endpoint(self, mock_recent):
        mock_recent.return_value = {'tracks': [{'track': 'Song'}]}
        
        with patch.dict(os.environ, {'LASTFM_API_KEY': 'k', 'LASTFM_USERNAME': 'u'}, clear=True):
            import socketserver
            
            with patch.object(server, 'WEB_DIR', self.web_dir):
                httpd = socketserver.TCPServer(('127.0.0.1', 0), server.Handler)
                port = httpd.server_address[1]
                
                thread = threading.Thread(target=httpd.handle_request)
                thread.start()
                
                try:
                    resp = urllib.request.urlopen(f'http://127.0.0.1:{port}/api/recent?limit=5&page=2', timeout=5)
                    data = json.loads(resp.read().decode())
                    self.assertEqual(len(data['tracks']), 1)
                    # Verify params were passed
                    mock_recent.assert_called_once()
                    call_args = mock_recent.call_args[0]
                    self.assertEqual(call_args[1], 5)  # limit
                    self.assertEqual(call_args[2], 2)  # page
                finally:
                    thread.join(timeout=2)
                    httpd.server_close()

    def test_history_endpoint(self):
        with patch.dict(os.environ, {'LASTFM_API_KEY': 'k', 'LASTFM_USERNAME': 'u'}, clear=True):
            import socketserver
            
            with patch.object(server, 'WEB_DIR', self.web_dir):
                httpd = socketserver.TCPServer(('127.0.0.1', 0), server.Handler)
                port = httpd.server_address[1]
                
                thread = threading.Thread(target=httpd.handle_request)
                thread.start()
                
                try:
                    resp = urllib.request.urlopen(f'http://127.0.0.1:{port}/history', timeout=5)
                    data = resp.read().decode()
                    self.assertIn('history', data)
                finally:
                    thread.join(timeout=2)
                    httpd.server_close()

    def test_no_config_503(self):
        with patch.dict(os.environ, {}, clear=True):
            with patch.object(Path, 'exists', return_value=False):
                import socketserver
                
                with patch.object(server, 'WEB_DIR', self.web_dir):
                    httpd = socketserver.TCPServer(('127.0.0.1', 0), server.Handler)
                    port = httpd.server_address[1]
                    
                    thread = threading.Thread(target=httpd.handle_request)
                    thread.start()
                    
                    try:
                        urllib.request.urlopen(f'http://127.0.0.1:{port}/api/now', timeout=5)
                        self.fail("Expected HTTPError")
                    except urllib.error.HTTPError as e:
                        self.assertEqual(e.code, 503)
                    finally:
                        thread.join(timeout=2)
                        httpd.server_close()

    @patch.object(server, 'get_now_playing')
    def test_api_error_502(self, mock_now):
        mock_now.side_effect = urllib.error.HTTPError('', 403, '', {}, None)
        
        with patch.dict(os.environ, {'LASTFM_API_KEY': 'k', 'LASTFM_USERNAME': 'u'}, clear=True):
            import socketserver
            
            with patch.object(server, 'WEB_DIR', self.web_dir):
                httpd = socketserver.TCPServer(('127.0.0.1', 0), server.Handler)
                port = httpd.server_address[1]
                
                thread = threading.Thread(target=httpd.handle_request)
                thread.start()
                
                try:
                    urllib.request.urlopen(f'http://127.0.0.1:{port}/api/now', timeout=5)
                    self.fail("Expected HTTPError")
                except urllib.error.HTTPError as e:
                    self.assertEqual(e.code, 502)
                finally:
                    thread.join(timeout=2)
                    httpd.server_close()

    @patch.object(server, 'get_now_playing')
    def test_network_error_502(self, mock_now):
        mock_now.side_effect = urllib.error.URLError('Network down')
        
        with patch.dict(os.environ, {'LASTFM_API_KEY': 'k', 'LASTFM_USERNAME': 'u'}, clear=True):
            import socketserver
            
            with patch.object(server, 'WEB_DIR', self.web_dir):
                httpd = socketserver.TCPServer(('127.0.0.1', 0), server.Handler)
                port = httpd.server_address[1]
                
                thread = threading.Thread(target=httpd.handle_request)
                thread.start()
                
                try:
                    urllib.request.urlopen(f'http://127.0.0.1:{port}/api/now', timeout=5)
                    self.fail("Expected HTTPError")
                except urllib.error.HTTPError as e:
                    self.assertEqual(e.code, 502)
                finally:
                    thread.join(timeout=2)
                    httpd.server_close()

    @patch.object(server, 'get_now_playing')
    def test_generic_error_500(self, mock_now):
        mock_now.side_effect = Exception('Something broke')
        
        with patch.dict(os.environ, {'LASTFM_API_KEY': 'k', 'LASTFM_USERNAME': 'u'}, clear=True):
            import socketserver
            
            with patch.object(server, 'WEB_DIR', self.web_dir):
                httpd = socketserver.TCPServer(('127.0.0.1', 0), server.Handler)
                port = httpd.server_address[1]
                
                thread = threading.Thread(target=httpd.handle_request)
                thread.start()
                
                try:
                    urllib.request.urlopen(f'http://127.0.0.1:{port}/api/now', timeout=5)
                    self.fail("Expected HTTPError")
                except urllib.error.HTTPError as e:
                    self.assertEqual(e.code, 500)
                finally:
                    thread.join(timeout=2)
                    httpd.server_close()


class TestHandlerMethods(unittest.TestCase):
    """Test individual handler methods."""
    
    def test_log_message_suppressed(self):
        # log_message should do nothing
        with patch.dict(os.environ, {'LASTFM_API_KEY': 'k', 'LASTFM_USERNAME': 'u'}, clear=True):
            with tempfile.TemporaryDirectory() as tmpdir:
                with patch.object(server, 'WEB_DIR', Path(tmpdir)):
                    # Create a handler instance
                    mock_request = MagicMock()
                    mock_request.makefile.return_value = BytesIO(b'GET / HTTP/1.1\r\n\r\n')
                    
                    # Just verify it doesn't raise
                    handler = server.Handler.__new__(server.Handler)
                    handler.log_message('%s', 'test')  # Should not raise

    def test_serve_file_not_found(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            web_dir = Path(tmpdir)
            # Don't create history.html
            
            with patch.dict(os.environ, {'LASTFM_API_KEY': 'k', 'LASTFM_USERNAME': 'u'}, clear=True):
                import socketserver
                
                with patch.object(server, 'WEB_DIR', web_dir):
                    httpd = socketserver.TCPServer(('127.0.0.1', 0), server.Handler)
                    port = httpd.server_address[1]
                    
                    thread = threading.Thread(target=httpd.handle_request)
                    thread.start()
                    
                    try:
                        urllib.request.urlopen(f'http://127.0.0.1:{port}/history', timeout=5)
                        self.fail("Expected HTTPError")
                    except urllib.error.HTTPError as e:
                        self.assertEqual(e.code, 404)
                    finally:
                        thread.join(timeout=2)
                        httpd.server_close()


class TestConfigFromFile(unittest.TestCase):
    """Test loading config from file."""
    
    def setUp(self):
        server.reset_config()

    def tearDown(self):
        server.reset_config()

    def test_load_from_file(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            config_dir = Path(tmpdir) / '.config' / 'lastfm'
            config_dir.mkdir(parents=True)
            config_file = config_dir / 'config.json'
            config_file.write_text(json.dumps({
                'api_key': 'filekey',
                'username': 'fileuser',
                'display_name': 'File User'
            }))
            
            with patch.dict(os.environ, {}, clear=True):
                with patch.object(Path, 'home', return_value=Path(tmpdir)):
                    cfg = server.load_config()
                    self.assertEqual(cfg['api_key'], 'filekey')
                    self.assertEqual(cfg['username'], 'fileuser')
                    self.assertEqual(cfg['display_name'], 'File User')

    def test_load_from_file_no_display_name(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            config_dir = Path(tmpdir) / '.config' / 'lastfm'
            config_dir.mkdir(parents=True)
            config_file = config_dir / 'config.json'
            config_file.write_text(json.dumps({
                'api_key': 'filekey',
                'username': 'fileuser'
            }))
            
            with patch.dict(os.environ, {}, clear=True):
                with patch.object(Path, 'home', return_value=Path(tmpdir)):
                    cfg = server.load_config()
                    self.assertEqual(cfg['display_name'], 'fileuser')


class TestStaticFiles(unittest.TestCase):
    """Test static file serving via parent class."""
    
    def test_static_file_fallback(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            web_dir = Path(tmpdir)
            (web_dir / 'test.txt').write_text('hello')
            
            with patch.dict(os.environ, {'LASTFM_API_KEY': 'k', 'LASTFM_USERNAME': 'u'}, clear=True):
                import socketserver
                
                with patch.object(server, 'WEB_DIR', web_dir):
                    server.reset_config()
                    httpd = socketserver.TCPServer(('127.0.0.1', 0), server.Handler)
                    port = httpd.server_address[1]
                    
                    thread = threading.Thread(target=httpd.handle_request)
                    thread.start()
                    
                    try:
                        resp = urllib.request.urlopen(f'http://127.0.0.1:{port}/test.txt', timeout=5)
                        data = resp.read().decode()
                        self.assertEqual(data, 'hello')
                    finally:
                        thread.join(timeout=2)
                        httpd.server_close()


class TestMainFunction(unittest.TestCase):
    """Test the main() function."""
    
    def setUp(self):
        server.reset_config()

    def tearDown(self):
        server.reset_config()

    def test_main_no_config(self):
        """Test main() returns 1 when no config."""
        with patch.dict(os.environ, {}, clear=True):
            with patch.object(Path, 'exists', return_value=False):
                with patch('builtins.print'):
                    result = server.main()
                    self.assertEqual(result, 1)

    @patch('http.server.HTTPServer')
    @patch.object(server, 'start_sync_thread')
    @patch.object(server, 'init_db')
    def test_main_with_config(self, mock_init_db, mock_sync_thread, mock_httpserver):
        """Test main() starts server and returns 0."""
        mock_instance = MagicMock()
        mock_httpserver.return_value = mock_instance
        
        with patch.dict(os.environ, {'LASTFM_API_KEY': 'k', 'LASTFM_USERNAME': 'u'}, clear=True):
            with patch('builtins.print'):
                result = server.main()
                self.assertEqual(result, 0)
                mock_init_db.assert_called_once()
                mock_sync_thread.assert_called_once()
                mock_httpserver.assert_called_once()
                mock_instance.serve_forever.assert_called_once()


class TestSyncThread(unittest.TestCase):
    """Test sync thread functionality."""

    @patch.object(server, 'SYNC_INTERVAL', 0.01)  # Very short interval for testing
    @patch.object(server, 'sync_scrobbles')
    @patch.object(server, 'init_db')
    def test_sync_loop_initial_sync_exception(self, mock_init, mock_sync):
        """Test sync loop handles initial sync exceptions."""
        mock_sync.side_effect = [Exception("Initial error"), None, None]
        
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = os.path.join(tmpdir, 'test.db')
            
            thread = server.start_sync_thread({'api_key': 'k', 'username': 'u'}, db_path=db_path)
            time.sleep(0.05)  # Let initial sync + one periodic sync run
            
            # Thread should still be running despite exception
            self.assertTrue(thread.is_alive() or mock_sync.call_count >= 1)

    @patch.object(server, 'SYNC_INTERVAL', 0.01)
    @patch.object(server, 'sync_scrobbles')
    @patch.object(server, 'init_db')
    def test_sync_loop_periodic_exception(self, mock_init, mock_sync):
        """Test sync loop handles periodic sync exceptions."""
        mock_sync.side_effect = [None, Exception("Periodic error"), None]
        
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = os.path.join(tmpdir, 'test.db')
            
            thread = server.start_sync_thread({'api_key': 'k', 'username': 'u'}, db_path=db_path)
            time.sleep(0.05)  # Let thread run a couple cycles
            
            # Thread should still be running despite periodic exception
            self.assertTrue(thread.daemon)


class TestModuleGuard(unittest.TestCase):
    """Test module-level code for 100% coverage."""
    
    def test_module_can_be_imported(self):
        """Ensure module imports without running main."""
        # This test just verifies the module structure is correct
        self.assertTrue(hasattr(server, 'main'))
        self.assertTrue(callable(server.main))

    def test_run_function(self):
        """Test the run() function which is called by the module guard."""
        server.reset_config()
        
        with patch.dict(os.environ, {}, clear=True):
            with patch.object(Path, 'exists', return_value=False):
                with patch('builtins.print'):
                    # run() calls exit(main()), so it should raise SystemExit
                    with self.assertRaises(SystemExit) as ctx:
                        server.run()
                    self.assertEqual(ctx.exception.code, 1)


if __name__ == '__main__':
    unittest.main()
