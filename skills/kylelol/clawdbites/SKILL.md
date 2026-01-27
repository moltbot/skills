---
name: clawdbites
description: Extract recipes from Instagram reels. Use when a user sends an Instagram reel link and wants to get the recipe from the caption. Parses ingredients, instructions, and macros into a clean format.
homepage: https://github.com/kylelol/ClawdBites
metadata: {"clawdbot":{"emoji":"🦞","os":["darwin","linux"],"requires":{"bins":["yt-dlp","ffmpeg","whisper"]},"install":[{"id":"yt-dlp","kind":"brew","formula":"yt-dlp","bins":["yt-dlp"],"label":"Install yt-dlp via Homebrew"},{"id":"ffmpeg","kind":"brew","formula":"ffmpeg","bins":["ffmpeg"],"label":"Install ffmpeg via Homebrew"},{"id":"whisper","kind":"shell","command":"pip3 install --user openai-whisper","label":"Install Whisper (local, no API key)"}]}}
---

# Instagram Recipe Extractor

Extract recipes from Instagram reels using a multi-layered approach:
1. **Caption parsing** — Instant, check description first
2. **Audio transcription** — Whisper (local, no API key)
3. **Frame analysis** — Vision model for on-screen text

No Instagram login required. Works on public reels.

## When to Use

- User sends an Instagram reel link
- User mentions "recipe from Instagram" or "save this reel"
- User wants to extract recipe details from a video post

## How It Works (MANDATORY FLOW)

**ALWAYS follow this complete flow — do not stop after caption if instructions are missing:**

1. User sends Instagram reel URL
2. Extract metadata using yt-dlp (`--dump-json`)
3. Parse the caption for recipe details
4. **Check completeness:** Does caption have BOTH ingredients AND instructions?
   - ✅ **YES:** Present the recipe
   - ❌ **NO (missing instructions or incomplete):** **Automatically proceed to audio transcription** — do NOT stop or ask the user
5. If audio transcription needed:
   - Download video: `yt-dlp -o "/tmp/reel.mp4" "URL"`
   - Extract audio: `ffmpeg -y -i /tmp/reel.mp4 -vn -acodec pcm_s16le -ar 16000 -ac 1 /tmp/reel.wav`
   - Transcribe: `whisper /tmp/reel.wav --model base --output_format txt --output_dir /tmp`
   - Merge caption ingredients with audio instructions
6. Present clean, formatted recipe (combining caption + audio as needed)
7. User decides what to do (save to notes, add to wishlist, etc.)

**Completeness check heuristics:**
- Has ingredients = contains 3+ quantity+item patterns (e.g., "1 cup flour", "2 lbs chicken")
- Has instructions = contains action verbs (blend, cook, bake, mix, pour, add) + sequence OR numbered steps

## Extraction Command

```bash
yt-dlp --dump-json "https://www.instagram.com/reel/SHORTCODE/" 2>/dev/null
```

**Key fields from JSON output:**
- `description` — The caption containing the recipe
- `uploader` — Creator's name
- `channel` — Creator's handle
- `webpage_url` — Original URL
- `like_count` — Popularity indicator

## Recipe Parsing

Look for these patterns in the caption:

**Macros:**
- "X Calories | Xg P | Xg C | Xg F"
- "Macros per serving"
- "Cal/Protein/Carbs/Fat"

**Ingredients:**
- Lines starting with quantities (1 cup, 2 tbsp, 24oz)
- Lines with measurement units
- Emoji bullet points (🥩 🌽 🧀 etc.)

**Sections:**
- "For the [component]:"
- "Ingredients:"
- "Instructions:"
- "Directions:"

## Output Format

Present extracted recipe cleanly:

```
## [Recipe Name]
*From @[handle]*

**Macros (per serving):** X cal | Xg P | Xg C | Xg F

### Ingredients
- [ingredient 1]
- [ingredient 2]
...

### Instructions
1. [step 1]
2. [step 2]
...

---
Source: [original URL]
```

## User Actions After Extraction

Let the user decide what to do:
- "Save to my recipes" → Save to Apple Notes (if meal-planner skill available)
- "Add to wishlist" → Save to `memory/recipe-wishlist.json`
- "Just show me" → Display only, no save
- "Plan this for next week" → Hand off to meal-planner skill

## Wishlist Storage

Optional storage for recipes user wants to try later:

