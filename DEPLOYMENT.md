# 🚀 Tripchain Complete Deployment Guide: Web3, Render (Backend) & Vercel (Frontend)

This guide walks you through deploying the complete **Tripchain** stack into production:
1. **Web3 Smart Contracts** deployed to an **EVM Blockchain** (Polygon Amoy, Base Sepolia, or Ethereum Sepolia).
2. **Backend API & Prisma ORM** deployed to **Render** (Node.js Web Service + PostgreSQL).
3. **Frontend Application** deployed to **Vercel** (Global Edge CDN, automatic HTTPS, sub-second loads).

---

## ❓ "Do I Need to Deploy Web3 Differently?"

**Yes, absolutely.** Here is why and how it works:

- **Render & Vercel do NOT run blockchains or smart contracts.**
  - **Vercel** hosts static assets and frontend bundles (HTML, CSS, React JavaScript).
  - **Render** runs your Node.js/Express server and stores data in PostgreSQL.
  - **Smart Contracts** (`TripToken.sol`, `TripBadgeNFT.sol`, `CarbonOffsetRegistry.sol`) must be deployed directly to a **live blockchain network** (e.g., Polygon Amoy, Base Sepolia, Ethereum Sepolia, or Mainnet).

### 🔄 The Required Deployment Order

```
┌─────────────────────────────────┐
│ 1. Deploy Smart Contracts       │  --> Deploys to Blockchain (Amoy / Sepolia)
│    (Hardhat Deploy Script)      │  --> Automatically updates addresses.json & contracts.json
└────────────────┬────────────────┘      in both frontend/ and backend/
                 │
                 ▼
┌─────────────────────────────────┐
│ 2. Commit & Push to GitHub      │  --> Both frontend and backend now have on-chain addresses
└────────────────┬────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
┌───────────────┐ ┌───────────────┐
│ 3. Render     │ │ 4. Vercel     │
│ (Backend API  │ │ (React App    │
│  + Postgres)  │ │  connected to │
│               │ │  Render + Web3│
└───────┬───────┘ └───────┬───────┘
        │                 │
        └────────►◄───────┘
          5. Link URLs & CORS
```

---

## 🌐 Part 1: Deploy Web3 Smart Contracts to Blockchain

The repository includes Hardhat scripts to deploy all three contracts and **automatically write their addresses and ABIs** to both `frontend/src/contracts/` and `backend/src/contracts/`.

