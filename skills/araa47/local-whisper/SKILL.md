---
name: local-whisper
description: Local speech-to-text using OpenAI Whisper. Runs fully offline after model download. High quality transcription with multiple model sizes.
metadata: {"clawdbot":{"emoji":"🎙️","requires":{"bins":["ffmpeg"]}}}
---

# Local Whisper STT

Local speech-to-text using OpenAI's Whisper. **Fully offline** after initial model download.

## Usage

```bash
# Basic
~/.clawdbot/skills/local-whisper/scripts/local-whisper audio.wav

# Better model
~/.clawdbot/skills/local-whisper/scripts/local-whisper audio.wav --model turbo

# With timestamps
~/.clawdbot/skills/local-whisper/scripts/local-whisper audio.wav --timestamps --json
```

## Models

| Model | Size | Notes |
|-------|------|-------|
| `tiny` | 39M | Fastest |
| `base` | 74M | **Default** |
| `small` | 244M | Good balance |
| `turbo` | 809M | Best speed/quality |
| `large-v3` | 1.5GB | Maximum accuracy |

## Options

- `--model/-m` — Model size (default: base)
- `--language/-l` — Language code (auto-detect if omitted)
- `--timestamps/-t` — Include word timestamps
- `--json/-j` — JSON output
- `--quiet/-q` — Suppress progress

## Setup

Uses uv-managed venv at `.venv/`. To reinstall:
```bash
cd ~/.clawdbot/skills/local-whisper
uv venv .venv --python 3.12
uv pip install --python .venv/bin/python click openai-whisper torch --index-url https://download.pytorch.org/whl/cpu
```
