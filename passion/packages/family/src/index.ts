// @gt100k/family — the Family Co-Engagement engine (F3, the environment amplifier). A pure,
// deterministic `assessFamily` engine turns a child's discovery + wellbeing state into GUIDE-FACING
// family-coaching guidance: a warm-demanding coaching posture (autonomy support + structure +
// NON-CONTINGENT warmth), concrete door-opening asks (offers, never mandates), structured
// shared-activity ideas (the "complex" high-support+high-challenge environment), and a
// family-driven-pressure watch that routes the obsessive-passion antecedents to the guide for
// re-coaching. The system PROPOSES; the human (guide) DISPOSES — no automated message ever reaches a
// parent, and no label/score/reward ever reaches the child. SYNTHETIC ONLY; no network. (spec 019 §3.)
export const FAMILY_PACKAGE = "@gt100k/family" as const;

export * from "./model.js";
export * from "./assess.js";
export * from "./derive.js";
