// Canonical JSON encoding for this package's evidence hash. RFC 8785 key ordering, minified.
//
// WHY THIS IS A COPY, and not an import of `@gt100k/evidence-graph`'s `canonicalize`:
// the `@gt100k/evidence-*` packages are a SEPARATE PRODUCT, developed in this repo and intended for
// extraction as a mechanical copy (`docs/decisions/evidencegraph-v1-design.md` §11/§13a). Nothing
// outside that namespace may import a VALUE from inside it — a runtime edge has to be unpicked on
// extraction, by someone with less context than whoever added it. `socratic-defense` used to import
// this one function, which made a 37-line serializer the single thing standing between the graph and
// a clean lift-out.
//
// A shared package would be worse, not better: `evidence-graph` would gain an outbound dependency on
// a passion-side package and stop being buildable in isolation, which is the property extraction
// depends on.
//
// The duplication is guarded, not trusted: `test/canonical-parity.test.ts` asserts byte-identical
// output against `@gt100k/evidence-graph`'s version over a shared fixture set, so a drift shows up as
// a failing test rather than as two quietly different hashes. Same pattern as `apps/parent-guide`'s
// Family Check-In, which mirrors `@gt100k/family`'s `decide()` and proves it across all 512
// combinations.
//
// If you change this file, change it in both places, and the parity test will tell you if you didn't.
// Drift here cannot corrupt cross-verification — the two functions never hash the same input; this one
// hashes a defense record, not a graph node — but two serializers named the same thing that disagree
// is a trap for the next reader regardless.

type JsonObject = Record<string, unknown>;

function normalizeForCanonicalJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeForCanonicalJson(item));
  }

  if (value !== null && typeof value === "object") {
    const object = value as JsonObject;
    const normalized: JsonObject = {};

    for (const key of Object.keys(object).sort()) {
      const field = object[key];
      if (field !== undefined) {
        normalized[key] = normalizeForCanonicalJson(field);
      }
    }

    return normalized;
  }

  return value;
}

/**
 * Encodes JSON-compatible content using RFC 8785 key ordering and minified JSON.
 * Undefined object fields are treated as absent so optional fields are omitted.
 */
export function canonicalize(value: unknown): string {
  const serialized = JSON.stringify(normalizeForCanonicalJson(value));

  if (serialized === undefined) {
    throw new TypeError("Canonical content must be JSON-serializable");
  }

  return serialized;
}
