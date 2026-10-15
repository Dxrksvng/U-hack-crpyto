import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getSnapStatus, installSnap, type SnapStatus } from "@/lib/snap";
import { Button } from "./ui/button";

/**
 * Optional card on Settings. Explains that wallet connection and Snap installation are
 * separate, and shows the Snap status. Does not change the existing transaction flow.
 */
export function SnapInstall() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<SnapStatus>("checking");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSnapStatus().then((s) => !cancelled && setStatus(s));
    return () => {
      cancelled = true;
    };
  }, []);

  const onInstall = async () => {
    setBusy(true);
    setStatus(await installSnap());
    setBusy(false);
  };

  return (
    <section className="rounded-lg border p-4" aria-labelledby="snap-install-title" data-testid="snap-install">
      <h2 id="snap-install-title" className="text-sm font-semibold">
        {t("snap.title")}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">{t("snap.explain")}</p>
      <p className="mt-2 text-xs" data-testid="snap-status">
        {t(`snap.status.${status}`)}
      </p>
      {status !== "installed" && status !== "checking" ? (
        <Button className="mt-3 w-full" variant="outline" disabled={busy || status === "no_provider"} onClick={onInstall} data-testid="snap-install-button">
          {busy ? t("snap.installing") : t("snap.install")}
        </Button>
      ) : null}
    </section>
  );
}
