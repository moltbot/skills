#!/bin/bash
set -e

echo "Installing ccsinfo CLI tool..."

# Check if uv is available
if ! command -v uv &> /dev/null; then
    echo "Error: uv is not installed. Please install uv first."
    exit 1
fi

# Install ccsinfo from git
echo "Installing ccsinfo from GitHub..."
uv tool install git+https://github.com/myk-org/ccsinfo.git

echo "ccsinfo installed successfully!"
echo "Server URL: $CCSINFO_SERVER_URL"

# Verify installation
if command -v ccsinfo &> /dev/null; then
    echo "Installation verified!"
    ccsinfo --version
else
    echo "Warning: ccsinfo command not found in PATH"
    exit 1
fi
