# 🌿 TripChain Web

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-indigo.svg)](https://www.prisma.io/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636.svg)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-EVM-yellow.svg)](https://hardhat.org/)
[![Vercel](https://img.shields.io/badge/Vercel-Frontend-black.svg)](https://vercel.com/)
[![Render](https://img.shields.io/badge/Render-Backend-blueviolet.svg)](https://render.com/)

**TripChain** is a user-centric, decentralized travel tracker and eco-rewards platform. It empowers travelers to log daily trips, visualize eco-friendly transit routes, calculate CO₂ emissions savings, and earn **$TRIP ERC-20 utility tokens** and **ERC-721 NFT badges** verified on-chain.

Designed with a high-performance neo-brutalist & glassmorphic UI, Tripchain features full Web3 wallet authentication (SIWE), an instant zero-gas Demo Sandbox mode, and sub-second page loads powered by route-level code splitting.

---

## 📑 Table of Contents
- [✨ Key Features](#-key-features)
- [🛠️ Technology Stack](#️-technology-stack)
- [⛓️ Web3 & Smart Contracts](#️-web3--smart-contracts)
- [⚡ Performance Optimizations](#-performance-optimizations)
- [🚀 Quick Start (Local Development)](#-quick-start-local-development)
  - [1. Prerequisites](#1-prerequisites)
  - [2. Clone & Install](#2-clone--install)
  - [3. Configure Environment Variables](#3-configure-environment-variables)
  - [4. Start Hardhat Node & Deploy Contracts](#4-start-hardhat-node--deploy-contracts)
  - [5. Run Backend & Frontend](#5-run-backend--frontend)
- [🐳 Running with Docker Compose](#-running-with-docker-compose)
- [🌐 Production Deployment (Vercel & Render)](#-production-deployment-vercel--render)
- [📁 Repository Structure](#-repository-structure)
- [📚 Documentation Index](#-documentation-index)

---

## ✨ Key Features

- **🗺️ Interactive Route Planner**: High-performance Mapbox GL routing showing multi-modal travel routes (transit, walking, cycling, driving) with dynamic CO₂ emissions calculations.
- **📍 Live GPS Trip Tracker**: Real-time journey recording with speed, breadcrumbs, battery monitoring, and automatic points computation.
- **🪙 $TRIP Token Rewards**: Earn ERC-20 utility tokens for choosing green transport. Tokens can be claimed on-chain or burned to offset carbon footprints.
- **🏅 On-Chain NFT Badges**: Unlock verifiable ERC-721 achievement badges (e.g. *Eco Pioneer*, *Transit Master*) mintable to your Web3 wallet via gas-efficient EIP-712 vouchers.
- **🦊 Web3 & SIWE Authentication**: Sign In with Ethereum (EIP-4361) using MetaMask, with automatic wallet address linking and account conflict resolution.
- **✨ 1-Click Demo Sandbox Mode**: Try all decentralized features, rewards claiming, and badge minting immediately with 150 $TRIP pre-loaded—no browser extension or testnet gas required!
- **📊 Eco-Insights Dashboard**: Weekly carbon trends, streak tracking, personalized commuting patterns, and predictive analytics.

---

## 🛠️ Technology Stack

### Frontend
- **React.js 19**: Component-based Single Page Application.
- **Route-Level Code Splitting**: `React.lazy()` and `<Suspense>` architecture reducing initial bundle size by **67.5%**.
- **Framer Motion**: Fluid micro-animations with hardware-accelerated GPU transforms (`willChange: "transform"`).
- **Mapbox GL JS**: Vector map tiles with sub-millisecond route rendering.
- **Ethers.js v6**: Complete Web3 provider, contract abstraction, and EIP-712 signature verification.

### Backend & Database
- **Node.js & Express.js**: High-throughput REST API with asynchronous I/O and strict Helmet security headers.
- **Prisma ORM & PostgreSQL (NeonDB / Supabase)**: Type-safe database queries with serverless connection pooling.
- **Redis (ioredis)**: Sub-millisecond caching for dashboard KPIs, leaderboard stats, and automatic cache invalidation on trip creation.
- **SIWE & JWT Authentication**: Cryptographic Ethereum challenge-response authentication.

### Smart Contracts & Blockchain
- **Solidity 0.8.20** & **OpenZeppelin Contracts**:
  - `TripToken.sol`: ERC-20 token with EIP-712 gasless voucher claiming.
  - `TripBadgeNFT.sol`: ERC-721 collectible achievement NFT with token URI metadata.
  - `CarbonOffsetRegistry.sol`: Verifiable carbon certificate burning registry.
- **Hardhat**: Local EVM development node (`http://127.0.0.1:8545`, Chain ID `31337`) and automated test suites.

---

## ⛓️ Web3 & Smart Contracts

| Contract | Standard | Description | Localhost Address (31337) |
| :--- | :--- | :--- | :--- |
| **TripToken** | ERC-20 | Eco-reward utility token | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| **TripBadgeNFT** | ERC-721 | Achievement badge NFTs | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` |
| **CarbonOffsetRegistry** | Custom | Carbon burning & verification | `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0` |

### Web3 Security & Network Protection
- **Chain ID Validation**: The frontend automatically verifies the connected network and blocks accidental transactions to Ethereum Mainnet (protecting user funds).
- **EIP-712 Off-Chain Vouchers**: Users do not need pre-funded contract allowances; the Tripchain Oracle signs cryptographically secure vouchers verified on-chain.
- **Auto-Faucet**: When running locally, the backend automatically seeds connected MetaMask test wallets with 50-100 local test ETH for gas.

---

## ⚡ Performance Optimizations

1. **Bundle Weight Slashed by 67.5%**: Initial JavaScript bundle dropped from **716 kB down to 232 kB gzipped** via dynamic imports. Mapbox GL (~450 kB) is loaded strictly on demand when visiting the Route Planner.
2. **GPU Hardware Acceleration**: Background animations in `FloatingElements.jsx` utilize `willChange: "transform"` and device-aware density (3 elements on mobile, 6 on desktop), reducing CPU load by >75%.
3. **Aggressive Static Caching**: `vercel.json` configures 1-year immutable caching (`public, max-age=31536000, immutable`) for production assets.
4. **Dynamic CORS Support**: Backend automatically allows all `*.vercel.app` preview deployments and custom frontend domains.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later)
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
FRONTEND_URL=http://localhost:3000

# Web3 Localhost Configuration
CHAIN_ID=31337
WEB3_RPC_URL=http://127.0.0.1:8545
WEB3_VALIDATOR_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**Frontend (`frontend/.env`):**
```env
REACT_APP_API_BASE=http://localhost:5000
REACT_APP_CHAIN_ID=31337
REACT_APP_MAPBOX_TOKEN=your_mapbox_token_here
```

### 4. Start Hardhat Node & Deploy Contracts
In a dedicated terminal:
```bash
cd contracts
npx hardhat node
```
In another terminal, deploy the contracts:
```bash
cd contracts
npx hardhat run scripts/deploy.js --network localhost
```

### 5. Run Backend & Frontend
```bash
# Terminal 1: Backend API
cd backend
npm run dev

# Terminal 2: React Frontend
cd frontend
npm start
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 🐳 Running with Docker Compose

Run the entire ecosystem (Hardhat EVM node, PostgreSQL Redis cache, Express backend, and React frontend) with a single command:

```bash
docker-compose up --build
```

**Service Endpoints:**
- **Frontend**: `http://localhost:8080` (or `http://localhost:3000`)
- **Backend API**: `http://localhost:5000` (Health check at `/health`)
- **Hardhat EVM Node**: `http://localhost:8545`
- **Redis Cache**: `localhost:6379`

To stop all containers:
```bash
docker-compose down
```

---

## 🌐 Production Deployment (Vercel & Render)

For complete step-by-step instructions, see the dedicated [**DEPLOYMENT.md**](DEPLOYMENT.md) guide.

### Summary:
1. **Backend (Render)**:
   - Connect Git repository on [Render](https://dashboard.render.com/).
   - Root Directory: `backend`
   - Build Command: `npm install && npx prisma generate`
   - Start Command: `npm start`
   - Set environment variables (`DATABASE_URL`, `JWT_SECRET`, `CHAIN_ID`, `FRONTEND_URL`).
2. **Frontend (Vercel)**:
   - Connect Git repository on [Vercel](https://vercel.com/).
   - Root Directory: `frontend`
   - Framework Preset: `Create React App`
   - Set environment variable: `REACT_APP_API_BASE=https://<your-render-url>.onrender.com`.
   - `frontend/vercel.json` automatically handles SPA routing and asset caching.

---

## 📁 Repository Structure

```text
Tripchain--main/
├── backend/                  # Express REST API & Prisma ORM
│   ├── prisma/               # Schema definitions and seed scripts
│   ├── src/
│   │   ├── controllers/      # Web3, Auth, Trips, Analytics controllers
│   │   ├── middleware/       # Rate limiting, SIWE verification, auth
│   │   ├── routes/           # REST endpoint definitions
│   │   └── services/         # Ethers.js oracle vouchers, auto-faucet
│   └── Dockerfile
├── frontend/                 # React 19 Client SPA
│   ├── public/               # Static icons, manifest, and assets
│   ├── src/
│   │   ├── assets/           # Bundled 3D mascot and optimized media
│   │   ├── components/       # Reusable UI, Web3 modals, banners
│   │   ├── context/          # Web3Context (Ethers, SIWE, Demo state)
│   │   ├── pages/            # Code-split views (Planner, Rewards, Track)
│   │   └── styles/           # Neo-brutalist theme & animation tokens
│   ├── vercel.json           # Vercel SPA routing and cache rules
│   └── Dockerfile
├── contracts/                # Hardhat Solidity Smart Contracts
│   ├── contracts/            # TripToken, TripBadgeNFT, CarbonOffsetRegistry
│   ├── scripts/              # Automated deployment scripts
│   ├── test/                 # Hardhat EVM unit & integration tests
│   └── Dockerfile            # Alpine Hardhat node container
├── kubernetes/               # Production Kubernetes manifests (K8s)
├── docs/                     # Architecture, Redis, Cloudflare, Web3 guides
├── DEPLOYMENT.md             # End-to-end Vercel & Render guide
├── DOCKET.md                 # Complete changelog & engineering docket
├── docker-compose.yml        # Multi-container orchestration
└── render.yaml               # Render Infrastructure Blueprint
```

---

## 📚 Documentation Index

- 📖 [**Deployment Guide (Vercel & Render)**](DEPLOYMENT.md): Detailed walkthrough for cloud hosting.
- 🦊 [**Web3 & Smart Contracts Guide**](docs/WEB3_GUIDE.md): Blockchain architecture, tokenomics, vouchers, and faucet setup.
- ⚡ [**Redis Caching Setup**](docs/REDIS_SETUP.md): Distributed caching configuration with Upstash or local Redis.
- 🌐 [**Cloudflare Setup Guide**](docs/CLOUDFLARE_SETUP.md): Edge worker proxy and DDoS mitigation.
- 📜 [**Engineering Docket**](DOCKET.md): Complete chronological record of features, fixes, and architecture choices.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
