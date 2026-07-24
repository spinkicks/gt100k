import { describe, expect, it } from "vitest";

import { PROJECT_WORKSPACE_PACKAGE } from "../src/index.js";

describe("@gt100k/project-workspace scaffold", () => {
  it("exposes its package name", () => {
    expect(PROJECT_WORKSPACE_PACKAGE).toBe("@gt100k/project-workspace");
  });
});
