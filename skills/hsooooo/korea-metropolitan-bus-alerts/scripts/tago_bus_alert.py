#!/usr/bin/env python3
"""korea-metropolitan-bus-alerts MVP CLI helpers.

This script is meant to be used by an agent (Clawdbot) as a deterministic helper.
It does NOT register cron automatically in this repo; the skill guides users
through Clawdbot cron registration.

Commands:
- nearby-stops --lat <float> --long <float>
- arrivals --city <cityCode> --node <nodeId> [--routes 535,730]

Env:
- TAGO_SERVICE_KEY (required)

Security:
- Never print the service key.
"""

from __future__ import annotations

import argparse
import json
import sys
from typing import List, Optional

from tago_api import arrivals_for_stop, city_codes, format_arrival, stops_by_name, stops_nearby


def cmd_nearby_stops(args: argparse.Namespace) -> int:
    items = stops_nearby(args.lat, args.long, num_rows=args.num_rows)
    out = [
        {
            "nodeId": s.node_id,
            "cityCode": s.city_code,
            "name": s.name,
            "gpsLat": s.gps_lat,
            "gpsLong": s.gps_long,
        }
        for s in items
    ]
    print(json.dumps(out, ensure_ascii=False, indent=2))
    return 0


def _parse_routes(s: Optional[str]) -> Optional[List[str]]:
    if not s:
        return None
    parts = [p.strip() for p in s.split(",") if p.strip()]
    return parts or None


def _cmd_city_codes(args: argparse.Namespace) -> int:
    items = city_codes()
    q = (args.q or "").strip()
    if q:
        items = [c for c in items if q in c.city_name]
    out = [{"cityCode": c.city_code, "cityName": c.city_name} for c in items]
    print(json.dumps(out, ensure_ascii=False, indent=2))
    return 0


def _cmd_search_stops(args: argparse.Namespace) -> int:
    items = stops_by_name(args.city, args.q, max_results=args.max)
    out = [
        {
            "nodeId": s.node_id,
            "cityCode": s.city_code,
            "name": s.name,
            "gpsLat": s.gps_lat,
            "gpsLong": s.gps_long,
        }
        for s in items
    ]
    print(json.dumps(out, ensure_ascii=False, indent=2))
    return 0


def cmd_arrivals(args: argparse.Namespace) -> int:
    routes = _parse_routes(args.routes)
    arrs = arrivals_for_stop(args.city, args.node, num_rows=args.num_rows)
    if routes:
        wanted = set(routes)
        arrs = [a for a in arrs if a.route_no in wanted]

    # group by route
    grouped = {}
    for a in arrs:
        grouped.setdefault(a.route_no, []).append(a)

    # output a compact structure
    out = []
    for route_no, xs in sorted(grouped.items(), key=lambda kv: kv[0]):
        out.append(
            {
                "routeNo": route_no,
                "next": [format_arrival(x) for x in xs[:2]],
            }
        )

    print(json.dumps({"cityCode": args.city, "nodeId": args.node, "arrivals": out}, ensure_ascii=False, indent=2))
    return 0


def main() -> int:
    p = argparse.ArgumentParser(prog="korea-metropolitan-bus-alerts")
    sub = p.add_subparsers(dest="cmd", required=True)

    p1 = sub.add_parser("nearby-stops", help="List nearby stop candidates by GPS")
    p1.add_argument("--lat", type=float, required=True)
    p1.add_argument("--long", type=float, required=True)
    p1.add_argument("--num-rows", type=int, default=30)
    p1.set_defaults(fn=cmd_nearby_stops)

    p_city = sub.add_parser("city-codes", help="List TAGO city codes")
    p_city.add_argument("--q", help="Optional substring filter for city name")
    p_city.set_defaults(fn=lambda a: _cmd_city_codes(a))

    p_name = sub.add_parser("search-stops", help="Search stops by name within a cityCode")
    p_name.add_argument("--city", required=True, help="TAGO cityCode")
    p_name.add_argument("--q", required=True, help="Stop name keyword")
    p_name.add_argument("--max", type=int, default=40)
    p_name.set_defaults(fn=lambda a: _cmd_search_stops(a))

    p2 = sub.add_parser("arrivals", help="List arrivals for a stop (optionally filtered by route numbers)")
    p2.add_argument("--city", required=True, help="TAGO cityCode")
    p2.add_argument("--node", required=True, help="TAGO nodeId")
    p2.add_argument("--routes", help="Comma-separated route numbers to filter")
    p2.add_argument("--num-rows", type=int, default=200)
    p2.set_defaults(fn=cmd_arrivals)

    args = p.parse_args()
    try:
        # Some parsers use a lambda, ensure call semantics.
        fn = getattr(args, "fn", None)
        if fn is None:
            raise RuntimeError("no command handler")
        return int(fn(args))
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
