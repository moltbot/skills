#!/bin/bash
# List recent photos from Photos library (fast SQLite query)
# Usage: photos-recent.sh [count]
# Default: 10 most recent
# Output: Filename | Date | Type | UUID

COUNT=${1:-10}
PHOTOS_DB=~/Pictures/Photos\ Library.photoslibrary/database/Photos.sqlite

if [ ! -f "$PHOTOS_DB" ]; then
    echo "Error: Photos database not found" >&2
    exit 1
fi

sqlite3 "$PHOTOS_DB" "
SELECT 
    ZFILENAME,
    datetime(ZDATECREATED + 978307200, 'unixepoch', 'localtime'),
    CASE ZUNIFORMTYPEIDENTIFIER
        WHEN 'public.heic' THEN 'HEIC'
        WHEN 'public.jpeg' THEN 'JPEG'
        WHEN 'public.png' THEN 'PNG'
        WHEN 'com.apple.quicktime-movie' THEN 'VIDEO'
        ELSE ZUNIFORMTYPEIDENTIFIER
    END,
    ZUUID
FROM ZASSET 
WHERE ZTRASHEDSTATE = 0 
    AND ZFILENAME IS NOT NULL
ORDER BY ZDATECREATED DESC 
LIMIT $COUNT;
" 2>/dev/null | while IFS='|' read -r filename date type uuid; do
    echo "$filename | $date | $type | $uuid"
done

if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo "Error: Could not query Photos database" >&2
    exit 1
fi
