#!/bin/bash
# SABnzbd API helper script
# Usage: sab-api.sh <command> [args...]

set -euo pipefail

CONFIG_FILE="${SAB_CONFIG:-$HOME/.clawdbot/credentials/sabnzbd/config.json}"

# Load config
if [[ -f "$CONFIG_FILE" ]]; then
    SAB_URL=$(jq -r '.url // empty' "$CONFIG_FILE")
    SAB_API_KEY=$(jq -r '.apiKey // empty' "$CONFIG_FILE")
fi

SAB_URL="${SAB_URL:-}"
SAB_API_KEY="${SAB_API_KEY:-}"

if [[ -z "$SAB_URL" || -z "$SAB_API_KEY" ]]; then
    echo "Error: SAB_URL and SAB_API_KEY must be set (via env or $CONFIG_FILE)" >&2
    exit 1
fi

# Remove trailing slash
SAB_URL="${SAB_URL%/}"

api_call() {
    local mode="$1"
    shift
    
    local url="${SAB_URL}/api?output=json&apikey=${SAB_API_KEY}&mode=${mode}"
    
    # Add additional parameters
    for param in "$@"; do
        url+="&${param}"
    done
    
    curl -sS "$url"
}

api_post() {
    local mode="$1"
    shift
    
    curl -sS -X POST \
        -F "output=json" \
        -F "apikey=$SAB_API_KEY" \
        -F "mode=$mode" \
        "$@" \
        "${SAB_URL}/api"
}

usage() {
    cat <<EOF
SABnzbd API CLI

Usage: $(basename "$0") <command> [options]

Commands:
  queue [--limit N] [--start N] [--category C] [--search S] [--nzo-id ID]
  history [--limit N] [--start N] [--category C] [--search S] [--failed]
  
  add <url> [--name N] [--category C] [--script S] [--priority P] [--pp PP]
  add-file <path> [--name N] [--category C] [--script S] [--priority P]
  
  pause                          Pause queue
  resume                         Resume queue
  pause-job <nzo_id>             Pause single job
  resume-job <nzo_id>            Resume single job
  
  delete <nzo_id> [--files]      Delete from queue
  purge [--search S] [--files]   Clear queue
  
  delete-history <nzo_id> [--files]
  retry <nzo_id>                 Retry failed job
  retry-all                      Retry all failed
  
  speedlimit <value>             Set speed (50 = 50%, 5M = 5MB/s, 0 = unlimited)
  
  change-category <nzo_id> <cat>
  change-script <nzo_id> <script>
  change-priority <nzo_id> <priority>
  rename <nzo_id> <name> [password]
  
  categories                     List categories
  scripts                        List scripts
  
  status                         Full status info
  version                        SABnzbd version
  warnings                       Active warnings
  warnings-clear                 Clear warnings
  server-stats                   Download statistics

Priority: force(2), high(1), normal(0), low(-1), paused(-2), duplicate(-3)
Post-processing: none(0), repair(1), unpack(2), delete(3), default(-1)

Examples:
  $(basename "$0") queue --limit 10
  $(basename "$0") add "https://indexer.com/get.php?..." --category tv
  $(basename "$0") speedlimit 10M
  $(basename "$0") history --failed
EOF
}

cmd_queue() {
    local limit="" start="" category="" search="" nzo_ids=""
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --limit|-l) limit="$2"; shift 2 ;;
            --start|-s) start="$2"; shift 2 ;;
            --category|-c) category="$2"; shift 2 ;;
            --search) search="$2"; shift 2 ;;
            --nzo-id) nzo_ids="$2"; shift 2 ;;
            *) echo "Unknown option: $1" >&2; exit 1 ;;
        esac
    done
    
    local params=()
    [[ -n "$limit" ]] && params+=("limit=$limit")
    [[ -n "$start" ]] && params+=("start=$start")
    [[ -n "$category" ]] && params+=("cat=$category")
    [[ -n "$search" ]] && params+=("search=$search")
    [[ -n "$nzo_ids" ]] && params+=("nzo_ids=$nzo_ids")
    
    api_call "queue" "${params[@]}"
}

