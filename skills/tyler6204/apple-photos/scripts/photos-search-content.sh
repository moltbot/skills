#!/bin/bash
# Search photos by content (objects, scenes, text) using Photos.app ML
# Usage: photos-search-content.sh <query> [limit]
# Examples: "cat", "beach", "receipt", "food", "car"
# Default limit: 10
# NOTE: Slower than other searches (~5-10 seconds) - uses AppleScript

QUERY="$1"
LIMIT="${2:-10}"

if [ -z "$QUERY" ]; then
    echo "Usage: photos-search-content.sh <query> [limit]" >&2
    echo "  Examples: cat, beach, receipt, food, car, sunset" >&2
    exit 1
fi

osascript -e "
tell application \"Photos\"
    set foundPhotos to search for \"$QUERY\"
    set photoCount to count of foundPhotos
    set output to \"\"
    set exportCount to 0
    
    repeat with p in foundPhotos
        if exportCount >= $LIMIT then exit repeat
        try
            set fname to filename of p
            set fdate to date of p
            set fid to id of p
            set output to output & fname & \"|\" & (fdate as string) & \"|\" & fid & \"\n\"
            set exportCount to exportCount + 1
        end try
    end repeat
    
    return output & \"---\n\" & \"Total: \" & photoCount & \" results for '\" & \"$QUERY\" & \"'\"
end tell
" 2>/dev/null | while IFS='|' read -r line; do
    echo "$line"
done
