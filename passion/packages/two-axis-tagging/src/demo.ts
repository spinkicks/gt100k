// src/demo.ts — headless end-to-end wiring (spec §6 P5).
// seed taxonomy → stub-tag a synthetic artifact → run a synthetic action stream →
// resolve engaged modes → emit the (domain × work-mode) coverage matrix.
// The demo inlines a Tagger so the domain package never imports an adapter (no cycle).
import { createTaxonomy, serializePath } from "./taxonomy.js";
import { acceptSuggestion } from "./pipeline.js";
import { resolveEngagedModes } from "./resolver.js";
import type { RawAction, TagSuggestion } from "./records.js";
import type { Tagger, ArtifactRef } from "./ports.js";

export interface CoverageCell {
  readonly cell: string;
  readonly count: number;
}

// Inline demo tagger — avoids a domain→adapter dependency cycle.
const demoTagger: Tagger = {
  async suggest(_ref: ArtifactRef): Promise<TagSuggestion> {
    return {
      domainPath: ["music-sound", "audio-systems"],
      affordedModes: ["perform", "build", "investigate"],
      confidence: 0.9,
      rationale: "demo",
    };
  },
};

export async function runDemo(): Promise<CoverageCell[]> {
  const tax = createTaxonomy();
  const ref: ArtifactRef = { id: "synth-01", kind: "gadget", label: "Synth" };
  const suggestion = await demoTagger.suggest(ref);
  const artifact = acceptSuggestion(tax, ref, suggestion);

  const actions: RawAction[] = [
    { artifactId: "synth-01", actionType: "play" },
    { artifactId: "synth-01", actionType: "assemble" },
    { artifactId: "synth-01", actionType: "tinker" },
  ];

  const counts = new Map<string, number>();
  for (const a of actions) {
    const r = resolveEngagedModes(artifact, a);
    if (!r.ok) continue;
    const key = `${serializePath(artifact.domainPath)}::${r.engagedModes.primary}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].map(([cell, count]) => ({ cell, count }));
}
