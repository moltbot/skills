#!/usr/bin/env python3
"""setup.py — one-command setup for TAGO Bus Alerts

Interactive setup to make TAGO_SERVICE_KEY available to:
- your current shell (optional)
- Clawdbot Gateway systemd user service (so cron jobs can use TAGO)

Features:
- Auto-detect the Gateway systemd unit (supports custom names)
- Prompt for TAGO_SERVICE_KEY (hidden input)
- Save to an env file (default: ~/.clawdbot/secrets/tago.env, chmod 600)
- Write/patch a systemd override EnvironmentFile=...
- Restart the Gateway service
- Smoke-test TAGO API call

No secrets are printed.
"""

from __future__ import annotations

import argparse
import getpass
import os
import re
import stat
import subprocess
import sys
from pathlib import Path
from typing import List, Optional


DEFAULT_ENV_FILE = Path.home() / ".clawdbot" / "secrets" / "tago.env"


def run(cmd: List[str], *, check: bool = True) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=check)


def list_gateway_units() -> List[str]:
    # List *all* services to include inactive ones
    p = run(["systemctl", "--user", "list-units", "--type=service", "--all", "--no-legend", "--no-pager"], check=True)
    units: List[str] = []
    for line in p.stdout.splitlines():
        # format: UNIT LOAD ACTIVE SUB DESCRIPTION
        parts = line.split(None, 1)
        if not parts:
            continue
        unit = parts[0].strip()
        u = unit.lower()
        if "gateway" in u and "clawdbot" in u and unit.endswith(".service"):
            units.append(unit)
    # Prefer the canonical name
    units_sorted = sorted(units)
    if "clawdbot-gateway.service" in units_sorted:
        units_sorted.remove("clawdbot-gateway.service")
        units_sorted.insert(0, "clawdbot-gateway.service")
    return units_sorted


def choose_unit(candidates: List[str]) -> str:
    if not candidates:
        raise RuntimeError(
            "No systemd user service matching '*clawdbot*gateway*.service' was found. "
            "Are you running the Gateway via systemd --user?"
        )
    if len(candidates) == 1:
        return candidates[0]

    print("Multiple Gateway service units found. Choose one:")
    for i, u in enumerate(candidates, start=1):
        print(f"  {i}. {u}")

    while True:
        raw = input(f"Select [1-{len(candidates)}]: ").strip()
        try:
            idx = int(raw)
        except Exception:
            continue
        if 1 <= idx <= len(candidates):
            return candidates[idx - 1]


