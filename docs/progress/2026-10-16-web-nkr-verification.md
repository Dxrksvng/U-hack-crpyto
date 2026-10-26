# NO_KNOWN_RISK completion

The designed experience runs in the web app. The optional MetaMask Snap has its own restricted UI. Local Snap development uses Flask; connecting a browser wallet to the website does not require installing the Snap.

## Gaps found and fixed

- Historical review now restores the selected check's recipient and network rather than reviewing another active destination.
- Revalidation stops if the account, wallet network, selected network, destination, amount, connection or page changes while the check is pending.
- Check history and transaction review show DEMO or LIVE origin. Transfer success derives the origin from the associated check, rather than assuming every check is DEMO.
- Security text enters without an opacity fade that temporarily reduced its contrast.
- Bottom sheets close directly on Escape and backdrop clicks, and restore the invoking control after the dialog unmounts.
- Old tests now recognize the `/review` route and separate success screen. Assertions preserve the warning that a result does not guarantee safety.

The existing app already had the NKR popup, green semantic tokens requested in the later NKR specification, source status rows, nullable score, contextual questions, transaction review, receipt-driven timeline, success screen and session history. The earlier specification requested neutral NKR colors. The later explicit green NKR requirement takes precedence here.

## Functional verification

Final browser acceptance run passed all 74 tests with one worker and tracing disabled. The two NKR visual capture scenarios passed and produced 24 screenshots. Unit tests passed 66 cases. Typecheck, lint, and production build passed. Earlier browser runs encountered disk exhaustion; serial execution completed successfully. No real wallet transaction was submitted.

| Capability | Implementation and verification |
| --- | --- |
| Check with no wallet or amount | DEMO browser test |
| NKR sheet, cancel, details | Browser test; no acknowledgement checkbox |
| Actual source statuses and no invented score | Fixture/schema and UI tests |
| Five contextual questions | Browser test |
| Historical recipient restored for review | Browser and session regression tests |
| Changed context during pending check | Component regressions |
| Wallet connection, wrong chain, funds and fee eligibility | Mocked EIP-1193 wallet and intercepted RPC tests |
| Wallet rejection, RPC error, reverted receipt, receipt timeout | Mocked transaction tests |
| Successful receipt and duplicate-submit prevention | Mocked transaction tests; no actual funds broadcast |
| Session history, language, keyboard, reduced motion | Browser tests |
| Six responsive viewport sizes and accessibility | Playwright and axe checks |
| Real MetaMask or Flask approval and testnet receipt | Not manually verified in this session |
| Live risk intelligence | Requires configured backend; no fixture fallback when a configured backend fails |

## Screenshots

NKR captures use a mocked wallet and mocked RPC receipts. The approval capture shows the website waiting for a wallet, not a fake MetaMask screen. The success capture is automated evidence of receipt handling, not evidence of a real testnet transfer.

| State | Mobile 390 × 844 | Desktop 1440 × 900 |
| --- | --- | --- |
| Send | [Mobile](../../web/screenshots/nkr/390/01-send-disconnected.png) | [Desktop](../../web/screenshots/nkr/1440/01-send-disconnected.png) |
| Wallet picker | [Mobile](../../web/screenshots/nkr/390/02-wallet-picker.png) | [Desktop](../../web/screenshots/nkr/1440/02-wallet-picker.png) |
| Checking | [Mobile](../../web/screenshots/nkr/390/03-checking.png) | [Desktop](../../web/screenshots/nkr/1440/03-checking.png) |
| Popup | [Mobile](../../web/screenshots/nkr/390/04-verdict-popup.png) | [Desktop](../../web/screenshots/nkr/1440/04-verdict-popup.png) |
| Analysis | [Mobile](../../web/screenshots/nkr/390/05-analysis.png) | [Desktop](../../web/screenshots/nkr/1440/05-analysis.png) |
| Details | [Mobile](../../web/screenshots/nkr/390/06-details.png) | [Desktop](../../web/screenshots/nkr/1440/06-details.png) |
| Consult | [Mobile](../../web/screenshots/nkr/390/07-consult.png) | [Desktop](../../web/screenshots/nkr/1440/07-consult.png) |
| Review | [Mobile](../../web/screenshots/nkr/390/08-review.png) | [Desktop](../../web/screenshots/nkr/1440/08-review.png) |
| Waiting for wallet | [Mobile](../../web/screenshots/nkr/390/09-wallet-approval-mocked.png) | [Desktop](../../web/screenshots/nkr/1440/09-wallet-approval-mocked.png) |
| Receipt confirmed | [Mobile](../../web/screenshots/nkr/390/10-confirmed-mocked-receipt.png) | [Desktop](../../web/screenshots/nkr/1440/10-confirmed-mocked-receipt.png) |
| History | [Mobile](../../web/screenshots/nkr/390/11-history.png) | [Desktop](../../web/screenshots/nkr/1440/11-history.png) |
| Settings | [Mobile](../../web/screenshots/nkr/390/12-settings.png) | [Desktop](../../web/screenshots/nkr/1440/12-settings.png) |

## Visual differences

Visual comparison checked the captured critical sheet and NKR sheet against the supplied storyboard, plus the NKR details and desktop review. The rounded white sheet, dim backdrop, centered logo and vertical actions follow the reference structure. The app retains explicit demo/configuration notices, a critical acknowledgement, real source statuses and unavailable score text. These required differences increase content height. The logo font and globe remain approximations, and no pixel-perfect claim is made.

## Modified files

- Session and navigation context changed in `web/src/state/session.tsx`, `web/src/pages/Preview.tsx`, `web/src/pages/RiskDetails.tsx`, and `web/src/pages/Consult.tsx`.
- Origin labels changed in `web/src/components/TransactionHistory.tsx`, `web/src/components/TransactionPreview.tsx`, `web/src/components/TransactionSuccess.tsx`, and `web/src/pages/Transaction.tsx`.
- Security text motion changed in `web/src/components/Evidence.tsx` and `web/src/components/VerdictCard.tsx`.
- Shared dialog focus and dismissal changed in `web/src/components/ui/sheet.tsx`.
- Coverage changed in `web/tests/unit/components.test.tsx`, `web/tests/unit/domain.test.ts`, `web/tests/unit/preview.test.tsx`, `web/tests/unit/session.test.tsx`, `web/tests/e2e/a11y.spec.ts`, `web/tests/e2e/app.spec.ts`, `web/tests/e2e/wallet.spec.ts`, and `web/tests/e2e/nkr.spec.ts`.
- `web/tests/visual/nkr.spec.ts` reproduces the 24 NKR captures. `web/README.md` documents the wallet and Snap distinction.

## Remaining external dependencies

- A Reown project ID enables WalletConnect and the remote wallet catalog. Installed injected browser wallets can connect without it.
- `VITE_API_URL` must point to a compatible risk backend for live intelligence. Requests contain only `chain_id` and `destination`.
- A funded testnet account and working chain RPC are needed for manual transfer verification. Mainnet sending is disabled.
- BridgeConsult uses deterministic evidence templates. An LLM backend is not connected.
- Reporting remains a labelled demo, notifications are unavailable, and history is session-only.

Run instructions and the manual testnet procedure are in [web README](../../web/README.md).
