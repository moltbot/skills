#!/bin/bash
# Get photo library statistics
# Usage: photos-count.sh
# Output: Quick stats about the library

PHOTOS_DB=~/Pictures/Photos\ Library.photoslibrary/database/Photos.sqlite

if [ ! -f "$PHOTOS_DB" ]; then
    echo "Error: Photos database not found" >&2
    exit 1
fi

total=$(sqlite3 "$PHOTOS_DB" "SELECT COUNT(*) FROM ZASSET WHERE ZTRASHEDSTATE = 0;" 2>/dev/null)
photos=$(sqlite3 "$PHOTOS_DB" "SELECT COUNT(*) FROM ZASSET WHERE ZTRASHEDSTATE = 0 AND ZKIND = 0;" 2>/dev/null)
videos=$(sqlite3 "$PHOTOS_DB" "SELECT COUNT(*) FROM ZASSET WHERE ZTRASHEDSTATE = 0 AND ZKIND = 1;" 2>/dev/null)
favorites=$(sqlite3 "$PHOTOS_DB" "SELECT COUNT(*) FROM ZASSET WHERE ZTRASHEDSTATE = 0 AND ZFAVORITE = 1;" 2>/dev/null)
hidden=$(sqlite3 "$PHOTOS_DB" "SELECT COUNT(*) FROM ZASSET WHERE ZTRASHEDSTATE = 0 AND ZHIDDEN = 1;" 2>/dev/null)
screenshots=$(sqlite3 "$PHOTOS_DB" "SELECT COUNT(*) FROM ZASSET WHERE ZTRASHEDSTATE = 0 AND ZKINDSUBTYPE = 2;" 2>/dev/null)

echo "Total: $total"
echo "Photos: $photos"
echo "Videos: $videos"
echo "Screenshots: $screenshots"
echo "Favorites: $favorites"
echo "Hidden: $hidden"
