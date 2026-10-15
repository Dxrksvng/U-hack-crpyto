import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Info, Lock, ScanSearch, Send as SendIcon } from "lucide-react";
import { formatEther } from "viem";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useUI } from "@/state/ui";
import { useAccount, useBalance, useSwitchChain } from "wagmi";
import type { CheckRecord } from "@/domain/types";
import { isRisky } from "@/domain/types";
import { checkKey, useSession } from "@/state/session";
import { getChain } from "@/lib/chains";
import { MOCK_RECENT_RECIPIENTS, findLookalike, toChecksum, validateAddress } from "@/lib/address";
import { toWei, validateAmount } from "@/lib/amount";
import { sendEligibility } from "@/lib/txMachine";
import { useFeeEstimate } from "@/lib/useFee";
import { useSyncChain } from "@/lib/useSyncChain";
import { VERDICT_STYLE } from "@/lib/verdict";
import { DUR } from "@/lib/motion";
import { AddressInput } from "./AddressInput";
import { AmountInput } from "./AmountInput";
import { ChainSelector } from "./ChainSelector";
import { AddressPoisoningCompare } from "./AddressPoisoningCompare";
import { AddressChecking } from "./AddressChecking";
import { PreSendAlertSheet } from "./PreSendAlertSheet";
import { Address } from "./Address";
import { Identicon } from "./Identicon";
import { DemoBadge, ErrorState } from "./States";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

function InlineVerdict({ rec, onOpen }: { rec: CheckRecord; onOpen: () => void }) {
  const { t, i18n } = useTranslation();
  const r = rec.result;
  const st = VERDICT_STYLE[r.verdict];
  return (
    <motion.div aria-live="polite" data-testid="inline-verdict" data-verdict={r.verdict} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: DUR.standard }} className={cn("rounded-2xl border p-4", st.border, st.soft)}>
      <div className="flex items-start justify-between gap-2">
        <p className={cn("flex items-center gap-2 font-medium", st.text)}>
          <motion.span initial={{ scale: r.verdict === "NO_KNOWN_RISK" ? 0.8 : 1 }} animate={{ scale: 1 }} transition={{ duration: DUR.fast }} className="inline-flex">
            <st.icon size={19} aria-hidden />
          </motion.span>
          {t(`verdict.${r.verdict}.title`)}
        </p>
        {rec.demo ? <DemoBadge /> : <span className="rounded border border-border px-1.5 py-px font-mono text-[10px] font-bold tracking-wider" data-testid="live-badge">{t("common.live")}</span>}
      </div>
      <p className="mt-1 text-sm">{r.verdict === "NO_KNOWN_RISK" ? t("nkr.cardDesc") : i18n.language === "th" ? r.summary_th : r.summary_en}</p>
      {r.verdict === "NO_KNOWN_RISK" && <p className="mt-1 text-sm font-medium">{t("verdict.notSafe")}</p>}
      <button type="button" onClick={onOpen} className="mt-1 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary-ink">
        {t("send.showAnalysis")} <ArrowRight size={14} />
      </button>
    </motion.div>
  );
}

