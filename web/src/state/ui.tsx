import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type UI = { menuOpen: boolean; setMenuOpen: (o: boolean) => void; walletOpen: boolean; setWalletOpen: (o: boolean) => void };
const Ctx = createContext<UI | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const v = useMemo(() => ({ menuOpen, setMenuOpen, walletOpen, setWalletOpen }), [menuOpen, walletOpen]);
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}
export function useUI() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useUI outside UIProvider");
  return v;
}
