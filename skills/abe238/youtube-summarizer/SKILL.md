---
name: youtube-summarizer
description: Automatically fetch YouTube video transcripts, generate structured summaries, and send full transcripts to messaging platforms. Detects YouTube URLs and provides metadata, key insights, and downloadable transcripts.
version: 1.0.0
author: abe238
tags: [youtube, transcription, summarization, video, telegram]
---

# YouTube Summarizer Skill

Automatically fetch transcripts from YouTube videos, generate structured summaries, and deliver full transcripts to messaging platforms.

## When to Use

Activate this skill when:
- User shares a YouTube URL (youtube.com/watch, youtu.be, youtube.com/shorts)
- User asks to summarize or transcribe a YouTube video
- User requests information about a YouTube video's content

## Dependencies

**Required:** MCP YouTube Transcript server must be installed at:
`/root/clawd/mcp-server-youtube-transcript`

If not present, install it:
```bash
cd /root/clawd
git clone https://github.com/kimtaeyoon83/mcp-server-youtube-transcript.git
cd mcp-server-youtube-transcript
npm install && npm run build
```

## Workflow

### 1. Detect YouTube URL
Extract video ID from these patterns:
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/shorts/VIDEO_ID`
- Direct video ID: `VIDEO_ID` (11 characters)

### 2. Fetch Transcript
Run this command to get the transcript:
```bash
cd /root/clawd/mcp-server-youtube-transcript && node --input-type=module -e "
import { getSubtitles } from './dist/youtube-fetcher.js';
const result = await getSubtitles({ videoID: 'VIDEO_ID', lang: 'en' });
console.log(JSON.stringify(result, null, 2));
" > /tmp/yt-transcript.json
```

Replace `VIDEO_ID` with the extracted ID. Read the output from `/tmp/yt-transcript.json`.

### 3. Process the Data

Parse the JSON to extract:
- `result.metadata.title` - Video title
- `result.metadata.author` - Channel name
- `result.metadata.viewCount` - Formatted view count
- `result.metadata.publishDate` - Publication date
- `result.actualLang` - Language used
- `result.lines` - Array of transcript segments

Full text: `result.lines.map(l => l.text).join(' ')`

### 4. Generate Summary

Create a structured summary using this template:

```markdown
📹 **Video:** [title]
👤 **Channel:** [author] | 👁️ **Views:** [views] | 📅 **Published:** [date]

**🎯 Main Thesis:**
[1-2 sentence core argument/message]

**💡 Key Insights:**
- [insight 1]
- [insight 2]
- [insight 3]
- [insight 4]
- [insight 5]

**📝 Notable Points:**
- [additional point 1]
- [additional point 2]

**🔑 Takeaway:**
[Practical application or conclusion]
```

Aim for:
- Main thesis: 1-2 sentences maximum
- Key insights: 3-5 bullets, each 1-2 sentences
- Notable points: 2-4 supporting details
- Takeaway: Actionable conclusion

### 5. Save Full Transcript

Save the complete transcript to a timestamped file:
```
/root/clawd/transcripts/YYYY-MM-DD_VIDEO_ID.txt
```

Include in the file:
- Video metadata header
- Full transcript text
- URL reference

### 6. Platform-Specific Delivery

**If channel is Telegram:**
```bash
message --action send --channel telegram --target CHAT_ID \
  --filePath /root/clawd/transcripts/YYYY-MM-DD_VIDEO_ID.txt \
  --caption "📄 YouTube Transcript: [title]"
```

**If channel is other/webchat:**
Just reply with the summary (no file attachment).

### 7. Reply with Summary

Send the structured summary as your response to the user.

## Error Handling

**If transcript fetch fails:**
- Check if video has captions enabled
- Try with `lang: 'en'` fallback if requested language unavailable
- Inform user that transcript is not available and suggest alternatives:
  - Manual YouTube transcript feature
  - Video may not have captions
  - Try a different video

**If MCP server not installed:**
- Provide installation instructions
- Offer to install it automatically if in appropriate context

**If video ID extraction fails:**
- Ask user to provide the full YouTube URL or video ID

## Examples

See `examples/` directory for sample outputs.

## Quality Guidelines

- **Be concise:** Summary should be scannable in 30 seconds
- **Be accurate:** Don't add information not in the transcript
- **Be structured:** Use consistent formatting for easy reading
- **Be contextual:** Adjust detail level based on video length
  - Short videos (<5 min): Brief summary
  - Long videos (>30 min): More detailed breakdown

## Notes

- MCP server uses Android client emulation to bypass YouTube's cloud IP blocking
- Works reliably from VPS/cloud environments where yt-dlp often fails
- Supports multiple languages with automatic fallback to English
- Transcript quality depends on YouTube's auto-generated captions or manual captions
