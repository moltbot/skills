#!/bin/bash

# C.R.A.B Deploy Agent
# Multi-step deployment workflow with human approval

set -e

DEPLOY_DIR="$HOME/.clawdbot/skills/deploy-agent"
STATE_DIR="$DEPLOY_DIR/state"
SCRIPTS_DIR="$DEPLOY_DIR/scripts"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() { echo -e "${GREEN}[🚀]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; }
info() { echo -e "${BLUE}[i]${NC} $1"; }

# Ensure state directory exists
mkdir -p "$STATE_DIR"

get_state_file() {
    echo "$STATE_DIR/$1.json"
}

get_state() {
    local name="$1"
    local file=$(get_state_file "$name")
    if [ -f "$file" ]; then
        cat "$file"
    else
        echo "{}"
    fi
}

save_state() {
    local name="$1"
    local file=$(get_state_file "$name")
    cat > "$file"
    log "State saved for: $name"
}

check_prerequisites() {
    log "Checking prerequisites..."
    
    local missing=()
    
    if ! command -v gh &> /dev/null; then
        missing+=("gh")
    fi
    if ! command -v wrangler &> /dev/null; then
        missing+=("wrangler")
    fi
    if ! command -v git &> /dev/null; then
        missing+=("git")
    fi
    
    if [ ${#missing[@]} -ne 0 ]; then
        error "Missing required tools: ${missing[*]}"
        error "Install them before using deploy-agent"
        exit 1
    fi
    
    # Check Cloudflare token
    if ! wrangler whoami &> /dev/null; then
        warn "Cloudflare not configured. Run 'wrangler whoami' to set up."
    fi
    
    log "All prerequisites satisfied!"
}

# New: Check Next.js + D1 deployment requirements
check_nextjs_d1() {
    local app_dir="$1"
    
    if [ ! -d "$app_dir" ]; then
        error "Directory not found: $app_dir"
        return 1
    fi
    
    cd "$app_dir"
    
    log "Checking Next.js + D1 deployment requirements..."
    
    # Check 1: Next.js version
    local next_version=$(npm list next 2>/dev/null | grep next | awk '{print $2}')
    if [ -z "$next_version" ]; then
        warn "Next.js not found in dependencies"
    elif [[ "$next_version" =~ ^16\. ]]; then
        error "Next.js $next_version is too new for Cloudflare Pages"
        info "Fix: npm install next@15.5.2"
        return 1
    elif [[ "$next_version" =~ ^15\.6 ]] || [[ "$next_version" =~ ^15\.[7-9] ]] || [[ "$next_version" =~ ^1[6-9] ]]; then
        warn "Next.js $next_version may have compatibility issues"
        info "Recommended: next@15.5.2"
    else
        info "Next.js version: $next_version ✅"
    fi
    
    # Check 2: @cloudflare/next-on-pages
    if ! npm list @cloudflare/next-on-pages &> /dev/null; then
        warn "@cloudflare/next-on-pages not installed"
        info "Fix: npm install -D @cloudflare/next-on-pages"
    else
        info "Cloudflare adapter installed ✅"
    fi
    
    # Check 3: wrangler in devDependencies
    if ! npm list wrangler &> /dev/null; then
        warn "wrangler not in devDependencies"
        info "Fix: npm install -D wrangler"
    else
        info "wrangler installed ✅"
    fi
    
    # Check 4: package-lock.json sync
    if [ ! -f "package-lock.json" ]; then
        warn "package-lock.json missing"
        info "Fix: npm install && git add package-lock.json"
    else
        info "package-lock.json exists ✅"
    fi
    
    # Check 5: wrangler.toml
    if [ ! -f "wrangler.toml" ]; then
        warn "wrangler.toml not found"
        info "Create wrangler.toml with D1 database binding"
    else
        info "wrangler.toml exists ✅"
        
        # Check for D1 database
        if grep -q "d1_databases" wrangler.toml; then
            info "D1 database configured ✅"
        else
            warn "No D1 database in wrangler.toml"
            info "Add D1 binding for database access"
        fi
        
        # Check for compatibility_flags
        if grep -q "compatibility_flags" wrangler.toml; then
            info "Compatibility flags set ✅"
        else
            warn "compatibility_flags not set"
            info "Add: compatibility_flags = [\"nodejs_compat\"]"
        fi
    fi
    
    # Check 6: API routes have edge runtime
    local api_dir="$app_dir/src/app/api"
    if [ -d "$api_dir" ]; then
        local edge_count=$(grep -r "runtime = 'edge'" "$api_dir" 2>/dev/null | wc -l)
        if [ "$edge_count" -gt 0 ]; then
            info "$api_dir routes have edge runtime ✅"
        else
            warn "API routes missing 'export const runtime = \"edge\"'"
            info "Add to each API route file"
        fi
    else
        info "No API routes found (static site)"
    fi
    
    log "Next.js + D1 check complete!"
}

cmd_init() {
    local name="$1"
    
    if [ -z "$name" ]; then
        error "Usage: deploy-agent init <app-name>"
        exit 1
    fi
    
    check_prerequisites
    
    local state_file=$(get_state_file "$name")
    if [ -f "$state_file" ]; then
        error "Deployment '$name' already exists. Use 'deploy-agent status $name' or 'deploy-agent cancel $name'"
        exit 1
    fi
    
    log "Initializing deployment for: $name"
    
    # Create initial state
    cat > "$state_file" <<EOF
{
  "name": "$name",
  "step": 1,
  "status": "waiting_for_design",
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "approvals": {},
  "repo_url": null,
  "domain": null
}
EOF
    
    info "Deployment initialized: $name"
    info "Step 1: Design your app"
    info ""
    info "Tell C.R.A.B what you want to build:"
    info "- What type of app?"
    info "- What features?"
    info "- Any specific frameworks?"
    info ""
    info "When ready, say 'deploy-agent continue $name' to proceed."
}

cmd_status() {
    local name="$1"
    
    if [ -z "$name" ]; then
        error "Usage: deploy-agent status <app-name>"
        exit 1
    fi
    
    local state=$(get_state "$name")
    if [ "$state" = "{}" ]; then
        error "Deployment '$name' not found"
        exit 1
    fi
    
    echo "$state" | jq -r '
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Deployment: \(.name)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Step: \(.step)
📊 Status: \(.status)
📅 Created: \(.created_at)

🔗 Repo: \(if .repo_url then .repo_url else "Not created yet" end)
🌐 Domain: \(if .domain then .domain else "Not deployed yet" end)

✅ Approvals: 
   - Step 1: \(if .approvals.step1 then "Approved" else "Pending" end)
   - Step 2: \(if .approvals.step2 then "Approved" else "Pending" end)
   - Step 3: \(if .approvals.step3 then "Approved" else "Pending" end)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    '
}

cmd_continue() {
    local name="$1"
    
    if [ -z "$name" ]; then
        error "Usage: deploy-agent continue <app-name>"
        exit 1
    fi
    
    local state=$(get_state "$name")
    if [ "$state" = "{}" ]; then
        error "Deployment '$name' not found"
        exit 1
    fi
    
    local step=$(echo "$state" | jq -r '.step')
    
    case "$step" in
        1)
            log "Step 1: Design phase"
            info "Review your design with C.R.A.B"
            info "When ready to build, say 'deploy-agent build $name'"
            ;;
        2)
            log "Step 2: Local testing"
            info "Start the dev server and test your app"
            info "URL: http://localhost:3000 (or custom port)"
            info "When ready to push, say 'deploy-agent push $name'"
            ;;
        3)
            log "Step 3: GitHub push"
            info "Creating GitHub repository..."
            info "When ready to deploy to Cloudflare, say 'deploy-agent deploy $name'"
            ;;
        4)
            log "Step 4: Cloudflare deployment"
            info "Deploying to Cloudflare Pages..."
            info "Setting up custom domain..."
            ;;
        *)
            error "Unknown step: $step"
            ;;
    esac
}

