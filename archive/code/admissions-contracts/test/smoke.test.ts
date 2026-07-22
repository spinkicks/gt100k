import { describe, expect, it } from "vitest";

import { WORKFLOW_STATUSES } from "../src/registers.js";
import { createApplicationVersion } from "../src/versioning.js";

describe("admissions contracts seeded smoke", () => {
  it("creates a deterministic synthetic draft against the locked registers", () => {
    const version = createApplicationVersion({
      versionId: "application-smoke:v1",
      version: 1,
      state: "draft",
      supersedes: null,
      content: {
        seed: "family-selection-p0-v1",
        fixture: "synthetic-only",
      },
    });

    expect(WORKFLOW_STATUSES).toHaveLength(12);
    expect(version.contentHash).toBe(
      "sha256:9c15d891dedeee92f6c5d9121ae5cb0b51f12f7aa2457dbc16e9db8315eb1163",
    );
    expect(version.state).toBe("draft");
  });
});
