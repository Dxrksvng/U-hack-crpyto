import type { OnTransactionHandler } from "@metamask/snaps-sdk";
import { SeverityLevel } from "@metamask/snaps-sdk";
import { MockRiskProvider } from "./risk/mockProvider";
import type { RiskProvider } from "./risk/provider";
import type { RiskResult } from "./risk/types";
import { FallbackInsight } from "./ui/fallback";
import { showCriticalAlert } from "./alert";
import { CriticalAlertContent } from "./ui/criticalAlert";
import { TransactionInsight } from "./ui/insight";
import { encodeContext, getSnap, InteractiveInsight, isRiskResult } from "./ui/interactive";
import type { InsightContext } from "./ui/interactive";
export { onUserInput } from "./ui/interactive";

/** Builds an inconclusive DEMO result when analysis throws or returns something unusable. */
function inconclusive(providerName: string, reason: string): RiskResult {
  return {
    verdict: "UNKNOWN",
    score: null,
    mode: "DEMO",
    summaryEn: `[DEMO] The risk check did not complete (${reason}). The result is inconclusive.`,
    summaryTh: "[DEMO] การตรวจสอบความเสี่ยงไม่สมบูรณ์ ผลลัพธ์ยังไม่สรุป",
    recommendationEn: "Do not rely on this result. Confirm the address with the recipient.",
    recommendationTh: "อย่าพึ่งผลลัพธ์นี้ ให้ยืนยันที่อยู่กับผู้รับ",
    evidence: [],
    providerName,
  };
}

/**
 * Creates the onTransaction handler for a given provider. The handler always returns
 * non-empty content, so MetaMask never shows "No insights to show" because of a failure here.
 */
export function createOnTransaction(provider: RiskProvider): OnTransactionHandler {
  return async ({ transaction, chainId }) => {
    const recipient = transaction?.to ?? "(no recipient)";

    let result: RiskResult;
    try {
      const analysed: unknown = await provider.analyze({ recipient, chainId });
      result = isRiskResult(analysed) ? analysed : inconclusive(provider.name, "invalid provider result");
    } catch (error) {
      const reason = error instanceof Error ? error.message : "unknown error";
      result = inconclusive(provider.name, reason);
    }

    try {
      const runtime = getSnap();
      if (runtime) {
        const context: InsightContext = { recipient, chainId, result, view: "warning", question: "", answer: "" };
        try {
          const id = await runtime.request({ method: "snap_createInterface", params: { ui: <InteractiveInsight context={context} />, context: encodeContext(context) } });
          if (typeof id === "string" && id.length > 0) {
            return result.verdict === "CRITICAL" ? { id, severity: SeverityLevel.Critical } : { id };
          }
        } catch {
          // Older clients still receive a complete static report below.
        }
      }
      // Omit the key entirely when not critical: `severity: undefined` is not JSON and MetaMask crashes the Snap on it.
      if (result.verdict === "CRITICAL") {
        showCriticalAlert(<CriticalAlertContent recipient={recipient} result={result} />);
        return { content: <TransactionInsight result={result} recipient={recipient} />, severity: SeverityLevel.Critical };
      }
      return { content: <TransactionInsight result={result} recipient={recipient} /> };
    } catch (error) {
      const reason = error instanceof Error ? error.message : "render error";
      return { content: <FallbackInsight recipient={recipient} reason={reason} /> };
    }
  };
}

export const onTransaction = createOnTransaction(new MockRiskProvider());
