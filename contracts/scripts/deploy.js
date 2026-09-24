const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();

  console.log("==========================================");
  console.log("🚀 Deploying Tripchain Web3 Contracts");
  console.log(`Network: ${hre.network.name} (Chain ID: ${network.chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log("==========================================");

  // Default validator signer to deployer unless overridden by environment
  const validatorAddress = process.env.VALIDATOR_ADDRESS || deployer.address;
  console.log(`Validator Signer: ${validatorAddress}`);

  // 1. Deploy TripToken ($TRIP)
  const TripToken = await hre.ethers.getContractFactory("TripToken");
  const tripToken = await TripToken.deploy(deployer.address, validatorAddress);
  await tripToken.waitForDeployment();
  const tripTokenAddress = await tripToken.getAddress();
  console.log(`✅ TripToken deployed to: ${tripTokenAddress}`);

  // 2. Deploy TripBadgeNFT ($TBADGE)
  const TripBadgeNFT = await hre.ethers.getContractFactory("TripBadgeNFT");
  const badgeNFT = await TripBadgeNFT.deploy(deployer.address, validatorAddress);
  await badgeNFT.waitForDeployment();
  const badgeNFTAddress = await badgeNFT.getAddress();
  console.log(`✅ TripBadgeNFT deployed to: ${badgeNFTAddress}`);

  // 3. Deploy CarbonOffsetRegistry
  const CarbonOffsetRegistry = await hre.ethers.getContractFactory("CarbonOffsetRegistry");
  const offsetRegistry = await CarbonOffsetRegistry.deploy(tripTokenAddress, deployer.address);
  await offsetRegistry.waitForDeployment();
  const offsetRegistryAddress = await offsetRegistry.getAddress();
  console.log(`✅ CarbonOffsetRegistry deployed to: ${offsetRegistryAddress}`);

  // Export artifacts and addresses to frontend and backend
  const addresses = {
    chainId: Number(network.chainId),
    networkName: hre.network.name,
    TripToken: tripTokenAddress,
    TripBadgeNFT: badgeNFTAddress,
    CarbonOffsetRegistry: offsetRegistryAddress,
    validatorSigner: validatorAddress,
    deployedAt: new Date().toISOString(),
  };

  const contractsData = {
    addresses,
    TripTokenAbi: TripToken.interface.formatJson(),
    TripBadgeNFTAbi: TripBadgeNFT.interface.formatJson(),
    CarbonOffsetRegistryAbi: CarbonOffsetRegistry.interface.formatJson(),
  };

  // Directories to sync
  const frontendContractsDir = path.join(__dirname, "../../frontend/src/contracts");
  const backendContractsDir = path.join(__dirname, "../../backend/src/contracts");

  [frontendContractsDir, backendContractsDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Write addresses.json
  fs.writeFileSync(
    path.join(frontendContractsDir, "addresses.json"),
    JSON.stringify(addresses, null, 2)
  );
  fs.writeFileSync(
    path.join(backendContractsDir, "addresses.json"),
    JSON.stringify(addresses, null, 2)
  );

  // Write full contracts.json (including ABIs)
  fs.writeFileSync(
    path.join(frontendContractsDir, "contracts.json"),
    JSON.stringify(contractsData, null, 2)
  );
  fs.writeFileSync(
    path.join(backendContractsDir, "contracts.json"),
    JSON.stringify(contractsData, null, 2)
  );

  console.log("\n📦 Contract addresses and ABIs exported to frontend and backend!");
  console.log("==========================================");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
