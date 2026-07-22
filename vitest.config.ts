import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  test: {
    include: [
      "passion/packages/**/test/**/*.test.ts",
      "passion/adapters/**/test/**/*.test.ts",
      "passion/apps/interest-lab/test/**/*.test.ts",
    ],
    environment: "node",
  },
});
