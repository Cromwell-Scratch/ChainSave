const { ethers, network } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("--------------------------------");
  console.log("Deploying ChainSave v2 Contracts");
  console.log("--------------------------------");
  console.log("Network:", network.name);
  console.log("Deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(
    deployer.address
  );

  console.log(
    "Balance:",
    ethers.formatEther(balance),
    "RBTC"
  );

  console.log("\nDeploying Treasury...");

  const Treasury = await ethers.getContractFactory(
    "Treasury"
  );

  const treasury = await Treasury.deploy(
    deployer.address
  );

  await treasury.waitForDeployment();

  const treasuryAddress =
    await treasury.getAddress();

  console.log("Treasury:", treasuryAddress);

  console.log("\nDeploying SavingsFactory...");

  const SavingsFactory =
    await ethers.getContractFactory(
      "SavingsFactory"
    );

  const factory = await SavingsFactory.deploy(
    treasuryAddress,
    deployer.address
  );

  await factory.waitForDeployment();

  const factoryAddress =
    await factory.getAddress();

  console.log("SavingsFactory:", factoryAddress);

  console.log(
    "\nTransferring Treasury ownership to Factory..."
  );

  const ownershipTransaction =
    await treasury.transferOwnership(
      factoryAddress
    );

  await ownershipTransaction.wait();

  const treasuryOwner =
    await treasury.owner();

  if (
    treasuryOwner.toLowerCase() !==
    factoryAddress.toLowerCase()
  ) {
    throw new Error(
      "Treasury ownership transfer failed."
    );
  }

  console.log(
    "Treasury owner:",
    treasuryOwner
  );

  console.log("\n--------------------------------");
  console.log("DEPLOYMENT COMPLETE");
  console.log("--------------------------------");
  console.log("Treasury:", treasuryAddress);
  console.log("SavingsFactory:", factoryAddress);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});