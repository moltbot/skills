#!/bin/bash

CONTAINER_NAME="ai-voice-backend"
IMAGE_NAME="trevisanricardo/ai-voice-backend"
PORT=8000

# Check if container is running
if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    echo "✅ Voice Agent container '$CONTAINER_NAME' is already running."
    exit 0
fi

# Check if container exists but is stopped
if [ "$(docker ps -aq -f status=exited -f name=$CONTAINER_NAME)" ]; then
    echo "🔄 Starting existing container '$CONTAINER_NAME'..."
    docker start $CONTAINER_NAME
    exit 0
fi

# Check if image exists
# Always try to pull the latest image to ensure updates
echo "☁️ checking for image updates..."
docker pull $IMAGE_NAME || true

# Check if image exists locally (in case pull failed but we have a cache)
if [[ "$(docker images -q $IMAGE_NAME 2> /dev/null)" == "" ]]; then
    echo "⚠️ Image '$IMAGE_NAME' not found locally or in registry. Please build it first:"
    echo "   docker build -t $IMAGE_NAME ."
    exit 1
fi

echo "🚀 Starting new container '$CONTAINER_NAME'..."
# Assuming .env and ~/.aws exist in the current directory context or user home
# We need to resolve absolute paths for volumes usually, but ~ works in shell expansion.
# We also assume we are running this from the repo root or similar, but the skill might be run from anywhere.
# If run by Moltbot, CWD might be anywhere.
# However, the docker command relies on .env being present.
# We will assume the user has configured the repo.

# Try to find the repo root if possible, or just assume CWD if user runs it manually.
# For simplicity, we print the command or try running it if .env is present.

# Resolve script directory to find relative paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
SKILL_ROOT="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$SKILL_ROOT")"

# Look for .env in likely locations
if [ -f "$SKILL_ROOT/.env" ]; then
    ENV_FILE="$SKILL_ROOT/.env"
elif [ -f "$REPO_ROOT/.env" ]; then
    ENV_FILE="$REPO_ROOT/.env"
elif [ -f "./.env" ]; then
    ENV_FILE="./.env"
else
    echo "❌ .env file not found in skill folder, repo root, or current directory."
    echo "   Please allow a .env file in $SKILL_ROOT/"
    exit 1
fi

echo "📂 Using configuration: $ENV_FILE"

docker run -d \
    --name $CONTAINER_NAME \
    --gpus all \
    -p $PORT:8000 \
    --env-file "$ENV_FILE" \
    -v ~/.aws:/root/.aws \
    $IMAGE_NAME

if [ $? -eq 0 ]; then
    echo "✅ Container started successfully."
else
    echo "❌ Failed to start container."
    exit 1
fi
