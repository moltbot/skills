#!/bin/bash
# AutoFillIn - Form Filling Orchestrator v1.2.0
# Coordinates the form filling process with validation and error recovery

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
DEBUG_PORT="${CHROME_DEBUG_PORT:-9222}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"

# Error handling - trap instead of set -e for graceful recovery
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        echo -e "${RED}[ERROR] Script failed with exit code: $exit_code${NC}" >&2
    fi
    exit $exit_code
}
trap cleanup EXIT

error_exit() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
    exit "${2:-1}"
}

warn() {
    echo -e "${YELLOW}[WARN] $1${NC}" >&2
}

info() {
    echo -e "${CYAN}[INFO] $1${NC}"
}

success() {
    echo -e "${GREEN}[OK] $1${NC}"
}

show_help() {
    echo -e "${BLUE}AutoFillIn - Automated Form Filling Tool v1.2.0${NC}"
    echo ""
    echo "Usage: $0 [OPTIONS] <URL>"
    echo ""
    echo "Options:"
    echo "  -h, --help           Show this help message"
    echo "  -c, --check          Check environment only"
    echo "  -s, --setup          Run setup script"
    echo "  --start-chrome       Start Chrome with debug mode"
    echo "  --port PORT          Use custom debug port (default: 9222)"
    echo "  --use-playwright     Use Playwright instead of Chrome debug"
    echo "  -v, --verbose        Verbose output"
    echo ""
    echo "Examples:"
    echo "  $0 https://example.com/form"
    echo "  $0 --check"
    echo "  $0 --start-chrome https://molthub.com/upload"
    echo "  $0 --use-playwright https://google.com/forms"
    echo ""
}

check_command() {
    local cmd="$1"
    local name="${2:-$cmd}"
    if command -v "$cmd" &>/dev/null; then
        return 0
    else
        return 1
    fi
}

check_environment() {
    echo -e "${CYAN}Checking AutoFillIn Environment...${NC}"
    echo ""
    
    local issues=0
    
    # Check Chrome
    echo -n "  Chrome: "
    if [ -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
        echo -e "${GREEN}Found (macOS)${NC}"
    elif check_command google-chrome; then
        echo -e "${GREEN}Found (Linux)${NC}"
    elif check_command chromium; then
        echo -e "${GREEN}Found (Chromium)${NC}"
    else
        echo -e "${RED}Not found${NC}"
        ((issues++))
    fi
    
    # Check Node.js
    echo -n "  Node.js: "
    if check_command node; then
        echo -e "${GREEN}$(node -v)${NC}"
    else
        echo -e "${RED}Not found${NC}"
        ((issues++))
    fi
    
    # Check npx
    echo -n "  npx: "
    if check_command npx; then
        echo -e "${GREEN}Available${NC}"
    else
        echo -e "${RED}Not found${NC}"
        ((issues++))
    fi
    
    # Check Playwright
    echo -n "  Playwright: "
    if npx playwright --version &>/dev/null 2>&1; then
        echo -e "${GREEN}$(npx playwright --version 2>/dev/null || echo 'Available')${NC}"
    else
        echo -e "${YELLOW}Not installed (optional)${NC}"
    fi
    
    # Check debug port
    echo -n "  Debug Port ${DEBUG_PORT}: "
    if lsof -i:$DEBUG_PORT >/dev/null 2>&1; then
        local pid=$(lsof -t -i:$DEBUG_PORT 2>/dev/null | head -1)
        echo -e "${GREEN}Active (PID: $pid)${NC}"
    else
        echo -e "${YELLOW}Not active${NC}"
    fi
    
    # Check auth file
    echo -n "  Auth Session: "
    if [ -f "$HOME/.playwright-auth.json" ]; then
        local age=$(( ($(date +%s) - $(stat -f %m "$HOME/.playwright-auth.json" 2>/dev/null || stat -c %Y "$HOME/.playwright-auth.json" 2>/dev/null || echo 0)) / 86400 ))
        echo -e "${GREEN}Found (${age} days old)${NC}"
    else
        echo -e "${YELLOW}Not found (first login required)${NC}"
    fi
    
    # Check config directory
    echo -n "  Config Directory: "
    if [ -d "$HOME/.chrome-autofillin" ]; then
        echo -e "${GREEN}Exists${NC}"
    else
        echo -e "${YELLOW}Will be created${NC}"
    fi
    
    echo ""
    
    if [ "$issues" -eq 0 ]; then
        success "Environment OK"
        return 0
    else
        warn "Found $issues issue(s). Run: $0 --setup"
        return 1
    fi
}

start_chrome_safe() {
    local url="${1:-about:blank}"
    
    # Check if start-chrome.sh exists
    if [ ! -x "$SCRIPT_DIR/start-chrome.sh" ]; then
        error_exit "start-chrome.sh not found or not executable"
    fi
    
    info "Starting Chrome with debug mode..."
    bash "$SCRIPT_DIR/start-chrome.sh" "$url"
    local exit_code=$?
    
    if [ $exit_code -ne 0 ]; then
        warn "Chrome start returned non-zero. Checking if it's actually running..."
        sleep 2
        if lsof -i:$DEBUG_PORT >/dev/null 2>&1; then
            success "Chrome is running on port $DEBUG_PORT"
            return 0
        else
            error_exit "Failed to start Chrome" $exit_code
        fi
    fi
    
    return 0
}

use_playwright() {
    local url="$1"
    local auth_file="$HOME/.playwright-auth.json"
    
    info "Using Playwright for browser automation..."
    
    if [ -f "$auth_file" ]; then
        info "Loading saved session from $auth_file"
        npx playwright open --load-storage="$auth_file" "$url"
    else
        warn "No saved session. Creating new one..."
        info "Please login in the browser window, then close it to save session."
        npx playwright open --save-storage="$auth_file" "$url"
    fi
}

# Parse arguments
ACTION=""
URL=""
CUSTOM_PORT=""
VERBOSE=false
USE_PLAYWRIGHT=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -c|--check)
            ACTION="check"
            shift
            ;;
        -s|--setup)
            ACTION="setup"
            shift
            ;;
        --start-chrome)
            ACTION="start-chrome"
            shift
            ;;
        --use-playwright)
            USE_PLAYWRIGHT=true
            shift
            ;;
        --port)
            CUSTOM_PORT="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -*)
            warn "Unknown option: $1"
            shift
            ;;
        *)
            URL="$1"
            shift
            ;;
    esac
