#!/usr/bin/env bash
# Context Manager - Automated context management for Clawdbot
# Detects when context limits approach, compresses history, transfers to new session
#
# NOTE: Moltbot has built-in auto-compaction. This script provides:
#   - Manual summary generation for reference
#   - Status monitoring
#   - Transcript extraction
# See: https://docs.molt.bot/reference/session-management-compaction

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPRESSED_DIR="$SCRIPT_DIR/memory/compressed"
CONFIG_FILE="$SCRIPT_DIR/config.json"

# Default configuration
DEFAULT_THRESHOLD=80
DEFAULT_DEPTH="balanced"

# Runtime state (set by functions)
THRESHOLD="$DEFAULT_THRESHOLD"
DEPTH="$DEFAULT_DEPTH"
QUIET_HOURS=""
TOTAL_COMPRESSIONS=0
SESSION_ID=""
SESSION_KEY=""
AGENT_ID=""
CURRENT_TOKENS=0
MAX_TOKENS=100000
SESSION_FILE=""

# Colors for output
RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[1;33m'
NC=$'\033[0m'

# Temp files to cleanup on exit
TEMP_FILES=()

# Cleanup trap
cleanup() {
    if [[ ${#TEMP_FILES[@]} -gt 0 ]]; then
        for f in "${TEMP_FILES[@]}"; do
            [[ -f "$f" ]] && rm -f "$f"
        done
    fi
}
trap cleanup EXIT

# Check required dependencies
check_dependencies() {
    local missing=()
    
    if ! command -v jq &>/dev/null; then
        missing+=("jq")
    fi
    
    if ! command -v clawdbot &>/dev/null; then
        missing+=("clawdbot")
    fi
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        echo -e "${RED}Error: Missing required dependencies: ${missing[*]}${NC}" >&2
        echo "Install with:" >&2
        [[ " ${missing[*]} " =~ " jq " ]] && echo "  brew install jq  # or apt-get install jq" >&2
        [[ " ${missing[*]} " =~ " clawdbot " ]] && echo "  npm install -g clawdbot" >&2
        return 1
    fi
    return 0
}

# Ensure compressed memory directory exists
mkdir -p "$COMPRESSED_DIR"

# Load configuration
load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        THRESHOLD=$(jq -r '.threshold // env.DEFAULT_THRESHOLD' "$CONFIG_FILE" 2>/dev/null || echo "$DEFAULT_THRESHOLD")
        DEPTH=$(jq -r '.depth // env.DEFAULT_DEPTH' "$CONFIG_FILE" 2>/dev/null || echo "$DEFAULT_DEPTH")
        QUIET_HOURS=$(jq -r '.quiet_hours // ""' "$CONFIG_FILE" 2>/dev/null || echo "")
        TOTAL_COMPRESSIONS=$(jq -r '.total_compressions // 0' "$CONFIG_FILE" 2>/dev/null || echo "0")
    else
        THRESHOLD=$DEFAULT_THRESHOLD
        DEPTH=$DEFAULT_DEPTH
        QUIET_HOURS=""
        TOTAL_COMPRESSIONS=0
    fi
}

# Save configuration
save_config() {
    load_config
    cat > "$CONFIG_FILE" <<EOF
{
  "threshold": $THRESHOLD,
  "depth": "$DEPTH",
  "quiet_hours": "$QUIET_HOURS",
  "last_compression": "$(date -Iseconds 2>/dev/null || echo "")",
  "total_compressions": $((TOTAL_COMPRESSIONS + 1))
}
EOF
}

# Get all sessions as JSON
get_all_sessions() {
    clawdbot sessions --json 2>/dev/null
}

# Get session info from Clawdbot CLI
# Usage: get_session_info [session_key_or_id]
#   If no argument: uses most recently updated session
#   If argument provided: finds session by key or sessionId
get_session_info() {
    local target_session="${1:-}"
    local sessions_json
    sessions_json=$(get_all_sessions)

    if [[ -z "$sessions_json" ]] || [[ "$sessions_json" == "null" ]]; then
        echo "Warning: Could not fetch sessions from Clawdbot" >&2
        SESSION_ID="unknown"
        SESSION_KEY="unknown"
        AGENT_ID="main"
        CURRENT_TOKENS=0
        MAX_TOKENS=100000
        SESSION_FILE=""
        return 1
    fi

    local session_data
    if [[ -z "$target_session" ]]; then
        # Get the most recently updated session
        session_data=$(echo "$sessions_json" | jq -r '.sessions | sort_by(.updatedAt) | last')
    else
        # Find session by key or sessionId
        session_data=$(echo "$sessions_json" | jq -r --arg target "$target_session" \
            '.sessions[] | select(.key == $target or .sessionId == $target)')
        
        if [[ -z "$session_data" ]] || [[ "$session_data" == "null" ]]; then
            echo "Error: Session not found: $target_session" >&2
            echo "Run './compress.sh list' to see available sessions." >&2
            return 1
        fi
    fi

    if [[ -z "$session_data" ]] || [[ "$session_data" == "null" ]]; then
        echo "Warning: No sessions found" >&2
        SESSION_ID="unknown"
        SESSION_KEY="unknown"
        AGENT_ID="main"
        CURRENT_TOKENS=0
        MAX_TOKENS=100000
        SESSION_FILE=""
        return 1
    fi

    # Extract session metadata and token usage
    SESSION_ID=$(echo "$session_data" | jq -r '.sessionId // "unknown"')
    SESSION_KEY=$(echo "$session_data" | jq -r '.key // "unknown"')
    SESSION_KIND=$(echo "$session_data" | jq -r '.kind // "unknown"')
    SESSION_MODEL=$(echo "$session_data" | jq -r '.model // "unknown"')
    AGENT_ID=$(echo "$SESSION_KEY" | cut -d':' -f2) # Extract from key like "agent:main:..."
    CURRENT_TOKENS=$(echo "$session_data" | jq -r '.totalTokens // 0')
    MAX_TOKENS=$(echo "$session_data" | jq -r '.contextTokens // 100000')

    # Determine session file path
    local state_dir="${CLAWDBOT_STATE_DIR:-$HOME/.clawdbot}"
    SESSION_FILE="$state_dir/agents/$AGENT_ID/sessions/$SESSION_ID.jsonl"

    if [[ ! -f "$SESSION_FILE" ]]; then
        echo "Warning: Session file not found: $SESSION_FILE" >&2
        SESSION_FILE=""
        return 1
    fi

    return 0
}

# Calculate context usage percentage
calculate_usage() {
    get_session_info || true
    
    # Prevent division by zero
    if [[ "$MAX_TOKENS" -le 0 ]]; then
        MAX_TOKENS=100000
    fi
    
    local usage=$((CURRENT_TOKENS * 100 / MAX_TOKENS))
    echo "$usage"
}

# Check if we're in quiet hours
in_quiet_hours() {
    if [[ -z "$QUIET_HOURS" ]]; then
        return 1
    fi

    local current_hour=$(date +%H)
    local start=$(echo "$QUIET_HOURS" | cut -d'-' -f1 | cut -d':' -f1)
    local end=$(echo "$QUIET_HOURS" | cut -d'-' -f2 | cut -d':' -f1)

    # Handle overnight ranges (e.g., 23:00-07:00)
    if [[ "$start" -gt "$end" ]]; then
        # Overnight: current hour >= start OR current hour < end
        if [[ "$current_hour" -ge "$start" ]] || [[ "$current_hour" -lt "$end" ]]; then
            return 0
        fi
    else
        # Same day: current hour >= start AND current hour < end
        if [[ "$current_hour" -ge "$start" ]] && [[ "$current_hour" -lt "$end" ]]; then
            return 0
        fi
    fi

    return 1
}

# Generic pattern extraction function
# Usage: extract_pattern <transcript> <output> <section_title> <grep_args...>
extract_pattern() {
    local transcript="$1"
    local output="$2"
    local section_title="$3"
    shift 3
    local grep_cmd=("$@")
    
    if [[ ! -f "$transcript" ]]; then
        echo "Warning: Transcript file not found: $transcript" >&2
        return 1
    fi
    
    local temp_file
    temp_file=$(mktemp)
    TEMP_FILES+=("$temp_file")
    
    if "${grep_cmd[@]}" "$transcript" 2>/dev/null > "$temp_file"; then
        if [[ -s "$temp_file" ]]; then
            echo -e "\n## $section_title" >> "$output"
            cat "$temp_file" >> "$output"
        fi
    fi
    
    rm -f "$temp_file"
    return 0
}

# Extract key decisions from conversation
extract_decisions() {
    local transcript="$1"
    local output="$2"
    local temp_file
    temp_file=$(mktemp)
    TEMP_FILES+=("$temp_file")
    
    if [[ ! -f "$transcript" ]]; then
        return 1
    fi
    
    if grep -i "decided\|decision\|chose\|chose to\|we'll\|we're going\|let's go with\|i'll use\|using" "$transcript" 2>/dev/null | \
        grep -v "let me know\|feel free to\|you might want" | \
        head -20 > "$temp_file" && [[ -s "$temp_file" ]]; then
        echo -e "\n## Key Decisions" >> "$output"
        cat "$temp_file" >> "$output"
    fi
    
    rm -f "$temp_file"
    return 0
}

# Extract file modifications
extract_files() {
    local transcript="$1"
    local output="$2"
    local temp_file
    temp_file=$(mktemp)
    TEMP_FILES+=("$temp_file")
    
    if [[ ! -f "$transcript" ]]; then
        return 1
    fi
    
    if grep -E "(created|modified|edited|updated|deleted|changed)" "$transcript" 2>/dev/null | \
        grep -E "\.(tsx|ts|jsx|js|py|md|json|yaml|yml|css|html|svelte|sh|bash)$" | \
        head -15 > "$temp_file" && [[ -s "$temp_file" ]]; then
        echo -e "\n## File Modifications" >> "$output"
        cat "$temp_file" >> "$output"
    fi
    
    rm -f "$temp_file"
    return 0
}

# Extract code snippets
extract_code() {
    local transcript="$1"
    local output="$2"
    local temp_file
    temp_file=$(mktemp)
    TEMP_FILES+=("$temp_file")
    
    if [[ ! -f "$transcript" ]]; then
        return 1
    fi
    
    if grep -A5 '```' "$transcript" 2>/dev/null | head -100 > "$temp_file" && [[ -s "$temp_file" ]]; then
        echo -e "\n## Code Snippets" >> "$output"
        cat "$temp_file" >> "$output"
    fi
    
    rm -f "$temp_file"
    return 0
}

# Extract pending tasks
extract_todos() {
    local transcript="$1"
    local output="$2"
    local temp_file
    temp_file=$(mktemp)
    TEMP_FILES+=("$temp_file")
    
    if [[ ! -f "$transcript" ]]; then
        return 1
    fi
    
    if grep -i "todo\|to-do\|pending\|still need\|remaining\|next step" "$transcript" 2>/dev/null | \
        head -10 > "$temp_file" && [[ -s "$temp_file" ]]; then
        echo -e "\n## Pending Tasks" >> "$output"
        cat "$temp_file" >> "$output"
    fi
    
    rm -f "$temp_file"
    return 0
}

# Generate executive summary
generate_summary() {
    local transcript="$1"
    local session_id="$2"
    local output="$3"
    
    local timestamp=$(date -Iseconds 2>/dev/null || date)
    
    cat > "$output" <<EOF
# Session Summary - $session_id
Generated: $timestamp

## Executive Summary
Automated context compression summary for session handoff.

## Session Context
EOF
    
    # Add current working directory and key files
    echo "- Working Directory: $(pwd)" >> "$output"
    echo "- Git Status:" >> "$output"
    git status --short 2>/dev/null | head -10 >> "$output" || echo "  (Not a git repository)" >> "$output"
    
    # Extract key information
    extract_decisions "$transcript" "$output"
    extract_files "$transcript" "$output"
    extract_code "$transcript" "$output"
    extract_todos "$transcript" "$output"
    
    # Add recent git commits as timeline
    echo -e "\n## Recent Activity" >> "$output"
    git log --oneline -10 2>/dev/null >> "$output" || echo "  No git history" >> "$output"
    
    echo -e "\n## Continuation Notes" >> "$output"
    echo "This summary was automatically generated to preserve context across session handoff." >> "$output"
    echo "For full details, see: $COMPRESSED_DIR/$session_id.transcript.md" >> "$output"
}

# Prepare continuation instructions for new session
handoff_to_new_session() {
    local session_id="$1"
    local summary_file="$COMPRESSED_DIR/$session_id.summary.md"
    local continuation_file="$COMPRESSED_DIR/$session_id.continuation.txt"

    echo -e "${YELLOW}  Preparing session continuation...${NC}"

    # Check if summary file exists
    if [[ ! -f "$summary_file" ]]; then
        echo -e "${RED}Error: Summary file not found: $summary_file${NC}" >&2
        return 1
    fi

    # Create a continuation prompt file for easy copy/paste
    cat > "$continuation_file" <<EOF
Context was compressed at $(date). Please review the summary below and continue work.

Summary location: $summary_file

Key points from previous session:
---
EOF

    # Extract key sections from summary
    grep -A 10 "## Key Decisions" "$summary_file" >> "$continuation_file" 2>/dev/null || true
    grep -A 10 "## Pending Tasks" "$summary_file" >> "$continuation_file" 2>/dev/null || true

    cat >> "$continuation_file" <<EOF

---
For full details, see: $summary_file

To continue with compressed context, start a new session with /new or /reset
EOF

    echo -e "${GREEN}✅ Session compression complete!${NC}"
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}Context has been compressed and saved.${NC}"
    echo ""
    echo "📄 Summary: $summary_file"
    echo "📋 Continuation: $continuation_file"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "  1. Start a new session with: /new"
    echo "  2. Reference the summary to continue work"
    echo "  3. Or copy/paste from: $continuation_file"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    return 0
}

# Main compression function
compress_session() {
    echo -e "${YELLOW}🧠 Starting context compression...${NC}"
    
    local session_id=$(date +%Y%m%d-%H%M%S)
    local transcript_file="$COMPRESSED_DIR/$session_id.transcript.md"
    local summary_file="$COMPRESSED_DIR/$session_id.summary.md"
    
    # Fetch actual session transcript from Clawdbot session files
    echo "  Fetching session transcript..."

    # Get current session info
    if ! get_session_info; then
        echo -e "${RED}Error: Could not get session info${NC}" >&2
        return 1
    fi

    echo "  Session: $SESSION_ID"
    echo "  Agent: $AGENT_ID"
    echo "  File: $SESSION_FILE"

    # Write transcript header
    cat > "$transcript_file" <<EOF
# Session Transcript - $SESSION_ID
Session Key: $SESSION_KEY
Agent: $AGENT_ID
Timestamp: $(date -Iseconds 2>/dev/null || date)

## Session Statistics
- Context Usage: $((CURRENT_TOKENS * 100 / MAX_TOKENS))%
- Current Tokens: $CURRENT_TOKENS
- Max Tokens: $MAX_TOKENS
- Threshold: ${THRESHOLD}%
- Compression Depth: ${DEPTH}

## Transcript

EOF

    # Read and parse JSONL transcript file
    if [[ -f "$SESSION_FILE" ]]; then
        echo "  Reading session file..."

        # Skip first line (metadata), process rest as messages
        tail -n +2 "$SESSION_FILE" | while IFS= read -r line; do
            # Extract role and content from each message
            local role=$(echo "$line" | jq -r '.message.role // "unknown"' 2>/dev/null)
            local content=$(echo "$line" | jq -r '.message.content[]?.text // empty' 2>/dev/null | tr '\n' ' ')

            if [[ -n "$content" ]]; then
                echo "$role: $content" >> "$transcript_file"
            fi
        done

        echo "  Transcript extracted successfully"
    else
        echo -e "${RED}Error: Session file not found: $SESSION_FILE${NC}" >&2
        echo "[Transcript unavailable - session file not found]" >> "$transcript_file"
        return 1
    fi
    
    # Generate summary
    generate_summary "$transcript_file" "$session_id" "$summary_file"
    
    echo -e "${GREEN}✅ Compression complete!${NC}"
    echo "  - Transcript: $transcript_file"
    echo "  - Summary: $summary_file"
    echo ""
    echo -e "${YELLOW}NOTE: Moltbot has built-in auto-compaction. Configure with:${NC}"
    echo "  compaction: { enabled: true, reserveTokens: 16384, keepRecentTokens: 20000 }"

    # Save configuration with updated compression count
    save_config

    # Trigger session handoff
    handoff_to_new_session "$session_id"

    return $?
}

# List all sessions
cmd_list() {
    check_dependencies || exit 1
    load_config
    
    local sessions_json
    sessions_json=$(get_all_sessions)
    
    if [[ -z "$sessions_json" ]] || [[ "$sessions_json" == "null" ]]; then
        echo -e "${RED}Error: Could not fetch sessions${NC}" >&2
        return 1
    fi
    
    local count
    count=$(echo "$sessions_json" | jq -r '.count')
    
    echo "📋 Available Sessions ($count total)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    printf "%-4s %-45s %-8s %8s %8s\n" "#" "SESSION KEY" "KIND" "TOKENS" "USAGE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    local i=1
    echo "$sessions_json" | jq -r '.sessions | sort_by(.updatedAt) | reverse | .[] | [.key, .kind, .totalTokens, .contextTokens] | @tsv' | \
    while IFS=$'\t' read -r key kind tokens context; do
        local usage=$((tokens * 100 / context))
        local usage_color="$GREEN"
        if [[ $usage -ge $THRESHOLD ]]; then
            usage_color="$YELLOW"
        fi
        if [[ $usage -ge 90 ]]; then
            usage_color="$RED"
        fi
        printf "%-4s %-45s %-8s %8s ${usage_color}%7s%%${NC}\n" "$i" "$key" "$kind" "$tokens" "$usage"
        ((i++))
    done
    
    echo ""
    echo "Use session key with: ./compress.sh status <session_key>"
    echo "Example: ./compress.sh status agent:main:main"
}

# Status command
# Usage: cmd_status [session_key]
cmd_status() {
    check_dependencies || exit 1
    load_config
    
    local target_session="${1:-}"
    
    if ! get_session_info "$target_session"; then
        return 1
    fi
    
    # Prevent division by zero
    if [[ "$MAX_TOKENS" -le 0 ]]; then
        MAX_TOKENS=100000
    fi
    local usage=$((CURRENT_TOKENS * 100 / MAX_TOKENS))
    
    echo "📊 Context Manager Status"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Session Key: ${SESSION_KEY}"
    echo "  Session ID:  ${SESSION_ID}"
    echo "  Kind:        ${SESSION_KIND}"
    echo "  Model:       ${SESSION_MODEL}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Threshold:   ${THRESHOLD}%"
    echo "  Tokens:      ${CURRENT_TOKENS} / ${MAX_TOKENS}"
    echo "  Usage:       ${usage}%"
    
    if [[ -d "$COMPRESSED_DIR" ]]; then
        local compressions
        compressions=$(find "$COMPRESSED_DIR" -maxdepth 1 -name "*.summary.md" 2>/dev/null | wc -l | tr -d ' ')
        echo "  Compressions: $compressions"
    fi
    
    if [[ "$usage" -ge "$THRESHOLD" ]]; then
        echo -e "\n${YELLOW}⚠️  Context usage above threshold!${NC}"
        echo "  Run './compress.sh compress $SESSION_KEY' to compress."
    else
        echo -e "\n${GREEN}✓ Context usage normal${NC}"
    fi
    
    return 0
}

# Set threshold
cmd_set_threshold() {
    local new_threshold="${1:-80}"
    
    if [[ "$new_threshold" -lt 50 ]] || [[ "$new_threshold" -gt 99 ]]; then
        echo -e "${RED}Error: Threshold must be between 50 and 99${NC}"
        exit 1
    fi
    
    THRESHOLD=$new_threshold
    save_config
    echo -e "${GREEN}✅ Threshold set to ${THRESHOLD}%${NC}"
}

# Set depth
cmd_set_depth() {
    local new_depth="${1:-balanced}"
    
    if [[ "$new_depth" != "brief" ]] && [[ "$new_depth" != "balanced" ]] && [[ "$new_depth" != "comprehensive" ]]; then
        echo -e "${RED}Error: Depth must be brief, balanced, or comprehensive${NC}"
        exit 1
    fi
    
    DEPTH=$new_depth
    save_config
    echo -e "${GREEN}✅ Depth set to ${DEPTH}${NC}"
}

# Set quiet hours
cmd_set_quiet_hours() {
    local range="${1:-}"
    
    if [[ -z "$range" ]]; then
        QUIET_HOURS=""
        echo -e "${GREEN}✅ Quiet hours disabled${NC}"
    else
        # Validate format HH:00-HH:00
        if ! [[ "$range" =~ ^[0-2][0-9]:00-[0-2][0-9]:00$ ]]; then
            echo -e "${RED}Error: Format must be HH:00-HH:00 (e.g., 23:00-07:00)${NC}"
            exit 1
        fi
        QUIET_HOURS=$range
        echo -e "${GREEN}✅ Quiet hours set to ${QUIET_HOURS}${NC}"
    fi
    
    save_config
}

# Force compression
# Usage: cmd_compress [session_key]
cmd_compress() {
    check_dependencies || exit 1
    load_config
    
    local target_session="${1:-}"
    
    if in_quiet_hours; then
        echo -e "${YELLOW}⏸️  In quiet hours (${QUIET_HOURS}). Compression skipped.${NC}"
        exit 0
    fi
    
    # Get session info for the target session
    if ! get_session_info "$target_session"; then
        return 1
    fi
    
    echo "Compressing session: $SESSION_KEY"
    compress_session
}

# Check and compress if needed
# Usage: cmd_check [session_key]
cmd_check() {
    check_dependencies || exit 1
    load_config
    
    local target_session="${1:-}"
    
    if ! get_session_info "$target_session"; then
        return 1
    fi
    
    # Prevent division by zero
    if [[ "$MAX_TOKENS" -le 0 ]]; then
        MAX_TOKENS=100000
    fi
    local usage=$((CURRENT_TOKENS * 100 / MAX_TOKENS))
    
    echo "Session: $SESSION_KEY"
    echo "Context usage: ${usage}% (threshold: ${THRESHOLD}%)"
    
    if in_quiet_hours; then
        echo "In quiet hours - skipping compression check."
        exit 0
    fi
    
    if [[ "$usage" -ge "$THRESHOLD" ]]; then
        echo -e "${YELLOW}⚠️  Context above threshold. Compressing...${NC}"
        compress_session
    else
        echo -e "${GREEN}✓ Context within limits${NC}"
    fi
}

# AI-powered summarization using the agent itself
# Usage: cmd_ai_summarize [session_key] [--replace]
cmd_ai_summarize() {
    check_dependencies || exit 1
    load_config
    
    local target_session=""
    local do_replace=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --replace|-r)
                do_replace=true
                shift
                ;;
            *)
                target_session="$1"
                shift
                ;;
        esac
    done
    
    if ! get_session_info "$target_session"; then
        return 1
    fi
    
    echo -e "${YELLOW}🧠 Requesting AI summary for session: $SESSION_KEY${NC}"
    echo "  Session ID: $SESSION_ID"
    if $do_replace; then
        echo -e "  ${RED}Mode: REPLACE (will reset session after summary)${NC}"
    fi
    echo ""
    
    # Summarization prompt
    local prompt='Please provide a comprehensive summary of our conversation so far. Include:
1. **What was accomplished** - Key tasks completed
2. **Key decisions made** - Important choices and their rationale  
3. **Current state** - Where we left off
4. **Pending tasks** - What still needs to be done
5. **Important context** - Any critical information to remember

Format this as a clear, structured summary that could be used to continue this work in a new session. Do NOT use any tools, just write the summary.'
    
    # Call the agent with the summarization prompt
    # Note: redirect stderr to /dev/null to avoid Node deprecation warnings breaking JSON
    local response
    response=$(clawdbot agent --session-id "$SESSION_ID" -m "$prompt" --json 2>/dev/null)
    local exit_code=$?
    
    if [[ $exit_code -ne 0 ]]; then
        echo -e "${RED}Error: Failed to get AI summary (exit code: $exit_code)${NC}" >&2
        echo "$response" >&2
        return 1
    fi
    
    # Extract the response text from clawdbot agent --json output
    # Structure: { result: { payloads: [{ text: "..." }] } }
    local summary_text
    summary_text=$(echo "$response" | jq -r '.result.payloads[0].text // .message.content[0].text // .content // .text // empty' 2>/dev/null)
    
    if [[ -z "$summary_text" ]]; then
        echo -e "${YELLOW}Raw response:${NC}"
        echo "$response"
        return 1
    fi
    
    # Save the summary
    local timestamp
    timestamp=$(date +%Y%m%d-%H%M%S)
    local summary_file="$COMPRESSED_DIR/$timestamp.ai-summary.md"
    
    cat > "$summary_file" <<EOF
# AI-Generated Session Summary
Session: $SESSION_KEY
Session ID: $SESSION_ID
Generated: $(date -Iseconds 2>/dev/null || date)
Model: $SESSION_MODEL

---

$summary_text
EOF
    
    echo -e "${GREEN}✅ AI Summary generated!${NC}"
    echo "  Saved to: $summary_file"
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "$summary_text"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # If --replace flag, reset session and inject summary
    if $do_replace; then
        echo ""
        echo -e "${YELLOW}🔄 Resetting session and injecting compressed context...${NC}"
        
        local old_session_id="$SESSION_ID"
        local state_dir="${CLAWDBOT_STATE_DIR:-$HOME/.clawdbot}"
        local jsonl_file="$state_dir/agents/$AGENT_ID/sessions/$SESSION_ID.jsonl"
        
        # Backup the JSONL file before deleting
        if [[ -f "$jsonl_file" ]]; then
            local backup_file="$COMPRESSED_DIR/$timestamp.session-backup.jsonl"
            echo "  Backing up session file..."
            cp "$jsonl_file" "$backup_file"
            echo "  Backup saved: $backup_file"
            
            # Delete the JSONL to reset the session (official method per docs)
            echo "  Deleting session JSONL to reset..."
            rm "$jsonl_file"
        else
            echo -e "${YELLOW}  Warning: Session file not found, skipping backup${NC}"
        fi
        
        # Wait a moment for the system to recognize the deletion
        sleep 1
        
        # Inject the summary - this will create a fresh session
        local context_msg="[COMPRESSED CONTEXT - Session was compressed on $(date -Iseconds)]

The following is a summary of the previous conversation. Use this to continue the work:

---

$summary_text

---

Please acknowledge that you have received this compressed context and are ready to continue."
        
        echo "  Injecting compressed context into fresh session..."
        local inject_response
        inject_response=$(clawdbot agent --to main -m "$context_msg" --json 2>/dev/null)
        
        if [[ $? -eq 0 ]]; then
            # Get the new session info
            sleep 1
            get_session_info "$SESSION_KEY" 2>/dev/null
            
            echo -e "${GREEN}✅ Session compressed successfully!${NC}"
            echo "  Old session ID: $old_session_id"
            echo "  New session ID: $SESSION_ID"
            echo "  Backup: $backup_file"
            echo "  Session is ready to continue with compressed context"
        else
            echo -e "${RED}Error injecting compressed context${NC}" >&2
            echo "$inject_response" >&2
            echo "  Restoring backup..."
            cp "$backup_file" "$jsonl_file"
            return 1
        fi
    fi
    
    return 0
}

