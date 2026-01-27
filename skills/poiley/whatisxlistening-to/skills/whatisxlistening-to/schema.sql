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