def write_env_file(path: Path, key: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")

    # Preserve other lines if file exists, but replace TAGO_SERVICE_KEY line.
    lines: List[str] = []
    if path.exists():
        existing = path.read_text(encoding="utf-8", errors="replace").splitlines(True)
        for ln in existing:
            if ln.startswith("TAGO_SERVICE_KEY="):
                continue
            lines.append(ln)

    lines.append(f"TAGO_SERVICE_KEY={key}\n")
    tmp.write_text("".join(lines), encoding="utf-8")
    os.replace(tmp, path)
    os.chmod(path, 0o600)


def systemd_override_path(unit: str) -> Path:
    # ~/.config/systemd/user/<unit>.d/override.conf
    return Path.home() / ".config" / "systemd" / "user" / f"{unit}.d" / "override.conf"


def patch_override(unit: str, env_file: Path) -> None:
    override = systemd_override_path(unit)
    override.parent.mkdir(parents=True, exist_ok=True)

    content = "[Service]\n" + f"EnvironmentFile=%h/.clawdbot/secrets/{env_file.name}\n"

    # If override exists, keep it simple: replace any previous EnvironmentFile line for our tago file.
    if override.exists():
        old = override.read_text(encoding="utf-8", errors="replace").splitlines(True)
        new_lines: List[str] = []
        in_service = False
        env_written = False
        for ln in old:
            if ln.strip().startswith("["):
                in_service = ln.strip().lower() == "[service]"
            if in_service and ln.strip().startswith("EnvironmentFile=") and "tago.env" in ln:
                # drop old tago env reference
                continue
            new_lines.append(ln)
        # Ensure we have a [Service] block and our EnvironmentFile
        text = "".join(new_lines)
        if "[Service]" not in text and "[service]" not in text.lower():
            text = text.rstrip() + "\n\n[Service]\n"
        if f"EnvironmentFile=%h/.clawdbot/secrets/{env_file.name}" not in text:
            text = text.rstrip() + f"\nEnvironmentFile=%h/.clawdbot/secrets/{env_file.name}\n"
        override.write_text(text, encoding="utf-8")
    else:
        override.write_text(content, encoding="utf-8")


def restart_gateway(unit: str) -> None:
    run(["systemctl", "--user", "daemon-reload"], check=True)
    run(["systemctl", "--user", "restart", unit], check=True)


def smoke_test(repo_root: Path) -> None:
    # A minimal smoke test; uses current environment with TAGO_SERVICE_KEY set.
    script = repo_root / "korea-metropolitan-bus-alerts" / "scripts" / "tago_bus_alert.py"
    if not script.exists():
        return

    p = subprocess.run(
        [sys.executable, str(script), "nearby-stops", "--lat", "37.5665", "--long", "126.9780"],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if p.returncode != 0:
        raise RuntimeError(f"Smoke test failed: {p.stderr.strip()}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--env-file", default=str(DEFAULT_ENV_FILE), help="Where to store the env file")
    ap.add_argument("--unit", default=None, help="Override auto-detected gateway unit")
    ap.add_argument(
        "--skip-smoke",
        action="store_true",
        help="Skip the TAGO API smoke test (useful if your network blocks the endpoint).",
    )
    args = ap.parse_args()

    env_file = Path(args.env_file).expanduser()

    # unit detection
    unit = args.unit
    if not unit:
        unit = choose_unit(list_gateway_units())

    print(f"Gateway unit: {unit}")
    print(f"Env file: {env_file}")

    key = getpass.getpass("TAGO_SERVICE_KEY (input hidden): ").strip()
    if not key:
        print("ERROR: empty key", file=sys.stderr)
        return 2

    write_env_file(env_file, key)

    # Put into this process env so smoke test can run
    os.environ["TAGO_SERVICE_KEY"] = key

    patch_override(unit, env_file)
    restart_gateway(unit)

    # Smoke test (TAGO connectivity)
    if not args.skip_smoke:
        repo_root = Path(__file__).resolve().parents[2]
        try:
            smoke_test(repo_root)
        except Exception as e:
            msg = str(e)
            # Most common: serviceKey encoding mismatch (double-encoded) or key not authorized.
            if "403" in msg:
                print(
                    "\nWARNING: TAGO smoke test got HTTP 403 (Forbidden).\n"
                    "This usually means one of:\n"
                    "- serviceKey encoding mismatch (data.go.kr provides both 'Encoding' and 'Decoding' keys)\n"
                    "- the key is not authorized for this API yet\n\n"
                    "Next steps:\n"
                    "1) Try running the test manually after setup:\n"
                    "   python3 korea-metropolitan-bus-alerts/scripts/tago_bus_alert.py nearby-stops --lat 37.5665 --long 126.9780\n"
                    "2) If it still 403s, re-run setup.py and paste the *other* form of the key (Encoding vs Decoding).\n"
                    "   (We now handle already-encoded keys better, but some keys/API permissions still cause 403.)\n"
                    "3) Or rerun with --skip-smoke to complete setup without testing.\n"
                )
                # Do not fail the whole setup on 403; env + systemd wiring may still be correct.
            else:
                raise

    print("\nSetup complete.")
    print("- TAGO key saved (chmod 600)")
    print("- Gateway service override written (EnvironmentFile)")
    print("- Gateway restarted")
    print("\nNext:")
    print("  python3 korea-metropolitan-bus-alerts/scripts/rule_wizard.py register")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
