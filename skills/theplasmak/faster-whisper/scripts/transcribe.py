#!/usr/bin/env python3
"""
faster-whisper transcription CLI
High-performance speech-to-text using CTranslate2 backend
"""

import sys
import json
import argparse
from pathlib import Path

try:
    from faster_whisper import WhisperModel
except ImportError:
    print("Error: faster-whisper not installed", file=sys.stderr)
    print("Run setup: ./setup.sh", file=sys.stderr)
    sys.exit(1)


def check_cuda_available():
    """Check if CUDA is available and return device info."""
    try:
        import torch
        if torch.cuda.is_available():
            return True, torch.cuda.get_device_name(0)
        return False, None
    except ImportError:
        return False, None


def main():
    parser = argparse.ArgumentParser(
        description="Transcribe audio with faster-whisper"
    )
    parser.add_argument(
        "audio",
        metavar="AUDIO_FILE",
        help="Path to audio file (mp3, wav, m4a, flac, ogg, webm)"
    )
    parser.add_argument(
        "-m", "--model",
        default="distil-large-v3",
        metavar="NAME",
        help="Whisper model to use (default: distil-large-v3). Options: tiny, base, small, medium, large-v3, large-v3-turbo, distil-large-v3, distil-medium.en"
    )
    parser.add_argument(
        "-l", "--language",
        default=None,
        metavar="CODE",
        help="Language code, e.g. en, es, fr, zh (auto-detects if omitted)"
    )
    parser.add_argument(
        "--word-timestamps",
        action="store_true",
        help="Include word-level timestamps in output"
    )
    parser.add_argument(
        "--beam-size",
        type=int,
        default=5,
        metavar="N",
        help="Beam search size; higher = more accurate but slower (default: 5)"
    )
    parser.add_argument(
        "--vad",
        action="store_true",
        help="Enable voice activity detection to skip silence"
    )
    parser.add_argument(
        "-j", "--json",
        action="store_true",
        help="Output full transcript as JSON with segments and metadata"
    )
    parser.add_argument(
        "-o", "--output",
        metavar="FILE",
        help="Write transcript to FILE instead of stdout"
    )
    parser.add_argument(
        "--device",
        default="auto",
        choices=["auto", "cpu", "cuda"],
        help="Compute device: auto (detect GPU), cpu, or cuda (default: auto)"
    )
    parser.add_argument(
        "--compute-type",
        default="auto",
        choices=["auto", "int8", "float16", "float32"],
        help="Quantization: auto, int8 (fast CPU), float16 (GPU), float32 (default: auto)"
    )
    parser.add_argument(
        "-q", "--quiet",
        action="store_true",
        help="Suppress progress and status messages"
    )

    args = parser.parse_args()

    # Validate audio file
    audio_path = Path(args.audio)
    if not audio_path.exists():
        print(f"Error: Audio file not found: {args.audio}", file=sys.stderr)
        sys.exit(1)

    # Auto-detect device and compute type
    device = args.device
    compute_type = args.compute_type

    cuda_available, gpu_name = check_cuda_available()

    if device == "auto":
        if cuda_available:
            device = "cuda"
        else:
            device = "cpu"
            # Warn if no CUDA but not explicitly requested CPU
            if not args.quiet:
                print("⚠️  CUDA not available — using CPU (this will be slow!)", file=sys.stderr)
                print("   To enable GPU: pip install torch --index-url https://download.pytorch.org/whl/cu121", file=sys.stderr)
                print("   Or re-run: ./setup.sh", file=sys.stderr)
                print("", file=sys.stderr)

    if compute_type == "auto":
        # Optimize based on device
        if device == "cuda":
            compute_type = "float16"  # Best for GPU
        else:
            compute_type = "int8"  # Best for CPU (4x speedup)

    if not args.quiet:
        if device == "cuda" and gpu_name:
            print(f"Loading model: {args.model} ({device}, {compute_type}) on {gpu_name}", file=sys.stderr)
        else:
            print(f"Loading model: {args.model} ({device}, {compute_type})", file=sys.stderr)

    # Load model
    try:
        model = WhisperModel(
            args.model,
            device=device,
            compute_type=compute_type
        )
    except Exception as e:
        print(f"Error loading model: {e}", file=sys.stderr)
        sys.exit(1)

    # Transcribe
    try:
        if not args.quiet:
            print(f"Transcribing: {audio_path.name}", file=sys.stderr)

        segments, info = model.transcribe(
            str(audio_path),
            language=args.language,
            beam_size=args.beam_size,
            word_timestamps=args.word_timestamps,
            vad_filter=args.vad,
        )

        # Collect results
        result = {
            "text": "",
            "language": info.language,
            "language_probability": info.language_probability,
            "duration": info.duration,
            "segments": []
        }

        for segment in segments:
            result["text"] += segment.text

            segment_data = {
                "start": segment.start,
                "end": segment.end,
                "text": segment.text,
            }

            if args.word_timestamps and segment.words:
                segment_data["words"] = [
                    {
                        "word": word.word,
                        "start": word.start,
                        "end": word.end,
                        "probability": word.probability,
                    }
                    for word in segment.words
                ]

            result["segments"].append(segment_data)

        # Output
        if args.json:
            output = json.dumps(result, indent=2, ensure_ascii=False)
        else:
            output = result["text"].strip()

        if args.output:
            Path(args.output).write_text(output, encoding="utf-8")
            if not args.quiet:
                print(f"Saved to: {args.output}", file=sys.stderr)
        else:
            print(output)

    except Exception as e:
        print(f"Error during transcription: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
