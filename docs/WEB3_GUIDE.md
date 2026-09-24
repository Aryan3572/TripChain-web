# 🌐 Tripchain Web3 & Decentralized Mobility Architecture

Tripchain seamlessly bridges sustainable transit tracking with Web3 tokenized incentives, decentralized achievements (Soulbound NFTs), and on-chain carbon offsetting.

---

## 🏛️ Smart Contract System (`contracts/`)

The smart contract suite is built on **Solidity 0.8.24** using **OpenZeppelin 5.x** with the **Cancun EVM** hardfork.

### 1. `TripToken.sol` ($TRIP)
* **Standard**: ERC-20 with EIP-712 cryptographic voucher minting and burnable extension.
* **Mechanism**: When users save CO₂ through eco-friendly transit (walking, cycling, public transit), the backend verifies the data and generates an authorized cryptographic EIP-712 voucher. The user submits this voucher directly to the contract to mint `$TRIP` tokens to their wallet.
* **Replay Protection**: Per-recipient nonces prevent voucher re-use.
* **Ecosystem Rate**: 10 `$TRIP` per 1.0 kg of CO₂ saved.

### 2. `TripBadgeNFT.sol` ($TBADGE)
* **Standard**: Soulbound ERC-721 (non-transferable).
* **Mechanism**: When a user unlocks a travel milestone in Tripchain (e.g. *Eco Pathfinder*, *Carbon Crusader*, *Streak Master*), they can mint it on-chain as a verifiable Soulbound NFT badge.
* **Soulbound Enforcement**: Overrides `_update` to forbid transfers between addresses, ensuring achievement badges cannot be bought, sold, or transferred.

### 3. `CarbonOffsetRegistry.sol`
* **Mechanism**: Users can retire `$TRIP` tokens to permanently offset carbon emissions.
* **Action**: Transfers and burns `$TRIP`, issues a permanent on-chain **CO₂ Offset Certificate**, and emits the `CertificateIssued` event with certificate ID, kilograms retired, and project category.

---

## 🧪 Testing & Deploying Smart Contracts

### Run Automated Unit Tests:
```bash
cd contracts
npm test
```
*Tests cover 100% of core flows: initial reserves, EIP-712 signature verification, replay protection rejection, unauthorized signature rejection, Soulbound transfer restriction, and offset retirement.*

### Deploy Contracts:
```bash
# Deploy to local Hardhat node:
npm run deploy:local

# Deploy to Polygon Amoy Testnet:
npm run deploy:amoy

# Deploy to Base Sepolia Testnet:
npm run deploy:base
```
*The deploy script (`contracts/scripts/deploy.js`) automatically exports contract addresses and JSON ABIs to both `frontend/src/contracts/` and `backend/src/contracts/`.*

---

## 🔐 Cryptographic Architecture & Flow

```
[User logs eco-friendly trip]
          │
          ▼
[Tripchain Backend]
  - Calculates CO2 saved & points
  - Validates user hasn't claimed yet
  - Signs typed EIP-712 voucher using Oracle Private Key
          │
          ▼
[React 19 Frontend]
  - Receives voucher from backend
  - Calls `claimRewardWithSignature` via MetaMask
          │
          ▼
[TripToken Smart Contract]
  - Recovers signer from EIP-712 digest
  - Confirms signer == validatorSigner
  - Mints $TRIP tokens directly to user wallet!
```

---

## 🚀 Running Locally

1. **Start Backend**:
   ```bash
   cd backend
   npm run dev
   ```
2. **Start Frontend**:
   ```bash
   cd frontend
   npm start
   ```
3. **Connect Wallet**:
   - Open [http://localhost:3000](http://localhost:3000).
   - Click **"Sign In with Ethereum / Wallet"** on Login or **"Connect Wallet"** in the navigation bar.
   - Navigate to **$TRIP Rewards** to view token balance, claim rewards, or burn tokens for an on-chain carbon offset certificate.
   - Navigate to **Achievements** to mint unlocked badges as Soulbound NFTs.
