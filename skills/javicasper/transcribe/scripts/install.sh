#!/bin/bash
# Install the transcribe skill
# Builds Docker image and installs CLI wrapper

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Creating Docker build context..."
BUILD_DIR=$(mktemp -d)
trap "rm -rf $BUILD_DIR" EXIT

# Create Dockerfile
cat > "$BUILD_DIR/Dockerfile" << 'DOCKERFILE'
FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir faster-whisper

# Pre-download the model (small for speed, change to large-v3 for accuracy)
RUN python3 -c "from faster_whisper import WhisperModel; WhisperModel('small', device='cpu', compute_type='int8')"

COPY transcribe.py /app/transcribe.py

ENTRYPOINT ["python3", "/app/transcribe.py"]
DOCKERFILE

# Create transcribe.py
cat > "$BUILD_DIR/transcribe.py" << 'PYTHON'
#!/usr/bin/env python3
"""Simple audio transcription using faster-whisper"""

import sys
from faster_whisper import WhisperModel

def transcribe(audio_path, model_size="small", language=None):
    model = WhisperModel(model_size, device="cpu", compute_type="int8")
    segments, info = model.transcribe(
        audio_path, 
        language=language,
        beam_size=5,
        vad_filter=True
    )
    
    text = " ".join([segment.text.strip() for segment in segments])
    return text, info.language

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: transcribe <audio_file> [language]", file=sys.stderr)
        sys.exit(1)
    
    audio_file = sys.argv[1]
    lang = sys.argv[2] if len(sys.argv) > 2 else None
    if lang == "auto":
        lang = None
    
    result, detected_lang = transcribe(audio_file, language=lang)
    print(result)
PYTHON

echo "Building whisper Docker image..."
docker build -t whisper:local "$BUILD_DIR"

echo "Installing transcribe CLI..."
sudo cp "$SCRIPT_DIR/transcribe" /usr/local/bin/transcribe
sudo chmod +x /usr/local/bin/transcribe

echo "✅ Done! Use: transcribe <audio_file> [language]"
