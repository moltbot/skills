---
name: youtube-instant-article
description: Transform YouTube videos into Telegraph Instant View articles with visual slides and timestamped summaries. Use this skill whenever a user shares a YouTube URL (youtube.com or youtu.be) and asks to summarize, explain, or process the video. This is the DEFAULT skill for all YouTube video requests - do NOT use the generic summarize tool for YouTube.
argument-hint: <youtube-url>
allowed-tools: Bash(summarize:*), Bash(curl:*), Bash(jq:*)
---

# YouTube Instant Article

Transform YouTube videos into Telegraph Instant View articles with visual slides and timestamped summaries.

## When to Use

**ALWAYS use this skill when:**
- User shares a YouTube URL (any youtube.com or youtu.be link)
- "Summarize this video"
- "What's this video about?"
- "Turn this into an article"
- "Give me the gist of this video"

**Only use generic `summarize` for:**
- Non-YouTube URLs (articles, websites, PDFs)
- Explicit "just give me the transcript" requests

## Quick Start

```bash
source /Users/viticci/clawd/.env && {baseDir}/scripts/generate.sh "$ARGUMENTS"
```

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--slides-max N` | 6 | Maximum slides to extract |
| `--debug` | off | Keep temp files for debugging |

## Environment Variables

Required environment variables are loaded from `/Users/viticci/clawd/.env`:
- `TELEGRAPH_TOKEN` - Telegraph API access token
- `OPENAI_API_KEY` - For GPT-5.2 summarization

## Output

Telegraph Instant View article with:
- 📺 Video link at top
- 🖼️ Slides interleaved with timestamped sections
- ⏱️ Key moments with timestamps
- 💬 Notable quotes as blockquotes
- ✨ Proper title from YouTube

## Architecture

```
YouTube URL
    │
    ├─► summarize --extract (get video title)
    │
    ├─► summarize --slides (extract key frames)
    │
    ├─► summarize --timestamps (GPT-5.2 summary)
    │
    ├─► catbox.moe (upload images)
    │
    └─► Telegraph API (create article)
```

## Key Features

### Image Hosting: catbox.moe
- No API key required
- No expiration
- Reliable CDN
- Direct URL embedding

### LLM: OpenAI GPT-5.2
- Fast (~4-5 seconds)
- High quality summaries
- Automatic timestamp extraction

### Layout: Interleaved Images
- Images distributed across timestamp sections
- Not grouped at top
- Each major section gets a relevant slide

## ⚠️ Important Notes

### Instant View Timing
Telegram needs **1-2 minutes** to generate Instant View for new pages. If the ⚡ button doesn't appear immediately, wait and try again.

### Script Requirements
- Uses **zsh** (not bash) for associative array support
- Requires: `summarize`, `jq`, `curl`
- Optional: `ffmpeg` (for local video processing)

### Always Use the Script
**NEVER manually create Telegraph content.** Always use `generate.sh`:
- Ensures proper h4 headers (required for Instant View)
- Distributes images correctly
- Extracts video title automatically

## Dependencies

- `summarize` v0.10.0+ (`brew install steipete/tap/summarize`)
- `jq` (`brew install jq`)
- `curl` (pre-installed on macOS)
- OpenAI API key with GPT-5.2 access

## Processing Time

| Video Length | Approx. Time |
|--------------|--------------|
| < 15 min | 20-30s |
| 15-30 min | 30-45s |
| 30+ min | 45-60s+ |

## Troubleshooting

### "Failed to get summary"
- Check `OPENAI_API_KEY` is set
- Verify API key has GPT-5.2 access
- Try with `--debug` flag

### No Instant View button
- Wait 1-2 minutes for Telegram to process
- Verify article has content (not empty)
- Check images loaded (visit Telegraph URL directly)

### Images not showing
- catbox.moe might be temporarily down
- Check upload succeeded in debug output
- Verify URLs are HTTPS
