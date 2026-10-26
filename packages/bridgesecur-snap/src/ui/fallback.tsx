/** @jsxImportSource @metamask/snaps-sdk */
import { Banner, Box, Heading, Text } from "@metamask/snaps-sdk/jsx";

export interface FallbackInput {
  recipient: string;
  reason: string;
}

/**
 * Plain-text DEMO insight. Used when the rich insight cannot be built or analysis fails,
 * so MetaMask never receives an empty insight. Uses only Text and Banner, the most
 * widely supported components.
 */
export function FallbackInsight({ recipient, reason }: FallbackInput) {
  return (
    <Box>
      <Heading>BridgeSecur</Heading>
      <Banner title="DEMO / Mock Risk Data" severity="warning">
        <Text>Demo data only. Not live threat intelligence.</Text>
      </Banner>
      <Text>{`Recipient: ${recipient}`}</Text>
      <Text>{`Verdict: UNKNOWN (inconclusive). Reason: ${reason}`}</Text>
      <Text>Recommended action: confirm the recipient through another channel before sending.</Text>
    </Box>
  );
}
