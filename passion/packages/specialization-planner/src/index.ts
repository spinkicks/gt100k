// @gt100k/specialization-planner — the ascent engine (spec 018-specialization-planner).
// A PURE, DETERMINISTIC staged-specialization planner: once discovery certifies a spike (an ACTIVE
// hypothesis in 013), this lays out the child's multi-year climb as a staged sequence of authentic
// (Renzulli Type III) projects with embedded, bounded deliberate practice, advances stages on
// READINESS NOT AGE, doses practice small-and-late, enforces REST, keeps the child owning the
// problem (scaffolded autonomy), and replans against the 016 wellbeing read. It NEVER grades and
// NEVER acts on the child — the system PROPOSES a plan; the human (guide) DISPOSES.
//
// No network; SYNTHETIC data only. The project brief comes from a typed port (deterministic stub in
// the gate / default; a TFY real adapter is opt-in in @gt100k/planner-live). Briefs are grounded on
// the merged 015 curated library (A6): the planner reuses @gt100k/concierge's CuratedResource +
// curated library to point each craft scaffold at real, vetted resources.
// Barrel filled in task-by-task (model → stage → curated/generator/stub → plan → derive).
export const SPECIALIZATION_PLANNER_PACKAGE = "@gt100k/specialization-planner" as const;

export * from "./model.js";
export * from "./stage.js";
export * from "./curated.js";
export * from "./stub-generator.js";
export * from "./plan.js";
export * from "./derive.js";
