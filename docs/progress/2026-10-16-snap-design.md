# Snap risk UI and the BRIDGEˣ reference

The supplied screenshots show MetaMask Flask's native transaction confirmation, the Snap insight, an alert dialog, and installed-Snap settings. The reference images show a standalone BRIDGEˣ application. These are different UI owners.

`wallet_requestSnaps` requests installation or an update. It does not open the risk result. MetaMask invokes `onTransaction` when the user reviews a transaction.

The Snap can arrange the JSX components supported by the SDK. MetaMask owns the surrounding Send screen, install permissions, settings, theme, and dialog footer. Matching the white bottom sheet and red cancellation button exactly requires the web application's `PreSendAlertSheet`.

Official references are [Custom UI](https://docs.metamask.io/snaps/features/custom-ui/) and [Snaps entry points](https://docs.metamask.io/snaps/reference/entry-points/).

## Check the updated local Snap

1. Build the package with `npm run build` in `packages/bridgesecur-snap`.
2. Keep `npm run serve` running on port 8080.
3. Run the following request from the connected site's browser console and approve MetaMask's update prompt.

```js
window.ethereum.request({
  method: "wallet_requestSnaps",
  params: { "local:http://localhost:8080": {} },
}).then(
  (result) => console.log("OK", JSON.stringify(result)),
  (error) => console.log("ERR", error.code, error.message),
);
```

4. Inspect the installed version in MetaMask's Snap settings.
5. On Sepolia, review a Send transaction to `0xdead000000000000000000000000000000000001`. Check the critical warning, recipient, score 92/100, demo evidence, and recommended action.
6. Close the Snap alert and cancel the transaction using MetaMask's Send controls. Dismissing the Snap dialog does not cancel the transaction.

The provider uses deterministic demo fixtures. The UI must not claim real chain tracing, phishing reports, or money-laundering evidence.

## Verification

Typecheck, 31 unit tests including actual SDK JSX validation, and the Snap build pass. The local server returns version 0.1.7. The revised UI has not yet been observed in a live MetaMask extension session.
