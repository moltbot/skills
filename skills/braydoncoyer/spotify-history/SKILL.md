---
name: spotify-history
description: Access Spotify listening history, top artists/tracks, and get personalized recommendations via the Spotify Web API. Use when fetching a user's recent plays, analyzing music taste, or generating recommendations. Requires one-time OAuth setup.
---

# Spotify History & Recommendations

Access Spotify listening history and get personalized recommendations.

## Setup (One-Time)

### Quick Setup (Recommended)

Run the setup wizard:
```bash
bash skills/spotify-history/scripts/setup.sh
```

This guides you through:
1. Creating a Spotify Developer App
2. Saving credentials securely
3. Authorizing access

### Manual Setup

1. **Create Spotify Developer App**
   - Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
   - Click **Create App**
   - Fill in:
     - **App name:** `Clawd` (or any name)
     - **App description:** `Personal assistant integration`
     - **Redirect URI:** `http://127.0.0.1:8888/callback` ⚠️ Use exact URL!
   - Save and copy **Client ID** and **Client Secret**

2. **Store Credentials**

   **Option A: Credentials file (recommended)**
   ```bash
   mkdir -p credentials
   cat > credentials/spotify.json <<EOF
   {
     "client_id": "your_client_id",
     "client_secret": "your_client_secret"
   }
   EOF
   chmod 600 credentials/spotify.json
   ```

   **Option B: Environment variables**
   ```bash
   # Add to ~/.zshrc or ~/.bashrc
   export SPOTIFY_CLIENT_ID="your_client_id"
   export SPOTIFY_CLIENT_SECRET="your_client_secret"
   ```

3. **Authenticate**

   **With browser (local machine):**
   ```bash
   python3 scripts/spotify-auth.py
   ```

   **Headless (no browser):**
   ```bash
   python3 scripts/spotify-auth.py --headless
   ```
   Follow the prompts to authorize via URL and paste the callback.

Tokens are saved to `~/.config/spotify-clawd/token.json` and auto-refresh when expired.

## Usage

### Command Line

```bash
# Recent listening history
python3 scripts/spotify-api.py recent

# Top artists (time_range: short_term, medium_term, long_term)
python3 scripts/spotify-api.py top-artists medium_term

# Top tracks
python3 scripts/spotify-api.py top-tracks medium_term

# Get recommendations based on your top artists
python3 scripts/spotify-api.py recommend

# Raw API call (any endpoint)
python3 scripts/spotify-api.py json /me
python3 scripts/spotify-api.py json /me/player/recently-played
```

### Time Ranges

- `short_term` — approximately last 4 weeks
- `medium_term` — approximately last 6 months (default)
- `long_term` — all time

### Example Output

```
Top Artists (medium_term):
  1. Hans Zimmer [soundtrack, score]
  2. John Williams [soundtrack, score]
  3. Michael Giacchino [soundtrack, score]
  4. Max Richter [ambient, modern classical]
  5. Ludovico Einaudi [italian contemporary classical]
```

## Agent Usage

When user asks about music:
- "What have I been listening to?" → `spotify-api.py recent`
- "Who are my top artists?" → `spotify-api.py top-artists`
- "Recommend new music" → `spotify-api.py recommend` + add your own knowledge

For recommendations, combine API data with music knowledge to suggest similar artists not in their library.

## Troubleshooting

### "Spotify credentials not found!"
- Make sure `credentials/spotify.json` exists **or** environment variables are set
- Credential file is checked first, then env vars
- Run `bash skills/spotify-history/scripts/setup.sh` to create credentials

### "Not authenticated. Run spotify-auth.py first."
- Tokens don't exist or are invalid
- Run: `python3 scripts/spotify-auth.py` (or with `--headless` if no browser)

### "HTTP Error 400: Bad Request" during token refresh
- Credentials changed or are invalid
- Re-run setup: `bash skills/spotify-history/scripts/setup.sh`
- Or update `credentials/spotify.json` with correct Client ID/Secret

### "HTTP Error 401: Unauthorized"
- Token expired and auto-refresh failed
- Delete token and re-authenticate:
  ```bash
  rm ~/.config/spotify-clawd/token.json
  python3 scripts/spotify-auth.py
  ```

### Headless / No Browser
- Use `--headless` flag: `python3 scripts/spotify-auth.py --headless`
- Manually open the auth URL on any device
- Copy the callback URL (starts with `http://127.0.0.1:8888/callback?code=...`)
- Paste it back when prompted

## Security Notes

- Tokens stored with 0600 permissions (user-only read/write)
- Client secret should be kept private
- Redirect URI uses `127.0.0.1` (local only) for security

## Required Scopes

- `user-read-recently-played` — recent listening history
- `user-top-read` — top artists and tracks
- `user-read-playback-state` — current playback
- `user-read-currently-playing` — currently playing track
