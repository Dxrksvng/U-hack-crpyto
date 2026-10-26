import { describe, expect, it } from "vitest";
import { is } from "@metamask/superstruct";
import { JsonStruct } from "@metamask/utils";
import { assertJSXElement } from "@metamask/snaps-sdk/jsx";
import { createOnTransaction, onTransaction } from "../src/index";
import { DEMO_ADDRESSES } from "../src/risk/mockProvider";
import type { RiskProvider } from "../src/risk/provider";
import type { RiskRequest, RiskResult } from "../src/risk/types";
import { FallbackInsight } from "../src/ui/fallback";

const tx = (to: string) => ({
  from: "0x0000000000000000000000000000000000000001",
  to,
  nonce: "0x0",
  value: "0x1",
  data: "0x",
  gas: "0x5208",
  maxFeePerGas: "0x1",
  maxPriorityFeePerGas: "0x1",
  estimateSuggested: "0x1",
  estimateUsed: "0x1",
});

const SEPOLIA = "eip155:11155111" as const;

/** The handler returns `{ content, severity }` here; narrow the SDK union once so assertions stay readable. */
function contentOf(out: unknown): unknown {
  if (!out || typeof out !== "object" || !("content" in out)) throw new Error("handler returned no content");
  return (out as { content: unknown }).content;
}
function severityOf(out: unknown): unknown {
  return out && typeof out === "object" && "severity" in out ? (out as { severity?: unknown }).severity : undefined;
}

/** The exact text MetaMask would receive: content serialised as JSON. Undefined props are dropped, as over JSON-RPC. */
async function insightFor(to: string, chainId: `${string}:${string}` = SEPOLIA) {
  const out = await onTransaction({ transaction: tx(to) as never, chainId });
  // MetaMask rejects non-JSON responses (e.g. `undefined` values) and crashes the Snap, so check the whole response.
  expect(is(out, JsonStruct)).toBe(true);
  assertJSXElement(contentOf(out));
  return { severity: severityOf(out), json: JSON.stringify(contentOf(out)) };
}

function providerFrom(fn: (req: RiskRequest) => unknown): RiskProvider {
  return { name: "TestProvider", analyze: async (req) => fn(req) as RiskResult };
}

describe("onTransaction output (MockRiskProvider)", () => {
  it.each([
    [DEMO_ADDRESSES.CRITICAL, "Critical risk", "critical"],
    [DEMO_ADDRESSES.WARNING, "Warning", undefined],
    [DEMO_ADDRESSES.NO_KNOWN_RISK, "No known risk", undefined],
    ["0x1234567890123456789012345678901234567890", "Inconclusive", undefined],
  ])("returns non-empty DEMO insight for %s", async (to, verdictText, severity) => {
    const r = await insightFor(to);
    expect(r.json.length).toBeGreaterThan(200);
    expect(r.json).toContain("DEMO");
    expect(r.json).toContain(verdictText);
    expect(r.json).toContain("Recommended action");
    expect(r.severity).toBe(severity);
  });

  it("shows the actual recipient exactly as the transaction supplied it", async () => {
    const mixed = "0xDEAD000000000000000000000000000000000001";
    expect((await insightFor(mixed)).json).toContain(mixed);
  });

  it("CRITICAL includes the score; NO_KNOWN_RISK shows no invented score", async () => {
    expect((await insightFor(DEMO_ADDRESSES.CRITICAL)).json).toContain("92 / 100");
    expect((await insightFor(DEMO_ADDRESSES.NO_KNOWN_RISK)).json).toContain("Score not available");
  });

  it("unsupported chain yields UNKNOWN, not an empty result", async () => {
    const r = await insightFor(DEMO_ADDRESSES.CRITICAL, "eip155:999999");
    expect(r.json).toContain("Inconclusive");
  });
});

describe("onTransaction failure paths never return empty content", () => {
  it("provider throws: returns an inconclusive DEMO insight", async () => {
    const handler = createOnTransaction({
      name: "Boom",
      analyze: async () => {
        throw new Error("network down");
      },
    });
    const out = await handler({ transaction: tx(DEMO_ADDRESSES.CRITICAL) as never, chainId: SEPOLIA });
    const json = JSON.stringify(contentOf(out));
    expect(json).toContain("did not complete");
    expect(json).toContain("network down");
    expect(severityOf(out)).toBeUndefined();
  });

  it("provider returns an unusable value: returns an inconclusive DEMO insight", async () => {
    const handler = createOnTransaction(providerFrom(() => ({ verdict: "BOGUS" })));
    const out = await handler({ transaction: tx(DEMO_ADDRESSES.CRITICAL) as never, chainId: SEPOLIA });
    expect(JSON.stringify(contentOf(out))).toContain("invalid provider result");
  });

  it("provider returns null: still returns content", async () => {
    const handler = createOnTransaction(providerFrom(() => null));
    const out = await handler({ transaction: tx(DEMO_ADDRESSES.WARNING) as never, chainId: SEPOLIA });
    expect(contentOf(out)).toBeTruthy();
  });

  it("missing recipient still produces a visible insight", async () => {
    const handler = createOnTransaction(new (await import("../src/risk/mockProvider")).MockRiskProvider());
    const out = await handler({ transaction: { ...tx(""), to: undefined } as never, chainId: SEPOLIA });
    expect(JSON.stringify(contentOf(out))).toContain("(no recipient)");
  });
});

describe("MetaMask JSON compatibility", () => {
  it.each([DEMO_ADDRESSES.CRITICAL, DEMO_ADDRESSES.WARNING, DEMO_ADDRESSES.NO_KNOWN_RISK, "0x1234567890123456789012345678901234567890"])(
    "response for %s is valid JSON with no undefined values",
    async (to) => {
      const out = await onTransaction({ transaction: tx(to) as never, chainId: SEPOLIA });
      expect(is(out, JsonStruct)).toBe(true);
      const hasSeverity = Object.keys(out ?? {}).includes("severity");
      expect(hasSeverity).toBe(to === DEMO_ADDRESSES.CRITICAL);
    },
  );
});

describe("FallbackInsight", () => {
  it("renders a plain DEMO insight with recipient and reason", () => {
    const json = JSON.stringify(FallbackInsight({ recipient: "0xabc", reason: "test reason" }));
    expect(json).toContain("DEMO / Mock Risk Data");
    expect(json).toContain("0xabc");
    expect(json).toContain("test reason");
  });
});

describe("insight layout", () => {
  it("shows the recipient shortened with the full address in the row tooltip", async () => {
    const out = await onTransaction({ transaction: tx(DEMO_ADDRESSES.CRITICAL) as never, chainId: SEPOLIA });
    const json = JSON.stringify(contentOf(out));
    expect(json).toContain(`"tooltip":"${DEMO_ADDRESSES.CRITICAL}"`);
    expect(json).toContain('"type":"Address"');
    expect(json).toContain('"truncate":true');
  });

  it("falls back to plain text when the recipient is not an EVM address", async () => {
    const handler = createOnTransaction(new (await import("../src/risk/mockProvider")).MockRiskProvider());
    const out = await handler({ transaction: { ...tx(""), to: undefined } as never, chainId: SEPOLIA });
    const json = JSON.stringify(contentOf(out));
    expect(json).not.toContain('"type":"Address"');
    expect(json).toContain("(no recipient)");
  });

  it("maps high-severity evidence to the critical row tone", async () => {
    const out = await onTransaction({ transaction: tx(DEMO_ADDRESSES.CRITICAL) as never, chainId: SEPOLIA });
    expect(JSON.stringify(contentOf(out))).toContain('"variant":"critical"');
  });
});
