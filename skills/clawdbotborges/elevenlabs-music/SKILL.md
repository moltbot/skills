---
name: elevenlabs-music
description: Generate music from text prompts using ElevenLabs Eleven Music API. Use when creating songs, soundtracks, jingles, lullabies, or any audio music from descriptions. Supports vocals with AI-generated lyrics, instrumental tracks, and multiple genres/styles. Requires paid ElevenLabs plan.
metadata: {"clawdbot":{"emoji":"🎵","requires":{"bins":["uv"],"env":["ELEVENLABS_API_KEY"]},"primaryEnv":"ELEVENLABS_API_KEY"}}
---

# ElevenLabs Music Generation

Generate complete songs from text prompts with AI-generated lyrics and vocals.

## Quick Start

```bash
# Basic generation (30 seconds)
uv run {baseDir}/scripts/generate_music.py "upbeat jazz piano"

# Longer track (3 minutes)
uv run {baseDir}/scripts/generate_music.py "epic orchestral battle music" --length 180

# Instrumental only (no vocals)
uv run {baseDir}/scripts/generate_music.py "lo-fi hip hop beats" --length 120 --instrumental

# Custom output path
uv run {baseDir}/scripts/generate_music.py "romantic bossa nova" -o /tmp/bossa.mp3
```

## Options

| Flag | Description |
|------|-------------|
| `-l, --length` | Duration in seconds (3-600, default: 30) |
| `-o, --output` | Output file path (default: /tmp/music.mp3) |
| `-i, --instrumental` | Force instrumental, no vocals |

## Prompt Engineering Tips

### Be Specific About Style
- Include genre, mood, tempo, and instruments
- Reference decades or eras: "90s Brazilian romantic pagode", "1960s sci-fi TV theme"
- Describe energy: "builds from soft to explosive", "relaxed and intimate"

### For Vocals
- Specify language: "vocals in Portuguese", "singing in Japanese"
- Describe vocal style: "soulful male vocals", "ethereal female choir"
- Include lyrical themes: "about love and saudade", "celebrating friendship"

### Avoid Copyright Issues
- Don't mention artist/band names directly
- Describe the style instead: "classic 90s romantic samba style" not "like Raça Negra"
- If rejected, the API returns a suggested alternative prompt

### Example Prompts

**MPB (Brazilian Popular Music)**
```
A soulful MPB track featuring gentle acoustic guitar, warm nylon strings, 
and dreamy Rhodes piano. Bossa nova-influenced rhythm with soft brushed 
drums. Vocals in Portuguese express themes of saudade and the beauty of life.
```

**Epic Orchestral**
```
Epic military march with powerful brass fanfares, thundering timpani drums, 
and a soaring choir. Triumphant and heroic, with deep bass tubas, bold 
trumpets, snare rolls, and an anthemic melody building to a glorious crescendo.
```

**Lullaby**
```
Gentle orchestral lullaby with sweeping strings, soft brass, and ethereal 
wordless soprano vocals. Peaceful yet majestic, evoking wonder and hope. 
Perfect for falling asleep while dreaming of adventures.
```

**Comedy Rock**
```
Brazilian comedy rock with absurd, hilarious Portuguese lyrics full of 
wordplay. Mix energetic rock guitars with unexpected rhythms - forró 
breakdowns, pagode moments. Theatrical, exaggerated vocals singing about 
ridiculous situations.
```

## Requirements

- **ElevenLabs API Key**: Set `ELEVENLABS_API_KEY` environment variable
- **Paid Plan**: Music API requires Creator plan or higher
- **uv**: For running the Python script with dependencies

## Supported Features

- Text-to-music generation up to 10 minutes
- AI-generated lyrics and vocals in multiple languages (English, Spanish, Portuguese, German, Japanese, etc.)
- Instrumental-only mode
- Most musical styles and genres
