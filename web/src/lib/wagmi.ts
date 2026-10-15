import { http } from "viem";
import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { CHAINS } from "./chains";

const envProjectId = import.meta.env.VITE_REOWN_PROJECT_ID as string | undefined;
export const hasProjectId = Boolean(envProjectId && !envProjectId.startsWith("REPLACE"));
// ASSUMPTION: without a real projectId AppKit still renders but WalletConnect relay calls fail.
const projectId = hasProjectId ? envProjectId! : "missing-project-id";

const networks = CHAINS.map((c) => c.network) as [AppKitNetwork, ...AppKitNetwork[]];

// Public chain RPC first. AppKit appends its own proxy as a fallback, which rejects requests (401) without a real projectId.
const transports = Object.fromEntries(CHAINS.map((c) => [c.id, http(c.rpc, { timeout: 15_000 })]));

export const wagmiAdapter = new WagmiAdapter({ networks, projectId, ssr: false, transports });

// Wallet ids from the WalletConnect explorer. ASSUMPTION: verify at explorer.walletconnect.com if a wallet goes missing.
const METAMASK = "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96";
const TRUST = "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd2b8c47c4b";
const CORE = "f323633c1f67055a45aac84e321af6ffe46322da677ffdd32f9bc1e33bafe29c";

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  defaultNetwork: CHAINS[0].network,
  projectId,
  metadata: {
    name: "BridgeSecur",
    description: "Check before you send",
    url: window.location.origin,
    icons: [`${window.location.origin}/favicon.svg`],
  },
  featuredWalletIds: [METAMASK, TRUST, CORE],
  features: { analytics: false, email: false, socials: false },
  // Not in the supported wallet list, and their SDKs post telemetry to Coinbase on load.
  enableCoinbase: false,
  enableBaseAccount: false,
  themeMode: "light",
  themeVariables: { "--w3m-accent": "#3B6FD8", "--w3m-border-radius-master": "4px" },
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