**memory/recipe-wishlist.json:**
```json
{
  "recipes": [
    {
      "name": "Recipe Name",
      "source": "instagram",
      "sourceUrl": "https://instagram.com/reel/...",
      "handle": "@creator",
      "addedDate": "2026-01-26",
      "tried": false,
      "macros": {
        "calories": 585,
        "protein": 56,
        "carbs": 25,
        "fat": 28,
        "servings": 3
      },
      "ingredients": [...],
      "instructions": [...]
    }
  ]
}
```

## Error Handling

**If yt-dlp fails:**
- Check if URL is valid Instagram reel format
- May be a private account — inform user
- Suggest user paste caption text manually as fallback

**If no recipe found in caption (IMPORTANT):**

After extracting, scan the caption for recipe indicators:
- Ingredient quantities (numbers + units like oz, cups, tbsp, lbs)
- Recipe sections ("For the...", "Ingredients:", "Instructions:")
- Cooking verbs (bake, cook, sauté, mix, combine)
- Macro information (calories, protein, carbs, fat)

**If none found, tell the user clearly:**

> "I pulled the caption but it doesn't look like the recipe is there — it might just be a teaser or the recipe is only shown in the video itself. Here's what the caption says:
> 
> [show caption]
> 
> A few options:
> 1. Check the comments — sometimes creators post recipes there
> 2. Check their bio link — might lead to the full recipe
> 3. Describe what you saw in the video and I can help find a similar recipe"

**Recipe detection heuristics:**
```
HAS_RECIPE if caption contains:
- 3+ ingredient-like patterns (quantity + food item)
- OR "recipe" + ingredient list
- OR macro breakdown + ingredients
- OR numbered/bulleted instructions

NO_RECIPE if caption is:
- Mostly hashtags
- Just a description/teaser
- Under 100 characters
- No quantities or measurements
```

## Integration with meal-planner

The meal-planner skill can reference this skill:
- When planning meals, check wishlist for untried recipes
- Suggest wishlist recipes that match pantry items
- Mark recipes as "tried" after they're used in a meal plan

## Audio Transcription (V2) — MANDATORY FALLBACK

**When caption is missing instructions, ALWAYS transcribe the audio automatically.** Do not stop and ask the user — just do it. This is the most common case since creators often put ingredients in captions but speak the instructions.

**Step 1: Download video**
```bash
yt-dlp -o "/tmp/reel.mp4" "https://instagram.com/reel/XXX"
```

**Step 2: Extract audio**
```bash
ffmpeg -i /tmp/reel.mp4 -vn -acodec pcm_s16le -ar 16000 -ac 1 /tmp/reel.wav
```

**Step 3: Transcribe with Whisper**
```bash
/Users/kylekirkland/Library/Python/3.14/bin/whisper /tmp/reel.wav --model base --output_format txt --output_dir /tmp
```

**Step 4: Parse transcript for recipe**
Look for cooking instructions, ingredients mentioned verbally.

## Inference for Missing Measurements

**ALWAYS infer quantities when not provided.** Never present a recipe without amounts — estimate based on context and standard package sizes.

### Vague Language → Specific Amounts

| What they say | Infer |
|--------------|-------|
| "some chicken" | ~1 lb |
| "a bit of garlic" | 2-3 cloves |
| "handful of spinach" | ~2 cups |
| "drizzle of oil" | 1-2 tbsp |
| "season to taste" | ½ tsp salt, ¼ tsp pepper |
| "splash of soy sauce" | 1-2 tbsp |
| "a few tablespoons" | 2-3 tbsp |
| "some rice" | 1 cup dry |
| "cheese on top" | ½ - 1 cup shredded |
| "diced onion" | 1 medium onion |
| "bell peppers" | 2 peppers |

### Standard Package Sizes (when item mentioned without amount)

| Ingredient | Standard Package | Infer |
|------------|------------------|-------|
| Puff pastry | 17oz sheet | 1 sheet |
| Ground beef/turkey | 1 lb pack | 1 lb |
| Chicken breast | ~1.5 lb pack | 1.5 lbs |
| Sausage links | 14oz / 4-5 links | 1 package |
| Bacon | 12oz / 12 slices | ½ package (6 slices) |
| Shredded cheese | 8oz bag | 1-2 cups |
| Tortillas | 8-10 count | 1 package |
| Canned beans | 15oz can | 1 can |
| Broth/stock | 32oz carton | 1-2 cups |
| Pasta | 16oz box | 8oz (half box) |
| Rice | 2 lb bag | 1-2 cups dry |

