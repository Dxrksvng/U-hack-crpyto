import type { TFunction } from "i18next";
import type { CheckRecord } from "@/domain/types";

export type QuickId = "why" | "explain" | "continue" | "verify" | "poisoning" | "whyNone" | "sources" | "limits" | "checkMore" | "wrongSend";
export type AnswerKind = "fact" | "education" | "unknown";
export type Answer = { kind: AnswerKind; text: string };

/**
 * Deterministic, evidence-grounded answers. Facts come only from the check record;
 * general guidance is labelled as such; anything else is "cannot verify".
 */
export function answerQuick(id: QuickId, rec: CheckRecord | null, t: TFunction, lang: string): Answer {
  if (id === "continue") return { kind: "education", text: t("consult.a_continue") };
  if (id === "verify") return { kind: "education", text: t("consult.a_verify") };
  if (id === "poisoning") return { kind: "education", text: t("consult.a_poisoning") };
  if (id === "checkMore") return { kind: "education", text: t("consult.a_checkMore") };
  if (id === "wrongSend") return { kind: "education", text: t("consult.a_wrongSend") };
  if (!rec) return { kind: "unknown", text: t("consult.noCheck") };
  const r = rec.result;
  const th = lang === "th";
  const demoNote = rec.demo ? `\n\n${t("consult.a_sources_demo")}` : "";
  if (id === "whyNone") {
    // Only meaningful for a NO_KNOWN_RISK result; otherwise fall through to the evidence explanation.
    if (r.verdict !== "NO_KNOWN_RISK") return answerQuick("why", rec, t, lang);
    const clean = (r.sources ?? []).filter((s) => s.status === "NO_MATCH");
    if (!clean.length) return { kind: "fact", text: t("consult.a_whyNone_zero") };
    return { kind: "fact", text: `${t("consult.a_whyNone")}\n${clean.map((s) => `• ${s.source}`).join("\n")}${demoNote}` };
  }
  if (id === "sources") {
    const lines = r.sources?.length
      ? r.sources.map((s) => `• ${s.source}: ${t(`nkr.status.${s.status}`)}`)
      : r.tiers.map((x) => `• ${x.tier} ${t(`tiers.${x.tier}`)}: ${t(`tiers.status.${x.status}`)}`);
    return { kind: "fact", text: `${t("consult.a_sources")}\n${lines.join("\n")}${demoNote}` };
  }
  if (id === "limits") {
    const gaps = (r.sources ?? []).filter((s) => s.status === "NOT_CHECKED" || s.status === "UNAVAILABLE").map((s) => s.source);
    const gapNote = gaps.length ? `\n\n${t("consult.a_tiers", { tiers: gaps.join(", ") })}` : "";
    return { kind: "fact", text: `${t("consult.a_limits")}${gapNote}${demoNote}` };
  }
  const missing = r.tiers.filter((x) => x.status === "timeout" || x.status === "not_checked").map((x) => x.tier);
  const tierNote = missing.length ? `\n\n${t("consult.a_tiers", { tiers: missing.join(", ") })}` : "";
  if (!r.evidence.length) return { kind: "fact", text: (id === "why" ? t("consult.a_why_none") : t("consult.a_explain_none")) + tierNote };
  if (id === "why") {
    const lines = r.evidence.map((e) => `• [${e.tier}] ${th ? e.fact_th : e.fact_en} (${e.source})`);
    return { kind: "fact", text: `${t("consult.a_why")}\n${lines.join("\n")}${tierNote}` };
  }
  const lines = r.evidence.map((e) => {
    const detail = (th ? e.detail_th : e.detail_en) ?? "";
    const count = e.reporter_count != null ? ` ${t("consult.reporters", { count: e.reporter_count })}.` : "";
    return `• [${e.tier} · ${e.source} · ${e.severity}] ${th ? e.fact_th : e.fact_en}. ${detail}${count}${e.url ? `\n  ${e.url}` : ""}`;
  });
  return { kind: "fact", text: lines.join("\n") + tierNote };
}

const KEYWORDS: [QuickId, RegExp][] = [
  ["wrongSend", /wrong (address|recipient)|sent? (it )?to the wrong|โอนผิด/i],
  ["limits", /limit|ข้อจำกัด/i],
  ["sources", /which sources|sources (were )?checked|แหล่งข้อมูลใด/i],
  ["checkMore", /what else|verify (more|next)|ตรวจสอบอะไรเพิ่ม/i],
  ["whyNone", /why.*(no|not|none).*risk|ทำไมจึงไม่พบ|ทำไมไม่พบ/i],
  ["poisoning", /poison|look-?alike|คล้าย|ปลอมที่อยู่/i],
  ["explain", /explain|detail|evidence|source|หลักฐาน|ละเอียด|แหล่ง/i],
  ["why", /why|risk|reason|เสี่ยง|ทำไม|เหตุผล/i],
  ["continue", /continue|proceed|send anyway|happen|โอนต่อ|ดำเนินการ|เกิดอะไร/i],
  ["verify", /verify|confirm|recipient|ยืนยัน|ผู้รับ/i],
];

export function answerFree(q: string, rec: CheckRecord | null, t: TFunction, lang: string): Answer {
  const ql = q.toLowerCase();
  if (rec) {
    const ev = rec.result.evidence.find((e) => ql.includes(e.source.toLowerCase()));
    if (ev) {
      const th = lang === "th";
      return { kind: "fact", text: `[${ev.tier}] ${th ? ev.fact_th : ev.fact_en}. ${(th ? ev.detail_th : ev.detail_en) ?? ""}`.trim() };
    }
  }
  const hit = KEYWORDS.find(([, re]) => re.test(q));
  if (hit) return answerQuick(hit[0], rec, t, lang);
  return { kind: "unknown", text: rec ? t("consult.noEvidence") : t("consult.noCheck") };
}
