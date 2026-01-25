#!/usr/bin/env python3
"""
ElevenLabs Text-to-Speech (TTS) API wrapper.

Usage (CLI):
    python3 speech.py "Hello world" -v <voice_id> -o output.mp3

Usage (Module):
    from speech import generate_speech
    audio_bytes = generate_speech("Hello", "voice_id")
"""

import argparse
import os
import sys
import requests

# Default model
DEFAULT_MODEL = "eleven_multilingual_v2"


# Supported output formats (ElevenLabs API)
OUTPUT_FORMATS = [
    "mp3_44100_128",  # default
    "mp3_44100_192",
    "pcm_16000",
    "pcm_22050",
    "pcm_24000",
    "pcm_44100",
    "ulaw_8000",
]
DEFAULT_OUTPUT_FORMAT = "mp3_44100_128"


def generate_speech(
    text: str,
    voice_id: str,
    api_key: str | None = None,
    model_id: str = DEFAULT_MODEL,
    output_format: str = DEFAULT_OUTPUT_FORMAT,
    stability: float = 0.5,
    similarity_boost: float = 0.75,
    style: float = 0.0,
    use_speaker_boost: bool = True
) -> bytes:
    """Generate audio from text using ElevenLabs API."""
    
    api_key = api_key or os.environ.get("ELEVENLABS_API_KEY")
    if not api_key:
        raise ValueError("ELEVENLABS_API_KEY not set")

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    
    # Add output_format as query parameter
    if output_format and output_format != DEFAULT_OUTPUT_FORMAT:
        url = f"{url}?output_format={output_format}"
    
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json"
    }
    
    # Process text (basic cleanup could go here, but kept raw for now)
    
    data = {
        "text": text,
        "model_id": model_id,
        "voice_settings": {
            "stability": stability,
            "similarity_boost": similarity_boost,
            "style": style,
            "use_speaker_boost": use_speaker_boost
        }
    }
    
    response = requests.post(url, headers=headers, json=data)
    
    if response.status_code != 200:
        detail = response.text
        try:
            detail = response.json().get("detail", detail)
        except:
            pass
        raise RuntimeError(f"ElevenLabs API error {response.status_code}: {detail}")
    
    # Extract character cost from response headers
    char_cost = response.headers.get("character-cost")
    character_cost = int(char_cost) if char_cost else None
        
    return response.content, character_cost


def main():
    parser = argparse.ArgumentParser(description="Generate speech using ElevenLabs TTS")
    parser.add_argument("text", help="Text to speak")
    parser.add_argument("-v", "--voice-id", required=True, help="Voice ID")
    parser.add_argument("-o", "--output", required=True, help="Output audio file")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Model ID")
    parser.add_argument(
        "--format",
        default=DEFAULT_OUTPUT_FORMAT,
        choices=OUTPUT_FORMATS,
        help=f"Output format (default: {DEFAULT_OUTPUT_FORMAT})",
    )
    parser.add_argument("--stability", type=float, default=0.5)
    parser.add_argument("--similarity", type=float, default=0.75)
    parser.add_argument("--style", type=float, default=0.0)
    parser.add_argument("--speaker-boost", action=argparse.BooleanOptionalAction, default=True)

    args = parser.parse_args()

    try:
        audio, character_cost = generate_speech(
            text=args.text,
            voice_id=args.voice_id,
            model_id=args.model,
            output_format=args.format,
            stability=args.stability,
            similarity_boost=args.similarity,
            style=args.style,
            use_speaker_boost=args.speaker_boost,
        )

        with open(args.output, "wb") as f:
            f.write(audio)

        # Output includes character cost for tracking
        print(f"Generated: {args.output}")
        if character_cost is not None:
            print(f"character_cost={character_cost}")

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
