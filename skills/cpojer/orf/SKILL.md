---
name: orf-digest
description: "On-demand ORF news digest in German. Use when the user says 'orf', 'pull orf', or 'orf 10'. Focus on Austrian politics (Inland) and international politics (Ausland) + major headlines; exclude sports. Send each item as its own message (Title + Age + Link). Then generate a Nano Banana image in a cartoon ZiB studio with the anchor presenting the news, plus subtle Easter eggs based on the selected stories."
---

# ORF Digest (news.orf.at)

## Command format

Interpret a user message that starts with `orf` as a request for an ORF News digest.

Supported forms:

- `orf` → default 5 items
- `orf <n>` → n items (max 15)
- `orf inland` / `orf ausland` → bias selection
- `orf <n> inland|ausland` → both

## Source + scope

- Primary source: `news.orf.at` (German)
- Prefer: **Inland** politics, **Ausland** / international politics, and major headlines.
- Exclude: sports (Sport).

## Output requirements

- Do **not** send any extra commentary/preamble/epilogue.
- Send results as **individual messages**.
- Each item message must be exactly:
  - first line: the headline (German)
  - second line: `<age>` (e.g. `45m ago`, `6h ago`, `2d ago`)
  - third line: the ORF link
- After the item messages, send **one final message** with the generated image.
  - The image must visually incorporate the pulled headlines on the wraparound studio video wall using 4–6 distinct story panels (no readable text; use symbolic graphics).
  - If the chat provider requires non-empty text for media, use a minimal caption `.`.

## Procedure

1. Parse `n` and optional `focus` (`inland`|`ausland`) from the user message.
2. Run `python3 skills/orf-digest/scripts/orf.py --count <n> --focus <focus> --format json`.
3. Send each returned item as its own message (3-line format).
4. Generate the ZiB studio mood image via Nano Banana:
   - Build prompt from items: `python3 skills/orf-digest/scripts/orf.py --count <n> --focus <focus> --format json | node skills/orf-digest/scripts/zib_prompt.mjs`
   - Generate: `skills/orf-digest/scripts/generate_zib_nano_banana.sh ./tmp/orf-zib/zib.png`
   - Send image as final message.

If fetching/parsing fails or returns 0 items:
- Use the browser tool to open `https://news.orf.at/`, pick N non-sport headlines by judgment, and send them in the same 3-line format.
- Still generate a ZiB studio image with a few generic political-news Easter eggs.
