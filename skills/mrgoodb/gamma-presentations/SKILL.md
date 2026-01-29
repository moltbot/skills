---
name: gamma
description: Create presentations, documents, social posts, and websites using Gamma's AI API. Use when asked to create slides, presentations, decks, documents, or web content via Gamma.
---

# Gamma API Skill

Create presentations and documents programmatically via Gamma's API.

## Setup

1. Get API key from https://developers.gamma.app
2. Store in environment: `export GAMMA_API_KEY=sk-gamma-xxx`
   Or add to TOOLS.md: `Gamma API Key: sk-gamma-xxx`

## Authentication

```
Base URL: https://public-api.gamma.app/v1.0
Header: X-API-KEY: <your-api-key>
```

## Generate Content

```bash
curl -X POST https://public-api.gamma.app/v1.0/generations \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $GAMMA_API_KEY" \
  -d '{
    "inputText": "Your content here",
    "textMode": "generate|condense|preserve",
    "format": "presentation|document|social|webpage"
  }'
```

**Response:** `{"generationId": "xxx"}`

## Check Status

```bash
curl https://public-api.gamma.app/v1.0/generations/<generationId> \
  -H "X-API-KEY: $GAMMA_API_KEY"
```

**Response (completed):** `{"status": "completed", "gammaUrl": "https://gamma.app/docs/xxx", "credits": {...}}`

Poll every 10-20s until `status: "completed"`.

## Key Parameters

| Parameter | Values | Notes |
|-----------|--------|-------|
| `textMode` | `generate`, `condense`, `preserve` | generate=expand, condense=summarize, preserve=keep exact |
| `format` | `presentation`, `document`, `social`, `webpage` | Output type |
| `numCards` | 1-60 (Pro), 1-75 (Ultra) | Number of slides/cards |
| `cardSplit` | `auto`, `inputTextBreaks` | Use `\n---\n` in inputText for manual breaks |
| `exportAs` | `pdf`, `pptx` | Optional export format |

## Optional Parameters

```json
{
  "additionalInstructions": "Make titles catchy",
  "imageOptions": {
    "source": "aiGenerated|unsplash|giphy|webAllImages|noImages",
    "model": "imagen-4-pro|flux-1-pro",
    "style": "photorealistic, modern"
  },
  "textOptions": {
    "amount": "brief|medium|detailed|extensive",
    "tone": "professional, inspiring",
    "audience": "tech professionals",
    "language": "en"
  },
  "cardOptions": {
    "dimensions": "fluid|16x9|4x3|1x1|4x5|9x16"
  }
}
```

Note: `textOptions.tone` and `textOptions.audience` are ignored when `textMode` is `preserve`.

## Other Endpoints

- `GET /themes` — List available themes (use `themeId` in generation)
- `GET /folders` — List folders (use `folderIds` in generation)

## Workflow

1. Check for API key in environment (`$GAMMA_API_KEY`) or TOOLS.md
2. Build `inputText` with content (can include image URLs inline)
3. POST to `/generations` → get `generationId`
4. Poll `/generations/{id}` until `status: "completed"`
5. Return `gammaUrl` to user
