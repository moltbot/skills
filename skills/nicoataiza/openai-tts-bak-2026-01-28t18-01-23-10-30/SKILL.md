---
name: openai-tts
description: Text-to-speech via OpenAI Audio Speech API.
homepage: https://platform.openai.com/docs/guides/text-to-speech
metadata: {"clawdbot":{"emoji":"🔊","requires":{"bins":["curl"],"env":["OPENAI_API_KEY"]},"primaryEnv":"OPENAI_API_KEY"}}
---

# OpenAI TTS (curl)

Generate speech from text via OpenAI's `/v1/audio/speech` endpoint.

## Quick start

```bash
{baseDir}/scripts/speak.sh "Hello, world!"
{baseDir}/scripts/speak.sh "Hello, world!" --out /tmp/hello.mp3
```

Defaults:
- Model: `tts-1` (fast) or `tts-1-hd` (quality)
- Voice: `alloy` (neutral), also: `echo`, `fable`, `onyx`, `nova`, `shimmer`
- Format: `mp3`

## Voices

| Voice | Description |
|-------|-------------|
| alloy | Neutral, balanced |
| echo | Male, warm |
| fable | British, expressive |
| onyx | Deep, authoritative |
| nova | Female, friendly |
| shimmer | Female, soft |

## Flags

```bash
{baseDir}/scripts/speak.sh "Text" --voice nova --model tts-1-hd --out speech.mp3
{baseDir}/scripts/speak.sh "Text" --format opus --speed 1.2
```

Options:
- `--voice <name>`: alloy|echo|fable|onyx|nova|shimmer (default: alloy)
- `--model <name>`: tts-1|tts-1-hd (default: tts-1)
- `--format <fmt>`: mp3|opus|aac|flac|wav|pcm (default: mp3)
- `--speed <n>`: 0.25-4.0 (default: 1.0)
- `--out <path>`: output file (default: stdout or auto-named)

## API key

Set `OPENAI_API_KEY`, or configure in `~/.clawdbot/clawdbot.json`:

```json5
{
  skills: {
    entries: {
      "openai-tts": {
        apiKey: "sk-..."
      }
    }
  }
}
```

## Pricing

- tts-1: ~$0.015 per 1K characters
- tts-1-hd: ~$0.030 per 1K characters

Very affordable for short responses!
