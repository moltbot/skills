---
name: kubernetes
description: |
  Comprehensive Kubernetes and OpenShift cluster management skill covering operations, troubleshooting, manifest generation, security, and GitOps. Use this skill when:
  (1) Cluster operations: upgrades, backups, node management, scaling, monitoring setup
  (2) Troubleshooting: pod failures, networking issues, storage problems, performance analysis
  (3) Creating manifests: Deployments, StatefulSets, Services, Ingress, NetworkPolicies, RBAC
  (4) Security: audits, Pod Security Standards, RBAC, secrets management, vulnerability scanning
  (5) GitOps: ArgoCD, Flux, Kustomize, Helm, CI/CD pipelines, progressive delivery
  (6) OpenShift-specific: SCCs, Routes, Operators, Builds, ImageStreams
  (7) Multi-cloud: AKS, EKS, GKE, ARO, ROSA operations
metadata:
  author: cluster-skills
  version: "1.0.0"
---

# Kubernetes & OpenShift Cluster Management

Comprehensive skill for Kubernetes and OpenShift clusters covering operations, troubleshooting, manifests, security, and GitOps.

## Current Versions (January 2026)

| Platform | Version | Documentation |
|----------|---------|---------------|
| **Kubernetes** | 1.31.x | https://kubernetes.io/docs/ |
| **OpenShift** | 4.17.x | https://docs.openshift.com/ |
| **EKS** | 1.31 | https://docs.aws.amazon.com/eks/ |
| **AKS** | 1.31 | https://learn.microsoft.com/azure/aks/ |
| **GKE** | 1.31 | https://cloud.google.com/kubernetes-engine/docs |

### Key Tools

| Tool | Version | Purpose |
|------|---------|---------|
| **ArgoCD** | v2.13.x | GitOps deployments |
| **Flux** | v2.4.x | GitOps toolkit |
| **Kustomize** | v5.5.x | Manifest customization |
| **Helm** | v3.16.x | Package management |
| **Velero** | 1.15.x | Backup/restore |
| **Trivy** | 0.58.x | Security scanning |
| **Kyverno** | 1.13.x | Policy engine |

## Command Convention

**IMPORTANT**: Use `kubectl` for standard Kubernetes. Use `oc` for OpenShift/ARO.

---

## 1. CLUSTER OPERATIONS

### Node Management

```bash
# View nodes
kubectl get nodes -o wide

# Drain node for maintenance
kubectl drain ${NODE} --ignore-daemonsets --delete-emptydir-data --grace-period=60

# Uncordon after maintenance
kubectl uncordon ${NODE}

# View node resources
kubectl top nodes
```

### Cluster Upgrades

**AKS:**
```bash
az aks get-upgrades -g ${RG} -n ${CLUSTER} -o table
az aks upgrade -g ${RG} -n ${CLUSTER} --kubernetes-version ${VERSION}
```

**EKS:**
```bash
aws eks update-cluster-version --name ${CLUSTER} --kubernetes-version ${VERSION}
```

**GKE:**
```bash
gcloud container clusters upgrade ${CLUSTER} --master --cluster-version ${VERSION}
```

**OpenShift:**
```bash
oc adm upgrade --to=${VERSION}
oc get clusterversion
```

### Backup with Velero

```bash
# Install Velero
velero install --provider ${PROVIDER} --bucket ${BUCKET} --secret-file ${CREDS}

# Create backup
velero backup create ${BACKUP_NAME} --include-namespaces ${NS}

# Restore
velero restore create --from-backup ${BACKUP_NAME}
```

---

## 2. TROUBLESHOOTING

### Health Assessment

Run the bundled script for comprehensive health check:
```bash
bash scripts/cluster-health-check.sh
```

### Pod Status Interpretation

| Status | Meaning | Action |
|--------|---------|--------|
| `Pending` | Scheduling issue | Check resources, nodeSelector, tolerations |
| `CrashLoopBackOff` | Container crashing | Check logs: `kubectl logs ${POD} --previous` |
| `ImagePullBackOff` | Image unavailable | Verify image name, registry access |
| `OOMKilled` | Out of memory | Increase memory limits |
| `Evicted` | Node pressure | Check node resources |

### Debugging Commands

```bash
# Pod logs (current and previous)
kubectl logs ${POD} -c ${CONTAINER} --previous

# Multi-pod logs with stern
stern ${LABEL_SELECTOR} -n ${NS}

# Exec into pod
kubectl exec -it ${POD} -- /bin/sh

# Pod events
kubectl describe pod ${POD} | grep -A 20 Events

# Cluster events (sorted by time)
kubectl get events -A --sort-by='.lastTimestamp' | tail -50
```

### Network Troubleshooting

```bash
# Test DNS
kubectl run -it --rm debug --image=busybox -- nslookup kubernetes.default

# Test service connectivity
kubectl run -it --rm debug --image=curlimages/curl -- curl -v http://${SVC}.${NS}:${PORT}

# Check endpoints
kubectl get endpoints ${SVC}
```

---

## 3. MANIFEST GENERATION

