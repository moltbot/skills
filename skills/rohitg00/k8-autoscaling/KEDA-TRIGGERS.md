# KEDA Trigger Reference

Common KEDA trigger configurations.

## Queue-Based Triggers

### AWS SQS

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: sqs-scaler
spec:
  scaleTargetRef:
    name: queue-processor
  minReplicaCount: 0
  maxReplicaCount: 100
  triggers:
  - type: aws-sqs-queue
    metadata:
      queueURL: https://sqs.region.amazonaws.com/123456789/my-queue
      queueLength: "5"  # Scale when > 5 messages per pod
      awsRegion: us-east-1
    authenticationRef:
      name: aws-credentials
```

### RabbitMQ

```yaml
triggers:
- type: rabbitmq
  metadata:
    protocol: amqp
    queueName: my-queue
    mode: QueueLength
    value: "10"
    host: amqp://user:pass@rabbitmq.default.svc:5672
```

### Azure Service Bus

```yaml
triggers:
- type: azure-servicebus
  metadata:
    queueName: my-queue
    messageCount: "5"
  authenticationRef:
    name: azure-sb-auth
```

### Kafka

```yaml
triggers:
- type: kafka
  metadata:
    bootstrapServers: kafka:9092
    consumerGroup: my-consumer
    topic: my-topic
    lagThreshold: "100"
```

## Metric-Based Triggers

### Prometheus

```yaml
triggers:
- type: prometheus
  metadata:
    serverAddress: http://prometheus:9090
    metricName: http_requests_total
    query: sum(rate(http_requests_total{app="myapp"}[2m]))
    threshold: "100"
```

### Datadog

```yaml
triggers:
- type: datadog
  metadata:
    query: avg:system.cpu.user{app:myapp}
    queryValue: "80"
    type: global
  authenticationRef:
    name: datadog-auth
```

## Schedule-Based Triggers

### Cron

```yaml
triggers:
- type: cron
  metadata:
    timezone: America/New_York
    start: 0 8 * * 1-5   # 8 AM Mon-Fri
    end: 0 18 * * 1-5    # 6 PM Mon-Fri
    desiredReplicas: "10"
```

### Multiple Schedules

```yaml
triggers:
# Morning peak
- type: cron
  metadata:
    timezone: UTC
    start: 0 8 * * *
    end: 0 10 * * *
    desiredReplicas: "20"
# Afternoon peak
- type: cron
  metadata:
    timezone: UTC
    start: 0 14 * * *
    end: 0 16 * * *
    desiredReplicas: "15"
```

## HTTP-Based Triggers

### HTTP Request Count

```yaml
triggers:
- type: prometheus
  metadata:
    serverAddress: http://prometheus:9090
    query: sum(rate(nginx_http_requests_total[1m]))
    threshold: "1000"
```

## Database Triggers

### PostgreSQL

```yaml
triggers:
- type: postgresql
  metadata:
    connectionFromEnv: PG_CONNECTION
    query: "SELECT COUNT(*) FROM pending_jobs WHERE status = 'pending'"
    targetQueryValue: "10"
```

### MySQL

```yaml
triggers:
- type: mysql
  metadata:
    connectionStringFromEnv: MYSQL_CONNECTION
    query: "SELECT COUNT(*) FROM work_queue"
    queryValue: "5"
```

## Authentication

### TriggerAuthentication

```yaml
apiVersion: keda.sh/v1alpha1
kind: TriggerAuthentication
metadata:
  name: aws-credentials
spec:
  secretTargetRef:
  - parameter: awsAccessKeyID
    name: aws-secrets
    key: AWS_ACCESS_KEY_ID
  - parameter: awsSecretAccessKey
    name: aws-secrets
    key: AWS_SECRET_ACCESS_KEY
```

### ClusterTriggerAuthentication

For cluster-wide auth:

```yaml
apiVersion: keda.sh/v1alpha1
kind: ClusterTriggerAuthentication
metadata:
  name: aws-credentials-cluster
spec:
  secretTargetRef:
  - parameter: awsAccessKeyID
    name: aws-secrets
    key: AWS_ACCESS_KEY_ID
    namespace: keda
```

## Advanced Configuration

### Activation Threshold

Don't scale from 0 until threshold met:

```yaml
spec:
  minReplicaCount: 0
  advanced:
    horizontalPodAutoscalerConfig:
      behavior:
        scaleDown:
          stabilizationWindowSeconds: 300
  triggers:
  - type: prometheus
    metadata:
      threshold: "100"
    metricType: AverageValue
```

### Cool Down Period

```yaml
spec:
  cooldownPeriod: 300  # Wait 5 min before scaling down
```

### Polling Interval

```yaml
spec:
  pollingInterval: 30  # Check every 30 seconds
```

## MCP Commands

```python
# List ScaledObjects
keda_scaledobjects_list_tool(namespace)

# Get ScaledObject details
keda_scaledobject_get_tool(name, namespace)

# List TriggerAuthentications
keda_triggerauths_list_tool(namespace)

# Get TriggerAuthentication
keda_triggerauth_get_tool(name, namespace)

# List KEDA-managed HPAs
keda_hpa_list_tool(namespace)
```

## Troubleshooting

### ScaledObject Not Scaling

```python
keda_scaledobject_get_tool(name, namespace)
# Check status conditions
get_events(namespace)
```

**Common Issues:**
- Invalid trigger configuration
- Authentication failure
- Metric not found

### Metric Query Issues

```python
# For Prometheus, test query manually:
# curl prometheus:9090/api/v1/query?query=<your-query>
```
