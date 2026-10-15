import type { RiskProvider } from "./provider";
import type { RiskRequest, RiskResult } from "./types";

/**
 * DEMO FIXTURES ONLY. These results are hard-coded for the UI milestone.
 * They are NOT threat intelligence and do not reflect any real sanctions list,
 * scam database, or on-chain analysis. Every result carries mode "DEMO".
 *
 * Test addresses (documented in README.md):
 *   CRITICAL       0xdead000000000000000000000000000000000001
 *   WARNING        0xbeef000000000000000000000000000000000002
 *   NO_KNOWN_RISK  0x5afe000000000000000000000000000000000003
 * Anything else, including unsupported chains, returns UNKNOWN.
 */
export const DEMO_ADDRESSES = {
  CRITICAL: "0xdead000000000000000000000000000000000001",
  WARNING: "0xbeef000000000000000000000000000000000002",
  NO_KNOWN_RISK: "0x5afe000000000000000000000000000000000003",
} as const;

/** Chains the mock recognises. Other chains yield UNKNOWN. */
const SUPPORTED_CHAINS = new Set(["eip155:1", "eip155:11155111", "eip155:43114", "eip155:43113"]);

const PROVIDER_NAME = "MockRiskProvider";

const FIXTURES: Record<"CRITICAL" | "WARNING" | "NO_KNOWN_RISK" | "UNKNOWN", Omit<RiskResult, "mode" | "providerName">> = {
  CRITICAL: {
    verdict: "CRITICAL",
    score: 92,
    summaryEn: "[DEMO] This recipient is on a demo sanctions list and a demo scam database.",
    summaryTh: "[DEMO] ผู้รับนี้อยู่ในรายชื่อจำลองสำหรับการคว่ำบาตรและฐานข้อมูลมิจฉาชีพจำลอง",
    recommendationEn: "Cancel this transaction. If unsure, confirm the address with the recipient through another channel.",
    recommendationTh: "แนะนำให้ยกเลิกธุรกรรมนี้ หากไม่แน่ใจ ให้ยืนยันที่อยู่กับผู้รับผ่านช่องทางอื่น",
    evidence: [
      { id: "demo-c1", severity: "high", source: "Demo sanctions list", factEn: "Listed in the demo sanctions fixture", factTh: "อยู่ในข้อมูลจำลองการคว่ำบาตร" },
      { id: "demo-c2", severity: "high", source: "Demo scam database", factEn: "Listed in the demo scam fixture", factTh: "อยู่ในข้อมูลจำลองมิจฉาชีพ" },
    ],
  },
  WARNING: {
    verdict: "WARNING",
    score: 64,
    summaryEn: "[DEMO] This recipient received funds from a flagged demo address one hop away.",
    summaryTh: "[DEMO] ผู้รับนี้ได้รับเงินจากที่อยู่ที่ถูกแจ้งเตือนจำลองห่างกัน 1 hop",
    recommendationEn: "Confirm the recipient through another channel before sending. If unsure, cancel.",
    recommendationTh: "ควรยืนยันผู้รับผ่านช่องทางอื่นก่อนโอน หากไม่แน่ใจ ให้ยกเลิก",
    evidence: [
      { id: "demo-w1", severity: "medium", source: "Demo graph fixture", factEn: "Funds received from a flagged demo address, 1 hop away", factTh: "ได้รับเงินจากที่อยู่ที่ถูกแจ้งเตือนจำลอง ห่าง 1 hop" },
    ],
  },
  NO_KNOWN_RISK: {
    verdict: "NO_KNOWN_RISK",
    score: null,
    summaryEn: "[DEMO] No risk matched in the demo fixtures for this recipient.",
    summaryTh: "[DEMO] ไม่พบความเสี่ยงที่ตรงกับข้อมูลจำลองสำหรับผู้รับนี้",
    recommendationEn: "No known risk was found in the demo data. Still verify the address before sending large amounts.",
    recommendationTh: "ไม่พบความเสี่ยงที่รู้จักในข้อมูลจำลอง ควรตรวจสอบที่อยู่ก่อนโอนจำนวนมาก",
    evidence: [],
  },
  UNKNOWN: {
    verdict: "UNKNOWN",
    score: null,
    summaryEn: "[DEMO] Not enough data to assess this recipient. The result is inconclusive.",
    summaryTh: "[DEMO] ข้อมูลไม่เพียงพอที่จะประเมินผู้รับนี้ ผลลัพธ์ยังไม่สรุป",
    recommendationEn: "Inconclusive result. Confirm the address with the recipient, or send a small test amount first.",
    recommendationTh: "ผลลัพธ์ยังไม่สรุป ให้ยืนยันที่อยู่กับผู้รับ หรือลองโอนจำนวนน้อยก่อน",
    evidence: [],
  },
};

export class MockRiskProvider implements RiskProvider {
  readonly name = PROVIDER_NAME;

  async analyze({ recipient, chainId }: RiskRequest): Promise<RiskResult> {
    const verdict = pickVerdict(recipient, chainId);
    return { ...FIXTURES[verdict], mode: "DEMO", providerName: PROVIDER_NAME };
  }
}

function pickVerdict(recipient: string, chainId: string): keyof typeof FIXTURES {
  if (!SUPPORTED_CHAINS.has(chainId)) return "UNKNOWN";
  const address = recipient.toLowerCase();
  if (address === DEMO_ADDRESSES.CRITICAL) return "CRITICAL";
  if (address === DEMO_ADDRESSES.WARNING) return "WARNING";
  if (address === DEMO_ADDRESSES.NO_KNOWN_RISK) return "NO_KNOWN_RISK";
  return "UNKNOWN";
}
