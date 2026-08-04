// @gt100k/project-workspace — the headless "doing" engine for D2 Project Studio (022).
//
// A PURE, DETERMINISTIC, append-only model of a child running a Renzulli Type III project: a
// `Project` seeded from a D1 `ProjectBrief` (or self-authored) plus an immutable journey of 10
// `WorkEvent` kinds. `toEvidencePlan` maps that honest process onto the CLOSED EvidenceGraph (E1)
// taxonomy — as a PLAN, which is pure data.
//
// This package does NOT build a graph, on purpose. The `@gt100k/evidence-*` packages are a separate
// product intended for extraction, and nothing outside that namespace may import a value from inside
// it (`docs/decisions/evidencegraph-v1-design.md` §13a). The mapping is passion-domain knowledge and
// lives here; materialization is graph knowledge and lives in `@gt100k/project-evidence-sink`, which
// also owns the `EvidenceSink` port and its deterministic stub.
//
// GRADE THE PROCESS, NOT THE POLISH. There is intentionally NO score/grade/streak/points/badge/
// rank/reward field anywhere (guardrail SC-5); declared AI help is a NEUTRAL `Assistance` node
// (SC-6). No network; SYNTHETIC data only.
export const PROJECT_WORKSPACE_PACKAGE = "@gt100k/project-workspace" as const;

export * from "./model.js";
export * from "./project.js";
export * from "./plan.js";
// The synthetic all-ten-kinds project, exported so the sink adapter's tests assert against the SAME
// fixture this package does rather than a look-alike. Same pattern as
// `@gt100k/evidence-explorer-view`, which exports its `explorer.fixture` from its barrel.
export * from "./__fixtures__/project.js";
export * from "./thinness.js";
