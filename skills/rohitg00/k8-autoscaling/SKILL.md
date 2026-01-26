---
name: k8s-autoscaling
description: Configure Kubernetes autoscaling with HPA, VPA, and KEDA. Use for horizontal/vertical pod autoscaling, event-driven scaling, and capacity management.
---

# Kubernetes Autoscaling

Comprehensive autoscaling using HPA, VPA, and KEDA with kubectl-mcp-server tools.

## Quick Reference

### HPA (Horizontal Pod Autoscaler)

Basic CPU-based scaling:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

Apply and verify:
```
apply_manifest(hpa_yaml, namespace)
get_hpa(namespace)
```

### VPA (Vertical Pod Autoscaler)

Right-size resource requests:
```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: my-app-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  updatePolicy:
    updateMode: "Auto"
```

## KEDA (Event-Driven Autoscaling)

### Detect KEDA Installation
```
keda_detect_tool()
```

### List ScaledObjects
```
keda_scaledobjects_list_tool(namespace)
keda_scaledobject_get_tool(name, namespace)
```

### List ScaledJobs
```
keda_scaledjobs_list_tool(namespace)
```

### Trigger Authentication
```
keda_triggerauths_list_tool(namespace)
keda_triggerauth_get_tool(name, namespace)
```

### KEDA-Managed HPAs
```
keda_hpa_list_tool(namespace)
```

See [KEDA-TRIGGERS.md](KEDA-TRIGGERS.md) for trigger configurations.

## Common KEDA Triggers

### Queue-Based Scaling (AWS SQS)
```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: sqs-scaler
spec:
  scaleTargetRef:
    name: queue-processor
  minReplicaCount: 0  # Scale to zero!
  maxReplicaCount: 100
  triggers:
  - type: aws-sqs-queue
    metadata:
      queueURL: https://sqs.region.amazonaws.com/...
      queueLength: "5"
```

### Cron-Based Scaling
```yaml
triggers:
- type: cron
  metadata:
    timezone: America/New_York
    start: 0 8 * * 1-5   # 8 AM weekdays
    end: 0 18 * * 1-5    # 6 PM weekdays
    desiredReplicas: "10"
```

### Prometheus Metrics
```yaml
triggers:
- type: prometheus
  metadata:
    serverAddress: http://prometheus:9090
    metricName: http_requests_total
    query: sum(rate(http_requests_total{app="myapp"}[2m]))
    threshold: "100"
```

## Scaling Strategies

| Strategy | Tool | Use Case |
|----------|------|----------|
| CPU/Memory | HPA | Steady traffic patterns |
| Custom metrics | HPA v2 | Business metrics |
| Event-driven | KEDA | Queue processing, cron |
| Vertical | VPA | Right-size requests |
| Scale to zero | KEDA | Cost savings, idle workloads |

## Cost-Optimized Autoscaling

### Scale to Zero with KEDA
Reduce costs for idle workloads:
```
keda_scaledobjects_list_tool(namespace)
# ScaledObjects with minReplicaCount: 0 can scale to zero
```

### Right-Size with VPA
Get recommendations and apply:
```
get_resource_recommendations(namespace)
# Apply VPA recommendations
```

### Predictive Scaling
Use cron triggers for known patterns:
```yaml
# Scale up before traffic spike
triggers:
- type: cron
  metadata:
    start: 0 7 * * *  # 7 AM
    end: 0 9 * * *    # 9 AM
    desiredReplicas: "20"
```

## Multi-Cluster Autoscaling

Configure KEDA across clusters:
```
keda_scaledobjects_list_tool(namespace, context="production")
keda_scaledobjects_list_tool(namespace, context="staging")
```

## Troubleshooting

### HPA Not Scaling
```
get_hpa(namespace)
get_pod_metrics(name, namespace)  # Metrics available?
describe_pod(name, namespace)     # Resource requests set?
```

### KEDA Not Triggering
```
keda_scaledobject_get_tool(name, namespace)  # Check status
get_events(namespace)                        # Check events
```

### Common Issues

| Symptom | Check | Resolution |
|---------|-------|------------|
| HPA unknown | Metrics server | Install metrics-server |
| KEDA no scale | Trigger auth | Check TriggerAuthentication |
| VPA not updating | Update mode | Set updateMode: Auto |
| Scale down slow | Stabilization | Adjust stabilizationWindowSeconds |

## Best Practices

1. **Always Set Resource Requests**
   - HPA requires requests to calculate utilization

2. **Use Multiple Metrics**
   - Combine CPU + custom metrics for accuracy

3. **Stabilization Windows**
   - Prevent flapping with scaleDown stabilization

4. **Scale to Zero Carefully**
   - Consider cold start time
   - Use activation threshold

## Related Skills
- [k8s-cost](../k8s-cost/SKILL.md) - Cost optimization
- [k8s-troubleshoot](../k8s-troubleshoot/SKILL.md) - Debug scaling issues
