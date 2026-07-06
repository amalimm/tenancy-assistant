import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
      "@app": new URL("./src/app", import.meta.url).pathname,
      "@config": new URL("./src/config", import.meta.url).pathname,
      "@db": new URL("./src/db", import.meta.url).pathname,
      "@features": new URL("./src/features", import.meta.url).pathname,
      "@shared": new URL("./src/shared", import.meta.url).pathname,
    },
  },
})
