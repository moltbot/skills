# YouTube Summarizer

Automatically fetch YouTube video transcripts, generate structured summaries, and deliver full transcripts to messaging platforms.

## Features

✅ **Automatic detection** - Recognizes YouTube URLs in messages  
✅ **Cloud-friendly** - Works from VPS/cloud IPs where yt-dlp fails  
✅ **Structured summaries** - Main thesis, key insights, and takeaways  
✅ **Full transcripts** - Downloadable text file with complete video content  
✅ **Platform-aware** - Auto-sends files to Telegram, text-only elsewhere  
✅ **Multi-language** - Supports multiple languages with English fallback  

## Installation

### Prerequisites

1. **Node.js 18+** installed
2. **Clawdbot** running

### Install via ClawdHub

```bash
clawdhub install youtube-summarizer
```

### Manual Installation

```bash
# 1. Clone the skill
cd /root/clawd/skills
git clone <this-repo-url> youtube-summarizer

# 2. Install MCP YouTube Transcript dependency
cd /root/clawd
git clone https://github.com/kimtaeyoon83/mcp-server-youtube-transcript.git
cd mcp-server-youtube-transcript
npm install && npm run build
```

## Usage

Simply share a YouTube URL in chat:

```
You: https://youtu.be/dQw4w9WgXcQ

Agent: 📹 **Video:** Never Gonna Give You Up
       👤 **Channel:** Rick Astley | 👁️ **Views:** 1.4B | 📅 **Published:** 2009-10-25
       
       **🎯 Main Thesis:**
       A declaration of unwavering commitment and loyalty in a relationship...
       
       [structured summary follows]
       
       📄 Full transcript attached (Telegram) or saved to transcripts/
```

## How It Works

1. **Detects** YouTube URLs automatically
2. **Fetches** transcript using MCP server (bypasses cloud IP blocks)
3. **Generates** structured summary with metadata
4. **Saves** full transcript to `transcripts/YYYY-MM-DD_VIDEO_ID.txt`
5. **Sends** file to Telegram (if in Telegram context)
6. **Replies** with formatted summary

## Supported URL Formats

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/shorts/VIDEO_ID`
- Direct video ID: `VIDEO_ID`

## Output Format

### Summary Structure

```markdown
📹 **Video:** [Title]
👤 **Channel:** [Author] | 👁️ **Views:** [Count] | 📅 **Published:** [Date]

**🎯 Main Thesis:**
Core message in 1-2 sentences

**💡 Key Insights:**
- Insight 1
- Insight 2
- Insight 3

**📝 Notable Points:**
- Supporting detail 1
- Supporting detail 2

**🔑 Takeaway:**
Practical conclusion
```

### Transcript File

Saved to `/root/clawd/transcripts/YYYY-MM-DD_VIDEO_ID.txt` with:
- Video metadata header
- Full transcript text
- URL reference

## Configuration

No configuration needed! The skill automatically:
- Detects your messaging platform
- Chooses appropriate delivery method
- Handles language fallback
- Creates transcript directory if needed

## Troubleshooting

### "Transcript not available"
- Video may not have captions enabled
- Try a different video
- Use YouTube's manual transcript feature

### "MCP server not found"
Install the dependency:
```bash
cd /root/clawd
git clone https://github.com/kimtaeyoon83/mcp-server-youtube-transcript.git
cd mcp-server-youtube-transcript
npm install && npm run build
```

### "Language not available"
The skill automatically falls back to English if requested language isn't available.

## Why This Skill?

### Problem
- yt-dlp blocked on cloud/VPS IPs
- YouTube aggressive with bot detection
- Manual transcript extraction tedious
- Need structured summaries, not raw text

### Solution
- Uses MCP server with Android client emulation
- Bypasses cloud IP restrictions
- Auto-generates structured summaries
- Platform-aware file delivery

## Dependencies

- [MCP YouTube Transcript](https://github.com/kimtaeyoon83/mcp-server-youtube-transcript) - Fetches transcripts via Android client emulation
- Node.js 18+ - Runtime environment
- Clawdbot - AI agent framework

## Credits

- Built by **abe238**
- Uses [mcp-server-youtube-transcript](https://github.com/kimtaeyoon83/mcp-server-youtube-transcript) by kimtaeyoon83
- Inspired by the need for reliable YouTube transcription on cloud servers

## License

MIT

## Contributing

Improvements welcome! Consider:
- Additional summary templates
- Multi-language summary generation
- Timestamp-based chapter extraction
- Video metadata enrichment

## Changelog

### v1.0.0 (2026-01-26)
- Initial release
- Auto-detect YouTube URLs
- Generate structured summaries
- Save full transcripts
- Telegram file delivery
- Cloud IP bypass via MCP server
