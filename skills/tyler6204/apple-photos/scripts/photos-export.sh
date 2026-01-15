#!/bin/bash
# Export a photo from Photos library to a viewable format
# Usage: photos-export.sh <uuid> [output_path]
# Default output: /tmp/photo_export.jpg
# Automatically converts HEIC to JPEG

UUID="$1"
OUTPUT="${2:-/tmp/photo_export.jpg}"

if [ -z "$UUID" ]; then
    echo "Usage: photos-export.sh <uuid> [output_path]" >&2
    exit 1
fi

PHOTOS_LIB=~/Pictures/Photos\ Library.photoslibrary
PHOTOS_DB="$PHOTOS_LIB/database/Photos.sqlite"

if [ ! -f "$PHOTOS_DB" ]; then
    echo "Error: Photos database not found" >&2
    exit 1
fi

# Get filename and directory from UUID
read -r FILENAME DIRECTORY < <(sqlite3 "$PHOTOS_DB" "
SELECT ZFILENAME, ZDIRECTORY 
FROM ZASSET 
WHERE ZUUID = '$UUID' 
    AND ZTRASHEDSTATE = 0
LIMIT 1;
" 2>/dev/null | tr '|' ' ')

if [ -z "$FILENAME" ]; then
    echo "Error: Photo with UUID '$UUID' not found" >&2
    exit 1
fi

# Find the original file
ORIGINAL=$(find "$PHOTOS_LIB/originals" -name "$FILENAME" 2>/dev/null | head -1)

if [ -z "$ORIGINAL" ] || [ ! -f "$ORIGINAL" ]; then
    echo "Error: Original file not found for $FILENAME" >&2
    exit 1
fi

# Get file extension
EXT="${FILENAME##*.}"
EXT_LOWER=$(echo "$EXT" | tr '[:upper:]' '[:lower:]')

# Ensure output directory exists
mkdir -p "$(dirname "$OUTPUT")"

# Check if ImageMagick is available for proper orientation handling
HAS_MAGICK=false
if command -v magick >/dev/null 2>&1; then
    HAS_MAGICK=true
elif command -v convert >/dev/null 2>&1; then
    HAS_MAGICK=true
fi

# Convert HEIC/HEIF to JPEG, copy others directly
if [[ "$EXT_LOWER" == "heic" || "$EXT_LOWER" == "heif" ]]; then
    if [ "$HAS_MAGICK" = true ]; then
        # Use ImageMagick for HEIC conversion + auto-orient
        magick "$ORIGINAL" -auto-orient "$OUTPUT" 2>/dev/null || \
        convert "$ORIGINAL" -auto-orient "$OUTPUT" 2>/dev/null
    else
        # Fallback to sips
        sips -s format jpeg "$ORIGINAL" --out "$OUTPUT" >/dev/null 2>&1
    fi
    if [ $? -ne 0 ]; then
        echo "Error: Failed to convert HEIC to JPEG" >&2
        exit 1
    fi
elif [[ "$EXT_LOWER" == "png" || "$EXT_LOWER" == "jpg" || "$EXT_LOWER" == "jpeg" ]]; then
    if [ "$HAS_MAGICK" = true ]; then
        # Use ImageMagick to copy + auto-orient
        magick "$ORIGINAL" -auto-orient "$OUTPUT" 2>/dev/null || \
        convert "$ORIGINAL" -auto-orient "$OUTPUT" 2>/dev/null
    else
        cp "$ORIGINAL" "$OUTPUT"
    fi
else
    # For other formats (video, etc), just copy
    cp "$ORIGINAL" "$OUTPUT"
fi

echo "$OUTPUT"
