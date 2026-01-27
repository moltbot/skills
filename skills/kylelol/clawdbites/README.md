# ClawdBites 🦞🍴

Extract recipes from Instagram reels using a multi-layered approach — no login required.

A [Clawdbot](https://github.com/clawdbot/clawdbot) skill.

## Features

- **Caption parsing** — Instant extraction from post description
- **Audio transcription** — Whisper (local, no API key) for spoken instructions
- **Frame analysis** — Vision model for on-screen recipe cards
- **Smart inference** — Estimates missing measurements based on context
- **Wishlist** — Save recipes to try later, integrates with meal planning

## Requirements

| Tool | Install |
|------|---------|
| yt-dlp | `brew install yt-dlp` |
| ffmpeg | `brew install ffmpeg` |
| whisper | `pip3 install openai-whisper` |

No Instagram login required. Works on public reels.

## Usage

Send an Instagram reel link to your Clawdbot:

```
https://www.instagram.com/reel/ABC123/
```

The skill automatically:
1. Checks the caption for recipe details
2. If incomplete, transcribes the audio
3. If still missing info, analyzes video frames
4. Presents a clean, formatted recipe with macros

## Example Output

```
## Sheet Pan Philly Cheesesteak
*From @salaarfit*

**Macros (per serving):** 331 cal | 46g P | 12g C | 10.5g F

### Ingredients
- 24oz shaved ribeye steak
- 1 green bell pepper
- 1 red bell pepper
- 1 yellow onion
- 2 cups baby mushrooms
- 2-3 tbsp Worcestershire sauce
- 6 slices thin provolone

### Instructions
1. Dice veggies into thin strips
2. Top with shaved ribeye
3. Season with Worcestershire, steak seasoning, salt
4. Cook at 425°F for 15 min
5. Layer provolone on top
6. Broil on high 2-3 min until cheese melts

---
Source: instagram.com/reel/...
```

## Integration

Works great with the **meal-planner** skill:
- Save recipes to a wishlist
- Meal planner can suggest wishlist recipes that match your pantry
- Track which recipes you've tried

## License

MIT
