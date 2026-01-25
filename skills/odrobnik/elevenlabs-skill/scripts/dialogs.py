#!/usr/bin/env python3
"""
ElevenLabs Text-to-Dialogue API wrapper.

Generates multi-speaker dialogue with timestamps and optional per-speaker track splitting.

Usage (CLI):
    # Generate combined audio + JSON metadata
    python3 dialogs.py script.json -o output.mp3
    
    # Split into per-speaker tracks
    python3 dialogs.py script.json -o output.mp3 --split-speakers
    
    # Input JSON format:
    # [
    #   {"text": "Hello!", "voice_id": "voice1"},
    #   {"text": "Hi there!", "voice_id": "voice2"}
    # ]

Usage (Module):
    from dialogs import generate_dialogue
    result = generate_dialogue(inputs=[...])
    # result.audio_bytes, result.voice_segments, result.alignment
"""

import argparse
import json
import os
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import requests


DEFAULT_MODEL = "eleven_v3"
API_URL = "https://api.elevenlabs.io/v1/text-to-dialogue"

# Supported output formats
OUTPUT_FORMATS = [
    "mp3_44100_128",
    "mp3_44100_192", 
    "mp3_22050_32",
    "pcm_16000",
    "pcm_22050",
    "pcm_24000",
    "pcm_44100",
    "ulaw_8000",
]
DEFAULT_OUTPUT_FORMAT = "mp3_44100_128"


@dataclass
class VoiceSegment:
    voice_id: str
    start_time_seconds: float
    end_time_seconds: float
    character_start_index: int
    character_end_index: int
    dialogue_input_index: int


@dataclass
class DialogueResult:
    audio_bytes: bytes
    voice_segments: list[VoiceSegment]
    alignment: dict[str, Any] | None
    normalized_alignment: dict[str, Any] | None
    character_cost: int | None = None


def generate_dialogue(
    inputs: list[dict[str, str]],
    api_key: str | None = None,
    model_id: str = DEFAULT_MODEL,
    output_format: str = DEFAULT_OUTPUT_FORMAT,
    stability: float | None = None,
    language_code: str | None = None,
    seed: int | None = None,
    apply_text_normalization: str = "auto",
) -> DialogueResult:
    """
    Generate dialogue audio from a list of text/voice_id pairs.
    
    Args:
        inputs: List of {"text": str, "voice_id": str} dicts
        api_key: ElevenLabs API key (or use ELEVENLABS_API_KEY env var)
        model_id: Model to use (default: eleven_v3)
        output_format: Audio format (default: mp3_44100_128)
        stability: Voice stability (0-1)
        language_code: ISO 639-1 language code
        seed: Deterministic seed (0-4294967295)
        apply_text_normalization: "auto", "on", or "off"
    
    Returns:
        DialogueResult with audio_bytes, voice_segments, and alignment info
    """
    api_key = api_key or os.environ.get("ELEVENLABS_API_KEY")
    if not api_key:
        raise ValueError("ELEVENLABS_API_KEY not set")
    
    # Build request
    url = f"{API_URL}?output_format={output_format}"
    
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
    }
    
    data: dict[str, Any] = {
        "inputs": inputs,
        "model_id": model_id,
        "apply_text_normalization": apply_text_normalization,
    }
    
    if stability is not None:
        data["settings"] = {"stability": stability}
    
    if language_code:
        data["language_code"] = language_code
    
    if seed is not None:
        data["seed"] = seed
    
    # Make request
    response = requests.post(url, headers=headers, json=data, timeout=300)
    
    if response.status_code != 200:
        detail = response.text
        try:
            detail = response.json().get("detail", detail)
        except Exception:
            pass
        raise RuntimeError(f"ElevenLabs API error {response.status_code}: {detail}")
    
    # Extract character cost from response headers
    char_cost = response.headers.get("character-cost")
    character_cost = int(char_cost) if char_cost else None

    # Endpoint returns raw audio bytes (no timestamps)
    audio_bytes = response.content

    return DialogueResult(
        audio_bytes=audio_bytes,
        voice_segments=[],
        alignment=None,
        normalized_alignment=None,
        character_cost=character_cost,
    )


