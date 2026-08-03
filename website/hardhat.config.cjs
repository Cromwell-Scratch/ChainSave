require("dotenv").config({
  path: ".env.local",
});
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  networks: {
    rskTestnet: {
      url:
        process.env.ROOTSTOCK_TESTNET_RPC_URL ||
        "https://public-node.testnet.rsk.co",

      chainId: 31,

      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./hardhat-cache",
    artifacts: "./hardhat-artifacts",
  },
};