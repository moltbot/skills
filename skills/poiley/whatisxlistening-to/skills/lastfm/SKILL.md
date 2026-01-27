---
name: lastfm
description: Access Last.fm listening history, music stats, and discovery. Query recent tracks, top artists/albums/tracks, loved tracks, similar artists, and global charts.
---

# Last.fm API Skill

Access Last.fm listening history, music stats, and discovery.

## Configuration

**Required env vars** (add to your shell profile or optionally `~/.clawdbot/.env`):
- `LASTFM_API_KEY` — your Last.fm API key ([get one here](https://www.last.fm/api/account/create))
- `LASTFM_USER` — your Last.fm username

**Base URL**: `http://ws.audioscrobbler.com/2.0/`  
**Docs**: https://lastfm-docs.github.io/api-docs/

## Example Output

Here's what 17+ years of scrobbling looks like:

```
Total scrobbles: 519,778
Unique artists: 13,763
Unique tracks: 68,435
Unique albums: 33,637

Top Artists (all time):
• System of a Down (52,775 plays)
• Eminem (15,400 plays)
• Dashboard Confessional (10,166 plays)
• Edguy (10,161 plays)
• Metallica (9,927 plays)

Top Tracks (all time):
• System of a Down - Aerials (1,405 plays)
• System of a Down - Toxicity (1,215 plays)
• System of a Down - Sugar (1,149 plays)
• System of a Down - Chop Suey (1,116 plays)
• System of a Down - Prison Song (1,102 plays)
```

## Quick Reference

All requests use GET with these base params:
```
?api_key=$LASTFM_API_KEY&format=json&user=$LASTFM_USER
```

### User Endpoints

#### Recent Tracks (what's playing / recently played)
```bash
curl -s "http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=$LASTFM_USER&api_key=$LASTFM_API_KEY&format=json&limit=10"
```
- First track with `@attr.nowplaying=true` is currently playing
- Returns: artist, track name, album, timestamp, images

#### User Info (profile stats)
```bash
curl -s "http://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=$LASTFM_USER&api_key=$LASTFM_API_KEY&format=json"
```
- Returns: playcount, artist_count, track_count, album_count, registered date

#### Top Artists
```bash
curl -s "http://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=$LASTFM_USER&api_key=$LASTFM_API_KEY&format=json&period=7day&limit=10"
```
- `period`: overall | 7day | 1month | 3month | 6month | 12month

#### Top Albums
```bash
curl -s "http://ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=$LASTFM_USER&api_key=$LASTFM_API_KEY&format=json&period=7day&limit=10"
```

#### Top Tracks
```bash
curl -s "http://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=$LASTFM_USER&api_key=$LASTFM_API_KEY&format=json&period=7day&limit=10"
```

#### Loved Tracks
```bash
curl -s "http://ws.audioscrobbler.com/2.0/?method=user.getlovedtracks&user=$LASTFM_USER&api_key=$LASTFM_API_KEY&format=json&limit=10"
```

#### Weekly Charts
```bash
# Weekly artist chart
curl -s "http://ws.audioscrobbler.com/2.0/?method=user.getweeklyartistchart&user=$LASTFM_USER&api_key=$LASTFM_API_KEY&format=json"

# Weekly track chart
curl -s "http://ws.audioscrobbler.com/2.0/?method=user.getweeklytrackchart&user=$LASTFM_USER&api_key=$LASTFM_API_KEY&format=json"

# Weekly album chart
curl -s "http://ws.audioscrobbler.com/2.0/?method=user.getweeklyalbumchart&user=$LASTFM_USER&api_key=$LASTFM_API_KEY&format=json"
```

### Artist/Track/Album Info

#### Artist Info
```bash
curl -s "http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=Tame+Impala&api_key=$LASTFM_API_KEY&format=json&username=$LASTFM_USER"
```
- Adding `username` includes user's playcount for that artist

#### Similar Artists
```bash
curl -s "http://ws.audioscrobbler.com/2.0/?method=artist.getsimilar&artist=Tame+Impala&api_key=$LASTFM_API_KEY&format=json&limit=10"
```

#### Artist Top Tracks
```bash
curl -s "http://ws.audioscrobbler.com/2.0/?method=artist.gettoptracks&artist=Tame+Impala&api_key=$LASTFM_API_KEY&format=json&limit=10"
```

#### Track Info
```bash
curl -s "http://ws.audioscrobbler.com/2.0/?method=track.getinfo&artist=Tame+Impala&track=The+Less+I+Know+The+Better&api_key=$LASTFM_API_KEY&format=json&username=$LASTFM_USER"
```

#### Similar Tracks
```bash
curl -s "http://ws.audioscrobbler.com/2.0/?method=track.getsimilar&artist=Tame+Impala&track=Elephant&api_key=$LASTFM_API_KEY&format=json&limit=10"
```

#### Album Info
```bash
curl -s "http://ws.audioscrobbler.com/2.0/?method=album.getinfo&artist=Tame+Impala&album=Currents&api_key=$LASTFM_API_KEY&format=json&username=$LASTFM_USER"
```

### Search

#### Search Artists
```bash
curl -s "http://ws.audioscrobbler.com/2.0/?method=artist.search&artist=tame&api_key=$LASTFM_API_KEY&format=json&limit=5"
```

#### Search Tracks
```bash
curl -s "http://ws.audioscrobbler.com/2.0/?method=track.search&track=elephant&api_key=$LASTFM_API_KEY&format=json&limit=5"
```

#### Search Albums
```bash
curl -s "http://ws.audioscrobbler.com/2.0/?method=album.search&album=currents&api_key=$LASTFM_API_KEY&format=json&limit=5"
```

### Charts (Global)

```bash
# Top artists globally
curl -s "http://ws.audioscrobbler.com/2.0/?method=chart.gettopartists&api_key=$LASTFM_API_KEY&format=json&limit=10"

# Top tracks globally
curl -s "http://ws.audioscrobbler.com/2.0/?method=chart.gettoptracks&api_key=$LASTFM_API_KEY&format=json&limit=10"
```

### Tags

```bash
# Top albums for a tag/genre
curl -s "http://ws.audioscrobbler.com/2.0/?method=tag.gettopalbums&tag=psychedelic&api_key=$LASTFM_API_KEY&format=json&limit=10"

# Top artists for a tag
curl -s "http://ws.audioscrobbler.com/2.0/?method=tag.gettopartists&tag=brazilian&api_key=$LASTFM_API_KEY&format=json&limit=10"
```

## Useful jq Filters

For JSON processing, see the [jq skill on ClawdHub](https://clawdhub.com/skills/jq).

```bash
# Recent tracks: artist - track
jq '.recenttracks.track[] | "\(.artist["#text"]) - \(.name)"'

# Top artists: name (playcount)
jq '.topartists.artist[] | "\(.name) (\(.playcount))"'

# Check if currently playing
jq '.recenttracks.track[0] | if .["@attr"].nowplaying == "true" then "Now playing: \(.artist["#text"]) - \(.name)" else "Last played: \(.artist["#text"]) - \(.name)" end'
```

## Notes

- No auth needed for read-only endpoints (just API key)
- Rate limit: be reasonable, no hard limit documented
- URL-encode artist/track/album names (spaces → `+` or `%20`)
- Images come in sizes: small, medium, large, extralarge
