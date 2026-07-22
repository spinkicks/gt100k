import { type Sha256ContentHash, canonicalize, sha256ContentHash } from "./hash.js";
import { APPLICATION_VERSION_STATES, type ApplicationVersionState } from "./registers.js";

export type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer Item)[]
    ? readonly DeepReadonly<Item>[]
    : T extends object
      ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
      : T;

export interface ApplicationVersion<Content> {
  readonly versionId: string;
  readonly version: number;
  readonly state: ApplicationVersionState;
  readonly supersedes: string | null;
  readonly contentHash: Sha256ContentHash;
  readonly content: DeepReadonly<Content>;
}

export interface CreateApplicationVersionInput<Content> {
  readonly versionId: string;
  readonly version: number;
  readonly state: ApplicationVersionState;
  readonly supersedes: string | null;
  readonly content: Content;
}

function deepFreeze<Content>(value: Content): DeepReadonly<Content> {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value as DeepReadonly<Content>;
}

function assertVersionMetadata<Content>(input: CreateApplicationVersionInput<Content>): void {
  if (input.versionId.trim().length === 0) {
    throw new TypeError("versionId must be non-empty");
  }
  if (!Number.isInteger(input.version) || input.version < 1) {
    throw new TypeError("version must be a positive integer");
  }
  if (!APPLICATION_VERSION_STATES.includes(input.state)) {
    throw new TypeError("state must be a registered application version state");
  }
  if (input.supersedes !== null && input.supersedes.trim().length === 0) {
    throw new TypeError("supersedes must be null or a non-empty versionId");
  }
}

export function createApplicationVersion<Content>(
  input: CreateApplicationVersionInput<Content>,
): ApplicationVersion<Content> {
  assertVersionMetadata(input);

  const canonicalContent = canonicalize(input.content);
  const contentSnapshot = deepFreeze(JSON.parse(canonicalContent) as Content);

  return Object.freeze({
    versionId: input.versionId,
    version: input.version,
    state: input.state,
    supersedes: input.supersedes,
    contentHash: sha256ContentHash(contentSnapshot),
    content: contentSnapshot,
  });
}
