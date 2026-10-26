import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TopBar } from "@/components/Bars";
import { TransactionStatus } from "@/components/TransactionStatus";
import { TransactionSuccess } from "@/components/TransactionSuccess";
import { EmptyState } from "@/components/States";
import { Button } from "@/components/ui/button";
import { useTransfer } from "@/lib/useTransfer";
import { IN_FLIGHT } from "@/lib/txMachine";
import { useSession } from "@/state/session";

/** /transaction/:id. Every step shown is driven by real wallet / chain events, never by timers. */
export default function Transaction() {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const nav = useNavigate();
  const s = useSession();
  const { active, retry } = useTransfer(id);
  if (!active)
    return (
      <>
        <TopBar title={t("tx.title")} />
        <div className="mx-auto w-full max-w-[480px] px-4 py-5">
          <EmptyState title={t("preview.notReady")} body={t("preview.notReadyBody")} action={<Button asChild><Link to="/send">{t("preview.goSend")}</Link></Button>} />
        </div>
      </>
    );
  const inFlight = IN_FLIGHT.includes(active.status);
  const check = active.checkId ? s.getCheck(active.checkId) : undefined;
  return (
    <>
      <TopBar title={active.status === "confirmed" ? t("success.title") : t("tx.title")} left="menu" />
      <div className="mx-auto w-full max-w-[480px] space-y-4 px-4 py-5">
        {active.status === "confirmed" ? (
          <TransactionSuccess tx={active} checkMode={check ? check.demo ? "DEMO" : "LIVE" : undefined} />
        ) : (
          <>
            {active.status === "awaiting_approval" && (
              <div role="status" data-testid="approval-prompt" className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-center">
                <Loader2 className="mx-auto mb-2 animate-spin text-primary-ink" size={22} aria-hidden />
                <p className="font-display font-semibold">{t("tx.approvalTitle")}</p>
                <p className="mt-1 text-sm text-fg-muted">{t("tx.approvalSub")}</p>
              </div>
            )}
            <TransactionStatus
              tx={active}
              onRetry={() => {
                const next = retry();
                if (next) nav(`/transaction/${next}`, { replace: true });
              }}
            />
            {!inFlight && (
              <div className="grid gap-2">
                {active.checkId && (
                  <Button asChild variant="outline">
                    <Link to={`/analysis/${active.checkId}`}>{t("tx.openAnalysis")}</Link>
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    s.setAmount("");
                    s.setDestination("");
                    nav("/send");
                  }}
                >
                  {t("tx.newTransfer")}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
