const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Tripchain Web3 Smart Contracts Suite", function () {
  let owner, validator, user1, user2;
  let tripToken, badgeNFT, offsetRegistry;

  beforeEach(async function () {
    [owner, validator, user1, user2] = await ethers.getSigners();

    // Deploy TripToken
    const TripToken = await ethers.getContractFactory("TripToken");
    tripToken = await TripToken.deploy(owner.address, validator.address);
    await tripToken.waitForDeployment();

    // Deploy TripBadgeNFT
    const TripBadgeNFT = await ethers.getContractFactory("TripBadgeNFT");
    badgeNFT = await TripBadgeNFT.deploy(owner.address, validator.address);
    await badgeNFT.waitForDeployment();

    // Deploy CarbonOffsetRegistry
    const CarbonOffsetRegistry = await ethers.getContractFactory("CarbonOffsetRegistry");
    offsetRegistry = await CarbonOffsetRegistry.deploy(await tripToken.getAddress(), owner.address);
    await offsetRegistry.waitForDeployment();
  });

  describe("1. TripToken ($TRIP) & EIP-712 Rewards", function () {
    it("Should deploy with correct name, symbol, and initial reserve", async function () {
      expect(await tripToken.name()).to.equal("Tripchain Token");
      expect(await tripToken.symbol()).to.equal("TRIP");
      const ownerBal = await tripToken.balanceOf(owner.address);
      expect(ownerBal).to.equal(ethers.parseEther("1000000"));
    });

    it("Should mint tokens when presented with a valid validator EIP-712 signature", async function () {
      const amount = ethers.parseEther("50"); // 50 $TRIP
      const nonce = 1;
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

      const domain = {
        name: "Tripchain",
        version: "1.0",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await tripToken.getAddress(),
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
        recipient: user1.address,
        amount: amount,
        nonce: nonce,
        deadline: deadline,
      };

      // Validator signs typed voucher
      const signature = await validator.signTypedData(domain, types, value);

      // User1 claims reward
      await expect(
        tripToken.connect(user1).claimRewardWithSignature(amount, nonce, deadline, signature)
      )
        .to.emit(tripToken, "RewardClaimed")
        .withArgs(user1.address, amount, nonce);

      expect(await tripToken.balanceOf(user1.address)).to.equal(amount);
    });

    it("Should reject duplicate claims using the same nonce (replay attack prevention)", async function () {
      const amount = ethers.parseEther("25");
      const nonce = 42;
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      const domain = {
        name: "Tripchain",
        version: "1.0",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await tripToken.getAddress(),
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
        recipient: user1.address,
        amount: amount,
        nonce: nonce,
        deadline: deadline,
      };

      const signature = await validator.signTypedData(domain, types, value);

      await tripToken.connect(user1).claimRewardWithSignature(amount, nonce, deadline, signature);

      // Replay attempt must revert
      await expect(
        tripToken.connect(user1).claimRewardWithSignature(amount, nonce, deadline, signature)
      ).to.be.revertedWith("TripToken: Voucher already claimed");
    });

    it("Should reject forged signature signed by an unauthorized key", async function () {
      const amount = ethers.parseEther("1000");
      const nonce = 99;
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      const domain = {
        name: "Tripchain",
        version: "1.0",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await tripToken.getAddress(),
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
        recipient: user1.address,
        amount: amount,
        nonce: nonce,
        deadline: deadline,
      };

      // Attacker (user2) signs instead of validator
      const fakeSignature = await user2.signTypedData(domain, types, value);

      await expect(
        tripToken.connect(user1).claimRewardWithSignature(amount, nonce, deadline, fakeSignature)
      ).to.be.revertedWith("TripToken: Invalid validator signature");
    });
  });

  describe("2. Soulbound TripBadgeNFT ($TBADGE)", function () {
    it("Should mint an achievement badge with valid validator signature", async function () {
      const badgeId = 101; // e.g. "Eco Pathfinder"
      const uri = "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
      const nonce = 501;
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      const domain = {
        name: "TripchainBadges",
        version: "1.0",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await badgeNFT.getAddress(),
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
        recipient: user1.address,
        badgeId: badgeId,
        uri: uri,
        nonce: nonce,
        deadline: deadline,
      };

      const signature = await validator.signTypedData(domain, types, value);

      await expect(
        badgeNFT.connect(user1).mintBadgeWithSignature(badgeId, uri, nonce, deadline, signature)
      )
        .to.emit(badgeNFT, "BadgeMinted")
        .withArgs(user1.address, 1, badgeId, uri);

      expect(await badgeNFT.ownerOf(1)).to.equal(user1.address);
      expect(await badgeNFT.tokenURI(1)).to.equal(uri);
    });

    it("Should enforce Soulbound rule: transfers between accounts MUST fail", async function () {
      const badgeId = 102;
      const uri = "ipfs://sample-badge-metadata";
      const nonce = 502;
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      const domain = {
        name: "TripchainBadges",
        version: "1.0",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await badgeNFT.getAddress(),
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
        recipient: user1.address,
        badgeId: badgeId,
        uri: uri,
        nonce: nonce,
        deadline: deadline,
      };

      const signature = await validator.signTypedData(domain, types, value);
      await badgeNFT.connect(user1).mintBadgeWithSignature(badgeId, uri, nonce, deadline, signature);

      // Attempt transfer from user1 to user2
      await expect(
        badgeNFT.connect(user1).transferFrom(user1.address, user2.address, 1)
      ).to.be.revertedWith("TripBadgeNFT: Badges are Soulbound and non-transferable");
    });
  });

  describe("3. CarbonOffsetRegistry", function () {
    it("Should retire $TRIP tokens and issue a verifiable on-chain certificate", async function () {
      // Transfer 100 $TRIP to user1
      const initialAmount = ethers.parseEther("100");
      await tripToken.transfer(user1.address, initialAmount);

      const offsetAmount = ethers.parseEther("40"); // 40 $TRIP
      const co2Grams = 4000; // 4 kg of CO2 in grams

      // User approves registry
      await tripToken.connect(user1).approve(await offsetRegistry.getAddress(), offsetAmount);

      // User retires tokens
      await expect(
        offsetRegistry
          .connect(user1)
          .retireAndOffset(offsetAmount, co2Grams, "Clean Transit Incentives", "Offsetting commute")
      )
        .to.emit(offsetRegistry, "CertificateIssued");

      // Check balances
      expect(await tripToken.balanceOf(user1.address)).to.equal(ethers.parseEther("60"));
      expect(await offsetRegistry.totalCo2RetiredGrams()).to.equal(4000);
      expect(await offsetRegistry.totalTokensBurned()).to.equal(offsetAmount);

      const userCerts = await offsetRegistry.getUserCertificates(user1.address);
      expect(userCerts.length).to.equal(1);
      expect(userCerts[0]).to.equal(1);

      const cert = await offsetRegistry.certificates(1);
      expect(cert.offsetter).to.equal(user1.address);
      expect(cert.co2OffsetGrams).to.equal(4000);
      expect(cert.memo).to.equal("Offsetting commute");
    });
  });
});
