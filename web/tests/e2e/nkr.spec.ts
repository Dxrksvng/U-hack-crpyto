import { expect, test } from "@playwright/test";
import { ADDR, checkAddress, open } from "./helpers";
import { connectMockWallet, installMockWallet } from "./wallet-mock";

test("NO_KNOWN_RISK popup is explicit, cancellable, and works without wallet or amount", async ({ page }) => {
  await open(page, "/send");
  await page.getByTestId("address-input").fill(ADDR.norisk);
  await page.getByTestId("check-risk").click();
  const sheet = page.getByTestId("presend-alert");
  await expect(sheet).toBeVisible();
  await expect(sheet).toContainText("DEMO");
  await expect(page.getByTestId("ack-checkbox")).toHaveCount(0);
  await expect(page.getByTestId("alert-continue")).toHaveAttribute("aria-disabled", "true");
  await page.getByTestId("alert-cancel").click();
  await expect(sheet).toBeHidden();
  await expect(page).toHaveURL(/\/send$/);
  await expect(page.getByTestId("tx-status")).toHaveCount(0);
  await expect(page.getByTestId("inline-verdict")).toHaveAttribute("data-verdict", "NO_KNOWN_RISK");
});

test("NO_KNOWN_RISK shows actual source limits and all five consult answers", async ({ page }) => {
  await open(page, "/send");
  await checkAddress(page, ADDR.norisk);
  await page.getByRole("button", { name: "Open analysis" }).click();
  await expect(page.getByTestId("verdict-card")).toContainText("DEMO");
  await page.getByRole("button", { name: "Risk details" }).click();
  await expect(page.getByTestId("details-gauge")).not.toContainText("92");
  await expect(page.getByTestId("demo-sources-note")).toBeVisible();
  await page.getByTestId("details-consult").click();
  await expect(page.getByTestId("nkr-intro")).toBeVisible();
  for (const label of ["Why was no risk found?", "Which sources were checked?", "What are the limits of this result?", "What else should I verify?", "What if I send to the wrong address?"]) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect(page.getByTestId("answer-kind")).toHaveCount(["Why was no risk found?", "Which sources were checked?", "What are the limits of this result?", "What else should I verify?", "What if I send to the wrong address?"].indexOf(label) + 1);
  }
});

test("historical NO_KNOWN_RISK review restores its own destination", async ({ page }) => {
  await installMockWallet(page);
  await open(page, "/send");
  await connectMockWallet(page);
  await checkAddress(page, ADDR.norisk);
  await page.getByRole("button", { name: "Open analysis" }).click();
  const original = page.url();
  await page.evaluate(() => { window.history.pushState({}, "", "/send"); window.dispatchEvent(new PopStateEvent("popstate")); });
  await checkAddress(page, ADDR.warning);
  await page.getByTestId("amount-input").fill("0.01");
  await page.evaluate((url) => { window.history.pushState({}, "", new URL(url).pathname + "/details"); window.dispatchEvent(new PopStateEvent("popstate")); }, original);
  await page.getByTestId("details-review").click();
  await expect(page).toHaveURL(/\/review$/);
  await expect(page.getByTestId("preview-to")).toHaveText(ADDR.norisk);
  await expect(page.getByTestId("preview-verdict")).toContainText("No known risk");
  expect(await page.evaluate(() => (window as unknown as { __sendCount: number }).__sendCount)).toBe(0);
});
