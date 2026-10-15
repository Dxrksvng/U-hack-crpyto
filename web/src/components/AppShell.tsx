import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Toaster } from "sonner";
import { Header } from "./Header";
import { BottomNav } from "./Bars";
import { MenuSheet } from "./MenuSheet";
import { WalletSheet } from "./WalletSheet";
import { useUI } from "@/state/ui";
import { WalletWatcher } from "./Wallet";
import { useTheme } from "@/state/theme";
import { hasProjectId } from "@/lib/wagmi";
import { isDemoMode } from "@/lib/api";
import { DUR, EASE } from "@/lib/motion";
import Landing from "@/pages/Landing";
import Send from "@/pages/Send";
import Preview from "@/pages/Preview";
import Transaction from "@/pages/Transaction";
import Analysis from "@/pages/Analysis";
import RiskDetails from "@/pages/RiskDetails";
import Consult from "@/pages/Consult";
import History from "@/pages/History";
import Settings from "@/pages/Settings";
import Info, { INFO_PAGES } from "@/pages/Info";

function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="mx-auto max-w-[1100px] px-4 pb-24 pt-6 text-center text-xs text-fg-muted sm:pb-8">
      <p className="flex items-center justify-center gap-1.5">
        <Lock size={12} /> {t("footer.privacy")}
      </p>
      <Link to="/learn" className="mt-2 inline-flex min-h-11 items-center font-medium text-primary-ink underline underline-offset-2">
        {t("footer.learn")}
      </Link>
    </footer>
  );
}

export function AppRoutes() {
  const location = useLocation();
  const reduce = useReducedMotion();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.main
        key={location.pathname}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: DUR.standard, ease: EASE }}
      >
        <Routes location={location}>
          <Route path="/" element={<Landing />} />
          <Route path="/send" element={<Send />} />
          <Route path="/review" element={<Preview />} />
          <Route path="/preview" element={<Navigate to="/review" replace />} />
          <Route path="/transaction/:id" element={<Transaction />} />
          <Route path="/analysis/:checkId" element={<Analysis />} />
          <Route path="/analysis/:checkId/details" element={<RiskDetails />} />
          <Route path="/consult" element={<Consult />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
          {INFO_PAGES.map((p) => (
            <Route key={p} path={`/${p}`} element={<Info slug={p} />} />
          ))}
          <Route path="*" element={<Info slug="notfound" />} />
        </Routes>
      </motion.main>
    </AnimatePresence>
  );
}

// Storyboard: these screens own their top bar instead of the global header.
const OWN_TOPBAR = [/^\/history$/, /^\/settings$/, /^\/review$/, /^\/transaction\/[^/]+$/, /^\/analysis\/[^/]+\/details$/];
const WITH_TABS = ["/send", "/history", "/consult", "/settings"];

export function AppShell() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { pathname } = useLocation();
  const { menuOpen, setMenuOpen, walletOpen, setWalletOpen } = useUI();
  const ownBar = OWN_TOPBAR.some((r) => r.test(pathname));
  const tabs = WITH_TABS.includes(pathname);
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      {(!hasProjectId || isDemoMode) && (
        <p role="status" data-testid="mode-banner" className="bg-warning-soft px-4 py-1 text-center text-[10.5px] text-warning-ink">
          {!hasProjectId && t("walletCfg.banner")} {isDemoMode && t("walletCfg.demoBanner")}
        </p>
      )}
      {!ownBar && <Header />}
      <WalletWatcher />
      <div className={tabs ? "flex-1 pb-20" : "flex-1"}>
        <AppRoutes />
      </div>
      {!tabs && <Footer />}
      {tabs && <BottomNav />}
      <MenuSheet open={menuOpen} onOpenChange={setMenuOpen} />
      <WalletSheet open={walletOpen} onOpenChange={setWalletOpen} />
      <Toaster theme={theme} position="top-center" richColors closeButton />
    </div>
  );
}
