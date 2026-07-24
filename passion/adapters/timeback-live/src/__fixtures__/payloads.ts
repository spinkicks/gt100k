// Synthetic assumed-API payloads for the hermetic parse tests. There is NO real TimeBack API yet;
// these mirror the DOCUMENTED ASSUMED shape (see src/index.ts header). SYNTHETIC ONLY — never real data.

/**
 * A well-formed payload as the assumed `GET /students/{kidId}/signals` endpoint would return it:
 * `{ asOf, subjects: [{ subject, mastery, discretionaryXp, offered }] }`. Mirrors the domain
 * `GOLDEN_SNAPSHOT` subjects (math/science/writing offered + one offered:false) so the parsed
 * snapshot round-trips through `toDomainPriors`.
 */
export const ASSUMED_PAYLOAD = {
  asOf: "2026-04-01T00:00:00.000Z",
  subjects: [
    { subject: "math", mastery: 0.8, discretionaryXp: 60, offered: true },
    { subject: "science", mastery: 0.5, discretionaryXp: 20, offered: true },
    { subject: "writing", mastery: 0.9, discretionaryXp: 20, offered: true },
    { subject: "music", mastery: 0.4, discretionaryXp: 0, offered: false },
  ],
};

/**
 * A malformed payload: `asOf` is the wrong type and a subject has wrong-typed / missing fields.
 * Any malformation must yield the safe empty snapshot (never a throw, never partial garbage).
 */
export const MALFORMED_PAYLOAD = {
  asOf: 1712000000000, // wrong type (should be an ISO string)
  subjects: [
    { subject: "math", mastery: "high", offered: "yes" }, // mastery/offered wrong type; discretionaryXp missing
  ],
};
