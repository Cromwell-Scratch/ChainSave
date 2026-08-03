import {
  BrowserProvider,
  formatEther,
  type Eip1193Provider,
} from "ethers";

export async function getLiveRootstockBalance(
  provider: Eip1193Provider,
  address: string
) {
  const browserProvider = new BrowserProvider(provider);

  const balance = await browserProvider.getBalance(address);

  return formatEther(balance);
}

export async function getRootstockNetwork(
  provider: Eip1193Provider
) {
  const browserProvider = new BrowserProvider(provider);

  return browserProvider.getNetwork();
}

export function getExplorerUrl(
  address: string
) {
  return `https://explorer.testnet.rootstock.io/address/${address}`;
}