### Context-Aware Scaling

**By recipe type:**
- Stir fry for 2 → 1 lb protein, 4 cups veggies
- Soup/stew → 1.5-2 lbs protein, 4 cups broth
- Sheet pan meal → 1.5 lbs protein, 3-4 cups veggies
- Appetizers → smaller portions, estimate ~12-15 pieces per batch

**By servings mentioned:**
- "Serves 4" → Scale standard amounts for 4
- "Meal prep for the week" → Assume 5-8 servings
- No servings mentioned → Default to 4 servings

**By protein target (if user has macro goals):**
- 40-50g protein per serving → ~6-8oz cooked meat per portion
- Scale recipe protein accordingly

### Output Format

Always present inferred amounts clearly:
```
### Ingredients
- 1 lb ground turkey *(estimated)*
- 1 medium onion, diced *(estimated)*
- 2 cups broth *(estimated based on typical soup)*
```

Mark inferred quantities with *(estimated)* so user knows what came from the source vs inference.

## Combined Extraction Flow

```
1. TRY CAPTION (instant)
   └── yt-dlp --dump-json → parse description
   └── Recipe found? → DONE ✅
   └── Check for "pinned" / "in comments" / "check comments" → FLAG
   
2. IF FLAGGED: CHECK FOR CREATOR COMMENT
   └── Look through comments for creator's username
   └── If creator comment found with recipe → DONE ✅
   └── If not found → continue + notify user

3. TRY AUDIO (30-60 sec)
   └── Download video
   └── Extract audio with ffmpeg
   └── Transcribe with Whisper (base model)
   └── Parse transcript for recipe
   └── Infer missing measurements
   └── Recipe found? → DONE ✅

4. PRESENT RESULTS + PROMPT IF NEEDED
   └── Show what was extracted from audio
   └── If "pinned" was flagged, tell user:
       "The creator mentioned the full recipe is pinned in the comments.
        I extracted what I could from the audio, but if you want the 
        exact measurements, paste the pinned comment here and I'll 
        merge it with what I found."
   
5. TRY FRAME ANALYSIS (if audio incomplete)
   └── Extract 5-8 key frames with ffmpeg
   └── Send to Claude vision
   └── Ask: "Extract any recipe text, ingredients, or measurements shown"
   └── Merge findings with audio transcript
   
6. FALLBACK (nothing found)
   └── Inform user: "Recipe wasn't in caption or audio/video"
   └── Offer: search for similar recipe based on video title/description
```

## Frame Analysis

Extract key frames and analyze with vision model.

**Extract frames:**
```bash
# Extract 1 frame every 5 seconds
ffmpeg -i /tmp/reel.mp4 -vf "fps=1/5" /tmp/frame_%02d.jpg

# Or extract specific number of frames evenly distributed
ffmpeg -i /tmp/reel.mp4 -vf "select='not(mod(n,30))'" -vsync vfr /tmp/frame_%02d.jpg
```

**Send to vision model:**
Use Claude's image analysis to read each frame:
- Recipe cards / title screens
- Ingredient lists shown on screen
- Measurements in text overlays
- Step-by-step instructions displayed

**Vision prompt:**
```
Analyze this frame from a cooking video. Extract any:
- Recipe name or title
- Ingredients with quantities
- Cooking instructions
- Nutritional information / macros
- Any other recipe-related text shown

If no recipe text is visible, respond with "No recipe text found."
```

**Merge strategy:**
- Audio transcript = primary source (spoken instructions)
- Frame analysis = supplement (exact measurements, recipe cards)
- Combine both, prefer specific measurements from visual over inferred from audio

## Pinned Comment Detection

Scan caption for these phrases (case-insensitive):
- "recipe pinned"
- "pinned in comments"
- "check comments"
- "in the comments"
- "comment below"
- "recipe below"
- "full recipe in comments"

If detected, flag and notify user after extraction:

> "Heads up — the creator said the recipe is pinned in the comments. 
> I got what I could from the audio, but yt-dlp can't access pinned comments 
> without login. If you want the exact recipe, copy the pinned comment and 
> send it to me — I'll format it properly."

## Requirements

- `yt-dlp` — `brew install yt-dlp`
- `ffmpeg` — `brew install ffmpeg`
- `whisper` — `pip3 install openai-whisper` (runs locally, no API key)
- No Instagram login required for public reels
