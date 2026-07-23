import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  test: {
    include: [
      "passion/packages/**/test/**/*.test.ts",
      "passion/packages/**/test/**/*.test.tsx",
      "passion/adapters/**/test/**/*.test.ts",
    ],
    environment: "node",
  },
});
