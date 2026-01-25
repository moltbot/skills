#!/usr/bin/env python3
"""Generate a music clip via ElevenLabs Music API.

This is a small helper for ClawdCast Studio so we can generate intro/outro stings
(or background beds) on the fly, then feed them into `music.py`.

Examples:
  python musicgen.py \
    --prompt "Upbeat 6s news intro sting, instrumental" \
    --length-ms 6000 \
    -o intro.mp3

  python musicgen.py \
    --prompt "Soft 8s outro sting, warm synth pad" \
    --length-ms 8000 \
    -o outro.mp3

API docs:
  https://elevenlabs.io/docs/api-reference/music/compose
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

import requests


def compose_music(
    *,
    api_key: str,
    prompt: str | None,
    composition_plan_json: str | None,
    length_ms: int | None,
    model_id: str,
    force_instrumental: bool,
    output_format: str | None,
) -> bytes:
    url = "https://api.elevenlabs.io/v1/music"

    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "*/*",
    }

    params = {}
    if output_format:
        params["output_format"] = output_format

    payload: dict[str, object] = {
        "model_id": model_id,
        "force_instrumental": force_instrumental,
    }

    if prompt:
        payload["prompt"] = prompt
        if length_ms is not None:
            payload["music_length_ms"] = length_ms
    elif composition_plan_json:
        # Composition plan is expected to be a JSON string.
        # We keep it flexible so callers can pass it inline or read from file.
        import json

        payload["composition_plan"] = json.loads(composition_plan_json)
    else:
        raise ValueError("Either prompt or composition_plan_json must be provided")

    response = requests.post(url, headers=headers, params=params, json=payload, timeout=120)

    if response.status_code >= 400:
        detail = response.text.strip()
        raise RuntimeError(f"ElevenLabs music API error: {response.status_code} {detail}")

    return response.content


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate a music clip via ElevenLabs")

    input_group = parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument("--prompt", help="Text prompt for music generation")
    input_group.add_argument(
        "--composition-plan",
        help="Path to JSON file containing a composition_plan object",
    )

    parser.add_argument(
        "--length-ms",
        type=int,
        default=None,
        help="Music duration in ms (3000-600000). Only used with --prompt.",
    )

    parser.add_argument(
        "--model-id",
        default="music_v1",
        help="ElevenLabs music model id (default: music_v1)",
    )

    parser.add_argument(
        "--instrumental",
        dest="force_instrumental",
        action="store_true",
        default=True,
        help="Force instrumental (default: true)",
    )

    parser.add_argument(
        "--allow-vocals",
        dest="force_instrumental",
        action="store_false",
        help="Allow vocals (sets force_instrumental=false)",
    )

    parser.add_argument(
        "--output-format",
        default="mp3_22050_32",
        help=(
            "ElevenLabs output format (default: mp3_22050_32). "
            "Examples: mp3_22050_32, mp3_44100_128"
        ),
    )

    parser.add_argument(
        "-o",
        "--out",
        required=True,
        help="Output audio file path (e.g. intro.mp3)",
    )

    args = parser.parse_args()

    api_key = os.environ.get("ELEVENLABS_API_KEY")
    if not api_key:
        print("Error: ELEVENLABS_API_KEY not set", file=sys.stderr)
        return 2

    composition_plan_json = None
    if args.composition_plan:
        composition_plan_json = Path(args.composition_plan).read_text(encoding="utf-8")

    if args.length_ms is not None and args.prompt:
        if args.length_ms < 3000 or args.length_ms > 600000:
            print("Error: --length-ms must be between 3000 and 600000", file=sys.stderr)
            return 2

    try:
        audio = compose_music(
            api_key=api_key,
            prompt=args.prompt,
            composition_plan_json=composition_plan_json,
            length_ms=args.length_ms,
            model_id=args.model_id,
            force_instrumental=args.force_instrumental,
            output_format=args.output_format,
        )
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1

    out_path = Path(args.out).expanduser().resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(audio)

    print(f"Wrote {len(audio)} bytes -> {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
