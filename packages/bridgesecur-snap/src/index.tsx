import type { OnTransactionHandler } from "@metamask/snaps-sdk";
import { SeverityLevel } from "@metamask/snaps-sdk";
import { MockRiskProvider } from "./risk/mockProvider";
import type { RiskProvider } from "./risk/provider";
import type { RiskResult } from "./risk/types";
import { TransactionInsight } from "./ui/insight";

/** The provider is chosen here only. Swap for an HttpRiskProvider later; the UI does not change. */
export const riskProvider: RiskProvider = new MockRiskProvider();

/** Turns a provider failure into an inconclusive result so the user still sees a warning screen. */
function inconclusive(providerName: string): RiskResult {
  return {
    verdict: "UNKNOWN",
    score: null,
    mode: "DEMO",
    summaryEn: "[DEMO] The risk check failed. The result is inconclusive.",
    summaryTh: "[DEMO] การตรวจสอบความเสี่ยงล้มเหลว ผลลัพธ์ยังไม่สรุป",
    recommendationEn: "Do not rely on this result. Confirm the address with the recipient.",
    recommendationTh: "อย่าพึ่งผลลัพธ์นี้ ให้ยืนยันที่อยู่กับผู้รับ",
    evidence: [],
    providerName,
  };
}

export const onTransaction: OnTransactionHandler = async ({ transaction, chainId }) => {
  const recipient = transaction.to ?? "";

  let result: RiskResult;
  try {
    result = await riskProvider.analyze({ recipient, chainId });
  } catch {
    result = inconclusive(riskProvider.name);
  }

  return {
    content: <TransactionInsight result={result} recipient={recipient} />,
    severity: result.verdict === "CRITICAL" ? SeverityLevel.Critical : undefined,
  };
};
