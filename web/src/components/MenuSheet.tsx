import { useNavigate } from "react-router-dom";
import { ChevronRight, Globe, GraduationCap, Handshake, Info, Layers, Phone, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Sheet } from "./ui/sheet";
import { BrandLogo } from "./BrandLogo";

type Item = { icon: LucideIcon; label: string; to: string };

/** Storyboard 2: logo + close, Products, Company, language switch. */
export function MenuSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t, i18n } = useTranslation();
  const nav = useNavigate();
  const go = (to: string) => {
    onOpenChange(false);
    nav(to);
  };
  const products: Item[] = [
    { icon: Sparkles, label: t("menu.consult"), to: "/consult" },
    { icon: Layers, label: t("menu.api"), to: "/api" },
    { icon: GraduationCap, label: t("menu.learn"), to: "/learn" },
  ];
  const company: Item[] = [
    { icon: Info, label: t("menu.about"), to: "/about" },
    { icon: Handshake, label: t("menu.partners"), to: "/partnerships" },
    { icon: ShieldCheck, label: t("menu.legal"), to: "/privacy" },
    { icon: Phone, label: t("menu.contact"), to: "/contact" },
  ];
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t("menu.title")} hideTitle closeLabel={t("menu.close")} testId="menu-sheet">
      <div className="flex justify-center pb-3 pt-2">
        <BrandLogo size="md" />
      </div>
      <nav aria-label={t("menu.title")}>
        <p className="mb-1 mt-2 text-[13px] font-medium text-fg">{t("menu.products")}</p>
        <ul>
          {products.map((p) => (
            <li key={p.to}>
              <button type="button" onClick={() => go(p.to)} className="flex min-h-12 w-full items-center gap-3 rounded-xl px-1 text-left text-[16px] hover:bg-muted">
                <p.icon size={22} strokeWidth={1.75} className="text-[#2BA6D3]" fill="#3FB6D9" fillOpacity={0.2} aria-hidden />
                {p.label}
              </button>
            </li>
          ))}
        </ul>
        <hr className="my-3 border-border" />
        <p className="mb-1 text-[13px] font-medium text-fg">{t("menu.company")}</p>
        <ul>
          {company.map((c) => (
            <li key={c.to}>
              <button type="button" onClick={() => go(c.to)} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-1 text-left text-[15px] hover:bg-muted">
                <c.icon size={18} strokeWidth={1.75} className="text-fg-muted" aria-hidden />
                <span className="flex-1">{c.label}</span>
                <ChevronRight size={16} className="text-fg-muted" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-4 flex items-center gap-1 rounded-full border border-border p-1" role="group" aria-label={t("menu.language")}>
        <Globe size={18} className="mx-2 shrink-0 text-fg-muted" aria-hidden />
        {(["th", "en"] as const).map((l) => (
          <button
            key={l}
            type="button"
            aria-pressed={i18n.language === l}
            onClick={() => i18n.changeLanguage(l)}
            className="min-h-10 flex-1 rounded-full text-sm text-fg-muted aria-pressed:bg-muted aria-pressed:font-medium aria-pressed:text-fg"
          >
            {l === "th" ? "ไทย" : "English"}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
