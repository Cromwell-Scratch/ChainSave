"use client";

import type { ReactNode } from "react";
import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { defineChain } from "@reown/appkit/networks";

const projectId =
  process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;

if (!projectId) {
  throw new Error(
    "NEXT_PUBLIC_REOWN_PROJECT_ID is missing from .env.local"
  );
}

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://localhost:3000";

export const rootstockTestnet = defineChain({
  id: 31,
  caipNetworkId: "eip155:31",
  chainNamespace: "eip155",
  name: "Rootstock Testnet",
  nativeCurrency: {
    name: "Test Rootstock Bitcoin",
    symbol: "tRBTC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        "https://public-node.testnet.rsk.co",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Rootstock Testnet Explorer",
      url: "https://explorer.testnet.rootstock.io",
    },
  },
});

const metadata = {
  name: "ChainSave",
  description:
    "Bitcoin-powered community savings on Rootstock",
  url: appUrl,
  icons: [],
};

createAppKit({
  adapters: [new EthersAdapter()],
  networks: [rootstockTestnet],
  defaultNetwork: rootstockTestnet,
  projectId,
  metadata,
  features: {
    analytics: true,
    email: false,
    socials: [],
  },
});

type AppKitProviderProps = {
  children: ReactNode;
};

export default function AppKitProvider({
  children,
}: AppKitProviderProps) {
  return children;
}