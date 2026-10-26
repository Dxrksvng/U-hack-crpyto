import { expect, test, type Page } from "@playwright/test";
import { ADDR, open } from "./helpers";
import { MOCK_HASH, connectMockWallet, installMockWallet, type WalletScenario } from "./wallet-mock";

test.describe("disconnected mode (no wallet, no VITE_REOWN_PROJECT_ID)", () => {
  test("never shows a connected wallet; shows Wallet not configured with setup help", async ({ page }) => {
    await open(page, "/send");
    await expect(page.getByTestId("wallet-chip")).toHaveCount(0);
    await expect(page.getByText("Connected", { exact: true })).toHaveCount(0);
    const btn = page.getByTestId("connect-button");
    await expect(btn).toHaveText("Wallet not configured");
    await btn.click();
    await expect(page.getByTestId("wallet-config-notice")).toContainText("VITE_REOWN_PROJECT_ID");
    await expect(page.getByTestId("wallet-walletconnect")).toBeDisabled();
    await expect(page.getByTestId("wallet-metamask")).toBeDisabled();
  });

  test("DEMO risk check works with no wallet and no amount", async ({ page }) => {
    await open(page, "/send");
    await page.getByTestId("address-input").fill(ADDR.critical);
    await expect(page.getByTestId("amount-input")).toHaveValue("");
    await page.getByTestId("check-risk").click();
    await expect(page.getByTestId("presend-alert")).toBeVisible({ timeout: 8000 });
    await page.getByTestId("alert-cancel").click();
    const v = page.getByTestId("inline-verdict");
    await expect(v).toHaveAttribute("data-verdict", "CRITICAL");
    await expect(v.getByText("DEMO")).toBeVisible();
    await expect(page.getByTestId("send-tx")).toBeDisabled();
    await expect(page.getByTestId("send-tx")).toHaveAttribute("data-block", "not_connected");
  });

  test("check and send are separate actions", async ({ page }) => {
    await open(page, "/send");
    await expect(page.getByTestId("check-risk")).toContainText("Check address risk");
    await expect(page.getByTestId("send-tx")).toContainText("Send transaction");
  });
});

async function readyToSend(page: Page, sc: WalletScenario = {}, amount = "0.01") {
  await installMockWallet(page, sc);
  await open(page, "/send");
  await connectMockWallet(page);
  await page.getByTestId("address-input").fill(ADDR.norisk);
  await expect(page.getByTestId("inline-verdict")).toBeVisible({ timeout: 8000 });
  await page.getByTestId("amount-input").fill(amount);
}
async function sendFromPreview(page: Page) {
  await expect(page.getByTestId("send-tx")).toBeEnabled({ timeout: 8000 });
  await page.getByTestId("send-tx").click();
  await expect(page).toHaveURL(/\/review$/);
  await expect(page.getByTestId("continue-wallet")).toBeEnabled({ timeout: 8000 });
  await page.getByTestId("continue-wallet").click();
}

test.describe("send-button eligibility (mock EIP-1193 wallet)", () => {
  test("header shows the wallet only after wagmi connects it", async ({ page }) => {
    await installMockWallet(page);
    await open(page, "/send");
    await expect(page.getByTestId("connect-button")).toHaveText("Connect");
    await connectMockWallet(page);
    await expect(page.getByTestId("wallet-chip")).toContainText("Connected");
  });

  test("a wallet that already approved this site reconnects for real on load", async ({ page }) => {
    await installMockWallet(page, { preAuthorized: true });
    await open(page, "/send");
    await expect(page.getByTestId("wallet-chip")).toContainText("0x00…00A1");
  });

  test("blocks without amount, with too much, and enables once valid and checked", async ({ page }) => {
    await readyToSend(page, {}, "");
    const send = page.getByTestId("send-tx");
    await expect(send).toHaveAttribute("data-block", "amountInvalid");
    await page.getByTestId("amount-input").fill("5");
    await expect(send).toHaveAttribute("data-block", "insufficient");
    await page.getByTestId("amount-input").fill("0.01");
    await expect(send).toBeEnabled({ timeout: 8000 });
  });

  test("wrong network blocks sending until the wallet switches", async ({ page }) => {
    await readyToSend(page, { chainId: 11155111 });
    const send = page.getByTestId("send-tx");
    await expect(send).toHaveAttribute("data-block", "wrong_network");
    await page.getByTestId("send-block").getByRole("button", { name: /Switch to Fuji/ }).click();
    await expect(send).toBeEnabled({ timeout: 8000 });
  });
});

