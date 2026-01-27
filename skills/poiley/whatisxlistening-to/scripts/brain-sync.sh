#!/bin/bash
# Brain Sync - Syncs between Clawdbot workspace, Ensue, and Obsidian
# Usage: brain-sync.sh [all|memory|learnings|ensue-to-obsidian|obsidian-to-ensue]

set -euo pipefail

WORKSPACE="${CLAWDBOT_WORKSPACE:-$HOME/clawd}"
OBSIDIAN_VAULT="$HOME/mnt/services/clawdbot/brain"
SCRIPTS_DIR="$WORKSPACE/scripts"
SYNC_STATE="$WORKSPACE/.sync-state.json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[sync]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC} $1"; }
error() { echo -e "${RED}[error]${NC} $1" >&2; }

# Ensure directories exist
ensure_dirs() {
  mkdir -p "$OBSIDIAN_VAULT/Daily"
  mkdir -p "$OBSIDIAN_VAULT/Knowledge/Learnings"
  mkdir -p "$OBSIDIAN_VAULT/Knowledge/Concepts"
  mkdir -p "$OBSIDIAN_VAULT/Knowledge/Toolbox"
  mkdir -p "$OBSIDIAN_VAULT/Knowledge/Patterns"
  mkdir -p "$WORKSPACE/.learnings"
}

# Sync memory/*.md → Obsidian Daily/
sync_memory() {
  log "Syncing memory files to Obsidian Daily..."
  local count=0
  
  if [[ -d "$WORKSPACE/memory" ]]; then
    for f in "$WORKSPACE/memory"/*.md; do
      [[ -f "$f" ]] || continue
      local basename=$(basename "$f")
      local dest="$OBSIDIAN_VAULT/Daily/$basename"
      
      # Only sync if source is newer or dest doesn't exist
      if [[ ! -f "$dest" ]] || [[ "$f" -nt "$dest" ]]; then
        cp "$f" "$dest"
        ((count++))
      fi
    done
  fi
  
  log "Synced $count memory files"
}

# Sync .learnings/ → Obsidian Knowledge/Learnings/
sync_learnings() {
  log "Syncing learnings to Obsidian..."
  local count=0
  
  if [[ -d "$WORKSPACE/.learnings" ]]; then
    for f in "$WORKSPACE/.learnings"/*.md; do
      [[ -f "$f" ]] || continue
      local basename=$(basename "$f")
      local dest="$OBSIDIAN_VAULT/Knowledge/Learnings/$basename"
      
      if [[ ! -f "$dest" ]] || [[ "$f" -nt "$dest" ]]; then
        cp "$f" "$dest"
        ((count++))
      fi
    done
  fi
  
  log "Synced $count learning files"
}

# Sync Ensue → Obsidian (one-way, Ensue is source of truth for concepts)
sync_ensue_to_obsidian() {
  log "Syncing Ensue knowledge to Obsidian..."
  
  # Get all keys from Ensue
  local prefixes=("public/concepts/" "public/toolbox/" "public/patterns/" "public/references/")
  local total=0
  
  for prefix in "${prefixes[@]}"; do
    local category=$(echo "$prefix" | sed 's|public/||' | sed 's|/$||')
    # Capitalize first letter (macOS compatible)
    local cap_category=$(echo "$category" | awk '{print toupper(substr($0,1,1)) tolower(substr($0,2))}')
    local target_dir="$OBSIDIAN_VAULT/Knowledge/$cap_category"
    mkdir -p "$target_dir"
    
    # List keys with this prefix
    local keys_json=$("$SCRIPTS_DIR/ensue-api.sh" list_keys "{\"prefix\": \"$prefix\", \"limit\": 100}" 2>/dev/null || echo '{"keys":[]}')
    
    # Parse keys and fetch each
    local keys=$(echo "$keys_json" | jq -r '.keys[]?.key_name // empty' 2>/dev/null || true)
    
    for key in $keys; do
      [[ -z "$key" ]] && continue
      
      # Get the memory content
      local content_json=$("$SCRIPTS_DIR/ensue-api.sh" get_memory "{\"key_names\": [\"$key\"]}" 2>/dev/null || echo '{}')
      local content=$(echo "$content_json" | jq -r '.memories[0]?.value // empty' 2>/dev/null || true)
      local desc=$(echo "$content_json" | jq -r '.memories[0]?.description // empty' 2>/dev/null || true)
      
      if [[ -n "$content" ]]; then
        # Convert key to filename: public/concepts/programming/recursion → recursion.md
        local filename=$(basename "$key").md
        local subdir=$(dirname "$key" | sed "s|$prefix||")
        
        if [[ -n "$subdir" && "$subdir" != "." ]]; then
          mkdir -p "$target_dir/$subdir"
          local dest="$target_dir/$subdir/$filename"
        else
          local dest="$target_dir/$filename"
        fi
        
        # Write with frontmatter
        cat > "$dest" << EOF
---
ensue_key: $key
description: $desc
synced_at: $(date -Iseconds)
---

$content
EOF
        ((total++))
      fi
    done
  done
  
  log "Synced $total entries from Ensue to Obsidian"
}

# Sync Obsidian → Ensue (for new notes with ensue_sync: true frontmatter)
sync_obsidian_to_ensue() {
  log "Syncing marked Obsidian notes to Ensue..."
  local count=0
  
  # Find files with ensue_sync: true in frontmatter
  find "$OBSIDIAN_VAULT/Knowledge" -name "*.md" -type f | while read -r f; do
    # Check for ensue_sync: true in frontmatter
    if head -50 "$f" | grep -q "ensue_sync: *true"; then
      local key=$(grep -m1 "ensue_key:" "$f" | sed 's/ensue_key: *//' | tr -d '\r')
      
      if [[ -z "$key" ]]; then
        # Generate key from path
        local rel_path=$(echo "$f" | sed "s|$OBSIDIAN_VAULT/Knowledge/||" | sed 's|\.md$||')
        key="public/$(echo "$rel_path" | tr '[:upper:]' '[:lower:]')"
      fi
      
      # Extract content (skip frontmatter)
      local content=$(awk '/^---$/{if(++c==2){p=1;next}}p' "$f")
      local desc=$(grep -m1 "description:" "$f" | sed 's/description: *//' | tr -d '\r' || basename "$f" .md)
      
      if [[ -n "$content" ]]; then
        # Escape for JSON
        local json_content=$(echo "$content" | jq -Rs .)
        local json_desc=$(echo "$desc" | jq -Rs .)
        
        "$SCRIPTS_DIR/ensue-api.sh" create_memory "{\"items\":[{\"key_name\":\"$key\",\"description\":$json_desc,\"value\":$json_content,\"embed\":true}]}" >/dev/null 2>&1 || true
        ((count++)) || true
      fi
    fi
  done
  
  log "Synced $count notes from Obsidian to Ensue"
}

# Main
ensure_dirs

case "${1:-all}" in
  memory)
    sync_memory
    ;;
  learnings)
    sync_learnings
    ;;
  ensue-to-obsidian)
    sync_ensue_to_obsidian
    ;;
  obsidian-to-ensue)
    sync_obsidian_to_ensue
    ;;
  all)
    sync_memory
    sync_learnings
    sync_ensue_to_obsidian
    sync_obsidian_to_ensue
    ;;
  *)
    echo "Usage: brain-sync.sh [all|memory|learnings|ensue-to-obsidian|obsidian-to-ensue]"
    exit 1
    ;;
esac

log "Sync complete!"
