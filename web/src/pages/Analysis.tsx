import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSession } from "@/state/session";
import { ConsultChat, ChatMessage } from "@/components/ConsultChat";
import { VerdictCard } from "@/components/VerdictCard";
import { Address } from "@/components/Address";
import { EmptyState } from "@/components/States";
import { Button } from "@/components/ui/button";

export function CheckNotFound() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto w-full max-w-[480px] px-4 py-8">
      <EmptyState title={t("analysis.notFound")} body={t("analysis.notFoundBody")} action={<Button asChild><Link to="/send">{t("preview.goSend")}</Link></Button>} />
    </div>
  );
}

/** Screen 07: chat-style analysis result for one check. */
export default function Analysis() {
  const { t, i18n } = useTranslation();
  const { checkId = "" } = useParams();
  const nav = useNavigate();
  const rec = useSession().getCheck(checkId);
  if (!rec) return <CheckNotFound />;
  const time = new Date(rec.result.checked_at).toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="mx-auto w-full max-w-[480px] px-4 py-5">
      <ConsultChat
        rec={rec}
        allowReport
        quick={rec.result.verdict === "NO_KNOWN_RISK" ? ["whyNone", "sources", "limits", "checkMore", "wrongSend"] : ["why", "continue", "verify"]}
        intro={
          <ChatMessage from="bot" time={time}>
            <p className="mb-3 text-[15px] leading-snug">
              {t("analysis.intro")} <Address value={rec.destination} className="align-middle" />
            </p>
            <VerdictCard rec={rec} />
            <div className="mt-2 flex flex-wrap gap-2">
              <Button variant="link" className="h-11 px-0 text-primary-ink no-underline" onClick={() => nav(`/analysis/${rec.id}/details`)}>
                {t("analysis.details")} <ArrowRight size={14} />
              </Button>
            </div>
          </ChatMessage>
        }
      />
    </div>
  );
}
