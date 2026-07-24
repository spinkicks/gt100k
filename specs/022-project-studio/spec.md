# Feature Specification: D2 — Project Studio (the kid-facing "doing" surface)

**Feature Branch**: `022-project-studio`
**Created**: 2026-07-23
**Status**: Draft (grilled + gap-closed; pending final approval)

**Input**: D2 in `docs/prd/passionApps.md` + `SPECIALIZATION-PIPELINE-PRD.md` §6/§7.2 — where a child **does** a Renzulli **Type III** authentic project (the one the D1 planner proposed, or a self-chosen one) over weeks, and the **EvidenceGraph (E1) wraps every project** by capturing the honest **process** (attempts, failures, revisions, artifacts, declared AI help) — because we **grade the process, not the polish**. This is the **first child-facing** surface in the program. Design settled via a `/grilling` + brainstorming session (decisions §3). Aesthetic inspiration: `references/fella-*.png` (screenshots of smartfellaorfartsmella.com — a neo-brutalist cartoon look), borrowed for **look + voice only, never its scoring mechanic**.

**Design references (for the build/QA agent):** `specs/022-project-studio/references/fella-01.png` … `fella-09.png` — nine crisp desktop viewport shots covering the page top-to-bottom (hero, "which one are you" comparison cards, "what you get", pricing, FAQ, footer). Cues to match: bright flat colors, **thick black outlines**, chunky **condensed display type**, hard drop-shadows on rounded cards, floating geometric shapes + perspective-grid floor, big rounded outlined buttons, a **mascot**. Match the *energy + voice*; **drop the Fella Score / red-flag / rank / shareable-score mechanics entirely** (our no-gamification guardrail).

---

## 1. Why & where it sits
Discovery finds a spike; the planner (D1) proposes a staged Type III project; **D2 is where the kid actually does it** and the doing becomes evidence. The point is not a polished deliverable — it is a **tamper-evident record of a real, messy, iterative journey** (E1), including the **perseverance signal the graduation gate needs** (iteration *past* a failure). It must feel like a fun quest, not homework, so the child keeps coming back (protect the rage to master). It closes the `plan → doing → evidence` loop (D1 → D2 → E1) and produces the raw material the oral defense (E2) later probes.

## 2. Scope Fence *(hard)*

