#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat >&2 <<'EOF'
Usage:
  speak.sh <text> [--voice alloy] [--model tts-1] [--format mp3] [--speed 1.0] [--out /path/to/out.mp3]

Voices: alloy, echo, fable, onyx, nova, shimmer
Models: tts-1 (fast), tts-1-hd (quality)
Formats: mp3, opus, aac, flac, wav, pcm
Speed: 0.25 to 4.0
EOF
  exit 2
}

if [[ "${1:-}" == "" || "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
fi

text="${1:-}"
shift || true

voice="alloy"
model="tts-1"
format="mp3"
speed="1.0"
out=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --voice)
      voice="${2:-}"
      shift 2
      ;;
    --model)
      model="${2:-}"
      shift 2
      ;;
    --format)
      format="${2:-}"
      shift 2
      ;;
    --speed)
      speed="${2:-}"
      shift 2
      ;;
    --out)
      out="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown arg: $1" >&2
      usage
      ;;
  esac
done

if [[ "${OPENAI_API_KEY:-}" == "" ]]; then
  echo "Missing OPENAI_API_KEY" >&2
  exit 1
fi

# Build JSON payload
json=$(cat <<EOF
{
  "model": "${model}",
  "input": $(printf '%s' "$text" | jq -Rs .),
  "voice": "${voice}",
  "response_format": "${format}",
  "speed": ${speed}
}
EOF
)

if [[ "$out" == "" ]]; then
  # Output to stdout
  curl -sS https://api.openai.com/v1/audio/speech \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$json"
else
  # Output to file
  mkdir -p "$(dirname "$out")"
  curl -sS https://api.openai.com/v1/audio/speech \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$json" \
    -o "$out"
  echo "$out"
fi
