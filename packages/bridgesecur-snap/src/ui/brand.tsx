/** @jsxImportSource @metamask/snaps-sdk */
import { Box, Image } from "@metamask/snaps-sdk/jsx";

const WORDMARK = '<svg xmlns="http://www.w3.org/2000/svg" width="192" height="52" viewBox="0 0 192 52"><rect width="192" height="52" rx="12" fill="#fff"/><text x="14" y="36" font-family="Arial,sans-serif" font-size="30" font-weight="900" letter-spacing="-2" fill="#080e20">BRIDGE</text><path d="M15 24h134v3H15z" fill="#fff"/><rect x="153" y="15" width="23" height="24" fill="none" stroke="#080e20" stroke-width="2"/><path d="m159 21 11 12m0-12-11 12" stroke="#080e20" stroke-width="3"/></svg>';
const ALERT_BADGE = '<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72"><circle cx="36" cy="36" r="35" fill="#ffe0e4"/><path d="M31 17a6 6 0 0 1 10 0l19 33a6 6 0 0 1-5 9H17a6 6 0 0 1-5-9z" fill="#df2338" stroke="#fff" stroke-width="2"/><path d="M36 27v14" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="36" cy="49" r="2.5" fill="#fff"/></svg>';

export function Brand({ alert = false, compact = false }: { alert?: boolean; compact?: boolean }) {
  return (
    <Box alignment="center" crossAlignment="center">
      {alert ? <Image src={ALERT_BADGE} alt="Security warning" width={72} height={72} /> : null}
      <Image src={WORDMARK} alt="BRIDGEˣ" width={compact ? 96 : 192} height={compact ? 26 : 52} />
    </Box>
  );
}