cmd_history() {
    local limit="" start="" category="" search="" failed=""
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --limit|-l) limit="$2"; shift 2 ;;
            --start|-s) start="$2"; shift 2 ;;
            --category|-c) category="$2"; shift 2 ;;
            --search) search="$2"; shift 2 ;;
            --failed|-f) failed="1"; shift ;;
            *) echo "Unknown option: $1" >&2; exit 1 ;;
        esac
    done
    
    local params=()
    [[ -n "$limit" ]] && params+=("limit=$limit")
    [[ -n "$start" ]] && params+=("start=$start")
    [[ -n "$category" ]] && params+=("cat=$category")
    [[ -n "$search" ]] && params+=("search=$search")
    [[ -n "$failed" ]] && params+=("failed_only=1")
    
    api_call "history" "${params[@]}"
}

priority_to_num() {
    case "$1" in
        force) echo "2" ;;
        high) echo "1" ;;
        normal) echo "0" ;;
        low) echo "-1" ;;
        paused) echo "-2" ;;
        duplicate) echo "-3" ;;
        default) echo "-100" ;;
        *) echo "$1" ;;
    esac
}

pp_to_num() {
    case "$1" in
        none) echo "0" ;;
        repair) echo "1" ;;
        unpack) echo "2" ;;
        delete) echo "3" ;;
        default) echo "-1" ;;
        *) echo "$1" ;;
    esac
}

cmd_add() {
    local url="$1"; shift
    local name="" category="" script="" priority="" pp=""
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --name|-n) name="$2"; shift 2 ;;
            --category|-c) category="$2"; shift 2 ;;
            --script|-s) script="$2"; shift 2 ;;
            --priority|-p) priority=$(priority_to_num "$2"); shift 2 ;;
            --pp) pp=$(pp_to_num "$2"); shift 2 ;;
            *) echo "Unknown option: $1" >&2; exit 1 ;;
        esac
    done
    
    local encoded_url
    encoded_url=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$url', safe=''))")
    
    local params=("name=$encoded_url")
    [[ -n "$name" ]] && params+=("nzbname=$name")
    [[ -n "$category" ]] && params+=("cat=$category")
    [[ -n "$script" ]] && params+=("script=$script")
    [[ -n "$priority" ]] && params+=("priority=$priority")
    [[ -n "$pp" ]] && params+=("pp=$pp")
    
    api_call "addurl" "${params[@]}"
}

cmd_add_file() {
    local filepath="$1"; shift
    local name="" category="" script="" priority="" pp=""
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --name|-n) name="$2"; shift 2 ;;
            --category|-c) category="$2"; shift 2 ;;
            --script|-s) script="$2"; shift 2 ;;
            --priority|-p) priority=$(priority_to_num "$2"); shift 2 ;;
            --pp) pp=$(pp_to_num "$2"); shift 2 ;;
            *) echo "Unknown option: $1" >&2; exit 1 ;;
        esac
    done
    
    local args=(-F "nzbfile=@$filepath")
    [[ -n "$name" ]] && args+=(-F "nzbname=$name")
    [[ -n "$category" ]] && args+=(-F "cat=$category")
    [[ -n "$script" ]] && args+=(-F "script=$script")
    [[ -n "$priority" ]] && args+=(-F "priority=$priority")
    [[ -n "$pp" ]] && args+=(-F "pp=$pp")
    
    api_post "addfile" "${args[@]}"
}

cmd_pause() {
    api_call "pause"
}

cmd_resume() {
    api_call "resume"
}

cmd_pause_job() {
    local nzo_id="$1"
    api_call "queue" "name=pause" "value=$nzo_id"
}

cmd_resume_job() {
    local nzo_id="$1"
    api_call "queue" "name=resume" "value=$nzo_id"
}

