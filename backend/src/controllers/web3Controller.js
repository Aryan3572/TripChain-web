// backend/src/controllers/web3Controller.js
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { getJwtSecret } from "./authController.js";
import {
  createSiweNonce,
  verifySiwe,
  signRewardClaimVoucher,
  signBadgeMintVoucher,
  getContractAddresses,
  getChainId,
  autoFundLocalhostWallet,
} from "../services/web3Service.js";

// In-memory nonce store for challenge-response auth
const nonceStore = new Map();

/**
 * Clean up expired nonces (TTL: 10 minutes)
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of nonceStore.entries()) {
    if (now - item.timestamp > 10 * 60 * 1000) {
      nonceStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * 1. Generate Nonce for SIWE
 */
export const getNonce = async (req, res) => {
  try {
    const nonce = createSiweNonce();
    const address = req.query.address ? req.query.address.toLowerCase() : null;

    if (address) {
      nonceStore.set(address, { nonce, timestamp: Date.now() });
      autoFundLocalhostWallet(address).catch(() => {});
    }

    res.json({ nonce });
  } catch (err) {
    console.error("getNonce error:", err);
    res.status(500).json({ message: "Failed to generate nonce" });
  }
};

/**
 * 2. Verify Wallet Login (SIWE)
 */
export const verifyWalletLogin = async (req, res) => {
  try {
    const { message, signature } = req.body;
    if (!message || !signature) {
      return res.status(400).json({ message: "Message and signature are required" });
    }

    const verification = await verifySiwe(message, signature);
    if (!verification.success) {
      return res.status(401).json({ message: verification.error || "Invalid signature" });
    }

    const walletAddress = verification.address.toLowerCase();

    // Find existing user with this wallet address
    let user = await prisma.user.findFirst({
      where: { walletAddress },
    });

    // If not found, check if a user was created with matching auto-generated email
    const placeholderEmail = `${walletAddress}@tripchain.eth`;
    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: placeholderEmail },
      });
    }

    // If still not found, create new Web3 user
    if (!user) {
      const shortAddr = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
      user = await prisma.user.create({
        data: {
          name: `Web3 Pilot ${shortAddr}`,
          email: placeholderEmail,
          walletAddress,
        },
      });
    } else if (!user.walletAddress) {
      // Backfill wallet address if needed
      user = await prisma.user.update({
        where: { id: user.id },
        data: { walletAddress },
      });
    }

    const token = jwt.sign({ userId: user.id }, getJwtSecret(), {
      expiresIn: "7d",
    });

    const { password: _, ...safeUser } = user;
    res.json({
      message: "Wallet authenticated successfully",
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error("verifyWalletLogin error:", err);
    res.status(500).json({ message: err.message || "Wallet authentication failed" });
  }
};

/**
 * Safely link wallet address to user, resolving any unique constraint conflicts
 * (e.g. if the wallet was previously attached to a temporary placeholder account created by SIWE)
 */
export const safelyLinkWalletToUser = async (userId, walletAddress) => {
  if (!walletAddress) return null;
  const normalized = walletAddress.toLowerCase();

  // Find if any other user currently holds this wallet address
  const otherUser = await prisma.user.findFirst({
    where: {
      walletAddress: normalized,
      NOT: { id: userId },
    },
    include: { trips: true, rewardClaims: true, badges: true },
  });

  if (otherUser) {
    // If the other user is an auto-generated placeholder account (from SIWE wallet login)
    if (otherUser.email?.endsWith("@tripchain.eth")) {
      // Migrate any trips, badges, or claims to the real user
      if (otherUser.trips?.length > 0) {
        await prisma.trip.updateMany({
          where: { userId: otherUser.id },
          data: { userId },
        });
      }
      if (otherUser.rewardClaims?.length > 0) {
        await prisma.rewardClaim.updateMany({
          where: { userId: otherUser.id },
          data: { userId },
        });
      }
      if (otherUser.badges?.length > 0) {
        await prisma.userBadge.updateMany({
          where: { userId: otherUser.id },
          data: { userId },
        });
      }
      // Detach wallet or delete the placeholder account
      try {
        await prisma.user.delete({ where: { id: otherUser.id } });
      } catch (delErr) {
        await prisma.user.update({
          where: { id: otherUser.id },
          data: { walletAddress: null },
        });
      }
    } else {
      // Detach from the other user so the active user can claim it
      await prisma.user.update({
        where: { id: otherUser.id },
        data: { walletAddress: null },
      });
    }
  }

  // Now safely link to the current user
  return await prisma.user.update({
    where: { id: userId },
    data: { walletAddress: normalized },
    include: { trips: true, rewardClaims: true },
  });
};

