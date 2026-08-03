"use client";

import { useCallback, useMemo } from "react";
import {
  useAppKit,
  useAppKitAccount,
  useAppKitNetworkCore,
  useAppKitProvider,
  useDisconnect,
} from "@reown/appkit/react";
import type { Eip1193Provider } from "ethers";

import {
  getExplorerUrl,
  getLiveRootstockBalance,
  getRootstockNetwork,
} from "@/lib/blockchain/walletManager";

const ROOTSTOCK_TESTNET_CHAIN_ID = 31;

export function useRootstockWallet() {
  const { open } = useAppKit();

  const {
    address,
    isConnected,
  } = useAppKitAccount();

  const { chainId } = useAppKitNetworkCore();

  const { walletProvider } =
    useAppKitProvider<Eip1193Provider>("eip155");

  const { disconnect } = useDisconnect();

  const normalizedAddress = useMemo(() => {
    return address?.toLowerCase() ?? null;
  }, [address]);

  const isRootstockTestnet =
    Number(chainId) === ROOTSTOCK_TESTNET_CHAIN_ID;

  const connectWallet = useCallback(async () => {
    await open();
  }, [open]);

  const disconnectWallet = useCallback(async () => {
    await disconnect({
      namespace: "eip155",
    });
  }, [disconnect]);

  const getBalance = useCallback(async () => {
    if (!walletProvider || !address) {
      throw new Error(
        "Connect a wallet before loading the Rootstock balance."
      );
    }

    const network =
      await getRootstockNetwork(walletProvider);

    if (
      Number(network.chainId) !==
      ROOTSTOCK_TESTNET_CHAIN_ID
    ) {
      throw new Error(
        "Please switch your wallet to Rootstock Testnet."
      );
    }

    return getLiveRootstockBalance(
      walletProvider,
      address
    );
  }, [address, walletProvider]);

  const explorerUrl = useMemo(() => {
    if (!address) {
      return undefined;
    }

    return getExplorerUrl(address);
  }, [address]);

  return {
    address,
    normalizedAddress,
    isConnected,
    isRootstockTestnet,
    chainId: Number(chainId ?? 0),
    walletProvider,
    explorerUrl,
    connectWallet,
    disconnectWallet,
    getBalance,
  };
}