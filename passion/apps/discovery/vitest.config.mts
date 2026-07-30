import { defineConfig } from "vitest/config";

// The app's own suite. The root config globs only `passion/packages` and `passion/adapters`, so
// without this the checks on `public/pursuits` would run nowhere.
export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
  },
});
