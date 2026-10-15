import type { RiskRequest, RiskResult } from "./types";

/**
 * Anything that can assess a transaction recipient. The Snap UI depends only on
 * this interface, so swapping MockRiskProvider for HttpRiskProvider later
 * does not touch the UI code.
 *
 * Implementations must not throw for ordinary "unknown" cases; return an
 * UNKNOWN result instead. Throwing is reserved for bugs.
 */
export interface RiskProvider {
  readonly name: string;
  analyze(request: RiskRequest): Promise<RiskResult>;
}
