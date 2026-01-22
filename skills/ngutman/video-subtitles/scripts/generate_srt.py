#!/usr/bin/env -S uv run --script --quiet
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "faster-whisper>=1.0.0",
# ]
# ///
"""
Transcription with subtitles. Hebrew uses ivrit.ai, English uses whisper large-v3.

Usage: 
    ./transcribe.py video.mp4                      # Plain transcript
    ./transcribe.py video.mp4 --srt                # Generate SRT file
    ./transcribe.py video.mp4 --srt --embed        # Burn subtitles into video
    ./transcribe.py video.mp4 --srt --translate en # Translate to English
"""

import sys
import os
import argparse
import subprocess
import tempfile
from pathlib import Path
from dataclasses import dataclass


@dataclass
class Subtitle:
    index: int
    start: float
    end: float
    text: str

    def to_srt(self) -> str:
        return f"{self.index}\n{format_srt_timestamp(self.start)} --> {format_srt_timestamp(self.end)}\n{self.text}\n"


def format_srt_timestamp(seconds: float) -> str:
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def chunk_text_naturally(text: str, max_chars: int = 42) -> list[str]:
    text = text.strip()
    if len(text) <= max_chars:
        return [text]
    
    break_points = ['. ', ', ', '? ', '! ', ': ', '; ', ' - ', ' – ', ' — ']
    lines = []
    remaining = text
    
    while remaining:
        if len(remaining) <= max_chars:
            lines.append(remaining)
            break
        
        best_break = -1
        for bp in break_points:
            idx = remaining[:max_chars].rfind(bp)
            if idx > best_break:
                best_break = idx + len(bp) - 1
        
        if best_break <= 0:
            best_break = remaining[:max_chars].rfind(' ')
        if best_break <= 0:
            best_break = max_chars
        
        lines.append(remaining[:best_break].strip())
        remaining = remaining[best_break:].strip()
    
    if len(lines) > 2:
        lines = [lines[0], ' '.join(lines[1:])]
    
    return lines


def merge_into_subtitles(segments: list, min_duration: float = 1.0, max_duration: float = 7.0, max_chars: int = 84) -> list[Subtitle]:
    if not segments:
        return []
    
    subtitles = []
    current_text = ""
    current_start = None
    current_end = None
    
    for seg in segments:
        seg_text = seg.text.strip()
        seg_start = seg.start
        seg_end = seg.end
        
        if current_start is None:
            current_start = seg_start
            current_end = seg_end
            current_text = seg_text
            continue
        
        potential_text = current_text + " " + seg_text
        potential_duration = seg_end - current_start
        gap = seg_start - current_end
        
        should_merge = (
            (potential_duration <= max_duration and len(potential_text) <= max_chars and (current_end - current_start) < min_duration) or
            (gap < 0.3 and potential_duration <= max_duration and len(potential_text) <= max_chars)
        )
        
        if should_merge:
            current_text = potential_text
            current_end = seg_end
        else:
            lines = chunk_text_naturally(current_text)
            subtitles.append(Subtitle(len(subtitles) + 1, current_start, current_end, '\n'.join(lines)))
            current_start = seg_start
            current_end = seg_end
            current_text = seg_text
    
    if current_text:
        lines = chunk_text_naturally(current_text)
        subtitles.append(Subtitle(len(subtitles) + 1, current_start, current_end, '\n'.join(lines)))
    
    return subtitles


def transcribe(file_path: str, language: str | None = None, use_turbo: bool = True, 
               generate_srt: bool = False, translate_to: str | None = None):
    """Transcribe audio/video file. Auto-detects language, uses ivrit.ai for Hebrew."""
    from faster_whisper import WhisperModel
    
    # Determine task: transcribe or translate
    task = "translate" if translate_to == "en" else "transcribe"
    
    # Select model based on language and task
    if task == "translate":
        # Translation requires large-v3 (turbo doesn't translate well)
        model_name = "large-v3"
        # Use int8 quantization on CPU to save memory
        print(f"📦 Loading model: {model_name} (int8 for translation)...", file=sys.stderr)
        model = WhisperModel(model_name, device="cpu", compute_type="int8")
    elif language == "he":
        model_name = "ivrit-ai/whisper-large-v3-turbo-ct2" if use_turbo else "ivrit-ai/whisper-large-v3-ct2"
        print(f"📦 Loading model: {model_name}...", file=sys.stderr)
        model = WhisperModel(model_name, device="auto", compute_type="auto")
    else:
        model_name = "large-v3-turbo" if use_turbo else "large-v3"
        print(f"📦 Loading model: {model_name}...", file=sys.stderr)
        model = WhisperModel(model_name, device="auto", compute_type="auto")
    
    print(f"🎤 Transcribing: {file_path}...", file=sys.stderr)
    if task == "translate":
        print(f"🌐 Translating to English...", file=sys.stderr)
    
    segments, info = model.transcribe(
        file_path, 
        language=language,
        task=task,
        word_timestamps=generate_srt,
        vad_filter=generate_srt,
    )
    
    detected_lang = info.language
    print(f"✓ Detected: {detected_lang} (confidence: {info.language_probability:.0%})", file=sys.stderr)
    
    # If Hebrew detected but we used standard model, re-run with ivrit.ai (unless translating)
    if detected_lang == "he" and language is None and "ivrit-ai" not in model_name and task != "translate":
        print("🔄 Hebrew detected, switching to ivrit.ai model...", file=sys.stderr)
        return transcribe(file_path, language="he", use_turbo=use_turbo, 
                         generate_srt=generate_srt, translate_to=translate_to)
    
    raw_segments = list(segments)
    
    if generate_srt:
        subtitles = merge_into_subtitles(raw_segments)
        print(f"✓ Created {len(subtitles)} subtitles", file=sys.stderr)
        return '\n'.join(sub.to_srt() for sub in subtitles), subtitles[-1].end if subtitles else 0, detected_lang
    
    return " ".join(seg.text.strip() for seg in raw_segments), None, detected_lang