done

# Apply custom port if specified
if [ -n "$CUSTOM_PORT" ]; then
    DEBUG_PORT="$CUSTOM_PORT"
    export CHROME_DEBUG_PORT="$DEBUG_PORT"
fi

# Execute action
case "$ACTION" in
    check)
        check_environment
        ;;
    setup)
        info "Running environment setup..."
        if [ -x "$SCRIPT_DIR/setup-env.sh" ]; then
            bash "$SCRIPT_DIR/setup-env.sh"
        else
            error_exit "setup-env.sh not found or not executable"
        fi
        ;;
    start-chrome)
        if [ -z "$URL" ]; then
            URL="about:blank"
        fi
        start_chrome_safe "$URL"
        ;;
    *)
        if [ -z "$URL" ]; then
            show_help
            exit 1
        fi
        
        echo -e "${BLUE}+----------------------------------------------------------+${NC}"
        echo -e "${BLUE}|              AutoFillIn v1.2.0                          |${NC}"
        echo -e "${BLUE}+----------------------------------------------------------+${NC}"
        echo ""
        info "Target URL: ${URL}"
        echo ""
        
        if [ "$USE_PLAYWRIGHT" = true ]; then
            use_playwright "$URL"
        else
            # Check if Chrome is running with debug port
            if ! lsof -i:$DEBUG_PORT >/dev/null 2>&1; then
                warn "Chrome debug mode not detected on port $DEBUG_PORT"
                info "Starting Chrome..."
                start_chrome_safe "$URL" &
                sleep 3
            fi
            
            success "Ready for form filling operations."
            echo ""
            echo -e "${CYAN}Use browser automation tools to:${NC}"
            echo "  1. Navigate to: ${URL}"
            echo "  2. Use browser_snapshot to analyze page"
            echo "  3. Use browser_type to fill fields"
            echo "  4. Use browser_file_upload to upload files"
            echo "  5. Wait for manual confirmation before submit"
            echo ""
        fi
        ;;
esac
