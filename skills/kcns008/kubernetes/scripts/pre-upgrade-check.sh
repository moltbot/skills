#!/bin/bash
# pre-upgrade-check.sh - Pre-upgrade cluster validation
# Usage: ./pre-upgrade-check.sh

set -e

echo "=== PRE-UPGRADE CLUSTER VALIDATION ===" >&2
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >&2
echo "" >&2

WARNINGS=0
BLOCKERS=0

# 1. Cluster Version
echo "### Cluster Version ###" >&2
SERVER_VERSION=$(kubectl version -o json 2>/dev/null | jq -r '.serverVersion.gitVersion')
echo "Server Version: $SERVER_VERSION" >&2

# 2. Node Status
echo -e "\n### Node Status ###" >&2
kubectl get nodes >&2
NOT_READY=$(kubectl get nodes --no-headers | grep -cv "Ready" || echo 0)
if [ "$NOT_READY" -gt 0 ]; then
    BLOCKERS=$((BLOCKERS + 1))
    echo "BLOCKER: $NOT_READY nodes not ready" >&2
fi

# 3. Control Plane Health
echo -e "\n### Control Plane Health ###" >&2
kubectl get pods -n kube-system -l tier=control-plane 2>/dev/null || \
kubectl get pods -n kube-system | grep -E "kube-apiserver|kube-controller|kube-scheduler|etcd" >&2

# 4. Pods Not Running
echo -e "\n### Pods Not Running ###" >&2
NOT_RUNNING=$(kubectl get pods -A --field-selector=status.phase!=Running,status.phase!=Succeeded --no-headers 2>/dev/null | wc -l | tr -d ' ')
if [ "$NOT_RUNNING" -gt 0 ]; then
    WARNINGS=$((WARNINGS + 1))
    echo "WARNING: $NOT_RUNNING pods not in Running/Succeeded state" >&2
    kubectl get pods -A --field-selector=status.phase!=Running,status.phase!=Succeeded >&2
else
    echo "✓ All pods running" >&2
fi

# 5. PodDisruptionBudgets
echo -e "\n### PodDisruptionBudgets ###" >&2
PDB_COUNT=$(kubectl get pdb -A --no-headers 2>/dev/null | wc -l | tr -d ' ')
echo "Found $PDB_COUNT PDBs" >&2
if [ "$PDB_COUNT" -gt 0 ]; then
    kubectl get pdb -A >&2
fi

# 6. Pending PVCs
echo -e "\n### Pending PVCs ###" >&2
PENDING_PVC=$(kubectl get pvc -A --field-selector=status.phase=Pending --no-headers 2>/dev/null | wc -l | tr -d ' ')
if [ "$PENDING_PVC" -gt 0 ]; then
    WARNINGS=$((WARNINGS + 1))
    echo "WARNING: $PENDING_PVC PVCs pending" >&2
    kubectl get pvc -A --field-selector=status.phase=Pending >&2
else
    echo "✓ No pending PVCs" >&2
fi

# 7. Deprecated APIs
echo -e "\n### Deprecated API Usage ###" >&2
DEPRECATED=$(kubectl get --raw /metrics 2>/dev/null | grep -c "apiserver_requested_deprecated_apis" || echo 0)
if [ "$DEPRECATED" -gt 0 ]; then
    WARNINGS=$((WARNINGS + 1))
    echo "WARNING: Deprecated APIs may be in use" >&2
    echo "Check: kubectl get --raw /metrics | grep apiserver_requested_deprecated_apis" >&2
else
    echo "✓ No deprecated API metrics found" >&2
fi

# 8. etcd Health (if accessible)
echo -e "\n### etcd Health ###" >&2
ETCD_PODS=$(kubectl get pods -n kube-system -l component=etcd --no-headers 2>/dev/null | wc -l | tr -d ' ')
if [ "$ETCD_PODS" -gt 0 ]; then
    kubectl get pods -n kube-system -l component=etcd >&2
else
    echo "etcd pods not directly visible (managed platform)" >&2
fi

# 9. Resource Pressure
echo -e "\n### Node Resource Pressure ###" >&2
PRESSURE=$(kubectl get nodes -o json 2>/dev/null | jq -r '.items[] | select(.status.conditions[] | select(.type | contains("Pressure")) | .status == "True") | .metadata.name')
if [ -n "$PRESSURE" ]; then
    WARNINGS=$((WARNINGS + 1))
    echo "WARNING: Nodes under pressure:" >&2
    echo "$PRESSURE" >&2
else
    echo "✓ No resource pressure detected" >&2
fi

# OpenShift-specific checks
if command -v oc &> /dev/null && oc whoami &> /dev/null; then
    echo -e "\n### OpenShift Cluster Operators ###" >&2
    DEGRADED=$(oc get clusteroperators --no-headers 2>/dev/null | grep -c -E "False.*True|False.*False" || echo 0)
    if [ "$DEGRADED" -gt 0 ]; then
        BLOCKERS=$((BLOCKERS + 1))
        echo "BLOCKER: $DEGRADED cluster operators degraded" >&2
        oc get clusteroperators | grep -E "False.*True|False.*False" >&2
    else
        echo "✓ All cluster operators healthy" >&2
    fi
fi

# Summary
echo "" >&2
echo "========================================" >&2
echo "PRE-UPGRADE CHECK SUMMARY" >&2
echo "========================================" >&2
echo "Blockers: $BLOCKERS" >&2
echo "Warnings: $WARNINGS" >&2

if [ "$BLOCKERS" -gt 0 ]; then
    echo "" >&2
    echo "❌ DO NOT PROCEED WITH UPGRADE" >&2
    echo "   Resolve blockers before upgrading" >&2
elif [ "$WARNINGS" -gt 0 ]; then
    echo "" >&2
    echo "⚠️  PROCEED WITH CAUTION" >&2
    echo "   Review warnings before upgrading" >&2
else
    echo "" >&2
    echo "✅ CLUSTER READY FOR UPGRADE" >&2
fi

# Output JSON
cat << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "server_version": "$SERVER_VERSION",
  "blockers": $BLOCKERS,
  "warnings": $WARNINGS,
  "ready_for_upgrade": $([ $BLOCKERS -eq 0 ] && echo "true" || echo "false")
}
EOF
