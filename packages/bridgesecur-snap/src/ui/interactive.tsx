/** @jsxImportSource @metamask/snaps-sdk */
import type { OnUserInputHandler, SnapsProvider } from "@metamask/snaps-sdk";
import { UserInputEventType } from "@metamask/snaps-sdk";
import { array, enums, is, nullable, number, object, string, refine } from "@metamask/superstruct";
import { Banner, Box, Button, Divider, Field, Form, Heading, Image, Input, Row, Section, Text } from "@metamask/snaps-sdk/jsx";
import type { RiskResult } from "../risk/types";
import { Brand } from "./brand";

const RiskResultStruct = object({
  verdict: enums(["CRITICAL", "WARNING", "NO_KNOWN_RISK", "UNKNOWN"]),
  score: nullable(refine(number(), "RiskScore", value => Number.isFinite(value) && value >= 0 && value <= 100)),
  mode: enums(["DEMO", "MOCK", "LIVE"]),
  summaryEn: string(), summaryTh: string(), recommendationEn: string(), recommendationTh: string(),
  providerName: string(),
  evidence: array(object({ id: string(), severity: enums(["high", "medium", "low", "info"]), source: string(), factEn: string(), factTh: string() })),
});
export function isRiskResult(value: unknown): value is RiskResult { return is(value, RiskResultStruct); }

const ContextStruct = object({ recipient: string(), chainId: string(), result: RiskResultStruct, view: enums(["warning", "analysis", "details"]), question: string(), answer: string() });
export type InsightContext = {
  recipient: string; chainId: string; result: RiskResult;
  view: "warning" | "analysis" | "details"; question: string; answer: string;
};

// MetaMask owns each interface's JSON context; never share a mutable "latest result" across confirmations.
export function encodeContext(context: InsightContext): { payload: string } { return { payload: JSON.stringify(context) }; }
export function decodeContext(value: unknown): InsightContext | null {
  if (!value || typeof value !== "object" || !("payload" in value) || typeof value.payload !== "string") return null;
  try { const parsed: unknown = JSON.parse(value.payload); return is(parsed, ContextStruct) ? parsed : null; } catch { return null; }
}

export function getSnap(): SnapsProvider | undefined {
  return (globalThis as typeof globalThis & { snap?: SnapsProvider }).snap;
}

const styles = {
  CRITICAL: { title: "CRITICAL SECURITY ALERT", severity: "danger" },
  WARNING: { title: "SECURITY WARNING / ควรระวัง", severity: "warning" },
  NO_KNOWN_RISK: { title: "No known risk / ไม่พบสัญญาณความเสี่ยงที่รู้จัก", severity: "info" },
  UNKNOWN: { title: "Inconclusive / ผลตรวจยังไม่สรุป", severity: "info" },
} as const;

