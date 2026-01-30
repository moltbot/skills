#!/usr/bin/env python3
"""
Search RIDB (Recreation Information Database) for campgrounds near a location.

Requires: RIDB_API_KEY environment variable
Get a free key at: https://ridb.recreation.gov/profile

Usage:
    python search.py --location "Bend, OR" --radius 50
    python search.py --lat 44.0582 --lon -121.3153 --radius 50
    python search.py --location "Yosemite Valley" --radius 25 --limit 20
"""

import argparse
import json
import os
import sys
import urllib.parse
import urllib.request
from typing import Optional

RIDB_BASE_URL = "https://ridb.recreation.gov/api/v1"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"


def geocode(location: str) -> tuple[float, float]:
    """Convert a location name to lat/lon using Nominatim (OpenStreetMap)."""
    params = urllib.parse.urlencode({
        "q": location,
        "format": "json",
        "limit": 1,
    })
    url = f"{NOMINATIM_URL}?{params}"
    
    req = urllib.request.Request(url, headers={
        "User-Agent": "ridb-search/1.0 (camping availability checker)"
    })
    
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode())
    
    if not data:
        raise ValueError(f"Could not geocode location: {location}")
    
    return float(data[0]["lat"]), float(data[0]["lon"])


def search_facilities(
    lat: float,
    lon: float,
    radius: int = 50,
    limit: int = 50,
    activity: Optional[str] = None,
    api_key: Optional[str] = None,
) -> dict:
    """
    Search RIDB for facilities (campgrounds) near a location.
    
    Args:
        lat: Latitude
        lon: Longitude
        radius: Search radius in miles (default 50)
        limit: Max results to return (default 50)
        activity: Filter by activity (e.g., "CAMPING" or activity ID "9")
        api_key: RIDB API key (falls back to RIDB_API_KEY env var)
    
    Returns:
        dict with RECDATA (list of facilities) and METADATA
    """
    api_key = api_key or os.environ.get("RIDB_API_KEY")
    if not api_key:
        raise ValueError(
            "RIDB API key required. Set RIDB_API_KEY env var or pass --api-key.\n"
            "Get a free key at: https://ridb.recreation.gov/profile"
        )
    
    params = {
        "latitude": lat,
        "longitude": lon,
        "radius": radius,
        "limit": limit,
    }
    
    # Filter to camping facilities
    if activity:
        params["activity"] = activity
    
    query = urllib.parse.urlencode(params)
    url = f"{RIDB_BASE_URL}/facilities?{query}"
    
    req = urllib.request.Request(url, headers={
        "apikey": api_key,
        "Accept": "application/json",
    })
    
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())


def format_facility(facility: dict) -> dict:
    """Extract key info from a facility record."""
    return {
        "id": facility.get("FacilityID"),
        "name": facility.get("FacilityName"),
        "type": facility.get("FacilityTypeDescription"),
        "reservable": facility.get("Reservable", False),
        "latitude": facility.get("FacilityLatitude"),
        "longitude": facility.get("FacilityLongitude"),
        "description": (facility.get("FacilityDescription") or "")[:200],
        "url": f"https://www.recreation.gov/camping/campgrounds/{facility.get('FacilityID')}",
        "parent_org": facility.get("ParentOrgName"),
    }


def main():
    parser = argparse.ArgumentParser(
        description="Search RIDB for campgrounds near a location"
    )
    parser.add_argument(
        "--location", "-l",
        help="Location to search near (e.g., 'Bend, OR')"
    )
    parser.add_argument("--lat", type=float, help="Latitude")
    parser.add_argument("--lon", type=float, help="Longitude")
    parser.add_argument(
        "--radius", "-r",
        type=int,
        default=50,
        help="Search radius in miles (default: 50)"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=50,
        help="Max results (default: 50)"
    )
    parser.add_argument(
        "--camping-only",
        action="store_true",
        help="Filter to camping facilities only"
    )
    parser.add_argument(
        "--reservable-only",
        action="store_true",
        help="Filter to reservable facilities only"
    )
    parser.add_argument("--api-key", help="RIDB API key (or set RIDB_API_KEY)")
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output raw JSON"
    )
    
    args = parser.parse_args()
    
    # Get coordinates
    if args.location:
        try:
            lat, lon = geocode(args.location)
            if not args.json:
                print(f"📍 Geocoded '{args.location}' to {lat:.4f}, {lon:.4f}\n")
        except Exception as e:
            print(f"Error geocoding location: {e}", file=sys.stderr)
            sys.exit(1)
    elif args.lat is not None and args.lon is not None:
        lat, lon = args.lat, args.lon
    else:
        print("Error: Provide --location or both --lat and --lon", file=sys.stderr)
        sys.exit(1)
    
    # Search RIDB
    try:
        # Activity ID 9 = Camping
        activity = "9" if args.camping_only else None
        result = search_facilities(
            lat=lat,
            lon=lon,
            radius=args.radius,
            limit=args.limit,
            activity=activity,
            api_key=args.api_key,
        )
    except ValueError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    except urllib.error.HTTPError as e:
        print(f"API Error ({e.code}): {e.read().decode()}", file=sys.stderr)
        sys.exit(1)
    
    facilities = result.get("RECDATA", [])
    
    # Filter to reservable if requested
    if args.reservable_only:
        facilities = [f for f in facilities if f.get("Reservable")]
    
    if args.json:
        output = {
            "query": {
                "latitude": lat,
                "longitude": lon,
                "radius_miles": args.radius,
            },
            "total_count": result.get("METADATA", {}).get("RESULTS", {}).get("TOTAL_COUNT", 0),
            "facilities": [format_facility(f) for f in facilities],
        }
        print(json.dumps(output, indent=2))
    else:
        total = result.get("METADATA", {}).get("RESULTS", {}).get("TOTAL_COUNT", 0)
        print(f"Found {total} facilities within {args.radius} miles\n")
        print("-" * 60)
        
        for f in facilities:
            info = format_facility(f)
            reservable = "✅ Reservable" if info["reservable"] else "❌ Not reservable"
            print(f"\n🏕️  {info['name']}")
            print(f"   ID: {info['id']} | {reservable}")
            if info["parent_org"]:
                print(f"   Org: {info['parent_org']}")
            print(f"   URL: {info['url']}")
        
        if not facilities:
            print("\nNo facilities found. Try increasing --radius.")


if __name__ == "__main__":
    main()
