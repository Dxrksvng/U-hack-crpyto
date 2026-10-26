import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { ADDR, checkAddress, open } from "./helpers";

for (const r of ["/", "/send", "/consult", "/history", "/settings", "/learn"])
  test(`axe: no serious/critical violations on ${r}`, async ({ page }) => {
    await open(page, r);
    await page.waitForTimeout(300);
    const res = await new AxeBuilder({ page }).exclude("w3m-modal").analyze();
    const bad = res.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`)).toEqual([]);
  });

test("axe: analysis details page", async ({ page }) => {
  await open(page, "/send");
  await checkAddress(page, ADDR.critical);
  await page.getByRole("button", { name: "Open analysis" }).click();
  await expect(page.getByTestId("verdict-card")).toBeVisible();
  await expect(page.locator("main")).toHaveCSS("opacity", "1");
  await expect.poll(() => page.locator("main").evaluate((root) =>
    [...root.querySelectorAll<HTMLElement>("[style]")].filter((node) => node.style.opacity !== "" && Number(node.style.opacity) < 1).length,
  )).toBe(0);
  const res = await new AxeBuilder({ page }).exclude("w3m-modal").analyze();
  const bad = res.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`)).toEqual([]);
});
