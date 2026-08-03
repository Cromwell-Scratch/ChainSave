const { ethers, network } = require("hardhat");

const TREASURY_ADDRESS =
  "0xCEA39c16649E958a2Bc33D1d492699044A73B4c4";

const FACTORY_ADDRESS =
  "0xA37B33a455aaCfe7b31682596574c69c8C71760b";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("--------------------------------");
  console.log("Configuring ChainSave contracts");
  console.log("--------------------------------");
  console.log("Network:", network.name);
  console.log("Account:", deployer.address);

  const treasury = await ethers.getContractAt(
    "Treasury",
    TREASURY_ADDRESS
  );

  const currentOwner = await treasury.owner();

  console.log("Current Treasury owner:", currentOwner);
  console.log("Required owner:", FACTORY_ADDRESS);

  if (
    currentOwner.toLowerCase() ===
    FACTORY_ADDRESS.toLowerCase()
  ) {
    console.log(
      "✅ Treasury is already owned by SavingsFactory."
    );
    return;
  }

  if (
    currentOwner.toLowerCase() !==
    deployer.address.toLowerCase()
  ) {
    throw new Error(
      "The connected deployment wallet does not own Treasury."
    );
  }

  console.log(
    "\nTransferring Treasury ownership to SavingsFactory..."
  );

  const transaction =
    await treasury.transferOwnership(
      FACTORY_ADDRESS
    );

  console.log("Transaction:", transaction.hash);

  await transaction.wait();

  const newOwner = await treasury.owner();

  console.log("✅ New Treasury owner:", newOwner);

  if (
    newOwner.toLowerCase() !==
    FACTORY_ADDRESS.toLowerCase()
  ) {
    throw new Error(
      "Treasury ownership transfer verification failed."
    );
  }

  console.log(
    "\nChainSave contracts configured successfully."
  );
}

main().catch((error) => {
  console.error("Configuration failed:", error);
  process.exitCode = 1;
});