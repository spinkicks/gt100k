// @gt100k/project-workspace — the headless "doing" engine for D2 Project Studio (022).
//
// A PURE, DETERMINISTIC, append-only model of a child running a Renzulli Type III project: a
// `Project` seeded from a D1 `ProjectBrief` (or self-authored) plus an immutable journey of 10
// `WorkEvent` kinds. `toEvidence` folds that honest process onto the CLOSED EvidenceGraph (E1)
// taxonomy via a typed `EvidenceSink` port; a deterministic stub sink powers CI + LOOP_QA.
//
// GRADE THE PROCESS, NOT THE POLISH. There is intentionally NO score/grade/streak/points/badge/
// rank/reward field anywhere (guardrail SC-5); declared AI help is a NEUTRAL `Assistance` node
// (SC-6). No network; SYNTHETIC data only. Barrel filled in task-by-task.
export const PROJECT_WORKSPACE_PACKAGE = "@gt100k/project-workspace" as const;

export * from "./model.js";
export * from "./project.js";
