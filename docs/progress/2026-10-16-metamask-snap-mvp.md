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
