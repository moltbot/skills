#!/usr/bin/env python3
import os
import subprocess
import sys

PROJECT_DIR = os.path.expanduser('~/Developer/CodexMonitor')


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("Usage: codex_monitor.py <subcommand> [args...]", file=sys.stderr)
        print("Examples:")
        print("  codex_monitor.py list 2026/01/08")
        print("  codex_monitor.py list --json 2026/01/08")
        print("  codex_monitor.py show <session-id>")
        print("  codex_monitor.py watch")
        print("  codex_monitor.py watch --session <session-id>")
        print("  codex_monitor.py monitor")
        return 2

    if not os.path.isdir(PROJECT_DIR):
        print(f"Missing project directory: {PROJECT_DIR}", file=sys.stderr)
        return 2

    subcommand = argv[1]
    if subcommand == "monitor":
        cmd = ["swift", "run", "CodexMonitor-App"] + argv[2:]
    else:
        cmd = ["swift", "run", "CodexMonitor-CLI"] + argv[1:]

    # Run in the project dir so SwiftPM can resolve package.
    proc = subprocess.run(cmd, cwd=PROJECT_DIR)
    return proc.returncode


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