cmd_delete() {
    local nzo_id="$1"; shift
    local del_files="0"
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --files|-f) del_files="1"; shift ;;
            *) echo "Unknown option: $1" >&2; exit 1 ;;
        esac
    done
    
    api_call "queue" "name=delete" "value=$nzo_id" "del_files=$del_files"
}

cmd_purge() {
    local search="" del_files="0"
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --search|-s) search="$2"; shift 2 ;;
            --files|-f) del_files="1"; shift ;;
            *) echo "Unknown option: $1" >&2; exit 1 ;;
        esac
    done
    
    local params=("name=purge" "del_files=$del_files")
    [[ -n "$search" ]] && params+=("search=$search")
    
    api_call "queue" "${params[@]}"
}

cmd_delete_history() {
    local nzo_id="$1"; shift
    local del_files="0"
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --files|-f) del_files="1"; shift ;;
            *) echo "Unknown option: $1" >&2; exit 1 ;;
        esac
    done
    
    api_call "history" "name=delete" "value=$nzo_id" "del_files=$del_files"
}

cmd_retry() {
    local nzo_id="$1"
    api_call "retry" "value=$nzo_id"
}

cmd_retry_all() {
    api_call "retry_all"
}

cmd_speedlimit() {
    local value="$1"
    api_call "config" "name=speedlimit" "value=$value"
}

cmd_change_category() {
    local nzo_id="$1"
    local category="$2"
    api_call "change_cat" "value=$nzo_id" "value2=$category"
}

cmd_change_script() {
    local nzo_id="$1"
    local script="$2"
    api_call "change_script" "value=$nzo_id" "value2=$script"
}

cmd_change_priority() {
    local nzo_id="$1"
    local priority=$(priority_to_num "$2")
    api_call "queue" "name=priority" "value=$nzo_id" "value2=$priority"
}

cmd_rename() {
    local nzo_id="$1"
    local name="$2"
    local password="${3:-}"
    
    local params=("name=rename" "value=$nzo_id" "value2=$name")
    [[ -n "$password" ]] && params+=("value3=$password")
    
    api_call "queue" "${params[@]}"
}

cmd_categories() {
    api_call "get_cats"
}

cmd_scripts() {
    api_call "get_scripts"
}

cmd_status() {
    api_call "fullstatus"
}

cmd_version() {
    api_call "version"
}

cmd_warnings() {
    api_call "warnings"
}

cmd_warnings_clear() {
    api_call "warnings" "name=clear"
}

cmd_server_stats() {
    api_call "server_stats"
}

# Main dispatch
case "${1:-}" in
    queue) shift; cmd_queue "$@" ;;
    history) shift; cmd_history "$@" ;;
    add) shift; cmd_add "$@" ;;
    add-file) shift; cmd_add_file "$@" ;;
    pause) shift; cmd_pause "$@" ;;
    resume) shift; cmd_resume "$@" ;;
    pause-job) shift; cmd_pause_job "$@" ;;
    resume-job) shift; cmd_resume_job "$@" ;;
    delete) shift; cmd_delete "$@" ;;
    purge) shift; cmd_purge "$@" ;;
    delete-history) shift; cmd_delete_history "$@" ;;
    retry) shift; cmd_retry "$@" ;;
    retry-all) shift; cmd_retry_all "$@" ;;
    speedlimit) shift; cmd_speedlimit "$@" ;;
    change-category) shift; cmd_change_category "$@" ;;
    change-script) shift; cmd_change_script "$@" ;;
    change-priority) shift; cmd_change_priority "$@" ;;
    rename) shift; cmd_rename "$@" ;;
    categories) shift; cmd_categories "$@" ;;
    scripts) shift; cmd_scripts "$@" ;;
    status) shift; cmd_status "$@" ;;
    version) shift; cmd_version "$@" ;;
    warnings) shift; cmd_warnings "$@" ;;
    warnings-clear) shift; cmd_warnings_clear "$@" ;;
    server-stats) shift; cmd_server_stats "$@" ;;
    -h|--help|help|"") usage ;;
    *) echo "Unknown command: $1" >&2; usage; exit 1 ;;
esac
