# ElevenLabs Skill for Clawdbot

Core tools for interacting with the ElevenLabs API for sound generation, music, and voice management.

## Features

- **Text-to-Speech**: Generate speech using ElevenLabs voices (`speech.py`)
- **Sound Effects**: Generate sound effects and short clips (`sfx.py`)
- **Music Generation**: Create musical compositions (`music.py`)
- **Voice Management**: List voices (`voices.py`) and clone voices (`voiceclone.py`)
- **Quota Tracking**: Check usage and limits (`quota.py`)

## Setup

Requires `ELEVENLABS_API_KEY` in your environment variables.

## Tools

### 1. Speech (`speech.py`)
Text-to-speech using ElevenLabs voices.

```bash
# Basic usage
python3 scripts/speech.py "Hello world" -v <voice_id> -o output.mp3
```

### 2. Sound Effects (`sfx.py`)
Generate sound effects.

```bash
python3 scripts/sfx.py "Cinematic boom" -o boom.mp3
```

### 3. Music Generation (`music.py`)
Generate music.

```bash
python3 scripts/music.py --prompt "Jazz piano" --length-ms 10000 -o jazz.mp3
```

### 4. Voices (`voices.py`)
List available voices.

```bash
python3 scripts/voices.py
```

### 5. Voice Cloning (`voiceclone.py`)
Create instant voice clones.

```bash
python3 scripts/voiceclone.py --name "MyVoice" --files sample1.mp3 sample2.mp3
```

### 6. Quota (`quota.py`)
Check subscription status.

```bash
python3 scripts/quota.py
```
