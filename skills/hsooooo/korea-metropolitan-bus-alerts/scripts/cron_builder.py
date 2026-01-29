#!/usr/bin/env python3
"""cron_builder.py

Generate Clawdbot cron job JSON for scheduled TAGO bus alerts.

Why: ClawdHub skills should be deterministic and portable. This script creates a
job payload that a Clawdbot agent (or user) can pass to `clawdbot cron add`.

Inputs (resolved values):
- schedule: one of {daily, weekday, weekend} + HH:MM
- stop: TAGO cityCode + nodeId (direction already disambiguated)
- routes: route numbers (list)

Security:
- Do NOT embed TAGO_SERVICE_KEY.

Usage:
  python3 cron_builder.py build-job \
    --name "평일 07:00 한빛초 535" \
    --schedule weekday --time 07:00 \
    --city 25 --node DJB8001793 \
    --routes 535,730

Outputs:
- JSON job object (for clawdbot cron add tool/CLI)

Note:
- Delivery target (channel/to) should be filled by the agent at registration
  time to ensure DM-only delivery to the registering user.
"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class ScheduleSpec:
    kind: str  # daily|weekday|weekend
    hh: int
    mm: int
    tz: str = "Asia/Seoul"

    def to_cron(self) -> str:
        # 5-field cron: minute hour day month dayOfWeek
        dow = "*"
        if self.kind == "weekday":
            dow = "1-5"
        elif self.kind == "weekend":
            dow = "0,6"
        return f"{self.mm} {self.hh} * * {dow}"


def parse_time(s: str) -> tuple[int, int]:
    m = re.match(r"^(\d{1,2}):(\d{2})$", s.strip())
    if not m:
        raise ValueError("time must be HH:MM")
    hh = int(m.group(1))
    mm = int(m.group(2))
    if hh < 0 or hh > 23 or mm < 0 or mm > 59:
        raise ValueError("invalid time")
    return hh, mm


def parse_routes(s: str) -> List[str]:
    parts = [p.strip() for p in (s or "").split(",") if p.strip()]
    if not parts:
        raise ValueError("routes required")
    return parts


def build_prompt(city: str, node: str, routes: List[str]) -> str:
    routes_csv = ",".join(routes)
    # The agent will run the deterministic script and then output a clean summary.
    return (
        "You are running a scheduled TAGO bus arrival alert.\n"
        "- Do not reveal any secrets.\n"
        "- Query TAGO arrivals using the helper script and format a short message.\n\n"
        "Steps:\n"
        f"1) Run: python3 korea-metropolitan-bus-alerts/scripts/tago_bus_alert.py arrivals --city {city} --node {node} --routes {routes_csv}\n"
        "2) Parse the JSON and produce a human-friendly summary (Korean).\n"
        "3) Output ONLY the final message text (no code blocks).\n\n"
        "Format example:\n"
        "[버스 알림]\n"
        "- 535: 3분(2정거장 전) / 다음 12분\n"
        "- 730: 5분 / 다음 18분\n"
    )


def cmd_build_job(args: argparse.Namespace) -> int:
    hh, mm = parse_time(args.time)
    spec = ScheduleSpec(kind=args.schedule, hh=hh, mm=mm, tz=args.tz)
    routes = parse_routes(args.routes)

    job = {
        "name": args.name,
        "schedule": {"kind": "cron", "cron": spec.to_cron(), "tz": spec.tz},
        "sessionTarget": "isolated",
        "payload": {
            "kind": "agentTurn",
            "message": build_prompt(args.city, args.node, routes),
            # deliver target should be set by the registering agent (DM-only)
            "deliver": True,
            "bestEffortDeliver": True,
        },
    }

    print(json.dumps(job, ensure_ascii=False, indent=2))
    return 0


def main() -> int:
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)

    b = sub.add_parser("build-job")
    b.add_argument("--name", required=True)
    b.add_argument("--schedule", choices=["daily", "weekday", "weekend"], required=True)
    b.add_argument("--time", required=True, help="HH:MM")
    b.add_argument("--tz", default="Asia/Seoul")
    b.add_argument("--city", required=True, help="TAGO cityCode")
    b.add_argument("--node", required=True, help="TAGO nodeId")
    b.add_argument("--routes", required=True, help="comma-separated route numbers")
    b.set_defaults(fn=cmd_build_job)

    args = p.parse_args()
    return int(args.fn(args))


if __name__ == "__main__":
    raise SystemExit(main())
