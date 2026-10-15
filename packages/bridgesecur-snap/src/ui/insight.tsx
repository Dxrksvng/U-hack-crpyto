/** @jsxImportSource @metamask/snaps-sdk */
import { Banner, Box, Divider, Heading, Icon, Row, Section, Text } from "@metamask/snaps-sdk/jsx";
import type { RiskResult, RiskVerdict } from "../risk/types";

type Severity = "danger" | "warning" | "success" | "info";

/**
 * Severity, icon and labels per verdict. Wording mirrors the website's risk levels
 * (see web/src/lib/verdict.ts); the Snap supports only the SDK's severities and icons.
 */
const VERDICT_STYLE: Record<RiskVerdict, { label: string; labelTh: string; severity: Severity; icon: "danger" | "warning" | "check-bold" | "info"; rowVariant: "critical" | "warning" | "default" }> = {
  CRITICAL: { label: "Critical risk", labelTh: "ความเสี่ยงสูงมาก", severity: "danger", icon: "danger", rowVariant: "critical" },
  WARNING: { label: "Warning", labelTh: "ควรระวัง", severity: "warning", icon: "warning", rowVariant: "warning" },
  NO_KNOWN_RISK: { label: "No known risk", labelTh: "ไม่พบความเสี่ยงที่รู้จัก", severity: "success", icon: "check-bold", rowVariant: "default" },
  UNKNOWN: { label: "Inconclusive", labelTh: "ผลลัพธ์ยังไม่สรุป", severity: "info", icon: "info", rowVariant: "default" },
};

export interface InsightInput {
  result: RiskResult;
  recipient: string;
}

/**
 * Builds the BridgeSecur Transaction Insight. Pure: takes a result and returns Snap JSX,
 * so it can be tested without a running MetaMask.
 */
export function TransactionInsight({ result, recipient }: InsightInput) {
  const style = VERDICT_STYLE[result.verdict];
  const isDemo = result.mode !== "LIVE";

  return (
    <Box>
      <Heading>BridgeSecur</Heading>
      {isDemo ? (
        <Banner title="DEMO MODE" severity="warning">
          <Text>Demo data only. Not live threat intelligence.</Text>
        </Banner>
      ) : null}
      <Banner title={`${style.label} / ${style.labelTh}`} severity={style.severity}>
        <Text>{result.summaryEn}</Text>
        <Text>{result.summaryTh}</Text>
      </Banner>
      <Section>
        <Row label="Verdict" variant={style.rowVariant}>
          <Box>
            <Icon name={style.icon} />
            <Text>{`${result.verdict}`}</Text>
          </Box>
        </Row>
        <Row label="Risk score">
          <Text>{result.score === null ? "Not available" : `${result.score} / 100`}</Text>
        </Row>
        <Row label="Recipient">
          <Text>{recipient}</Text>
        </Row>
      </Section>
      <Divider />
      <Section>
        <Heading>Evidence</Heading>
        {result.evidence.length === 0 ? (
          <Text>No evidence recorded.</Text>
        ) : (
          result.evidence.map((item) => (
            <Row key={item.id} label={`${item.source} (${item.severity})`}>
              <Text>{`${item.factEn} / ${item.factTh}`}</Text>
            </Row>
          ))
        )}
      </Section>
      <Divider />
      <Section>
        <Heading>Recommended action</Heading>
        <Text>{result.recommendationEn}</Text>
        <Text>{result.recommendationTh}</Text>
      </Section>
      <Divider />
      <Text>{`Provider: ${result.providerName} · Mode: ${result.mode}`}</Text>
    </Box>
  );
}
