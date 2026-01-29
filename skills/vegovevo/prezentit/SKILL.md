---
name: prezentit
description: Generate beautiful AI-powered presentations instantly. Create professional slides with custom themes, visual designs, and speaker notes—all through natural language commands. Connect your Prezentit account to generate presentations directly from chat.
homepage: https://prezentit.net
emoji: "🎯"
metadata:
  clawdbot:
    emoji: "🎯"
    skillKey: prezentit
    homepage: https://prezentit.net
    requires:
      config:
        - PREZENTIT_API_KEY
    config:
      requiredEnv:
        - name: PREZENTIT_API_KEY
          description: Your Prezentit API key. Get one at https://prezentit.net/api-keys (requires account)
      example: |
        # Add to your environment or Clawdbot config
        export PREZENTIT_API_KEY=pk_your_api_key_here
---

# Prezentit - AI Presentation Generator

Generate stunning, professional presentations instantly using AI. Just describe your topic and get a complete slide deck with custom designs.

## Features

- **Instant Generation**: Create full presentations from a single prompt
- **Beautiful Themes**: Choose from 40+ professional themes (Minimalist, Corporate, Creative, etc.)
- **AI-Designed Slides**: Each slide is uniquely designed by AI to match your content
- **Credit System**: Pay only for what you generate
- **Direct Download**: Get your presentation link immediately

## Setup

