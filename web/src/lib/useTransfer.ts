import { useCallback, useEffect, useMemo, useRef } from "react";
import { useConfig } from "wagmi";
import { estimateGas, getAccount, getBalance, getBlock, getGasPrice, getTransaction, getTransactionReceipt, sendTransaction, waitForTransactionReceipt } from "wagmi/actions";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type { Verdict } from "@/domain/types";
import { newId, useSession } from "@/state/session";
import { getChain } from "./chains";
import { toWei } from "./amount";
import { DEFAULT_TIMEOUTS, IN_FLIGHT, canRetry, runTransfer, type TxDeps, type TxTimeouts } from "./txMachine";

type Hex = `0x${string}`;
type SendParams = { chainId: number; from: Hex; to: Hex; amount: string; value: bigint; checkId?: string; verdict?: Verdict };

declare global {
  interface Window {
    __BS_TX_TIMEOUTS?: Partial<TxTimeouts>;
  }
}

/** One transfer at a time across the whole app, even if the component that started it unmounts. */
let busy = false;

/** Testnet transfer driven by txMachine.ts. Pass a record id (route param) to observe an existing transfer. */
export function useTransfer(routeId?: string) {
  const { t } = useTranslation();
  const config = useConfig();
  const { sends, addSend, updateSend } = useSession();
  const active = (routeId ? sends.find((s) => s.id === routeId) : null) ?? null;

  const deps = useMemo<TxDeps>(
    () => ({
      getAccount: () => getAccount(config),
      getBalance: async (a) => (await getBalance(config, a)).value,
      estimateGas: (a) => estimateGas(config, a),
      getGasPrice: (a) => getGasPrice(config, a),
      sendTransaction: (a) => sendTransaction(config, a),
      getTransaction: (a) => getTransaction(config, a),
      // wagmi's action throws on a reverted receipt (it replays the call for the reason). Read the receipt itself so a
      // revert is reported as a revert and not as an unknown confirmation.
      waitForReceipt: async (a) => {
        let r;
        try {
          r = await waitForTransactionReceipt(config, { hash: a.hash, chainId: a.chainId, timeout: a.timeout, onReplaced: (x) => a.onReplaced(x.reason, x.transaction.hash) });
        } catch (e) {
          r = await getTransactionReceipt(config, { hash: a.hash, chainId: a.chainId }).catch(() => null);
          if (!r) throw e;
        }
        if (r.status !== "success") return { status: r.status };
        const block = await getBlock(config, { blockNumber: r.blockNumber, chainId: a.chainId }).catch(() => null);
        return { status: "success" as const, feeWei: r.gasUsed * r.effectiveGasPrice, blockTime: block ? Number(block.timestamp) * 1000 : undefined };
      },
      sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    }),
    [config],
  );

  // Test hook: shorter timeouts in development builds only.
  const timeouts: TxTimeouts = import.meta.env.DEV ? { ...DEFAULT_TIMEOUTS, ...window.__BS_TX_TIMEOUTS } : DEFAULT_TIMEOUTS;
  const timeoutsRef = useRef(timeouts);
  timeoutsRef.current = timeouts;

  /** Starts a transfer and returns its record id, or null if one is already running. */
  const send = useCallback(
    (p: SendParams): string | null => {
      if (busy) return null;
      busy = true;
      const id = newId("tx");
      addSend({ id, chainId: p.chainId, from: p.from, to: p.to, amount: p.amount, status: "preparing", checkId: p.checkId, verdict: p.verdict, createdAt: Date.now() });
      void runTransfer(deps, { chainId: p.chainId, from: p.from, to: p.to, value: p.value }, (patch) => updateSend(id, patch), timeoutsRef.current).finally(() => {
        busy = false;
      });
      return id;
    },
    [deps, addSend, updateSend],
  );

  /** Retry only when no hash exists (nothing could have reached the network). Returns the new record id. */
  const retry = useCallback((): string | null => {
    if (!active || !canRetry(active.status, active.hash)) return null;
    const value = toWei(active.amount);
    if (!value) return null;
    return send({ chainId: active.chainId, from: active.from, to: active.to, amount: active.amount, value, checkId: active.checkId, verdict: active.verdict });
  }, [active, send]);

  // Toasts follow the real status only.
  const lastToast = useRef("");
  useEffect(() => {
    if (!active) return;
    const k = `${active.id}:${active.status}`;
    if (lastToast.current === k) return;
    lastToast.current = k;
    const link = active.hash ? `${getChain(active.chainId).explorer}/tx/${active.hash}` : undefined;
    const action = link ? { label: t("tx.view"), onClick: () => window.open(link, "_blank", "noopener") } : undefined;
    const id = active.id;
    const s = active.status;
    if (s === "awaiting_approval") toast.loading(t("tx.awaiting_approval"), { id });
    else if (s === "broadcasting" || s === "pending_confirmation") toast.loading(t(`tx.${s}`), { id, action });
    else if (s === "confirmed") toast.success(t("tx.confirmed"), { id, action });
    else if (s === "rejected") toast(t("tx.rejected"), { id });
    else if (s === "failed") toast.error(t("tx.failed"), { id, action });
    else if (s === "confirmation_unknown" || s === "replaced") toast.warning(t(`tx.${s}`), { id, action });
    else toast.dismiss(id);
  }, [active, t]);

  const inFlight = sends.some((s) => IN_FLIGHT.includes(s.status));
  return { send, retry, active, inFlight };
}