### Production Deployment Template

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${APP_NAME}
  namespace: ${NAMESPACE}
  labels:
    app.kubernetes.io/name: ${APP_NAME}
    app.kubernetes.io/version: "${VERSION}"
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app.kubernetes.io/name: ${APP_NAME}
  template:
    metadata:
      labels:
        app.kubernetes.io/name: ${APP_NAME}
    spec:
      serviceAccountName: ${APP_NAME}
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: ${APP_NAME}
          image: ${IMAGE}:${TAG}
          ports:
            - name: http
              containerPort: 8080
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
          readinessProbe:
            httpGet:
              path: /ready
              port: http
            initialDelaySeconds: 5
            periodSeconds: 5
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
                    app.kubernetes.io/name: ${APP_NAME}
                topologyKey: kubernetes.io/hostname
```

### Service & Ingress

```yaml
apiVersion: v1
kind: Service
metadata:
  name: ${APP_NAME}
spec:
  selector:
    app.kubernetes.io/name: ${APP_NAME}
  ports:
    - name: http
      port: 80
      targetPort: http
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${APP_NAME}
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - ${HOST}
      secretName: ${APP_NAME}-tls
  rules:
    - host: ${HOST}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: ${APP_NAME}
                port:
                  name: http
```

### OpenShift Route

```yaml
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: ${APP_NAME}
spec:
  to:
    kind: Service
    name: ${APP_NAME}
  port:
    targetPort: http
  tls:
    termination: edge
    insecureEdgeTerminationPolicy: Redirect
```

Use the bundled script for manifest generation:
```bash
bash scripts/generate-manifest.sh deployment myapp production
```

---

## 4. SECURITY

### Security Audit

Run the bundled script:
```bash
bash scripts/security-audit.sh [namespace]
```

### Pod Security Standards

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ${NAMESPACE}
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: baseline
    pod-security.kubernetes.io/warn: restricted
```

### NetworkPolicy (Zero Trust)

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ${APP_NAME}-policy
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: ${APP_NAME}
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
    # Allow DNS
    - to:
        - namespaceSelector: {}
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
```

### RBAC Best Practices

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ${APP_NAME}
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: ${APP_NAME}-role
rules:
  - apiGroups: [""]
    resources: ["configmaps"]
    verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: ${APP_NAME}-binding
subjects:
  - kind: ServiceAccount
    name: ${APP_NAME}
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: ${APP_NAME}-role
```

### Image Scanning

```bash
# Scan image with Trivy
trivy image ${IMAGE}:${TAG}

# Scan with severity filter
trivy image --severity HIGH,CRITICAL ${IMAGE}:${TAG}

# Generate SBOM
trivy image --format spdx-json -o sbom.json ${IMAGE}:${TAG}
```

---

## 5. GITOPS

### ArgoCD Application

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ${APP_NAME}
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: default
  source:
    repoURL: ${GIT_REPO}
    targetRevision: main
    path: k8s/overlays/${ENV}
  destination:
    server: https://kubernetes.default.svc
    namespace: ${NAMESPACE}
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

### Kustomize Structure

```
k8s/
├── base/
│   ├── kustomization.yaml
│   ├── deployment.yaml
│   └── service.yaml
└── overlays/
    ├── dev/
    │   └── kustomization.yaml
    ├── staging/
    │   └── kustomization.yaml
    └── prod/
        └── kustomization.yaml
```

**base/kustomization.yaml:**
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - deployment.yaml
  - service.yaml
```

**overlays/prod/kustomization.yaml:**
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - ../../base
namePrefix: prod-
namespace: production
replicas:
  - name: myapp
    count: 5
images:
  - name: myregistry/myapp
    newTag: v1.2.3
```

### GitHub Actions CI/CD

```yaml
name: Build and Deploy
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build and push image
        uses: docker/build-push-action@v5
        with:
          push: true
          tags: ${{ secrets.REGISTRY }}/${{ github.event.repository.name }}:${{ github.sha }}
      
      - name: Update Kustomize image
        run: |
          cd k8s/overlays/prod
          kustomize edit set image myapp=${{ secrets.REGISTRY }}/${{ github.event.repository.name }}:${{ github.sha }}
          
      - name: Commit and push
        run: |
          git config user.name "github-actions"
          git config user.email "github-actions@github.com"
          git add .
          git commit -m "Update image to ${{ github.sha }}"
          git push
```

Use the bundled script for ArgoCD sync:
```bash
bash scripts/argocd-app-sync.sh ${APP_NAME} --prune
```

---

## Helper Scripts

This skill includes automation scripts in the `scripts/` directory:

| Script | Purpose |
|--------|---------|
| `cluster-health-check.sh` | Comprehensive cluster health assessment with scoring |
| `security-audit.sh` | Security posture audit (privileged, root, RBAC, NetworkPolicy) |
| `node-maintenance.sh` | Safe node drain and maintenance prep |
| `pre-upgrade-check.sh` | Pre-upgrade validation checklist |
| `generate-manifest.sh` | Generate production-ready K8s manifests |
| `argocd-app-sync.sh` | ArgoCD application sync helper |

Run any script:
```bash
bash scripts/<script-name>.sh [arguments]
```
