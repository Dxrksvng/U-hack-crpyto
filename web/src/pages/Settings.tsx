import { useTranslation } from "react-i18next";
import { TopBar } from "@/components/Bars";
import { SettingsPanel } from "@/components/SettingsPanel";
import { SnapInstall } from "@/components/SnapInstall";

export default function Settings() {
  const { t } = useTranslation();
  return (
    <>
      <TopBar title={t("settings.title")} center />
      <div className="mx-auto w-full max-w-[480px] px-4 py-4">
        <SettingsPanel />
        <div className="mt-4">
          <SnapInstall />
        </div>
      </div>
    </>
  );
}
