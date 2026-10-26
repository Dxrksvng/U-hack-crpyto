import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";
import { useSession } from "@/state/session";
import { ConsultChat, ChatMessage } from "@/components/ConsultChat";
import { Address } from "@/components/Address";
import { DemoBadge } from "@/components/States";
import { Sparkles } from "lucide-react";
import { getChain } from "@/lib/chains";

/** Screen 10: BridgeConsult assistant. Uses the selected check, falling back to the latest session check. */
export default function Consult() {
  const { t } = useTranslation();
  const { current, checks } = useSession();
  const rec = current ?? checks[0] ?? null;
  const nkr = rec?.result.verdict === "NO_KNOWN_RISK";
  return (
    <div className="mx-auto w-full max-w-[480px] px-4 py-5">
      <div className="mb-4 flex items-center gap-3">
        <Sparkles size={30} strokeWidth={1.6} className="text-[#2BA6D3]" fill="#3FB6D9" fillOpacity={0.2} aria-hidden />
        <div>
          <h1 className="font-display text-xl font-semibold leading-tight">{t("consult.title")}</h1>
          <p className="text-sm text-fg-muted">{t("consult.subtitle")}</p>
        </div>
      </div>
      <p className="mb-4 flex items-start gap-2 rounded-xl bg-muted p-3 text-xs text-fg-muted" data-testid="consult-mode">
        <Info size={14} className="mt-0.5 shrink-0" /> {t("consult.mode")}
      </p>
      <ConsultChat
        rec={rec}
        allowReport
        variant="pill"
        quick={nkr ? ["whyNone", "sources", "limits", "checkMore", "wrongSend"] : ["why", "explain", "continue", "verify", "poisoning"]}
        intro={
          <ChatMessage from="bot">
            <div className="rounded-2xl rounded-tl-md bg-muted px-3.5 py-2.5 text-sm">
              {rec ? (
                <span className="flex flex-wrap items-center gap-1">
                  {t("consult.contextFor")} <Address value={rec.destination} /> · {getChain(rec.chainId).short} · {t(`verdict.${rec.result.verdict}.label`)}
                  {rec.demo && <DemoBadge />}
                </span>
              ) : (
                t("consult.contextNone")
              )}
            </div>
            {nkr && (
              <p className="mt-2 rounded-2xl rounded-tl-md bg-muted px-3.5 py-2.5 text-sm" data-testid="nkr-intro">
                {t("consult.nkrIntro")}
              </p>
            )}
          </ChatMessage>
        }
      />
    </div>
  );
}
