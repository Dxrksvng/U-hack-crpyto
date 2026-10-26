/** @jsxImportSource @metamask/snaps-sdk */
import { Banner, Box, Divider, Heading, Text } from "@metamask/snaps-sdk/jsx";
import type { RiskResult } from "../risk/types";
import { Brand } from "./brand";

/**
 * Branded warning shown through snap_dialog, separate from transaction approval.
 * Findings come from the same provider result as the transaction insight.
 */
export function CriticalAlertContent({ recipient, result }: { recipient: string; result: RiskResult }) {
  return (
    <Box>
      <Brand alert />
      <Text alignment="center" color="error" fontWeight="bold">CRITICAL SECURITY ALERT</Text>
      <Text alignment="center">ตรวจพบความเสี่ยงสูงมากก่อนโอน</Text>
      <Text alignment="center">{`${recipient.slice(0, 8)}…${recipient.slice(-6)}`}</Text>
      <Banner severity="danger" title="High risk detected">
        <Text>{result.summaryEn}</Text>
        <Text size="sm">{result.summaryTh}</Text>
      </Banner>
      <Heading>Why this address is risky / เหตุผล</Heading>
      {result.evidence.map((item) => <Text key={item.id}>{`• ${item.factEn}`}</Text>)}
      <Divider />
      <Text fontWeight="bold">แนะนำให้ยกเลิกการทำรายการ / Cancel recommended</Text>
      <Text size="sm">Close this alert, then use Cancel in MetaMask to cancel the transaction. Closing this alert does not cancel or approve it.</Text>
      {result.mode !== "LIVE" ? <Text size="sm" color="muted">DEMO · Demo data only. Not live threat intelligence.</Text> : null}
    </Box>
  );
}
