#!/usr/bin/env python3
"""
Pocket TTS - Local text-to-speech using Kyutai's Pocket TTS model

Usage:
    pocket-tts "Your text here" [--output FILE] [--voice VOICE] [--speed FLOAT]

Installation:
    pip install pocket-tts

Note: You must accept the model license at:
    https://huggingface.co/kyutai/pocket-tts
"""

import argparse
import os
import sys
from pathlib import Path

try:
    from pocket_tts import TTSModel
    import scipy.io.wavfile
except ImportError:
    print("❌ Pocket TTS not installed.")
    print("Install with: pip install pocket-tts")
    print("")
    print("⚠️  Accept the model license first:")
    print("   https://huggingface.co/kyutai/pocket-tts")
    sys.exit(1)

# Available voices
VOICES = [
    "alba", "marius", "javert", "jean", 
    "fantine", "cosette", "eponine", "azelma"
]

def main():
    parser = argparse.ArgumentParser(
        description="Pocket TTS - Local text-to-speech",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Available voices:
  alba, marius, javert, jean, fantine, cosette, eponine, azelma

Examples:
  pocket-tts "Hello world"
  pocket-tts "Hello" --voice alba --output hello.wav
  pocket-tts "Text-to-speech is awesome" --speed 1.2
        """
    )
    parser.add_argument(
        "text",
        nargs="?",
        help="Text to convert to speech"
    )
    parser.add_argument(
        "-o", "--output",
        default="output.wav",
        help="Output WAV file (default: output.wav)"
    )
    parser.add_argument(
        "-v", "--voice",
        default="alba",
        choices=VOICES,
        help=f"Voice preset (default: alba)"
    )
    parser.add_argument(
        "-s", "--speed",
        type=float,
        default=1.0,
        help="Speech speed 0.5-2.0 (default: 1.0)"
    )
    parser.add_argument(
        "--voice-file",
        help="Use custom WAV file for voice cloning"
    )
    parser.add_argument(
        "--serve",
        action="store_true",
        help="Start local TTS server"
    )
    parser.add_argument(
        "--list-voices",
        action="store_true",
        help="List available voices"
    )
    
    args = parser.parse_args()
    
    if args.list_voices:
        print("🎤 Available voices:")
        for voice in VOICES:
            print(f"   - {voice}")
        print("")
        print("Or use --voice-file /path/to/voice.wav for custom voice cloning")
        sys.exit(0)
    
    if args.serve:
        print("🚀 Starting Pocket TTS server on http://localhost:8000")
        os.system("pocket-tts serve")
        sys.exit(0)
    
    if not args.text:
        parser.print_help()
        print("\n💡 Tip: pocket-tts \"Hello, world!\"")
        sys.exit(1)
    
    print(f"🔊 Generating speech...")
    print(f"📝 Text: {args.text[:60]}{'...' if len(args.text) > 60 else ''}")
    print(f"🎤 Voice: {args.voice}")
    
    try:
        # Load model
        tts_model = TTSModel.load_model()
        
        # Get voice state
        if args.voice_file:
            voice_state = tts_model.get_state_for_audio_prompt(args.voice_file)
            print(f"🎭 Using custom voice from: {args.voice_file}")
        else:
            voice_state = tts_model.get_state_for_audio_prompt(
                f"hf://kyutai/tts-voices/{args.voice}-mackenna/casual.wav"
            )
        
        # Generate audio
        audio = tts_model.generate_audio(voice_state, args.text)
        
        # Save audio
        wavfile.write(args.output, tts_model.sample_rate, audio.numpy())
        
        print(f"✅ Saved to: {args.output}")
        print(f"📊 Sample rate: {tts_model.sample_rate} Hz")
        print(f"📏 Audio length: {len(audio) / tts_model.sample_rate:.2f}s")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("")
        print("Make sure you've accepted the model license at:")
        print("   https://huggingface.co/kyutai/pocket-tts")
        sys.exit(1)

if __name__ == "__main__":
    main()
