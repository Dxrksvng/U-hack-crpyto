import { ChevronRight, MoreHorizontal, QrCode, Settings2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAppKit } from "@reown/appkit/react";
import { useConnect, type Connector } from "wagmi";
import { UserRejectedRequestError } from "viem";
import { Sheet } from "./ui/sheet";
import { BrandLogo } from "./BrandLogo";
import { cn } from "@/lib/utils";
import { hasProjectId } from "@/lib/wagmi";

type Row = { key: string; name: string; sub: string; match?: RegExp; tile: string; letter?: string; icon?: typeof QrCode };

/**
 * Storyboard 3. Uses the real SDKs only: an installed EIP-6963 wallet connects through wagmi;
 * otherwise we hand off to the Reown AppKit modal (QR / wallet list). Nothing is simulated.
 */
export function WalletSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation();
  const { open: openKit } = useAppKit();
  const { connectors, connectAsync, isPending } = useConnect();

  const rows: Row[] = [
    { key: "metamask", name: "MetaMask", sub: t("connect.metamask"), match: /metamask/i, tile: "bg-[#FFF1E6] text-[#E2761B]", letter: "M" },
    { key: "walletconnect", name: "WalletConnect", sub: t("connect.walletconnect"), tile: "bg-[#E8F0FE] text-[#3B99FC]", icon: QrCode },
    { key: "trust", name: "Trust Wallet", sub: t("connect.trust"), match: /trust/i, tile: "bg-[#E6EEFF] text-[#0500FF]", letter: "T" },
    { key: "core", name: "Core Wallet", sub: t("connect.core"), match: /^core/i, tile: "bg-[#FDECEC] text-[#E84142]", letter: "C" },
  ];
  const find = (re?: RegExp): Connector | undefined => (re ? connectors.find((c) => re.test(c.name) && c.type !== "walletConnect") : undefined);

  const pick = async (r: Row) => {
    const c = find(r.match);
    if (!c) {
      if (!hasProjectId) return toast.error(t("walletCfg.rowUnavailable"));
      onOpenChange(false);
      await openKit({ view: r.key === "walletconnect" ? "ConnectingWalletConnectBasic" : "AllWallets" });
      return;
    }
    try {
      await connectAsync({ connector: c });
      onOpenChange(false);
    } catch (e) {
      const rejected = e instanceof UserRejectedRequestError || (typeof e === "object" && e !== null && (e as { code?: number }).code === 4001);
      toast.error(rejected ? t("connect.rejected") : t("connect.failed"));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t("connect.title")} hideTitle closeLabel={t("common.close")} testId="wallet-sheet">
      <div className="pb-1 pt-2">
        <BrandLogo size="md" />
      </div>
      <h2 className="mt-5 text-center font-display text-[20px] font-semibold">{t("connect.title")}</h2>
      <p className="mt-1 text-center text-sm text-fg-muted">{t("connect.subtitle")}</p>
      {!hasProjectId && (
        <div role="note" data-testid="wallet-config-notice" className="mt-4 flex items-start gap-2.5 rounded-xl bg-warning-soft p-3 text-sm text-warning-ink">
          <Settings2 size={17} className="mt-0.5 shrink-0" aria-hidden />
          <span>
            <span className="block font-medium">{t("walletCfg.notConfigured")}</span>
            <span className="block text-xs">{t("walletCfg.setup")}</span>
          </span>
        </div>
      )}
      <ul className="mt-5 space-y-2.5">
        {rows.map((r) => {
          const c = find(r.match);
          const unavailable = !c && !hasProjectId;
          return (
            <li key={r.key}>
              <button type="button" disabled={isPending || unavailable} onClick={() => pick(r)} data-testid={`wallet-${r.key}`} className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-2 text-left shadow-[0_1px_3px_rgba(15,23,41,0.05)] hover:bg-muted disabled:opacity-60">
                {c?.icon ? (
                  <img src={c.icon} alt="" className="h-10 w-10 rounded-xl" />
                ) : (
                  <span className={cn("grid h-10 w-10 place-items-center rounded-xl font-display text-lg font-bold", r.tile)} aria-hidden>
                    {r.icon ? <r.icon size={20} /> : r.letter}
                  </span>
                )}
                <span className="flex-1">
                  <span className="block font-medium">{r.name}</span>
                  <span className="block text-xs text-fg-muted">{c ? `${t("connect.detected")} · ${r.sub}` : unavailable ? t("walletCfg.rowNeedsSetup") : r.sub}</span>
                </span>
                <ChevronRight size={18} className="text-fg-muted" aria-hidden />
              </button>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            disabled={!hasProjectId}
            onClick={() => {
              onOpenChange(false);
              void openKit({ view: "AllWallets" });
            }}
            className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-border px-3 text-left hover:bg-muted disabled:opacity-60"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-fg-muted" aria-hidden>
              <MoreHorizontal size={20} />
            </span>
            <span className="flex-1 font-medium">{t("connect.more")}</span>
            <ChevronRight size={18} className="text-fg-muted" aria-hidden />
          </button>
        </li>
      </ul>
      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-fg-muted">
        <ShieldCheck size={13} aria-hidden /> {t("connect.noKeys")}
      </p>
    </Sheet>
  );
}
