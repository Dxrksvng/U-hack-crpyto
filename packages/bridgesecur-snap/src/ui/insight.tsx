/** @jsxImportSource @metamask/snaps-sdk */
import { Address, Banner, Box, Divider, Heading, Row, Section, Text } from "@metamask/snaps-sdk/jsx";
import type { RiskResult, RiskVerdict } from "../risk/types";

type BannerSeverity = "danger" | "warning" | "success" | "info";
type RowVariant = "critical" | "warning" | "default";

interface VerdictStyle {
  label: string;
  labelTh: string;
  severity: BannerSeverity;
}

/**
 * Native banner severity and bilingual labels for each provider verdict.
 */
const VERDICT_STYLE: Record<RiskVerdict, VerdictStyle> = {
  CRITICAL: { label: "Critical risk", labelTh: "ความเสี่ยงสูงมาก", severity: "danger" },
  WARNING: { label: "Warning", labelTh: "ควรระวัง", severity: "warning" },
  NO_KNOWN_RISK: { label: "No known risk", labelTh: "ไม่พบความเสี่ยงที่รู้จัก", severity: "success" },
  UNKNOWN: { label: "Inconclusive", labelTh: "ผลลัพธ์ยังไม่สรุป", severity: "info" },
};

/** Evidence severity maps to the same row tones as the verdict, so high-risk items stand out. */
const EVIDENCE_VARIANT: Record<"high" | "medium" | "low" | "info", RowVariant> = {
  high: "critical",
  medium: "warning",
  low: "default",
  info: "default",
};

const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/;

export interface InsightInput {
  result: RiskResult;
  recipient: string;
}

/**
 * Builds the BridgeSecur Transaction Insight. Pure: takes a result and returns Snap JSX,
 * so it can be tested without a running MetaMask.
 *
 * The recipient is shown shortened, with the full address in the row tooltip. Values that
 * are not EVM addresses (e.g. "(no recipient)") fall back to plain text.
 */
export function TransactionInsight({ result, recipient }: InsightInput) {
  const style = VERDICT_STYLE[result.verdict];
  const isDemo = result.mode !== "LIVE";
  const isAddress = EVM_ADDRESS.test(recipient);

  return (
    <Box>
      <Banner title={result.verdict === "CRITICAL" ? "CRITICAL SECURITY ALERT / Critical risk" : `${style.label} / ${style.labelTh}`} severity={style.severity}>
        <Text>{result.summaryEn}</Text>
        <Text>{result.summaryTh}</Text>
      </Banner>
      <Text size="sm" color="muted">{isDemo ? "DEMO · Not live threat intelligence" : `LIVE · ${result.providerName}`}</Text>
      <Text size="sm" fontWeight="bold">BRIDGEˣ · Risk Analysis</Text>
      <Section>
        <Heading>{result.score === null ? "Score not available" : `${result.score} / 100`}</Heading>
        <Row label="Recipient" tooltip={recipient}>
          {isAddress ? <Address address={recipient as `0x${string}`} truncate /> : <Text>{recipient}</Text>}
        </Row>
      </Section>
      <Divider />
      <Section>
        <Heading>Risk factors / หลักฐาน</Heading>
        {result.evidence.length === 0 ? (
          <Text>No evidence recorded. / ไม่มีหลักฐานที่บันทึกไว้</Text>
        ) : (
          result.evidence.map((item) => (
            <Row key={item.id} label={item.source} variant={EVIDENCE_VARIANT[item.severity]}>
              <Box>
                <Text>{item.factEn}</Text>
                <Text>{item.factTh}</Text>
              </Box>
            </Row>
          ))
        )}
      </Section>
      <Divider />
      <Section>
        <Heading>Recommended action / คำแนะนำ</Heading>
        <Text>{result.recommendationEn}</Text>
        <Text>{result.recommendationTh}</Text>
      </Section>
      <Text size="sm" color="muted">{isDemo ? `${result.mode} · Demo data only. Not live threat intelligence.` : `${result.providerName} · LIVE`}</Text>
    </Box>
  );
}
