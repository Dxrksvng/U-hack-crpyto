import { expect, test } from "@playwright/test";
import { ADDR, checkAddress, open } from "./helpers";

test.describe("navigation & preferences", () => {
  test("menu opens, closes (Esc, close button, backdrop) and restores focus", async ({ page }) => {
    await open(page);
    const btn = page.getByTestId("menu-button");
    await btn.click();
    await expect(page.getByTestId("menu-sheet")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("menu-sheet")).toBeHidden();
    await expect(btn).toBeFocused();
    await btn.click();
    await page.getByRole("button", { name: "Close menu" }).click();
    await expect(page.getByTestId("menu-sheet")).toBeHidden();
    await btn.click();
    await page.mouse.click(200, 40);
    await expect(page.getByTestId("menu-sheet")).toBeHidden();
  });

  const links: [string, string][] = [
    ["BridgeConsult", "/consult"], ["API", "/api"], ["Fraud Learning Center", "/learn"],
    ["About Us", "/about"], ["Partnerships", "/partnerships"], ["Legal & Privacy", "/privacy"], ["Contact Us", "/contact"],
  ];
  for (const [label, path] of links)
    test(`menu link "${label}" navigates to ${path}`, async ({ page }) => {
      await open(page);
      await page.getByTestId("menu-button").click();
      await page.getByTestId("menu-sheet").getByRole("button", { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.locator("h1").first()).toBeVisible();
    });

  test("language toggle switches TH/EN and persists only the language", async ({ page }) => {
    await open(page, "/send");
    await expect(page.getByRole("heading", { name: "Send" })).toBeVisible();
    await page.getByTestId("menu-button").click();
    await page.getByRole("button", { name: "ไทย" }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("heading", { name: "โอน" })).toBeVisible();
    // Privacy promise: addresses are never written to storage.
    await page.keyboard.press("Escape");
    await page.getByTestId("address-input").fill(ADDR.norisk);
    await expect(page.getByTestId("inline-verdict")).toBeVisible({ timeout: 6000 });
    const dump = await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }));
    expect(dump.toLowerCase()).not.toContain(ADDR.norisk.toLowerCase());
    expect(await page.evaluate(() => localStorage.getItem("bs.lang"))).toBe("th");
  });

  test("theme switch in settings applies dark mode", async ({ page }) => {
    await open(page, "/settings");
    await page.getByTestId("appearance-row").click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.getByTestId("appearance-row").click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("keyboard: open menu with Enter, close with Escape", async ({ page }) => {
    await open(page);
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => document.activeElement?.getAttribute("data-testid"));
    expect(["menu-button", null]).toContain(focused);
    await page.getByTestId("menu-button").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("menu-sheet")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("menu-button")).toBeFocused();
  });

  test("hero CTA navigates to /send", async ({ page }) => {
    await open(page);
    await page.getByTestId("hero-cta").click();
    await expect(page).toHaveURL(/\/send$/);
  });
});

test.describe("wallet", () => {
  // Without VITE_REOWN_PROJECT_ID the AppKit modal cannot work, so the picker says so and disables those rows
  // (the AppKit hand-off needs a real project id and is verified manually; see README).
  test("Connect opens the wallet picker; unconfigured rows are disabled with a setup message", async ({ page }) => {
    await open(page);
    await page.getByTestId("connect-button").click();
    const sheet = page.getByTestId("wallet-sheet");
    await expect(sheet).toBeVisible();
    for (const w of ["metamask", "walletconnect", "trust", "core"]) await expect(page.getByTestId(`wallet-${w}`)).toBeVisible();
    await expect(page.getByTestId("wallet-config-notice")).toBeVisible();
    await expect(sheet.getByRole("button", { name: "View more wallets" })).toBeDisabled();
    await expect(page.getByTestId("wallet-chip")).toHaveCount(0);
  });
});

