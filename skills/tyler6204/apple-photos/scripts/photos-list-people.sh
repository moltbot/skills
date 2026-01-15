#!/bin/bash
# List all recognized people in Photos library
# Usage: photos-list-people.sh
# Output: ID | Name | Photo Count

PHOTOS_DB=~/Pictures/Photos\ Library.photoslibrary/database/Photos.sqlite

if [ ! -f "$PHOTOS_DB" ]; then
    echo "Error: Photos database not found" >&2
    exit 1
fi

sqlite3 "$PHOTOS_DB" "
SELECT 
    p.Z_PK,
    COALESCE(p.ZDISPLAYNAME, p.ZFULLNAME, 'Unnamed'),
    COUNT(DISTINCT f.ZASSETFORFACE) as photo_count
FROM ZPERSON p
LEFT JOIN ZDETECTEDFACE f ON f.ZPERSONFORFACE = p.Z_PK
WHERE (p.ZDISPLAYNAME IS NOT NULL AND p.ZDISPLAYNAME != '')
   OR (p.ZFULLNAME IS NOT NULL AND p.ZFULLNAME != '')
GROUP BY p.Z_PK
HAVING photo_count > 0
ORDER BY photo_count DESC;
" 2>/dev/null | while IFS='|' read -r id name count; do
    echo "$id | $name | $count photos"
done
