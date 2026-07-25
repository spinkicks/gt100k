import type { Interaction, SurfacedRecord } from "@gt100k/signal-pipeline";

/**
 * The engine's own contract, imported as types only — `@gt100k/signal-pipeline`
 * is a devDependency and `import type` is erased at build, so there is no runtime
 * dependency and no bundle cost. This makes `tsc` the drift guard: a change to
 * `Interaction` upstream breaks this app's typecheck. A hand-maintained key-set
 * test could not do that, because it only ever asserts our own shape.
 */
export type { Interaction, SurfacedRecord };

/**
 * How long an open held attention, as a closed ordinal set rather than a number.
 *
 * Two constraints meet here. Sub-floor opens **must** be emitted: dropping them
 * leaves "surfaced this session, never engaged", which E4 reads as a decline —
 * so discarding a brief attempt would silently turn it into *negative* evidence,
 * inverting the sign of the strongest signal we have. But duration must **not**
 * be able to reach the belief math (dwell is non-monotonic in interest). A closed
 * enum satisfies both: it survives, and it cannot be multiplied into alpha — the
 * same reasoning that moved the secondary-mode weight to `A_SECONDARY`.
 *
 * The engine decides what an `under_floor` open is worth. The emitter only
 * reports what happened.
 */
export type DwellBucket = "under_floor" | "short" | "medium" | "long";

/**
 * An `Interaction` plus the bucket. Additive: the shared fields are structurally
 * the engine's, so this stays assignable to `Interaction` and the extra field is
 * ignored by consumers that do not read it.
 */
export interface EmittedInteraction extends Interaction {
  readonly dwellBucket?: DwellBucket;
}
