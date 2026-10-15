import { defineConfig } from "vitest/config";

export default defineConfig({
  oxc: {
    jsx: {
      runtime: "automatic",
      importSource: "@metamask/snaps-sdk",
    },
  },
  test: {
    include: ["test/**/*.test.{ts,tsx}"],
  },
});
