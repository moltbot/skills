---
name: krea-api
description: Generate images via Krea.ai API (Flux, Imagen, Ideogram, Seedream, etc.)
version: 0.1.0
---

# Krea.ai Image Generation Skill

Generate images using Krea.ai's API with support for multiple models including Flux, Imagen 4, Ideogram 3.0, and more.

## Features

- Async job-based generation (POST → poll → result)
- Support for multiple image models
- Configurable parameters (width, height, steps, guidance, seed, etc.)
- Webhook support for background completion
- Stdlib-only dependencies (no `requests` required)

## Setup

1. Get your Krea.ai API credentials from https://docs.krea.ai/developers/api-keys-and-billing
2. Configure with:

```bash
clawdbot config set skill.krea_api.key_id YOUR_KEY_ID
clawdbot config set skill.krea_api.secret YOUR_SECRET
```

3. Or pass credentials directly as arguments.

## Usage

### Interactive Mode

```
You: Generate a sunset over the ocean with Flux
Klawf: Creates the image and returns the URL
```

### Python Script

```python
from krea_api import KreaAPI

api = KreaAPI(
    key_id="your-key-id",
    secret="your-secret"
)

# Generate and wait
urls = api.generate_and_wait(
    prompt="A serene Japanese garden",
    model="flux",
    width=1024,
    height=1024
)
print(urls)
```

### Available Models (examples)

| Model | Endpoint |
|-------|----------|
| flux | `/generate/image/bfl/flux-1-dev` |
| flux-kontext | `/generate/image/bfl/flux-1-dev-kontext` |
| flux-1.1-pro | `/generate/image/bfl/flux-1-1-pro` |
| imagen-3 | `/generate/image/google/imagen-3` |
| imagen-4 | `/generate/image/google/imagen-4` |
| ideogram-3.0 | `/generate/image/ideogram/ideogram-3-0` |
| seedream-4 | `/generate/image/seedream/seedream-4` |

For the full list, run:

```bash
python3 krea_api.py --list-models
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| prompt | str | required | Image description (max 1800 chars) |
| model | str | "flux" | Model name from table above |
| width | int | 1024 | Image width (512-2368) |
| height | int | 1024 | Image height (512-2368) |
| steps | int | 25 | Generation steps (1-100) |
| guidance_scale | float | 3.0 | Guidance scale (0-24) |
| seed | str | None | Random seed for reproducibility |
| webhook_url | str | None | URL for completion notification |

## Credits

Thanks to Claude Opus 4.5 for researching the correct API structure. The docs incorrectly suggest `/v1/images/flux` but the working endpoint is `/generate/image/bfl/flux-1-dev`.
