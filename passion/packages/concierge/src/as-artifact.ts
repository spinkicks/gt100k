// A curated resource, seen as a taggable artifact.
//
// Under a launcher surface this is the whole of the "artifact catalog" problem. The game needed a
// crosswalk because its furniture (a gadget called `nonogram`, filed under a game topic called
// `logic-games`) bore no relation to the taxonomy, so something had to translate. A launcher has no
// furniture: the child picks a subtopic, which IS a `DomainPath`, and follows a resource that
// already declares the modes it affords. `buildActionEvents` resolves against `id`, `domainPath`
// and `affordedModes`, and a `CuratedResource` carries all three, so this is a projection rather
// than a translation and there is nothing to get wrong in the mapping.
//
// What a `CuratedResource` does NOT carry is the tagging provenance an `Artifact` asserts, and that
// is the part worth guarding. A curated entry is `gold`/`seed`/`TRUSTED` at confidence 1 because a
// human authored and reviewed it. Nothing else in the library has earned that, and `promote` can
// add web-derived candidates to the same collection, so the prefix check below is what stops an
// auto-derived entry from arriving downstream wearing a hand-authored entry's credentials.
import type { Artifact } from "@gt100k/two-axis-tagging";

import type { CuratedResource } from "./model.js";

/** Provenance every hand-authored library entry carries. See the file header for why it is checked. */
export const CURATED_PROVENANCE_PREFIX = "curated:";

export function asArtifact(resource: CuratedResource): Artifact {
  if (!resource.provenance.startsWith(CURATED_PROVENANCE_PREFIX)) {
    throw new Error(
      `asArtifact: ${resource.id} has provenance "${resource.provenance}". Only entries whose provenance starts with "${CURATED_PROVENANCE_PREFIX}" are hand-authored, and only those may claim gold/TRUSTED tagging.`,
    );
  }
  const affordedModes = [...new Set(resource.affordedModes)];
  if (affordedModes.length === 0) {
    // A resource affording nothing forms no cell, so it would be silently invisible to the engine
    // rather than merely unhelpful. Better to fail where the library is authored.
    throw new Error(`asArtifact: ${resource.id} affords no work-mode`);
  }

  return {
    id: resource.id,
    domainPath: resource.domainPath,
    affordedModes,
    kind: "resource",
    source: "gold",
    origin: "seed",
    tagConfidence: 1,
    tagStatus: "TRUSTED",
  };
}

/** The catalog `deriveSignals` takes, built from a library. Duplicate ids collapse, last wins. */
export function catalogFrom(library: readonly CuratedResource[]): ReadonlyMap<string, Artifact> {
  return new Map(library.map((r) => [r.id, asArtifact(r)]));
}
