/**
 * Who this app is for, in the curated library's terms.
 *
 * `PROJECT.md` states the target band as **ages 9-12, in a gifted context**, and that "high
 * difficulty is acceptable and wanted". So the shelf serves the two tiers that span it rather than
 * the 6-8 tier the discovery research is calibrated on, and the asymmetry matters in one direction:
 * a resource pitched too young reads as patronising to a nine-year-old who came here because the
 * puzzle was hard, while one pitched too old is simply a dead end.
 *
 * A band and not a birthday, per PRD 9: age is not a gate here either. A resource qualifies if it
 * suits either tier, and nothing asks the child how old they are.
 */
import type { AgeTier } from "@gt100k/concierge";

export const SHELF_AGE_TIERS: readonly AgeTier[] = ["9-11", "12-14"];

/**
 * How many links a card offers.
 *
 * Patall et al. (2008) put the useful range at 3-5 options per choice moment, and this sits inside
 * it. The library deliberately holds more than five per shelf, because a store is not a choice
 * moment; deciding how many of them a child sees at once is this surface's job, and this is that
 * decision. See `docs/decisions/2026-07-27-curated-library-standard.md`.
 */
export const MAX_SHELF_LINKS = 4;
