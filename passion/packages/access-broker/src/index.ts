// @gt100k/access-broker — D3 + D4 access & audience broker (spec 023-access-broker).
//
// One combined, PURE, DETERMINISTIC engine that brokers the D1 planner's NAMED mentor role +
// audience level (per certified spike, per stage) against a full layered SYNTHETIC catalog of
// real-world opportunities: it matches the named need, ranks candidates with every guardrail gate
// applied (vetting, age-tier, stage, craft-floor, wellbeing back-off), and tracks a HUMAN-GATED
// access-transfer lifecycle (matched → proposed → approved → introduced → active → transferred).
//
// GUIDE-FACING ONLY. No child-facing field, no score/rank/streak/points/badge on any type. The
// system PROPOSES; the guide DISPOSES (the engine never emits a state past `proposed`). No network;
// SYNTHETIC data only. Reuses 018 (Stage/MentorRole/AudienceLevel/SpecializationPlan), 016
// (WellbeingRead), and 009 (WorkMode) — never redefined. Barrel filled task-by-task.
export const ACCESS_BROKER_PACKAGE = "@gt100k/access-broker" as const;
