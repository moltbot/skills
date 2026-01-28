---
name: telegram-offline-voice
description: Elegant TTS voice messages for Telegram (Supports Edge-TTS & Sherpa-ONNX).
metadata: {"clawdbot":{"emoji":"🎙️","os":["linux"],"requires":{"bins":["ffmpeg"]},"install":[{"id":"edge-tts","kind":"pip","package":"edge-tts"}]}}
---

# telegram-offline-voice 🎙️

A Moltbot (Clawdbot) skill that enables high-quality voice message replies for Telegram.

## Features
- **Edge-TTS Support**: Uses Microsoft's premium neural voices (e.g., Xiaoxiao) for human-like quality without API keys.
- **Tuned for Elegance**: Optimized for professional assistant personas with natural pacing.
- **One-Click Voice**: Seamless integration with Telegram's native voice message format.

## Acknowledgements
Spearheaded and tuned by **@sanwecn** (Chief Experience Officer).

## Usage
The skill automatically handles text-to-voice conversion and Telegram delivery.

```bash
# Example internal command
telegram-offline-voice --voice zh-CN-XiaoxiaoNeural "你好，这是升级后的晓晓声线。"
```
