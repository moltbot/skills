---
name: apple-music
version: 1.0.0
description: Apple Music integration via AppleScript (macOS) or MusicKit API
---

# Working with Apple Music

## Overview

Guide for integrating with Apple Music using AppleScript (macOS) or MusicKit API (cross-platform). Covers workflows, common pitfalls, and the critical library-first requirement.

**Recommended:** The [mcp-applemusic](https://github.com/epheterson/mcp-applemusic) MCP server wraps all this complexity into simple tools. See the comprehensive [MCP Tools Reference](#mcp-applemusic-tools-reference) below.

## When to Use

Invoke when users ask to:
- Manage Apple Music playlists
- Control playback
- Search catalog or library
- Add songs to library
- Access listening history

## Critical Rule: Library-First Workflow

**Most important concept:** You CANNOT add catalog songs directly to playlists.

Songs must be added to user's library first, regardless of method:
- ❌ Catalog ID → Playlist (doesn't work)
- ✅ Catalog ID → Library → Playlist (correct)

**Why:** Playlists use library IDs (`i.abc123`), not catalog IDs (`1234567890`).

## Platform Comparison

| Feature | AppleScript (macOS) | MusicKit API |
|---------|-------------------|--------------|
| Platform | macOS only | Any (needs auth) |
| Playlist management | ✅ Full access | ✅ API-created only |
| Playback control | ✅ Full | ❌ No |
| Catalog search | ❌ No | ✅ Yes |
| Library access | ✅ Instant | ✅ With tokens |
| Setup complexity | None | High (dev account, tokens) |

## AppleScript Patterns

### List Playlists

```applescript
tell application "Music"
    set playlistNames to name of every user playlist
    return playlistNames
end tell
```

Execute via Bash:
```bash
osascript -e 'tell application "Music" to return name of every user playlist'
```

### Get Playlist Tracks

```applescript
tell application "Music"
    set targetPlaylist to first user playlist whose name contains "Road Trip"
    set trackList to name of every track of targetPlaylist
    return trackList
end tell
```

### Play a Song

```applescript
tell application "Music"
    set targetTrack to first track of library playlist 1 whose name contains "Hey Jude"
    play targetTrack
end tell
```

**Note:** Track must be in library. AppleScript cannot access catalog.

### Add Track to Playlist

```applescript
tell application "Music"
    set targetPlaylist to first user playlist whose name contains "Workout Mix"
    set targetTrack to first track of library playlist 1 whose name contains "Wonderwall"
    duplicate targetTrack to targetPlaylist
end tell
```

**Critical:** Uses `duplicate` to copy library track to playlist. Song must exist in library first.

### Create Playlist

```applescript
tell application "Music"
    make new user playlist with properties {name:"Road Trip"}
end tell
```

### String Escaping

Always escape quotes in user input:
```python
def escape_applescript(s):
    return s.replace('\\', '\\\\').replace('"', '\\"')

safe_name = escape_applescript(user_input)
script = f'tell application "Music" to return name of playlist "{safe_name}"'
```

## MusicKit API Patterns

### Authentication Setup

**Requirements:**
1. Apple Developer account ($99/year)
2. MusicKit key (.p8 file)
3. Generate developer token (JWT, 180 day max)
4. Get user music token (browser OAuth flow)

**Developer Token Generation:**
```python
import jwt
import datetime

# Read private key
with open('AuthKey_XXXXXXXXXX.p8', 'r') as f:
    private_key = f.read()

# Generate token
headers = {
    'alg': 'ES256',
    'kid': 'YOUR_KEY_ID'
}
payload = {
    'iss': 'YOUR_TEAM_ID',
    'iat': int(datetime.datetime.now().timestamp()),
    'exp': int((datetime.datetime.now() + datetime.timedelta(days=180)).timestamp())
}
token = jwt.encode(payload, private_key, algorithm='ES256', headers=headers)
```

**User Token:** Requires browser OAuth flow to `https://authorize.music.apple.com/woa`

### Common Endpoints

**Base URL:** `https://api.music.apple.com/v1`

**Headers for all requests:**
```
Authorization: Bearer {developer_token}
Music-User-Token: {user_music_token}
```

### Search Catalog

```bash
GET /v1/catalog/{storefront}/search?term=wonderwall&types=songs&limit=10
```

Response includes catalog IDs (numeric like `1234567890`).

### Add to Library

```bash
POST /v1/me/library?ids[songs]=1234567890
```

**Returns:** Success/failure, but NOT the library ID.

### Get Library ID from Catalog ID

```bash
GET /v1/catalog/{storefront}/songs/1234567890/library
```

Returns library-scoped ID (like `i.abc123def`).

### Add to Playlist

```bash
POST /v1/me/library/playlists/{playlist_id}/tracks
Content-Type: application/json

{
  "data": [
    {
      "id": "i.abc123def",
      "type": "library-songs"
    }
  ]
}
```

**Critical:** Must use library IDs, NOT catalog IDs.

## Library-First Workflow Implementation

### Complete Flow: Add Catalog Song to Playlist

```python
# 1. Search catalog
response = requests.get(
    f"https://api.music.apple.com/v1/catalog/us/search",
    headers={"Authorization": f"Bearer {dev_token}"},
    params={"term": "Wonderwall Oasis", "types": "songs", "limit": 1}
)
catalog_id = response.json()['results']['songs']['data'][0]['id']

# 2. Add to library
requests.post(
    "https://api.music.apple.com/v1/me/library",
    headers={
        "Authorization": f"Bearer {dev_token}",
        "Music-User-Token": user_token
    },
    params={"ids[songs]": catalog_id}
)

# 3. Get library ID
response = requests.get(
    f"https://api.music.apple.com/v1/catalog/us/songs/{catalog_id}/library",
    headers={
        "Authorization": f"Bearer {dev_token}",
        "Music-User-Token": user_token
    }
)
library_id = response.json()['data'][0]['id']

# 4. Add to playlist
requests.post(
    f"https://api.music.apple.com/v1/me/library/playlists/{playlist_id}/tracks",
    headers={
        "Authorization": f"Bearer {dev_token}",
        "Music-User-Token": user_token,
        "Content-Type": "application/json"
    },
    json={
        "data": [{"id": library_id, "type": "library-songs"}]
    }
)
```

**This is why the workflow is complex!** 4 API calls just to add one song.

## Common Workflows

### List Playlists (macOS)
```bash
osascript -e 'tell application "Music" to return name of every user playlist'
```

### List Playlists (API)
```bash
GET /v1/me/library/playlists
```

### Search Library (macOS)
```applescript
tell application "Music"
    set matches to (every track of library playlist 1 whose name contains "Beatles")
    return name of matches
end tell
```

### Search Library (API)
```bash
GET /v1/me/library/search?term=beatles&types=library-songs
```

### Play Song (macOS only)
```applescript
tell application "Music"
    set targetTrack to first track of library playlist 1 whose name contains "Hey Jude"
    play targetTrack
end tell
```

**No API equivalent:** MusicKit API doesn't support playback control.

## Common Mistakes

### ❌ Using Catalog IDs in Playlist Endpoints

```python
# WRONG - will fail
requests.post(
    f"/v1/me/library/playlists/{id}/tracks",
    json={"data": [{"id": "1234567890", "type": "catalog-songs"}]}
)
```

**Fix:** Add to library first, get library ID, then add to playlist.

### ❌ Trying to Play Catalog Songs with AppleScript

```applescript
# WRONG - catalog not accessible
tell application "Music"
    play track id "1234567890"  -- Catalog ID won't work
end tell
```

**Fix:** Add to library first, then play.

### ❌ Forgetting to Escape AppleScript Strings

```python
# WRONG - will break on quotes
name = "Rock 'n Roll"
script = f'tell application "Music" to make playlist "{name}"'
```

**Fix:** Escape quotes: `Rock \'n Roll` or use proper escaping function.

### ❌ Not Handling Token Expiration

Developer tokens expire after 180 days max. User tokens can expire sooner.

**Fix:** Check expiration, regenerate proactively, handle 401 errors.

## mcp-applemusic Tools Reference

The [mcp-applemusic](https://github.com/epheterson/mcp-applemusic) MCP server handles all complexity: AppleScript escaping, API auth, library-first workflow, ID conversions, token management.

**Installation:**
```bash
git clone https://github.com/epheterson/mcp-applemusic.git
cd mcp-applemusic
python3 -m venv venv && source venv/bin/activate
pip install -e .
```

Add to Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "Apple Music": {
      "command": "/full/path/to/mcp-applemusic/venv/bin/python",
      "args": ["-m", "applemusic_mcp"]
    }
  }
}
```

### playlist(action=...)

| Action | Description | Platform |
|--------|-------------|----------|
| `list` | List all playlists | All |
| `tracks` | Get playlist tracks with filter/pagination | All |
| `search` | Search tracks within a playlist | All |
| `create` | Create new playlist | All |
| `add` | Smart add with auto_search (handles library-first) | All |
| `copy` | Copy playlist to editable version | All |
| `remove` | Remove tracks from playlist | macOS |
| `delete` | Delete playlist | macOS |
| `rename` | Rename playlist | macOS |

```python
playlist(action="list")
playlist(action="create", name="Road Trip", description="Summer vibes")
playlist(action="add", playlist="Road Trip", track="Hey Jude", artist="Beatles", auto_search=True)
playlist(action="tracks", playlist="Road Trip", limit=50)
playlist(action="remove", playlist="Road Trip", track="Hey Jude")
```

### library(action=...)

| Action | Description | Platform |
|--------|-------------|----------|
| `search` | Search your library | All |
| `add` | Add tracks/albums from catalog | All |
| `browse` | List songs/albums/artists/videos | All |
| `recently_played` | Recent listening history | All |
| `recently_added` | Recently added content | All |
| `rate` | Love/dislike/get/set ratings | All (stars: macOS) |
| `remove` | Remove tracks from library | macOS |

```python
library(action="search", query="Beatles", types="songs", limit=25)
library(action="add", album="Abbey Road", artist="Beatles")
library(action="browse", item_type="songs", limit=100)
library(action="recently_played", limit=30)
library(action="rate", rate_action="love", track="Hey Jude")
library(action="rate", rate_action="set", track="Hey Jude", stars=5)  # macOS
```

### catalog(action=...)

| Action | Description | Platform |
|--------|-------------|----------|
| `search` | Search Apple Music catalog | All |
| `album_tracks` | Get album tracks by name or ID | All |
| `album_details` | Full album metadata + track listing | All |
| `song_details` | Full song metadata | All |
| `artist_details` | Artist info and discography | All |
| `song_station` | Get radio station for song | All |
| `genres` | List all available genres | All |

```python
catalog(action="search", query="90s alternative", types="songs", limit=50)
catalog(action="album_details", album="Abbey Road", artist="Beatles")
catalog(action="artist_details", artist="The Beatles")
catalog(action="genres")
```

### discover(action=...)

| Action | Description | Platform |
|--------|-------------|----------|
| `recommendations` | Personalized recommendations | All |
| `heavy_rotation` | Your frequently played | All |
| `charts` | Apple Music charts | All |
| `top_songs` | Artist's popular songs | All |
| `similar_artists` | Find similar artists | All |
| `search_suggestions` | Autocomplete suggestions | All |
| `personal_station` | Your personal radio station | All |

```python
discover(action="recommendations")
discover(action="heavy_rotation")
discover(action="charts", chart_type="songs")
discover(action="top_songs", artist="The Beatles")
discover(action="similar_artists", artist="Radiohead")
```

### Playback (macOS only)

| Tool | Description |
|------|-------------|
| `play` | Play track, playlist, or album (with shuffle option) |
| `playback_control` | Play, pause, stop, next, previous, seek |
| `get_now_playing` | Current track info and player state |
| `playback_settings` | Get/set volume, shuffle, repeat |

```python
play(track="Hey Jude", artist="Beatles")
play(playlist="Road Trip", shuffle=True)
playback_control(command="pause")
playback_control(command="next")
playback_control(command="seek", position=120)  # seconds
get_now_playing()
playback_settings(volume=50)
playback_settings(shuffle=True, repeat="all")
```

### Utilities

| Tool | Description | Platform |
|------|-------------|----------|
| `config(action=...)` | Preferences, storefronts, cache, audit log | All |
| `check_auth_status()` | Verify tokens and API connection | All |
| `airplay(device_name=...)` | List or switch AirPlay devices | macOS |
| `reveal_in_music(track, artist)` | Show track in Music app | macOS |

```python
check_auth_status()
config(action="info")
config(action="set-pref", pref="auto_search", value=True)
config(action="list-storefronts")
airplay()  # list devices
airplay(device_name="Living Room")
```

### Output Options

Most tools support flexible output:

| Parameter | Values | Description |
|-----------|--------|-------------|
| `format` | `text`, `json`, `csv`, `none` | Response format |
| `export` | `none`, `csv`, `json` | Write file to disk |
| `full` | `True`/`False` | Include all metadata |

```python
library(action="search", query="beatles", format="json")
library(action="browse", item_type="songs", export="csv")
playlist(action="tracks", playlist="Favorites", export="json", full=True)
```

Exported files accessible via MCP resources: `exports://list`, `exports://{filename}`

## Quick Comparison

| Task | AppleScript | MusicKit API | mcp-applemusic |
|------|------------|--------------|----------------|
| List playlists | `osascript` | `GET /me/library/playlists` | `playlist(action="list")` |
| Play song | `play track` | ❌ Not supported | `play(track="...")` |
| Add to library | ❌ Manual | `POST /me/library` | `library(action="add")` |
| Search catalog | ❌ Not supported | `GET /catalog/.../search` | `catalog(action="search")` |
| Add to playlist | `duplicate` | 4-step workflow | `playlist(action="add", auto_search=True)` |
| Get recommendations | ❌ Not supported | `GET /me/recommendations` | `discover(action="recommendations")` |
| Rate tracks | ❌ Limited | `PUT /me/ratings` | `library(action="rate")` |
