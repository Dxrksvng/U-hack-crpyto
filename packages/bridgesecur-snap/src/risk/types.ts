/**
 * Typed risk result schema. The Snap UI renders only this shape, so any risk
 * backend (mock today, HTTP later) must map its output into it.
 */

export const RISK_VERDICTS = ["CRITICAL", "WARNING", "NO_KNOWN_RISK", "UNKNOWN"] as const;
export type RiskVerdict = (typeof RISK_VERDICTS)[number];

/**
 * DEMO: fixture data bundled in the Snap. MOCK: same, reserved for test doubles.
 * LIVE: reserved for the future HttpRiskProvider. The UI shows a banner for every
 * mode except LIVE.
 */
export type RiskMode = "DEMO" | "MOCK" | "LIVE";

export interface RiskEvidence {
  id: string;
  severity: "high" | "medium" | "low" | "info";
  source: string;
  factEn: string;
  factTh: string;
}

export interface RiskResult {
  verdict: RiskVerdict;
  /** null when no scoring engine produced a number. Never derived from the verdict. */
  score: number | null;
  mode: RiskMode;
  summaryEn: string;
  summaryTh: string;
  recommendationEn: string;
  recommendationTh: string;
  evidence: RiskEvidence[];
  /** Name of the provider that produced this result, e.g. "MockRiskProvider". */
  providerName: string;
}

/** Input to a risk provider. `chainId` is CAIP-2 (e.g. "eip155:11155111"). */
export interface RiskRequest {
  recipient: string;
  chainId: string;
}