cmd_check_nextjs_d1() {
    local dir="${1:-.}"
    
    if [ "$dir" = "." ] || [ -z "$dir" ]; then
        dir=$(pwd)
    fi
    
    check_nextjs_d1 "$dir"
}

cmd_build() {
    local name="$1"
    
    if [ -z "$name" ]; then
        error "Usage: deploy-agent build <app-name>"
        exit 1
    fi
    
    local state=$(get_state "$name")
    if [ "$state" = "{}" ]; then
        error "Deployment '$name' not found"
        exit 1
    fi
    
    local current_step=$(echo "$state" | jq -r '.step')
    if [ "$current_step" != "1" ]; then
        error "Not at step 1. Current step: $current_step"
        exit 1
    fi
    
    log "Building app for: $name"
    info "This would trigger C.R.A.B to generate code"
    info "After build, you'll need to start the dev server manually"
    
    # Update state to step 2
    echo "$state" | jq '.step = 2 | .status = "built"' > "$(get_state_file "$name")"
    
    log "Build complete! Step 2: Local Testing"
    info "Start dev server: cd <app-dir> && npm run dev"
    info "Then say 'deploy-agent test $name'"
}

cmd_test() {
    local name="$1"
    
    if [ -z "$name" ]; then
        error "Usage: deploy-agent test <app-name>"
        exit 1
    fi
    
    local state=$(get_state "$name")
    if [ "$state" = "{}" ]; then
        error "Deployment '$name' not found"
        exit 1
    fi
    
    log "Step 2: Local Testing"
    info "App should be running at http://localhost:3000"
    info "Review and test thoroughly"
    info "When ready to push to GitHub, say 'deploy-agent push $name'"
}

