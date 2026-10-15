import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageTitle } from "@/components/States";
import { Button } from "@/components/ui/button";

export const INFO_PAGES = ["learn", "about", "partnerships", "privacy", "terms", "contact", "api", "help"] as const;
export type InfoSlug = (typeof INFO_PAGES)[number];

/** Clearly-labelled informational pages (no dead links). */
export default function Info({ slug }: { slug: InfoSlug | "notfound" }) {
  const { t } = useTranslation();
  const nav = useNavigate();
  if (slug === "notfound")
    return (
      <div className="mx-auto max-w-[480px] px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold">404</h1>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/">{t("common.home")}</Link>
        </Button>
      </div>
    );
  return (
    <div className="mx-auto w-full max-w-[640px] px-4 py-5">
      <PageTitle title={t(`info.${slug}.title`)} back={() => nav(-1)} />
      <article className="rounded-2xl border border-border bg-surface p-5 text-[15px] leading-relaxed">{t(`info.${slug}.body`)}</article>
    </div>
  );
}
