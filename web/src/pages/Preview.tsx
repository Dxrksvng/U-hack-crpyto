import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useUI } from "@/state/ui";
import { TopBar } from "@/components/Bars";
import { useAccount, useBalance, useSwitchChain } from "wagmi";
import { isRisky, type CheckRecord } from "@/domain/types";
import { useSession } from "@/state/session";
import { getChain } from "@/lib/chains";
import { toChecksum, validateAddress } from "@/lib/address";
import { toWei } from "@/lib/amount";
import { useFeeEstimate } from "@/lib/useFee";
import { useTransfer } from "@/lib/useTransfer";
import { sendEligibility } from "@/lib/txMachine";
import { TransactionPreview } from "@/components/TransactionPreview";
import { PreSendAlertSheet } from "@/components/PreSendAlertSheet";
import { EmptyState } from "@/components/States";
import { Button } from "@/components/ui/button";

const STALE_MS = 10 * 60_000;

export default function Preview() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { setWalletOpen } = useUI();
  const { address, isConnected, chainId: walletChain } = useAccount();
  const { switchChain, isPending: switching } = useSwitchChain();
  const s = useSession();
  const chain = getChain(s.chainId);
  const dest = validateAddress(s.destination) === "valid" ? toChecksum(s.destination) : null;
  const valueWei = toWei(s.amount);
  const balance = useBalance({ address, chainId: s.chainId, query: { enabled: Boolean(address) } });
  const { fee, loading: feeLoading } = useFeeEstimate({ account: address, to: dest ?? undefined, value: valueWei, chainId: s.chainId, enabled: isConnected && chain.live });
  const block = sendEligibility({ chainLive: chain.live, connected: isConnected && Boolean(address), walletChainId: walletChain, chainId: s.chainId, destinationValid: Boolean(dest), hasCheck: Boolean(s.current), amount: s.amount, balance: balance.data?.value, fee });
  const transfer = useTransfer();
  const [alertFor, setAlertFor] = useState<CheckRecord | null>(null);
  const [revalidating, setRevalidating] = useState(false);

  const latest = useRef({ address, isConnected, walletChain, chainId: s.chainId, destination: s.destination, amount: s.amount, block });
  latest.current = { address, isConnected, walletChain, chainId: s.chainId, destination: s.destination, amount: s.amount, block };
  const contextKey = `${address}:${isConnected}:${walletChain}:${s.chainId}:${s.destination}:${s.amount}`;
  const contextRevision = useRef({ key: contextKey, version: 0 });
  if (contextRevision.current.key !== contextKey) contextRevision.current = { key: contextKey, version: contextRevision.current.version + 1 };
  const mounted = useRef(true);
  const checking = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const rec = s.current;
  if (!dest || !valueWei || !chain.live || !rec)
    return (
      <>
      <TopBar title={t("preview2.title")} />
      <div className="mx-auto w-full max-w-[480px] px-4 py-5">
        <EmptyState title={t("preview.notReady")} body={t("preview.notReadyBody")} action={<Button asChild><Link to="/send">{t("preview.goSend")}</Link></Button>} />
      </div>
      </>
    );

  const wrongNet = isConnected && walletChain !== s.chainId;

  const start = (from: `0x${string}`, to: `0x${string}`, value: bigint, c: CheckRecord) => {
    const now = latest.current;
    if (!mounted.current || !now.isConnected || now.address !== from || now.walletChain !== c.chainId || now.chainId !== c.chainId || now.destination.trim().toLowerCase() !== to.toLowerCase() || now.amount !== s.amount || now.block || c.destination.toLowerCase() !== to.toLowerCase()) return;
    const id = transfer.send({ chainId: s.chainId, from, to, amount: s.amount, value, checkId: c.id, verdict: c.result.verdict });
    if (id) nav(`/transaction/${id}`);
  };

  const go = async () => {
    if (transfer.inFlight || checking.current) return;
    if (!isConnected || !address) return setWalletOpen(true);
    if (wrongNet) return switchChain({ chainId: s.chainId }, { onError: () => toast.error(t("wallet.switchFailed")) });
    if (block) return toast.error(t(`sendBlock.${block}`));
    // Revalidate: re-run a stale check before allowing the wallet to open.
    let check: CheckRecord | null = rec;
    if (Date.now() - rec.createdAt > STALE_MS) {
      toast(t("preview.stale"));
      const before = latest.current;
      const version = contextRevision.current.version;
      checking.current = true;
      setRevalidating(true);
      try {
        check = await s.runCheck(s.chainId, dest);
      } finally {
        checking.current = false;
        if (mounted.current) setRevalidating(false);
      }
      const now = latest.current;
      if (!mounted.current || contextRevision.current.version !== version || !check || now.address !== before.address || !now.isConnected || now.walletChain !== before.walletChain || now.chainId !== before.chainId || now.destination !== before.destination || now.amount !== before.amount || now.block) return;
    }
    if (isRisky(check.result.verdict) && !s.acknowledged.has(check.id)) return setAlertFor(check);
    start(address, dest, valueWei, check);
  };

  const v = rec.result.verdict;
  return (
    <>
    <TopBar title={t("preview2.title")} />
    <div className="mx-auto w-full max-w-[480px] space-y-4 px-4 py-5">
      <TransactionPreview from={address} to={dest} chain={chain} amount={s.amount} amountWei={valueWei} fee={fee} feeLoading={feeLoading} rec={rec} />
      <p className="text-xs text-fg-muted">{t("preview.feeNote")}</p>
      {isRisky(v) && (
        <div className={v === "CRITICAL" ? "flex items-start gap-2.5 rounded-xl bg-critical-soft p-3 text-sm" : "flex items-start gap-2.5 rounded-xl bg-warning-soft p-3 text-sm"} role="note" data-testid="risk-banner">
          <AlertTriangle size={17} className={v === "CRITICAL" ? "mt-0.5 shrink-0 text-critical" : "mt-0.5 shrink-0 text-warning"} aria-hidden />
          <span>
            <span className="block font-medium">{v === "CRITICAL" ? t("preview2.riskBanner") : t("preview2.warnBanner")}</span>
            <span className="block text-xs text-fg-muted">{t("preview2.riskBannerSub")}</span>
          </span>
        </div>
      )}
      {v === "UNKNOWN" && (
        <p className="flex items-start gap-2 rounded-xl border border-dashed border-unknown bg-unknown-soft p-3 text-sm" role="note">
          <Info size={16} className="mt-0.5 shrink-0 text-unknown" /> {t("preview.unknownNote")}
        </p>
      )}
      {v === "NO_KNOWN_RISK" && (
        <p className="flex items-start gap-2 rounded-xl bg-norisk-soft p-3 text-sm" role="note">
          <Info size={16} className="mt-0.5 shrink-0 text-norisk" /> {t("preview.noRiskNote")}
        </p>
      )}
      {wrongNet && (
        <p className="flex items-start gap-2 rounded-xl bg-warning-soft p-3 text-sm text-warning-ink" role="alert">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {t("wallet.wrongNetwork", { chain: chain.name })}
        </p>
      )}
      {block && block !== "not_connected" && block !== "wrong_network" && <p className="text-sm text-critical-ink" data-testid="send-block">{t(`sendBlock.${block}`)}</p>}
      <div className="sticky bottom-0 -mx-4 grid grid-cols-2 gap-2 border-t border-border bg-bg/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <Button
          size="lg"
          className="rounded-[12px] bg-critical text-white hover:bg-critical-ink"
          onClick={() => {
            toast(t("tx.cancelled"));
            nav("/send");
          }}
        >
          {t("preview.cancel")}
        </Button>
        <Button size="lg" className="rounded-[12px]" onClick={go} disabled={switching || revalidating || transfer.inFlight || (block != null && block !== "not_connected" && block !== "wrong_network")} data-testid="continue-wallet">
          {!isConnected ? t("preview.connect") : wrongNet ? t("wallet.switch", { chain: chain.short }) : t("preview.continue")}
        </Button>
      </div>
      {alertFor && (
        <PreSendAlertSheet
          open={Boolean(alertFor)}
          onOpenChange={(o) => !o && setAlertFor(null)}
          rec={alertFor}
          onCancel={() => {
            setAlertFor(null);
            toast(t("tx.cancelled"));
          }}
          onContinue={() => {
            const c = alertFor;
            s.acknowledge(c.id);
            setAlertFor(null);
            if (address && !block) start(address, dest, valueWei, c);
          }}
          onShowMore={() => {
            const id = alertFor.id;
            setAlertFor(null);
            nav(`/analysis/${id}`);
          }}
        />
      )}
    </div>
    </>
  );
}
