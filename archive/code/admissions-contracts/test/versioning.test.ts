import { describe, expect, expectTypeOf, it } from "vitest";

import { type ApplicationVersion, createApplicationVersion } from "../src/versioning.js";

describe("immutable application versions", () => {
  it("snapshots and deeply freezes synthetic content with its canonical hash", () => {
    const content = {
      applicantRef: "family-synthetic-001",
      answers: { interest: "astronomy" },
    };

    const version = createApplicationVersion({
      versionId: "application-synthetic-001:v1",
      version: 1,
      state: "draft",
      supersedes: null,
      content,
    });

    expect(version).toEqual({
      versionId: "application-synthetic-001:v1",
      version: 1,
      state: "draft",
      supersedes: null,
      contentHash: "sha256:2bc37e5fd2304c4e42949fa32e286f69f60690912942ec3b7d0275a612c018eb",
      content: {
        answers: { interest: "astronomy" },
        applicantRef: "family-synthetic-001",
      },
    });
    expectTypeOf(version).toMatchTypeOf<ApplicationVersion<typeof content>>();
    expect(Object.isFrozen(version)).toBe(true);
    expect(Object.isFrozen(version.content)).toBe(true);
    expect(Object.isFrozen(version.content.answers)).toBe(true);

    content.answers.interest = "mutated after save";
    expect(version.content.answers.interest).toBe("astronomy");
  });

  it("retains an explicit supersedes pointer without changing prior versions", () => {
    const first = createApplicationVersion({
      versionId: "application-synthetic-001:v1",
      version: 1,
      state: "draft",
      supersedes: null,
      content: {
        applicantRef: "family-synthetic-001",
        answers: { interest: "astronomy" },
      },
    });
    const second = createApplicationVersion({
      versionId: "application-synthetic-001:v2",
      version: 2,
      state: "draft",
      supersedes: first.versionId,
      content: {
        applicantRef: "family-synthetic-001",
        answers: { interest: "robotics" },
      },
    });

    expect(second.supersedes).toBe(first.versionId);
    expect(second.contentHash).toBe(
      "sha256:e72c4fefafdcf6ecd77d0edde06276dcb5b213978228f568f52be6b5f3959f6f",
    );
    expect(first.content.answers.interest).toBe("astronomy");
  });

  it("rejects invalid version metadata at the contract boundary", () => {
    expect(() =>
      createApplicationVersion({
        versionId: "application-synthetic-001:v0",
        version: 0,
        state: "draft",
        supersedes: null,
        content: { fixture: "synthetic-only" },
      }),
    ).toThrow("positive integer");

    expect(() =>
      createApplicationVersion({
        versionId: "",
        version: 1,
        state: "draft",
        supersedes: null,
        content: { fixture: "synthetic-only" },
      }),
    ).toThrow("versionId");
  });
});
