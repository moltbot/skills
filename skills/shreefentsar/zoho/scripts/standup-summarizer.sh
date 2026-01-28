#!/usr/bin/env bash
# standup-summarizer.sh — Pull Zoho Meeting recordings, transcribe via Gemini, summarize
# Usage: ./standup-summarizer.sh [--date YYYY-MM-DD] [--force-id <erecordingId>]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
ZOHO_SKILL_DIR="/root/clawd/skills/zoho"
PROCESSED_FILE="/root/clawd/data/standup-processed.json"
TMP_DIR="/tmp/standup-$$"

# ── Load env ──────────────────────────────────────────────────────────
source "${ZOHO_SKILL_DIR}/.env"
GEMINI_API_KEY="${GEMINI_API_KEY:-}"
ZOHO_MEETING_ORG_ID="${ZOHO_MEETING_ORG_ID:-853106938}"

[[ -n "$GEMINI_API_KEY" ]] || { echo "ERROR: GEMINI_API_KEY not set" >&2; exit 1; }

# ── Args ──────────────────────────────────────────────────────────────
TARGET_DATE=""
FORCE_ID=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --date) TARGET_DATE="$2"; shift 2 ;;
    --force-id) FORCE_ID="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

# Default: today (Cairo time = UTC+2)
if [[ -z "$TARGET_DATE" ]]; then
  TARGET_DATE=$(TZ="Africa/Cairo" date +%Y-%m-%d)
fi

# Convert target date to epoch range (Cairo timezone)
TARGET_START_MS=$(TZ="Africa/Cairo" date -d "${TARGET_DATE} 00:00:00" +%s)000
TARGET_END_MS=$(TZ="Africa/Cairo" date -d "${TARGET_DATE} 23:59:59" +%s)999

echo "📅 Target date: ${TARGET_DATE} (Cairo)"
echo "⏰ Range: ${TARGET_START_MS} - ${TARGET_END_MS}"

# ── Ensure dirs ──────────────────────────────────────────────────────
mkdir -p "$TMP_DIR" "$(dirname "$PROCESSED_FILE")"
[[ -f "$PROCESSED_FILE" ]] || echo '[]' > "$PROCESSED_FILE"

cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

# ── Get Zoho access token ────────────────────────────────────────────
get_token() {
  "${ZOHO_SKILL_DIR}/bin/zoho" token
}

# ── Fetch recordings ────────────────────────────────────────────────
echo "🔍 Fetching recordings from Zoho Meeting..."
TOKEN=$(get_token)
RECORDINGS=$(curl -s -X GET \
  "https://meeting.zoho.com/meeting/api/v2/${ZOHO_MEETING_ORG_ID}/recordings.json" \
  -H "Authorization: Zoho-oauthtoken ${TOKEN}" \
  -H "Content-Type: application/json")

# Check for errors
if echo "$RECORDINGS" | jq -e '.error' &>/dev/null; then
  echo "ERROR: Zoho API error: $(echo "$RECORDINGS" | jq -r '.error')" >&2
  exit 1
fi

# ── Filter today's recordings ───────────────────────────────────────
echo "🔎 Filtering for date: ${TARGET_DATE}..."

if [[ -n "$FORCE_ID" ]]; then
  TODAY_RECORDINGS=$(echo "$RECORDINGS" | jq --arg fid "$FORCE_ID" \
    '[.recordings[] | select(.erecordingId == $fid)]')
else
  TODAY_RECORDINGS=$(echo "$RECORDINGS" | jq --argjson start "$TARGET_START_MS" --argjson end "$TARGET_END_MS" \
    '[.recordings[] | select(.startTimeinMs >= $start and .startTimeinMs <= $end)]')
fi

RECORDING_COUNT=$(echo "$TODAY_RECORDINGS" | jq 'length')
echo "📊 Found ${RECORDING_COUNT} recording(s) for ${TARGET_DATE}"

if [[ "$RECORDING_COUNT" -eq 0 ]]; then
  echo '{"status":"no_recordings","date":"'"${TARGET_DATE}"'","count":0}'
  exit 0
fi

