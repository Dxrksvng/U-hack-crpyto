# BridgeSecur Transaction Insight (MetaMask Snap)

UI-first MVP. A MetaMask Snap that shows a BridgeSecur risk panel inside MetaMask's
native Send confirmation (`onTransaction`). **All risk data is deterministic DEMO fixtures.**
It is not live sanctions, fraud, or blockchain evidence, and it makes no network calls.

## Commands

```bash
npm install
npm run typecheck     # tsc --noEmit
npm run test:unit     # vitest: provider + UI tests
npm run build         # mm-snap build -> dist/bundle.js, refreshes snap.manifest.json shasum
npm run serve         # serves dist/ and snap.manifest.json on http://localhost:8080
```

`npm test` runs unit tests and then the build.

## Test addresses (DEMO)

| Verdict        | Recipient (any chain in the supported list)  | Score |
|----------------|----------------------------------------------|-------|
| CRITICAL       | `0xdead000000000000000000000000000000000001` | 92    |
| WARNING        | `0xbeef000000000000000000000000000000000002`  | 64    |
| NO_KNOWN_RISK  | `0x5afe000000000000000000000000000000000003`  | none  |
| UNKNOWN        | any other address, or any unsupported chain  | none  |

Supported chains: `eip155:1`, `eip155:11155111` (Sepolia), `eip155:43114`, `eip155:43113` (Fuji).
Matching is case-insensitive. Every result is labelled `[DEMO]` and shows a DEMO MODE banner.

## Architecture

- `src/risk/types.ts`: typed `RiskResult` schema (verdict, nullable score, evidence, mode).
- `src/risk/provider.ts`: `RiskProvider` interface. The UI depends only on this.
- `src/risk/mockProvider.ts`: `MockRiskProvider`, the only provider today.
- `src/ui/insight.tsx`: Snap JSX (`Banner`, `Row`, `Section`, `Icon`) built from a `RiskResult`.
- `src/index.tsx`: `onTransaction`. Picks the provider in one place. Provider exceptions become an UNKNOWN result.

To add the backend later, write an `HttpRiskProvider implements RiskProvider` and change one line in `src/index.tsx`. The UI does not change. Note the Snap runs in a sandbox: an HTTP provider will need `endowment:network-access` and a manifest change.

## Manual test guide: MetaMask Extension

1. Run `npm run serve` (leave it running). Confirm `http://localhost:8080/snap.manifest.json` returns JSON.
2. Use a MetaMask build that supports Snaps. Confirm the version in MetaMask settings. Use **Flask** if the stable build refuses local Snaps.
3. Open the BridgeSecur website (`web/`, `npm run dev`), go to **Settings**, and click **Install BridgeSecur Snap**. Approve MetaMask's install prompt.
4. Back on the website, the status should read "Installed". Installation and wallet connection are separate; you do not need to connect a wallet to install.
5. In MetaMask, open the **Send** flow on a test network (Sepolia). Enter a recipient from the table above and continue to the confirmation screen.
6. Check the BridgeSecur panel: verdict, score (or "Not available"), recipient, evidence, recommended action, DEMO banner. Check that the recipient shown matches the address you entered.
7. Repeat with each test address. Expect the verdicts in the table. Expect the critical severity only for CRITICAL.
8. Use a random address and confirm UNKNOWN ("Inconclusive").
9. Confirm the website still works: the existing transaction flow, and the landing and settings pages.

Do not send real funds for these tests. Use a test-network account with no real value.

## Limitations

- DEMO fixtures only. No real sanctions, fraud, or on-chain analysis. Not a security product.
- No backend, no AI, no network access. The provider is synchronous in effect.
- Only `onTransaction` is implemented. Signature insights (`onSignature`) are not included.
- The Snap is installed locally from `localhost:8080`. A published npm release needs a package publish, which requires your explicit approval.
- `snap.manifest.json` `shasum` changes whenever the bundle changes. `npm run build` refreshes it.
- No `repository` field in `package.json` yet (the build warns about it).
- No icon-rendering verification in MetaMask. Icons are from the SDK's icon set only.
- Real MetaMask verification has not been performed in this environment. See the progress note for what was and was not run.
- The website's npm-published-Snap id is set via `VITE_BRIDGESECUR_SNAP_ID`; the default is the local dev server.