### In scope
- **Domain package** `@gt100k/project-workspace` (`passion/packages/project-workspace`): the pure `Project` + `WorkEvent` model (10 kinds, §3.3); `startProject(brief | selfAuthored)`; `logEvent(project, event)`; a pure **`toEvidence(project, deps)`** that maps the work-events → `@gt100k/evidence-graph` nodes+edges via the **`EvidenceSink` port** (§3.4); deterministic reducers; **no network**.
- **Adapter** `@gt100k/evidence-sink-graph` (`passion/adapters/evidence-sink-graph`): the real `EvidenceSink` over `@gt100k/evidence-graph` (`addNode`/`addEdge` + a `Hasher`). A **deterministic stub sink** ships in the domain package for CI.
- **App** `apps/project-studio` (Next 14, **cartoonish/neo-brutalist**, child-facing): a **single-child** studio (the kid's own — **no child switcher**, unlike the guide console) holding that child's projects. A kid picks/opens one of their projects, sees the driving question + next step, and logs quest entries (the 10 kinds) with a friendly mascot; artifacts attached **locally / by reference**; a **simulated showcase**; per-project **quest-log + journey map**. Implements **`window.__qa`/`LOOP_QA`**; WCAG 2.2 AA; reduced-motion. **SYNTHETIC/local only.**
- Seeded demo projects from **D1-brief-shaped fixtures** (reusing the planner's `ProjectBrief` type) for a single demo child + a self-authored flow.

### Out of scope (gated / owned elsewhere)
- **Real cloud storage of child files** and **real internet publishing** — blocked by pre-live gates **G3 (consent/erasure) + E1 D2 (erasure on append-only)**; v1 is local/simulated. The publish flow is a **simulated showcase**, never a real post.
- **Grading / scoring** — E1 (process assessment) + E2 (oral defense) own assessment; **D2 never scores the child** and has **no grade field**.
- **Gamification of any kind** — no score, streak, points, XP, badge, leaderboard, or win/lose, ever (a tested invariant).
- **The teammate's immersive game world** — the studio is standalone; the world may deep-link into it later.
- **A guide view of projects** — the guide reads the *evidence* via E1; a project view in the guide console is later.
- **Real consent/age-tier derivation** (G3) — `ageBand` is a supplied field; synthetic here.

## 3. Design decisions *(from the grill — do not re-open)*
- **[D1]** **Full studio on synthetic/local/simulated data** — multi-project, local/by-reference artifacts, simulated showcase; real storage/publishing switch on after G3/G4/E1-D2.
- **[D2]** **Cartoonish "project quest studio"** — mascot guide, neo-brutalist look + punchy encouraging voice (per `references/`), adventure/journey framing; celebrates **trying + iterating + making**.
- **[D3]** **No gamification** — borrow the fella *look + voice*, never its scoring. **No score/streak/points/badge/leaderboard/win-lose**, no child-facing grade. (Enforced by a shape/type test.)
- **[D4]** **Quest entries → EvidenceGraph nodes** through a typed **`EvidenceSink` port**; real adapter over `@gt100k/evidence-graph` + a deterministic stub for CI. Every entry becomes provenance.
- **[D5]** **Seeded from a D1 brief AND self-authored** — the child owns problem/method/pace; the brief is an **offer**.
- **[D6]** **Declared AI help is neutral** — an `Assistance` node, status-equal, never penalized (honesty is architecture).
- **[D7]** **Standalone `apps/project-studio`** (ours), deep-linkable from the teammate's world later.
- **[D8]** **Self-contained deterministic assets** — mascot + shapes + grid are **SVG/CSS** (no external image fetches), so `next build` + `LOOP_QA` stay offline + deterministic. **Reduced-motion** disables the playful motion.
- **[D9]** **Tone works ~8–13** (playful, not babyish); an **`ageBand` prop** dials copy/mascot register (young ↔ older) so an S3/S4 teen isn't patronized — full age-adaptive art is later.

## 4. Domain model *(decisions already made — do not re-open)*

### 4.1 Project + WorkEvent
```
AgeBand = "6-8" | "9-11" | "12-14"
ProjectSource = "planner" | "self"
Project {
  id; kidId; title; drivingQuestion; authenticMethod; audience;  // audience level (self→field)
  craftScaffold?: string;                 // from a D1 brief when source==="planner"
  source: ProjectSource; ageBand: AgeBand;
  createdAt; events: readonly WorkEvent[]; // append-only journey
}
WorkEventKind =
  "session" | "attempt" | "outcome" | "revision" | "artifact"
  | "decision" | "reflection" | "ai_help" | "milestone" | "showcase";
WorkEvent {
  id; kind: WorkEventKind; at: string;
  text: string;                           // the kid's words ("what I tried", …)
  stuck?: boolean;                         // outcome: it broke / I got stuck (the perseverance seed)
  refs?: readonly string[];               // ids of prior events/artifacts this builds on
  artifact?: { title: string; kind: string; ref?: string };  // local/by-reference; NO cloud store
  aiTool?: { name: string; version: string };                // ai_help only (declared)
}
```
Append-only `events` = the honest journey. **No score/grade/reward field anywhere on `Project`/`WorkEvent`.**

### 4.2 The perseverance pattern (what the gate wants)
An `outcome{stuck:true}` → a later `revision` (or new `attempt`) → an `artifact` that `refs` the stuck outcome = **"iteration past a failure."** The engine can surface this chain; the EvidenceGraph records it as `Attempt → Outcome(contradicts) → Transformation → Artifact(derived_from)`.

### 4.3 Quest entry → EvidenceGraph mapping *(closed taxonomy — `@gt100k/evidence-graph`)*
Every kid entry maps to a valid **closed** `NodeType` + edges (the graph rejects unknown types):
| Kid entry | NodeType | actor.kind | key edge(s) |
|---|---|---|---|
| `session` | `Contribution` | human | `authored_by` child |
| `attempt` | `Attempt` | human | `authored_by` child |
| `outcome` | `Outcome` | human | `derived_from` its attempt; `validates` (worked) / `contradicts` (stuck) |
| `revision` | `Transformation` | human | `derived_from` prior artifact/outcome |
| `artifact` | `Artifact` | human | `authored_by` child; `derived_from` its source event |
| `decision` | `Claim` | human | `authored_by` child |
| `reflection` | `Claim` | human | `authored_by` child |
| `ai_help` | `Assistance` | model | `used_tool` (the AI); the assisted node notes the model actor |
| `milestone` | `Outcome` | human | `derived_from` the contributing artifacts |
| `showcase` | `Review` | system | `released_as` (artifact → showcase); `validates` |
`payload` carries the kid's `text` + flags; `consentScope` is a synthetic carried field; `id` is content-addressed by `addNode`.

### 4.4 The `EvidenceSink` port + stub + real adapter
```
EvidenceSink { record(project: Project): EvidenceGraph }   // pure over the project's events
```
- **Stub** (`stubEvidenceSink`, in-package): builds the graph with a **deterministic non-crypto hasher** (stable ids) — CI + `LOOP_QA` use it; no network.
- **Real** (`@gt100k/evidence-sink-graph`): folds events → `addNode`/`addEdge` from `@gt100k/evidence-graph`, using a real `Hasher` (`@gt100k/evidence-hash-node` SHA-256). Coordinate the mapping/ownership with the E1 owner (teammate). **Never imported by a domain test.**

### 4.5 Seeding + persistence (v1)
- **Seed = D1-brief-shaped fixtures, not a live planner run.** A small set of deterministic `ProjectBrief` fixtures (reusing the **`ProjectBrief` type from `@gt100k/specialization-planner`**, so a real planner brief drops in unchanged later) seeds a demo child's projects. We do **not** wire the full planner→wellbeing→curated chain into the studio; that keeps D2 decoupled + deterministic. (A future step can feed a live planner brief through the same `startProject`.)
- **Single demo child.** The studio is one child's own; the demo uses a single synthetic child with the seeded projects + a self-authored one.
- **Client-local only.** Self-authored projects + logged events persist in **`localStorage`** (namespaced) — **no backend, no cloud store**.
- **Determinism for `LOOP_QA`:** the app always renders the deterministic **seed** on a fresh load; `localStorage` only *augments* within a session (and the QA build starts from a clean store), so `window.__qa.state()` off the seed is stable run-to-run.

## 5. Aesthetic + a11y
- **Neo-brutalist cartoon** (per `references/fella-*.png`): a small set of flat brand colors + thick black outlines, one chunky display face for headings + a readable body face, floating SVG shapes, a mascot (SVG), rounded outlined buttons, optional perspective-grid motif. **Its own token set** (`apps/project-studio`), NOT the dark console theme.
- **Self-contained assets** (SVG/CSS) — no external image/font fetches (offline, deterministic).
- **Voice:** warm, punchy, encouraging, effort-celebrating ("You tried something tricky!"); never evaluative/ranked. Budget real attention on microcopy + mascot character.
- **a11y:** WCAG 2.2 AA contrast (the thick-outline palette helps), full keyboard nav + visible focus, alt text, **`prefers-reduced-motion`** disables the playful motion, 44px touch targets, readable ≥14px.

## 6. `window.__qa` contract
`ready`, `error`, `state()` = `{ projectId, eventCount, kinds: string[], hasPerseverance: boolean }`, `primaryAction()` = log a seeded `attempt` on the open project (observable: `eventCount` increments + DOM entry appears). No score/grade in the state.

## 7. Success Criteria *(each maps to a test)*
- **SC-1** `startProject` from a D1 brief carries the driving question/method/audience/craftScaffold; a self-authored project starts blank with `source:"self"` — test.
- **SC-2** `logEvent` appends immutably; each of the 10 kinds is accepted; `outcome{stuck}` + later `revision`/`artifact` refs form the perseverance chain (`hasPerseverance`) — test.
- **SC-3** `toEvidence` maps every event to a **valid closed** `NodeType` + edges per §4.3; the graph verifies (no unknown types; edges resolve) — golden test.
- **SC-4** determinism: identical project → identical graph (stub hasher stable ids); the stub sink uses **no network** — test.
- **SC-5** no gamification: `Project`/`WorkEvent`/`state()` carry **no** score/grade/streak/points/badge/rank field (type-level + shape check) — test.
- **SC-6** declared AI help is neutral: an `ai_help` event → an `Assistance` node with `actor.kind:"model"` + `used_tool`; nothing marks it as negative/penalized — test.
- **SC-7** real adapter: `@gt100k/evidence-sink-graph` builds a schema-valid `EvidenceGraph` over `@gt100k/evidence-graph` for a fixture project; a malformed event fails safe (skipped, never throws to the UI) — hermetic test (never imported by a domain test).
- **SC-8 (app)** the studio renders a seeded project + its quest log; `window.__qa.ready===true`, `error===null`, `primaryAction()` logs an attempt (state + DOM change); reduced-motion respected; no external fetch — render test + `LOOP_QA`.
- **SC-9** age band: `ageBand` shifts copy/mascot register (young ↔ older) — a 12-14 project isn't babied — test/snapshot.
- **SC-10** gate: `pnpm exec tsc -b` + `pnpm test` (domain + adapter) + `apps/project-studio` `next build` + `LOOP_QA` pass; visual parity with `references/` verified by screenshot.

## 8. Phasing (P0…P6)
- **P0** scaffold `@gt100k/project-workspace`; types; smoke.
- **P1** `startProject` + `logEvent` (append-only, 10 kinds) + perseverance detection. Golden.
- **P2** `EvidenceSink` port + `stubEvidenceSink` + `toEvidence` mapping (§4.3). Golden (valid closed taxonomy + verify).
- **P3** guardrail tests (no gamification/score/grade; AI-help neutral).
- **P4** adapter `@gt100k/evidence-sink-graph` over `@gt100k/evidence-graph` + hermetic parse/fail-safe test.
- **P5** `apps/project-studio` — cartoonish studio (seeded demo projects from fixture briefs + self-author + quest log + simulated showcase + mascot); `window.__qa`; localStorage; a11y + reduced-motion. **Built live** (polish-heavy) with screenshots vs `references/`.
- **P6** polish pass (microcopy + mascot character + motion).

## 9. Loop / build notes
- **Domain + adapter:** headless; gate `tsc -b` + `test`; adapter opt-in-ish + never imported by a domain test (hermetic).
- **App:** polish-heavy + creative → **built live** (like the console), `LOOP_QA` with the **stub sink** (deterministic, offline); `window.__qa` + reduced-motion + self-contained assets keep it hermetic.
- **Requires `pnpm install`** (not `--frozen`); imports `@gt100k/{evidence-graph, specialization-planner}` (evidence model + the `ProjectBrief` type/seed) + the evidence hasher in the adapter.
- Branch from current `main`; new files under `passion/packages/project-workspace` + `passion/adapters/evidence-sink-graph` + `passion/apps/project-studio` + root `tsconfig.json` appends. **Coordinate the evidence mapping with the E1 (EvidenceGraph) owner.**

## 10. Stack + Commands (pinned)
- Domain `passion/packages/project-workspace` (`@gt100k/project-workspace`), deps `@gt100k/evidence-graph` (node/edge model + `addNode`/`addEdge` for the stub sink) + `@gt100k/specialization-planner` (the `ProjectBrief` type + seed fixtures). Adapter `passion/adapters/evidence-sink-graph` (`@gt100k/evidence-sink-graph`), deps `@gt100k/project-workspace` + `@gt100k/evidence-graph` + `@gt100k/evidence-hash-node`. App `passion/apps/project-studio` (Next 14, React 18): dep `@gt100k/project-workspace`; own cartoonish tokens; `transpilePackages` the workspace deps.
- Gate: `pnpm exec tsc -b` + `pnpm test`; app `next build` + `LOOP_QA`. TS strict; SYNTHETIC/local only; no network in the gate.
