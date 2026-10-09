# ☸️ Tripchain Kubernetes (K8s) Architecture & Operations Guide

This directory contains cloud-native Kubernetes manifests configured for deploying the complete **Tripchain** platform with high availability, automated database migrations, distributed Redis caching, and EVM smart contract connectivity.

---

## 🏛️ Architecture Overview

| Component | Manifests | Type | Port | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | `frontend-deployment.yaml`, `frontend-service.yaml` | `Deployment` (2 replicas) + `LoadBalancer` | `80` | React 19 SPA served via Nginx with Brotli/Gzip and static caching |
| **Backend API** | `backend-deployment.yaml`, `backend-service.yaml` | `Deployment` (2 replicas) + `LoadBalancer` | `5000` | Express REST API with Prisma ORM, Helmet security, and SIWE auth |
| **Redis Cache** | `redis-deployment.yaml`, `redis-service.yaml` | `Deployment` (1 replica) + `ClusterIP` | `6379` | In-memory distributed caching for dashboard KPIs and leaderboards |
| **Hardhat EVM** | `hardhat-deployment.yaml`, `hardhat-service.yaml` | `Deployment` (1 replica) + `ClusterIP` | `8545` | Local EVM node with pre-compiled & auto-deployed smart contracts |
| **Secrets** | `secret.yaml` | `Secret` (Opaque) | - | Database URLs, JWT secrets, Web3 validator private keys, OAuth |
| **Ingress** | `ingress.yaml` | `Ingress` (NGINX) | `80` / `443` | Unified HTTP/S reverse proxy routing `/api` and `/` |

---

## 🚀 Quick Deployment Guide

### 1. Prerequisites
- `kubectl` installed ([Install kubectl](https://kubernetes.io/docs/tasks/tools/))
- Access to a Kubernetes cluster:
  - **Local**: Minikube, Kind, Docker Desktop K8s, or K3s
  - **Cloud**: AWS EKS, Google Cloud GKE, Azure AKS, or DigitalOcean Kubernetes

---

### 2. Configure Secrets (`secret.yaml`)
Open [`secret.yaml`](secret.yaml) and update the configuration for your environment:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: tripchain-secrets
type: Opaque
stringData:
  DATABASE_URL: "postgresql://user:pass@host:5432/neondb?sslmode=require"
  DIRECT_URL: "postgresql://user:pass@host:5432/neondb?sslmode=require"
  JWT_SECRET: "your_long_64_character_random_jwt_secret"
  FRONTEND_URL: "http://localhost:8080,https://tripchain-web.vercel.app"
  REDIS_URL: "redis://tripchain-redis-service:6379"

  # Web3 Configuration
  # For in-cluster Hardhat:
  CHAIN_ID: "31337"
  WEB3_RPC_URL: "http://tripchain-hardhat-service:8545"
  WEB3_VALIDATOR_PRIVATE_KEY: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

  # Or for Sepolia Testnet:
  # CHAIN_ID: "11155111"
  # WEB3_RPC_URL: "https://ethereum-sepolia-rpc.publicnode.com"
```

---

### 3. Build & Tag Container Images (If running locally)

If you are using Minikube or a local cluster, point your terminal to the cluster's Docker daemon, or build and tag:

```bash
# Build Backend
docker build -t tripchain-backend:latest ./backend

# Build Frontend
docker build -t tripchain-frontend:latest ./frontend

# Build Hardhat Node
docker build -t tripchain-hardhat:latest ./contracts
```

> **Note for Cloud (EKS/GKE):** Push images to your container registry (Docker Hub, AWS ECR, GCP GCR) and update the `image:` fields in the deployment manifests accordingly.

---

### 4. Deploy with Kustomize

Apply all manifests with a single command:

```bash
kubectl apply -k kubernetes/
```

Or apply individual files:
```bash
kubectl apply -f kubernetes/secret.yaml
kubectl apply -f kubernetes/redis-deployment.yaml
kubectl apply -f kubernetes/redis-service.yaml
kubectl apply -f kubernetes/hardhat-deployment.yaml
kubectl apply -f kubernetes/hardhat-service.yaml
kubectl apply -f kubernetes/backend-deployment.yaml
kubectl apply -f kubernetes/backend-service.yaml
kubectl apply -f kubernetes/frontend-deployment.yaml
kubectl apply -f kubernetes/frontend-service.yaml
kubectl apply -f kubernetes/ingress.yaml
```

---

### 5. Verify Pods & Services Status

Check that all pods are running and healthy:

```bash
kubectl get pods -l 'app in (tripchain-backend,tripchain-frontend,tripchain-redis,tripchain-hardhat)'
```

Output should show:
```text
NAME                                  READY   STATUS    RESTARTS   AGE
tripchain-backend-696fb54b8d-h2vx8    1/1     Running   0          45s
tripchain-backend-696fb54b8d-n8cpx    1/1     Running   0          45s
tripchain-frontend-77647895bc-7xwmv   1/1     Running   0          45s
tripchain-frontend-77647895bc-wzfl6   1/1     Running   0          45s
tripchain-hardhat-857c59897d-ql27z    1/1     Running   0          45s
tripchain-redis-556ff6dfbb-pxz2l      1/1     Running   0          45s
```

Check services:
```bash
kubectl get svc
```

---

### 6. Accessing Applications Locally (Port Forwarding)

If running in Minikube, Kind, or Docker Desktop:

```bash
# Terminal 1: Forward Frontend to localhost:8080
kubectl port-forward svc/tripchain-frontend-service 8080:80

# Terminal 2: Forward Backend to localhost:5000
kubectl port-forward svc/tripchain-backend-service 5000:5000

# Terminal 3: Forward Hardhat EVM Node to localhost:8545 (Optional)
kubectl port-forward svc/tripchain-hardhat-service 8545:8545
```

Open **`http://localhost:8080`** in your browser!

---

## ⚙️ Cloud Native Features Implemented

1. **Automated Prisma DB Migrations (`initContainers`)**:
   `backend-deployment.yaml` executes `npx prisma migrate deploy && node prisma/seedBadges.js` in an `initContainer` before the application container starts. This prevents schema mismatch errors during rolling updates.
2. **Zero-Downtime Rolling Updates**:
   Both frontend and backend are configured with `strategy: RollingUpdate` (`maxSurge: 1`, `maxUnavailable: 0`).
3. **Health & Liveness Probes**:
   - Backend exposes `/health` with uptime and status verification.
   - Frontend exposes Nginx root HTTP probe.
   - Redis checks `redis-cli ping`.
   - Hardhat tests TCP socket port `8545`.
4. **Unified Ingress Controller**:
   `ingress.yaml` routes traffic to `/api` and `/` under a single domain name.

---

## 🛑 Tear Down

To delete all Tripchain resources from the cluster:

```bash
kubectl delete -k kubernetes/
```