export function RiskGauge({ score, verdict }: Pick<RiskResult, "score" | "verdict">) {
  if (score === null) return <Text>Score not available / ยังไม่มีคะแนนความเสี่ยง</Text>;
  const color = verdict === "CRITICAL" ? "#D93B3B" : verdict === "WARNING" ? "#D98A1B" : "#64748B";
  const arc = 251.33;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="144" viewBox="0 0 240 144"><path d="M40 110a80 80 0 0 1 160 0" fill="none" stroke="#E2E8F0" stroke-width="14" stroke-linecap="round"/><path d="M40 110a80 80 0 0 1 160 0" fill="none" stroke="${color}" stroke-width="14" stroke-linecap="round" stroke-dasharray="${arc}" stroke-dashoffset="${arc * (1 - score / 100)}"/><text x="120" y="92" font-family="Arial,sans-serif" font-size="36" font-weight="700" fill="${color}" text-anchor="middle">${score}</text><text x="120" y="120" font-family="Arial,sans-serif" font-size="14" fill="#64748B" text-anchor="middle">/ 100</text></svg>`;
  return <Box alignment="center" crossAlignment="center"><Image src={svg} alt={`${score} / 100 risk signal score`} width={240} height={144} /><Text size="sm" color="muted">Risk signal score. Not a safety guarantee.</Text></Box>;
}

function Findings({ result }: { result: RiskResult }) {
  return <Section><Heading>What I found / สิ่งที่พบ</Heading>{result.evidence.length ? result.evidence.map(item => <Row key={item.id} label={item.source} variant={item.severity === "high" ? "critical" : item.severity === "medium" ? "warning" : "default"}><Box><Text>{item.factEn}</Text><Text>{item.factTh}</Text><Text size="sm" color="muted">{`${result.mode} · ${item.severity}`}</Text></Box></Row>) : <Text>No evidence recorded / ไม่มีหลักฐานที่บันทึกไว้. This does not establish safety.</Text>}</Section>;
}

export function answerQuestion(question: string, result: RiskResult): string {
  const text = question.toLowerCase();
  if (/similar|case|เคส|กรณี/.test(text)) return "No verified case data is available. / ไม่มีข้อมูลกรณีศึกษาที่ยืนยันได้";
  if (/continue|happen|โอนผิด|ดำเนิน|เกิดอะไร/.test(text)) return "Confirming in MetaMask can broadcast a real transaction. Transfers are generally irreversible; this Snap cannot recover funds or guarantee outcomes. / การยืนยันใน MetaMask อาจส่งธุรกรรมจริง โดยทั่วไปย้อนกลับไม่ได้ Snap นี้ไม่สามารถกู้เงินหรือรับประกันผลได้";
  if (/verify|เพิ่มเติม|ตรวจสอบอะไร|ยืนยันผู้รับ/.test(text)) return "Verify the full address with the recipient through a separate trusted channel, then check the network, amount and fee. / ยืนยันที่อยู่เต็มกับผู้รับผ่านช่องทางที่เชื่อถือได้อีกช่องทาง และตรวจสอบเครือข่าย จำนวนเงิน และค่าธรรมเนียม";
  if (/why|risk|evidence|source|ทำไม|เสี่ยง|หลักฐาน|แหล่งข้อมูล/.test(text)) return [result.summaryEn, result.summaryTh, ...result.evidence.map(item => `${item.source}: ${item.factEn} / ${item.factTh}`), result.mode === "LIVE" ? `Provider: ${result.providerName}` : "DEMO fixtures only; no live sanctions, scam database or blockchain investigation was performed."].join("\n\n");
  return "I cannot verify this claim from the available check. These are templated explanations, not an LLM or independent blockchain investigation. / ไม่สามารถยืนยันคำถามนี้จากผลตรวจที่มี เป็นคำตอบตามแม่แบบ ไม่ใช่ LLM หรือการสืบสวนบนเชน";
}

export function InteractiveInsight({ context }: { context: InsightContext }) {
  const { result, recipient, view } = context;
  const style = styles[result.verdict];
  return <Box>
    <Banner title={style.title} severity={style.severity}><Text>{view === "warning" ? result.summaryEn : result.summaryTh}</Text></Banner>
    <Text size="sm" color="muted">{result.mode === "LIVE" ? `LIVE · ${result.providerName}` : "DEMO · Simulated evidence only. No live intelligence checked."}</Text>
    <Brand compact />
    {view === "warning" ? <Box>
      <Text>{result.summaryTh}</Text>
      <Button name="analysis">Show more reasons / ดูผลวิเคราะห์</Button>
      <Text size="sm" color="muted">To cancel, use MetaMask’s Cancel button below. This Snap does not approve or cancel transactions. / ยกเลิกด้วยปุ่มของ MetaMask ด้านล่าง</Text>
    </Box> : view === "analysis" ? <Box>
      <Heading>Analysis Result / ผลวิเคราะห์</Heading>
      <Text>BridgeSecur · Evidence-grounded explanation</Text>
      <Findings result={result} />
      <Button name="details">Risk Analysis / ดูรายละเอียดความเสี่ยง</Button>
      <Divider />
      <Text size="sm" color="muted">BridgeConsult · Templated answers, no LLM connected</Text>
      {context.question ? <Section><Text fontWeight="bold">{context.question}</Text><Text>{context.answer}</Text></Section> : null}
      <Button name="why" size="sm">Why this result? / ทำไมจึงได้ผลนี้?</Button>
      <Button name="continue-info" size="sm">What happens if I continue?</Button>
      <Button name="verify" size="sm">How do I verify the recipient?</Button>
      <Form name="consult"><Field label="Ask about this check / ถามเกี่ยวกับผลตรวจ"><Input name="question" placeholder="Ask about the evidence…" /></Field><Button type="submit">Send question / ส่งคำถาม</Button></Form>
      <Button name="warning">Back to warning / กลับไปคำเตือน</Button>
    </Box> : <Box>
      <Heading>Risk Analysis / วิเคราะห์ความเสี่ยง</Heading>
      <RiskGauge score={result.score} verdict={result.verdict} />
      <Findings result={result} />
      <Section><Heading>Recommended action / คำแนะนำ</Heading><Text>{result.recommendationEn}</Text><Text>{result.recommendationTh}</Text></Section>
      <Text size="sm" color="muted">No source timestamps, evidence tiers or policy versions were supplied by this provider.</Text>
      <Button name="analysis">Back to analysis / กลับผลวิเคราะห์</Button>
    </Box>}
    <Divider /><Row label="Recipient" tooltip={recipient}><Text>{recipient.length > 22 ? `${recipient.slice(0, 12)}…${recipient.slice(-8)}` : recipient}</Text></Row><Row label="Network"><Text>{context.chainId}</Text></Row>
  </Box>;
}

export const onUserInput: OnUserInputHandler = async ({ id, event, context }) => {
  const previous = decodeContext(context);
  if (!previous) return;
  let next: InsightContext;
  if (event.type === UserInputEventType.ButtonClickEvent) {
    if (event.name === "warning" || event.name === "analysis" || event.name === "details") next = { ...previous, view: event.name };
    else {
      const questions: Record<string, string> = { why: "Why this result?", "continue-info": "What happens if I continue?", verify: "How do I verify the recipient?" };
      const question = event.name ? questions[event.name] : undefined;
      if (!question) return;
      next = { ...previous, view: "analysis", question, answer: answerQuestion(question, previous.result) };
    }
  } else if (event.type === UserInputEventType.FormSubmitEvent && event.name === "consult") {
    const value = event.value.question;
    if (typeof value !== "string" || !value.trim()) return;
    const question = value.trim().slice(0, 500);
    next = { ...previous, view: "analysis", question, answer: answerQuestion(question, previous.result) };
  } else return;
  await getSnap()?.request({ method: "snap_updateInterface", params: { id, ui: <InteractiveInsight context={next} />, context: encodeContext(next) } });
};
