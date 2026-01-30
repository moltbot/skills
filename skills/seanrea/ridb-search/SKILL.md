---
name: ridb-search
description: Search the Recreation Information Database (RIDB) for campgrounds and recreation facilities near a location. Use when finding campgrounds, recreation areas, or federal facilities by location/radius. Supports geocoding (city names) and lat/lon coordinates.
---

# RIDB Search

Search recreation.gov's database for campgrounds and facilities near a location.

## Setup

Requires a free RIDB API key:
1. Go to https://ridb.recreation.gov/profile
2. Sign up and generate an API key
3. Set environment variable: `export RIDB_API_KEY=your_key_here`

## Usage

Search by location name (auto-geocodes):
```bash
python scripts/search.py --location "Bend, OR" --radius 50
python scripts/search.py -l "Yosemite Valley" -r 25 --camping-only
```

Search by coordinates:
```bash
python scripts/search.py --lat 44.0582 --lon -121.3153 --radius 50
```

### Options

| Flag | Description |
|------|-------------|
| `--location, -l` | Location name to geocode (e.g., "Bend, OR") |
| `--lat` | Latitude (use with --lon) |
| `--lon` | Longitude (use with --lat) |
| `--radius, -r` | Search radius in miles (default: 50) |
| `--limit` | Max results (default: 50) |
| `--camping-only` | Filter to camping facilities |
| `--reservable-only` | Filter to reservable facilities |
| `--json` | Output JSON (for programmatic use) |

### Output

Human-readable (default):
```
📍 Geocoded 'Bend, OR' to 44.0582, -121.3153

Found 23 facilities within 50 miles
------------------------------------------------------------

🏕️  Tumalo State Park
   ID: 234567 | ✅ Reservable
   Org: Oregon State Parks
   URL: https://www.recreation.gov/camping/campgrounds/234567
```

JSON output (`--json`):
```json
{
  "query": {"latitude": 44.0582, "longitude": -121.3153, "radius_miles": 50},
  "total_count": 23,
  "facilities": [
    {
      "id": "234567",
      "name": "Tumalo State Park",
      "reservable": true,
      "url": "https://www.recreation.gov/camping/campgrounds/234567"
    }
  ]
}
```

## Notes

- RIDB contains federal recreation data; some state/private campgrounds may not be listed
- The `id` field is the campground ID used for availability checks on recreation.gov
- Radius is in miles (RIDB native unit)
- Geocoding uses OpenStreetMap/Nominatim (free, no key required)
