# Pocket TTS Skill

Fully local, offline text-to-speech using Kyutai's Pocket TTS model. Generate high-quality audio from text without any API calls or internet connection. Features 8 built-in voices, voice cloning support, and runs entirely on CPU.

## Features

- 🎯 **Fully local** - No API calls, runs completely offline
- 🚀 **CPU-only** - No GPU required, works on any computer
- ⚡ **Fast generation** - ~2-6x real-time on CPU
- 🎤 **8 built-in voices** - alba, marius, javert, jean, fantine, cosette, eponine, azelma
- 🎭 **Voice cloning** - Clone any voice from a WAV sample
- 🔊 **Low latency** - ~200ms first audio chunk
- 📚 **Simple Python API** - Easy integration into any project

## Installation

```bash
# 1. Accept the model license on Hugging Face
# https://huggingface.co/kyutai/pocket-tts

# 2. Install the package
pip install pocket-tts

# Or use uv for automatic dependency management
uvx pocket-tts generate "Hello world"
```

## Usage

### CLI

```bash
# Basic usage
pocket-tts "Hello, I am your AI assistant"

# With specific voice
pocket-tts "Hello" --voice alba --output hello.wav

# With custom voice file (voice cloning)
pocket-tts "Hello" --voice-file myvoice.wav --output output.wav

# Adjust speed
pocket-tts "Hello" --speed 1.2

# Start local server
pocket-tts --serve

# List available voices
pocket-tts --list-voices
```

### Python API

```python
from pocket_tts import TTSModel
import scipy.io.wavfile

# Load model
tts_model = TTSModel.load_model()

# Get voice state
voice_state = tts_model.get_state_for_audio_prompt(
    "hf://kyutai/tts-voices/alba-mackenna/casual.wav"
)

# Generate audio
audio = tts_model.generate_audio(voice_state, "Hello world!")

# Save to WAV
scipy.io.wavfile.write("output.wav", tts_model.sample_rate, audio.numpy())

# Check sample rate
print(f"Sample rate: {tts_model.sample_rate} Hz")
```

## Available Voices

| Voice | Description |
|-------|-------------|
| alba | Casual female voice |
| marius | Male voice |
| javert | Clear male voice |
| jean | Natural male voice |
| fantine | Female voice |
| cosette | Female voice |
| eponine | Female voice |
| azelma | Female voice |

Or use `--voice-file /path/to/wav.wav` for custom voice cloning.

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `text` | Text to convert | Required |
| `-o, --output` | Output WAV file | `output.wav` |
| `-v, --voice` | Voice preset | `alba` |
| `-s, --speed` | Speech speed (0.5-2.0) | `1.0` |
| `--voice-file` | Custom WAV for cloning | None |
| `--serve` | Start HTTP server | False |
| `--list-voices` | List all voices | False |

## Requirements

- Python 3.10-3.14
- PyTorch 2.5+ (CPU version works)
- Works on 2 CPU cores

## Notes

- ⚠️ Model is gated - accept license on Hugging Face first
- 🌍 English language only (v1)
- 💾 First run downloads model (~100M parameters)
- 🔊 Audio is returned as 1D torch tensor (PCM data)

## Links

- [Demo](https://kyutai.org/tts)
- [GitHub](https://github.com/kyutai-labs/pocket-tts)
- [Hugging Face](https://huggingface.co/kyutai/pocket-tts)
- [Paper](https://arxiv.org/abs/2509.06926)
