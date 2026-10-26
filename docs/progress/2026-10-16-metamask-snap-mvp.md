# 2026-10-16 MetaMask Snap MVP (UI-first, DEMO data)

**What changed**
- New isolated package `packages/bridgesecur-snap`: Transaction Insight Snap (`onTransaction`), typed `RiskResult`, `RiskProvider` interface, `MockRiskProvider` with three documented test addresses plus UNKNOWN, Snap JSX UI, manifest with `endowment:transaction-insight`.
- Website: `web/src/components/SnapInstall.tsx` on the Settings page, `web/src/lib/snap.ts` (`wallet_getSnaps` / `wallet_requestSnaps`), en/th i18n keys under `snap`. The transaction flow is untouched.

**Why**
- The Snap UI renders in MetaMask's own Send confirmation, not in the React modal. Mock data first so the UI and install flow can be proven before a backend exists.
- Provider interface lets a future `HttpRiskProvider` replace the mock without touching UI code.

**What is verified**
- Snap: `tsc --noEmit` clean; `vitest` 11/11 (provider verdicts, unsupported chain, case-insensitive match, critical severity, DEMO banner, recipient shown); `mm-snap build` succeeds with manifest shasum refreshed; `mm-snap serve` returns manifest 200 and `/dist/bundle.js` 200.
- Web: `tsc -b` clean; `vite build` succeeds; eslint clean on new files.

**What is NOT verified**
- No real MetaMask Extension or Flask install and no screenshot of the Snap inside a transaction confirmation. The install and insight steps are unexecuted.
- Two existing web unit tests fail (`VerdictCard` multiple "DEMO" text; `demo fixtures` "safe" wording). They relate to the paused NKR fixture work, not this change. Not fixed here.

**What's next**
- Install Snap in MetaMask Flask via `npm run serve`, walk the manual guide in `packages/bridgesecur-snap/README.md`, capture screenshots.
- Fix the two failing web tests (NKR work).

## Update: native Send verified in MetaMask Flask (v0.1.3)

**Verified (manual, MetaMask Flask, Sepolia test network, no transaction confirmed)**
- Snap installed from `local:http://localhost:8080`, version 0.1.3, enabled, permission `endowment:transaction-insight` approved.
- `wallet_getSnaps` returned the Snap after install. Connected sites: localhost:5174.
- Native Send confirmation for recipient `0xdead000000000000000000000000000000000001` shows the BridgeSecur insight: **CRITICAL, score 92/100**, two evidence rows, recommended action in EN and TH, `[DEMO]` labels.
- The transaction was cancelled; nothing was broadcast.

**Not yet verified**
- WARNING, NO_KNOWN_RISK and UNKNOWN screens in native Send (only the unit tests cover them).
- Behaviour after the Snap is removed and reinstalled.

**Root causes found along the way**
1. MetaMask Stable 13.52.0 refuses local Snaps (`Fetching local snaps is disabled`). Use Flask.
2. Non-CRITICAL responses contained `severity: undefined`. MetaMask rejects non-JSON values and crashes the Snap (`Received non-JSON-serializable value`). Fixed in 0.1.3: `severity` is omitted unless CRITICAL. Unit tests now check every response against MetaMask's `JsonStruct`.
3. Installing from the website card failed silently because the card hides the error. The real MetaMask error only appeared through the console. The `wallet_requestSnaps` call was pending until the Add-to-MetaMask approval was completed.

**Unrelated console noise:** `Cannot update transaction as ID not found` came from MetaMask's own transaction state, not from the Snap.

**Still open:** the two failing website tests (VerdictCard "DEMO" duplicate, demo fixture "safe" wording) belong to the paused NKR work and have not been changed.
