---
name: apple-photos
description: Apple Photos.app integration for macOS. List albums, browse photos, search by date/person/content, export photos.
metadata: {"clawdbot":{"emoji":"📷","os":["darwin"]}}
---

# Apple Photos

Access Photos.app via SQLite queries. Run scripts from: `cd {baseDir}`

## Requirements
- Full Disk Access for terminal (System Settings → Privacy → Full Disk Access)

## Commands

| Command | Usage |
|---------|-------|
| Library stats | `scripts/photos-count.sh` |
| List albums | `scripts/photos-list-albums.sh` |
| Recent photos | `scripts/photos-recent.sh [count]` |
| List people | `scripts/photos-list-people.sh` |
| Search by person | `scripts/photos-search-person.sh <name> [limit]` |
| Search by content | `scripts/photos-search-content.sh <query> [limit]` |
| Search by date | `scripts/photos-search-date.sh <start> [end] [limit]` |
| Photo info | `scripts/photos-info.sh <uuid>` |
| Export photo | `scripts/photos-export.sh <uuid> [output_path]` |

## Output

- Recent/search: `Filename | Date | Type | UUID`
- People: `ID | Name | Photo Count`
- Default export: `/tmp/photo_export.jpg`

## Workflow: View a Photo

1. Get UUID: `scripts/photos-recent.sh 1`
2. Export: `scripts/photos-export.sh "UUID"`
3. View at `/tmp/photo_export.jpg`

## Notes

- Date format: `YYYY-MM-DD` or `YYYY-MM-DD HH:MM`
- Content search uses ML, slower (~5-10s) than date/person (~100ms)
- HEIC auto-converts to JPEG on export
- Name search is case-insensitive, partial match
