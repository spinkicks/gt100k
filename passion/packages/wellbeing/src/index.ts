// @gt100k/wellbeing — a pure, two-knob wellbeing decision engine (challenge × pressure) plus a
// deriver over the 014 student profile / 013 hypothesis store. The engine only PROPOSES a move and
// escalates strain to a human; it never applies anything to the child and never emits a child-facing
// label, score, or reward (spec 016-wellbeing §3.4). SYNTHETIC ONLY; no network.
export const WELLBEING_PACKAGE = "@gt100k/wellbeing" as const;

export * from "./model.js";
export * from "./assess.js";
export * from "./derive.js";
