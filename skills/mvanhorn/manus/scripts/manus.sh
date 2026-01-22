#!/bin/bash
# Manus API helper script
# Usage: manus.sh <action> [args]

API_BASE="https://api.manus.ai/v1"

if [ -z "$MANUS_API_KEY" ]; then
  echo "Error: MANUS_API_KEY not set" >&2
  exit 1
fi

action="$1"
shift

case "$action" in
  create)
    # Create a task: manus.sh create "your prompt here" [profile]
    prompt="$1"
    profile="${2:-manus-1.6}"
    curl -s -X POST "$API_BASE/tasks" \
      -H "API_KEY: $MANUS_API_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"prompt\": \"$prompt\", \"agentProfile\": \"$profile\"}"
    ;;
  
  get)
    # Get task: manus.sh get <task_id>
    task_id="$1"
    curl -s "$API_BASE/tasks/$task_id" \
      -H "API_KEY: $MANUS_API_KEY"
    ;;
  
  list)
    # List tasks: manus.sh list
    curl -s "$API_BASE/tasks" \
      -H "API_KEY: $MANUS_API_KEY"
    ;;
  
  *)
    echo "Usage: manus.sh <create|get|list> [args]"
    echo ""
    echo "Commands:"
    echo "  create \"prompt\" [profile]  - Create a new task"
    echo "  get <task_id>              - Get task status/result"
    echo "  list                       - List all tasks"
    echo ""
    echo "Profiles: manus-1.6 (default), manus-1.6-lite, manus-1.6-max"
    exit 1
    ;;
esac
