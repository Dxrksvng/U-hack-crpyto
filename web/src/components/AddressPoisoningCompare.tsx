import { motion } from "framer-motion";
import { Fingerprint } from "lucide-react";
import { useTranslation } from "react-i18next";

function Diff({ a, b }: { a: string; b: string }) {
  return (
    <span className="break-all font-mono text-[13px] leading-6">
      {a.split("").map((ch, i) =>
        ch.toLowerCase() !== (b[i] ?? "").toLowerCase() ? (
          <mark key={i} className="rounded-sm bg-critical-soft font-semibold text-critical-ink underline decoration-2">
            {ch}
          </mark>
        ) : (
          <span key={i}>{ch}</span>
        ),
      )}
    </span>
  );
}

export function AddressPoisoningCompare({ pasted, recent }: { pasted: string; recent: string }) {
  const { t } = useTranslation();
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} role="alert" data-testid="poisoning" className="rounded-2xl border border-warning bg-warning-soft p-4">
      <p className="flex items-center gap-2 font-medium text-warning-ink">
        <Fingerprint size={18} /> [T0] {t("poison.title")}
      </p>
      <p className="mt-1 text-sm">{t("poison.body")}</p>
      <dl className="mt-3 space-y-2 rounded-xl bg-surface p-3">
        <div>
          <dt className="text-xs text-fg-muted">{t("poison.recent")}</dt>
          <dd><Diff a={recent} b={pasted} /></dd>
        </div>
        <div>
          <dt className="text-xs text-fg-muted">{t("poison.pasted")}</dt>
          <dd><Diff a={pasted} b={recent} /></dd>
        </div>
      </dl>
    </motion.div>
  );
}
