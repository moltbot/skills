#!/bin/bash
# security-audit.sh - Kubernetes security posture assessment
# Usage: ./security-audit.sh [namespace]

set -e

NAMESPACE=${1:-""}
NS_FLAG=""
if [ -n "$NAMESPACE" ]; then
    NS_FLAG="-n $NAMESPACE"
    echo "=== SECURITY AUDIT: Namespace $NAMESPACE ===" >&2
else
    NS_FLAG="-A"
    echo "=== SECURITY AUDIT: All Namespaces ===" >&2
fi
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >&2
echo "" >&2

FINDINGS=()
CRITICAL=0
WARNING=0
INFO=0

# 1. Privileged Containers (Critical)
echo "### Checking for privileged containers..." >&2
PRIVILEGED=$(kubectl get pods $NS_FLAG -o json 2>/dev/null | jq -r '.items[] | select(.spec.containers[].securityContext.privileged == true) | "\(.metadata.namespace)/\(.metadata.name)"')
if [ -n "$PRIVILEGED" ]; then
    CRITICAL=$((CRITICAL + 1))
    FINDINGS+=("CRITICAL: Privileged containers found")
    echo "CRITICAL: Privileged containers:" >&2
    echo "$PRIVILEGED" >&2
else
    echo "✓ No privileged containers" >&2
fi

# 2. Containers Running as Root (Warning)
echo -e "\n### Checking for root containers..." >&2
ROOT_CONTAINERS=$(kubectl get pods $NS_FLAG -o json 2>/dev/null | jq -r '.items[] | select(.spec.securityContext.runAsNonRoot != true) | select(.spec.containers[].securityContext.runAsNonRoot != true) | "\(.metadata.namespace)/\(.metadata.name)"' | sort -u)
ROOT_COUNT=$(echo "$ROOT_CONTAINERS" | grep -c . || echo 0)
if [ "$ROOT_COUNT" -gt 0 ]; then
    WARNING=$((WARNING + 1))
    FINDINGS+=("WARNING: $ROOT_COUNT pods may run as root")
    echo "WARNING: Pods without runAsNonRoot:" >&2
    echo "$ROOT_CONTAINERS" | head -10 >&2
    [ "$ROOT_COUNT" -gt 10 ] && echo "... and $((ROOT_COUNT - 10)) more" >&2
else
    echo "✓ All pods have runAsNonRoot" >&2
fi

# 3. Host Namespace Access (Critical)
echo -e "\n### Checking for host namespace access..." >&2
HOST_ACCESS=$(kubectl get pods $NS_FLAG -o json 2>/dev/null | jq -r '.items[] | select(.spec.hostNetwork == true or .spec.hostPID == true or .spec.hostIPC == true) | "\(.metadata.namespace)/\(.metadata.name)"')
if [ -n "$HOST_ACCESS" ]; then
    CRITICAL=$((CRITICAL + 1))
    FINDINGS+=("CRITICAL: Host namespace access detected")
    echo "CRITICAL: Pods with host namespace access:" >&2
    echo "$HOST_ACCESS" >&2
else
    echo "✓ No host namespace access" >&2
fi

# 4. Missing Resource Limits (Warning)
echo -e "\n### Checking for missing resource limits..." >&2
NO_LIMITS=$(kubectl get pods $NS_FLAG -o json 2>/dev/null | jq -r '[.items[] | select(.spec.containers[].resources.limits == null)] | length')
if [ "$NO_LIMITS" -gt 10 ]; then
    WARNING=$((WARNING + 1))
    FINDINGS+=("WARNING: $NO_LIMITS containers without resource limits")
    echo "WARNING: $NO_LIMITS containers missing resource limits" >&2
else
    echo "✓ Resource limits configured ($NO_LIMITS missing)" >&2
fi

# 5. Default Service Account Usage (Info)
echo -e "\n### Checking for default service account usage..." >&2
DEFAULT_SA=$(kubectl get pods $NS_FLAG -o json 2>/dev/null | jq -r '.items[] | select(.spec.serviceAccountName == "default" or .spec.serviceAccountName == null) | "\(.metadata.namespace)/\(.metadata.name)"')
DEFAULT_SA_COUNT=$(echo "$DEFAULT_SA" | grep -c . || echo 0)
if [ "$DEFAULT_SA_COUNT" -gt 0 ]; then
    INFO=$((INFO + 1))
    FINDINGS+=("INFO: $DEFAULT_SA_COUNT pods using default service account")
    echo "INFO: Pods using default SA:" >&2
    echo "$DEFAULT_SA" | head -10 >&2
else
    echo "✓ No pods using default service account" >&2
fi

# 6. Wildcard RBAC (Critical)
echo -e "\n### Checking for overly permissive RBAC..." >&2
WILDCARD_ROLES=$(kubectl get clusterroles -o json 2>/dev/null | jq -r '.items[] | select(.rules[]?.verbs[]? == "*" and .rules[]?.resources[]? == "*") | .metadata.name')
if [ -n "$WILDCARD_ROLES" ]; then
    CRITICAL=$((CRITICAL + 1))
    FINDINGS+=("CRITICAL: Wildcard RBAC permissions found")
    echo "CRITICAL: ClusterRoles with wildcard permissions:" >&2
    echo "$WILDCARD_ROLES" >&2
else
    echo "✓ No wildcard RBAC permissions" >&2
fi

# 7. Pods without NetworkPolicy (Info)
echo -e "\n### Checking NetworkPolicy coverage..." >&2
if [ -n "$NAMESPACE" ]; then
    NP_COUNT=$(kubectl get networkpolicy -n $NAMESPACE --no-headers 2>/dev/null | wc -l | tr -d ' ')
    if [ "$NP_COUNT" -eq 0 ]; then
        INFO=$((INFO + 1))
        FINDINGS+=("INFO: Namespace $NAMESPACE has no NetworkPolicies")
        echo "INFO: No NetworkPolicies in $NAMESPACE" >&2
    else
        echo "✓ $NP_COUNT NetworkPolicies found" >&2
    fi
else
    NS_WITHOUT_NP=0
    for ns in $(kubectl get ns -o jsonpath='{.items[*].metadata.name}' 2>/dev/null); do
        count=$(kubectl get networkpolicy -n $ns --no-headers 2>/dev/null | wc -l | tr -d ' ')
        [ "$count" -eq 0 ] && NS_WITHOUT_NP=$((NS_WITHOUT_NP + 1))
    done
    if [ "$NS_WITHOUT_NP" -gt 0 ]; then
        INFO=$((INFO + 1))
        FINDINGS+=("INFO: $NS_WITHOUT_NP namespaces without NetworkPolicies")
        echo "INFO: $NS_WITHOUT_NP namespaces lack NetworkPolicies" >&2
    fi
fi

# Summary
echo "" >&2
echo "========================================" >&2
echo "SECURITY AUDIT SUMMARY" >&2
echo "========================================" >&2
echo "Critical Issues: $CRITICAL" >&2
echo "Warnings: $WARNING" >&2
echo "Informational: $INFO" >&2
echo "" >&2

if [ ${#FINDINGS[@]} -gt 0 ]; then
    echo "FINDINGS:" >&2
    for finding in "${FINDINGS[@]}"; do
        echo "  - $finding" >&2
    done
fi

# Output JSON
cat << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "namespace": "${NAMESPACE:-all}",
  "critical": $CRITICAL,
  "warning": $WARNING,
  "info": $INFO,
  "compliant": $([ $CRITICAL -eq 0 ] && echo "true" || echo "false")
}
EOF
