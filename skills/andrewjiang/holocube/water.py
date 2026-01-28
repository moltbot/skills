#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = ["requests"]
# ///
"""
Water Tracking for HoloCube

Track daily water consumption with a cute water drop icon in the top-left corner.
State persists to a local file so it survives restarts.

Usage:
    uv run --script water.py              # Show current count
    uv run --script water.py add          # Add a glass (+1)
    uv run --script water.py add 2        # Add 2 glasses
    uv run --script water.py set 5        # Set to 5 glasses
    uv run --script water.py reset        # Reset to 0
    uv run --script water.py goal 10      # Set daily goal to 10
"""

import argparse
import json
import os
from datetime import date
from holocube_client import HoloCube, draw_water_tracker

# State file location
STATE_FILE = os.path.expanduser("~/.holocube_water.json")
DEFAULT_GOAL = 8


def load_state() -> dict:
    """Load water tracking state from file"""
    today = date.today().isoformat()
    default = {"date": today, "count": 0, "goal": DEFAULT_GOAL}

    if not os.path.exists(STATE_FILE):
        return default

    try:
        with open(STATE_FILE) as f:
            state = json.load(f)
            # Reset count if it's a new day
            if state.get("date") != today:
                state["date"] = today
                state["count"] = 0
            return state
    except (json.JSONDecodeError, IOError):
        return default


def save_state(state: dict) -> None:
    """Save water tracking state to file"""
    state["date"] = date.today().isoformat()
    with open(STATE_FILE, "w") as f:
        json.dump(state, f)


def update_display(cube: HoloCube, count: int, goal: int) -> None:
    """Update the water tracker on the display"""
    draw_water_tracker(cube, count, goal)


def main():
    parser = argparse.ArgumentParser(description="Water Tracking for HoloCube")
    parser.add_argument("--ip", default="192.168.7.80", help="HoloCube IP")
    parser.add_argument("--no-display", action="store_true", help="Don't update display")
    parser.add_argument("command", nargs="?", default="show",
                        choices=["show", "add", "set", "reset", "goal"],
                        help="Command to run")
    parser.add_argument("value", nargs="?", type=int, help="Value for add/set/goal")
    args = parser.parse_args()

    state = load_state()

    if args.command == "show":
        print(f"Water: {state['count']}/{state['goal']} glasses")

    elif args.command == "add":
        amount = args.value if args.value is not None else 1
        state["count"] = max(0, state["count"] + amount)
        save_state(state)
        print(f"Water: {state['count']}/{state['goal']} glasses (+{amount})")

    elif args.command == "set":
        if args.value is None:
            print("Usage: water.py set <count>")
            return
        state["count"] = max(0, args.value)
        save_state(state)
        print(f"Water: {state['count']}/{state['goal']} glasses")

    elif args.command == "reset":
        state["count"] = 0
        save_state(state)
        print(f"Water: 0/{state['goal']} glasses (reset)")

    elif args.command == "goal":
        if args.value is None:
            print(f"Current goal: {state['goal']} glasses")
            return
        state["goal"] = max(1, args.value)
        save_state(state)
        print(f"Goal set to {state['goal']} glasses")

    # Update display unless --no-display
    if not args.no_display:
        try:
            cube = HoloCube(args.ip)
            update_display(cube, state["count"], state["goal"])
        except Exception as e:
            print(f"Display update failed: {e}")


if __name__ == "__main__":
    main()
