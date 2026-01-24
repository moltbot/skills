---
name: mlx-whisper
version: 1.0.0
description: Local speech-to-text with MLX Whisper (Apple Silicon optimized, no API key).
homepage: https://github.com/ml-explore/mlx-examples/tree/main/whisper
metadata: {"clawdbot":{"emoji":"🍎","requires":{"bins":["mlx_whisper"]},"install":[{"id":"pip","kind":"pip","package":"mlx-whisper","bins":["mlx_whisper"],"label":"Install mlx-whisper (pip)"}]}}
---

# MLX Whisper

Local speech-to-text using Apple MLX, optimized for Apple Silicon Macs.

## Quick Start

```bash
mlx_whisper /path/to/audio.mp3 --model mlx-community/whisper-large-v3-turbo
```

## Common Usage

```bash
# Transcribe to text file
mlx_whisper audio.m4a -f txt -o ./output

# Transcribe with language hint
mlx_whisper audio.mp3 --language en --model mlx-community/whisper-large-v3-turbo

# Generate subtitles (SRT)
mlx_whisper video.mp4 -f srt -o ./subs

# Translate to English
mlx_whisper foreign.mp3 --task translate
```

## Models (download on first use)

| Model | Size | Speed | Quality |
|-------|------|-------|---------|
| mlx-community/whisper-tiny | ~75MB | Fastest | Basic |
| mlx-community/whisper-base | ~140MB | Fast | Good |
| mlx-community/whisper-small | ~470MB | Medium | Better |
| mlx-community/whisper-medium | ~1.5GB | Slower | Great |
| mlx-community/whisper-large-v3 | ~3GB | Slowest | Best |
| mlx-community/whisper-large-v3-turbo | ~1.6GB | Fast | Excellent (Recommended) |

## Notes

- Requires Apple Silicon Mac (M1/M2/M3/M4)
- Models cache to `~/.cache/huggingface/`
- Default model is `mlx-community/whisper-tiny`; use `--model mlx-community/whisper-large-v3-turbo` for best results