test.describe("transaction lifecycle (mocked wallet + RPC, no real funds)", () => {
  test("success: hash, explorer link, confirmed only after receipt", async ({ page }) => {
    await readyToSend(page);
    await sendFromPreview(page);
    const success = page.getByTestId("tx-success");
    await expect(success).toBeVisible({ timeout: 15_000 });
    await expect(success).toContainText("Confirmed on-chain");
    await expect(success.getByRole("link", { name: "View on explorer" })).toHaveAttribute("href", `https://explorer-test.avax.network/c-chain/tx/${MOCK_HASH}`);
  });

  test("wallet rejection shows Transaction rejected at the approval step, with retry", async ({ page }) => {
    await readyToSend(page, { send: "reject" });
    await sendFromPreview(page);
    const st = page.getByTestId("tx-status");
    await expect(st).toHaveAttribute("data-status", "rejected");
    await expect(st).toHaveAttribute("data-failed-step", "awaiting_approval");
    await expect(page.getByTestId("tx-error")).toContainText("Transaction rejected");
    await expect(page.getByTestId("tx-retry")).toBeVisible();
  });

  test("-32006 from the wallet is shown as the exact failed step with technical details", async ({ page }) => {
    await readyToSend(page, { send: "rpc32006" });
    await sendFromPreview(page);
    const st = page.getByTestId("tx-status");
    await expect(st).toHaveAttribute("data-status", "failed");
    await expect(st).toHaveAttribute("data-failed-step", "awaiting_approval");
    await expect(page.getByTestId("tx-step-preparing")).toHaveAttribute("data-state", "done");
    await expect(page.getByTestId("tx-step-awaiting_approval")).toHaveAttribute("data-state", "failed");
    await page.getByText("Technical details").click();
    await expect(page.getByTestId("tx-details")).toContainText("-32006");
  });

  test("reverted receipt fails at confirmation and keeps the explorer link", async ({ page }) => {
    await readyToSend(page, { receipt: "reverted" });
    await sendFromPreview(page);
    const st = page.getByTestId("tx-status");
    await expect(st).toHaveAttribute("data-status", "failed", { timeout: 15_000 });
    await expect(st).toHaveAttribute("data-failed-step", "pending_confirmation");
    await expect(page.getByTestId("tx-explorer")).toBeVisible();
    await expect(page.getByTestId("tx-retry")).toHaveCount(0);
  });

  test("no receipt in time gives Confirmation unknown with no retry", async ({ page }) => {
    await readyToSend(page, { receipt: "never" });
    await sendFromPreview(page);
    const st = page.getByTestId("tx-status");
    await expect(st).toHaveAttribute("data-status", "confirmation_unknown", { timeout: 20_000 });
    await expect(page.getByTestId("tx-error")).toContainText("Check the explorer");
    await expect(page.getByTestId("tx-retry")).toHaveCount(0);
    await expect(page.getByTestId("tx-explorer")).toBeVisible();
  });

  test("double-click submits only once", async ({ page }) => {
    await readyToSend(page, { send: "slow" });
    await expect(page.getByTestId("send-tx")).toBeEnabled({ timeout: 8000 });
    await page.getByTestId("send-tx").click();
    await page.getByTestId("continue-wallet").dblclick();
    await expect(page.getByTestId("tx-success")).toBeVisible({ timeout: 15_000 });
    expect(await page.evaluate(() => (window as unknown as { __sendCount: number }).__sendCount)).toBe(1);
  });
});
