import type { DwellBucket, Interaction, SurfacedRecord } from "@gt100k/signal-pipeline";

/**
 * The engine's own contract, imported as types only — `@gt100k/signal-pipeline`
 * is a devDependency and `import type` is erased at build, so there is no runtime
 * dependency and no bundle cost. This makes `tsc` the drift guard: a change to
 * `Interaction` upstream breaks this app's typecheck. A hand-maintained key-set
 * test could not do that, because it only ever asserts our own shape.
 *
 * `dwellBucket` now lives on `Interaction` itself rather than on a local extension:
 * the pipeline has to be able to read it (E9 uses it as a validity gate), and a field
 * that exists at runtime but not in the shared type is exactly the untyped side channel
 * the type import was added to eliminate.
 */
export type { DwellBucket, Interaction, SurfacedRecord };

/**
 * Retained as an alias so call sites read clearly at the emission boundary. The bucket is
 * part of the shared contract now, so this adds nothing structurally.
 */
export type EmittedInteraction = Interaction;
