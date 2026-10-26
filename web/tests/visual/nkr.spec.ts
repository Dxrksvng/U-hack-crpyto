import { expect, test, type Page } from "@playwright/test";
import { ADDR, open } from "../e2e/helpers";
import { connectMockWallet, installMockWallet } from "../e2e/wallet-mock";

async function navigate(page: Page, path: string) {
  await page.evaluate((url) => { window.history.pushState({}, "", url); window.dispatchEvent(new PopStateEvent("popstate")); }, path);
}

for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  test(`NO_KNOWN_RISK screenshots ${viewport.width}`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize(viewport);
    await installMockWallet(page, { send: "slow" });
    await open(page, "/send");
    const shot = async (name: string) => {
      if (name !== "03-checking" && name !== "09-wallet-approval-mocked") {
        await expect(page.locator("main")).toHaveCSS("opacity", "1");
        await page.waitForTimeout(500);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `screenshots/nkr/${viewport.width}/${name}.png` });
    };
    await expect(page.getByTestId("address-input")).toBeVisible();
    await shot("01-send-disconnected");
    await page.getByTestId("connect-button").click();
    await expect(page.getByTestId("wallet-sheet")).toBeVisible();
    await shot("02-wallet-picker");
    await page.keyboard.press("Escape");
    await connectMockWallet(page);
    await page.getByRole("button", { name: "Close toast" }).click();
    await page.getByTestId("amount-input").fill("0.01");
    await page.getByTestId("address-input").fill(ADDR.norisk);
    await page.getByTestId("check-risk").click();
    await expect(page.getByTestId("address-checking")).toBeVisible();
    await shot("03-checking");
    await expect(page.getByTestId("presend-alert")).toBeVisible();
    await shot("04-verdict-popup");
    await page.getByTestId("alert-details").click();
    await expect(page.getByTestId("verdict-card")).toBeVisible();
    await shot("05-analysis");
    await page.getByRole("button", { name: "Risk details" }).click();
    await expect(page.getByTestId("details-gauge")).toBeVisible();
    await shot("06-details");
    await page.getByTestId("details-consult").click();
    await page.getByRole("button", { name: "Which sources were checked?" }).click();
    await expect(page.getByTestId("answer-kind").last()).toBeVisible();
    await shot("07-consult");
    await navigate(page, "/review");
    await expect(page.getByTestId("continue-wallet")).toBeEnabled();
    await shot("08-review");
    await page.getByTestId("continue-wallet").click();
    await expect(page.getByTestId("tx-status")).toHaveAttribute("data-status", "awaiting_approval");
    await shot("09-wallet-approval-mocked");
    await expect(page.getByTestId("tx-success")).toBeVisible({ timeout: 15_000 });
    await shot("10-confirmed-mocked-receipt");
    await navigate(page, "/history");
    await expect(page.getByTestId("history-send")).toBeVisible();
    await shot("11-history");
    await page.getByTestId("bottom-nav").getByRole("link", { name: "Settings" }).click();
    await expect(page.getByTestId("appearance-row")).toBeVisible();
    await shot("12-settings");
  });
}
