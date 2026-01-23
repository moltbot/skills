#!/usr/bin/env python3
"""Local speech-to-text using OpenAI Whisper (runs offline after model download)."""

import json
import sys
import warnings

import click

warnings.filterwarnings("ignore")

MODELS = ["tiny", "tiny.en", "base", "base.en", "small", "small.en",
          "medium", "medium.en", "large-v3", "turbo"]


@click.command()
@click.argument("audio_file", type=click.Path(exists=True))
@click.option("-m", "--model", default="base", type=click.Choice(MODELS), help="Whisper model size")
@click.option("-l", "--language", default=None, help="Language code (auto-detect if omitted)")
@click.option("-t", "--timestamps", is_flag=True, help="Include word-level timestamps")
@click.option("-j", "--json", "as_json", is_flag=True, help="Output as JSON")
@click.option("-q", "--quiet", is_flag=True, help="Suppress progress messages")
def main(audio_file, model, language, timestamps, as_json, quiet):
    """Transcribe audio using OpenAI Whisper (local)."""
    try:
        import whisper
    except ImportError:
        click.echo("Error: openai-whisper not installed", err=True)
        sys.exit(1)

    if not quiet:
        click.echo(f"Loading model: {model}...", err=True)

    try:
        whisper_model = whisper.load_model(model)
    except Exception as e:
        click.echo(f"Error loading model: {e}", err=True)
        sys.exit(1)

    if not quiet:
        click.echo(f"Transcribing: {audio_file}...", err=True)

    try:
        result = whisper_model.transcribe(audio_file, language=language,
                                          word_timestamps=timestamps, verbose=False)
    except Exception as e:
        click.echo(f"Error transcribing: {e}", err=True)
        sys.exit(1)

    text = result["text"].strip()

    if as_json:
        output = {"text": text, "language": result.get("language", "unknown")}
        if timestamps and "segments" in result:
            output["segments"] = [
                {"start": s["start"], "end": s["end"], "text": s["text"],
                 **({"words": s["words"]} if "words" in s else {})}
                for s in result["segments"]
            ]
        click.echo(json.dumps(output, indent=2, ensure_ascii=False))
    else:
        click.echo(text)
        if timestamps and "segments" in result:
            click.echo("\n--- Segments ---", err=True)
            for seg in result["segments"]:
                click.echo(f"  [{seg['start']:.2f}s - {seg['end']:.2f}s]: {seg['text']}", err=True)


if __name__ == "__main__":
    main()
