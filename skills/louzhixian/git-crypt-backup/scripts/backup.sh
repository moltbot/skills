#!/bin/bash
# Daily backup script for Clawdbot workspace and config

set -e

TIMESTAMP=$(date +"%Y-%m-%d %H:%M")

backup_repo() {
    local path=$1
    local name=$2
    
    cd "$path"
    
    # Check if there are changes
    if [[ -n $(git status --porcelain) ]]; then
        git add -A
        git commit -m "Auto backup: $TIMESTAMP"
        git push
        echo "✅ $name: backed up"
    else
        echo "⏭️  $name: no changes"
    fi
}

echo "🔄 Starting Clawdbot backup..."

# Backup workspace
backup_repo "$HOME/clawd" "workspace"

# Backup config
backup_repo "$HOME/.clawdbot" "config"

echo "✅ Backup complete!"
