# RIDB Search

A Python CLI for searching the Recreation Information Database (RIDB) to find federal campgrounds and recreation facilities near a location.

## Overview

RIDB is the authoritative database behind recreation.gov. This tool searches it to find:

- **Campground IDs** needed for `recgov-availability`
- Facility metadata (reservable status, managing agency)
- Nearby recreation areas

Use this to discover campgrounds, then check availability with `recgov-availability`.

### Coverage

- National Park Service facilities
- USDA Forest Service campgrounds
- Bureau of Land Management sites
- Army Corps of Engineers recreation areas
- Bureau of Reclamation facilities

For state parks, use `reserveamerica` instead.

## Prerequisites

- Python 3.8+
- **RIDB API key** (free)

### Getting an API Key

1. Go to https://ridb.recreation.gov/profile
2. Create an account
3. Generate an API key
4. Set the environment variable:

```bash
export RIDB_API_KEY=your_key_here
```

## Quick Start

```bash
cd /Users/doop/moltbot/skills/ridb-search

# Search by location name
python3 scripts/search.py --location "Newport, Oregon" --radius 30

# Filter to camping only
python3 scripts/search.py -l "Yosemite Valley" -r 25 --camping-only

# JSON output for scripts
python3 scripts/search.py -l "Bend, OR" --camping-only --json
```

## CLI Options

```bash
python3 scripts/search.py [options]
```

| Option | Description |
|--------|-------------|
| `-l, --location` | Location to geocode (e.g., "Bend, OR") |
| `--lat` | Latitude (use with --lon) |
| `--lon` | Longitude (use with --lat) |
| `-r, --radius` | Search radius in miles (default: 50) |
| `--limit` | Max results (default: 50) |
| `--camping-only` | Filter to camping facilities |
| `--reservable-only` | Filter to reservable facilities |
| `--api-key` | RIDB API key (or use env var) |
| `--json` | JSON output |

## Examples

### Find campgrounds near Newport, OR

```bash
python3 scripts/search.py -l "Newport, Oregon" --camping-only
```

Output:
```
📍 Geocoded 'Newport, Oregon' to 44.6368, -124.0534

Found 34 facilities within 50 miles
------------------------------------------------------------

🏕️  TILLICUM
   ID: 233965 | ✅ Reservable
   Org: Siuslaw National Forest
   URL: https://www.recreation.gov/camping/campgrounds/233965

🏕️  CAPE PERPETUA
   ID: 233900 | ✅ Reservable
   Org: Siuslaw National Forest
   URL: https://www.recreation.gov/camping/campgrounds/233900
```

### JSON output for scripting

```bash
python3 scripts/search.py -l "Bend, OR" --camping-only --reservable-only --json
```

```json
{
  "query": {
    "latitude": 44.0582,
    "longitude": -121.3153,
    "radius_miles": 50
  },
  "total_count": 47,
  "facilities": [
    {
      "id": "232089",
      "name": "TUMALO STATE PARK",
      "type": "Campground",
      "reservable": true,
      "latitude": 44.1272,
      "longitude": -121.3308,
      "description": "...",
      "url": "https://www.recreation.gov/camping/campgrounds/232089",
      "parent_org": "Oregon State Parks"
    }
  ]
}
```

## Workflow: Search → Check Availability → Book

```bash
# 1. Find campgrounds near your destination
python3 scripts/search.py -l "Newport, OR" --camping-only --reservable-only

# 2. Note the IDs, then check availability
python3 ../recgov-availability/scripts/check.py \
  -c 233965 233900 \
  --start 2026-07-10 \
  --nights 2

# 3. Book on recreation.gov
open "https://www.recreation.gov/camping/campgrounds/233965"
```

## Architecture

```
scripts/
└── search.py      # Single-file CLI (stdlib only)

references/
└── (add API docs here if needed)
```

### API Endpoint

```
GET https://ridb.recreation.gov/api/v1/facilities
```

Headers:
- `apikey`: Your RIDB API key

Query Parameters:
- `latitude`, `longitude`: Search center
- `radius`: Miles
- `limit`: Max results
- `activity`: Activity ID filter (9 = Camping)

## Technical Notes

### Geocoding

Uses OpenStreetMap Nominatim for free location→coordinates conversion. No API key needed.

### Rate Limiting

RIDB doesn't document rate limits, but be reasonable (~1 req/sec for bulk operations).

### No Dependencies

Uses only Python standard library.

## Combining with Other Skills

| Task | Skill |
|------|-------|
| Find campground IDs | **ridb-search** (this) |
| Check rec.gov availability | recgov-availability |
| Search state parks | reserveamerica |

## License

MIT
