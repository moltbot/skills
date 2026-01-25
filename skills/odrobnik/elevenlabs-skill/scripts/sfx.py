#!/usr/bin/env python3
"""
ElevenLabs Text-to-Sound-Effects CLI

Generate sound effects from text prompts.

Usage:
    python3 sfx.py "A cat meowing loudly" -o cat.mp3
    python3 sfx.py "Thunderstorm with heavy rain" -o storm.mp3 --duration 10
    python3 sfx.py "Footsteps on gravel" -o steps.mp3 --loop
"""

import argparse
import os
import sys
import requests
from pathlib import Path


API_URL = "https://api.elevenlabs.io/v1/sound-generation"

OUTPUT_FORMATS = [
    "mp3_22050_32", "mp3_44100_64", "mp3_44100_128", "mp3_44100_192",
    "pcm_16000", "pcm_22050", "pcm_24000", "pcm_44100",
    "ulaw_8000"
]


def generate_sfx(
    text: str,
    output_path: str,
    duration: float | None = None,
    prompt_influence: float = 0.3,
    loop: bool = False,
    output_format: str = "mp3_44100_128",
    model_id: str = "eleven_text_to_sound_v2",
    api_key: str | None = None
) -> Path:
    """Generate a sound effect from text prompt."""
    
    api_key = api_key or os.environ.get("ELEVENLABS_API_KEY")
    if not api_key:
        raise ValueError("ELEVENLABS_API_KEY environment variable required")
    
    # Build request payload
    payload = {
        "text": text,
        "prompt_influence": prompt_influence,
        "model_id": model_id,
    }
    
    if duration is not None:
        if duration < 0.5 or duration > 30:
            raise ValueError("Duration must be between 0.5 and 30 seconds")
        payload["duration_seconds"] = duration
    
    if loop:
        payload["loop"] = True
    
    # Build query params
    params = {"output_format": output_format}
    
    print(f"🎵 Generating: {text[:60]}{'...' if len(text) > 60 else ''}")
    if duration:
        print(f"   Duration: {duration}s")
    if loop:
        print(f"   Looping: enabled")
    print(f"   Influence: {prompt_influence}")
    
    response = requests.post(
        API_URL,
        headers={
            "xi-api-key": api_key,
            "Content-Type": "application/json"
        },
        params=params,
        json=payload,
        timeout=120
    )
    
    if response.status_code != 200:
        error_detail = response.text
        try:
            error_json = response.json()
            if "detail" in error_json:
                error_detail = error_json["detail"]
        except:
            pass
        raise RuntimeError(f"API error {response.status_code}: {error_detail}")
    
    # Write output
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(response.content)
    
    size_kb = len(response.content) / 1024
    print(f"✅ Saved: {output} ({size_kb:.1f} KB)")
    
    return output


def main():
    parser = argparse.ArgumentParser(
        description="Generate sound effects from text prompts using ElevenLabs",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    %(prog)s "A cat meowing loudly" -o cat.mp3
    %(prog)s "Epic orchestral hit" -o impact.mp3 --duration 2 --influence 0.5
    %(prog)s "Ambient forest with birds" -o forest.mp3 --duration 30 --loop

Environment:
    ELEVENLABS_API_KEY    Required API key
"""
    )
    
    parser.add_argument("text", help="Text prompt describing the sound effect")
    parser.add_argument("-o", "--output", required=True, help="Output file path")
    parser.add_argument(
        "-d", "--duration",
        type=float,
        help="Duration in seconds (0.5-30, auto if not set)"
    )
    parser.add_argument(
        "--influence", "--prompt-influence",
        type=float,
        default=0.3,
        dest="prompt_influence",
        help="Prompt influence 0-1 (default: 0.3, higher = follows prompt more closely)"
    )
    parser.add_argument(
        "--loop",
        action="store_true",
        help="Create a seamlessly looping sound (v2 model only)"
    )
    parser.add_argument(
        "--format",
        default="mp3_44100_128",
        choices=OUTPUT_FORMATS,
        help="Output format (default: mp3_44100_128)"
    )
    parser.add_argument(
        "--model",
        default="eleven_text_to_sound_v2",
        help="Model ID (default: eleven_text_to_sound_v2)"
    )
    parser.add_argument(
        "--play",
        action="store_true",
        help="Play the sound after generation (macOS only)"
    )
    
    args = parser.parse_args()
    
    try:
        output_path = generate_sfx(
            text=args.text,
            output_path=args.output,
            duration=args.duration,
            prompt_influence=args.prompt_influence,
            loop=args.loop,
            output_format=args.format,
            model_id=args.model
        )
        
        if args.play:
            import subprocess
            print(f"🔊 Playing...")
            subprocess.run(["afplay", str(output_path)], check=True)
            
    except ValueError as e:
        print(f"❌ Validation error: {e}", file=sys.stderr)
        sys.exit(1)
    except RuntimeError as e:
        print(f"❌ {e}", file=sys.stderr)
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n⏹️  Cancelled")
        sys.exit(130)


if __name__ == "__main__":
    main()
