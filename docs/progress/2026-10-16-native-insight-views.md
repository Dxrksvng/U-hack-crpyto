# Native Insight reference views

The user's Flask screenshot confirms version 0.1.7 displays the BridgeSecur insight. Its first visible content is the large logo and title, with the verdict below the fold. The requested references are the pre-send warning, analysis chat, and risk details.

The new presentation prioritizes the warning and separates the report into interactive native views. The data remains the existing per-transaction provider result. A missing score remains unavailable, and fixture findings remain labelled DEMO.

The alternative was to stack all three reports in one static panel. That repeats content and makes the user scroll before finding controls. Interactive interfaces let the user move between the warning, analysis and details while keeping the current transaction's context.

MetaMask controls the surrounding confirmation, theme, and transaction cancel/confirm buttons. The Snap must not label a report-navigation action as transaction cancellation or approval. The screenshots' full-page web layout and white bottom sheet are not a supported replacement for the native MetaMask confirmation.

The Model the Domain principle keeps each transaction in a separate typed interface context. Prove It Works requires testing actual SDK UI and interface updates; a valid bundle alone does not prove native visual parity.

Official API reference: [Interactive UI](https://docs.metamask.io/snaps/features/custom-ui/interactive-ui/).

## Update the installed Snap

Close pending transaction requests before updating. From the website console, request the exact new version so an already installed 0.1.7 does not satisfy an unspecified version range:

```js
window.ethereum.request({
  method: "wallet_requestSnaps",
  params: { "local:http://localhost:8080": { version: "0.1.8" } },
}).then(console.log).catch(console.error);
```

Approve the Flask update. Start a new Send review on Sepolia to the critical demo address `0xdead000000000000000000000000000000000001`. Check the warning, open the analysis, open details, and return. Verify the demo score is 92 and no real-chain claim is added. Do not confirm a transfer merely to view the report.

## Verification

Version 0.1.8 passes typecheck and 39 tests across four files. The Snap build evaluates successfully. The built bundle smoke check exercises interface creation, all three views, question submission, JSON serialization and the actual SDK UI schema. Parent independently reran the built-bundle check successfully. The server returns the 0.1.8 manifest. No new permissions were added.

A fresh native screenshot is required before claiming the new views render correctly in the installed Flask version. No transaction was broadcast.
