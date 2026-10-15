/**
 * DEMO fixtures. Deterministic by address ending: dead=CRITICAL, beef=WARNING, 0000=UNKNOWN, else NO_KNOWN_RISK.
 * None of this is live threat intelligence. Results built here are always flagged `demo: true` in the UI.
 */
import type { CheckResult } from "@/domain/types";

export const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();
const versions = { policy_version: "1.3-demo", rules_version: "42-demo", model_version: "7-demo" };

export async function demoCheck(chainId: number, destination: `0x${string}`, signal?: AbortSignal): Promise<CheckResult> {
  const latency = 800 + Math.floor(Math.random() * 700);
  await sleep(latency, signal);
  const addr = destination.toLowerCase();
  const explorer = chainId === 11155111 ? "https://sepolia.etherscan.io" : chainId === 1 ? "https://etherscan.io" : chainId === 56 ? "https://bscscan.com" : chainId === 43114 ? "https://snowtrace.io" : "https://testnet.snowtrace.io";
  const base = { ...versions, checked_at: new Date().toISOString(), latency_ms: latency };

  if (addr.endsWith("dead")) {
    return {
      ...base,
      verdict: "CRITICAL",
      score: 92,
      summary_th: "ปลายทางนี้อยู่ในรายชื่อ OFAC SDN และฐานข้อมูลมิจฉาชีพของ ScamSniffer",
      summary_en: "This destination is on the OFAC SDN list and the ScamSniffer scam database.",
      recommendation_th: "แนะนำอย่างยิ่งให้ยกเลิก หากไม่แน่ใจ ให้ตรวจสอบที่อยู่อีกครั้งหรือยืนยันกับผู้รับผ่านช่องทางอื่น",
      recommendation_en: "I strongly recommend cancelling. If unsure, double-check the address or confirm with the recipient through another channel.",
      evidence: [
        { id: "e1", tier: "T1", severity: "high", source: "OFAC SDN", fact_th: "อยู่ในรายชื่อคว่ำบาตร OFAC SDN", fact_en: "Listed on the OFAC SDN sanctions list", detail_th: "รายการที่อยู่ดิจิทัลที่ถูกคว่ำบาตรโดยกระทรวงการคลังสหรัฐฯ", detail_en: "Digital currency address designated by the US Treasury.", url: "https://sanctionssearch.ofac.treas.gov/", observed_at: ago(60 * 24 * 12) },
        { id: "e2", tier: "T1", severity: "high", source: "ScamSniffer", fact_th: "อยู่ในฐานข้อมูลมิจฉาชีพ ScamSniffer", fact_en: "Listed in the ScamSniffer scam database", detail_th: "ถูกระบุว่าเกี่ยวข้องกับเว็บฟิชชิง drainer", detail_en: "Tagged as linked to a phishing drainer site.", url: "https://github.com/scamsniffer/scam-database", observed_at: ago(60 * 30) },
        { id: "e3", tier: "T4", severity: "medium", source: "Contract scan", fact_th: "สัญญาไม่ได้ verify และมีฟังก์ชัน approve-all", fact_en: "Unverified contract with an approve-all function", detail_th: "ไม่มี source code เผยแพร่บน explorer", detail_en: "No published source code on the explorer.", url: `${explorer}/address/${destination}`, observed_at: ago(5) },
        { id: "e4", tier: "T3", severity: "low", source: "Explorer tx list", fact_th: "ที่อยู่ถูกสร้างเมื่อ 3 วันก่อน", fact_en: "Address first seen 3 days ago", detail_th: "ที่อยู่ใหม่มากมักใช้ในการหลอกลวงระยะสั้น", detail_en: "Very new addresses are common in short-lived scams.", url: `${explorer}/address/${destination}`, observed_at: ago(5) },
      ],
      tiers: [{ tier: "T0", status: "ok" }, { tier: "T1", status: "hit" }, { tier: "T2", status: "ok" }, { tier: "T3", status: "hit" }, { tier: "T4", status: "hit" }],
    };
  }
  if (addr.endsWith("beef")) {
    return {
      ...base,
      verdict: "WARNING",
      score: 64,
      summary_th: "ปลายทางนี้ได้รับเงินจากที่อยู่ที่ถูกแจ้งเตือน (ห่าง 1 hop) และโอนเงินต่อภายใน 4 นาที",
      summary_en: "This destination received funds from a flagged address 1 hop away and forwarded them within 4 minutes.",
      recommendation_th: "ควรตรวจสอบกับผู้รับผ่านช่องทางอื่นก่อนโอน หากไม่แน่ใจ ให้ยกเลิก",
      recommendation_en: "Confirm with the recipient through another channel before sending. If unsure, cancel.",
      evidence: [
        { id: "w1", tier: "T2", severity: "medium", source: "Graph analysis", fact_th: "ได้รับเงินจากที่อยู่ที่ถูกแจ้งเตือน ห่าง 1 hop", fact_en: "Received funds from a flagged address 1 hop away", detail_th: "ไม่ได้แปลว่าปลายทางเป็นมิจฉาชีพ แต่เป็นสัญญาณที่ควรระวัง", detail_en: "This does not prove the destination is malicious, but it is a signal to be careful.", url: `${explorer}/address/${destination}`, observed_at: ago(90) },
        { id: "w2", tier: "T3", severity: "medium", source: "Behaviour model", fact_th: "เงินถูกโอนต่อภายใน 4 นาทีหลังได้รับ", fact_en: "Funds forwarded within 4 minutes of arrival", detail_th: "รูปแบบนี้พบบ่อยในบัญชีพักเงิน", detail_en: "This pattern is common in pass-through accounts.", url: `${explorer}/address/${destination}`, observed_at: ago(85) },
        { id: "w3", tier: "T1", severity: "medium", source: "Community reports", fact_th: "ถูกรายงานโดยผู้ใช้ 23 กระเป๋า", fact_en: "Reported by 23 wallets", detail_th: "รายงานจากชุมชนอย่างเดียวจะไม่ยกระดับเกินกว่า 'ควรระวัง'", detail_en: "Community reports alone never raise the verdict above Warning.", observed_at: ago(60 * 6), reporter_count: 23 },
      ],
      tiers: [{ tier: "T0", status: "ok" }, { tier: "T1", status: "ok" }, { tier: "T2", status: "hit" }, { tier: "T3", status: "hit" }, { tier: "T4", status: "ok" }],
    };
  }
  if (addr.endsWith("0000")) {
    return {
      ...base,
      verdict: "UNKNOWN",
      score: 0,
      summary_th: "ข้อมูลไม่พอ: ที่อยู่นี้ไม่มีธุรกรรมเลย และบางแหล่งข้อมูลตรวจไม่ทัน",
      summary_en: "Not enough data: this address has no transactions and some sources could not be checked.",
      recommendation_th: "ลองโอนจำนวนน้อยก่อน หรือยืนยันที่อยู่กับผู้รับผ่านช่องทางอื่น",
      recommendation_en: "Consider a small test transfer first, or confirm the address with the recipient through another channel.",
      evidence: [
        { id: "u1", tier: "T3", severity: "info", source: "Explorer tx list", fact_th: "ไม่มีธุรกรรมในประวัติ", fact_en: "0 transactions in history", url: `${explorer}/address/${destination}`, observed_at: ago(1) },
      ],
      tiers: [{ tier: "T0", status: "ok" }, { tier: "T1", status: "ok" }, { tier: "T2", status: "timeout" }, { tier: "T3", status: "timeout" }, { tier: "T4", status: "not_checked" }],
    };
  }
  return {
    ...base,
    verdict: "NO_KNOWN_RISK",
    // No scoring engine in demo: never invent a number just because the verdict is low risk.
    score: null,
    summary_th: "ไม่พบสัญญาณความเสี่ยงจากแหล่งข้อมูลที่ตรวจสอบ อย่างไรก็ตาม ผลนี้ไม่รับประกันว่าปลายทางปลอดภัยทั้งหมด",
    summary_en: "No risk signals were found in the sources checked. This does not guarantee the destination is safe.",
    recommendation_th: "แม้ไม่พบสัญญาณความเสี่ยงที่รู้จัก ควรตรวจสอบที่อยู่ผู้รับ เครือข่าย และจำนวนเงินก่อนยืนยันธุรกรรม",
    recommendation_en: "Even with no known risk detected, verify the recipient address, network and amount before confirming.",
    evidence: [],
    // DEMO simulation: statuses are fixtures, not results from real OFAC / ScamSniffer lookups.
    sources: [
      { id: "s1", source: "OFAC SDN", status: "NO_MATCH", description_th: "จำลอง: ไม่พบในรายชื่อคว่ำบาตร", description_en: "Simulated: no match on the sanctions list", checked_at: base.checked_at, url: "https://sanctionssearch.ofac.treas.gov/" },
      { id: "s2", source: "ScamSniffer", status: "NO_MATCH", description_th: "จำลอง: ไม่พบในฐานข้อมูลมิจฉาชีพ", description_en: "Simulated: no match in the scam database", checked_at: base.checked_at, url: "https://github.com/scamsniffer/scam-database" },
      { id: "s3", source: "Wallet relationships", status: "NO_MATCH", description_th: "จำลอง: ไม่พบความเชื่อมโยงกับที่อยู่ที่ถูกแจ้งเตือน", description_en: "Simulated: no link to flagged addresses found", checked_at: base.checked_at },
      { id: "s4", source: "Address activity", status: "NOT_CHECKED", description_th: "ไม่ได้ตรวจในโหมดสาธิต", description_en: "Not checked in demo mode" },
      { id: "s5", source: "Smart contract analysis", status: "NOT_CHECKED", description_th: "ไม่ได้ตรวจในโหมดสาธิต จึงไม่สามารถยืนยันว่าเป็นสัญญาที่ verify แล้ว", description_en: "Not checked in demo mode, so contract verification is unknown" },
    ],
    tiers: [{ tier: "T0", status: "ok" }, { tier: "T1", status: "ok" }, { tier: "T2", status: "ok" }, { tier: "T3", status: "not_checked" }, { tier: "T4", status: "not_checked" }],
  };
}
