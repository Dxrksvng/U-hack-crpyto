import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronRight, FileText, Flag, Globe, HelpCircle, Lock, Moon, Phone, Sun, Tag } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAppKit } from "@reown/appkit/react";
import { useAccount, useDisconnect } from "wagmi";
import { useSession } from "@/state/session";
import { useTheme } from "@/state/theme";
import { useUI } from "@/state/ui";
import { CHAINS } from "@/lib/chains";
import { truncate } from "@/lib/address";
import { Identicon } from "./Identicon";
import { Button } from "./ui/button";
import { ReportAddressDialog } from "./Dialogs";

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-1.5 px-1 text-[13px] font-medium text-fg">{title}</h2>
      <div className="divide-y divide-border overflow-hidden rounded-[16px] border border-border bg-surface">{children}</div>
    </section>
  );
}
type RowProps = { icon: typeof Globe; label: string; value?: ReactNode; onClick?: () => void; testId?: string; ariaLabel?: string };
function Row({ icon: Icon, label, value, onClick, testId, ariaLabel }: RowProps) {
  const inner = (
    <>
      <Icon size={18} strokeWidth={1.75} className="shrink-0 text-fg-muted" aria-hidden />
      <span className="flex-1 text-left text-[15px]">{label}</span>
      {value != null && <span className="text-sm text-fg-muted">{value}</span>}
      {onClick && <ChevronRight size={16} className="text-fg-muted" aria-hidden />}
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} data-testid={testId} aria-label={ariaLabel} className="flex min-h-12 w-full items-center gap-3 px-4 py-2 hover:bg-muted">
      {inner}
    </button>
  ) : (
    <div className="flex min-h-12 items-center gap-3 px-4 py-2" data-testid={testId}>
      {inner}
    </div>
  );
}

/** Storyboard 12. No fake notification switch: notifications are not implemented in this release. */
export function SettingsPanel() {
  const { t, i18n } = useTranslation();
  const nav = useNavigate();
  const { open } = useAppKit();
  const { setWalletOpen } = useUI();
  const { address, chainId, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { theme, setTheme } = useTheme();
  const { checks } = useSession();
  const [report, setReport] = useState(false);
  const last = checks[0];
  const walletChain = CHAINS.find((c) => c.id === chainId);
  const nextLang = i18n.language === "th" ? "en" : "th";

  return (
    <div className="space-y-5">
      <Group title={t("settings.account")}>
        {isConnected && address ? (
          <>
            <button type="button" onClick={() => open({ view: "Account" })} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted">
              <Identicon address={address} className="h-11 w-11" />
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-[15px]">{truncate(address, 2, 4)}</span>
                <span className="flex items-center gap-1 text-xs text-fg-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-ok" aria-hidden /> {t("header.connected")} · {walletChain ? walletChain.short : t("wallet.unsupported")}
                </span>
              </span>
              <ChevronRight size={16} className="text-fg-muted" aria-hidden />
            </button>
            <div className="px-4 py-3">
              <Button variant="destructiveOutline" className="w-full" onClick={() => disconnect()} data-testid="disconnect">
                {t("settings.disconnect")}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-sm text-fg-muted">{t("settings.notConnected")}</span>
            <Button size="sm" onClick={() => setWalletOpen(true)}>
              {t("settings.connect")}
            </Button>
          </div>
        )}
      </Group>
      <Group title={t("settings.preferences")}>
        <Row icon={Globe} label={t("settings.language")} value={t("settings2.languageValue")} onClick={() => i18n.changeLanguage(nextLang)} testId="language-row" />
        <Row
          icon={theme === "dark" ? Moon : Sun}
          label={t("settings.appearance")}
          value={theme === "dark" ? t("settings2.appearanceDark") : t("settings2.appearanceLight")}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          testId="appearance-row"
        />
        <Row icon={Bell} label={t("settings2.notifications")} value={t("settings2.notificationsValue")} />
      </Group>
      <Group title={t("settings.support")}>
        <Row icon={HelpCircle} label={t("settings.help")} onClick={() => nav("/help")} />
        <Row
          icon={Flag}
          label={t("settings.report")}
          testId="settings-report"
          onClick={() => {
            if (last) setReport(true);
            else toast(t("settings.reportNeedCheck"));
          }}
        />
        <Row icon={Phone} label={t("settings.contact")} onClick={() => nav("/contact")} />
      </Group>
      <Group title={t("settings.about")}>
        <Row icon={FileText} label={t("settings.terms")} onClick={() => nav("/terms")} />
        <Row icon={Lock} label={t("settings.privacy")} onClick={() => nav("/privacy")} />
        <Row icon={Tag} label={t("settings.version")} value={<span className="font-mono text-xs">{__APP_VERSION__}</span>} />
      </Group>
      {last && <ReportAddressDialog open={report} onOpenChange={setReport} address={last.destination} chainId={last.chainId} />}
    </div>
  );
}
