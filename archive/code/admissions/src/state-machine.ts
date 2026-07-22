import type {
  ApplicationVersionState,
  ErrorCode,
} from "../../admissions-contracts/src/registers.js";
import {
  type ApplicationVersion,
  createApplicationVersion,
} from "../../admissions-contracts/src/versioning.js";

export interface MutationMetadata {
  readonly expectedVersion: number;
  readonly idempotencyKey: string;
  readonly correlationId: string;
}

export interface SaveApplicationCommand<Content> extends MutationMetadata {
  readonly content: Content;
}

export interface ApplicationState<Content> {
  readonly applicationId: string;
  readonly currentVersion: number;
  readonly versions: readonly ApplicationVersion<Content>[];
  readonly usedIdempotencyKeys: readonly string[];
}

export interface ApplicationFieldError {
  readonly field: string;
  readonly message: string;
}

interface ApplicationCommandErrorInput {
  readonly code: ErrorCode;
  readonly retryable: boolean;
  readonly correlationId: string;
  readonly currentState: ApplicationVersionState | "not_started";
  readonly currentVersion: number;
  readonly fieldErrors?: readonly ApplicationFieldError[];
}

export class ApplicationCommandError extends Error {
  readonly code: ErrorCode;
  readonly retryable: boolean;
  readonly correlationId: string;
  readonly currentState: ApplicationVersionState | "not_started";
  readonly currentVersion: number;
  readonly fieldErrors: readonly ApplicationFieldError[];

  constructor(input: ApplicationCommandErrorInput) {
    super(input.code);
    this.name = "ApplicationCommandError";
    this.code = input.code;
    this.retryable = input.retryable;
    this.correlationId = input.correlationId;
    this.currentState = input.currentState;
    this.currentVersion = input.currentVersion;
    this.fieldErrors = Object.freeze(
      (input.fieldErrors ?? []).map((fieldError) => Object.freeze({ ...fieldError })),
    );
  }
}

function currentState<Content>(
  state: ApplicationState<Content>,
): ApplicationVersionState | "not_started" {
  return resumeApplication(state)?.state ?? "not_started";
}

function commandError<Content>(
  state: ApplicationState<Content>,
  metadata: Pick<MutationMetadata, "correlationId">,
  code: ErrorCode,
  retryable: boolean,
  fieldErrors: readonly ApplicationFieldError[] = [],
): ApplicationCommandError {
  return new ApplicationCommandError({
    code,
    retryable,
    correlationId: metadata.correlationId,
    currentState: currentState(state),
    currentVersion: state.currentVersion,
    fieldErrors,
  });
}

function assertMutationAllowed<Content>(
  state: ApplicationState<Content>,
  metadata: MutationMetadata,
): void {
  const fieldErrors: ApplicationFieldError[] = [];
  if (!Number.isInteger(metadata.expectedVersion) || metadata.expectedVersion < 0) {
    fieldErrors.push({ field: "expectedVersion", message: "must be a non-negative integer" });
  }
  if (metadata.idempotencyKey.trim().length === 0) {
    fieldErrors.push({ field: "idempotencyKey", message: "must be non-empty" });
  }
  if (metadata.correlationId.trim().length === 0) {
    fieldErrors.push({ field: "correlationId", message: "must be non-empty" });
  }
  if (fieldErrors.length > 0) {
    throw commandError(state, metadata, "VALIDATION_FAILED", false, fieldErrors);
  }
  if (state.usedIdempotencyKeys.includes(metadata.idempotencyKey)) {
    throw commandError(state, metadata, "IDEMPOTENCY_KEY_REUSED", false);
  }
  if (metadata.expectedVersion !== state.currentVersion) {
    throw commandError(state, metadata, "STALE_VERSION", true);
  }
}

function appendVersion<Content>(
  state: ApplicationState<Content>,
  lifecycleState: ApplicationVersionState,
  content: Content,
  idempotencyKey: string,
): ApplicationState<Content> {
  const previous = resumeApplication(state);
  const version = state.currentVersion + 1;
  const successor = createApplicationVersion({
    versionId: `${state.applicationId}:v${version}`,
    version,
    state: lifecycleState,
    supersedes: previous?.versionId ?? null,
    content,
  });

  return Object.freeze({
    applicationId: state.applicationId,
    currentVersion: version,
    versions: Object.freeze([...state.versions, successor]),
    usedIdempotencyKeys: Object.freeze([...state.usedIdempotencyKeys, idempotencyKey]),
  });
}

export function createApplicationState<Content>(applicationId: string): ApplicationState<Content> {
  if (applicationId.trim().length === 0) {
    throw new TypeError("applicationId must be non-empty");
  }

  return Object.freeze({
    applicationId,
    currentVersion: 0,
    versions: Object.freeze([]),
    usedIdempotencyKeys: Object.freeze([]),
  });
}

export function resumeApplication<Content>(
  state: ApplicationState<Content>,
): ApplicationVersion<Content> | null {
  return state.versions.at(-1) ?? null;
}

export function saveApplication<Content>(
  state: ApplicationState<Content>,
  command: SaveApplicationCommand<Content>,
): ApplicationState<Content> {
  assertMutationAllowed(state, command);
  if (currentState(state) === "submitted") {
    throw commandError(state, command, "SUBMISSION_LOCKED", false);
  }
  return appendVersion(state, "draft", command.content, command.idempotencyKey);
}

export function submitApplication<Content>(
  state: ApplicationState<Content>,
  command: MutationMetadata,
): ApplicationState<Content> {
  assertMutationAllowed(state, command);
  const current = resumeApplication(state);
  if (current?.state === "submitted") {
    throw commandError(state, command, "SUBMISSION_LOCKED", false);
  }
  if (current?.state !== "draft") {
    throw commandError(state, command, "INVALID_STATE_TRANSITION", false);
  }
  return appendVersion(state, "submitted", current.content as Content, command.idempotencyKey);
}

export function supersedeApplicationForCorrection<Content>(
  state: ApplicationState<Content>,
  command: MutationMetadata,
): ApplicationState<Content> {
  assertMutationAllowed(state, command);
  const current = resumeApplication(state);
  if (current?.state !== "submitted") {
    throw commandError(state, command, "INVALID_STATE_TRANSITION", false);
  }
  return appendVersion(state, "superseded", current.content as Content, command.idempotencyKey);
}
