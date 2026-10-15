import { expect, test } from "@playwright/test";
import { open } from "./helpers";

const VIEWPORTS = [[375, 812], [390, 844], [393, 852], [430, 932], [768, 1024], [1440, 900]] as const;
const ROUTES = ["/", "/send", "/consult", "/history", "/settings", "/preview", "/learn"];

for (const [w, h] of VIEWPORTS)
  test(`no horizontal overflow at ${w}x${h}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    for (const r of ROUTES) {
      await open(page, r);
      await page.waitForTimeout(150);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${r} overflows by ${overflow}px`).toBeLessThanOrEqual(0);
    }
  });
