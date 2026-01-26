#!/bin/bash
# generate-manifest.sh - Generate production-ready Kubernetes manifests
# Usage: ./generate-manifest.sh <type> <name> [namespace]

set -e

TYPE=${1:-""}
NAME=${2:-""}
NAMESPACE=${3:-"default"}

VALID_TYPES="deployment statefulset service ingress configmap secret pvc networkpolicy hpa"

if [ -z "$TYPE" ] || [ -z "$NAME" ]; then
    echo "Usage: $0 <type> <name> [namespace]" >&2
    echo "" >&2
    echo "Available types: $VALID_TYPES" >&2
    exit 1
fi

echo "# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" 
echo "# Type: $TYPE | Name: $NAME | Namespace: $NAMESPACE"
echo ""

case $TYPE in
    deployment)
cat << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: $NAME
  namespace: $NAMESPACE
  labels:
    app.kubernetes.io/name: $NAME
    app.kubernetes.io/component: server
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app.kubernetes.io/name: $NAME
  template:
    metadata:
      labels:
        app.kubernetes.io/name: $NAME
    spec:
      serviceAccountName: $NAME
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: $NAME
          image: your-registry/$NAME:latest
          imagePullPolicy: Always
          ports:
            - name: http
              containerPort: 8080
              protocol: TCP
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: ["ALL"]
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
          livenessProbe:
            httpGet:
              path: /healthz
              port: http
            initialDelaySeconds: 10
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /ready
              port: http
            initialDelaySeconds: 5
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
          env:
            - name: POD_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
          volumeMounts:
            - name: tmp
              mountPath: /tmp
      volumes:
        - name: tmp
          emptyDir: {}
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app.kubernetes.io/name: $NAME
                topologyKey: kubernetes.io/hostname
EOF
        ;;
    
    statefulset)
cat << EOF
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: $NAME
  namespace: $NAMESPACE
  labels:
    app.kubernetes.io/name: $NAME
spec:
  serviceName: $NAME-headless
  replicas: 3
  podManagementPolicy: OrderedReady
  updateStrategy:
    type: RollingUpdate
  selector:
    matchLabels:
      app.kubernetes.io/name: $NAME
  template:
    metadata:
      labels:
        app.kubernetes.io/name: $NAME
    spec:
      serviceAccountName: $NAME
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      terminationGracePeriodSeconds: 30
      containers:
        - name: $NAME
          image: your-registry/$NAME:latest
          ports:
            - name: tcp
              containerPort: 5432
          securityContext:
            allowPrivilegeEscalation: false
            capabilities:
              drop: ["ALL"]
          resources:
            requests:
              cpu: 250m
              memory: 512Mi
            limits:
              cpu: 1000m
              memory: 2Gi
          volumeMounts:
            - name: data
              mountPath: /data
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: standard
        resources:
          requests:
            storage: 10Gi
EOF
        ;;
    
    service)
cat << EOF
apiVersion: v1
kind: Service
metadata:
  name: $NAME
  namespace: $NAMESPACE
  labels:
    app.kubernetes.io/name: $NAME
spec:
  type: ClusterIP
  ports:
    - name: http
      port: 80
      targetPort: http
      protocol: TCP
  selector:
    app.kubernetes.io/name: $NAME
EOF
        ;;
    
    ingress)
cat << EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: $NAME
  namespace: $NAMESPACE
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - $NAME.example.com
      secretName: $NAME-tls
  rules:
    - host: $NAME.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: $NAME
                port:
                  name: http
EOF
        ;;
    
    configmap)
cat << EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: $NAME
  namespace: $NAMESPACE
  labels:
    app.kubernetes.io/name: $NAME
data:
  config.yaml: |
    # Add your configuration here
    server:
      port: 8080
      host: "0.0.0.0"
EOF
        ;;
    
    secret)
cat << EOF
apiVersion: v1
kind: Secret
metadata:
  name: $NAME
  namespace: $NAMESPACE
  labels:
    app.kubernetes.io/name: $NAME
type: Opaque
stringData:
  # Replace with actual values before applying
  API_KEY: "your-api-key-here"
  DATABASE_URL: "postgresql://user:pass@host:5432/db"
EOF
        ;;
    
    pvc)
cat << EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: $NAME
  namespace: $NAMESPACE
  labels:
    app.kubernetes.io/name: $NAME
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: standard
  resources:
    requests:
      storage: 10Gi
EOF
        ;;
    
    networkpolicy)
cat << EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: $NAME
  namespace: $NAMESPACE
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: $NAME
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app.kubernetes.io/name: frontend
      ports:
        - protocol: TCP
          port: 8080
  egress:
    - to:
        - podSelector:
            matchLabels:
              app.kubernetes.io/name: database
      ports:
        - protocol: TCP
          port: 5432
    - to:
        - namespaceSelector: {}
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
EOF
        ;;
    
    hpa)
cat << EOF
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: $NAME
  namespace: $NAMESPACE
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: $NAME
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 25
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
EOF
        ;;
    
    *)
        echo "Unknown type: $TYPE" >&2
        echo "Valid types: $VALID_TYPES" >&2
        exit 1
        ;;
esac
