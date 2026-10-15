import { z } from "zod";
import type { TxErrorKind, TxStatus, TxStep } from "@/lib/txMachine";

export type { TxStatus };

export const TIERS = ["T0", "T1", "T2", "T3", "T4"] as const;
export const VERDICTS = ["CRITICAL", "WARNING", "NO_KNOWN_RISK", "UNKNOWN"] as const;

const Tier = z.enum(TIERS);

export const EvidenceSchema = z.object({
  id: z.string(),
  tier: Tier,
  severity: z.enum(["high", "medium", "low", "info"]),
  source: z.string(),
  fact_th: z.string(),
  fact_en: z.string(),
  detail_th: z.string().optional(),
  detail_en: z.string().optional(),
  url: z.string().url().optional(),
  observed_at: z.string(),
  reporter_count: z.number().int().nonnegative().optional(),
});

export const TierStatusSchema = z.object({ tier: Tier, status: z.enum(["ok", "hit", "not_checked", "timeout"]) });

export const SOURCE_STATUSES = ["MATCH", "NO_MATCH", "UNAVAILABLE", "NOT_CHECKED", "NOT_APPLICABLE"] as const;
/** One checked source and what it returned. "NO_MATCH" is allowed only when the source really ran. */
export const SourceResultSchema = z.object({
  id: z.string(),
  source: z.string(),
  status: z.enum(SOURCE_STATUSES),
  description_th: z.string(),
  description_en: z.string(),
  checked_at: z.string().optional(),
  url: z.string().url().optional(),
});

export const CheckResultSchema = z.object({
  verdict: z.enum(VERDICTS),
  /** null when no scoring engine produced one. Never defaulted from the verdict. */
  score: z.number().min(0).max(100).nullable(),
  summary_th: z.string(),
  summary_en: z.string(),
  recommendation_th: z.string(),
  recommendation_en: z.string(),
  evidence: z.array(EvidenceSchema),
  tiers: z.array(TierStatusSchema),
  sources: z.array(SourceResultSchema).optional(),
  policy_version: z.string(),
  rules_version: z.string(),
  model_version: z.string(),
  checked_at: z.string(),
  latency_ms: z.number().nonnegative(),
});

export type Tier = z.infer<typeof Tier>;
export type Verdict = (typeof VERDICTS)[number];
export type Evidence = z.infer<typeof EvidenceSchema>;
export type SourceStatus = (typeof SOURCE_STATUSES)[number];
export type SourceResult = z.infer<typeof SourceResultSchema>;
export type TierStatus = z.infer<typeof TierStatusSchema>;
export type CheckResult = z.infer<typeof CheckResultSchema>;

/** A completed check as held in this browser session. `demo` marks fixture data. */
export type CheckRecord = {
  id: string;
  chainId: number;
  destination: `0x${string}`;
  result: CheckResult;
  demo: boolean;
  createdAt: number;
};


export type SendRecord = {
  id: string;
  chainId: number;
  from: `0x${string}`;
  to: `0x${string}`;
  amount: string;
  status: TxStatus;
  hash?: `0x${string}`;
  checkId?: string;
  verdict?: Verdict;
  failedStep?: TxStep;
  errorKind?: TxErrorKind;
  details?: string;
  seen?: boolean;
  feeWei?: bigint;
  confirmedAt?: number;
  createdAt: number;
};

export const isRisky = (v: Verdict) => v === "CRITICAL" || v === "WARNING";
