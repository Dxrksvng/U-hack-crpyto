import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs } from "radix-ui";
import { ArrowUpRight, ExternalLink, ScanSearch } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CheckRecord, SendRecord } from "@/domain/types";
import { useSession } from "@/state/session";
import { getChain } from "@/lib/chains";
import { truncate } from "@/lib/address";
import { VERDICT_STYLE } from "@/lib/verdict";
import { Dialog } from "./ui/dialog";
import { Button } from "./ui/button";
import { Address } from "./Address";
import { DemoBadge, EmptyState } from "./States";
import { TransactionStatus } from "./TransactionStatus";
import { cn } from "@/lib/utils";

type Item = { kind: "check"; at: number; rec: CheckRecord } | { kind: "send"; at: number; tx: SendRecord };

function VerdictPill({ v }: { v: CheckRecord["result"]["verdict"] }) {
  const { t } = useTranslation();
  const st = VERDICT_STYLE[v];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium", st.soft, st.text)}>
      <st.icon size={11} aria-hidden /> {t(`verdict.${v}.label`)}
    </span>
  );
}

export function TransactionHistory() {
  const { t, i18n } = useTranslation();
  const nav = useNavigate();
  const { checks, sends } = useSession();
  const [tab, setTab] = useState("all");
  const [sel, setSel] = useState<Item | null>(null);

  const items = useMemo<Item[]>(
    () => [...checks.map((rec) => ({ kind: "check" as const, at: rec.createdAt, rec })), ...sends.map((tx) => ({ kind: "send" as const, at: tx.createdAt, tx }))].sort((a, b) => b.at - a.at),
    [checks, sends],
  );
  const shown = items.filter((i) => tab === "all" || (tab === "checked" ? i.kind === "check" : i.kind === "send"));
  const when = (ms: number) => new Date(ms).toLocaleString(i18n.language, { dateStyle: "medium", timeStyle: "short" });

  return (
    <div>
      <Tabs.Root value={tab} onValueChange={setTab}>
        <Tabs.List aria-label={t("history.title")} className="mb-3 grid grid-cols-3 rounded-[10px] border border-border bg-surface p-0.5">
          {(["all", "checked", "sent"] as const).map((k) => (
            <Tabs.Trigger key={k} value={k} className="min-h-10 rounded-[8px] text-sm text-fg-muted data-[state=active]:bg-primary data-[state=active]:font-medium data-[state=active]:text-white">
              {t(`history.tabs.${k}`)}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      <p className="mb-3 text-xs text-fg-muted" data-testid="session-note">{t("history.sessionNote")}</p>
      {(["all", "checked", "sent"] as const).map((k) => (
        <Tabs.Content key={k} value={k} className="outline-none">
      {k !== tab ? null : shown.length === 0 ? (
        <EmptyState title={t("history.empty")} body={t("history.emptyBody")} />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface" data-testid="history-list">
          {shown.map((i) => {
            const chain = getChain(i.kind === "check" ? i.rec.chainId : i.tx.chainId);
            const addr = i.kind === "check" ? i.rec.destination : i.tx.to;
            return (
              <li key={i.kind === "check" ? i.rec.id : i.tx.id}>
                <button type="button" onClick={() => setSel(i)} className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted" data-testid={`history-${i.kind}`}>
                  {(() => {
                    const v = i.kind === "check" ? i.rec.result.verdict : i.tx.verdict;
                    const st = v ? VERDICT_STYLE[v] : null;
                    const Icon = i.kind === "send" ? ArrowUpRight : st ? st.icon : ScanSearch;
                    return (
                      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", st ? cn(st.soft, st.text) : "bg-muted text-fg-muted")} aria-hidden>
                        <Icon size={18} />
                      </span>
                    );
                  })()}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-sm">{truncate(addr)}</span>
                      {i.kind === "check" ? <VerdictPill v={i.rec.result.verdict} /> : i.tx.verdict && <VerdictPill v={i.tx.verdict} />}
                    </span>
                    <span className="block text-xs text-fg-muted">
                      {i.kind === "check" ? t("history.check") : t("history.transfer")} · {chain.short} · {when(i.at)}
                    </span>
                  </span>
                  <span className="text-right text-xs">
                    {i.kind === "send" ? (
                      <>
                        <span className="block font-mono">-{i.tx.amount} {chain.symbol}</span>
                        <span className="text-fg-muted">{t(`tx.${i.tx.status}`)}</span>
                      </>
                    ) : (
                      <span className="text-fg-muted">—</span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
        </Tabs.Content>
      ))}
      </Tabs.Root>
      <Dialog open={Boolean(sel)} onOpenChange={(o) => !o && setSel(null)} title={t("history.details")}>
        {sel?.kind === "check" && (
          <div className="space-y-3 text-sm">
            <p className="flex flex-wrap items-center gap-2">
              <VerdictPill v={sel.rec.result.verdict} /> {sel.rec.demo && <DemoBadge />}
            </p>
            <Address value={sel.rec.destination} />
            <p className="text-fg-muted">{getChain(sel.rec.chainId).name} · {when(sel.rec.createdAt)}</p>
            <p className="rounded-xl bg-muted p-3">{t("history.notTransfer")}</p>
            <Button className="w-full" onClick={() => nav(`/analysis/${sel.rec.id}`)}>
              {t("history.openAnalysis")}
            </Button>
          </div>
        )}
        {sel?.kind === "send" && (
          <div className="space-y-3 text-sm">
            <Address value={sel.tx.to} />
            <p className="text-fg-muted">
              {sel.tx.amount} {getChain(sel.tx.chainId).symbol} · {getChain(sel.tx.chainId).name}
            </p>
            <TransactionStatus tx={sel.tx} />
            {sel.tx.hash && (
              <a href={`${getChain(sel.tx.chainId).explorer}/tx/${sel.tx.hash}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 text-primary-ink">
                {t("tx.view")} <ExternalLink size={13} />
              </a>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}
