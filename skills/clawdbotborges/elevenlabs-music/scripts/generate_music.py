#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "elevenlabs>=1.0.0",
#     "python-dotenv",
# ]
# ///
"""
ElevenLabs Music Generation Script
Generate music from text prompts using Eleven Music API.

Usage:
    uv run generate_music.py "your prompt here" [options]

Examples:
    uv run generate_music.py "upbeat jazz piano" --length 30
    uv run generate_music.py "epic orchestral battle music" --length 60 --instrumental
    uv run generate_music.py "sad acoustic guitar ballad" -o my_song.mp3
"""

import argparse
import os
import sys
from pathlib import Path

from elevenlabs.client import ElevenLabs
from dotenv import load_dotenv

load_dotenv()


def generate_music(
    prompt: str,
    length_seconds: int = 30,
    output_path: str = None,
    instrumental: bool = False,
):
    """Generate music from a text prompt."""
    
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        print("Error: ELEVENLABS_API_KEY not found in environment")
        print("Set it with: export ELEVENLABS_API_KEY='your_key_here'")
        sys.exit(1)

    client = ElevenLabs(api_key=api_key)
    
    length_ms = length_seconds * 1000
    # Clamp to valid range (3s - 600s)
    length_ms = max(3000, min(600000, length_ms))
    
    print(f"🎵 Generating music...", file=sys.stderr)
    print(f"   Prompt: {prompt[:80]}{'...' if len(prompt) > 80 else ''}", file=sys.stderr)
    print(f"   Length: {length_ms // 1000}s", file=sys.stderr)
    print(f"   Instrumental: {instrumental}", file=sys.stderr)
    print(file=sys.stderr)

    try:
        audio_chunks = client.music.compose(
            prompt=prompt,
            music_length_ms=length_ms,
            force_instrumental=instrumental,
        )
        audio_data = b"".join(audio_chunks)
    except Exception as e:
        error_str = str(e)
        if "limited_access" in error_str or "402" in error_str:
            print("❌ Error: Music API requires a paid ElevenLabs plan", file=sys.stderr)
            print("   Upgrade at: https://elevenlabs.io/pricing", file=sys.stderr)
            sys.exit(1)
        elif "bad_prompt" in error_str:
            print("❌ Error: Prompt may contain copyrighted material", file=sys.stderr)
            if hasattr(e, 'body'):
                suggestion = e.body.get('detail', {}).get('data', {}).get('prompt_suggestion', '')
                if suggestion:
                    print(f"   Suggestion: {suggestion}", file=sys.stderr)
            sys.exit(1)
        else:
            raise

    # Determine output path
    if not output_path:
        output_path = Path("/tmp/music.mp3")
    else:
        output_path = Path(output_path)
    
    # Save the audio
    with open(output_path, "wb") as f:
        f.write(audio_data)
    
    print(f"✅ Saved to: {output_path}", file=sys.stderr)
    # Print just the path to stdout for easy capture
    print(output_path)
    return str(output_path)


def main():
    parser = argparse.ArgumentParser(
        description="Generate music with ElevenLabs Eleven Music API",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s "upbeat electronic dance track"
  %(prog)s "calm lo-fi beats for studying" --length 120
  %(prog)s "epic orchestral" --instrumental
  %(prog)s "jazz piano trio" -o ~/Music/jazz.mp3
        """,
    )
    
    parser.add_argument("prompt", help="Text description of the music to generate")
    parser.add_argument(
        "-l", "--length",
        type=int,
        default=30,
        help="Length in seconds (3-600, default: 30)",
    )
    parser.add_argument(
        "-o", "--output",
        help="Output file path (default: /tmp/music.mp3)",
    )
    parser.add_argument(
        "-i", "--instrumental",
        action="store_true",
        help="Force instrumental (no vocals)",
    )

    args = parser.parse_args()

    output_file = generate_music(
        prompt=args.prompt,
        length_seconds=args.length,
        output_path=args.output,
        instrumental=args.instrumental,
    )
    
    return output_file


if __name__ == "__main__":
    main()
