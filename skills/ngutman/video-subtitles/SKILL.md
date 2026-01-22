---
name: video-subtitles
description: Generate SRT subtitles from video/audio with translation support. Transcribes Hebrew (ivrit.ai) and English (whisper), translates between languages, burns subtitles into video. Use for creating captions, transcripts, or hardcoded subtitles for WhatsApp/social media.
---

# Video Subtitles

Generate movie-style subtitles from video or audio files. Supports transcription, translation, and burning subtitles directly into video.

## Features

- **Hebrew**: ivrit.ai fine-tuned model (best Hebrew transcription)
- **English**: OpenAI Whisper large-v3
- **Auto-detect**: Automatically detects language and selects best model
- **Translation**: Translate Hebrew → English
- **Burn-in**: Hardcode subtitles into video (visible everywhere, including WhatsApp)
- **Movie-style**: Natural subtitle breaks (42 chars/line, 1-7s duration)

## Quick Start

```bash
# Plain transcript
./scripts/generate_srt.py video.mp4

# Generate SRT file
./scripts/generate_srt.py video.mp4 --srt

# Burn subtitles into video (always visible)
./scripts/generate_srt.py video.mp4 --srt --burn

# Translate to English + burn in
./scripts/generate_srt.py video.mp4 --srt --burn --translate en

# Force language
./scripts/generate_srt.py video.mp4 --lang he    # Hebrew
./scripts/generate_srt.py video.mp4 --lang en    # English
```

## Options

| Flag | Description |
|------|-------------|
| `--srt` | Generate SRT subtitle file |
| `--burn` | Burn subtitles into video (hardcoded, always visible) |
| `--embed` | Embed soft subtitles (toggle in player) |
| `--translate en` | Translate to English |
| `--lang he/en` | Force input language |
| `-o FILE` | Custom output path |

## Output

- **Default**: Plain text transcript to stdout
- **With `--srt`**: Creates `video.srt` alongside input
- **With `--burn`**: Creates `video_subtitled.mp4` with hardcoded subs

## Requirements

- **uv**: Python package manager (auto-installs dependencies)
- **ffmpeg-full**: For burning subtitles (`brew install ffmpeg-full`)
- **Models**: ~3GB each, auto-downloaded on first use

## Subtitle Style

- Font size 12, white text with black outline
- Bottom-aligned, movie-style positioning
- Max 42 chars/line, 2 lines max
- Natural breaks at punctuation and pauses
