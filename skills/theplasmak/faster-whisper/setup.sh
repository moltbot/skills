#!/usr/bin/env bash
# faster-whisper skill setup
# Creates venv and installs dependencies (with GPU support where available)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$SCRIPT_DIR/.venv"

echo "🎙️ Setting up faster-whisper skill..."

# Detect OS
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
    Linux*)  OS_TYPE="linux" ;;
    Darwin*) OS_TYPE="macos" ;;
    *)       OS_TYPE="unknown" ;;
esac

echo "✓ Platform: $OS_TYPE ($ARCH)"

# Check for Python 3.10+
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.10 or later."
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
PYTHON_MAJOR=$(echo "$PYTHON_VERSION" | cut -d. -f1)
PYTHON_MINOR=$(echo "$PYTHON_VERSION" | cut -d. -f2)

if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 10 ]); then
    echo "❌ Python 3.10+ required (found $PYTHON_VERSION)"
    exit 1
fi

echo "✓ Python $PYTHON_VERSION"

# Check for ffmpeg (required)
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ ffmpeg not found (required for audio processing)"
    echo ""
    echo "Install ffmpeg:"
    if [ "$OS_TYPE" = "macos" ]; then
        echo "   brew install ffmpeg"
    else
        echo "   Ubuntu/Debian: sudo apt install ffmpeg"
        echo "   Fedora: sudo dnf install ffmpeg"
        echo "   Arch: sudo pacman -S ffmpeg"
    fi
    echo ""
    exit 1
fi

echo "✓ ffmpeg found"

# Detect GPU/acceleration availability
HAS_CUDA=false
HAS_APPLE_SILICON=false
GPU_NAME=""
NVIDIA_SMI=""

if [ "$OS_TYPE" = "linux" ]; then
    # Check for NVIDIA GPU (Linux/WSL)
    # Try nvidia-smi in PATH first
    if command -v nvidia-smi &> /dev/null; then
        NVIDIA_SMI="nvidia-smi"
    else
        # WSL2: nvidia-smi is in /usr/lib/wsl/lib/ (not in PATH by default)
        # Check if we're in WSL2 and look for nvidia-smi there
        if grep -qi microsoft /proc/version 2>/dev/null; then
            # We're in WSL2 - search for nvidia-smi in WSL lib directories
            for wsl_smi in /usr/lib/wsl/lib/nvidia-smi /usr/lib/wsl/drivers/*/nvidia-smi; do
                if [ -f "$wsl_smi" ]; then
                    NVIDIA_SMI="$wsl_smi"
                    echo "✓ WSL2 detected"
                    break
                fi
            done
        fi
    fi
    
    # If we found nvidia-smi, get GPU info
    if [ -n "$NVIDIA_SMI" ]; then
        GPU_NAME=$($NVIDIA_SMI --query-gpu=name --format=csv,noheader 2>/dev/null | head -1)
        if [ -n "$GPU_NAME" ]; then
            HAS_CUDA=true
        fi
    fi
elif [ "$OS_TYPE" = "macos" ]; then
    # Check for Apple Silicon
    if [ "$ARCH" = "arm64" ]; then
        HAS_APPLE_SILICON=true
        GPU_NAME="Apple Silicon"
        echo "✓ Apple Silicon detected"
    fi
fi

if [ "$HAS_CUDA" = true ]; then
    echo "✓ GPU detected: $GPU_NAME"
fi

# Create venv
if [ -d "$VENV_DIR" ]; then
    echo "✓ Virtual environment exists"
else
    echo "Creating virtual environment..."
    if command -v uv &> /dev/null; then
        uv venv "$VENV_DIR" --python python3
    else
        python3 -m venv "$VENV_DIR"
    fi
    echo "✓ Virtual environment created"
fi

# Install dependencies
echo "Installing faster-whisper..."
if command -v uv &> /dev/null; then
    uv pip install --python "$VENV_DIR/bin/python" -r "$SCRIPT_DIR/requirements.txt"
else
    "$VENV_DIR/bin/pip" install --upgrade pip
    "$VENV_DIR/bin/pip" install -r "$SCRIPT_DIR/requirements.txt"
fi

# Install PyTorch based on platform
if [ "$HAS_CUDA" = true ]; then
    echo ""
    echo "🚀 Installing PyTorch with CUDA support..."
    echo "   This enables ~10-20x faster transcription on your GPU."
    echo ""
    if command -v uv &> /dev/null; then
        uv pip install --python "$VENV_DIR/bin/python" torch --index-url https://download.pytorch.org/whl/cu121
    else
        "$VENV_DIR/bin/pip" install torch --index-url https://download.pytorch.org/whl/cu121
    fi
    echo "✓ PyTorch with CUDA installed"
elif [ "$OS_TYPE" = "macos" ]; then
    echo ""
    echo "🍎 Installing PyTorch for macOS..."
    if command -v uv &> /dev/null; then
        uv pip install --python "$VENV_DIR/bin/python" torch
    else
        "$VENV_DIR/bin/pip" install torch
    fi
    echo "✓ PyTorch installed"
    if [ "$HAS_APPLE_SILICON" = true ]; then
        echo "ℹ️  Note: faster-whisper uses CPU on macOS (Apple Silicon is still fast!)"
    fi
else
    echo ""
    echo "ℹ️  No NVIDIA GPU detected. Using CPU mode."
    echo "   If you have a GPU, ensure CUDA drivers are installed."
fi

# Make scripts executable
chmod +x "$SCRIPT_DIR/scripts/"*

echo ""
echo "✅ Setup complete!"
echo ""
if [ "$HAS_CUDA" = true ]; then
    echo "🚀 GPU acceleration enabled — expect ~20x realtime speed"
elif [ "$HAS_APPLE_SILICON" = true ]; then
    echo "🍎 Apple Silicon — expect ~3-5x realtime speed on CPU"
else
    echo "💻 CPU mode — transcription will be slower but functional"
fi
echo ""
echo "Usage:"
echo "  $SCRIPT_DIR/scripts/transcribe audio.mp3"
echo ""
echo "First run will download the model (~756MB for distil-large-v3)."
