#!/usr/bin/env python3
"""List available ElevenLabs voices.

Default output is a human-readable table.
Use `--json` to print the raw API response (for programmatic use).
"""

import argparse
import json
import os
import sys

import requests

API_URL = "https://api.elevenlabs.io/v1/voices"


def main():
    parser = argparse.ArgumentParser(description="List ElevenLabs voices")
    parser.add_argument("--json", action="store_true", help="Print raw JSON response")
    args = parser.parse_args()

    api_key = os.environ.get("ELEVENLABS_API_KEY")
    if not api_key:
        print("Error: ELEVENLABS_API_KEY not set", file=sys.stderr)
        sys.exit(1)

    try:
        response = requests.get(API_URL, headers={"xi-api-key": api_key}, timeout=30)
        response.raise_for_status()
        data = response.json()

        if args.json:
            print(json.dumps(data, indent=2))
            return

        voices = data.get("voices", [])
        print(f"{'NAME':<30} {'ID':<25} {'CATEGORY':<15} {'LABELS'}")
        print("-" * 100)

        for v in sorted(voices, key=lambda x: x.get("name")):
            name = v.get("name")
            vid = v.get("voice_id")
            category = v.get("category")
            labels = v.get("labels", {})
            label_str = ", ".join(f"{k}={v}" for k, v in labels.items())

            print(f"{name:<30} {vid:<25} {category:<15} {label_str}")

    except BrokenPipeError:
        # Allow piping to tools like `head` without stack traces.
        sys.exit(0)
    except Exception as e:
        print(f"Error fetching voices: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
