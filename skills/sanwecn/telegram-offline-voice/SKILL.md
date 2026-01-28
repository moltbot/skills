---
name: telegram-offline-voice
description: Elegant offline TTS voice messages for Telegram via Sherpa-ONNX.
metadata: {"clawdbot":{"emoji":"🎙️","os":["linux"],"requires":{"bins":["ffmpeg","sherpa-onnx-offline-tts"]},"install":[{"id":"sherpa-onnx","kind":"skill","name":"sherpa-onnx-tts"}]}}
---

# telegram-offline-voice 🎙️

A Moltbot (Clawdbot) skill that enables high-quality, offline voice message replies specifically tuned for Telegram.

## Features
- **100% Offline**: No API tokens, no costs, no privacy leaks.
- **Tuned for Elegance**: Pre-configured with a "Golden Ratio" of speech speed (1.2x) and natural silence scales (0.6x) for a warm, human-like cadence.
- **One-Click Voice**: Automatically converts text to OGG/Opus format compatible with Telegram's native voice messages.

## Acknowledgements
Spearheaded and tuned by **@sanwecn** (Chief Experience Officer).

## Prerequisites
Depends on the base `sherpa-onnx-tts` skill for the underlying engine.

## Configuration
Requires a Chinese VITS model (e.g., `vits-zh-aishell3`).

```bash
# Example internal usage
telegram-offline-voice "你好威哥，这是为您定制的离线语音汇报。"
```
