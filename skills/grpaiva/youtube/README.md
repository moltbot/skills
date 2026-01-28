# YouTube 📹

YouTube research and transcription skill for [Clawdbot](https://clawdbot.com).

## Features

- 📹 **Video Details** - Get title, description, stats, publish date
- 📝 **Transcripts** - Extract transcripts with timestamps
- 📺 **Channel Info** - Get channel details and recent videos
- 🔍 **Search** - Find videos by keywords
- 🎬 **Playlist Info** - Get playlist details

## Installation

```bash
clawdhub install youtube
```

## Configuration

Get a YouTube API key from [Google Cloud Console](https://console.cloud.google.com):
1. Create a project
2. Enable YouTube Data API v3
3. Create credentials → API Key

```bash
export YOUTUBE_API_KEY="your-api-key"
```

Or add to `~/.clawdbot/clawdbot.json`:
```json
{
  "skills": {
    "entries": {
      "youtube": {
        "apiKey": "AIzaSy..."
      }
    }
  }
}
```

## Usage Examples

```
"Find the latest Lex Fridman podcast episode"
"Get the transcript for this video: https://youtube.com/watch?v=Z-FRe5AKmCU"
"Search YouTube for Laravel tutorials"
"Show me recent videos from channel UCSHZKyawb77ixDdsGog4iWA"
"Get video details for Z-FRe5AKmCU"
```

## License

MIT
