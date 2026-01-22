#!/bin/bash
# Install browser dependencies for Remotion on Linux
# Works on Ubuntu 22.04, 24.04, and Debian

set -e

echo "🎬 Remotion Server Setup"
echo "========================"

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VERSION=$VERSION_ID
else
    echo "❌ Cannot detect OS"
    exit 1
fi

echo "📦 Detected: $OS $VERSION"

# Install dependencies based on OS
if [[ "$OS" == "ubuntu" ]] || [[ "$OS" == "debian" ]]; then
    echo "📦 Installing browser dependencies..."
    
    # Check for sudo
    if command -v sudo &> /dev/null; then
        SUDO="sudo"
    else
        SUDO=""
    fi
    
    $SUDO apt-get update
    
    if [[ "$VERSION" == "24.04" ]]; then
        # Ubuntu 24.04
        $SUDO apt-get install -y \
            libnss3 \
            libdbus-1-3 \
            libatk1.0-0 \
            libasound2t64 \
            libxrandr2 \
            libxkbcommon-dev \
            libxfixes3 \
            libxcomposite1 \
            libxdamage1 \
            libgbm-dev \
            libcups2 \
            libcairo2 \
            libpango-1.0-0 \
            libatk-bridge2.0-0
    else
        # Ubuntu 22.04 and older / Debian
        $SUDO apt-get install -y \
            libnss3 \
            libdbus-1-3 \
            libatk1.0-0 \
            libasound2 \
            libxrandr2 \
            libxkbcommon-dev \
            libxfixes3 \
            libxcomposite1 \
            libxdamage1 \
            libgbm-dev \
            libcups2 \
            libcairo2 \
            libpango-1.0-0 \
            libatk-bridge2.0-0
    fi
    
    echo "✅ Dependencies installed!"
    
elif [[ "$OS" == "amzn" ]]; then
    # Amazon Linux
    echo "📦 Installing browser dependencies for Amazon Linux..."
    $SUDO yum install -y \
        mesa-libgbm \
        libX11 \
        libXrandr \
        libdrm \
        libXdamage \
        libXfixes \
        libxkbcommon \
        dbus-libs \
        libXcomposite \
        alsa-lib \
        nss \
        dbus \
        pango \
        cups-libs \
        at-spi2-core \
        atk \
        at-spi2-atk
    echo "✅ Dependencies installed!"
else
    echo "❌ Unsupported OS: $OS"
    echo "Please install browser dependencies manually."
    echo "See: https://www.remotion.dev/docs/miscellaneous/linux-dependencies"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "⚠️ Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️ Node.js 18+ required. Found: $(node -v)"
    exit 1
fi

echo ""
echo "✅ Remotion Server setup complete!"
echo ""
echo "Create a new project:"
echo "  bash scripts/create.sh my-video"
echo ""
echo "Or use an existing Remotion project:"
echo "  npx remotion render MyComp out/video.mp4"
