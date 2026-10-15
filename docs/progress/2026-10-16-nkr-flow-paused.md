# 2026-10-16 NO_KNOWN_RISK flow + wallet/tx fixes (PAUSED mid-way)

**What changed (done, in web/)**
- Wallet: no fake "Connected"; "Wallet not configured" state + setup notice; check and send are separate actions (`sendEligibility` in `src/lib/txMachine.ts`); Fuji RPC via explicit http transport; tx state machine (`runTransfer`) with unit tests (54 pass) and mocked-wallet Playwright (`tests/e2e/wallet.spec.ts`, 13 pass).
- Root cause of "-32006 JSON-RPC version not supported": viem maps code -32006 to JsonRpcVersionUnsupportedError; AppKit's default fallback transport (rpc.walletconnect.org) rejects with a missing projectId. Not verified against a real wallet.
- NKR (in progress): contract `score` nullable + `sources[]` (SourceStatus); DEMO fixture NKR (score null, sources simulated); green verdict tokens; `SourceList`; NKR variant in `PreSendAlertSheet`; SendForm opens it; routes `/review`, `/transaction/:id`; `useTransfer(routeId)` global in-flight guard; `TransactionSuccess`; consult NKR questions; RiskDetails NKR actions.

**Not done / unverified**
- Last full tsc/eslint/vitest/playwright run happened BEFORE the NKR edits; rerun everything.
- Update old e2e/visual specs for `/preview` -> `/review` (redirect exists), new NKR e2e spec, History NKR row polish, README matrix.
- No real wallet/testnet verification yet.

**Next**: rerun `npm run test:all` in web/, fix fallout, write NKR e2e + screenshots.
