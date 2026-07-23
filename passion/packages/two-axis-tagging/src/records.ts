// src/records.ts
import type { WorkMode } from "./work-modes.js";
import { isWorkMode } from "./work-modes.js";
import type { DomainPath, Taxonomy } from "./taxonomy.js";

export type ArtifactKind = "gadget" | "taste-app" | "resource";
export type TagSource = "gold" | "auto";
export type TagOrigin = "seed" | "minted";
export type TagStatus = "TRUSTED" | "PROVISIONAL";

export interface Artifact {
  readonly id: string;
  readonly domainPath: DomainPath;
  readonly affordedModes: readonly WorkMode[];
  readonly kind: ArtifactKind;
  readonly source: TagSource;
  readonly origin: TagOrigin;
  readonly tagConfidence: number;
  readonly tagStatus: TagStatus;
}

export interface MakeArtifactInput {
  id: string;
  domainPath: DomainPath;
  affordedModes: readonly WorkMode[];
  kind: ArtifactKind;
  source: TagSource;
  origin?: TagOrigin;
  tagConfidence?: number;
}

export function makeArtifact(tax: Taxonomy, input: MakeArtifactInput): Artifact {
  if (!tax.hasPath(input.domainPath)) throw new Error(`invalid domainPath: ${JSON.stringify(input.domainPath)}`);
  const modes = [...new Set(input.affordedModes)];
  if (modes.length === 0) throw new Error("affordedModes must have ≥1 mode");
  for (const m of modes) if (!isWorkMode(m)) throw new Error(`invalid work-mode: ${String(m)}`);
  const tagConfidence = input.source === "gold" ? 1 : (input.tagConfidence ?? 0);
  return {
    id: input.id, domainPath: input.domainPath, affordedModes: modes, kind: input.kind,
    source: input.source, origin: input.origin ?? "seed", tagConfidence, tagStatus: "PROVISIONAL",
  };
}

export interface DepthSignal { readonly kind: string; readonly value: number; }

export interface RawAction {
  readonly artifactId: string;
  readonly actionType: string;
  readonly params?: Readonly<Record<string, unknown>>;
}

export interface ActionEvent {
  readonly kidId: string;
  readonly artifactId: string;
  readonly engagedModes: { readonly primary: WorkMode; readonly secondary?: WorkMode };
  readonly depthSignals: readonly DepthSignal[];
  readonly timestamp: string;
  readonly returnState: "voluntary" | "prompted";
  readonly noveltyFlag: boolean;
}

export interface TagSuggestion {
  readonly domainPath: DomainPath;
  readonly affordedModes: readonly WorkMode[];
  readonly confidence: number;
  readonly rationale: string;
}