# Check all sessions and report
cmd_check_all() {
    check_dependencies || exit 1
    load_config
    
    local sessions_json
    sessions_json=$(get_all_sessions)
    
    if [[ -z "$sessions_json" ]] || [[ "$sessions_json" == "null" ]]; then
        echo -e "${RED}Error: Could not fetch sessions${NC}" >&2
        return 1
    fi
    
    echo "📊 Checking all sessions (threshold: ${THRESHOLD}%)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    local needs_compression=0
    
    echo "$sessions_json" | jq -r '.sessions[] | [.key, .totalTokens, .contextTokens] | @tsv' | \
    while IFS=$'\t' read -r key tokens context; do
        local usage=$((tokens * 100 / context))
        local status="✓"
        local color="$GREEN"
        
        if [[ $usage -ge $THRESHOLD ]]; then
            status="⚠️"
            color="$YELLOW"
            needs_compression=1
        fi
        if [[ $usage -ge 90 ]]; then
            color="$RED"
        fi
        
        printf "${color}%s %3s%%${NC} %s\n" "$status" "$usage" "$key"
    done
    
    echo ""
}

# Main command routing
case "${1:-list}" in
    list|ls)
        cmd_list
        ;;
    status)
        cmd_status "${2:-}"
        ;;
    compress)
        cmd_compress "${2:-}"
        ;;
    check)
        cmd_check "${2:-}"
        ;;
    check-all)
        cmd_check_all
        ;;
    summarize|ai-summarize|ai)
        shift
        cmd_ai_summarize "$@"
        ;;
    set-threshold)
        cmd_set_threshold "${2:-}"
        ;;
    set-depth)
        cmd_set_depth "${2:-}"
        ;;
    set-quiet-hours)
        cmd_set_quiet_hours "${2:-}"
        ;;
    help|--help|-h)
        echo "Context Manager - Session summary and monitoring tool"
        echo ""
        echo "Usage: $0 <command> [arguments]"
        echo ""
        echo "Session Commands:"
        echo "  list                List all sessions with usage stats"
        echo "  status [KEY]        Show status for session (default: most recent)"
        echo "  summarize [KEY]     Generate AI-powered summary of session context"
        echo "  summarize [KEY] --replace  Summarize AND reset session with compressed context"
        echo "  compress [KEY]      Force compression (grep-based extraction)"
        echo "  check [KEY]         Check and compress session if over threshold"
        echo "  check-all           Check all sessions and report status"
        echo ""
        echo "Configuration:"
        echo "  set-threshold N     Set compression threshold (50-99, default: 80)"
        echo "  set-depth LEVEL     Set depth (brief/balanced/comprehensive)"
        echo "  set-quiet-hours HH  Set quiet hours (e.g., '23:00-07:00')"
        echo ""
        echo "Examples:"
        echo "  $0 list"
        echo "  $0 status agent:main:main"
        echo "  $0 summarize agent:main:main"
        echo "  $0 compress agent:main:slack:channel:c0aaruq2en9"
        echo ""
        echo "NOTE: Moltbot has built-in auto-compaction. This tool provides:"
        echo "  - Manual summary generation for reference"
        echo "  - Status monitoring and transcript extraction"
        echo ""
        echo "See: https://docs.molt.bot/reference/session-management-compaction"
        exit 0
        ;;
    *)
        echo -e "${RED}Error: Unknown command '$1'${NC}" >&2
        echo "Run '$0 help' for usage information." >&2
        exit 1
        ;;
esac
