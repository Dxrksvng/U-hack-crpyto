import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { reportAddress } from "@/lib/api";
import { Dialog } from "./ui/dialog";
import { Select } from "./ui/select";
import { Button } from "./ui/button";
import { Address } from "./Address";

export function WhyVerdictDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={t("consult.whyTitle")}>
      <ol className="list-decimal space-y-2 pl-5 text-sm">
        <li>{t("consult.whyBody1")}</li>
        <li>{t("consult.whyBody2")}</li>
        <li>{t("consult.whyBody3")}</li>
      </ol>
    </Dialog>
  );
}

const REASONS = ["phishing", "fake_airdrop", "poisoning", "impersonation", "other"] as const;

export function ReportAddressDialog({ open, onOpenChange, address, chainId }: { open: boolean; onOpenChange: (o: boolean) => void; address: string; chainId: number }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState<string>("phishing");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={t("report.title")} description={t("report.explain")}>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          try {
            await reportAddress({ chainId, address, reason, note });
            setNote("");
            onOpenChange(false);
            toast.success(t("report.done"));
          } finally {
            setBusy(false);
          }
        }}
      >
        <Address value={address} />
        <div>
          <p className="mb-1.5 text-sm font-medium">{t("report.reason")}</p>
          <Select className="w-full" ariaLabel={t("report.reason")} value={reason} onValueChange={setReason} items={REASONS.map((r) => ({ value: r, label: t(`report.reasons.${r}`) }))} />
        </div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">{t("report.note")}</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={280} rows={3} placeholder={t("report.notePlaceholder")} className="w-full rounded-xl border border-border bg-surface p-3 text-sm" />
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {t("report.cancel")}
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? t("report.submitting") : t("report.submit")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
