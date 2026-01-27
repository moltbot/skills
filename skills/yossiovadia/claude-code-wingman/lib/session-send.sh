#!/bin/bash
# session-send.sh - Send a command to an existing Claude Code tmux session
# Usage: session-send.sh <session-name> <command> [options]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SESSION_STATUS="$SCRIPT_DIR/session-status.sh"

# Defaults
SESSION_NAME=""
COMMAND=""
FORCE=false
WAIT_TIMEOUT=30  # seconds to wait for idle state
QUIET=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --force|-f)
            FORCE=true
            shift
            ;;
        --timeout|-t)
            WAIT_TIMEOUT="$2"
            shift 2
            ;;
        --quiet|-q)
            QUIET=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 <session-name> <command> [options]"
            echo ""
            echo "Options:"
            echo "  --force, -f       Send without checking session state"
            echo "  --timeout, -t N   Wait up to N seconds for idle state (default: 30)"
            echo "  --quiet, -q       Suppress output messages"
            echo ""
            echo "Example: $0 my-session 'Read the README file'"
            exit 0
            ;;
        *)
            if [ -z "$SESSION_NAME" ]; then
                SESSION_NAME="$1"
            elif [ -z "$COMMAND" ]; then
                COMMAND="$1"
            else
                echo "Error: Unknown argument: $1" >&2
                exit 1
            fi
            shift
            ;;
    esac
done

if [ -z "$SESSION_NAME" ] || [ -z "$COMMAND" ]; then
    echo "Usage: $0 <session-name> <command> [options]" >&2
    echo "Example: $0 my-session 'Read the README file'" >&2
    echo "Use --help for more options" >&2
    exit 1
fi

# Helper function for output
log() {
    if [ "$QUIET" = false ]; then
        echo "$@"
    fi
}

# Check if session exists
if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo "Error: tmux session '$SESSION_NAME' does not exist" >&2
    exit 1
fi

# Check session status before sending (unless --force)
if [ "$FORCE" = false ]; then
    log "Checking session state..."

    ELAPSED=0
    while [ $ELAPSED -lt $WAIT_TIMEOUT ]; do
        # Get session status
        STATUS_JSON=$("$SESSION_STATUS" "$SESSION_NAME" --json 2>/dev/null || echo '{"status":"error"}')
        STATUS=$(echo "$STATUS_JSON" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

        case "$STATUS" in
            idle)
                log "Session is ready (idle)"
                break
                ;;
            waiting_approval)
                echo "Error: Session is waiting for approval. Approve it first or use --force" >&2
                exit 1
                ;;
            working)
                log "Session is working, waiting... ($ELAPSED/${WAIT_TIMEOUT}s)"
                sleep 2
                ELAPSED=$((ELAPSED + 2))
                ;;
            error)
                echo "Error: Session is in error state" >&2
                exit 1
                ;;
            *)
                # Unknown state - wait a bit and retry
                log "Session state: $STATUS, waiting... ($ELAPSED/${WAIT_TIMEOUT}s)"
                sleep 2
                ELAPSED=$((ELAPSED + 2))
                ;;
        esac
    done

    # Final check after timeout
    if [ $ELAPSED -ge $WAIT_TIMEOUT ]; then
        STATUS_JSON=$("$SESSION_STATUS" "$SESSION_NAME" --json 2>/dev/null || echo '{"status":"error"}')
        STATUS=$(echo "$STATUS_JSON" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        if [ "$STATUS" != "idle" ]; then
            echo "Error: Timed out waiting for session to become idle (current: $STATUS)" >&2
            echo "Use --force to send anyway, or --timeout N to wait longer" >&2
            exit 1
        fi
    fi
fi

# Send the command
log "Sending command..."
tmux send-keys -t "$SESSION_NAME" "$COMMAND"
sleep 0.5

# Send Enter once
tmux send-keys -t "$SESSION_NAME" C-m

# Verify the command was sent by checking if state changed
sleep 1
if [ "$FORCE" = false ]; then
    STATUS_JSON=$("$SESSION_STATUS" "$SESSION_NAME" --json 2>/dev/null || echo '{"status":"unknown"}')
    STATUS=$(echo "$STATUS_JSON" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

    if [ "$STATUS" = "idle" ]; then
        # Still idle - command might not have been received, try Enter again
        log "Session still idle, sending Enter again..."
        tmux send-keys -t "$SESSION_NAME" C-m
        sleep 1
    fi
fi

log "Sent command to session '$SESSION_NAME': $COMMAND"