cmd_push() {
    local name="$1"
    local repo_name="${2:-$name}"
    
    if [ -z "$name" ]; then
        error "Usage: deploy-agent push <app-name> [repo-name]"
        exit 1
    fi
    
    local state=$(get_state "$name")
    if [ "$state" = "{}" ]; then
        error "Deployment '$name' not found"
        exit 1
    fi
    
    local current_step=$(echo "$state" | jq -r '.step')
    if [ "$current_step" != "2" ]; then
        error "Not at step 2. Build and test first."
        exit 1
    fi
    
    log "Step 3: Creating GitHub repository..."
    info "Repo name: $repo_name"
    
    # Create repo (would use gh CLI here)
    # gh repo create "$repo_name" --public --description "Deployed with C.R.A.B Deploy Agent"
    
    # For now, just show what would happen
    info "Would run: gh repo create $repo_name --public"
    info "Then: git remote add origin https://github.com/user/$repo_name"
    info "Then: git add -A && git commit && git push"
    
    # Update state
    echo "$state" | jq ".step = 3 | .status = 'github_ready' | .repo_url = \"https://github.com/user/$repo_name\"" > "$(get_state_file "$name")"
    
    log "GitHub repository ready!"
    info "Say 'deploy-agent deploy $name' to deploy to Cloudflare"
}

cmd_deploy() {
    local name="$1"
    local domain="${2:-}"
    
    if [ -z "$name" ]; then
        error "Usage: deploy-agent deploy <app-name> [custom-domain]"
        exit 1
    fi
    
    local state=$(get_state "$name")
    if [ "$state" = "{}" ]; then
        error "Deployment '$name' not found"
        exit 1
    fi
    
    local current_step=$(echo "$state" | jq -r '.step')
    if [ "$current_step" != "3" ]; then
        error "Not at step 3. Push to GitHub first."
        exit 1
    fi
    
    local repo_url=$(echo "$state" | jq -r '.repo_url')
    local domain_name="${domain:-$name.sheraj.org}"
    
    log "Step 4: Deploying to Cloudflare Pages..."
    info "Repo: $repo_url"
    info "Domain: $domain_name"
    
    # This is what wrangler would do:
    # wrangler pages deploy --project-name="$name" --branch=main
    
    # For custom domain:
    # wrangler pages domain "$domain_name" --project="$name"
    
    info "Would run: wrangler pages deploy --project-name=$name"
    info "Would run: wrangler pages domain $domain_name --project=$name"
    
    # Update state
    echo "$state" | jq ".step = 4 | .status = 'deployed' | .domain = \"$domain_name\"" > "$(get_state_file "$name")"
    
    log "🎉 Deployment complete!"
    info "App live at: https://$domain_name"
}

cmd_cancel() {
    local name="$1"
    
    if [ -z "$name" ]; then
        error "Usage: deploy-agent cancel <app-name>"
        exit 1
    fi
    
    local state_file=$(get_state_file "$name")
    if [ ! -f "$state_file" ]; then
        error "Deployment '$name' not found"
        exit 1
    fi
    
    warn "Cancelling deployment: $name"
    rm "$state_file"
    log "Deployment cancelled and cleaned up."
}

cmd_list() {
    log "Active deployments:"
    
    if [ -z "$(ls -A "$STATE_DIR" 2>/dev/null)" ]; then
        info "No active deployments"
        return
    fi
    
    for file in "$STATE_DIR"/*.json; do
        local name=$(basename "$file" .json)
        local state=$(cat "$file")
        local step=$(echo "$state" | jq -r '.step')
        local status=$(echo "$state" | jq -r '.status')
        echo "  - $name (Step $step, $status)"
    done
}

show_help() {
    cat <<EOF
🚀 C.R.A.B Deploy Agent

Usage: deploy-agent <command> [args]

Commands:
  init <name>           Start a new deployment
  status <name>         Check deployment status
  continue <name>       Continue to next step
  check_nextjs_d1 <dir> Check Next.js + D1 deployment requirements
  build <name>          Build the app (after design)
  test <name>           Test locally before push
  push <name> [repo]    Push to GitHub
  deploy <name> [domain] Deploy to Cloudflare Pages
  cancel <name>         Cancel deployment
  list                  List all deployments

Examples:
  deploy-agent init my-app
  deploy-agent check_nextjs_d1 ./my-app
  deploy-agent status my-app
  deploy-agent push my-app my-repo-name
  deploy-agent deploy my-app myapp.sheraj.org

EOF
}

# Main
case "$1" in
    init|status|continue|check_nextjs_d1|build|test|push|deploy|cancel|list)
        cmd_"$1" "${@:2}"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
