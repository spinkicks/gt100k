# D2 — Project Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Checkbox steps; commit after each task. The headless packages (Tasks 0–5) are loop-ready (`tsc -b` + `test`); the **app (Tasks 6–7) is built live** (polish-heavy) with screenshots against `specs/022-project-studio/references/fella-01…09.png`.

**Goal:** Build `022-project-studio` per its spec — a headless `@gt100k/project-workspace` engine (Project + 10 WorkEvent kinds → EvidenceGraph nodes via an `EvidenceSink` port), a real `@gt100k/evidence-sink-graph` adapter over `@gt100k/evidence-graph`, and a **cartoonish child-facing `apps/project-studio`** where a kid runs Type III projects and logs the honest journey. Grade the process, not the polish; no gamification, ever.

**Architecture:** Pure, deterministic engine (append-only work-events) → a typed `EvidenceSink` maps events to the **closed** EvidenceGraph taxonomy (`spec §4.3`). Stub sink (deterministic hasher) powers CI + `LOOP_QA`; the real adapter uses `@gt100k/evidence-graph` `addNode`/`addEdge` + a SHA-256 `Hasher`. The studio is a single-child, neo-brutalist cartoon app; projects seed from D1-brief-shaped fixtures + self-authoring; state persists in `localStorage`; the deterministic seed keeps QA stable.

