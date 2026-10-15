import { avalanche, avalancheFuji, bsc, mainnet, sepolia } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";

export type ChainInfo = {
  id: number;
  name: string;
  short: string;
  symbol: string;
  live: boolean;
  explorer: string;
  color: string;
  network: AppKitNetwork;
  /** Public RPC used before any provider proxy. Taken from the viem chain definition. */
  rpc: string;
};

export const CHAINS: ChainInfo[] = [
  { id: 43113, name: "Avalanche Fuji", short: "Fuji", symbol: "AVAX", live: true, explorer: "https://explorer-test.avax.network/c-chain", color: "#E84142", network: avalancheFuji, rpc: avalancheFuji.rpcUrls.default.http[0] },
  { id: 11155111, name: "Ethereum Sepolia", short: "Sepolia", symbol: "ETH", live: true, explorer: "https://sepolia.etherscan.io", color: "#627EEA", network: sepolia, rpc: sepolia.rpcUrls.default.http[0] },
  { id: 43114, name: "Avalanche C-Chain", short: "Avalanche", symbol: "AVAX", live: false, explorer: "https://snowtrace.io", color: "#E84142", network: avalanche, rpc: avalanche.rpcUrls.default.http[0] },
  { id: 1, name: "Ethereum", short: "Ethereum", symbol: "ETH", live: false, explorer: "https://etherscan.io", color: "#627EEA", network: mainnet, rpc: mainnet.rpcUrls.default.http[0] },
  { id: 56, name: "BNB Chain", short: "BNB", symbol: "BNB", live: false, explorer: "https://bscscan.com", color: "#F0B90B", network: bsc, rpc: bsc.rpcUrls.default.http[0] },
];

export const DEFAULT_CHAIN_ID = 43113;

export function getChain(id: number): ChainInfo {
  return CHAINS.find((c) => c.id === id) ?? CHAINS[0];
}
