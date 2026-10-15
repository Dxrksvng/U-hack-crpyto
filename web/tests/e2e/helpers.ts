import { expect, type Page } from "@playwright/test";

export const ADDR = {
  critical: "0x1111111111111111111111111111111111dead",
  warning: "0x2222222222222222222222222222222222beef",
  unknown: "0x3333333333333333333333333333333333330000",
  norisk: "0x4444444444444444444444444444444444441234",
};
// pad to 40 hex chars
for (const k of Object.keys(ADDR) as (keyof typeof ADDR)[]) {
  const body = ADDR[k].slice(2);
  ADDR[k] = `0x${body.padStart(40, "5").slice(-40)}`;
}

/** Start in English with reduced motion so assertions are not racing animations. */
export async function open(page: Page, path = "/", lang: "en" | "th" = "en") {
  await page.addInitScript((l) => {
    try {
      localStorage.setItem("bs.lang", l);
    } catch {
      /* ignore */
    }
  }, lang);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(path);
}

export async function checkAddress(page: Page, addr: string) {
  await page.getByTestId("address-input").fill(addr);
  await expect(page.getByTestId("inline-verdict")).toBeVisible({ timeout: 6000 });
}
