import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["passion/packages/**/test/**/*.test.ts", "passion/adapters/**/test/**/*.test.ts"],
    environment: "node",
  },
});