/**
 * 3. Link Wallet to Existing Account
 */
export const linkWallet = async (req, res) => {
  try {
    const { message, signature } = req.body;
    const userId = req.userId || req.user?.id;

    if (!message || !signature) {
      return res.status(400).json({ message: "Message and signature are required" });
    }

    const verification = await verifySiwe(message, signature);
    if (!verification.success) {
      return res.status(401).json({ message: "Invalid signature verification" });
    }

    const walletAddress = verification.address.toLowerCase();

    const updatedUser = await safelyLinkWalletToUser(userId, walletAddress);

    const { password: _, ...safeUser } = updatedUser;
    res.json({
      message: "Wallet linked successfully",
      user: safeUser,
    });
  } catch (err) {
    console.error("linkWallet error:", err);
    res.status(500).json({ message: err.message || "Failed to link wallet" });
  }
};

/**
 * 4. Get Pending Rewards ($TRIP)
 */
export const getPendingRewards = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    let user = await prisma.user.findUnique({
      where: { id: userId },
      include: { trips: true, rewardClaims: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Auto-link wallet address safely if sent from client
    const clientWallet = req.query.walletAddress?.toLowerCase();
    if (clientWallet && user.walletAddress !== clientWallet) {
      try {
        const linked = await safelyLinkWalletToUser(userId, clientWallet);
        if (linked) user = linked;
      } catch (linkErr) {
        console.warn("Could not auto-link wallet in getPendingRewards:", linkErr.message);
      }
    }

    // Calculate total CO2 saved across all trips
    const totalCo2Saved = user.trips.reduce((acc, t) => acc + (t.co2Saved || 0), 0);
    
    // Reward Rate: 10 $TRIP per 1.0 kg CO2 saved
    const totalEarnedTrip = Math.round(totalCo2Saved * 10 * 100) / 100;

    // Calculate already claimed tokens
    const claimedTokens = user.rewardClaims
      .filter((c) => c.status === "CLAIMED")
      .reduce((acc, c) => acc + c.amount, 0);

    const pendingClaimableTrip = Math.max(
      0,
      Math.round((totalEarnedTrip - claimedTokens) * 100) / 100
    );

    res.json({
      totalCo2SavedKg: Math.round(totalCo2Saved * 100) / 100,
      totalEarnedTrip,
      claimedTokens,
      pendingClaimableTrip,
      walletAddress: user.walletAddress,
      contracts: getContractAddresses(),
      chainId: getChainId(),
    });
  } catch (err) {
    console.error("getPendingRewards error:", err);
    res.status(500).json({ message: err.message || "Failed to fetch reward status" });
  }
};

/**
 * 5. Request Reward Claim Voucher (EIP-712 Signature)
 */
export const requestClaimVoucher = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    let user = await prisma.user.findUnique({
      where: { id: userId },
      include: { trips: true, rewardClaims: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Determine recipient wallet address
    const recipient = (req.body.walletAddress || user.walletAddress)?.toLowerCase();
    if (!recipient) {
      return res.status(400).json({ message: "Please connect your Web3 wallet first" });
    }

    // Auto-link wallet address safely if needed
    if (user.walletAddress !== recipient) {
      try {
        const linked = await safelyLinkWalletToUser(userId, recipient);
        if (linked) user = linked;
      } catch (linkErr) {
        console.warn("Could not auto-link wallet in requestClaimVoucher:", linkErr.message);
      }
    }

    autoFundLocalhostWallet(recipient).catch(() => {});

    // Calculate claimable amount
    const totalCo2Saved = user.trips.reduce((acc, t) => acc + (t.co2Saved || 0), 0);
    const totalEarnedTrip = Math.round(totalCo2Saved * 10 * 100) / 100;
    const claimedTokens = user.rewardClaims
      .filter((c) => c.status === "CLAIMED")
      .reduce((acc, c) => acc + c.amount, 0);

    const claimableAmount = Math.max(
      0,
      Math.round((totalEarnedTrip - claimedTokens) * 100) / 100
    );

    if (claimableAmount <= 0) {
      return res.status(400).json({ message: "No unclaimed $TRIP rewards available" });
    }

    // Unique nonce for contract
    const nonce = Date.now();

    // Create pending claim in database
    const claimRecord = await prisma.rewardClaim.create({
      data: {
        userId,
        amount: claimableAmount,
        nonce: nonce.toString(),
        status: "PENDING",
      },
    });

    // Sign voucher with backend oracle key
    const voucher = await signRewardClaimVoucher({
      recipientAddress: user.walletAddress,
      amountTrip: claimableAmount,
      nonce: nonce,
      deadlineSeconds: 3600, // 1 hour
    });

    res.json({
      claimId: claimRecord.id,
      voucher,
    });
  } catch (err) {
    console.error("requestClaimVoucher error:", err);
    res.status(500).json({ message: err.message || "Failed to generate claim voucher" });
  }
};

/**
 * 6. Record On-Chain Claim Success
 */
export const recordClaimSuccess = async (req, res) => {
  try {
    const { claimId, txHash } = req.body;
    if (!claimId || !txHash) {
      return res.status(400).json({ message: "claimId and txHash are required" });
    }

    const updated = await prisma.rewardClaim.update({
      where: { id: Number(claimId) },
      data: {
        txHash,
        status: "CLAIMED",
      },
    });

    res.json({ message: "Reward claim confirmed on-chain", claim: updated });
  } catch (err) {
    console.error("recordClaimSuccess error:", err);
    res.status(500).json({ message: "Failed to record claim success" });
  }
};

/**
 * 7. Request NFT Badge Mint Voucher
 */
export const requestBadgeMintVoucher = async (req, res) => {
  try {
    const { badgeId } = req.body;
    const userId = req.userId || req.user?.id;

    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const clientWallet = (req.body.walletAddress || user.walletAddress)?.toLowerCase();
    if (!clientWallet) {
      return res.status(400).json({ message: "Please connect your Web3 wallet first" });
    }

    if (clientWallet && user.walletAddress !== clientWallet) {
      try {
        const linked = await safelyLinkWalletToUser(userId, clientWallet);
        if (linked) user = linked;
      } catch (linkErr) {
        console.warn("Could not auto-link wallet in requestBadgeMintVoucher:", linkErr.message);
      }
    }

    autoFundLocalhostWallet(clientWallet).catch(() => {});

    // Verify user owns this badge
    const badge = await prisma.userBadge.findFirst({
      where: {
        id: Number(badgeId),
        userId,
      },
    });

    if (!badge) {
      return res.status(404).json({ message: "Badge not found or not unlocked by you" });
    }

    if (badge.isMinted) {
      return res.status(400).json({ message: "This badge has already been minted as an NFT" });
    }

    // Construct Self-Contained On-Chain Metadata (Base64 JSON URI)
    const metadata = {
      name: `Tripchain: ${badge.name}`,
      description: badge.description,
      image: badge.icon || "🏆",
      attributes: [
        { trait_type: "Badge Name", value: badge.name },
        { trait_type: "Unlocked Date", value: badge.achievedAt.toISOString() },
        { trait_type: "Soulbound", value: "True" },
        { trait_type: "Platform", value: "Tripchain Eco-Mobility" },
      ],
    };

    const tokenUri = `data:application/json;base64,${Buffer.from(
      JSON.stringify(metadata)
    ).toString("base64")}`;

    const nonce = badge.id; // Unique per badge

    const voucher = await signBadgeMintVoucher({
      recipientAddress: user.walletAddress,
      badgeId: badge.id,
      tokenUri,
      nonce,
      deadlineSeconds: 3600,
    });

    res.json({ voucher, badgeId: badge.id });
  } catch (err) {
    console.error("requestBadgeMintVoucher error:", err);
    res.status(500).json({ message: err.message || "Failed to generate badge mint voucher" });
  }
};

/**
 * 8. Record Badge Mint Success
 */
export const recordBadgeMintSuccess = async (req, res) => {
  try {
    const { badgeId, tokenId, txHash } = req.body;
    const userId = req.userId || req.user?.id;

    const updated = await prisma.userBadge.updateMany({
      where: { id: Number(badgeId), userId },
      data: {
        isMinted: true,
        tokenId: Number(tokenId) || 1,
        txHash,
      },
    });

    res.json({ message: "Badge NFT recorded successfully", updated });
  } catch (err) {
    console.error("recordBadgeMintSuccess error:", err);
    res.status(500).json({ message: "Failed to update badge status" });
  }
};

/**
 * 9. Record Carbon Offset Transaction
 */
export const recordCarbonOffset = async (req, res) => {
  try {
    const { tokensBurned, co2OffsetKg, certificateId, txHash } = req.body;
    const userId = req.userId || req.user?.id;

    if (!tokensBurned || !co2OffsetKg || !certificateId || !txHash) {
      return res.status(400).json({ message: "Missing required offset details" });
    }

    const offset = await prisma.carbonOffset.create({
      data: {
        userId,
        tokensBurned: parseFloat(tokensBurned),
        co2OffsetKg: parseFloat(co2OffsetKg),
        certificateId: certificateId.toString(),
        txHash,
      },
    });

    res.status(201).json({
      message: "Carbon offset recorded successfully",
      offset,
    });
  } catch (err) {
    console.error("recordCarbonOffset error:", err);
    res.status(500).json({ message: "Failed to record carbon offset" });
  }
};

/**
 * 10. Get User's On-Chain Offsets
 */
export const getUserOffsets = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    const offsets = await prisma.carbonOffset.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const totalCo2OffsetKg = offsets.reduce((acc, o) => acc + o.co2OffsetKg, 0);
    const totalTokensBurned = offsets.reduce((acc, o) => acc + o.tokensBurned, 0);

    res.json({
      offsets,
      totalCo2OffsetKg,
      totalTokensBurned,
    });
  } catch (err) {
    console.error("getUserOffsets error:", err);
    res.status(500).json({ message: "Failed to fetch carbon offsets" });
  }
};

/**
 * 11. Demo Sandbox Login (1-click test session)
 */
export const demoLogin = async (req, res) => {
  try {
    const demoWallet = "0x71c8f39a2b343940129f0b070d3094892c90demo";
    const demoEmail = "demo.pilot@tripchain.eth";

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { walletAddress: demoWallet },
          { email: demoEmail },
        ],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: "Demo Sandbox Pilot",
          email: demoEmail,
          walletAddress: demoWallet,
        },
      });
    } else if (!user.walletAddress) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { walletAddress: demoWallet },
      });
    }

    const token = jwt.sign({ userId: user.id }, getJwtSecret(), {
      expiresIn: "7d",
    });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
      },
    });
  } catch (err) {
    console.error("demoLogin error:", err);
    return res.status(500).json({ message: "Failed to initialize demo login" });
  }
};

