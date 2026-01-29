#!/usr/bin/env python3
"""rule_wizard.py

Interactive helper to create/manage TAGO bus alert cron jobs.

Goals (MVP):
- Provide a *"skill-like"* interactive CLI to register an alert rule.
- Resolve stop candidates via GPS nearby lookup.
- Generate a Clawdbot cron job JSON and optionally register it via `clawdbot cron add`.

Requirements:
- Python 3
- Env: TAGO_SERVICE_KEY (for stop/arrival queries)
- `clawdbot` CLI available on PATH (only if you choose to register jobs from this wizard)

Security:
- Never prints or stores TAGO_SERVICE_KEY.
- Writes no secrets to repo.

Notes:
- DM-only delivery is enforced by asking for (channel,to) explicitly.
- For Telegram DM, `to` is the numeric chat id (e.g. "8203532117").

Usage:
  python3 rule_wizard.py register
  python3 rule_wizard.py list
  python3 rule_wizard.py remove --job <jobId>
  python3 rule_wizard.py test --city <cityCode> --node <nodeId> --routes 535,730
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from dataclasses import asdict
from typing import Any, Dict, List, Optional, Tuple

from cron_builder import build_prompt, parse_routes, parse_time, ScheduleSpec
from tago_api import arrivals_for_stop, city_codes, format_arrival, stops_by_name, stops_nearby


def _confirm(prompt: str) -> bool:
    ans = input(f"{prompt} (y/N): ").strip().lower()
    return ans in ("y", "yes")


def _pick_one(items: List[str], prompt: str = "Choose") -> int:
    while True:
        raw = input(f"{prompt} [1-{len(items)}]: ").strip()
        try:
            i = int(raw)
        except Exception:
            print("Enter a number.")
            continue
        if 1 <= i <= len(items):
            return i - 1
        print("Out of range.")


def _require_clawdbot() -> str:
    exe = shutil.which("clawdbot")
    if not exe:
        raise RuntimeError("'clawdbot' CLI not found in PATH.")
    return exe


def _run(cmd: List[str]) -> str:
    p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if p.returncode != 0:
        raise RuntimeError(f"Command failed ({p.returncode}): {' '.join(cmd)}\n{p.stderr.strip()}")
    return p.stdout


def cmd_test(args: argparse.Namespace) -> int:
    routes = parse_routes(args.routes)
    arrs = arrivals_for_stop(args.city, args.node)
    arrs = [a for a in arrs if a.route_no in set(routes)]

    if not arrs:
        print("No arrivals found for selected routes.")
        return 0

    grouped: Dict[str, List[Any]] = {}
    for a in arrs:
        grouped.setdefault(a.route_no, []).append(a)

    print("[버스 알림 테스트]")
    for route_no, xs in sorted(grouped.items()):
        nxt = " / ".join(format_arrival(x) for x in xs[:2])
        print(f"- {route_no}: {nxt}")
    return 0


def _interactive_resolve_stop() -> Tuple[str, str, str]:
    print("Stop resolution")
    mode = input("- mode [name|gps] (default name): ").strip().lower() or "name"

    if mode == "gps":
        lat = float(input("- latitude (e.g. 37.5665): ").strip())
        lon = float(input("- longitude (e.g. 126.9780): ").strip())
        cands = stops_nearby(lat, lon, num_rows=30)
        if not cands:
            raise RuntimeError("No stop candidates returned. Try mode=name.")
    else:
        # Name search (MVP): cityCode + keyword
        city = input("- cityCode (enter '?' to search): ").strip()
        if city == "?":
            cq = input("  city name contains (e.g. 인천/고양/서울): ").strip()
            cc = city_codes()
            if cq:
                cc = [c for c in cc if cq in c.city_name]
            if not cc:
                raise RuntimeError("No city codes matched.")
            print("\nCity codes:")
            for i, c in enumerate(cc[:30], start=1):
                print(f"{i:>2}. {c.city_name} ({c.city_code})")
            pick = _pick_one([f"{c.city_name} ({c.city_code})" for c in cc[:30]], prompt="Select city")
            city = cc[pick].city_code
            print(f"Selected cityCode={city}")

        if not city:
            raise RuntimeError("cityCode is required for name search")

        q = input("- stop name keyword (e.g. 한빛초등학교): ").strip()
        if not q:
            raise RuntimeError("keyword is required")

        cands = stops_by_name(city, q, max_results=40)
        if not cands:
            raise RuntimeError("No stop candidates returned for that keyword/cityCode.")

    labels = []
    for s in cands:
        loc = ""
        if s.gps_lat is not None and s.gps_long is not None:
            loc = f" ({s.gps_lat:.5f},{s.gps_long:.5f})"
        labels.append(f"{s.name} | cityCode={s.city_code} nodeId={s.node_id}{loc}")

    print("\nCandidates:")
    for idx, line in enumerate(labels, start=1):
        print(f"{idx:>2}. {line}")

    pick = _pick_one(labels, prompt="Select the correct stop/direction")
    s = cands[pick]
    return s.city_code, s.node_id, s.name


def cmd_register(args: argparse.Namespace) -> int:
    print("\n=== TAGO Bus Alerts: register ===\n")

    schedule = input("Schedule kind [daily|weekday|weekend]: ").strip().lower()
    if schedule not in ("daily", "weekday", "weekend"):
        raise RuntimeError("invalid schedule kind")

    hh, mm = parse_time(input("Time (HH:MM): ").strip())
    routes = parse_routes(input("Routes (comma-separated, e.g. 535,730): ").strip())

    city, node, stop_name = _interactive_resolve_stop()

    name = input(f"Job name (default: {schedule} {hh:02d}:{mm:02d} {stop_name} {'/'.join(routes)}): ").strip()
    if not name:
        name = f"{schedule} {hh:02d}:{mm:02d} {stop_name} {'/'.join(routes)}"

    tz = input("Timezone (default Asia/Seoul): ").strip() or "Asia/Seoul"

    # Delivery target
    channel = input("Deliver channel (e.g. telegram): ").strip() or "telegram"
    to = input("Deliver to (DM chat id / user id target): ").strip()
    if not to:
        raise RuntimeError("delivery target 'to' is required for DM-only")

    spec = ScheduleSpec(kind=schedule, hh=hh, mm=mm, tz=tz)
    job = {
        "name": name,
        "schedule": {"kind": "cron", "cron": spec.to_cron(), "tz": spec.tz},
        "sessionTarget": "isolated",
        "payload": {
            "kind": "agentTurn",
            "message": build_prompt(city, node, routes),
            "deliver": True,
            "bestEffortDeliver": True,
            "channel": channel,
            "to": to,
        },
    }

    print("\n--- job JSON ---")
    print(json.dumps(job, ensure_ascii=False, indent=2))

    if args.no_add:
        print("\n(no-add) Not registering job. Copy the JSON and add via clawdbot cron.")
        return 0

    if not _confirm("Register this job now via 'clawdbot cron add'? "):
        print("Cancelled.")
        return 0

    exe = _require_clawdbot()

    # Use CLI flags rather than raw JSON to minimize risk; this mirrors cron_builder semantics.
    # NOTE: We do not pass secrets.
    cmd = [
        exe,
        "cron",
        "add",
        "--name",
        name,
        "--cron",
        spec.to_cron(),
        "--tz",
        spec.tz,
        "--session",
        "isolated",
        "--message",
        job["payload"]["message"],
        "--deliver",
        "--channel",
        channel,
        "--to",
        to,
    ]

    out = _run(cmd)
    print("\n--- clawdbot output ---")
    print(out.strip())
    return 0


def cmd_list(_: argparse.Namespace) -> int:
    exe = _require_clawdbot()
    out = _run([exe, "cron", "list"])
    print(out.strip())
    return 0


def cmd_remove(args: argparse.Namespace) -> int:
    exe = _require_clawdbot()
    job_id = args.job
    if not _confirm(f"Delete cron job {job_id}?"):
        print("Cancelled.")
        return 0
    out = _run([exe, "cron", "remove", job_id])
    print(out.strip())
    return 0


def main() -> int:
    p = argparse.ArgumentParser(prog="korea-metropolitan-bus-alerts-wizard")
    sub = p.add_subparsers(dest="cmd", required=True)

    r = sub.add_parser("register", help="Interactive rule registration")
    r.add_argument("--no-add", action="store_true", help="Only print JSON; do not call clawdbot")
    r.set_defaults(fn=cmd_register)

    l = sub.add_parser("list", help="List cron jobs")
    l.set_defaults(fn=cmd_list)

    rm = sub.add_parser("remove", help="Remove a cron job")
    rm.add_argument("--job", required=True)
    rm.set_defaults(fn=cmd_remove)

    t = sub.add_parser("test", help="One-off arrival test (no cron)")
    t.add_argument("--city", required=True)
    t.add_argument("--node", required=True)
    t.add_argument("--routes", required=True)
    t.set_defaults(fn=cmd_test)

    args = p.parse_args()
    try:
        return int(args.fn(args))
    except KeyboardInterrupt:
        print("\nInterrupted.")
        return 130
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