### Step 1.1: Choose Your Target Network
Recommended networks pre-configured in [hardhat.config.js](file:///c:/Users/HP/OneDrive/Desktop/Tripchain--main/Tripchain--main/contracts/hardhat.config.js):
- **Polygon Amoy Testnet** (Chain ID: `80002`) — Fast, ultra-cheap gas, recommended.
- **Base Sepolia Testnet** (Chain ID: `84532`) — Layer 2, fast confirmation times.
- **Ethereum Sepolia Testnet** (Chain ID: `11155111`) — Standard Ethereum testnet.

### Step 1.2: Get Free Testnet Faucet Tokens
You will need testnet tokens to pay for contract deployment gas:
- **Polygon Amoy:** [Polygon Faucet](https://faucet.polygon.technology/)
- **Base Sepolia:** [Base Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
- **Ethereum Sepolia:** [Google Cloud Sepolia Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) or [Sepolia PoW Faucet](https://sepolia-faucet.pk910.de/)

### Step 1.3: Configure Contracts Environment
1. In the `contracts` directory, create a `.env` file (see `contracts/.env.example`):
   ```env
   # Private key of your deployer wallet (ensure it has testnet faucet tokens)
   DEPLOYER_PRIVATE_KEY=your_wallet_private_key_here

   # Optional custom RPC (defaults are already in hardhat.config.js):
   # POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
   ```
   > ⚠️ **Security Warning**: Never commit your private key to GitHub! Keep `.env` gitignored.

### Step 1.4: Run the Deployment Script
From your local terminal, navigate to the `contracts` folder and deploy:

```bash
cd contracts
npm install

# For Polygon Amoy (Recommended):
npx hardhat run scripts/deploy.js --network amoy

# OR for Base Sepolia:
# npx hardhat run scripts/deploy.js --network baseSepolia

# OR for Ethereum Sepolia:
# npx hardhat run scripts/deploy.js --network sepolia
```

When this completes, you will see output like:
```text
✅ TripToken deployed to: 0x...
✅ TripBadgeNFT deployed to: 0x...
✅ CarbonOffsetRegistry deployed to: 0x...
📦 Contract addresses and ABIs exported to frontend and backend!
```

This updates:
- `frontend/src/contracts/addresses.json` & `contracts.json`
- `backend/src/contracts/addresses.json` & `contracts.json`

### Step 1.5: Commit and Push Contract Addresses to GitHub
```bash
git add frontend/src/contracts backend/src/contracts
git commit -m "chore(web3): deploy contracts to testnet and update addresses"
git push origin main
```

---

## 🗄️ Part 2: Set Up Database (PostgreSQL)

You need a managed PostgreSQL database for the backend.
- **Option A (Render PostgreSQL)**: In Render dashboard, click **New +** → **PostgreSQL** (Free tier available).
- **Option B (Neon.tech)**: Serverless Postgres with instant branching at [neon.tech](https://neon.tech/) (Free tier).
- **Option C (Supabase)**: Managed Postgres at [supabase.com](https://supabase.com/) (Free tier).

Copy your database connection URL (e.g. `postgresql://user:password@host/dbname?sslmode=require`).

---

## 🖥️ Part 3: Deploy Backend to Render

### Step 3.1: Create Web Service on Render
1. Go to [dashboard.render.com](https://dashboard.render.com/) and sign in.
2. Click **New +** → **Web Service**.
3. Select **Build and deploy from a Git repository** and pick your `Tripchain` repo.

### Step 3.2: Configure Web Service Settings
| Field | Value | Notes |
| :--- | :--- | :--- |
| **Name** | `tripchain-backend` | Or any unique service name |
| **Region** | Oregon (US West) or Frankfurt | Pick region closest to your database |
| **Branch** | `main` | |
| **Root Directory** | `backend` | **Crucial**: specify `backend` directory |
| **Runtime** | `Node` | |
| **Build Command** | `npm install && npx prisma generate` | Installs deps and builds Prisma client |
| **Start Command** | `npm start` | Runs `node src/index.js` |
| **Instance Type** | Free | |

### Step 3.3: Set Backend Environment Variables
In the **Environment Variables** section on Render, add:

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Production mode |
| `PORT` | `5000` | Port for Express (Render also injects `PORT`) |
| `DATABASE_URL` | `postgresql://user:pass@host/db?sslmode=require` | Your PostgreSQL connection string |
| `DIRECT_URL` | *(Same as DATABASE_URL, or direct pooler URL)* | Required if using Supabase/Neon connection poolers |
| `JWT_SECRET` | *Click "Generate"* or random 64-char string | Used to sign user JWTs |
| `CHAIN_ID` | `80002` *(Amoy)* or `84532` *(Base)* or `11155111` *(Sepolia)* | The blockchain network ID where you deployed |
| `WEB3_RPC_URL` | `https://rpc-amoy.polygon.technology` | Public RPC or Alchemy/Infura endpoint |
| `WEB3_VALIDATOR_PRIVATE_KEY` | *(Deployer / Validator private key)* | Used by backend to sign EIP-712 reward & badge vouchers |
| `FRONTEND_URL` | `https://placeholder.vercel.app` | Will update in Part 5 after Vercel deployment |

*(Optional Variables)*:
- `REDIS_URL`: If using an external Redis (e.g., Upstash). If left blank, backend uses built-in in-memory caching automatically.
- `GOOGLE_CLIENT_ID`: Your Google OAuth web client ID if using Google Sign-In.

### Step 3.4: Run Database Migrations & Seed Badges
After the service finishes its first build:
1. Open the **Shell** tab in the Render dashboard.
2. Run:
   ```bash
   npx prisma migrate deploy
   node prisma/seedBadges.js
   ```
3. Test your backend health check by visiting in your browser:
   `https://tripchain-backend.onrender.com/health`
   You should see:
   ```json
   { "status": "ok", "uptime": 12.3 }
   ```

---

## ⚡ Part 4: Deploy Frontend to Vercel

### Step 4.1: Import Project in Vercel
1. Go to [vercel.com](https://vercel.com/) and sign in with GitHub.
2. Click **Add New...** → **Project**.
3. Select your `Tripchain` repository and click **Import**.

### Step 4.2: Configure Vercel Project Settings
In the Project Configuration panel:
1. **Framework Preset**: Select **Create React App**.
2. **Root Directory**: Click **Edit** and set to `frontend`.
3. **Build Command**: `npm run build` (Default)
4. **Output Directory**: `build` (Default)
5. **Install Command**: `npm install` (Default)

### Step 4.3: Add Environment Variables in Vercel
Expand **Environment Variables** and add:

| Key | Value | Description |
| :--- | :--- | :--- |
| `REACT_APP_API_BASE` | `https://tripchain-backend.onrender.com` | Your live Render backend URL from Part 3 |
| `REACT_APP_CHAIN_ID` | `80002` *(Amoy)* or `11155111` *(Sepolia)* | Must match the chain where contracts are deployed |
| `REACT_APP_MAPBOX_TOKEN` | *(Optional, your Mapbox token)* | For interactive route maps |
| `REACT_APP_GOOGLE_CLIENT_ID` | *(Optional, Google OAuth Client ID)* | If Google Sign-In is enabled |

### Step 4.4: Click Deploy
Click **Deploy**! Vercel builds the bundle and generates your live URL (e.g. `https://tripchain-web.vercel.app`).

---

## 🔗 Part 5: Connect Both Services (Final Step)

1. Copy your live Vercel URL (e.g., `https://tripchain-web.vercel.app`).
2. Go back to **Render Dashboard** → Your Web Service → **Environment**.
3. Update the `FRONTEND_URL` variable to your Vercel URL:
   ```env
   FRONTEND_URL=https://tripchain-web.vercel.app
   ```
4. Click **Save Changes** (Render will automatically redeploy).

---

## 🧪 Part 6: Verification & Testing

1. **Visit Frontend**: Open `https://tripchain-web.vercel.app`.
2. **Connect Wallet**: Click "Connect Wallet". Ensure your browser wallet (MetaMask, Rainbow, Rabby) is switched to your deployment network (e.g., Polygon Amoy).
3. **Check Contract Sync**: Your `$TRIP` balance should load from the deployed contract.
4. **Log a Trip**: Record a trip and verify rewards calculate and vouchers sign without errors.
5. **Claim Rewards / Mint Badges**: Confirm the on-chain transaction prompts your wallet for approval.

---

## 💡 Troubleshooting & FAQ

- **Render Free Tier Spin-Down**: On Render's free tier, the backend sleeps after 15 minutes of inactivity. The first API request may take ~30-50 seconds to wake up.
- **Wrong Network Error in MetaMask**: If your wallet is on Ethereum Mainnet but contracts are on Polygon Amoy (`80002`), the UI will safely prompt you to switch chains.
- **Contract Address Not Found**: Ensure you deployed the smart contracts (`Part 1`) and committed the generated `addresses.json` files before deploying Render and Vercel.
- **SPA 404s on Refresh**: `frontend/vercel.json` already contains rewrite rules (`/(.*) -> /index.html`) so refreshing any page (like `/planner` or `/rewards`) works seamlessly.
