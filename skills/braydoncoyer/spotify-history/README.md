# Spotify History & Recommendations

Access your Spotify listening history, top artists/tracks, and get personalized recommendations via the Spotify Web API.

## Quick Start

```bash
# Run setup wizard
bash skills/spotify-history/scripts/setup.sh

# Test it
python3 scripts/spotify-api.py recent
python3 scripts/spotify-api.py top-artists
python3 scripts/spotify-api.py recommend
```

## What It Does

- **Listening History**: See what you've been playing recently
- **Top Artists/Tracks**: Your most-played artists and tracks (4 weeks, 6 months, or all time)
- **Recommendations**: Get personalized music recommendations based on your taste
- **Auto-Refresh**: Tokens refresh automatically - set up once, works forever

## Requirements

- Python 3.6+
- Spotify account (free or premium)
- One-time setup: Spotify Developer App (free, takes 2 minutes)

## Agent Integration

When you ask your agent about music:
- "What have I been listening to?"
- "Who are my top artists?"
- "Recommend new music"

The agent will:
1. Fetch your Spotify data
2. Analyze your taste
3. Combine API data with music knowledge for personalized recommendations

## Documentation

See [SKILL.md](./SKILL.md) for full documentation, troubleshooting, and advanced usage.

## License

MIT
