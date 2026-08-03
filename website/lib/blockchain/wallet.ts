import {
  BrowserProvider,
  formatEther,
  type Eip1193Provider,
} from "ethers";

import {
  ROOTSTOCK_TESTNET_CHAIN_ID,
  ROOTSTOCK_TESTNET_CHAIN_ID_HEX,
  ROOTSTOCK_TESTNET_EXPLORER_URL,
  ROOTSTOCK_TESTNET_RPC_URL,
} from "@/lib/blockchain/rootstock";


function getEthereumProvider(): Eip1193Provider {
  if (typeof window === "undefined") {
    throw new Error(
      "Wallet connections are only available in the browser."
    );
  }

  const ethereum = (
    window as Window & {
      ethereum?: Eip1193Provider;
    }
  ).ethereum;

  if (!ethereum) {
    throw new Error(
      "No browser wallet was detected. Please install or connect a compatible wallet."
    );
  }

  return ethereum;
}

async function switchToRootstockTestnet(
  ethereum: Eip1193Provider
) {
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [
        {
          chainId: ROOTSTOCK_TESTNET_CHAIN_ID_HEX,
        },
      ],
    });
  } catch (error: unknown) {
    const switchError = error as {
      code?: number;
      message?: string;
    };

    if (switchError.code !== 4902) {
      throw new Error(
        switchError.message ??
          "Unable to switch to Rootstock Testnet."
      );
    }

    await ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: ROOTSTOCK_TESTNET_CHAIN_ID_HEX,
          chainName: "Rootstock Testnet",
          nativeCurrency: {
            name: "Test Rootstock Bitcoin",
            symbol: "tRBTC",
            decimals: 18,
          },
          rpcUrls: [ROOTSTOCK_TESTNET_RPC_URL],
          blockExplorerUrls: [
            ROOTSTOCK_TESTNET_EXPLORER_URL,
          ],
        },
      ],
    });
  }
}

export async function getWalletBalance(
  address: string
): Promise<string> {
  const ethereum = getEthereumProvider();

  const provider = new BrowserProvider(ethereum);
  const network = await provider.getNetwork();

  if (
    Number(network.chainId) !==
    ROOTSTOCK_TESTNET_CHAIN_ID
  ) {
    throw new Error(
      "Please switch MetaMask to Rootstock Testnet."
    );
  }

  const balanceWei = await provider.getBalance(address);

  return formatEther(balanceWei);
}

export async function connectRootstockWallet() {
  const ethereum = getEthereumProvider();

  await ethereum.request({
    method: "eth_requestAccounts",
    params: [],
  });

  await switchToRootstockTestnet(ethereum);

  const provider = new BrowserProvider(ethereum);
  const network = await provider.getNetwork();

  if (
    Number(network.chainId) !==
    ROOTSTOCK_TESTNET_CHAIN_ID
  ) {
    throw new Error(
      "Please switch MetaMask to Rootstock Testnet."
    );
  }

  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const balanceWei = await provider.getBalance(address);

  return {
    provider,
    signer,
    address,
    balanceWei,
    balance: formatEther(balanceWei),
    chainId: Number(network.chainId),
    network: "rootstock_testnet",
    explorerUrl:
      `${ROOTSTOCK_TESTNET_EXPLORER_URL}/address/${address}`,
  };
}

export async function getConnectedRootstockWallet() {
  const ethereum = getEthereumProvider();

  const accounts = (await ethereum.request({
    method: "eth_accounts",
    params: [],
  })) as string[];

  if (!accounts.length) {
    return null;
  }

  await switchToRootstockTestnet(ethereum);

  const provider = new BrowserProvider(ethereum);
  const network = await provider.getNetwork();

  if (
    Number(network.chainId) !==
    ROOTSTOCK_TESTNET_CHAIN_ID
  ) {
    return null;
  }

  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const balanceWei = await provider.getBalance(address);

  return {
    provider,
    signer,
    address,
    balanceWei,
    balance: formatEther(balanceWei),
    chainId: Number(network.chainId),
    network: "rootstock_testnet",
    explorerUrl:
      `${ROOTSTOCK_TESTNET_EXPLORER_URL}/address/${address}`,
  };
}

export function shortenWalletAddress(
  address: string
) {
  if (address.length < 12) {
    return address;
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}