/**
 * `@gt100k/evidence-explorer-view` — the deterministic, framework-agnostic view model for the
 * Provenance Observatory. Reads the `@gt100k/evidence-graph` domain; computes no grade and no
 * crypto; produces a deterministic 2D + 3D layout, golden art/motion/visual/camera/tier registries,
 * a growth timeline, and the synthetic "speaker-v1" fixture.
 */
export * from "./model.js";
export * from "./art.js";
export * from "./motion.js";
export * from "./visual.js";
export * from "./camera.js";
export * from "./tiers.js";
export * from "./ranks.js";
export * from "./layout2d.js";
export * from "./layout3d.js";
export * from "./timeline.js";
export * from "./view.js";
export * from "./fixtures/explorer.fixture.js";
