# 2026-10-15 BridgeSecur frontend v3 (12 screens, tests)

**What changed**: Expanded `web/` to 12 screens (checking overlay, risk details, preview + tx lifecycle, assistant, history, settings, info pages); canvas globe rotating 50s/rev; zod-validated API client with abort/timeout/retry; in-memory session store; ESLint, Vitest (28), Playwright (60, system Chrome, axe, 6-viewport overflow), visual capture config.

**Decisions**
- Session data never persisted (privacy promise); E2E asserts no address in storage.
- CRITICAL "Continue" uses aria-disabled until acknowledged (never removed).
- Checking pipeline shows "running" for all remote steps until the result; steps then map from tier statuses (no fake per-step ticks).
- fg-muted #556378 and primary-ink #2A5CC4 instead of spec #64748B/#3B6FD8 for text, for WCAG AA (axe).
- "Show similar cases" quick reply omitted: no case data source.

**Next**: verify wallet + Fuji send with a real wallet; real backend; code-split AppKit; failed-API e2e via VITE_API_URL stub server.

## Update: matched the 12-screen storyboard (pic/BRIDGEˣ … 12 หน้าจอ.png)
- Added bottom tab bar (Send/History/BridgeConsult/Settings), per-screen top bars (8, 9, 11, 12), custom wallet picker sheet (installed EIP-6963 wallets via wagmi; otherwise AppKit `AllWallets` / `ConnectingWalletConnectBasic`).
- Restyled menu, landing CTA/trust row, send form (network row, inline "To", token pill, local-only note), checking screen (bilingual steps, info card), alert (red filled cancel), risk details (gauge + severity pills), preview (risk banner, red cancel), consult (pill suggestions), history (segmented tabs), settings (icon rows).
- Deliberate deviations: no USD amounts, no QR scan, no notification switch, Core instead of Coinbase, CRITICAL ack checkbox kept.
- Verified: tsc, eslint, vitest 28/28, playwright 58/58, build.

## Update: verification pass (2026-10-15, late)
- Full suite re-run: tsc, eslint, vitest 28/28, build OK, playwright 58/58 (one run reported 57; re-run 58 — possible flake, not yet identified).
- Visual fix: logo "x" now raised beside BRIDGE (was rendered like a subscript).
- Capture fix: visual spec removes the "Transfer cancelled" toast before capturing screens 7-9 (it covered content).
- Still unverified: real wallet connect (needs VITE_REOWN_PROJECT_ID), Fuji/Sepolia send, live backend (VITE_API_URL).
