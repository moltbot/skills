---
name: elevenlabs
description: Text-to-speech, sound effects, music generation, voice management, and quota checks via the ElevenLabs API. Use when generating audio with ElevenLabs or managing voices.
metadata: {"clawdbot":{"requires":{"bins":["python3"],"env":["ELEVENLABS_API_KEY"]},"primaryEnv":"ELEVENLABS_API_KEY"}}
---

# ElevenLabs Skill

Core tools for interacting with the ElevenLabs API for sound generation, music, and voice management.

## Setup

Requires `ELEVENLABS_API_KEY` in environment.

## Output Formats

All scripts support multiple output formats via `--format`:

| Format | Description |
|--------|-------------|
| `mp3_44100_128` | MP3, 44.1kHz, 128kbps (default) |
| `mp3_44100_192` | MP3, 44.1kHz, 192kbps |
| `pcm_16000` | Raw PCM, 16kHz |
| `pcm_22050` | Raw PCM, 22.05kHz |
| `pcm_24000` | Raw PCM, 24kHz |
| `pcm_44100` | Raw PCM, 44.1kHz |
| `ulaw_8000` | μ-law, 8kHz (telephony) |

## Tools

### 1. Speech (`speech.py`)
Text-to-speech using ElevenLabs voices.

```bash
# Basic usage
python3 {baseDir}/scripts/speech.py "Hello world" -v <voice_id> -o output.mp3

# With format option
python3 {baseDir}/scripts/speech.py "Hello world" -v <voice_id> -o output.pcm --format pcm_44100

# With voice settings
python3 {baseDir}/scripts/speech.py "Hello" -v <voice_id> -o out.mp3 --stability 0.7 --similarity 0.8
```

### 2. Sound Effects (`sfx.py`)
Generate sound effects and short audio clips.

```bash
# Generate a sound
python3 {baseDir}/scripts/sfx.py "Cinematic boom" -o boom.mp3

# Generate a loop
python3 {baseDir}/scripts/sfx.py "Lo-fi hip hop beat" --duration 10 --loop -o beat.mp3

# Different format
python3 {baseDir}/scripts/sfx.py "Whoosh" -o whoosh.pcm --format pcm_44100
```

### 3. Music Generation (`music.py`)
Generate full musical compositions or instrumental tracks.

```bash
# Generate instrumental intro
python3 {baseDir}/scripts/music.py --prompt "Upbeat 6s news intro sting, instrumental" --length-ms 6000 -o intro.mp3

# Generate background bed
python3 {baseDir}/scripts/music.py --prompt "Soft ambient synth pad" --length-ms 30000 -o bed.mp3

# High quality MP3
python3 {baseDir}/scripts/music.py --prompt "Jazz piano" --length-ms 10000 -o jazz.mp3 --output-format mp3_44100_192
```

### 4. Voices (`voices.py`)
List available voices and their IDs.

```bash
# List voices
python3 {baseDir}/scripts/voices.py

# JSON output
python3 {baseDir}/scripts/voices.py --json
```

### 5. Voice Cloning (`voiceclone.py`)
Create instant voice clones from audio samples.

```bash
# Clone from audio files
python3 {baseDir}/scripts/voiceclone.py --name "MyVoice" --files sample1.mp3 sample2.mp3

# With language and gender labels
python3 {baseDir}/scripts/voiceclone.py --name "Andi" --files *.m4a --language de --gender male

# With description and noise removal
python3 {baseDir}/scripts/voiceclone.py --name "Andi" --files *.m4a --description "German male" --denoise
```

### 6. Quota & Usage (`quota.py`)
Check subscription quota and usage statistics.

```bash
# Show current quota
python3 {baseDir}/scripts/quota.py

# Include usage breakdown by voice
python3 {baseDir}/scripts/quota.py --usage

# Last 7 days usage
python3 {baseDir}/scripts/quota.py --usage --days 7

# JSON output
python3 {baseDir}/scripts/quota.py --json
```

Output:
```
📊 ElevenLabs Quota
=======================================
Plan:      pro (active) — annual
Characters: 66.6K / 500.0K (13.3%)
           [███░░░░░░░░░░░░░░░░░░░░░░░░░░░]
Resets:    2026-02-18 (29 days)
Voices:    22 / 160 (IVC: ✓)
Pro Voice: 0 / 1 (PVC: ✓)
```
