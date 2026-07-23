// src/pipeline.ts
import type { Artifact, TagSuggestion } from "./records.js";
import { makeArtifact } from "./records.js";
import type { Taxonomy, DomainPath, CabinId } from "./taxonomy.js";
import { isCabinId } from "./taxonomy.js";
import { isWorkMode } from "./work-modes.js";
import type { ArtifactRef } from "./ports.js";

export const CONFIDENCE_FLOOR = 0.5;

export type ValidationResult = { ok: true } | { ok: false; reason: string };

export function validateSuggestion(tax: Taxonomy, s: TagSuggestion): ValidationResult {
  const cabin = s.domainPath[0];
  if (!isCabinId(cabin)) return { ok: false, reason: "unknown-cabin" };
  if (s.affordedModes.length === 0) return { ok: false, reason: "no-modes" };
  for (const m of s.affordedModes) if (!isWorkMode(m)) return { ok: false, reason: "invalid-mode" };
  if (s.confidence < CONFIDENCE_FLOOR) return { ok: false, reason: "low-confidence" };
  return { ok: true };
}

// Accepts a validated suggestion, minting a novel sub-topic if needed.
export function acceptSuggestion(tax: Taxonomy, ref: ArtifactRef, s: TagSuggestion): Artifact {
  const v = validateSuggestion(tax, s);
  if (!v.ok) throw new Error(`invalid suggestion: ${v.reason}`);
  const cabin = s.domainPath[0] as CabinId;

  let path: DomainPath = [cabin];
  let origin: "seed" | "minted" = "seed";
  if (s.domainPath.length === 2) {
    const sub = s.domainPath[1] as string;
    if (tax.hasPath([cabin, sub])) {
      path = [cabin, sub];
    } else {
      path = tax.mintSubTopic(cabin, sub);
      origin = "minted";
    }
  }

  return makeArtifact(tax, {
    id: ref.id, domainPath: path, affordedModes: s.affordedModes,
    kind: ref.kind, source: "auto", origin, tagConfidence: s.confidence,
  });
}
