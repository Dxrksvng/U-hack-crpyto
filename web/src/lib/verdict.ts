import { HelpCircle, OctagonAlert, ShieldCheck, TriangleAlert, type LucideIcon } from "lucide-react";
import type { Verdict } from "@/domain/types";

/** Verdict presentation. Color is never the only signal: every verdict has its own icon and label. */
export const VERDICT_STYLE: Record<Verdict, { icon: LucideIcon; text: string; soft: string; border: string; stroke: string }> = {
  CRITICAL: { icon: OctagonAlert, text: "text-critical-ink", soft: "bg-critical-soft", border: "border-critical", stroke: "var(--critical)" },
  WARNING: { icon: TriangleAlert, text: "text-warning-ink", soft: "bg-warning-soft", border: "border-warning", stroke: "var(--warning)" },
  NO_KNOWN_RISK: { icon: ShieldCheck, text: "text-norisk", soft: "bg-norisk-soft", border: "border-norisk/40", stroke: "var(--norisk)" },
  UNKNOWN: { icon: HelpCircle, text: "text-unknown", soft: "bg-unknown-soft", border: "border-unknown border-dashed", stroke: "var(--unknown)" },
};
