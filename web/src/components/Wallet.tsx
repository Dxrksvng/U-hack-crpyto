import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAppKit } from "@reown/appkit/react";
import { useAccount, useAccountEffect, useConnect } from "wagmi";
import { hasProjectId } from "@/lib/wagmi";
import { truncate } from "@/lib/address";
import { CHAINS } from "@/lib/chains";
import { DUR } from "@/lib/motion";
import { Identicon } from "./Identicon";
import { Button } from "./ui/button";
import { useUI } from "@/state/ui";

export function WalletChip() {
  const { t } = useTranslation();
  const { open } = useAppKit();
  const { address } = useAccount();
  if (!address) return null;
  return (
    <button
      type="button"
      onClick={() => open({ view: "Account" })}
      aria-label={`${t("header.account")} ${address}`}
      data-testid="wallet-chip"
      className="flex min-h-11 items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-muted"
    >
      <Identicon address={address} />
      <span className="flex flex-col items-start leading-tight">
        <span className="font-mono text-[13px] font-medium">{truncate(address, 2, 4)}</span>
        <span className="flex items-center gap-1 text-[11px] text-fg-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-ok" aria-hidden />
          {t("header.connected")}
        </span>
      </span>
    </button>
  );
}

/**
 * What can actually connect: a detected browser-extension wallet (EIP-6963 / window.ethereum) works without Reown;
 * WalletConnect QR and the wallet list need VITE_REOWN_PROJECT_ID.
 */
export function useWalletAvailability() {
  const { connectors } = useConnect();
  const injected = connectors.some((c) => c.type === "injected" && c.id !== "injected") || (typeof window !== "undefined" && "ethereum" in window && Boolean((window as { ethereum?: unknown }).ethereum));
  return { walletConnect: hasProjectId, injected, any: hasProjectId || injected };
}

/** Connect button that swaps to the wallet chip only after wagmi reports the account. */
export function WalletConnectButton() {
  const { t } = useTranslation();
  const { setWalletOpen } = useUI();
  const { status } = useAccount();
  const avail = useWalletAvailability();
  return (
    <AnimatePresence mode="wait" initial={false}>
      {status === "connected" ? (
        <motion.div key="chip" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: DUR.standard }}>
          <WalletChip />
        </motion.div>
      ) : (
        <motion.div key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: DUR.fast }}>
          <Button onClick={() => setWalletOpen(true)} disabled={status === "connecting" || status === "reconnecting"} variant={avail.any ? "primary" : "outline"} className="h-10 min-h-10 rounded-[10px] px-4 text-[14px] font-medium" data-testid="connect-button" data-configured={avail.any}>
            {status === "connecting" || status === "reconnecting" ? (
              <>
                <Loader2 size={16} className="animate-spin" /> {t("header.connecting")}
              </>
            ) : avail.any ? (
              t("header.connect")
            ) : (
              t("walletCfg.notConfigured")
            )}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Surfaces wallet lifecycle events (connect, disconnect, account and chain change) as toasts. */
export function WalletWatcher() {
  const { t } = useTranslation();
  const { address, chainId, status } = useAccount();
  const prev = useRef<{ address?: string; chainId?: number }>({});
  useAccountEffect({
    onConnect: ({ isReconnected }) => {
      if (!isReconnected) toast.success(t("wallet.connected"));
    },
    onDisconnect: () => toast(t("wallet.disconnected")),
  });
  useEffect(() => {
    if (status !== "connected") {
      prev.current = {};
      return;
    }
    const p = prev.current;
    if (p.address && address && p.address !== address) toast(t("wallet.accountChanged", { addr: truncate(address) }));
    if (p.chainId && chainId && p.chainId !== chainId) {
      const c = CHAINS.find((x) => x.id === chainId);
      if (c) toast(t("wallet.chainChanged", { chain: c.name }));
      else toast.warning(t("wallet.unsupported"));
    }
    prev.current = { address, chainId };
  }, [address, chainId, status, t]);
  return null;
}
