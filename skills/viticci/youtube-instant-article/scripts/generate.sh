#!/bin/zsh
# YouTube Instant Article Generator
# Creates Telegraph Instant View articles with slides from YouTube videos

set -euo pipefail

# Check for required token
if [[ -z "${TELEGRAPH_TOKEN:-}" ]]; then
    echo "Error: TELEGRAPH_TOKEN environment variable is required." >&2
    exit 1
fi

# Configuration
SLIDES_MAX="${SLIDES_MAX:-6}"
SLIDES_DIR="/tmp/yt-instant-slides-$$"

# Parse arguments
URL=""
DEBUG=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --slides-max) SLIDES_MAX="$2"; shift 2 ;;
        --debug) DEBUG=true; shift ;;
        -h|--help)
            echo "Usage: $0 <youtube_url> [--slides-max N] [--debug]"
            exit 0
            ;;
        *) [[ -z "$URL" ]] && URL="$1"; shift ;;
    esac
done

[[ -z "$URL" ]] && { echo "Usage: $0 <youtube_url> [--slides-max N]"; exit 1; }

# Cleanup
cleanup() { [[ "$DEBUG" == "false" ]] && rm -rf "$SLIDES_DIR" 2>/dev/null || true; }
trap cleanup EXIT
mkdir -p "$SLIDES_DIR"

echo "📹 Extracting slides..." >&2

# Extract slides (background) and get summary
summarize "$URL" --slides --slides-max "$SLIDES_MAX" --slides-dir "$SLIDES_DIR" --extract-only --plain >/dev/null 2>&1 &
SLIDES_PID=$!

echo "📝 Getting summary..." >&2

# Get video title from extract debug output
VIDEO_TITLE=$(summarize "$URL" --extract-only --plain --debug 2>&1 | grep 'title=' | sed 's/.*title=//' | sed 's/ transcriptSource=.*//' | head -1)

SUMMARY=$(summarize "$URL" --length short --timestamps --plain --model openai/gpt-5.2 2>/dev/null) || {
    echo "Error: Failed to get summary" >&2
    exit 1
}

wait $SLIDES_PID 2>/dev/null || true

# Find slides (recursively) and sort
typeset -a SLIDE_FILES
SLIDE_FILES=()
while IFS= read -r f; do
    [[ -n "$f" ]] && SLIDE_FILES+=("$f")
done < <(find "$SLIDES_DIR" -type f \( -name "*.png" -o -name "*.jpg" \) 2>/dev/null | sort | head -"$SLIDES_MAX")

