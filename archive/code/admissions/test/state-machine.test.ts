import { describe, expect, expectTypeOf, it } from "vitest";

import {
  ApplicationCommandError,
  type ApplicationState,
  type MutationMetadata,
  createApplicationState,
  resumeApplication,
  saveApplication,
  submitApplication,
  supersedeApplicationForCorrection,
} from "../src/state-machine.js";

interface SyntheticApplicationContent {
  readonly applicantRef: string;
  readonly answers: {
    readonly interest: string;
  };
}

const astronomy: SyntheticApplicationContent = {
  applicantRef: "applicant-synthetic-001",
  answers: { interest: "astronomy" },
};

function mutation(
  expectedVersion: number,
  idempotencyKey: string,
  correlationId = `correlation-${idempotencyKey}`,
): MutationMetadata {
  return { expectedVersion, idempotencyKey, correlationId };
}

function expectCommandError(
  action: () => unknown,
  code: ApplicationCommandError["code"],
): ApplicationCommandError {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(ApplicationCommandError);
    expect(error).toMatchObject({ code });
    return error as ApplicationCommandError;
  }
  throw new Error(`expected ${code}`);
}

describe("application save and resume", () => {
  it("appends a new immutable draft on every save and resumes the latest one", () => {
    const empty = createApplicationState<SyntheticApplicationContent>("application-synthetic-001");
    const first = saveApplication(empty, {
      ...mutation(0, "save-001"),
      content: astronomy,
    });
    const second = saveApplication(first, {
      ...mutation(1, "save-002"),
      content: {
        ...astronomy,
        answers: { interest: "robotics" },
      },
    });

    expect(resumeApplication(empty)).toBeNull();
    expect(resumeApplication(second)).toEqual(second.versions[1]);
    expect(second.versions).toHaveLength(2);
    expect(second.versions[0]).toMatchObject({
      versionId: "application-synthetic-001:v1",
      version: 1,
      state: "draft",
      supersedes: null,
      content: astronomy,
    });
    expect(second.versions[1]).toMatchObject({
      versionId: "application-synthetic-001:v2",
      version: 2,
      state: "draft",
      supersedes: "application-synthetic-001:v1",
      content: { ...astronomy, answers: { interest: "robotics" } },
    });
    expect(first.versions).toHaveLength(1);
    expect(first.versions[0]?.content.answers.interest).toBe("astronomy");
    expect(Object.isFrozen(second)).toBe(true);
    expect(Object.isFrozen(second.versions)).toBe(true);
    expectTypeOf(second).toMatchTypeOf<ApplicationState<SyntheticApplicationContent>>();
  });

  it("requires complete mutation metadata and returns field errors for invalid metadata", () => {
    const state = createApplicationState<SyntheticApplicationContent>("application-synthetic-001");
    const error = expectCommandError(
      () =>
        saveApplication(state, {
          expectedVersion: -1,
          idempotencyKey: "",
          correlationId: "correlation-invalid-save",
          content: astronomy,
        }),
      "VALIDATION_FAILED",
    );

    expect(error).toMatchObject({
      retryable: false,
      correlationId: "correlation-invalid-save",
      currentState: "not_started",
      currentVersion: 0,
      fieldErrors: [
        { field: "expectedVersion", message: "must be a non-negative integer" },
        { field: "idempotencyKey", message: "must be non-empty" },
      ],
    });
    expectTypeOf<Parameters<typeof submitApplication>[1]>().toMatchTypeOf<MutationMetadata>();
    expectTypeOf<
      Parameters<typeof supersedeApplicationForCorrection>[1]
    >().toMatchTypeOf<MutationMetadata>();
  });
});

