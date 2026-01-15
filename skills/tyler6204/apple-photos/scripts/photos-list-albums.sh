#!/bin/bash
# List all albums in Photos.app
# Usage: photos-list-albums.sh
# Output: Album Name | Photo Count

osascript -e '
tell application "Photos"
    set output to ""
    repeat with a in albums
        set albumName to name of a
        set photoCount to count of media items of a
        set output to output & albumName & " | " & photoCount & "\n"
    end repeat
    return output
end tell
' 2>/dev/null | sed '/^$/d'

if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo "Error: Could not access Photos.app" >&2
    exit 1
fi