SLIDE_COUNT=${#SLIDE_FILES[@]}
echo "📤 Uploading $SLIDE_COUNT slides..." >&2

# Upload slides to catbox.moe
typeset -a IMG_URLS
IMG_URLS=()
for slide in "${SLIDE_FILES[@]}"; do
    url=$(curl -s "https://catbox.moe/user/api.php" -F "reqtype=fileupload" -F "fileToUpload=@$slide" 2>/dev/null)
    [[ "$url" == https://* ]] && IMG_URLS+=("$url")
done

echo "🔨 Building article..." >&2

# Helper: check if line is a timestamp line
is_timestamp_line() {
    echo "$1" | grep -qE '^\[?[0-9]+:[0-9]+|^[-*•] *\[?[0-9]+:[0-9]+'
}

# Use video title, fallback to "Video Summary"
TITLE="${VIDEO_TITLE:-Video Summary}"
# Truncate if too long
TITLE="${TITLE:0:200}"

# Build Telegraph content
CONTENT='[]'

# Video link
CONTENT=$(echo "$CONTENT" | jq --arg url "$URL" '. + [
    {"tag": "p", "children": ["📺 ", {"tag": "a", "attrs": {"href": $url}, "children": ["Watch video"]}]}
]')

# Count timestamp sections to distribute images evenly
typeset -a TS_LINES
TS_LINES=()
while IFS= read -r line; do
    if is_timestamp_line "$line"; then
        TS_LINES+=("$line")
    fi
done <<< "$SUMMARY"

TS_COUNT=${#TS_LINES[@]}
IMG_COUNT=${#IMG_URLS[@]}

# Calculate which timestamps get images (distribute evenly)
typeset -a IMG_AT_TS
IMG_AT_TS=()
if [[ $IMG_COUNT -gt 0 && $TS_COUNT -gt 0 ]]; then
    step=$((TS_COUNT / IMG_COUNT))
    [[ $step -lt 1 ]] && step=1
    img_idx=0
    for ((i=0; i<TS_COUNT && img_idx<IMG_COUNT; i+=step)); do
        IMG_AT_TS+=($i)
        img_idx=$((img_idx + 1))
    done
fi

# Process summary
ts_idx=0
img_assigned=0
while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    
    # Timestamp line
    if is_timestamp_line "$line"; then
        # Check if this timestamp should have an image
        for idx in "${IMG_AT_TS[@]}"; do
            if [[ $idx -eq $ts_idx && $img_assigned -lt $IMG_COUNT ]]; then
                CONTENT=$(echo "$CONTENT" | jq --arg src "${IMG_URLS[$((img_assigned+1))]}" '. + [
                    {"tag": "figure", "children": [{"tag": "img", "attrs": {"src": $src}}]}
                ]')
                img_assigned=$((img_assigned + 1))
                break
            fi
        done
        
        # Clean up the timestamp line and add as h4
        clean_line=$(echo "$line" | sed 's/^[-•*] *//' | sed 's/^\[//' | sed 's/\] / - /')
        CONTENT=$(echo "$CONTENT" | jq --arg h "⏱️ $clean_line" '. + [{"tag": "h4", "children": [$h]}]')
        ts_idx=$((ts_idx + 1))
        
    # Headers
    elif [[ "$line" == "##"* ]]; then
        h=$(echo "$line" | sed 's/^#* *//')
        CONTENT=$(echo "$CONTENT" | jq --arg h "$h" '. + [{"tag": "h4", "children": [$h]}]')
        
    # Blockquotes
    elif [[ "$line" == \*\"* || "$line" == \*\'* ]]; then
        q=$(echo "$line" | sed 's/^\*"//' | sed 's/"\*$//' | sed "s/^\*'//" | sed "s/'\*$//")
        CONTENT=$(echo "$CONTENT" | jq --arg q "$q" '. + [{"tag": "blockquote", "children": [$q]}]')
        
    # Regular paragraphs (skip if it's the title)
    elif [[ "$line" != "$TITLE" ]]; then
        CONTENT=$(echo "$CONTENT" | jq --arg p "$line" '. + [{"tag": "p", "children": [$p]}]')
    fi
done <<< "$SUMMARY"

# Add any remaining images at the end
while [[ $img_assigned -lt $IMG_COUNT ]]; do
    CONTENT=$(echo "$CONTENT" | jq --arg src "${IMG_URLS[$((img_assigned+1))]}" '. + [
        {"tag": "figure", "children": [{"tag": "img", "attrs": {"src": $src}}]}
    ]')
    img_assigned=$((img_assigned + 1))
done

# Footer
CONTENT=$(echo "$CONTENT" | jq '. + [{"tag": "hr"}, {"tag": "p", "children": [{"tag": "em", "children": ["Generated with youtube-instant-article"]}]}]')

echo "🌐 Publishing..." >&2

RESPONSE=$(curl -s -X POST "https://api.telegra.ph/createPage" \
    -H "Content-Type: application/json" \
    -d "$(jq -n \
        --arg t "$TELEGRAPH_TOKEN" \
        --arg title "$TITLE" \
        --argjson c "$CONTENT" \
        '{access_token:$t, title:$title, author_name:"Navi ✨", content:$c}')")

if echo "$RESPONSE" | jq -e '.ok' >/dev/null 2>&1; then
    PAGE_URL=$(echo "$RESPONSE" | jq -r '.result.url')
    echo "" >&2
    echo "✅ Done!" >&2
    echo ""
    echo "$PAGE_URL"
else
    echo "Error: $(echo "$RESPONSE" | jq -r '.error // "Unknown error"')" >&2
    exit 1
fi
