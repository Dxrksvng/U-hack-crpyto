import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BrandLogo } from "./BrandLogo";
import { WalletConnectButton } from "./Wallet";
import { useUI } from "@/state/ui";

export function Header() {
  const { t } = useTranslation();
  const { setMenuOpen } = useUI();
  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1100px] items-center gap-1 px-3 sm:px-4">
        <button type="button" aria-label={t("header.menu")} aria-haspopup="dialog" onClick={() => setMenuOpen(true)} className="grid h-11 w-11 place-items-center rounded-full hover:bg-muted" data-testid="menu-button">
          <Menu size={24} strokeWidth={2} />
        </button>
        <Link to="/" className="flex h-11 items-center rounded-md px-1">
          <BrandLogo />
        </Link>
        <div className="ml-auto">
          <WalletConnectButton />
        </div>
      </div>
    </header>
  );
}