def split_by_speakers(
    audio_path: Path,
    voice_segments: list[VoiceSegment],
    output_dir: Path,
) -> dict[str, list[Path]]:
    """
    Split combined audio into per-speaker clips using ffmpeg.
    
    Returns dict mapping voice_id -> list of clip paths.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    
    speaker_clips: dict[str, list[Path]] = {}
    
    for i, seg in enumerate(voice_segments):
        voice_id = seg.voice_id
        if voice_id not in speaker_clips:
            speaker_clips[voice_id] = []
        
        clip_path = output_dir / f"clip_{i:03d}_{voice_id[:8]}.mp3"
        
        # Extract segment with ffmpeg
        cmd = [
            "ffmpeg", "-y",
            "-i", str(audio_path),
            "-ss", str(seg.start_time_seconds),
            "-to", str(seg.end_time_seconds),
            "-c", "copy",
            str(clip_path),
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"Warning: ffmpeg failed for segment {i}: {result.stderr}", file=sys.stderr)
            continue
        
        speaker_clips[voice_id].append(clip_path)
    
    return speaker_clips


def main():
    parser = argparse.ArgumentParser(
        description="Generate multi-speaker dialogue using ElevenLabs API",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Input JSON format:
  [
    {"text": "Hello, how are you?", "voice_id": "voice_id_1"},
    {"text": "I'm doing great!", "voice_id": "voice_id_2"}
  ]

Examples:
  %(prog)s inputs.json -o dialogue.mp3
  %(prog)s inputs.json -o dialogue.mp3 --split-speakers --split-dir clips/
  %(prog)s inputs.json -o dialogue.mp3 --format pcm_44100 --model eleven_v3
""",
    )
    parser.add_argument("input", help="JSON file with dialogue inputs")
    parser.add_argument("-o", "--output", required=True, help="Output audio file")
    parser.add_argument(
        "--format",
        default=DEFAULT_OUTPUT_FORMAT,
        choices=OUTPUT_FORMATS,
        help=f"Output format (default: {DEFAULT_OUTPUT_FORMAT})",
    )
    parser.add_argument("--model", default=DEFAULT_MODEL, help=f"Model ID (default: {DEFAULT_MODEL})")
    parser.add_argument("--stability", type=float, help="Voice stability (0-1)")
    parser.add_argument("--language", help="Language code (ISO 639-1)")
    parser.add_argument("--seed", type=int, help="Deterministic seed")
    parser.add_argument(
        "--normalize",
        choices=["auto", "on", "off"],
        default="auto",
        help="Text normalization mode",
    )
    parser.add_argument(
        "--split-speakers",
        action="store_true",
        help="Split output into per-speaker clips",
    )
    parser.add_argument(
        "--split-dir",
        help="Directory for split clips (default: <output>_clips/)",
    )
    parser.add_argument(
        "--metadata",
        help="Output JSON file for voice_segments and alignment data",
    )

    args = parser.parse_args()

    # Load inputs
    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: Input file not found: {input_path}", file=sys.stderr)
        sys.exit(1)
    
    with open(input_path) as f:
        inputs = json.load(f)
    
    if not isinstance(inputs, list):
        print("Error: Input JSON must be a list of {text, voice_id} objects", file=sys.stderr)
        sys.exit(1)

    try:
        print(f"Generating dialogue with {len(inputs)} lines...", file=sys.stderr)
        
        result = generate_dialogue(
            inputs=inputs,
            model_id=args.model,
            output_format=args.format,
            stability=args.stability,
            language_code=args.language,
            seed=args.seed,
            apply_text_normalization=args.normalize,
        )
        
        # Write combined audio
        output_path = Path(args.output)
        with open(output_path, "wb") as f:
            f.write(result.audio_bytes)
        print(f"Generated: {output_path}", file=sys.stderr)
        
        # Write metadata if requested
        # Note: we intentionally omit `audio_base64` to keep the file small.
        if args.metadata:
            metadata = {
                "model_id": args.model,
                "output_format": args.format,
                "normalize": args.normalize,
                "inputs": inputs,
                "voice_segments": [
                    {
                        "voice_id": seg.voice_id,
                        "start_time_seconds": seg.start_time_seconds,
                        "end_time_seconds": seg.end_time_seconds,
                        "character_start_index": seg.character_start_index,
                        "character_end_index": seg.character_end_index,
                        "dialogue_input_index": seg.dialogue_input_index,
                    }
                    for seg in result.voice_segments
                ],
                "alignment": result.alignment,
                "normalized_alignment": result.normalized_alignment,
            }
            with open(args.metadata, "w") as f:
                json.dump(metadata, f, indent=2)
            print(f"Metadata: {args.metadata}", file=sys.stderr)
        
        # Split by speakers if requested
        if args.split_speakers:
            split_dir = Path(args.split_dir) if args.split_dir else output_path.with_suffix("") / "_clips"
            split_dir = Path(str(output_path).replace(output_path.suffix, "_clips"))
            
            print(f"Splitting into per-speaker clips...", file=sys.stderr)
            speaker_clips = split_by_speakers(output_path, result.voice_segments, split_dir)
            
            for voice_id, clips in speaker_clips.items():
                print(f"  {voice_id[:8]}...: {len(clips)} clips", file=sys.stderr)
        
        # Print summary
        total_duration = max(seg.end_time_seconds for seg in result.voice_segments) if result.voice_segments else 0
        print(f"Duration: {total_duration:.2f}s, Segments: {len(result.voice_segments)}", file=sys.stderr)
        if result.character_cost is not None:
            print(f"character_cost={result.character_cost}")

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