1. **Create a Prezentit Account**
   - Go to [prezentit.net](https://prezentit.net)
   - Sign in with Google

2. **Generate an API Key**
   - Go to your profile → API
   - Click "Create Key"
   - Copy the key (it's only shown once!)

3. **Configure Clawdbot**
   ```
   /config set PREZENTIT_API_KEY pk_your_api_key_here
   ```

## Usage

### Quick Generation
```
Create a presentation about sustainable energy
```

### With Details
```
Create a 10-slide presentation about machine learning for beginners. 
Include real-world examples and keep it simple for non-technical audiences.
```

### With Theme
```
Create a presentation about startup funding using the "venture" theme
```

## Commands Reference

### Generate Presentation
Tell Clawdbot what you want to present about:
- "Make a presentation about [topic]"
- "Create slides for [topic]"
- "Generate a deck about [topic]"

### Options
- **Slide count**: "Create a 7-slide presentation..."
- **Theme**: "...using the minimalist theme"
- **Details**: Add context after your topic

### Check Credits
"Check my Prezentit credits" or "How many Prezentit credits do I have?"

### List Themes
"Show me available Prezentit themes" or "What themes can I use?"

## Available Themes

Themes are organized by category:

- **Minimalist**: Clean, modern designs with lots of white space
- **Corporate**: Professional themes for business presentations
- **Creative**: Bold, artistic styles for creative projects
- **Nature**: Earth tones and natural imagery
- **Technology**: Futuristic, tech-inspired designs
- **Education**: Clear, readable layouts for teaching

To see all themes: "List Prezentit themes"

## Pricing

| Action | Credits |
|--------|---------|
| Outline (per slide) | 5 credits |
| Design (per slide) | 10 credits |
| **Total per slide** | **15 credits** |

New accounts start with 100 free credits. Purchase more at [prezentit.net/buy-credits](https://prezentit.net/buy-credits)

## Example Workflow

1. **User**: "Create a 5-slide presentation about remote work best practices"

2. **Clawdbot**: 
   - Checks your credits (75 needed for 5 slides)
   - Generates outline with titles and talking points
   - Designs each slide with AI
   - Returns presentation link

3. **Result**: A complete presentation ready to present or download

## Troubleshooting

### "Invalid API key"
- Make sure you copied the full API key including the `pk_` prefix
- Check that the key hasn't expired
- Generate a new key if needed

### "Insufficient credits"
- Check your credit balance
- Purchase more credits at prezentit.net/buy-credits

### "Rate limit exceeded"
- Wait a minute and try again
- Default: 30 requests/minute, 500 requests/day

## API Reference

**Base URL**: `https://prezentit.net/api/v1`

**Authentication**: All requests require the `Authorization` header:
```
Authorization: Bearer pk_your_api_key_here
```

### Check Credits
```bash
GET /api/v1/me/credits

# Example:
curl -X GET "https://prezentit.net/api/v1/me/credits" \
  -H "Authorization: Bearer pk_your_api_key_here"

# Response:
{
  "credits": 100,
  "userId": "user_123"
}
```

### List Themes
```bash
GET /api/v1/themes

# Example - List all themes:
curl -X GET "https://prezentit.net/api/v1/themes" \
  -H "Authorization: Bearer pk_your_api_key_here"

# Response:
{
  "themes": [
    { "id": "minimalist", "name": "Minimalist", "category": "minimal" },
    { "id": "atlantis", "name": "Atlantis", "category": "fantasy" },
    ...
  ],
  "categories": ["cartoon", "minimal", "corporate", ...],
  "usage": "Use the exact 'id' value when generating presentations."
}
```

### Search/Match Themes
```bash
GET /api/v1/themes?search=atlantis

# Use this to find the correct theme ID when user requests a theme by name.
# Returns best match and confidence level.

# Response:
{
  "searchQuery": "atlantis",
  "bestMatch": {
    "id": "atlantis",           // <-- Use this exact ID in generate request
    "name": "Atlantis",
    "category": "fantasy",
    "confidence": "exact"      // exact | partial | low
  },
  "matches": [...],
  "hint": "Best match: 'atlantis'. Use this exact ID in your request."
}
```

**IMPORTANT - Theme is REQUIRED:**
A theme or custom design prompt is required for every presentation. Follow this flow:

1. When user requests a theme (e.g., "atlantis theme"), search: `GET /api/v1/themes?search=atlantis`
2. If `bestMatch.confidence` is "exact" or "partial", use the `bestMatch.id` as the `theme` parameter
3. If NO match found, either:
   - Generate a `customDesignPrompt` based on what the user wanted, OR
   - Ask the user to pick from available themes, OR
   - Select a theme that best fits the topic (e.g., "candyland" for creative/fun topics)

**If user doesn't specify a theme:**
- Pick an appropriate theme from the list based on the topic
- For business topics → pick from Basic & Minimalistic
- For creative/fun topics → pick from cartoon or creative categories
- For tech topics → pick from Tech
- Or ask the user: "Which theme would you like? Here are some options that fit your topic: ..."

**Example - User wants "cyberpunk neon" style (not in our themes):**
```json
{
  "topic": "Future of AI",
  "slideCount": 5,
  "customDesignPrompt": "Cyberpunk aesthetic with neon pink and blue colors, dark backgrounds, glowing circuit patterns, futuristic holographic elements, sharp angular shapes"
}
```

### Generate Presentation
```bash
POST /api/v1/presentations/generate
Content-Type: application/json

# Example with existing theme:
curl -X POST "https://prezentit.net/api/v1/presentations/generate" \
  -H "Authorization: Bearer pk_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Create a presentation about sustainable energy",
    "slideCount": 5,
    "theme": "minimalist"
  }'

# Example with custom design prompt (when no matching theme exists):
curl -X POST "https://prezentit.net/api/v1/presentations/generate" \
  -H "Authorization: Bearer pk_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Future of Gaming",
    "slideCount": 5,
    "customDesignPrompt": "Retro arcade aesthetic with pixel art elements, neon glow effects, dark purple and electric blue colors, 80s gaming nostalgia"
  }'

# Request Body:
{
  "topic": "Your presentation topic",                // Required (or use "prompt")
  "details": "Additional context for the AI",        // Optional
  "slideCount": 5,                                   // Optional, default: 5, range: 3-50
  "theme": "minimalist",                             // Required* - theme ID from /themes
  "customDesignPrompt": "Design style description"   // Required* - use when theme doesn't exist
}

# *NOTE: You MUST provide either "theme" OR "customDesignPrompt"
# - If theme ID exists in our library → use "theme"  
# - If user wants a custom style → use "customDesignPrompt" with a descriptive prompt
# - If user doesn't specify → pick an appropriate theme based on the topic

# Response:
{
  "success": true,
  "presentation": {
    "id": "pres_abc123",
    "title": "Sustainable Energy",
    "slideCount": 5,
    "creditsUsed": 75,
    "viewUrl": "https://prezentit.net/view/abc123",
    "slides": [...]
  }
}
```

### Get Presentation
```bash
GET /api/v1/presentations/:id

# Example:
curl -X GET "https://prezentit.net/api/v1/presentations/pres_abc123" \
  -H "Authorization: Bearer pk_your_api_key_here"
```

### List My Presentations
```bash
GET /api/v1/me/presentations

# Example:
curl -X GET "https://prezentit.net/api/v1/me/presentations" \
  -H "Authorization: Bearer pk_your_api_key_here"

# Response:
{
  "presentations": [
    {
      "id": "pres_abc123",
      "title": "Sustainable Energy",
      "slideCount": 5,
      "createdAt": "2026-01-28T10:00:00Z",
      "viewUrl": "https://prezentit.net/view/abc123"
    }
  ]
}
```

### Error Responses
```json
// 401 Unauthorized - Invalid or missing API key
{ "error": "Invalid API key" }

// 402 Payment Required - Insufficient credits
{ "error": "Insufficient credits", "required": 75, "available": 50 }

// 429 Too Many Requests - Rate limited
{ "error": "Rate limit exceeded", "retryAfter": 60 }
```

## Support

- **Website**: [prezentit.net](https://prezentit.net)

## Privacy

- Your API key is stored securely in your Clawdbot config
- Presentations are saved to your Prezentit account
- See full privacy policy at prezentit.net/privacy
