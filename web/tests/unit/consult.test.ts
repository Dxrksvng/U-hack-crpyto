import { describe, expect, it } from "vitest";
import i18n from "@/i18n";
import { answerFree, answerQuick } from "@/lib/consult";
import { demoCheck } from "@/fixtures/demo";
import type { CheckRecord } from "@/domain/types";

const t = i18n.getFixedT("en");
async function rec(end: string): Promise<CheckRecord> {
  const destination = `0x${"2".repeat(36)}${end}` as `0x${string}`;
  return { id: "c1", chainId: 43113, destination, demo: true, createdAt: Date.now(), result: await demoCheck(43113, destination) };
}

describe("evidence-grounded consult", () => {
  it("'why' lists only the check's evidence as facts", async () => {
    const r = await rec("dead");
    const a = answerQuick("why", r, t, "en");
    expect(a.kind).toBe("fact");
    for (const e of r.result.evidence) expect(a.text).toContain(e.fact_en);
  });
  it("labels general guidance as education", async () => {
    expect(answerQuick("poisoning", null, t, "en").kind).toBe("education");
  });
  it("refuses to answer without evidence", async () => {
    const r = await rec("dead");
    expect(answerFree("how much money did they steal last week?", r, t, "en").kind).toBe("unknown");
    expect(answerQuick("why", null, t, "en").kind).toBe("unknown");
  });
  it("mentions unchecked tiers for UNKNOWN", async () => {
    const r = await rec("0000");
    expect(answerQuick("why", r, t, "en").text).toMatch(/T2, T3/);
  });
}, 10000);
