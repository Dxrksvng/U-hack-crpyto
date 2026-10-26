# BridgeSecur web

Warn-only Web3 transfer safety checker. "Check before you send."
BridgeSecur never blocks, never holds funds, never asks for keys, and never calls an address safe. The user decides and sends from their own wallet.

## Run

```bash
npm install
cp .env.example .env      # set VITE_REOWN_PROJECT_ID (https://cloud.reown.com); VITE_API_URL optional
npm run dev               # http://localhost:5173
npm run build && npm run preview
```

## Test

```bash
npm run typecheck   # tsc strict
npm run lint        # eslint
npm run test        # Vitest unit and component tests
npm run test:e2e    # Playwright with local Google Chrome, mocked wallet/RPC, axe and six viewport sizes
npx playwright test -c playwright.visual.config.ts   # writes screenshots/01..12.png
npx playwright test -c playwright.visual.config.ts nkr.spec.ts --workers=1 --trace=off
```

## Screens / routes

| # | Screen | Route / state |
|---|---|---|
| 1 | Landing | `/` |
| 2 | Menu sheet | hamburger (modal) |
| 3 | Connect wallet | Reown AppKit modal |
| 4 | Send | `/send` |
| 5 | Address checking | overlay on `/send` |
| 6 | Pre-send alert | sheet on `/send` and `/preview` |
| 7 | Analysis chat | `/analysis/:checkId` |
| 8 | Risk details | `/analysis/:checkId/details` |
| 9 | Transaction review | `/review` (`/preview` redirects here) |
| 10 | BridgeConsult | `/consult` |
| 11 | History | `/history` |
| 12 | Settings | `/settings` |
| - | Info pages | `/learn /about /partnerships /privacy /terms /contact /api /help` |
| - | Transfer progress and receipt result | `/transaction/:id` |

## Demo vs live

| Feature | Status |
|---|---|
| Risk check | DEMO fixtures unless `VITE_API_URL` is set (then `POST /v1/check`, zod-validated, 10s timeout, 1 retry, abortable). Fixture data is labelled DEMO everywhere. |
| Demo endings | `dead` CRITICAL, `beef` WARNING, `0000` UNKNOWN, else NO_KNOWN_RISK. Poisoning demo: `0x1a2b000000000000000000000000000000003c4d` |
| Wallet connect | Installed browser wallets use wagmi's injected connector. WalletConnect and the Reown wallet catalog require a project ID. No real-wallet connection verified in this session. |
| Testnet send (Fuji, Sepolia) | wagmi transfer actions and receipt monitoring. Confirmation requires a successful receipt. Automated tests use mocked wallets and RPC responses. No real transfer verified in this session. |
| Mainnet | Check-only. |
| Report address | DEMO, nothing is sent. |
| BridgeConsult | Deterministic templated answers from the check's evidence; no LLM connected. Answers are labelled fact / general guidance / cannot verify. |
| History | In-memory session only, cleared on refresh. |

## Privacy

Only `chain_id` and `destination` are sent for checking. localStorage holds only theme and language (plus AppKit/wagmi connection state). E2E test asserts the destination never appears in storage.

## Use MetaMask with the designed screens

Open the web app and connect an installed MetaMask wallet through **Connect**. The 12-screen design belongs to this website. The risk popup appears before the app invokes the wallet. MetaMask owns the final approval screen.

Stable MetaMask can connect as a browser wallet. Flask is used to develop the optional local Snap at `local:http://localhost:8080`. Installing that Snap with `wallet_requestSnaps` does not open the website's risk popup and is not required for the website's check or send flow.

For a manual testnet check, select Fuji or Sepolia in the website, connect the wallet, enter a destination and a small amount, and review the result. DEMO badges mean fixture risk data. Continue to `/review`, verify the full destination and network, and explicitly request wallet approval. Rejecting the request must produce a rejected state. An approved test transaction must remain pending until the chain returns a successful receipt. Mainnets remain check-only.

The screenshots under `screenshots/nkr/` use a mocked wallet and mocked receipts. They do not prove a real testnet transfer.

## Architecture

- `src/domain/types.ts` zod schemas + types · `src/lib/api.ts` client · `src/fixtures/demo.ts` DEMO data
- `src/state/session.tsx` in-memory session: stale-response protection, invalidation on destination/chain change, per-check acknowledgements
- `src/lib/useTransfer.ts` tx lifecycle, duplicate-submit guard · `src/lib/useFee.ts` gas estimate (never fabricated)
- `src/lib/consult.ts` evidence-grounded answers · `src/components/*` UI · `src/pages/*` routes

## Known limitations

- Layout follows `pic/BRIDGEˣ แอปความปลอดภัย Web3 12 หน้าจอ.png`; side-by-side capture in `screenshots/00-contact-sheet.png`. Deviations: no USD values (no price source), no QR-scan button, notifications shown as "Not available" (no fake switch), CRITICAL keeps the acknowledgement checkbox, Core Wallet instead of Coinbase (spec).
- Browser tests cover injected-wallet connection, wrong network, rejection, RPC failure, successful and reverted receipts, unknown confirmation, and duplicate submissions with mocked wallet/RPC responses. A real wallet and testnet transfer remain unverified.
- Failed-API e2e not covered (unit tests cover timeout/network/schema/retry in the client).
- Continent shapes on the globe are approximate blobs, not cartographic data.
- Secondary text and link colors are slightly darker than the spec (#556378, #2A5CC4) to pass WCAG AA; critical/warning text uses darker "ink" tokens.
- Main JS chunk is ~2 MB (AppKit); not code-split yet.