export function SendForm() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { setWalletOpen } = useUI();
  const [note, setNote] = useState("");
  const { address, isConnected, chainId: walletChainId } = useAccount();
  const { switchChain, isPending: switching } = useSwitchChain();
  const s = useSession();
  const { chainId, destination, setDestination, amount, setAmount, current, status, error, runCheck, cancelCheck, acknowledge } = s;
  const selectChain = useSyncChain();
  const chain = getChain(chainId);
  const balance = useBalance({ address, chainId, query: { enabled: Boolean(address) } });

  const addrStatus = validateAddress(destination);
  const dest = addrStatus === "valid" ? toChecksum(destination) : null;
  const valueWei = toWei(amount);
  const { fee, loading: feeLoading } = useFeeEstimate({ account: address, to: dest ?? undefined, value: valueWei, chainId, enabled: chain.live && isConnected });
  const amountError = validateAmount(amount, balance.data?.value, fee);
  const lookalike = useMemo(() => (dest ? findLookalike(dest, MOCK_RECENT_RECIPIENTS) : undefined), [dest]);
  const block = sendEligibility({ chainLive: chain.live, connected: isConnected && Boolean(address), walletChainId, chainId, destinationValid: Boolean(dest), hasCheck: Boolean(current), amount, balance: balance.data?.value, fee });

  const [pending, setPending] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);

  // Debounced auto-check 600ms after a valid address appears (once per chain+destination).
  const lastAuto = useRef<string | null>(null);
  useEffect(() => {
    if (!dest) return;
    const k = checkKey(chainId, dest);
    if (lastAuto.current === k) return;
    const h = setTimeout(() => {
      lastAuto.current = k;
      void runCheck(chainId, dest);
    }, 600);
    return () => clearTimeout(h);
  }, [dest, chainId, runCheck]);

  // A check never starts a transfer. Risky verdicts open the pre-send alert; otherwise the inline verdict is the result.
  const proceed = useCallback(
    (rec: CheckRecord) => {
      if (!chain.live) return; // check-only: the inline verdict is the result
      if (isRisky(rec.result.verdict) || rec.result.verdict === "NO_KNOWN_RISK") setAlertOpen(true);
    },
    [chain.live],
  );

  const onSend = () => {
    if (block || !current) return;
    if (isRisky(current.result.verdict) && !s.acknowledged.has(current.id)) return setAlertOpen(true);
    nav("/review");
  };

  // Explicit "Check address risk": show the checking screen until the current check resolves.
  useEffect(() => {
    if (pending && current && status !== "checking") {
      setPending(false);
      proceed(current);
    }
  }, [pending, current, status, proceed]);

  const onCheck = () => {
    if (!dest) return;
    if (current) return proceed(current);
    setPending(true);
    if (status !== "checking") void runCheck(chainId, dest);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-[28px] font-semibold leading-tight">{t("send.title")}</h1>
        <p className="text-[15px] text-fg-muted">{t("send.subtitle")}</p>
      </div>

      <div className="flex min-h-14 items-center justify-between gap-2 rounded-[14px] border border-border bg-surface pl-4 pr-1.5">
        <span className="text-sm text-fg-muted">{t("send2.network")}</span>
        <ChainSelector value={chainId} onChange={selectChain} className="border-0 shadow-none" />
      </div>

      {address ? (
        <div className="flex items-center gap-2 px-1 text-xs text-fg-muted">
          <span>{t("send2.fromLine")}</span>
          <Identicon address={address} className="h-5 w-5" />
          <Address value={address} className="text-xs text-fg" />
          <span className="ml-auto">
            {balance.data ? <span className="font-mono">{Number(formatEther(balance.data.value)).toFixed(4)} {chain.symbol}</span> : <Skeleton className="inline-block h-3 w-14 align-middle" />}
          </span>
        </div>
      ) : (
        chain.live && (
          <div className="flex items-center justify-between gap-2 rounded-[12px] bg-muted px-3 py-2">
            <p className="text-sm text-fg-muted">{t("send.notConnected")}</p>
            <Button size="sm" variant="outline" onClick={() => setWalletOpen(true)}>
              {t("settings.connect")}
            </Button>
          </div>
        )
      )}

      <AddressInput value={destination} onChange={setDestination} />
      {lookalike && dest && <AddressPoisoningCompare pasted={dest} recent={lookalike} />}

      {chain.live ? (
        <>
          <AmountInput value={amount} onChange={setAmount} symbol={chain.symbol} balance={balance.data?.value} fee={fee} error={amountError} />
          <div className="-mt-3 flex items-center justify-between px-1 text-xs">
            <span className="text-fg-muted">{t("send.fee")}</span>
            <span className="font-mono">{fee != null ? `${Number(formatEther(fee)).toFixed(6)} ${chain.symbol}` : feeLoading ? "…" : <span className="font-sans text-fg-muted">{isConnected ? "—" : t("send.feeUnavailable")}</span>}</span>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">{t("send2.note")}</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={80} placeholder={t("send2.notePlaceholder")} className="h-12 w-full rounded-[12px] border border-border bg-surface px-3 text-sm placeholder:text-fg-muted/70" />
            <span className="mt-1 block text-[11px] text-fg-muted">{t("send2.noteHint")}</span>
          </label>
        </>
      ) : (
        <p className="flex items-start gap-2 rounded-xl bg-muted p-3 text-sm text-fg-muted">
          <Info size={16} className="mt-0.5 shrink-0" /> {t("chain.checkOnlyTip")}
        </p>
      )}

      <AnimatePresence mode="wait">
        {status === "checking" && !pending ? (
          <motion.div key="l" exit={{ opacity: 0 }} className="space-y-2 rounded-2xl border border-border p-4" aria-busy aria-live="polite">
            <p className="text-sm text-fg-muted">{t("checking.title")}…</p>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </motion.div>
        ) : current ? (
          <InlineVerdict key={current.id} rec={current} onOpen={() => nav(`/analysis/${current.id}`)} />
        ) : status === "error" && error && !pending ? (
          <ErrorState key="e" message={t(`send.errors.${error.kind === "aborted" ? "network" : error.kind}`)} onRetry={() => dest && runCheck(chainId, dest)} />
        ) : null}
      </AnimatePresence>

      <motion.div whileTap={{ scale: 0.98 }}>
        <Button size="lg" className="h-auto min-h-16 w-full justify-between rounded-[14px] px-5 py-2.5 shadow-[0_6px_18px_-8px_rgba(59,111,216,0.7)]" disabled={!dest} onClick={onCheck} data-testid="check-risk">
          <span className="w-5" aria-hidden />
          <span className="flex flex-col items-center">
            <span className="text-[16px]">{t("send2.cta")}</span>
            <span className="text-[12px] font-normal">{t("send2.ctaSub")}</span>
          </span>
          {chain.live ? <ArrowRight size={20} aria-hidden /> : <ScanSearch size={20} aria-hidden />}
        </Button>
      </motion.div>

      {chain.live && (
        <div className="space-y-1.5">
          <Button size="lg" variant="outline" className="min-h-14 w-full rounded-[14px]" disabled={block != null} onClick={onSend} data-testid="send-tx" data-block={block ?? ""}>
            <SendIcon size={18} aria-hidden /> {t("send.sendTx")}
          </Button>
          {block && (
            <p className="flex flex-wrap items-center justify-center gap-x-2 text-center text-xs text-fg-muted" data-testid="send-block">
              {t(`sendBlock.${block}`, { chain: chain.name })}
              {block === "wrong_network" && (
                <button type="button" disabled={switching} onClick={() => switchChain({ chainId }, { onError: () => toast.error(t("wallet.switchFailed")) })} className="inline-flex min-h-11 items-center font-medium text-primary-ink">
                  {t("wallet.switch", { chain: chain.short })}
                </button>
              )}
            </p>
          )}
        </div>
      )}

      <p className="flex items-start gap-1.5 text-xs text-fg-muted">
        <Lock size={13} className="mt-0.5 shrink-0" /> {t("send.privacy")}
      </p>
      <p className="text-xs text-fg-muted">{t("send.demoHint")}</p>

      <AnimatePresence>
        {pending && dest && (
          <AddressChecking
            destination={dest}
            status={status}
            rec={current}
            error={error}
            onCancel={() => {
              cancelCheck();
              setPending(false);
            }}
          />
        )}
      </AnimatePresence>
      {pending && status === "error" && error && (
        <div className="fixed inset-x-0 bottom-6 z-[55] mx-auto max-w-[440px] px-4">
          <ErrorState message={t(`send.errors.${error.kind === "aborted" ? "network" : error.kind}`)} onRetry={() => dest && runCheck(chainId, dest)} />
        </div>
      )}

      {current && chain.live && (isRisky(current.result.verdict) || current.result.verdict === "NO_KNOWN_RISK") && (
        <PreSendAlertSheet
          open={alertOpen}
          onOpenChange={setAlertOpen}
          rec={current}
          onCancel={() => {
            setAlertOpen(false);
            toast(t("tx.cancelled"));
          }}
          blockedReason={current.result.verdict === "NO_KNOWN_RISK" && block ? t(`sendBlock.${block}`, { chain: chain.name }) : undefined}
          onContinue={() => {
            if (current.result.verdict === "NO_KNOWN_RISK") {
              // Explicit user action only; nothing is submitted here, /review re-validates everything.
              if (block) return toast(t(`sendBlock.${block}`, { chain: chain.name }));
              setAlertOpen(false);
              return nav("/review");
            }
            acknowledge(current.id);
            setAlertOpen(false);
            if (!block) nav("/review");
            else toast(t(`sendBlock.${block}`, { chain: chain.name }));
          }}
          onShowMore={() => {
            setAlertOpen(false);
            nav(`/analysis/${current.id}`);
          }}
        />
      )}
    </div>
  );
}
