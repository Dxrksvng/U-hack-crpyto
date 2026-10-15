/**
 * BridgeSecur MetaMask Snap helpers. Installing a Snap is a separate action from
 * connecting a wallet: connecting gives the site the account, installing gives
 * MetaMask the transaction-insight code that runs inside the native Send screen.
 */

/** Snap id. Local dev serves the Snap from localhost; set VITE_BRIDGESECUR_SNAP_ID for a published npm Snap. */
export const SNAP_ID =
  (import.meta.env.VITE_BRIDGESECUR_SNAP_ID as string | undefined) ?? "local:http://localhost:8080";

/** Minimal shape of the EIP-1193 provider that MetaMask injects. */
type Eip1193 = { request: (args: { method: string; params?: unknown }) => Promise<unknown> };

export type SnapStatus = "checking" | "no_provider" | "not_installed" | "installed" | "error";

function provider(): Eip1193 | null {
  const eth = (window as unknown as { ethereum?: Eip1193 }).ethereum;
  return eth && typeof eth.request === "function" ? eth : null;
}

/** Reads whether this Snap is installed in the injected MetaMask. Read-only: never prompts. */
export async function getSnapStatus(): Promise<SnapStatus> {
  const eth = provider();
  if (!eth) return "no_provider";
  try {
    const snaps = (await eth.request({ method: "wallet_getSnaps" })) as Record<string, { id: string }> | undefined;
    return snaps && snaps[SNAP_ID] ? "installed" : "not_installed";
  } catch {
    return "error";
  }
}

/** Asks MetaMask to install the Snap. Must be called from a user click. MetaMask shows its own confirmation. */
export async function installSnap(): Promise<SnapStatus> {
  const eth = provider();
  if (!eth) return "no_provider";
  try {
    await eth.request({ method: "wallet_requestSnaps", params: { [SNAP_ID]: {} } });
    return getSnapStatus();
  } catch {
    return "error";
  }
}
