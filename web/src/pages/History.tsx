import { useTranslation } from "react-i18next";
import { TopBar } from "@/components/Bars";
import { TransactionHistory } from "@/components/TransactionHistory";

export default function History() {
  const { t } = useTranslation();
  return (
    <>
      <TopBar title={t("history.title")} left="menu" />
      <div className="mx-auto w-full max-w-[480px] px-4 py-4">
        <TransactionHistory />
      </div>
    </>
  );
}
