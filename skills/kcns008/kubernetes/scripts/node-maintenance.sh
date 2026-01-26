#!/bin/bash
# node-maintenance.sh - Safely drain and prepare node for maintenance
# Usage: ./node-maintenance.sh <node-name> [--force]

set -e

NODE=${1:-""}
FORCE=${2:-""}

if [ -z "$NODE" ]; then
    echo "Usage: $0 <node-name> [--force]" >&2
    echo "" >&2
    echo "Available nodes:" >&2
    kubectl get nodes --no-headers | awk '{print "  " $1 " (" $2 ")"}'
    exit 1
fi

echo "=== NODE MAINTENANCE: $NODE ===" >&2
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >&2
echo "" >&2

# Verify node exists
if ! kubectl get node "$NODE" &>/dev/null; then
    echo "Error: Node '$NODE' not found" >&2
    exit 1
fi

# Show current status
echo "### Current Node Status ###" >&2
kubectl get node "$NODE" -o wide >&2

echo -e "\n### Pods on Node ###" >&2
POD_COUNT=$(kubectl get pods -A --field-selector spec.nodeName="$NODE" --no-headers | wc -l | tr -d ' ')
echo "Total pods: $POD_COUNT" >&2
kubectl get pods -A --field-selector spec.nodeName="$NODE" --no-headers | head -20 >&2
[ "$POD_COUNT" -gt 20 ] && echo "... and $((POD_COUNT - 20)) more" >&2

# Check for pods with PDBs that might block drain
echo -e "\n### Checking PodDisruptionBudgets ###" >&2
kubectl get pdb -A -o json 2>/dev/null | jq -r '.items[] | "\(.metadata.namespace)/\(.metadata.name): minAvailable=\(.spec.minAvailable // "N/A"), maxUnavailable=\(.spec.maxUnavailable // "N/A")"' >&2

# Confirmation
if [ "$FORCE" != "--force" ]; then
    echo "" >&2
    read -p "Proceed with cordoning and draining node $NODE? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Aborted." >&2
        exit 0
    fi
fi

# Step 1: Cordon the node
echo -e "\n### Step 1: Cordoning node ###" >&2
kubectl cordon "$NODE"
echo "✓ Node cordoned (unschedulable)" >&2

# Step 2: Drain the node
echo -e "\n### Step 2: Draining node ###" >&2
DRAIN_OPTS="--ignore-daemonsets --delete-emptydir-data --grace-period=60 --timeout=300s"

if [ "$FORCE" == "--force" ]; then
    DRAIN_OPTS="$DRAIN_OPTS --force"
    echo "Force mode enabled" >&2
fi

if kubectl drain "$NODE" $DRAIN_OPTS; then
    echo "✓ Node drained successfully" >&2
else
    echo "Warning: Drain completed with some issues" >&2
fi

# Step 3: Verify no pods remain (except daemonsets)
echo -e "\n### Step 3: Verification ###" >&2
REMAINING=$(kubectl get pods -A --field-selector spec.nodeName="$NODE" --no-headers 2>/dev/null | wc -l | tr -d ' ')
echo "Remaining pods on node: $REMAINING (should be daemonsets only)" >&2
kubectl get pods -A --field-selector spec.nodeName="$NODE" >&2

echo "" >&2
echo "========================================" >&2
echo "NODE MAINTENANCE READY" >&2
echo "========================================" >&2
echo "Node '$NODE' is now cordoned and drained." >&2
echo "" >&2
echo "Perform your maintenance tasks, then run:" >&2
echo "  kubectl uncordon $NODE" >&2
echo "" >&2

# Output JSON
cat << EOF
{
  "node": "$NODE",
  "action": "drain",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "remaining_pods": $REMAINING,
  "status": "ready_for_maintenance"
}
EOF
