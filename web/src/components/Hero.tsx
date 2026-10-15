import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, FileSearch, Megaphone, ShieldOff, Wallet, ScanSearch, Scale } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BrandLogo } from "./BrandLogo";
import { GlobeNetwork } from "./GlobeNetwork";
import { DUR, EASE } from "@/lib/motion";

export function TrustIndicators() {
  const { t } = useTranslation();
  const chips = [
    { icon: Megaphone, k: "warn" },
    { icon: ShieldOff, k: "nodata" },
    { icon: FileSearch, k: "evidence" },
  ] as const;
  return (
    <ul className="grid w-full max-w-[420px] grid-cols-3 gap-2" aria-label="trust">
      {chips.map((c) => (
        <li key={c.k} className="flex flex-col items-center px-1 text-center">
          <c.icon size={22} strokeWidth={1.6} className="mb-1.5 text-fg" aria-hidden />
          <span className="text-[13px] font-medium leading-tight">{t(`hero.chips.${c.k}`)}</span>
          <span className="mt-0.5 text-[11px] leading-tight text-fg-muted">{t(`hero.chipsSub.${c.k}`)}</span>
        </li>
      ))}
    </ul>
  );
}

export function Hero() {
  const { t } = useTranslation();
  const steps = [
    { icon: Wallet, k: "connect" },
    { icon: ScanSearch, k: "check" },
    { icon: Scale, k: "decide" },
  ] as const;
  const fade = (d: number) => ({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: DUR.page, delay: d, ease: EASE } });

  return (
    <>
      <section className="relative overflow-hidden bg-surface">
        <div className="relative z-10 mx-auto flex max-w-[1100px] flex-col items-center px-4 pt-12 text-center">
          <motion.p {...fade(0)} className="font-display text-[12.5px] text-fg">
            {t("brand.eyebrow")} <span aria-hidden>•</span>
          </motion.p>
          <motion.div {...fade(0.05)} className="mt-1">
            <BrandLogo size="xl" />
          </motion.div>
          <motion.h1 {...fade(0.1)} className="mt-1 font-display text-[23px] font-bold leading-tight tracking-[-0.01em] sm:text-[32px]">
            {t("brand.tagline")}
          </motion.h1>
        </div>
        <div className="relative mx-auto -mt-2 max-w-[760px] [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] sm:[mask-image:linear-gradient(to_right,transparent,black_18%,black_82%,transparent)]">
          <GlobeNetwork className="block w-full" />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-surface via-surface/70 to-transparent" />
      </section>
      <section className="relative z-10 mx-auto -mt-24 flex max-w-[1100px] flex-col items-center gap-6 px-4 pb-8">
        <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} className="w-full max-w-[420px]">
          <Link
            to="/send"
            data-testid="hero-cta"
            className="flex min-h-16 w-full items-center justify-between gap-3 rounded-[14px] bg-primary px-5 py-3 text-center text-white shadow-[0_6px_18px_-6px_rgba(59,111,216,0.6)] transition-colors hover:bg-primary-hover"
          >
            <span className="w-5" aria-hidden />
            <span>
              <span className="block text-[17px] font-semibold leading-tight">{t("hero.cta")}</span>
              <span className="block text-[13px] text-white">{t("hero.ctaSub")}</span>
            </span>
            <ArrowRight size={20} />
          </Link>
        </motion.div>
        <TrustIndicators />
      </section>
      <section className="mx-auto max-w-[1100px] px-4 pb-10 pt-8" aria-labelledby="how">
        <h2 id="how" className="mb-4 text-center font-display text-lg font-semibold">
          {t("hero.howTitle")}
        </h2>
        <ol className="mx-auto grid max-w-[900px] gap-3 sm:grid-cols-3">
          {steps.map((s, i) => (
            <motion.li key={s.k} whileHover={{ y: -2 }} className="flex gap-3 rounded-2xl border border-border bg-surface p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted font-display font-semibold text-primary-ink">{i + 1}</span>
              <span>
                <span className="flex items-center gap-1.5 font-medium">
                  <s.icon size={16} /> {t(`hero.steps.${s.k}.title`)}
                </span>
                <span className="mt-0.5 block text-sm text-fg-muted">{t(`hero.steps.${s.k}.body`)}</span>
              </span>
            </motion.li>
          ))}
        </ol>
      </section>
    </>
  );
}
