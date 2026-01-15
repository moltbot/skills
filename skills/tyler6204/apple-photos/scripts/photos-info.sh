#!/bin/bash
# Get detailed info about a photo
# Usage: photos-info.sh <uuid>
# Output: Key-value pairs

UUID="$1"

if [ -z "$UUID" ]; then
    echo "Usage: photos-info.sh <uuid>" >&2
    exit 1
fi

PHOTOS_DB=~/Pictures/Photos\ Library.photoslibrary/database/Photos.sqlite

if [ ! -f "$PHOTOS_DB" ]; then
    echo "Error: Photos database not found" >&2
    exit 1
fi

sqlite3 -separator '|' "$PHOTOS_DB" "
SELECT 
    ZUUID,
    ZFILENAME,
    datetime(ZDATECREATED + 978307200, 'unixepoch', 'localtime'),
    datetime(ZMODIFICATIONDATE + 978307200, 'unixepoch', 'localtime'),
    datetime(ZADDEDDATE + 978307200, 'unixepoch', 'localtime'),
    ZUNIFORMTYPEIDENTIFIER,
    ZWIDTH,
    ZHEIGHT,
    CASE WHEN ZFAVORITE = 1 THEN 'Yes' ELSE 'No' END,
    CASE WHEN ZHIDDEN = 1 THEN 'Yes' ELSE 'No' END,
    ZLATITUDE,
    ZLONGITUDE
FROM ZASSET 
WHERE ZUUID = '$UUID' 
    AND ZTRASHEDSTATE = 0
LIMIT 1;
" 2>/dev/null | while IFS='|' read -r uuid filename created modified added type width height favorite hidden lat lon; do
    if [ -z "$uuid" ]; then
        echo "Error: Photo with UUID '$UUID' not found" >&2
        exit 1
    fi
    echo "UUID: $uuid"
    echo "Filename: $filename"
    echo "Created: $created"
    echo "Modified: $modified"
    echo "Added: $added"
    echo "Type: $type"
    echo "Dimensions: ${width}x${height}"
    echo "Favorite: $favorite"
    echo "Hidden: $hidden"
    if [ -n "$lat" ] && [ "$lat" != "" ] && [ "$lat" != "0" ] && [ "$lat" != "-180.0" ] && [ "$lat" != "-180" ]; then
        echo "Location: $lat, $lon"
    else
        echo "Location: None"
    fi
done

# Check if anything was output
if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo "Error: Could not query Photos database" >&2
    exit 1
fi
