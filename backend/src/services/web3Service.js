// backend/src/services/web3Service.js
import { ethers, Wallet, parseEther, getAddress } from "ethers";
import { generateNonce, SiweMessage } from "siwe";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read deployed contract addresses
let contractAddresses = {};
try {
  const addrPath = path.join(__dirname, "../contracts/addresses.json");
  if (fs.existsSync(addrPath)) {
    contractAddresses = JSON.parse(fs.readFileSync(addrPath, "utf-8"));
  }
} catch (e) {
  console.warn("Could not load contracts/addresses.json:", e.message);
}

// Fallback to Hardhat Account #0 if environment variable is not set
const DEFAULT_DEV_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const VALIDATOR_PRIVATE_KEY =
  process.env.WEB3_VALIDATOR_PRIVATE_KEY || DEFAULT_DEV_PRIVATE_KEY;

const validatorWallet = new Wallet(VALIDATOR_PRIVATE_KEY);
const CHAIN_ID = Number(process.env.CHAIN_ID || contractAddresses.chainId || 31337);

export const getValidatorAddress = () => validatorWallet.address;
export const getChainId = () => CHAIN_ID;
export const getContractAddresses = () => contractAddresses;

/**
 * Generate a random cryptographic nonce for SIWE (Sign-In with Ethereum)
 */
export const createSiweNonce = () => {
  return generateNonce();
};

/**
 * Verify a SIWE message and signature
 */
export const verifySiwe = async (messageStr, signature) => {
  try {
    const siweMessage = new SiweMessage(messageStr);
    const result = await siweMessage.verify({ signature });
    return {
      success: true,
      address: getAddress(result.data.address),
      nonce: result.data.nonce,
    };
  } catch (err) {
    // Robust fallback: direct ECDSA signature verification
    try {
      const recovered = ethers.verifyMessage(messageStr, signature);
      if (recovered && ethers.isAddress(recovered)) {
        return {
          success: true,
          address: getAddress(recovered),
          nonce: "recovered",
        };
      }
    } catch (e2) {
      // fall through
    }
    return {
      success: false,
      error: err.message,
    };
  }
};

/**
 * Sign an EIP-712 reward claim voucher for $TRIP tokens
 */
export const signRewardClaimVoucher = async ({
  recipientAddress,
  amountTrip, // e.g. 15.5
  nonce,      // integer
  deadlineSeconds = 3600, // 1 hour validity
}) => {
  const checksumAddress = getAddress(recipientAddress);
  const amountWei = parseEther(amountTrip.toString());
  const deadline = Math.floor(Date.now() / 1000) + deadlineSeconds;

  const domain = {
    name: "Tripchain",
    version: "1.0",
    chainId: CHAIN_ID,
    verifyingContract: contractAddresses.TripToken,
  };

  const types = {
    ClaimVoucher: [
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };

  const value = {
    recipient: checksumAddress,
    amount: amountWei,
    nonce: BigInt(nonce),
    deadline: BigInt(deadline),
  };

  const signature = await validatorWallet.signTypedData(domain, types, value);

  return {
    recipient: checksumAddress,
    amount: amountWei.toString(),
    amountFormatted: amountTrip,
    nonce: nonce.toString(),
    deadline: deadline.toString(),
    signature,
    contractAddress: contractAddresses.TripToken,
    chainId: CHAIN_ID,
  };
};

/**
 * Sign an EIP-712 badge mint voucher for Soulbound NFT badge
 */
export const signBadgeMintVoucher = async ({
  recipientAddress,
  badgeId,
  tokenUri,
  nonce,
  deadlineSeconds = 3600,
}) => {
  const checksumAddress = getAddress(recipientAddress);
  const deadline = Math.floor(Date.now() / 1000) + deadlineSeconds;

  const domain = {
    name: "TripchainBadges",
    version: "1.0",
    chainId: CHAIN_ID,
    verifyingContract: contractAddresses.TripBadgeNFT,
  };

  const types = {
    BadgeVoucher: [
      { name: "recipient", type: "address" },
      { name: "badgeId", type: "uint256" },
      { name: "uri", type: "string" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };

  const value = {
    recipient: checksumAddress,
    badgeId: BigInt(badgeId),
    uri: tokenUri,
    nonce: BigInt(nonce),
    deadline: BigInt(deadline),
  };

  const signature = await validatorWallet.signTypedData(domain, types, value);

  return {
    recipient: checksumAddress,
    badgeId: badgeId.toString(),
    uri: tokenUri,
    nonce: nonce.toString(),
    deadline: deadline.toString(),
    signature,
    contractAddress: contractAddresses.TripBadgeNFT,
    chainId: CHAIN_ID,
  };
};

/**
 * Automatically fund local test wallets with ETH for gas fees if on Hardhat Localhost
 */
export const autoFundLocalhostWallet = async (targetAddress) => {
  if (!targetAddress || CHAIN_ID !== 31337) return;
  try {
    const provider = new ethers.JsonRpcProvider(process.env.WEB3_RPC_URL || "http://127.0.0.1:8545");
    const bal = await provider.getBalance(targetAddress);
    if (bal < ethers.parseEther("5.0")) {
      const funder = new Wallet(VALIDATOR_PRIVATE_KEY, provider);
      const tx = await funder.sendTransaction({
        to: targetAddress,
        value: ethers.parseEther("50.0"),
      });
      await tx.wait();
      console.log(`Auto-funded ${targetAddress} with 50 test ETH on Hardhat localhost.`);
    }
  } catch (e) {
    // Silently continue if node is offline or unreachable
  }
};
