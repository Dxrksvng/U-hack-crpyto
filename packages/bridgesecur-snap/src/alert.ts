import type { JSXElement } from "@metamask/snaps-sdk/jsx";

/** The Snap global, available inside the Snap runtime. Narrowed to the one method used here. */
type SnapGlobal = { request: (args: { method: string; params: unknown }) => Promise<unknown> };

/**
 * Opens a CRITICAL alert dialog. Not awaited by the caller: the insight must render
 * whether or not the dialog is shown, so failures are logged and swallowed.
 */
export function showCriticalAlert(content: JSXElement): void {
  const snapGlobal = (globalThis as unknown as { snap?: SnapGlobal }).snap;
  if (!snapGlobal) return;
  snapGlobal
    .request({ method: "snap_dialog", params: { type: "alert", content } })
    .catch((error: unknown) => {
      console.log("BridgeSecur: critical alert not shown", error instanceof Error ? error.message : error);
    });
}
