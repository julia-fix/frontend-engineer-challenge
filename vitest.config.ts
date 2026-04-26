import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    include: [
      "app/**/*.test.{ts,tsx}",
      "features/**/*.test.{ts,tsx}",
      "shared/**/*.test.{ts,tsx}",
      "test/**/*.test.{ts,tsx}",
    ],
    exclude: ["test/**/*.integration.test.ts"],
    setupFiles: ["./test/setup.ts"],
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text"],
    },
  },
})