test.describe("destination check", () => {
  test("invalid address is rejected and cannot be checked", async ({ page }) => {
    await open(page, "/send");
    await page.getByTestId("address-input").fill("0x1234");
    await expect(page.getByText("Not a valid address")).toBeVisible();
    await expect(page.getByTestId("check-risk")).toBeDisabled();
  });

  for (const [k, verdict] of [["critical", "CRITICAL"], ["warning", "WARNING"], ["unknown", "UNKNOWN"], ["norisk", "NO_KNOWN_RISK"]] as const)
    test(`fixture ${verdict} renders with DEMO label and no safe verdict`, async ({ page }) => {
      await open(page, "/send");
      await checkAddress(page, ADDR[k]);
      const v = page.getByTestId("inline-verdict");
      await expect(v).toHaveAttribute("data-verdict", verdict);
      await expect(v.getByText("DEMO")).toBeVisible();
      const text = (await v.innerText()).toLowerCase().replace("does not mean it is safe", "");
      expect(text).not.toMatch(/\bis safe\b/);
    });

  test("editing the address invalidates the previous result", async ({ page }) => {
    await open(page, "/send");
    await checkAddress(page, ADDR.critical);
    await page.getByTestId("address-input").fill(ADDR.norisk.slice(0, 20));
    await expect(page.getByTestId("inline-verdict")).toHaveCount(0);
    await page.getByTestId("address-input").fill(ADDR.norisk);
    await expect(page.getByTestId("inline-verdict")).toHaveAttribute("data-verdict", "NO_KNOWN_RISK", { timeout: 6000 });
  });

  test("checking screen shows honest pipeline, then CRITICAL alert requires acknowledgement; cancel sends nothing", async ({ page }) => {
    await open(page, "/send");
    await page.getByTestId("address-input").fill(ADDR.critical);
    await page.getByTestId("check-risk").click();
    const checking = page.getByTestId("address-checking");
    if (await checking.isVisible().catch(() => false)) {
      await expect(page.getByTestId("step-intel")).not.toHaveAttribute("data-status", "completed");
    }
    const alert = page.getByTestId("presend-alert");
    await expect(alert).toBeVisible({ timeout: 6000 });
    await expect(page.getByTestId("alert-title")).toContainText("CRITICAL SECURITY ALERT");
    await expect(page.getByTestId("alert-continue")).toHaveAttribute("aria-disabled", "true");
    await page.getByTestId("alert-continue").click({ force: true });
    await expect(alert).toBeVisible(); // still blocked by the checkbox
    await page.getByTestId("alert-cancel").click();
    await expect(alert).toBeHidden();
    await expect(page.getByText("Transfer cancelled. Nothing was sent.")).toBeVisible();
    await expect(page).toHaveURL(/\/send$/);
  });

  test("continue after acknowledgement without a wallet explains why it cannot send (never auto-sends)", async ({ page }) => {
    await open(page, "/send");
    await page.getByTestId("address-input").fill(ADDR.critical);
    await page.getByTestId("check-risk").click();
    await expect(page.getByTestId("presend-alert")).toBeVisible({ timeout: 6000 });
    await page.getByTestId("ack-checkbox").check();
    await page.getByTestId("alert-continue").click();
    await expect(page.getByText("Connect a wallet to send").first()).toBeVisible();
    await expect(page).toHaveURL(/\/send$/);
    await expect(page.getByTestId("tx-status")).toHaveCount(0);
  });

  test("WARNING alert is amber and needs no checkbox", async ({ page }) => {
    await open(page, "/send");
    await page.getByTestId("address-input").fill(ADDR.warning);
    await page.getByTestId("check-risk").click();
    await expect(page.getByTestId("presend-alert")).toBeVisible({ timeout: 6000 });
    await expect(page.getByTestId("alert-title")).toContainText("RISK WARNING");
    await expect(page.getByTestId("ack-checkbox")).toHaveCount(0);
  });

  test("mainnet is check-only", async ({ page }) => {
    await open(page, "/send");
    await page.getByRole("combobox", { name: "Network" }).first().click();
    await page.getByRole("option", { name: "Ethereum", exact: true }).click();
    await expect(page.getByTestId("amount-input")).toHaveCount(0);
    await expect(page.getByTestId("send-tx")).toHaveCount(0);
    await expect(page.getByText(/Mainnet is check-only/)).toBeVisible();
  });

  test("address poisoning look-alike is highlighted", async ({ page }) => {
    await open(page, "/send");
    await page.getByTestId("address-input").fill("0x1a2b000000000000000000000000000000003c4d");
    await expect(page.getByTestId("poisoning")).toBeVisible();
    expect(await page.getByTestId("poisoning").locator("mark").count()).toBeGreaterThan(10);
  });
});

