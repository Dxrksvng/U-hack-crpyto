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
npm run test        # vitest: 28 unit/component tests
npm run test:e2e    # playwright (uses local Google Chrome): 58 tests, mobile 390x844 + desktop 1440x900, axe, overflow at 6 viewports
npx playwright test -c playwright.visual.config.ts   # writes screenshots/01..12.png
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
| 9 | Transaction preview + status | `/preview` |
| 10 | BridgeConsult | `/consult` |
| 11 | History | `/history` |
| 12 | Settings | `/settings` |
| - | Info pages | `/learn /about /partnerships /privacy /terms /contact /api /help` |

## Demo vs live

| Feature | Status |
|---|---|
| Risk check | DEMO fixtures unless `VITE_API_URL` is set (then `POST /v1/check`, zod-validated, 10s timeout, 1 retry, abortable). Fixture data is labelled DEMO everywhere. |
| Demo endings | `dead` CRITICAL, `beef` WARNING, `0000` UNKNOWN, else NO_KNOWN_RISK. Poisoning demo: `0x1a2b000000000000000000000000000000003c4d` |
| Wallet connect | Live via Reown AppKit + wagmi (needs project id). Not verified with a real wallet in this session. |
| Testnet send (Fuji, Sepolia) | Live wagmi `useSendTransaction` + receipt; lifecycle preparing → awaiting approval → submitted → pending → confirmed/failed/replaced/rejected. Not verified with a real wallet in this session. |
| Mainnet | Check-only. |
| Report address | DEMO, nothing is sent. |
| BridgeConsult | Deterministic templated answers from the check's evidence; no LLM connected. Answers are labelled fact / general guidance / cannot verify. |
| History | In-memory session only, cleared on refresh. |

## Privacy

Only `chain_id` and `destination` are sent for checking. localStorage holds only theme and language (plus AppKit/wagmi connection state). E2E test asserts the destination never appears in storage.

## Architecture

- `src/domain/types.ts` zod schemas + types · `src/lib/api.ts` client · `src/fixtures/demo.ts` DEMO data
- `src/state/session.tsx` in-memory session: stale-response protection, invalidation on destination/chain change, per-check acknowledgements
- `src/lib/useTransfer.ts` tx lifecycle, duplicate-submit guard · `src/lib/useFee.ts` gas estimate (never fabricated)
- `src/lib/consult.ts` evidence-grounded answers · `src/components/*` UI · `src/pages/*` routes

## Known limitations

- Layout follows `pic/BRIDGEˣ แอปความปลอดภัย Web3 12 หน้าจอ.png`; side-by-side capture in `screenshots/00-contact-sheet.png`. Deviations: no USD values (no price source), no QR-scan button, notifications shown as "Not available" (no fake switch), CRITICAL keeps the acknowledgement checkbox, Core Wallet instead of Coinbase (spec).
- Wallet rejection/disconnect/tx confirmation paths are implemented but untested without a real wallet (e2e only proves the AppKit modal opens and nothing auto-sends).
- Failed-API e2e not covered (unit tests cover timeout/network/schema/retry in the client).
- Continent shapes on the globe are approximate blobs, not cartographic data.
- Secondary text and link colors are slightly darker than the spec (#556378, #2A5CC4) to pass WCAG AA; critical/warning text uses darker "ink" tokens.
- Main JS chunk is ~2 MB (AppKit); not code-split yet.
