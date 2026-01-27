#!/bin/bash
# Claude Code Session Dashboard
# Shows all active Claude Code sessions with their status

echo "╭─── Claude Code Sessions ───────────────────────────────────────────╮"
echo "│"

# Get all tmux sessions
SESSIONS=$(tmux list-sessions -F "#{session_name}" 2>/dev/null)

if [ -z "$SESSIONS" ]; then
    echo "│  No active sessions"
else
    for SESSION in $SESSIONS; do
        # Get session creation time
        CREATED=$(tmux display-message -t "$SESSION" -p "#{session_created}")
        CREATED_DATE=$(date -r "$CREATED" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "Unknown")

        # Check if it's a Claude Code session (look for "claude" in pane content)
        OUTPUT=$(tmux capture-pane -t "$SESSION" -p 2>/dev/null)
        IS_CLAUDE=false
        if echo "$OUTPUT" | grep -q "Claude Code"; then
            IS_CLAUDE=true
        fi

        # Determine status
        STATUS="🟢 Active"
        if echo "$OUTPUT" | grep -q "Do you want"; then
            STATUS="⏸️  Waiting for approval"
        elif echo "$OUTPUT" | grep -q "error"; then
            STATUS="❌ Error"
        elif echo "$OUTPUT" | grep -q "✓"; then
            STATUS="✅ Task complete"
        fi

        # Get approver log if exists
        AUTO_LOG="/tmp/auto-approver-${SESSION}.log"
        INTERACTIVE_LOG="/tmp/interactive-approver-${SESSION}.log"
        APPROVALS=0

        if [ -f "$AUTO_LOG" ]; then
            APPROVALS=$(grep -c "Approval prompt detected" "$AUTO_LOG" 2>/dev/null || echo "0")
            APPROVER_TYPE="🤖 Auto"
        elif [ -f "$INTERACTIVE_LOG" ]; then
            APPROVALS=$(grep -c "Approval prompt detected" "$INTERACTIVE_LOG" 2>/dev/null || echo "0")
            APPROVER_TYPE="👤 Interactive"
        else
            APPROVER_TYPE="⚠️  None"
        fi

        # Print session info
        if [ "$IS_CLAUDE" = true ]; then
            echo "│  📋 $SESSION"
            echo "│     Status: $STATUS"
            echo "│     Created: $CREATED_DATE"
            echo "│     Approver: $APPROVER_TYPE (${APPROVALS} approvals)"
            echo "│     Commands:"
            echo "│       Attach:  tmux attach -t $SESSION"
            echo "│       Monitor: tmux capture-pane -t $SESSION -p"
            echo "│       Kill:    tmux kill-session -t $SESSION"
            echo "│"
        fi
    done
fi

echo "╰────────────────────────────────────────────────────────────────────╯"
echo ""
echo "💡 Tips:"
echo "  • Use --auto flag for automated approvals"
echo "  • Check logs: cat /tmp/*-approver-<session>.log"
echo "  • Monitor live: watch -n 2 ./dashboard.sh"
