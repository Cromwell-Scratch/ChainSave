import { createPublicClient, http } from "viem";
import { rootstockTestnet } from "viem/chains";

export const ROOTSTOCK_TESTNET = rootstockTestnet;

export const ROOTSTOCK_TESTNET_CHAIN_ID = 31;
export const ROOTSTOCK_TESTNET_CHAIN_ID_HEX = "0x1f";

export const ROOTSTOCK_TESTNET_RPC_URL =
  "https://public-node.testnet.rsk.co";

export const ROOTSTOCK_TESTNET_EXPLORER_URL =
  "https://explorer.testnet.rootstock.io";

export const rootstockPublicClient = createPublicClient({
  chain: rootstockTestnet,
  transport: http(ROOTSTOCK_TESTNET_RPC_URL),
});