**Tech Stack:** TS strict (`noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `composite`), vitest; app = Next 14 / React 18 with its own cartoonish tokens, self-contained SVG/CSS assets.

## Global Constraints
- **SYNTHETIC / local only.** No backend, no cloud storage, no real internet publishing (gated by G3 + E1-D2). Publish = a **simulated showcase**.
- **No gamification** — no score/grade/streak/points/badge/rank/win-lose, no child-facing grade, anywhere (tested invariant). Declared AI help is a **neutral** `Assistance` node.
- `import type` for types; guard `T | undefined`; pure/immutable engine. Self-contained assets (no external image/font fetch). `prefers-reduced-motion` disables motion.
- **`pnpm install`** (not `--frozen`) after each new `package.json`. Branch from current `main`.
- **Coordinate the evidence mapping** (§4.3) with the E1 (EvidenceGraph) owner before the real adapter (Task 5) merges; the stub keeps everything unblocked.

---

### Task 0: Scaffold `@gt100k/project-workspace`
**Files:** `passion/packages/project-workspace/{package.json,tsconfig.json,src/index.ts,test/smoke.test.ts}`; root `tsconfig.json`.
- [ ] Failing smoke test; `package.json` (`@gt100k/project-workspace`; deps `@gt100k/evidence-graph`, `@gt100k/specialization-planner`; `test` = `vitest run --root ../.. packages/project-workspace/test`); `tsconfig.json` (extends base; references `../evidence-graph`, `../specialization-planner`); `src/index.ts` → `export {};`; append root reference.
- [ ] `pnpm install` → `pnpm exec tsc -b && pnpm test` PASS. **Commit** `feat(project-workspace): scaffold @gt100k/project-workspace`.

---

### Task 1: Types + constants (P0)
**Files:** `src/model.ts`, `test/model.test.ts`; barrel.
**Produces:** `AgeBand`, `ProjectSource`, `WorkEventKind` (the 10), `WorkEvent`, `Project` (spec §4.1). Reuse `ProjectBrief` from `@gt100k/specialization-planner`.
- [ ] Define the types exactly per §4.1 (append-only `events`; **no score/grade/reward field**). Constant `WORK_EVENT_KINDS` (the 10) for iteration/validation.
- [ ] Unit test pins `WORK_EVENT_KINDS` (length 10, exact members). **Commit** `feat(project-workspace): Project + WorkEvent model`.

---

### Task 2: `startProject` + `logEvent` + perseverance (P1) — CORE
**Files:** `src/project.ts`, `test/project.test.ts`; barrel.
**Interfaces:**
- `startProject(input: { brief: ProjectBrief; kidId; ageBand } | { selfAuthored: { kidId; ageBand; title; drivingQuestion; authenticMethod; audience } }, now: string): Project` — from a D1 brief (carries drivingQuestion/method/audience/craftScaffold, `source:"planner"`) or self-authored (`source:"self"`, blank events).
- `logEvent(project: Project, event: Omit<WorkEvent,"id">, now: string): Project` — appends an immutable event with a derived id; validates `kind ∈ WORK_EVENT_KINDS`.
- `hasPerseverance(project: Project): boolean` — true when an `outcome{stuck:true}` is followed by a `revision`/`attempt`/`artifact` that `refs` it.
- [ ] **Failing tests:** brief → project carries fields + `source:"planner"`; self → blank + `source:"self"`; `logEvent` appends immutably (original unchanged); all 10 kinds accepted; the stuck→revision→artifact chain → `hasPerseverance:true`, a clean run → `false`.
- [ ] Implement. **Commit** `feat(project-workspace): startProject + logEvent (append-only) + perseverance`.

---

### Task 3: `EvidenceSink` port + stub + `toEvidence` mapping (P2) — CORE
**Files:** `src/sink.ts` (port + `stubEvidenceSink` + `stubHasher`), `src/to-evidence.ts` (mapping), `src/__fixtures__/project.ts`, `test/to-evidence.test.ts`; barrel.
**Interfaces:**
- `interface EvidenceSink { record(project: Project): EvidenceGraph }` (`EvidenceGraph` from `@gt100k/evidence-graph`).
- `interface Hasher { hash(bytes: Uint8Array): string }` (matches `@gt100k/evidence-graph` `addNode`); `stubHasher` = a deterministic non-crypto digest (e.g. FNV-1a → hex), stable ids, no network.
- `toEvidence(project: Project, hasher: Hasher): EvidenceGraph` — fold events via `addNode`/`addEdge` from `@gt100k/evidence-graph` using the **§4.3 mapping** (each kind → its closed `NodeType`, `actor.kind`, edges). `stubEvidenceSink.record = (p) => toEvidence(p, stubHasher)`.
- [ ] **Failing golden test:** the fixture project → a graph where every node has a **valid closed `NodeType`**, edges resolve (`ai_help`→`Assistance`+`actor.kind:"model"`+`used_tool`; `outcome{stuck}`→`Outcome`+`contradicts`; `revision`→`Transformation`+`derived_from`; `artifact`→`Artifact`+`authored_by`; etc.); the graph passes the package's verifier; identical project → identical graph (stable ids).
- [ ] Implement. **Commit** `feat(project-workspace): EvidenceSink port + stub + toEvidence mapping (closed taxonomy)`.

---

### Task 4: Guardrail invariants (P3)
**Files:** `test/guardrails.test.ts`.
- [ ] Tests (spec §7 / SC-5, SC-6, SC-4):
  - **no gamification:** `Project`, `WorkEvent`, and the `toEvidence` output carry **no** key matching `/score|grade|streak|points|xp|badge|rank|leaderboard|win|lose/i` (recursive shape scan + type-level check);
  - **AI help neutral:** an `ai_help` event → `Assistance` node, `actor.kind:"model"`, `used_tool` edge; nothing flags it negative/penalized;
  - **determinism/offline:** identical project → identical stub graph; `stubEvidenceSink`/`toEvidence` touch no network/clock (ids come from content only).
- [ ] Fix if any invariant fails (non-negotiable). **Commit** `test(project-workspace): guardrail invariants (no gamification, AI-help neutral, deterministic)`.

---

### Task 5: Real adapter `@gt100k/evidence-sink-graph` (P4)
**Files:** `passion/adapters/evidence-sink-graph/{package.json,tsconfig.json,src/index.ts,test/parse.test.ts}`; root `tsconfig.json`.
**Interface:** `graphEvidenceSink(hasher?: Hasher): EvidenceSink` — real `EvidenceSink` using `@gt100k/evidence-graph` `addNode`/`addEdge` + a SHA-256 `Hasher` from `@gt100k/evidence-hash-node` (default). Same §4.3 mapping as the stub; a malformed event is **skipped, never throws** to the caller.
- [ ] `package.json` (deps `@gt100k/project-workspace`, `@gt100k/evidence-graph`, `@gt100k/evidence-hash-node`; scoped test script); `tsconfig.json` references those; append root reference. `pnpm install`.
- [ ] **Hermetic test** (no network): a fixture project → a schema-valid `EvidenceGraph` that the verifier accepts; a project with a malformed event → that event skipped, rest intact, no throw. (Never imported by a domain test.)
- [ ] Implement, sharing the mapping with the domain `toEvidence` (import it; the adapter only swaps the hasher). **Commit** `feat(evidence-sink-graph): real EvidenceSink over @gt100k/evidence-graph (SHA-256), fail-safe`.

---

### Task 6: `apps/project-studio` — cartoonish studio (P5) — built live
**Files:** `passion/apps/project-studio/{package.json,tsconfig.json,next.config.mjs,vitest.config.mts,app/*,test/*}`; root `tsconfig.json`.
**Reference the whole time:** `specs/022-project-studio/references/fella-01…09.png` (neo-brutalist cartoon: thick black outlines, flat colors, hard card shadows, condensed display type, mascot, floating shapes, grid).
- [ ] Scaffold Next 14 app; **own cartoonish token set** (bright flat palette + thick-outline system + one condensed display face + a readable body face; self-hosted/local fonts, no external fetch); `transpilePackages: ["@gt100k/project-workspace","@gt100k/evidence-graph","@gt100k/specialization-planner"]`. `pnpm install`.
- [ ] `app/seed.ts`: a small set of **`ProjectBrief` fixtures** (reuse the planner type) → `startProject` → seeded projects for **one demo child**; a self-authored starter. Deterministic.
- [ ] `app/useStudio.ts`: single-child controller — the child's projects, the open project, `logEvent` actions (map the 10 kid-facing entries), `localStorage` persistence (namespaced; seed always present on fresh load), and the `window.__qa` install.
- [ ] Studio UI (single child, **no switcher**): a project picker; the open project's **driving question + next step**; a **quest log** (the journey, entries by kind) + a **journey map** motif; an entry composer for each kind ("I tried…", "here's what happened / I got stuck", "I made this", "a robot helped with…", …); a **mascot** guide with warm punchy microcopy; artifacts attached **locally/by-reference**; a **simulated showcase** screen (mock audience, no real post). Celebrate trying/iterating/making — **no score/rank/streak**.
- [ ] `app/qa.ts` + `app/studio-state.ts`: `window.__qa` = `ready`/`error`/`state()` (`{projectId,eventCount,kinds,hasPerseverance}`) / `primaryAction()` (log a seeded `attempt` → `eventCount`++ + DOM entry). Pure state helpers + a headless CI test (mirror guide-console `state.test.ts`).
- [ ] a11y: AA contrast, keyboard nav + visible focus, alt text, 44px targets, `prefers-reduced-motion` alternative for all motion.
- [ ] gate: `pnpm exec tsc -b` + `pnpm --filter @gt100k/project-studio test`; then `next build`; run `LOOP_QA` (stub sink, deterministic): `window.__qa.ready===true`, `primaryAction()` logs an attempt (state + DOM), no external fetch. Screenshot vs `references/`. **Commit** `feat(project-studio): cartoonish Type III project studio (quest log + evidence capture)`.

---

### Task 7: Polish + verify (P6)
- [ ] Live polish pass: microcopy + mascot character + motion (reduced-motion safe); tune to the `references/` energy without any gamification.
- [ ] `pnpm exec tsc -b` clean; `pnpm test` green (domain + adapter); `next build` clean; `LOOP_QA` pass.
- [ ] `passionApps.md`: D2 engine + studio done (synthetic/local; real storage/publish gated); note the evidence mapping is coordinated with E1.
- [ ] Open PR (gh, pushed as `spinkicks`); `gh pr update-branch` if `main` moved; squash-merge after CI.

## Self-review (spec coverage)
- Every spec section maps to a task: types §4.1 → T1; startProject/logEvent/perseverance §4.1–4.2 → T2; EvidenceSink/mapping §4.3–4.4 → T3; guardrails §3/§7 → T4; real adapter §4.4 → T5; app §2/§5/§6 (single-child, seed fixtures, quest log, showcase, `window.__qa`, a11y) → T6; polish/verify §8 → T7. SC-1…SC-10 each land on a task's tests.
- Type consistency: `EvidenceSink`/`Hasher`/`toEvidence` names are identical in T3, T5, T6. `ProjectBrief` reused from the planner throughout.

## Snags (pre-solved)
- **Closed taxonomy:** never invent a NodeType — map strictly per §4.3; run the package verifier in the golden test so an invalid node fails CI.
- **Determinism:** the stub hasher must be content-only (no time/random); the app renders the seed on fresh load and the QA build starts from a clean `localStorage`.
- **No gamification** is a recursive shape test, not a vibe — celebrating effort is copy/mascot, never a number.
- **Self-contained assets** — SVG/CSS mascot + shapes, local fonts; no network in `next build`/`LOOP_QA`.
- **E1 coupling:** the real adapter is the only place touching the teammate's evolving API; keep the mapping in the domain `toEvidence` and have the adapter swap only the hasher, so a change is one file.
