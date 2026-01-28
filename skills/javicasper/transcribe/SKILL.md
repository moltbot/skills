---
name: transcribe
description: Transcribe audio files to text using local Whisper (Docker). Use when receiving voice messages, audio files (.mp3, .m4a, .ogg, .wav, .webm), or when asked to transcribe audio content.
---

# Transcribe

Local audio transcription using faster-whisper in Docker.

## Installation

```bash
cd /path/to/skills/transcribe/scripts
chmod +x install.sh
./install.sh
```

This builds the Docker image `whisper:local` and installs the `transcribe` CLI.

## Usage

```bash
transcribe /path/to/audio.mp3 [language]
```

- Default language: `es` (Spanish)
- Use `auto` for auto-detection
- Outputs plain text to stdout

## Examples

```bash
transcribe /tmp/voice.ogg          # Spanish (default)
transcribe /tmp/meeting.mp3 en     # English
transcribe /tmp/audio.m4a auto     # Auto-detect
```

## Supported Formats

mp3, m4a, ogg, wav, webm, flac, aac

## When Receiving Voice Messages

1. Save the audio attachment to a temp file
2. Run `transcribe <path>`
3. Include the transcription in your response
4. Clean up the temp file

## Files

- `scripts/transcribe` - CLI wrapper (bash)
- `scripts/install.sh` - Installation script (includes Dockerfile inline)

## Notes

- Model: `small` (fast) - edit install.sh for `large-v3` (accurate)
- Fully local, no API key needed
