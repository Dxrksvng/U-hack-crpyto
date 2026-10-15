import base from "./playwright.config";
import { defineConfig } from "@playwright/test";

export default defineConfig({ ...base, testDir: "tests/visual", projects: [{ name: "iphone", use: { channel: "chrome", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 } }] });
