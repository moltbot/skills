#!/bin/bash
# Health check for linkedin-monitor
# Verifies all dependencies and authentication status

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="${HOME}/.clawdbot/linkedin-monitor"
CONFIG_FILE="${CONFIG_DIR}/config.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check result tracking
ERRORS=0
WARNINGS=0

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((ERRORS++))
}

check_warn() {
    echo -e "${YELLOW}!${NC} $1"
    ((WARNINGS++))
}

echo "LinkedIn Monitor Health Check"
echo "=============================="
echo ""

# 1. Check jq installed
echo "Dependencies:"
if command -v jq &> /dev/null; then
    check_pass "jq installed ($(jq --version))"
else
    check_fail "jq not installed — run: brew install jq"
fi

# 2. Check lk CLI installed
if command -v lk &> /dev/null; then
    check_pass "lk CLI installed"
else
    check_fail "lk CLI not installed — run: npm install -g lk"
fi

echo ""

# 3. Check lk authentication
echo "Authentication:"
if command -v lk &> /dev/null; then
    # Try to get profile to verify auth
    if lk profile me --json 2>/dev/null | jq -e '.id' &>/dev/null; then
        PROFILE_NAME=$(lk profile me --json 2>/dev/null | jq -r '.firstName + " " + .lastName')
        check_pass "LinkedIn authenticated as: ${PROFILE_NAME}"
    else
        check_fail "LinkedIn auth expired — run: lk auth login"
    fi
else
    check_warn "Cannot check auth (lk not installed)"
fi

echo ""

# 4. Check configuration
echo "Configuration:"
if [ -f "${CONFIG_FILE}" ]; then
    check_pass "Config file exists"
    
    # Validate JSON
    if jq empty "${CONFIG_FILE}" 2>/dev/null; then
        check_pass "Config JSON valid"
        
        # Check required fields
        CHANNEL_ID=$(jq -r '.alertChannelId // ""' "${CONFIG_FILE}")
        if [ -n "${CHANNEL_ID}" ] && [ "${CHANNEL_ID}" != "null" ]; then
            check_pass "Alert channel configured"
        else
            check_warn "Alert channel not configured — run setup"
        fi
        
        AUTONOMY=$(jq -r '.autonomyLevel // 1' "${CONFIG_FILE}")
        check_pass "Autonomy level: ${AUTONOMY}"
        
    else
        check_fail "Config JSON invalid"
    fi
else
    check_warn "Config not found — run: linkedin-monitor setup"
fi

echo ""

# 5. Check state directory
echo "State:"
STATE_DIR="${CONFIG_DIR}/state"
if [ -d "${STATE_DIR}" ]; then
    check_pass "State directory exists"
    
    MESSAGES_FILE="${STATE_DIR}/messages.json"
    if [ -f "${MESSAGES_FILE}" ]; then
        SEEN_COUNT=$(jq '.seenIds | length' "${MESSAGES_FILE}" 2>/dev/null || echo "0")
        LAST_CHECK=$(jq -r '.lastCheck // "never"' "${MESSAGES_FILE}" 2>/dev/null)
        check_pass "Seen messages: ${SEEN_COUNT}"
        check_pass "Last check: ${LAST_CHECK}"
    else
        check_warn "No state file yet (first run)"
    fi
    
    # Check lastrun for watchdog
    LASTRUN_FILE="${STATE_DIR}/lastrun.txt"
    if [ -f "${LASTRUN_FILE}" ]; then
        LASTRUN=$(cat "${LASTRUN_FILE}")
        LASTRUN_EPOCH=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "${LASTRUN}" +%s 2>/dev/null || echo "0")
        NOW_EPOCH=$(date +%s)
        AGE_HOURS=$(( (NOW_EPOCH - LASTRUN_EPOCH) / 3600 ))
        
        if [ ${AGE_HOURS} -lt 2 ]; then
            check_pass "Monitor running (last run ${AGE_HOURS}h ago)"
        else
            check_warn "Monitor may be stale (last run ${AGE_HOURS}h ago)"
        fi
    fi
else
    check_warn "State directory not initialized — run: linkedin-monitor check"
fi

echo ""

# 6. Check cron jobs
echo "Automation:"
if crontab -l 2>/dev/null | grep -q "linkedin-monitor"; then
    check_pass "Cron job installed"
else
    check_warn "Cron job not installed — run: linkedin-monitor enable"
fi

# Summary
echo ""
echo "=============================="
if [ ${ERRORS} -eq 0 ] && [ ${WARNINGS} -eq 0 ]; then
    echo -e "${GREEN}All checks passed!${NC}"
    exit 0
elif [ ${ERRORS} -eq 0 ]; then
    echo -e "${YELLOW}${WARNINGS} warning(s), no errors${NC}"
    exit 0
else
    echo -e "${RED}${ERRORS} error(s), ${WARNINGS} warning(s)${NC}"
    exit 1
fi