describe("application lifecycle", () => {
  it("locks an exact submitted successor and rejects a second submit", () => {
    const draft = saveApplication(
      createApplicationState<SyntheticApplicationContent>("application-synthetic-001"),
      { ...mutation(0, "save-001"), content: astronomy },
    );
    const submitted = submitApplication(draft, mutation(1, "submit-001"));

    expect(resumeApplication(submitted)).toMatchObject({
      versionId: "application-synthetic-001:v2",
      version: 2,
      state: "submitted",
      supersedes: "application-synthetic-001:v1",
      content: astronomy,
    });
    expect(submitted.versions[0]?.state).toBe("draft");
    expect(submitted.versions[1]?.contentHash).toBe(submitted.versions[0]?.contentHash);

    const error = expectCommandError(
      () => submitApplication(submitted, mutation(2, "submit-002")),
      "SUBMISSION_LOCKED",
    );
    expect(error).toMatchObject({
      retryable: false,
      currentState: "submitted",
      currentVersion: 2,
      correlationId: "correlation-submit-002",
      fieldErrors: [],
    });
  });

  it("uses immutable successors for correction instead of rewriting submission history", () => {
    const draft = saveApplication(
      createApplicationState<SyntheticApplicationContent>("application-synthetic-001"),
      { ...mutation(0, "save-001"), content: astronomy },
    );
    const submitted = submitApplication(draft, mutation(1, "submit-001"));
    const superseded = supersedeApplicationForCorrection(submitted, mutation(2, "correct-001"));
    const correctedDraft = saveApplication(superseded, {
      ...mutation(3, "save-correction-001"),
      content: { ...astronomy, answers: { interest: "robotics" } },
    });

    expect(correctedDraft.versions.map(({ state }) => state)).toEqual([
      "draft",
      "submitted",
      "superseded",
      "draft",
    ]);
    expect(correctedDraft.versions[2]).toMatchObject({
      supersedes: "application-synthetic-001:v2",
      content: astronomy,
    });
    expect(correctedDraft.versions[3]).toMatchObject({
      supersedes: "application-synthetic-001:v3",
      content: { ...astronomy, answers: { interest: "robotics" } },
    });
    expect(submitted.versions).toHaveLength(2);
    expect(submitted.versions[1]?.state).toBe("submitted");
    expect(submitted.versions[1]?.content.answers.interest).toBe("astronomy");
  });
});

describe("command safety", () => {
  it("rejects reuse of a successful idempotency key across command types", () => {
    const draft = saveApplication(
      createApplicationState<SyntheticApplicationContent>("application-synthetic-001"),
      { ...mutation(0, "mutation-001"), content: astronomy },
    );

    const error = expectCommandError(
      () =>
        submitApplication(draft, {
          ...mutation(1, "mutation-001"),
          correlationId: "correlation-reused",
        }),
      "IDEMPOTENCY_KEY_REUSED",
    );
    expect(error).toMatchObject({
      retryable: false,
      correlationId: "correlation-reused",
      currentState: "draft",
      currentVersion: 1,
    });
  });

  it("allows the winning save and rejects a stale submit from another session", () => {
    const initial = saveApplication(
      createApplicationState<SyntheticApplicationContent>("application-synthetic-001"),
      { ...mutation(0, "save-001"), content: astronomy },
    );
    const sessionA = initial;
    const sessionB = initial;
    const winner = saveApplication(sessionA, {
      ...mutation(1, "session-a-save"),
      content: { ...astronomy, answers: { interest: "robotics" } },
    });

    const error = expectCommandError(
      () => submitApplication(winner, mutation(sessionB.currentVersion, "session-b-submit")),
      "STALE_VERSION",
    );
    expect(error).toMatchObject({
      retryable: true,
      currentState: "draft",
      currentVersion: 2,
      correlationId: "correlation-session-b-submit",
    });
  });

  it("allows the winning submit and rejects a stale save from another session", () => {
    const initial = saveApplication(
      createApplicationState<SyntheticApplicationContent>("application-synthetic-001"),
      { ...mutation(0, "save-001"), content: astronomy },
    );
    const sessionA = initial;
    const sessionB = initial;
    const winner = submitApplication(sessionA, mutation(1, "session-a-submit"));

    const error = expectCommandError(
      () =>
        saveApplication(winner, {
          ...mutation(sessionB.currentVersion, "session-b-save"),
          content: { ...astronomy, answers: { interest: "robotics" } },
        }),
      "STALE_VERSION",
    );
    expect(error).toMatchObject({
      retryable: true,
      currentState: "submitted",
      currentVersion: 2,
      correlationId: "correlation-session-b-save",
    });
  });
});
