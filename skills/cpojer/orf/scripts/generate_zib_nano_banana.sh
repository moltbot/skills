#!/bin/sh
set -eu

OUT_PATH="$1"
COUNT="${2:-5}"
FOCUS="${3:-auto}"

VENV_DIR="./tmp/hn-venv"
PY="$VENV_DIR/bin/python"

if [ ! -x "$PY" ]; then
  python3 -m venv "$VENV_DIR"
  "$PY" -m pip install --quiet --disable-pip-version-check google-genai pillow
fi

JSON="$(python3 skills/orf-digest/scripts/orf.py --count "$COUNT" --focus "$FOCUS" --format json)"
PROMPT="$(printf "%s" "$JSON" | node skills/orf-digest/scripts/zib_prompt.mjs)"

"$PY" skills/hn-digest/scripts/nano_banana_mood.py --out "$OUT_PATH" --resolution 1K --prompt "$PROMPT"