# ── Process each recording ──────────────────────────────────────────
RESULTS="[]"
for i in $(seq 0 $((RECORDING_COUNT - 1))); do
  REC=$(echo "$TODAY_RECORDINGS" | jq ".[$i]")
  EREC_ID=$(echo "$REC" | jq -r '.erecordingId')
  TOPIC=$(echo "$REC" | jq -r '.topic')
  DURATION_MINS=$(echo "$REC" | jq -r '.durationInMins')
  DOWNLOAD_URL=$(echo "$REC" | jq -r '.downloadUrl // .publicDownloadUrl')
  FILE_SIZE=$(echo "$REC" | jq -r '.fileSize // .FileSize')
  START_MS=$(echo "$REC" | jq -r '.startTimeinMs')
  
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📹 Recording: ${TOPIC}"
  echo "   Duration: ${DURATION_MINS} min | Size: ${FILE_SIZE}"
  echo "   ID: ${EREC_ID}"
  
  # Check if already processed
  if jq -e --arg id "$EREC_ID" '.[] | select(. == $id)' "$PROCESSED_FILE" &>/dev/null; then
    echo "   ⏭️  Already processed, skipping"
    continue
  fi
  
  # Download recording
  echo "   ⬇️  Downloading..."
  TOKEN=$(get_token)
  MP4_FILE="${TMP_DIR}/recording_${i}.mp4"
  HTTP_CODE=$(curl -s -w "%{http_code}" -o "$MP4_FILE" -L \
    -H "Authorization: Zoho-oauthtoken ${TOKEN}" \
    "$DOWNLOAD_URL")
  
  if [[ "$HTTP_CODE" != "200" ]] || [[ ! -s "$MP4_FILE" ]]; then
    echo "   ❌ Download failed (HTTP ${HTTP_CODE})"
    # Try public download URL if different
    PUB_URL=$(echo "$REC" | jq -r '.publicDownloadUrl // empty')
    if [[ -n "$PUB_URL" && "$PUB_URL" != "$DOWNLOAD_URL" ]]; then
      echo "   🔄 Trying public URL..."
      HTTP_CODE=$(curl -s -w "%{http_code}" -o "$MP4_FILE" -L "$PUB_URL")
    fi
    if [[ "$HTTP_CODE" != "200" ]] || [[ ! -s "$MP4_FILE" ]]; then
      echo "   ❌ Download failed completely"
      continue
    fi
  fi
  
  ACTUAL_SIZE=$(du -h "$MP4_FILE" | cut -f1)
  echo "   ✅ Downloaded: ${ACTUAL_SIZE}"
  
  # Extract audio
  echo "   🎵 Extracting audio..."
  WAV_FILE="${TMP_DIR}/audio_${i}.wav"
  ffmpeg -i "$MP4_FILE" -vn -acodec pcm_s16le -ar 16000 -ac 1 "$WAV_FILE" -y -loglevel error 2>&1
  
  if [[ ! -s "$WAV_FILE" ]]; then
    echo "   ❌ Audio extraction failed"
    continue
  fi
  
  WAV_SIZE=$(du -h "$WAV_FILE" | cut -f1)
  echo "   ✅ Audio extracted: ${WAV_SIZE}"
  
  # Check if audio is too large for Gemini inline (20MB limit for audio)
  WAV_BYTES=$(stat -c%s "$WAV_FILE")
  
  # Transcribe via Gemini Flash
  echo "   🧠 Transcribing via Gemini Flash..."
  
  if [[ "$WAV_BYTES" -gt 20000000 ]]; then
    # Large file: upload via File API first
    echo "   📤 Large file — uploading to Gemini File API..."
    UPLOAD_RESP=$(curl -s -X POST \
      "https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GEMINI_API_KEY}" \
      -H "X-Goog-Upload-Command: start, upload, finalize" \
      -H "X-Goog-Upload-Header-Content-Length: ${WAV_BYTES}" \
      -H "X-Goog-Upload-Header-Content-Type: audio/wav" \
      -H "Content-Type: audio/wav" \
      --data-binary "@${WAV_FILE}")
    
    FILE_URI=$(echo "$UPLOAD_RESP" | jq -r '.file.uri // empty')
    if [[ -z "$FILE_URI" ]]; then
      echo "   ❌ File upload failed: $(echo "$UPLOAD_RESP" | jq -r '.error.message // "unknown"')"
      continue
    fi
    echo "   ✅ Uploaded: ${FILE_URI}"
    
    GEMINI_BODY=$(jq -n \
      --arg uri "$FILE_URI" \
      '{
        "contents": [{
          "parts": [
            {"file_data": {"mime_type": "audio/wav", "file_uri": $uri}},
            {"text": "Transcribe this meeting recording. The speakers are Egyptian and speak in Egyptian Arabic mixed with English technical terms. Provide a faithful transcription preserving the language as spoken (Arabic parts in Arabic script, English parts in English). Include speaker changes where detectable. Do NOT summarize — provide the full transcription."}
          ]
        }],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 8192}
      }')
  else
    # Small file: inline base64 — write to temp file to avoid arg-list-too-long
    B64_FILE="${TMP_DIR}/audio_${i}.b64"
    base64 -w0 "$WAV_FILE" > "$B64_FILE"
    PROMPT_TEXT="Transcribe this meeting recording. The speakers are Egyptian and speak in Egyptian Arabic mixed with English technical terms. Provide a faithful transcription preserving the language as spoken (Arabic parts in Arabic script, English parts in English). Include speaker changes where detectable. Do NOT summarize — provide the full transcription."
    GEMINI_BODY=$(jq -n --rawfile audio "$B64_FILE" --arg prompt "$PROMPT_TEXT" \
      '{
        "contents": [{
          "parts": [
            {"inline_data": {"mime_type": "audio/wav", "data": $audio}},
            {"text": $prompt}
          ]
        }],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 8192}
      }')
    rm -f "$B64_FILE"
  fi
  
  GEMINI_BODY_FILE="${TMP_DIR}/gemini_body_${i}.json"
  echo "$GEMINI_BODY" > "$GEMINI_BODY_FILE"
  GEMINI_RESP=$(curl -s -X POST \
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "@${GEMINI_BODY_FILE}")
  rm -f "$GEMINI_BODY_FILE"
  
  TRANSCRIPT=$(echo "$GEMINI_RESP" | jq -r '.candidates[0].content.parts[0].text // empty')
  
  if [[ -z "$TRANSCRIPT" ]]; then
    echo "   ❌ Transcription failed: $(echo "$GEMINI_RESP" | jq -r '.error.message // "unknown"')"
    # Try with gemini-2.5-flash as fallback
    echo "   🔄 Retrying with gemini-2.5-flash..."
    GEMINI_BODY_FILE="${TMP_DIR}/gemini_body_${i}.json"
    echo "$GEMINI_BODY" > "$GEMINI_BODY_FILE"
    GEMINI_RESP=$(curl -s -X POST \
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}" \
      -H "Content-Type: application/json" \
      -d "@${GEMINI_BODY_FILE}")
    rm -f "$GEMINI_BODY_FILE"
    TRANSCRIPT=$(echo "$GEMINI_RESP" | jq -r '.candidates[0].content.parts[0].text // empty')
    if [[ -z "$TRANSCRIPT" ]]; then
      echo "   ❌ Transcription failed on both models"
      continue
    fi
  fi
  
  TRANSCRIPT_LEN=${#TRANSCRIPT}
  echo "   ✅ Transcribed: ${TRANSCRIPT_LEN} chars"
  
  # Save transcript
  TRANSCRIPT_FILE="${TMP_DIR}/transcript_${i}.txt"
  echo "$TRANSCRIPT" > "$TRANSCRIPT_FILE"
  
  # Build result JSON
  RESULT=$(jq -n \
    --arg id "$EREC_ID" \
    --arg topic "$TOPIC" \
    --arg duration "$DURATION_MINS" \
    --arg date "$TARGET_DATE" \
    --arg start_ms "$START_MS" \
    --arg transcript "$TRANSCRIPT" \
    '{
      "erecordingId": $id,
      "topic": $topic,
      "durationMins": ($duration | tonumber),
      "date": $date,
      "startMs": ($start_ms | tonumber),
      "transcript": $transcript
    }')
  
  RESULTS=$(echo "$RESULTS" | jq --argjson r "$RESULT" '. + [$r]')
  
  # Mark as processed
  jq --arg id "$EREC_ID" '. + [$id]' "$PROCESSED_FILE" > "${PROCESSED_FILE}.tmp"
  mv "${PROCESSED_FILE}.tmp" "$PROCESSED_FILE"
  
  echo "   ✅ Done processing"
  
  # Clean up large files immediately to save disk
  rm -f "$MP4_FILE" "$WAV_FILE"
done

# ── Output results ──────────────────────────────────────────────────
RESULT_COUNT=$(echo "$RESULTS" | jq 'length')
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Processed ${RESULT_COUNT} recording(s)"

if [[ "$RESULT_COUNT" -eq 0 ]]; then
  echo '{"status":"nothing_new","date":"'"${TARGET_DATE}"'","count":0}'
  exit 0
fi

# Output the full results JSON for the caller to summarize
echo "---RESULTS_JSON_START---"
echo "$RESULTS" | jq '.'
echo "---RESULTS_JSON_END---"
