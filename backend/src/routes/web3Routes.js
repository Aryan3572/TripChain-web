// backend/src/routes/web3Routes.js
import express from "express";
import {
  getNonce,
  verifyWalletLogin,
  linkWallet,
  getPendingRewards,
  requestClaimVoucher,
  recordClaimSuccess,
  requestBadgeMintVoucher,
  recordBadgeMintSuccess,
  recordCarbonOffset,
  getUserOffsets,
  demoLogin,
} from "../controllers/web3Controller.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Public Web3 Auth Routes
router.get("/nonce", getNonce);
router.post("/verify-wallet", authRateLimiter, verifyWalletLogin);
router.post("/demo-login", authRateLimiter, demoLogin);

// Authenticated Web3 Routes
router.post("/link-wallet", authenticate, linkWallet);

// $TRIP Rewards
router.get("/rewards/pending", authenticate, getPendingRewards);
router.post("/rewards/claim-voucher", authenticate, requestClaimVoucher);
router.post("/rewards/claim-success", authenticate, recordClaimSuccess);

// NFT Badges
router.post("/badges/claim-voucher", authenticate, requestBadgeMintVoucher);
router.post("/badges/claim-success", authenticate, recordBadgeMintSuccess);

// Carbon Offsets
router.post("/offsets/record", authenticate, recordCarbonOffset);
router.get("/offsets", authenticate, getUserOffsets);

export default router;
