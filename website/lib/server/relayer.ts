import { JsonRpcProvider, Wallet } from "ethers";

const rpcUrl =
  process.env.RSK_RPC_URL ??
  "https://public-node.testnet.rsk.co";

const privateKey =
  process.env.RELAYER_PRIVATE_KEY;

if (!privateKey) {
  throw new Error(
    "RELAYER_PRIVATE_KEY is missing."
  );
}

export const provider =
  new JsonRpcProvider(rpcUrl);

export const relayerWallet =
  new Wallet(
    privateKey,
    provider
  );