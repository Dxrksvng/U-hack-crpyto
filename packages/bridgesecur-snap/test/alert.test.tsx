import { afterEach, describe, expect, it, vi } from "vitest";
import { onTransaction } from "../src/index";
import { DEMO_ADDRESSES } from "../src/risk/mockProvider";
import { assertJSXElement } from "@metamask/snaps-sdk/jsx";

const tx = (to: string) => ({ from: "0x0000000000000000000000000000000000000001", to, nonce: "0x0", value: "0x1", data: "0x", gas: "0x5208", maxFeePerGas: "0x1", maxPriorityFeePerGas: "0x1", estimateSuggested: "0x1", estimateUsed: "0x1" });
const SEPOLIA = "eip155:11155111" as const;

type G = { snap?: { request: ReturnType<typeof vi.fn> } };
afterEach(() => {
  delete (globalThis as unknown as G).snap;
});

describe("CRITICAL pop-up via snap_dialog", () => {
  it("opens an alert dialog for CRITICAL and still returns the insight", async () => {
    const request = vi.fn().mockResolvedValue(null);
    (globalThis as unknown as G).snap = { request };
    const out = await onTransaction({ transaction: tx(DEMO_ADDRESSES.CRITICAL) as never, chainId: SEPOLIA });
    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls[1]?.[0]).toMatchObject({ method: "snap_dialog", params: { type: "alert" } });
    assertJSXElement(request.mock.calls[1]?.[0].params.content);
    const alert = JSON.stringify(request.mock.calls[1]?.[0]);
    expect(alert).toContain("BRIDGEˣ");
    expect(alert).toContain("CRITICAL SECURITY ALERT");
    expect(alert).toContain("Listed in the demo sanctions fixture");
    expect(alert).toContain("Closing this alert does not cancel or approve it");
    expect(alert).not.toContain("Money Laundering");
    expect(alert).not.toContain("matches the demo critical fixture");
    expect(out).toHaveProperty("content");
    expect(out).toHaveProperty("severity", "critical");
  });

  it.each([DEMO_ADDRESSES.WARNING, DEMO_ADDRESSES.NO_KNOWN_RISK])("does not open a dialog for %s", async (to) => {
    const request = vi.fn().mockResolvedValue(null);
    (globalThis as unknown as G).snap = { request };
    await onTransaction({ transaction: tx(to) as never, chainId: SEPOLIA });
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0]?.[0].method).toBe("snap_createInterface");
  });

  it("still returns the insight when the dialog is rejected", async () => {
    (globalThis as unknown as G).snap = { request: vi.fn().mockRejectedValue(new Error("dialog blocked")) };
    const out = await onTransaction({ transaction: tx(DEMO_ADDRESSES.CRITICAL) as never, chainId: SEPOLIA });
    expect(out).toHaveProperty("content");
    await new Promise((r) => setTimeout(r, 0));
  });

  it("does not throw when the snap global is unavailable", async () => {
    const out = await onTransaction({ transaction: tx(DEMO_ADDRESSES.CRITICAL) as never, chainId: SEPOLIA });
    expect(out).toHaveProperty("content");
  });
});
