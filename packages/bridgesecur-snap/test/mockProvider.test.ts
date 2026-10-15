import { describe, expect, it } from "vitest";
import { DEMO_ADDRESSES, MockRiskProvider } from "../src/risk/mockProvider";

const provider = new MockRiskProvider();
const SEPOLIA = "eip155:11155111";

describe("MockRiskProvider", () => {
  it("returns CRITICAL with a score for the documented critical address", async () => {
    const r = await provider.analyze({ recipient: DEMO_ADDRESSES.CRITICAL, chainId: SEPOLIA });
    expect(r.verdict).toBe("CRITICAL");
    expect(r.score).toBe(92);
    expect(r.mode).toBe("DEMO");
    expect(r.summaryEn).toContain("[DEMO]");
  });

  it("returns WARNING for the documented warning address", async () => {
    const r = await provider.analyze({ recipient: DEMO_ADDRESSES.WARNING, chainId: SEPOLIA });
    expect(r.verdict).toBe("WARNING");
    expect(r.score).toBe(64);
  });

  it("returns NO_KNOWN_RISK with a null score, never an invented number", async () => {
    const r = await provider.analyze({ recipient: DEMO_ADDRESSES.NO_KNOWN_RISK, chainId: SEPOLIA });
    expect(r.verdict).toBe("NO_KNOWN_RISK");
    expect(r.score).toBeNull();
    expect(r.evidence).toEqual([]);
  });

  it("returns UNKNOWN for an unrecognised address", async () => {
    const r = await provider.analyze({ recipient: "0x1234567890123456789012345678901234567890", chainId: SEPOLIA });
    expect(r.verdict).toBe("UNKNOWN");
    expect(r.score).toBeNull();
  });

  it("returns UNKNOWN for an unsupported chain even when the address matches", async () => {
    const r = await provider.analyze({ recipient: DEMO_ADDRESSES.CRITICAL, chainId: "eip155:999999" });
    expect(r.verdict).toBe("UNKNOWN");
  });

  it("matches addresses case-insensitively", async () => {
    const r = await provider.analyze({ recipient: DEMO_ADDRESSES.CRITICAL.toUpperCase().replace("0X", "0x"), chainId: SEPOLIA });
    expect(r.verdict).toBe("CRITICAL");
  });

  it("is deterministic across calls", async () => {
    const a = await provider.analyze({ recipient: DEMO_ADDRESSES.WARNING, chainId: SEPOLIA });
    const b = await provider.analyze({ recipient: DEMO_ADDRESSES.WARNING, chainId: SEPOLIA });
    expect(a).toEqual(b);
  });
});
