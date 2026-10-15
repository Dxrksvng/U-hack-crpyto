import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { SendHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CheckRecord } from "@/domain/types";
import { answerFree, answerQuick, type Answer, type AnswerKind, type QuickId } from "@/lib/consult";
import { DUR } from "@/lib/motion";
import { LogoAvatar } from "./BrandLogo";
import { QuickReplies, type QuickKey } from "./QuickReplies";
import { ReportAddressDialog } from "./Dialogs";
import { cn } from "@/lib/utils";

type Msg = { id: number; from: "user" | "bot"; text: string; kind?: AnswerKind };

const KIND_STYLE: Record<AnswerKind, string> = {
  fact: "bg-primary/10 text-primary-ink",
  education: "bg-muted text-fg-muted",
  unknown: "bg-warning-soft text-warning-ink",
};

export function ChatMessage({ from, kind, children, time }: { from: "user" | "bot"; kind?: AnswerKind; children: ReactNode; time?: string }) {
  const { t } = useTranslation();
  if (from === "user")
    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: DUR.standard }} className="ml-auto w-fit max-w-[85%] whitespace-pre-line rounded-2xl rounded-tr-md bg-primary px-3.5 py-2 text-sm text-white shadow-sm" data-testid="msg-user">
        {children}
      </motion.div>
    );
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: DUR.standard }} className="flex gap-2.5" data-testid="msg-bot">
      <LogoAvatar />
      <div className="min-w-0 flex-1">
        <p className="mb-1 flex items-center gap-2 text-xs">
          <span className="text-[15px] font-medium">{t("consult.name")}</span>
          {time && <span className="text-fg-muted">{time}</span>}
          {kind && <span className={cn("rounded px-1.5 py-px text-[10.5px] font-medium", KIND_STYLE[kind])} data-testid="answer-kind" data-kind={kind}>{t(`consult.kinds.${kind}`)}</span>}
        </p>
        {children}
      </div>
    </motion.div>
  );
}

type Props = { rec: CheckRecord | null; intro?: ReactNode; quick: QuickKey[]; allowReport?: boolean; variant?: "chip" | "pill" };

/** Evidence-grounded chat. Deterministic templated answers; facts only from `rec`. */
export function ConsultChat({ rec, intro, quick, allowReport, variant = "chip" }: Props) {
  const { t, i18n } = useTranslation();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [thinking, setThinking] = useState(false);
  const [report, setReport] = useState(false);
  const next = useRef(1);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMsgs([]);
  }, [rec?.id]);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [msgs.length, thinking]);

  const ask = (text: string, answer: () => Answer) => {
    if (thinking) return;
    setMsgs((m) => [...m, { id: next.current++, from: "user", text }]);
    setThinking(true);
    setTimeout(() => {
      const a = answer();
      setMsgs((m) => [...m, { id: next.current++, from: "bot", text: a.text, kind: a.kind }]);
      setThinking(false);
    }, 450);
  };
  const onQuick = (k: QuickKey) => {
    if (k === "report") return setReport(true);
    ask(t(`consult.quick.${k}`), () => answerQuick(k as QuickId, rec, t, i18n.language));
  };

  return (
    <div className="space-y-4">
      {intro}
      {variant === "chip" && <QuickReplies keys={allowReport && rec ? [...quick, "report"] : quick} onPick={onQuick} disabled={thinking} />}
      <div className="space-y-4" role="log" aria-live="polite">
        {msgs.map((m) => (
          <ChatMessage key={m.id} from={m.from} kind={m.kind}>
            {m.from === "bot" ? <p className="whitespace-pre-line rounded-2xl rounded-tl-md border border-border bg-surface px-3.5 py-2.5 text-sm shadow-[0_2px_10px_-6px_rgba(15,23,41,0.2)]">{m.text}</p> : m.text}
          </ChatMessage>
        ))}
        {thinking && (
          <ChatMessage from="bot">
            <p className="inline-flex items-center gap-1 rounded-2xl bg-muted px-3.5 py-2.5 text-sm text-fg-muted" aria-label={t("consult.thinking")}>
              {[0, 1, 2].map((i) => (
                <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-fg-muted" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }} />
              ))}
            </p>
          </ChatMessage>
        )}
      </div>
      {variant === "pill" && <QuickReplies variant="pill" keys={allowReport && rec ? [...quick, "report"] : quick} onPick={onQuick} disabled={thinking} />}
      <div ref={end} />
      <form
        className="sticky bottom-3 z-10 rounded-[14px] border border-border bg-surface p-2 shadow-[0_8px_24px_-12px_rgba(15,23,41,0.3)]"
        onSubmit={(e) => {
          e.preventDefault();
          const v = q.trim();
          if (!v || thinking) return;
          setQ("");
          ask(v, () => answerFree(v, rec, t, i18n.language));
        }}
      >
        <div className="flex items-center gap-1">
          <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={500} placeholder={t("consult.ask")} aria-label={t("consult.ask")} data-testid="chat-input" className="h-11 min-w-0 flex-1 bg-transparent px-2 text-sm outline-none" />
          <button type="submit" aria-label={t("consult.sendMsg")} disabled={!q.trim() || thinking} data-testid="chat-send" className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-white transition-colors hover:bg-primary-hover disabled:bg-muted disabled:text-fg-muted">
            <SendHorizontal size={17} />
          </button>
        </div>
      </form>
      {rec && <ReportAddressDialog open={report} onOpenChange={setReport} address={rec.destination} chainId={rec.chainId} />}
    </div>
  );
}
