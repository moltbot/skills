#!/bin/bash
# cluster-health-check.sh - Comprehensive cluster health assessment
# Usage: ./cluster-health-check.sh

set -e

echo "=== KUBERNETES CLUSTER HEALTH ASSESSMENT ===" >&2
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >&2
echo "" >&2

SCORE=100
ISSUES=()

# 1. Node Health (Critical: -50 points per issue)
echo "### NODE HEALTH ###" >&2
UNHEALTHY_NODES=$(kubectl get nodes --no-headers | grep -vE "Ready\s+<none>|Ready\s+master|Ready\s+control-plane" | grep -c -E "NotReady|Unknown" || echo 0)
if [ "$UNHEALTHY_NODES" -gt 0 ]; then
    SCORE=$((SCORE - 50))
    ISSUES+=("BOOM: $UNHEALTHY_NODES unhealthy nodes detected")
    kubectl get nodes | grep -E "NotReady|Unknown" >&2
else
    echo "✓ All nodes healthy" >&2
fi

# 2. Pod Issues (Warning: -20 points)
echo -e "\n### POD HEALTH ###" >&2
POD_ISSUES=$(kubectl get pods -A --field-selector=status.phase!=Running,status.phase!=Succeeded --no-headers 2>/dev/null | wc -l | tr -d ' ')
if [ "$POD_ISSUES" -gt 0 ]; then
    SCORE=$((SCORE - 20))
    ISSUES+=("WARN: $POD_ISSUES pods not in Running/Succeeded state")
    echo "Pods with issues:" >&2
    kubectl get pods -A --field-selector=status.phase!=Running,status.phase!=Succeeded >&2
else
    echo "✓ All pods running" >&2
fi

# 3. CrashLoopBackOff (Critical: -50 points)
echo -e "\n### CRASH LOOP DETECTION ###" >&2
CRASHLOOP=$(kubectl get pods -A -o json 2>/dev/null | jq -r '.items[] | select(.status.containerStatuses[]?.state.waiting?.reason == "CrashLoopBackOff") | "\(.metadata.namespace)/\(.metadata.name)"' | wc -l | tr -d ' ')
if [ "$CRASHLOOP" -gt 0 ]; then
    SCORE=$((SCORE - 50))
    ISSUES+=("BOOM: $CRASHLOOP pods in CrashLoopBackOff")
    kubectl get pods -A -o json | jq -r '.items[] | select(.status.containerStatuses[]?.state.waiting?.reason == "CrashLoopBackOff") | "\(.metadata.namespace)/\(.metadata.name)"' >&2
else
    echo "✓ No pods in CrashLoopBackOff" >&2
fi

# 4. Security - Privileged Containers (Critical: -50 points)
echo -e "\n### SECURITY - PRIVILEGED CONTAINERS ###" >&2
PRIVILEGED=$(kubectl get pods -A -o json 2>/dev/null | jq -r '[.items[] | select(.spec.containers[].securityContext.privileged == true)] | length')
if [ "$PRIVILEGED" -gt 0 ]; then
    SCORE=$((SCORE - 50))
    ISSUES+=("BOOM: $PRIVILEGED privileged containers detected")
    kubectl get pods -A -o json | jq -r '.items[] | select(.spec.containers[].securityContext.privileged == true) | "\(.metadata.namespace)/\(.metadata.name)"' >&2
else
    echo "✓ No privileged containers" >&2
fi

# 5. Resource Limits (Warning: -20 points)
echo -e "\n### RESOURCE CONFIGURATION ###" >&2
NO_LIMITS=$(kubectl get pods -A -o json 2>/dev/null | jq -r '[.items[] | select(.spec.containers[].resources.limits == null)] | length')
if [ "$NO_LIMITS" -gt 10 ]; then
    SCORE=$((SCORE - 20))
    ISSUES+=("WARN: $NO_LIMITS containers without resource limits")
else
    echo "✓ Most containers have resource limits" >&2
fi

# 6. PVC Status (Warning: -20 points)
echo -e "\n### STORAGE HEALTH ###" >&2
PENDING_PVC=$(kubectl get pvc -A --field-selector=status.phase!=Bound --no-headers 2>/dev/null | wc -l | tr -d ' ')
if [ "$PENDING_PVC" -gt 0 ]; then
    SCORE=$((SCORE - 20))
    ISSUES+=("WARN: $PENDING_PVC PVCs not bound")
    kubectl get pvc -A --field-selector=status.phase!=Bound >&2
else
    echo "✓ All PVCs bound" >&2
fi

# 7. Recent Warning Events (Info: -5 points per 10 events)
echo -e "\n### RECENT WARNING EVENTS ###" >&2
WARNING_EVENTS=$(kubectl get events -A --field-selector=type=Warning --no-headers 2>/dev/null | wc -l | tr -d ' ')
if [ "$WARNING_EVENTS" -gt 50 ]; then
    SCORE=$((SCORE - 5))
    ISSUES+=("INFO: $WARNING_EVENTS warning events in cluster")
    echo "Recent warning events: $WARNING_EVENTS" >&2
else
    echo "✓ Warning events within normal range" >&2
fi

# OpenShift-specific checks
if command -v oc &> /dev/null && oc whoami &> /dev/null; then
    echo -e "\n### OPENSHIFT CLUSTER OPERATORS ###" >&2
    DEGRADED=$(oc get clusteroperators --no-headers 2>/dev/null | grep -c -E "False.*True|False.*False" || echo 0)
    if [ "$DEGRADED" -gt 0 ]; then
        SCORE=$((SCORE - 50))
        ISSUES+=("BOOM: $DEGRADED cluster operators degraded/unavailable")
        oc get clusteroperators | grep -E "False.*True|False.*False" >&2
    else
        echo "✓ All cluster operators healthy" >&2
    fi
fi

# Ensure score doesn't go below 0
if [ "$SCORE" -lt 0 ]; then
    SCORE=0
fi

# Output summary
echo "" >&2
echo "========================================" >&2
echo "CLUSTER HEALTH SCORE: $SCORE/100" >&2
echo "========================================" >&2

if [ ${#ISSUES[@]} -gt 0 ]; then
    echo "" >&2
    echo "ISSUES FOUND:" >&2
    for issue in "${ISSUES[@]}"; do
        echo "  - $issue" >&2
    done
fi

# Output JSON for programmatic use
cat << EOF
{
  "score": $SCORE,
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "issues_count": ${#ISSUES[@]},
  "healthy": $([ $SCORE -ge 80 ] && echo "true" || echo "false")
}
EOF
