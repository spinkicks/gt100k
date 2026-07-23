// src/ports.ts
import type { TagSuggestion } from "./records.js";

export interface ArtifactRef {
  readonly id: string;
  readonly kind: "gadget" | "taste-app" | "resource";
  readonly label: string;
  readonly url?: string;
}

export interface Tagger {
  suggest(ref: ArtifactRef): Promise<TagSuggestion>;
}
