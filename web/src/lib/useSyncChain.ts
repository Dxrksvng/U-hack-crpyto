import { useAccount, useSwitchChain } from "wagmi";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useSession } from "@/state/session";

/** Selecting a chain updates app state (invalidating checks) and, if connected, asks the wallet to switch. */
export function useSyncChain() {
  const { t } = useTranslation();
  const { setChainId } = useSession();
  const { isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  return (id: number) => {
    setChainId(id);
    if (isConnected)
      switchChain({ chainId: id }, { onError: () => toast.error(t("wallet.switchFailed")) });
  };
}
