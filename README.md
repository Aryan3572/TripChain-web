# 🌿 TripChain Web

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-indigo.svg)](https://www.prisma.io/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636.svg)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-EVM-yellow.svg)](https://hardhat.org/)
[![Sepolia](https://img.shields.io/badge/Ethereum-Sepolia-627EEA.svg)](https://sepolia.etherscan.io/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED.svg)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Ready-326CE5.svg)](https://kubernetes.io/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D.svg)](https://redis.io/)
[![Vercel](https://img.shields.io/badge/Vercel-Frontend-black.svg)](https://vercel.com/)
[![Render](https://img.shields.io/badge/Render-Backend-blueviolet.svg)](https://render.com/)

**TripChain** is a user-centric, decentralized travel tracker and eco-rewards platform. It empowers travelers to log journeys, visualize eco-friendly transit routes, calculate CO₂ emissions savings, and earn **$TRIP ERC-20 utility tokens** and **ERC-721 NFT badges** verified on-chain.

Designed with a high-performance neo-brutalist & glassmorphic UI, Tripchain features full Web3 wallet authentication (SIWE), an instant zero-gas Demo Sandbox mode, live GPS journey recording, distributed Redis caching, and enterprise-grade Docker and Kubernetes cloud orchestration.

---

## 📑 Table of Contents
- [✨ Key Features](#-key-features)
- [🛠️ Technology Stack](#️-technology-stack)
- [⛓️ Web3 & Smart Contracts](#️-web3--smart-contracts)
- [⚡ Performance Optimizations & Security](#-performance-optimizations--security)
- [🚀 Quick Start (Local Development)](#-quick-start-local-development)
  - [1. Prerequisites](#1-prerequisites)
  - [2. Clone & Install](#2-clone--install)
  - [3. Configure Environment Variables](#3-configure-environment-variables)
  - [4. Start Hardhat Node & Deploy Contracts](#4-start-hardhat-node--deploy-contracts)
  - [5. Run Backend & Frontend](#5-run-backend--frontend)
- [🐳 Running with Docker Compose](#-running-with-docker-compose)
- [☸️ Kubernetes (K8s) Cluster Deployment](#️-kubernetes-k8s-cluster-deployment)
- [🌐 Production Deployment (Vercel & Render)](#-production-deployment-vercel--render)
- [📡 REST API Endpoints](#-rest-api-endpoints)
- [📁 Repository Structure](#-repository-structure)
- [📚 Documentation Index](#-documentation-index)
- [📄 License](#-license)

---

## ✨ Key Features

- **🗺️ Interactive Route Planner**: High-performance Mapbox GL routing displaying multi-modal options (transit, cycling, walking, driving) with dynamic CO₂ emissions calculations and elevation profiles.
- **📍 Live GPS Trip Tracker**: Real-time journey recording with live speed calculation, GPS breadcrumbs, device battery monitoring, and automatic points computation (`/track`).
- **🪙 $TRIP Token Rewards**: Earn ERC-20 utility tokens for choosing sustainable transport. Claim on-chain or burn them to offset carbon emissions and earn verified certificates.
- **🏅 On-Chain NFT Badges**: Unlock verifiable ERC-721 achievement badges (e.g. *Eco Pioneer*, *Transit Master*) mintable to your Web3 wallet via gas-efficient EIP-712 vouchers.
- **🦊 Web3 & SIWE Authentication**: Sign In with Ethereum (EIP-4361) using MetaMask with automated account conflict merging for users holding both Google and Web3 accounts.
- **✨ 1-Click Demo Sandbox Mode**: Test decentralized features, reward claims, and badge minting immediately with 150 $TRIP pre-loaded—no browser extension or testnet gas required!
- **📊 Eco-Insights Dashboard**: Weekly carbon trends, streak tracking, personalized commuting patterns, and predictive analytics.
- **⚡ Distributed Redis Caching**: Sub-millisecond KPI retrieval with cache invalidation on trip creation and badge unlocking.
- **🔒 Enterprise Security**: Strict Helmet HTTP headers, CORS allowlist protection, rate limiting, and bounded request payload sizes.

---

## 🛠️ Technology Stack

### Frontend
- **React.js 19**: Component-based Single Page Application.
- **Route-Level Code Splitting**: `React.lazy()` and `<Suspense>` architecture reducing initial bundle size by **67.5%**.
- **Framer Motion**: Hardware-accelerated GPU animations (`willChange: "transform"`).
- **Mapbox GL JS**: Vector map tiles with sub-millisecond route rendering.
- **Ethers.js v6**: Complete Web3 provider, contract abstraction, and EIP-712 signature verification.

### Backend & Database
- **Node.js & Express.js**: High-throughput REST API with asynchronous I/O and strict Helmet security headers.
- **Prisma ORM & PostgreSQL (NeonDB / Supabase)**: Type-safe database queries with connection pooling.
- **Redis (ioredis)**: In-memory distributed caching for dashboard KPIs, leaderboard stats, and automatic cache invalidation.
- **SIWE & JWT Authentication**: Cryptographic Ethereum challenge-response authentication.

### Smart Contracts & Blockchain
- **Solidity 0.8.24** & **OpenZeppelin Contracts**:
  - `TripToken.sol`: ERC-20 token with EIP-712 gasless voucher claiming and carbon burn mechanisms.
  - `TripBadgeNFT.sol`: Soulbound ERC-721 collectible achievement NFT with token URI metadata.
  - `CarbonOffsetRegistry.sol`: Immutable carbon burning registry and certificate issuer.
- **Hardhat**: EVM development node (`http://127.0.0.1:8545`, Chain ID `31337`) and automated deployment pipeline.
- **Multi-Network Support**: Localhost (Chain ID `31337`), Ethereum Sepolia (Chain ID `11155111`), Polygon Amoy (Chain ID `80002`).

### DevOps & Cloud Infrastructure
- **Docker & Docker Compose**: Multi-container orchestration (Frontend, Backend, Redis, Hardhat).
- **Kubernetes (K8s)**: Production manifests with rolling updates, liveness/readiness probes, secrets, and Nginx Ingress.
- **Cloudflare Workers**: Edge proxy and DDoS mitigation (`cloudflare-worker/`).
- **Render & Vercel**: Automated zero-downtime CI/CD deployment pipelines.

---

## ⛓️ Web3 & Smart Contracts

### 🌐 Live Testnet Deployments (Ethereum Sepolia - Chain ID `11155111`)

| Contract | Standard | Deployed Address | Explorer Link |
| :--- | :--- | :--- | :--- |
| **TripToken** | ERC-20 | `0x34a378e3B89706B3a2708378dAb19242eBA6565F` | [View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0x34a378e3B89706B3a2708378dAb19242eBA6565F) |
| **TripBadgeNFT** | ERC-721 | `0x18a9aB7661A346a53a535cf1C0426b76BAA44843` | [View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0x18a9aB7661A346a53a535cf1C0426b76BAA44843) |
| **CarbonOffsetRegistry** | Custom | `0xCA51bE72Cf4F87b4F4DA7D76df7f2404ddb2132F` | [View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0xCA51bE72Cf4F87b4F4DA7D76df7f2404ddb2132F) |
| **Validator Signer** | Oracle | `0x5b26a8355A6aFc9D947697f684514A1857b3934e` | Authorized Voucher Signer |

### 💻 Localhost Hardhat Deployments (Chain ID `31337`)

| Contract | Standard | Localhost Address (31337) |
| :--- | :--- | :--- |
| **TripToken** | ERC-20 | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| **TripBadgeNFT** | ERC-721 | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` |
| **CarbonOffsetRegistry** | Custom | `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0` |

### Web3 Security & Network Protection
- **Chain ID Validation**: Prevents accidental transactions to Ethereum Mainnet, protecting user funds from unconfigured contracts.
- **EIP-712 Off-Chain Vouchers**: Users do not require pre-funded contract allowances; the Tripchain Oracle signs cryptographically secure vouchers verified directly on-chain.
- **Auto-Faucet**: When running locally, the backend automatically seeds connected MetaMask wallets with test ETH for gas.

---

## ⚡ Performance Optimizations & Security

1. **Bundle Weight Slashed by 67.5%**: Initial bundle dropped from **716 kB to 232 kB gzipped** via dynamic imports. Heavy modules (Mapbox GL) load on demand.
2. **GPU Hardware Acceleration**: Background animations utilize `willChange: "transform"` with responsive element counts (3 on mobile, 6 on desktop), reducing CPU load by >75%.
3. **Aggressive Static Caching**: `vercel.json` and Nginx configure 1-year immutable caching (`public, max-age=31536000, immutable`) for hashed assets.
4. **Dynamic CORS Support**: Backend allows local development, preview deployments (`*.vercel.app`), and custom frontend domains configured via `FRONTEND_URL`.
5. **Rate Limiting & Memory Guard**: Endpoints are rate-limited via `express-rate-limit`, and JSON payloads are strictly bounded to `50kb` to prevent memory exhaustion attacks.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or v20+)
- [Git](https://git-scm.com/)
- [Docker Desktop](https://www.docker.com/) (Optional, for containerized run)
- [MetaMask Extension](https://metamask.io/) (Optional, Demo Sandbox works without it)

### 2. Clone & Install
```bash
git clone https://github.com/Aryan3572/TripChain-web.git
cd TripChain-web

# Install backend dependencies
cd backend && npm install && npx prisma generate && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install contracts dependencies
cd contracts && npm install && cd ..
```

### 3. Configure Environment Variables

**Backend (`backend/.env`):**
```env
PORT=5000
DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"
DIRECT_URL="postgresql://user:password@host/neondb?sslmode=require"
JWT_SECRET=your_super_secret_jwt_key_here
FRONTEND_URL=http://localhost:3000,http://localhost:8080

# Web3 Configuration (Localhost 31337 or Sepolia 11155111)
CHAIN_ID=31337
WEB3_RPC_URL=http://127.0.0.1:8545
WEB3_VALIDATOR_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Distributed Cache (Optional, defaults to in-memory)
REDIS_URL=redis://127.0.0.1:6379
```

**Frontend (`frontend/.env`):**
```env
REACT_APP_API_BASE=http://localhost:5000
REACT_APP_CHAIN_ID=31337
REACT_APP_MAPBOX_TOKEN=your_mapbox_token_here
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

### 4. Database Setup & Migrations
Run schema migrations and seed badges into your database:
```bash
cd backend
npm run deploy:migrate
cd ..
```

### 5. Start Hardhat Node & Deploy Contracts
In a dedicated terminal:
```bash
cd contracts
npm run node
```

In another terminal, deploy the smart contracts:
```bash
# Deploy to local Hardhat node:
cd contracts
npm run deploy:local

# OR deploy to Ethereum Sepolia Testnet:
# npm run deploy:sepolia
```

### 6. Run Backend & Frontend
```bash
# Terminal 1: Express REST API
cd backend
npm run dev

# Terminal 2: React Frontend SPA
cd frontend
npm start
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 🐳 Running with Docker Compose

Run the entire ecosystem (Hardhat EVM node, Redis cache, Express API, and Nginx React frontend) with a single command:

```bash
docker-compose up --build
```

### Service Architecture & Ports:

| Container | Image / Build | Port | Health Check | Description |
| :--- | :--- | :--- | :--- | :--- |
| **`tripchain-frontend`** | `frontend/Dockerfile` | `8080:80` | `wget http://localhost/` | Nginx reverse proxy serving production React SPA |
| **`tripchain-backend`** | `backend/Dockerfile` | `5000:5000` | `GET /health` | Node.js Express API with Prisma ORM |
| **`tripchain-redis`** | `redis:7-alpine` | `6379:6379` | `redis-cli ping` | Distributed in-memory caching engine |
| **`tripchain-hardhat`** | `contracts/Dockerfile`| `8545:8545` | JSON-RPC `net_version` | EVM node with automatic contract deployment on boot |

### Helpful Docker Commands:
```bash
# Run containers in detached background mode
docker-compose up -d

# View real-time logs across all services
docker-compose logs -f

# Run Prisma migrations & seed badges inside the running backend container
docker-compose exec backend npm run deploy:migrate

# Stop and remove containers and networks
docker-compose down

# Stop and wipe persistent Redis volume
docker-compose down -v
```

---

## ☸️ Kubernetes (K8s) Cluster Deployment

The [`kubernetes/`](kubernetes/) directory provides production-ready manifests supporting Kustomize, horizontal scaling, automated database migrations, and Ingress routing.

### 1. Cluster Manifests

- [`kubernetes/secret.yaml`](kubernetes/secret.yaml): Sensitive credentials (`DATABASE_URL`, `JWT_SECRET`, Web3 keys).
- [`kubernetes/backend-deployment.yaml`](kubernetes/backend-deployment.yaml): 2 replicas with `initContainers` automated Prisma migration.
- [`kubernetes/backend-service.yaml`](kubernetes/backend-service.yaml): LoadBalancer service exposing port 5000.
- [`kubernetes/frontend-deployment.yaml`](kubernetes/frontend-deployment.yaml): 2 replicas with rolling updates and readiness probes.
- [`kubernetes/frontend-service.yaml`](kubernetes/frontend-service.yaml): LoadBalancer service exposing port 80.
- [`kubernetes/redis-deployment.yaml`](kubernetes/redis-deployment.yaml) & [`redis-service.yaml`](kubernetes/redis-service.yaml): In-cluster Redis cache.
- [`kubernetes/hardhat-deployment.yaml`](kubernetes/hardhat-deployment.yaml) & [`hardhat-service.yaml`](kubernetes/hardhat-service.yaml): In-cluster EVM node.
- [`kubernetes/ingress.yaml`](kubernetes/ingress.yaml): NGINX Ingress controller routing `/api` and `/`.
- [`kubernetes/kustomization.yaml`](kubernetes/kustomization.yaml): Kustomize package manager bundle.

### 2. Deploy to Cluster
```bash
# 1. Update secrets in kubernetes/secret.yaml
# 2. Deploy all manifests using Kustomize:
kubectl apply -k kubernetes/
```

### 3. Check Cluster Health
```bash
kubectl get pods,svc
```

### 4. Local Port-Forwarding (Minikube / Kind / Docker Desktop)
```bash
# Forward Frontend
kubectl port-forward svc/tripchain-frontend-service 8080:80

# Forward Backend API
kubectl port-forward svc/tripchain-backend-service 5000:5000
```
Detailed cluster operations and scaling guidelines are available in [`kubernetes/README.md`](kubernetes/README.md).

---

## 🌐 Production Deployment (Vercel & Render)

For complete cloud deployment instructions, see [**DEPLOYMENT.md**](DEPLOYMENT.md).

### Summary:
1. **Backend (Render)**:
   - Root Directory: `backend`
   - Build Command: `npm install && npx prisma generate`
   - Start Command: `npm run render:start` *(Runs `prisma migrate deploy`, seeds badges, then boots server)*
   - Environment Variables: `DATABASE_URL`, `JWT_SECRET`, `CHAIN_ID`, `WEB3_VALIDATOR_PRIVATE_KEY`, `FRONTEND_URL`.
2. **Frontend (Vercel)**:
   - Root Directory: `frontend`
   - Framework Preset: `Create React App`
   - Environment Variables: `REACT_APP_API_BASE=https://<your-render-url>.onrender.com`, `REACT_APP_CHAIN_ID=11155111`.
   - `frontend/vercel.json` automatically manages client SPA routing and CDN caching.

---

## 📡 REST API Endpoints

### 🩺 Health & System
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | API status greeting |
| `GET` | `/health` | Liveness & readiness probe (uptime, status) |

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user with email & password |
| `POST` | `/api/auth/login` | Authenticate existing user & receive JWT |
| `POST` | `/api/auth/google` | Google OAuth token verification and account login |
| `GET` | `/api/auth/me` | Fetch active profile and linked wallet data |

### 🦊 Web3 & Decentralized Rewards (`/api/web3`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/web3/nonce` | Generate cryptographic challenge nonce for SIWE |
| `POST` | `/api/web3/verify-wallet` | Verify EIP-4361 signature and issue JWT |
| `POST` | `/api/web3/demo-login` | Instant zero-gas Demo Sandbox session with 150 $TRIP |
| `GET` | `/api/web3/rewards/pending` | Fetch accrued off-chain points eligible for token claim |
| `POST` | `/api/web3/rewards/claim-voucher` | Issue signed EIP-712 voucher for claiming $TRIP on-chain |
| `POST` | `/api/web3/badges/claim-voucher` | Issue signed EIP-712 voucher for minting NFT badge on-chain |
| `POST` | `/api/web3/offsets/record` | Record on-chain carbon burning receipt and certificate |

### 🚗 Trips & Journey Tracking (`/api/trips`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/trips` | Log completed trip, compute CO2 savings & points |
| `GET` | `/api/trips` | Retrieve user's logged trip history |
| `POST` | `/api/trips/live/start` | Initialize live GPS trip session |
| `POST` | `/api/trips/live/update` | Push real-time telemetry (speed, coords, battery) |
| `POST` | `/api/trips/live/stop` | Conclude live trip and finalize rewards |
| `GET` | `/api/trips/live/active` | Query ongoing active journey status |

### 📊 Analytics & Insights
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/dashboard/summary` | Consolidated KPIs (cached in Redis) |
| `GET` | `/api/trip-insights` | Commute analytics and carbon trends |
| `GET` | `/api/eco-score` | Gamified eco-rating breakdown |
| `GET` | `/api/achievements` | Milestone badges and minting readiness |
| `GET` | `/api/goals` | User sustainability targets and progress |
| `GET` | `/api/predictions` | Future CO2 projections based on habits |

---

## 📁 Repository Structure

```text
Tripchain--main/
├── backend/                      # Express REST API & Prisma ORM
│   ├── prisma/                   # Schema definitions, migrations, seedBadges.js
│   ├── src/
│   │   ├── config/               # Prisma and Redis connection clients
│   │   ├── controllers/          # Web3, Auth, Trips, Live Tracker controllers
│   │   ├── middleware/           # Rate limiter, Helmet, JWT & SIWE auth
│   │   ├── routes/               # API route definitions
│   │   └── services/             # Ethers oracle vouchers, auto-faucet, email
│   ├── Dockerfile                # Production backend container
│   └── .dockerignore
├── frontend/                     # React 19 Client SPA
│   ├── public/                   # Static icons, manifest, and assets
│   ├── src/
│   │   ├── api/                  # Axios/fetch API communication
│   │   ├── assets/               # Bundled 3D mascot and icons
│   │   ├── components/           # Navbar, ActiveTripBanner, GoogleAuth, Web3Modals
│   │   ├── context/              # Web3Context (Ethers, SIWE, Demo state)
│   │   ├── contracts/            # Exported ABIs and addresses.json
│   │   ├── pages/                # Lazy-loaded views (RoutePlanner, LiveTracker, Rewards)
│   │   └── styles/               # Neo-brutalist CSS tokens and animations
│   ├── nginx.conf                # High-performance Nginx reverse proxy configuration
│   ├── vercel.json               # Vercel SPA routing and cache rules
│   ├── Dockerfile                # Multi-stage production Nginx container
│   └── .dockerignore
├── contracts/                    # Hardhat Solidity Smart Contracts
│   ├── contracts/                # TripToken.sol, TripBadgeNFT.sol, CarbonOffsetRegistry.sol
│   ├── scripts/                  # Automated deployment pipeline (deploy.js)
│   ├── test/                     # Hardhat EVM unit & integration tests
│   ├── entrypoint.sh             # Container startup with auto-deployment
│   ├── Dockerfile                # Alpine Hardhat node container
│   └── hardhat.config.js         # EVM network configurations (31337, Sepolia, Amoy)
├── kubernetes/                   # Cloud-Native Kubernetes Manifests (K8s)
│   ├── secret.yaml               # Environment secrets and credentials
│   ├── backend-deployment.yaml   # Backend pods with Prisma migrate initContainer
│   ├── backend-service.yaml      # Backend LoadBalancer service
│   ├── frontend-deployment.yaml  # Nginx frontend pods
│   ├── frontend-service.yaml     # Frontend LoadBalancer service
│   ├── redis-deployment.yaml     # In-cluster Redis deployment
│   ├── redis-service.yaml        # Redis ClusterIP service
│   ├── hardhat-deployment.yaml   # In-cluster Hardhat node deployment
│   ├── hardhat-service.yaml      # Hardhat ClusterIP service
│   ├── ingress.yaml              # NGINX Ingress controller configuration
│   ├── kustomization.yaml        # Kustomize manifest bundle
│   └── README.md                 # Detailed Kubernetes operations guide
├── cloudflare-worker/            # Edge proxy worker for DDoS mitigation
├── docs/                         # Specialized Guides (Web3, Redis, Cloudflare)
├── DEPLOYMENT.md                 # Comprehensive Vercel & Render guide
├── DOCKET.md                     # Engineering changelog & docket
└── docker-compose.yml            # Multi-service local orchestration
```

---

## 📚 Documentation Index

- 📖 [**Deployment Guide (Vercel & Render)**](DEPLOYMENT.md): Detailed walkthrough for cloud hosting.
- ☸️ [**Kubernetes Architecture & Operations Guide**](kubernetes/README.md): Cluster setup, scaling, and manifests.
- 🦊 [**Web3 & Smart Contracts Guide**](docs/WEB3_GUIDE.md): Blockchain architecture, tokenomics, vouchers, and faucet setup.
- ⚡ [**Redis Caching Setup**](docs/REDIS_SETUP.md): Distributed caching configuration with Upstash or local Redis.
- 🌐 [**Cloudflare Setup Guide**](docs/CLOUDFLARE_SETUP.md): Edge worker proxy and DDoS mitigation.
- 📜 [**Engineering Docket**](DOCKET.md): Complete chronological record of features, fixes, and architecture choices.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