def embed_subtitles(video_path: str, srt_content: str, output_path: str, burn: bool = False):
    """Embed subtitles into video using ffmpeg."""
    # Use ffmpeg-full if available (has libass for burn-in)
    ffmpeg_bin = "/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg"
    if not os.path.exists(ffmpeg_bin):
        ffmpeg_bin = "ffmpeg"
    
    # Write SRT to temp file
    srt_path = "/tmp/subtitles_temp.srt"
    with open(srt_path, 'w', encoding='utf-8') as f:
        f.write(srt_content)
    
    try:
        if burn:
            print(f"🔥 Burning subtitles into video...", file=sys.stderr)
            # Hard-code (burn) subtitles into video using libass
            # Style: movie-style - smaller text at bottom with outline
            escaped_srt = srt_path.replace(":", "\\:")
            filter_str = f"subtitles={escaped_srt}:force_style='FontSize=12,PrimaryColour=&Hffffff,OutlineColour=&H000000,BorderStyle=1,Outline=1,Shadow=0,MarginV=12,Alignment=2'"
            
            cmd = [
                ffmpeg_bin, '-y',
                '-i', video_path,
                '-vf', filter_str,
                '-c:a', 'copy',
                output_path
            ]
        else:
            print(f"🎬 Embedding soft subtitles...", file=sys.stderr)
            # Soft subtitles (selectable in player)
            cmd = [
                ffmpeg_bin, '-y',
                '-i', video_path,
                '-i', srt_path,
                '-c', 'copy',
                '-c:s', 'mov_text',
                '-metadata:s:s:0', 'language=heb',
                output_path
            ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"ffmpeg error: {result.stderr}", file=sys.stderr)
            raise RuntimeError("ffmpeg failed")
        
        print(f"✓ Video saved: {output_path}", file=sys.stderr)
        if not burn:
            print(f"  (Soft subs - enable in player with V key)", file=sys.stderr)
    finally:
        if os.path.exists(srt_path):
            os.unlink(srt_path)


def main():
    parser = argparse.ArgumentParser(
        description="Transcribe audio/video (Hebrew via ivrit.ai, English via whisper)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s video.mp4                        # Transcribe (auto-detect language)
  %(prog)s video.mp4 --lang he              # Force Hebrew
  %(prog)s video.mp4 --srt                  # Generate SRT subtitles
  %(prog)s video.mp4 --srt --embed          # Burn subtitles into video
  %(prog)s video.mp4 --srt --translate en   # Translate to English subtitles
        """
    )
    parser.add_argument("file", help="Audio or video file")
    parser.add_argument("--lang", "-l", choices=["he", "en"],
                       help="Force language (auto-detect if not specified)")
    parser.add_argument("--turbo", action="store_true", default=True, 
                       help="Use turbo model for Hebrew (faster, default)")
    parser.add_argument("--accurate", action="store_true",
                       help="Use accurate model for Hebrew (slower but better)")
    parser.add_argument("--timestamps", "-t", action="store_true",
                       help="Include timestamps in plain text output")
    parser.add_argument("--srt", action="store_true",
                       help="Generate SRT subtitle file")
    parser.add_argument("--embed", action="store_true",
                       help="Embed soft subtitles into video (toggle in player)")
    parser.add_argument("--burn", action="store_true",
                       help="Burn subtitles into video (always visible, for WhatsApp)")
    parser.add_argument("--translate", metavar="LANG", choices=["en"],
                       help="Translate subtitles to language (currently: en)")
    parser.add_argument("--output", "-o", help="Output file path")
    
    args = parser.parse_args()
    
    input_path = Path(args.file)
    if not input_path.exists():
        print(f"❌ File not found: {args.file}", file=sys.stderr)
        sys.exit(1)
    
    if (args.embed or args.burn) and not args.srt:
        print("❌ --embed/--burn requires --srt", file=sys.stderr)
        sys.exit(1)
    
    use_turbo = not args.accurate
    result, duration, detected_lang = transcribe(
        args.file, 
        language=args.lang,
        use_turbo=use_turbo, 
        generate_srt=args.srt,
        translate_to=args.translate
    )
    
    # Determine output path
    if args.output:
        output_path = Path(args.output)
    elif args.embed or args.burn:
        output_path = input_path.with_stem(input_path.stem + "_subtitled").with_suffix('.mp4')
    elif args.srt:
        output_path = input_path.with_suffix('.srt')
    else:
        output_path = None
    
    # Handle embedding
    if args.embed or args.burn:
        embed_subtitles(str(input_path), result, str(output_path), burn=args.burn)
    elif output_path:
        output_path.write_text(result, encoding="utf-8")
        print(f"✓ Saved: {output_path}", file=sys.stderr)
        if duration:
            print(f"  Duration: {format_srt_timestamp(duration)}", file=sys.stderr)
    else:
        print(result)


if __name__ == "__main__":
    main()
