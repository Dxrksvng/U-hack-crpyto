import { describe, expect, it } from "vitest";
import { onTransaction } from "../src/index";
import { DEMO_ADDRESSES } from "../src/risk/mockProvider";

const baseTx = (to: string) => ({
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

async function run(to: string, chainId = "eip155:11155111") {
  const out = await onTransaction({ transaction: baseTx(to), chainId: chainId as `${string}:${string}` });
  if (!out || !("content" in out)) throw new Error("expected content");
  return out;
}

/** Collects every string child in a Snap JSX tree so assertions can check visible text. */
function collectText(node: unknown): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(collectText).join(" ");
  if (typeof node === "object" && "props" in (node as object)) {
    const props = (node as { props: { children?: unknown; title?: unknown; label?: unknown } }).props;
    return [props.title, props.label, collectText(props.children)].filter(Boolean).join(" ");
  }
  return "";
}

describe("onTransaction", () => {
  it("CRITICAL sets critical severity and shows the recipient and DEMO mode", async () => {
    const out = await run(DEMO_ADDRESSES.CRITICAL);
    expect(out.severity).toBe("critical");
    const text = collectText(out.content);
    expect(text).toContain(DEMO_ADDRESSES.CRITICAL);
    expect(text).toContain("DEMO MODE");
    expect(text).toContain("Critical risk");
    expect(text).toContain("92 / 100");
  });

  it("WARNING shows the warning verdict without critical severity", async () => {
    const out = await run(DEMO_ADDRESSES.WARNING);
    expect(out.severity).toBeUndefined();
    expect(collectText(out.content)).toContain("Warning");
  });

  it("NO_KNOWN_RISK shows a neutral result and no score", async () => {
    const out = await run(DEMO_ADDRESSES.NO_KNOWN_RISK);
    expect(out.severity).toBeUndefined();
    const text = collectText(out.content);
    expect(text).toContain("No known risk");
    expect(text).toContain("Not available");
  });

  it("UNKNOWN shows an inconclusive result", async () => {
    const out = await run("0x1234567890123456789012345678901234567890");
    expect(collectText(out.content)).toContain("Inconclusive");
  });
});
