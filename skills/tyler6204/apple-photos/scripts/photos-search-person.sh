#!/bin/bash
# Search photos by person name
# Usage: photos-search-person.sh <name> [limit]
# Name search is case-insensitive and partial match
# Default limit: 50
# Output: Filename | Date | Type | UUID

NAME="$1"
LIMIT="${2:-50}"

if [ -z "$NAME" ]; then
    echo "Usage: photos-search-person.sh <name> [limit]" >&2
    exit 1
fi

PHOTOS_DB=~/Pictures/Photos\ Library.photoslibrary/database/Photos.sqlite

if [ ! -f "$PHOTOS_DB" ]; then
    echo "Error: Photos database not found" >&2
    exit 1
fi

# First find matching person IDs
PERSON_IDS=$(sqlite3 "$PHOTOS_DB" "
SELECT Z_PK FROM ZPERSON 
WHERE LOWER(ZDISPLAYNAME) LIKE LOWER('%$NAME%')
   OR LOWER(ZFULLNAME) LIKE LOWER('%$NAME%');
" 2>/dev/null | tr '\n' ',' | sed 's/,$//')

if [ -z "$PERSON_IDS" ]; then
    echo "No person found matching '$NAME'"
    exit 0
fi

# Get photos for those persons
sqlite3 "$PHOTOS_DB" "
SELECT DISTINCT
    a.ZFILENAME,
    datetime(a.ZDATECREATED + 978307200, 'unixepoch', 'localtime'),
    CASE a.ZUNIFORMTYPEIDENTIFIER
        WHEN 'public.heic' THEN 'HEIC'
        WHEN 'public.jpeg' THEN 'JPEG'
        WHEN 'public.png' THEN 'PNG'
        WHEN 'com.apple.quicktime-movie' THEN 'VIDEO'
        ELSE a.ZUNIFORMTYPEIDENTIFIER
    END,
    a.ZUUID
FROM ZASSET a
JOIN ZDETECTEDFACE f ON f.ZASSETFORFACE = a.Z_PK
WHERE f.ZPERSONFORFACE IN ($PERSON_IDS)
  AND a.ZTRASHEDSTATE = 0
  AND a.ZFILENAME IS NOT NULL
ORDER BY a.ZDATECREATED DESC
LIMIT $LIMIT;
" 2>/dev/null | while IFS='|' read -r filename date type uuid; do
    echo "$filename | $date | $type | $uuid"
done

# Get total count
TOTAL=$(sqlite3 "$PHOTOS_DB" "
SELECT COUNT(DISTINCT a.Z_PK)
FROM ZASSET a
JOIN ZDETECTEDFACE f ON f.ZASSETFORFACE = a.Z_PK
WHERE f.ZPERSONFORFACE IN ($PERSON_IDS)
  AND a.ZTRASHEDSTATE = 0;
" 2>/dev/null)

echo "---"
echo "Total: $TOTAL photos of '$NAME'"
