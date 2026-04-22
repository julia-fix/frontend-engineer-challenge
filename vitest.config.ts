import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text"],
    },
  },
})