test.describe("analysis, details, chat, history", () => {
  test("analysis chat, risk details evidence and source links", async ({ page }) => {
    await open(page, "/send");
    await checkAddress(page, ADDR.critical);
    await page.getByRole("button", { name: "Open analysis" }).click();
    await expect(page).toHaveURL(/\/analysis\/chk_/);
    await expect(page.getByTestId("verdict-card")).toBeVisible();
    await page.getByRole("button", { name: "Risk details" }).click();
    await expect(page).toHaveURL(/\/details$/);
    await expect(page.getByTestId("evidence-item")).toHaveCount(4);
    await expect(page.getByText("Critical", { exact: true }).first()).toBeVisible();
    const link = page.getByTestId("evidence-link").first();
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("href", /^https:\/\//);
    await expect(page.getByTestId("audit-footer")).toContainText("policy v1.3-demo");
    await page.getByRole("button", { name: "Why this verdict?" }).click();
    await expect(page.getByRole("dialog")).toContainText("Only known threat lists");
  });

  test("quick replies and free-text answers are grounded and labelled", async ({ page }) => {
    await open(page, "/send");
    await checkAddress(page, ADDR.warning);
    await page.getByRole("button", { name: "Open analysis" }).click();
    await page.getByRole("button", { name: "Why is this risky?" }).click();
    await expect(page.getByTestId("answer-kind").last()).toHaveAttribute("data-kind", "fact");
    await expect(page.getByTestId("msg-bot").last()).toContainText("Received funds from a flagged address");
    await page.getByTestId("chat-input").fill("how much did this scammer steal?");
    await page.getByTestId("chat-send").click();
    await expect(page.getByTestId("answer-kind").last()).toHaveAttribute("data-kind", "unknown");
    await expect(page.getByTestId("chat-send")).toBeDisabled();
  });

  test("bottom tab bar navigates between app screens", async ({ page }) => {
    await open(page, "/send");
    const nav = page.getByTestId("bottom-nav");
    for (const [name, path] of [["History", "/history"], ["BridgeConsult", "/consult"], ["Settings", "/settings"], ["Send", "/send"]] as const) {
      await nav.getByRole("link", { name }).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
    }
  });

  test("BridgeConsult works without a check and labels its mode", async ({ page }) => {
    await open(page, "/consult");
    await expect(page.getByTestId("consult-mode")).toBeVisible();
    await page.getByRole("button", { name: "What is address poisoning?" }).click();
    await expect(page.getByTestId("answer-kind").last()).toHaveAttribute("data-kind", "education");
  });

  test("history distinguishes checks from transfers and is session-only", async ({ page }) => {
    await open(page, "/send");
    await checkAddress(page, ADDR.norisk);
    await page.getByTestId("bottom-nav").getByRole("link", { name: "History" }).click();
    await expect(page.getByTestId("session-note")).toBeVisible();
    await expect(page.getByTestId("history-check")).toHaveCount(1);
    await page.getByRole("tab", { name: "Sent" }).click();
    await expect(page.getByTestId("history-check")).toHaveCount(0);
    await page.getByRole("tab", { name: "All" }).click();
    await page.getByTestId("history-check").click();
    await expect(page.getByRole("dialog")).toContainText("Check only. No funds were sent.");
    await page.reload();
    await expect(page.getByTestId("history-check")).toHaveCount(0);
  });

  test("preview without a check shows an empty state, not a fake transfer", async ({ page }) => {
    await open(page, "/preview");
    await expect(page.getByText("Nothing to review yet")).toBeVisible();
  });

  test("settings: report needs a check; links work", async ({ page }) => {
    await open(page, "/settings");
    await page.getByTestId("settings-report").click();
    await expect(page.getByText("Check an address first")).toBeVisible();
    await page.getByRole("button", { name: /Privacy Policy/ }).click();
    await expect(page).toHaveURL(/\/privacy$/);
  });
});

test.describe("motion", () => {
  test("reduced motion removes the orbit animation on the checking screen", async ({ page }) => {
    await open(page, "/send");
    await page.getByTestId("address-input").fill(ADDR.norisk);
    await page.getByTestId("check-risk").click();
    await expect(page.getByTestId("orbit")).toHaveCount(0);
  });
});
