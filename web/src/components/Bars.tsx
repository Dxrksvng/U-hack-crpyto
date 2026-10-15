import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ChevronLeft, History, Menu, Send, Settings, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUI } from "@/state/ui";
import { cn } from "@/lib/utils";

/** Page-level top bar used by screens that replace the global header (storyboard 8, 9, 11, 12). */
export function TopBar({ title, left = "back", right, center = false }: { title: string; left?: "back" | "menu"; right?: ReactNode; center?: boolean }) {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { setMenuOpen } = useUI();
  return (
    <div className="sticky top-0 z-30 border-b border-border/60 bg-surface/95 backdrop-blur">
      <div className="mx-auto grid h-14 max-w-[480px] grid-cols-[44px_1fr_44px] items-center px-2">
        {left === "back" ? (
          <button type="button" onClick={() => (window.history.length > 1 ? nav(-1) : nav("/"))} aria-label={t("common.back")} className="grid h-11 w-11 place-items-center rounded-full hover:bg-muted">
            <ChevronLeft size={22} />
          </button>
        ) : (
          <button type="button" onClick={() => setMenuOpen(true)} aria-label={t("header.menu")} data-testid="menu-button" className="grid h-11 w-11 place-items-center rounded-full hover:bg-muted">
            <Menu size={22} />
          </button>
        )}
        <h1 className={cn("truncate font-display text-[17px] font-semibold", center ? "text-center" : "pl-1")}>{title}</h1>
        <div className="flex justify-end">{right}</div>
      </div>
    </div>
  );
}

/** Bottom tab bar (storyboard 4): Send · History · BridgeConsult · Settings. */
export function BottomNav() {
  const { t } = useTranslation();
  const tabs = [
    { to: "/send", icon: Send, label: t("nav.send") },
    { to: "/history", icon: History, label: t("nav.history") },
    { to: "/consult", icon: Sparkles, label: t("nav.consult") },
    { to: "/settings", icon: Settings, label: t("nav.settings") },
  ];
  return (
    <nav aria-label={t("nav.label")} className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur" data-testid="bottom-nav">
      <ul className="mx-auto grid h-16 max-w-[480px] grid-cols-4">
        {tabs.map((tb) => (
          <li key={tb.to}>
            <NavLink to={tb.to} className={({ isActive }) => cn("flex h-full flex-col items-center justify-center gap-1 text-[11px]", isActive ? "text-primary-ink" : "text-fg-muted hover:text-fg")}>
              <tb.icon size={21} strokeWidth={1.8} aria-hidden />
              {tb.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
