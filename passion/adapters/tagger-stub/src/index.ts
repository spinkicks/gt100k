import type { Tagger, ArtifactRef } from "@gt100k/two-axis-tagging";
import type { TagSuggestion } from "@gt100k/two-axis-tagging";

/**
 * Deterministic, seeded tagger used in CI and the loop gate — never hits the network.
 * A seed lookup keyed by `ref.id` returns a fixed suggestion; unknown refs get a
 * deterministic zero-confidence fallback that routes to review downstream (confidence
 * below CONFIDENCE_FLOOR), so the stub never fabricates a trusted tag.
 */
export class StubTagger implements Tagger {
  constructor(private readonly seed: Readonly<Record<string, TagSuggestion>>) {}

  async suggest(ref: ArtifactRef): Promise<TagSuggestion> {
    const hit = this.seed[ref.id];
    if (hit) return hit;
    return {
      domainPath: ["science-nature"],
      affordedModes: ["investigate"],
      confidence: 0,
      rationale: "stub-fallback",
    };
  }
}
