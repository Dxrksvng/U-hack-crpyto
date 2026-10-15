import { describe, expect, it } from "vitest";
import { findLookalike, validateAddress } from "@/lib/address";
import { validateAmount } from "@/lib/amount";
import { demoCheck } from "@/fixtures/demo";
import { CheckResultSchema } from "@/domain/types";

const A = (end: string) => (`0x${"1".repeat(40 - end.length)}${end}`) as `0x${string}`;

describe("address validation", () => {
  it("rejects malformed addresses", () => {
    expect(validateAddress("")).toBe("empty");
    expect(validateAddress("0x123")).toBe("invalid");
    expect(validateAddress("0xZZ" + "1".repeat(38))).toBe("invalid");
  });
  it("accepts lowercase and correct checksum, flags bad checksum", () => {
    expect(validateAddress("0x52908400098527886e0f7030069857d2e4169ee7")).toBe("valid");
    expect(validateAddress("0x52908400098527886E0F7030069857D2E4169EE7")).toBe("valid");
    expect(validateAddress("0x52908400098527886E0F7030069857D2E4169Ee7")).toBe("bad_checksum");
  });
  it("detects address poisoning look-alikes (same first 4 + last 4, different middle)", () => {
    const recent = "0x1a2B3c4D5e6F708192a3B4c5D6e7F8091A2b3C4d";
    expect(findLookalike("0x1a2B000000000000000000000000000000003C4d", [recent])).toBe(recent);
    expect(findLookalike(recent, [recent])).toBeUndefined();
    expect(findLookalike("0x9999000000000000000000000000000000003C4d", [recent])).toBeUndefined();
  });
});

describe("amount validation", () => {
  it("validates positivity, precision, balance and gas", () => {
    expect(validateAmount("0")).toBe("amountInvalid");
    expect(validateAmount("abc")).toBe("amountInvalid");
    expect(validateAmount("0." + "1".repeat(19))).toBe("amountPrecision");
    expect(validateAmount("1", 10n ** 17n)).toBe("insufficient");
    expect(validateAmount("0.1", 10n ** 17n, 1n)).toBe("gasUnaffordable");
    expect(validateAmount("0.05", 10n ** 17n, 1000n)).toBeNull();
  });
});

describe("demo fixtures", () => {
  it.each([
    ["dead", "CRITICAL"],
    ["beef", "WARNING"],
    ["0000", "UNKNOWN"],
    ["abcd", "NO_KNOWN_RISK"],
  ])("ending %s → %s and matches the schema", async (end, verdict) => {
    const r = await demoCheck(43113, A(end));
    expect(r.verdict).toBe(verdict);
    expect(() => CheckResultSchema.parse(r)).not.toThrow();
  }, 5000);
  it("only CRITICAL contains a T1 threat-list hit", async () => {
    const crit = await demoCheck(43113, A("dead"));
    expect(crit.tiers.find((t) => t.tier === "T1")?.status).toBe("hit");
    const warn = await demoCheck(43113, A("beef"));
    expect(warn.tiers.find((t) => t.tier === "T1")?.status).not.toBe("hit");
  }, 5000);
  it("never contains the word safe as a verdict summary claim", async () => {
    for (const end of ["dead", "beef", "0000", "abcd"]) {
      const r = await demoCheck(43113, A(end));
      expect(r.summary_en.toLowerCase()).not.toMatch(/\bis safe\b/);
    }
  }, 8000);
  it("supports cancellation", async () => {
    const c = new AbortController();
    const p = demoCheck(43113, A("abcd"), c.signal);
    c.abort();
    await expect(p).rejects.toThrow();
  });
});
