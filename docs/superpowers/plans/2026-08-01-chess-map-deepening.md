# Deepen the Chess Mastery Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `CONSOLE_CHESS_MAP` from a 12-node line into a comprehensive, branched, resource-rich graph that reads as a real curriculum, without weakening the map's honesty gates.

**Architecture:** Pure data authoring against the existing `@gt100k/mastery-map` model. A new file holds a vetted chess resource library; `maps-seed.ts` imports it, attaches 2–4 resources per milestone, adds real opportunity/rating anchors, adds ~4–6 sourced milestones, and marks mode branches. No model, validator, or panel code changes. The guide console panel already renders resources, opportunities, practice, and trunk/branch labels.

**Tech Stack:** TypeScript, pnpm workspaces, vitest, biome. Packages: `@gt100k/mastery-map`, `@gt100k/concierge` (`CuratedResource`, `AgeTier`), `@gt100k/two-axis-tagging` (`WorkMode`).

## Global Constraints

- **Honesty — syllabus dominance:** the existing test requires `syllabus.length >= MS.length - 2`. **At most two milestones total may be non-`syllabus`.** Source nearly everything to the Steps Method (Stappenmethode). The `explain`/teach branch (basis `research`) spends one of the two non-syllabus slots; do not exceed two.
- **Honesty — sources:** every non-`model` ordering has ≥1 real `Source`; a `model` basis carries **no** sources (validator `E4`); `model`-basis share stays `< 0.34` (`MODEL_BASIS_MAX_SHARE`).
- **Honesty — resources:** every `CuratedResource` has a **live-verified** `url` (check with WebFetch before adding; drop any that 404 or redirect off-domain), `provenance: "curated-library:human-vetted"`, correct `ageTiers` (`"6-8" | "9-11" | "12-14"`), a defensible `reputation` (0–1), and accurate `affordedModes` / `domainPath: ["games-strategy","chess"]` / `pursuits: ["chess"]`.
- **Honesty — capabilities:** no `capability` begins with a consumption opener (read/watch/study X) — validator `W6`. State what the child can *do*.
- **Honesty — ceiling preserved:** the `limit` text on `ch-rating-that-means-something` (the ~2100 ceiling, titles caveat) stays verbatim.
- **Validator green:** `validateMap(CONSOLE_CHESS_MAP, REVIEW_NOW).errors` must be `[]` after every task.
- **Determinism:** no `Date.now()` / `Math.random()` / argless `new Date()` in seed or tests.
- **Lanes:** new resources go in a **new file**; editing `maps-seed.ts` and `chess-map.test.ts` is expected. No barrel/index re-exports, no central route array.
- **Gates before PR:** `pnpm lint` (biome), `pnpm typecheck` (`tsc -b`), `pnpm test` (vitest), from repo root.
- **Delivery:** one PR (operator approved combining). Each task below still ends in its own commit.

## File Structure

- **Create** `passion/apps/guide-console/app/maps-seed-chess-resources.ts` — the vetted chess `CuratedResource[]` library, exported for `maps-seed.ts`.
- **Modify** `passion/apps/guide-console/app/maps-seed.ts` — import the library; attach resources; add `OpportunityHint`s; add new `Milestone`s; add `explain` to `CONSOLE_CHESS_MAP.modes`; mark branch milestones' `modes`.
- **Modify** `passion/apps/guide-console/test/chess-map.test.ts` — add depth + branch + resource invariants alongside the existing honesty tests.

## Reference: `CuratedResource` literal shape (from `@gt100k/concierge`)

```ts
const EXAMPLE: CuratedResource = {
  id: "cr-lichess-endgames",
  title: "Lichess: practical endgame training",
  url: "https://lichess.org/practice",
  affordedModes: ["perform", "investigate"],
  domainPath: ["games-strategy", "chess"],
  pursuits: ["chess"],
  reputation: 0.9,
  ageTiers: ["6-8", "9-11", "12-14"],
  provenance: "curated-library:human-vetted",
};
```

`Milestone` fields (from `@gt100k/mastery-map`): `id`, `title`, `capability`, `requires` (string[]), `modes` (WorkMode[]; `[]` = trunk), `stageFloor` (`"S1_IGNITION" | "S2_FOUNDATIONS" | "S3_AUTHORSHIP" | "S4_SIGNATURE"`), `ordering` (`{ reason, basis, sources, limit? }`), `resources`, `practice` (`{ title, description, solitary }[]`), `demonstration`, `opportunities` (`OpportunityHint[]`), `authorship`. `OpportunityHint`: `{ kind: "competition"|"showcase"|"community"|"mentorship", description, readinessNote, stageFloor }`.

---

### Task 1: Vetted chess resource library

**Files:**
- Create: `passion/apps/guide-console/app/maps-seed-chess-resources.ts`
- Test: `passion/apps/guide-console/test/chess-map.test.ts`

**Interfaces:**
- Produces: `export const CHESS_RESOURCES: readonly CuratedResource[]` and named singletons re-used across milestones, e.g. `STEP1_WORKBOOK`, `STEP2_WORKBOOK`, `STEP3_WORKBOOK`, `STEP4_WORKBOOK`, `STEP5_WORKBOOK`, `STEP6_WORKBOOK`, `LICHESS_TRAINING`, `LICHESS_ENDGAMES`, `LICHESS_STUDIES_MATES`, `CHESSCOM_LESSONS`, `NOTATION_GUIDE`, `USCHESS_RATINGS_CLASSES`, `USCHESS_TOURNAMENT_FINDER`, `FIDE_LAWS_RES`. Existing `maps-seed.ts` will import these.

- [ ] **Step 1: Verify candidate URLs are live (no test yet)**

Run WebFetch on each candidate before writing it in. Confirm the page loads on the stated domain and matches the title. Minimum set to verify (drop/replace any that fail):
`https://www.stappenmethode.nl/en/` and its per-step product pages, `https://lichess.org/training`, `https://lichess.org/practice`, `https://lichess.org/study`, `https://www.chess.com/lessons`, `https://new.uschess.org/` ratings/classes page, the US Chess event/tournament finder, `https://handbook.fide.com/chapter/E012023` (Laws), a notation guide (e.g. a Lichess or chess.com "how to read notation" page).

- [ ] **Step 2: Write the failing test**

Add to `chess-map.test.ts`:

```ts
import { CHESS_RESOURCES } from "../app/maps-seed-chess-resources.js";

describe("the chess resource library is real and vetted", () => {
  it("carries a substantial, distinct set of resources", () => {
    expect(CHESS_RESOURCES.length).toBeGreaterThanOrEqual(14);
    const urls = new Set(CHESS_RESOURCES.map((r) => r.url));
    expect(urls.size).toBe(CHESS_RESOURCES.length); // no duplicate URLs
  });

  it("every resource is hand-vetted with a real shape", () => {
    for (const r of CHESS_RESOURCES) {
      expect(r.provenance, r.id).toBe("curated-library:human-vetted");
      expect(r.url.startsWith("https://"), r.id).toBe(true);
      expect(r.ageTiers.length, r.id).toBeGreaterThan(0);
      expect(r.reputation, r.id).toBeGreaterThan(0);
      expect(r.pursuits, r.id).toContain("chess");
      expect(r.domainPath, r.id).toEqual(["games-strategy", "chess"]);
    }
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter @gt100k/guide-console test -- chess-map`
Expected: FAIL — cannot resolve `../app/maps-seed-chess-resources.js`.

- [ ] **Step 4: Create the resource library**

Create `maps-seed-chess-resources.ts` with ≥14 verified resources. Shape each like the `EXAMPLE` above. Set `ageTiers` per resource (Steps Step 1 → all tiers; Step 5/6 → `["9-11","12-14"]`; rated-play/tournament finders → `["9-11","12-14"]`). Set `affordedModes`: workbooks `["investigate","perform"]`, Lichess training/practice `["perform","investigate"]`, lessons `["investigate","perform"]`, ratings/tournament pages `["perform"]`, notation guide `["investigate"]`. Export `CHESS_RESOURCES` as the readonly array of all singletons.

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @gt100k/guide-console test -- chess-map`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add passion/apps/guide-console/app/maps-seed-chess-resources.ts passion/apps/guide-console/test/chess-map.test.ts
git commit -m "feat(guide-console): a vetted chess resource library, real per-step and per-tool"
```

---

### Task 2: Attach resources and opportunities to existing milestones

**Files:**
- Modify: `passion/apps/guide-console/app/maps-seed.ts` (chess section, ~lines 783–1175)
- Test: `passion/apps/guide-console/test/chess-map.test.ts`

**Interfaces:**
- Consumes: `CHESS_RESOURCES` singletons from Task 1.
- Produces: no new exports; enriches `CHESS_MILESTONES`.

- [ ] **Step 1: Write the failing test**

```ts
describe("every rung is runnable and points somewhere real", () => {
  it("gives most milestones more than one resource, drawn from the library", () => {
    const libIds = new Set(CHESS_RESOURCES.map((r) => r.id));
    let multi = 0;
    for (const m of MS) {
      expect(m.resources.length, m.id).toBeGreaterThan(0);
      for (const r of m.resources) expect(libIds.has(r.id), `${m.id} → ${r.id}`).toBe(true);
      if (m.resources.length >= 2) multi += 1;
    }
    expect(multi).toBeGreaterThanOrEqual(MS.length - 2);
  });

  it("names real-world opportunities across the ladder, not just at the end", () => {
    const withOpps = MS.filter((m) => m.opportunities.length > 0);
    expect(withOpps.length).toBeGreaterThanOrEqual(5);
  });

  it("anchors a rating-class checkpoint a stranger could verify", () => {
    const rating = byId("ch-rating-that-means-something");
    expect(rating.opportunities.some((o) => o.kind === "competition")).toBe(true);
    expect(rating.ordering.limit).toContain("2100"); // ceiling caveat preserved
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @gt100k/guide-console test -- chess-map`
Expected: FAIL — `multi` and `withOpps` below thresholds (today only 2 resources reused, 2 opps).

- [ ] **Step 3: Enrich the milestones**

In `maps-seed.ts`, import the singletons from `./maps-seed-chess-resources.js`. For each existing milestone, replace the reused `[STEPS_WORKBOOKS]` / `[..., LICHESS_PRACTICE]` with 2–4 resources chosen for *that* capability (e.g. `ch-write-it-down` → `[STEP1_WORKBOOK, NOTATION_GUIDE]`; `ch-see-the-tactic` → `[STEP2_WORKBOOK, LICHESS_TRAINING, CHESSCOM_LESSONS]`; `ch-first-endgames` → `[STEP3_WORKBOOK, LICHESS_ENDGAMES]`). Add `OpportunityHint`s to ≥5 milestones: online arena (early, `ch-see-the-tactic`/`ch-real-tournament-game`), club ladder, scholastic tournament, federation-rated event, and rating-class checkpoints on `ch-rating-that-means-something`. Keep each `readinessNote` honest and `stageFloor` ≥ the milestone's. Do **not** touch the ceiling `limit`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @gt100k/guide-console test -- chess-map`
Expected: PASS (including the pre-existing validator + honesty tests — confirm `validateMap` still green).

- [ ] **Step 5: Commit**

```bash
git add passion/apps/guide-console/app/maps-seed.ts passion/apps/guide-console/test/chess-map.test.ts
git commit -m "feat(guide-console): real resources and an opportunity ladder on the chess map"
```

---

### Task 3: Fuller coverage — new sourced milestones

**Files:**
- Modify: `passion/apps/guide-console/app/maps-seed.ts`
- Test: `passion/apps/guide-console/test/chess-map.test.ts`

**Interfaces:**
- Produces new milestone ids used by Task 4 branches: `ch-opening-principles`, `ch-king-safety`, `ch-study-your-games`, `ch-visualize`. Wire `requires` into the existing DAG.

- [ ] **Step 1: Verify the sources for each new milestone**

Confirm the Steps Method covers each placement (opening *principles* before repertoire; king safety/castling; reviewing your own games; visualization) so each new milestone can be `basis: "syllabus"` with `sources: [STEPS_METHOD]` (plus FIDE where relevant). Keep the two-non-syllabus budget: none of these should need a non-syllabus basis. Note findings in the commit message.

- [ ] **Step 2: Write the failing test**

```ts
describe("the map covers the real gaps in a beginner's climb", () => {
  it("has grown into a substantial graph", () => {
    expect(MS.length).toBeGreaterThanOrEqual(16);
  });

  it("teaches opening principles, king safety, self-review and visualization", () => {
    for (const id of ["ch-opening-principles", "ch-king-safety", "ch-study-your-games", "ch-visualize"]) {
      expect(MS.some((m) => m.id === id), id).toBe(true);
    }
  });

  it("keeps the graph acyclic with no dangling prerequisite", () => {
    const ids = new Set(MS.map((m) => m.id));
    for (const m of MS) for (const r of m.requires) expect(ids.has(r), `${m.id} → ${r}`).toBe(true);
    // validator also checks E1_CYCLE:
    expect(validateMap(CONSOLE_CHESS_MAP, REVIEW_NOW).errors).toEqual([]);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter @gt100k/guide-console test -- chess-map`
Expected: FAIL — `MS.length < 16`, new ids absent.

- [ ] **Step 4: Author the new milestones**

Add each to `CHESS_MILESTONES` with a doing-verb `capability`, `basis: "syllabus"`, `sources: [STEPS_METHOD]` (add `FIDE_LAWS` where a rule is cited), ≥2 library resources, ≥1 `practice` form, a `demonstration` artefact, `authorship: "human-authored"`, and DAG placement, e.g.:
- `ch-opening-principles` requires `ch-whole-game`, `stageFloor: "S1_IGNITION"`.
- `ch-king-safety` requires `ch-opening-principles`, `stageFloor: "S2_FOUNDATIONS"`.
- `ch-visualize` requires `ch-see-the-tactic`, `stageFloor: "S2_FOUNDATIONS"` (a shorter rung feeding `ch-see-ahead`; add `ch-visualize` to `ch-see-ahead.requires`).
- `ch-study-your-games` requires `ch-real-tournament-game`, `stageFloor: "S3_AUTHORSHIP"`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter @gt100k/guide-console test -- chess-map`
Expected: PASS. Confirm the pre-existing `syllabus >= MS.length - 2` test still passes (all new nodes are syllabus).

- [ ] **Step 6: Commit**

```bash
git add passion/apps/guide-console/app/maps-seed.ts passion/apps/guide-console/test/chess-map.test.ts
git commit -m "feat(guide-console): opening principles, king safety, self-review and visualization rungs"
```

---

### Task 4: Mode branches — turn the line into a graph

**Files:**
- Modify: `passion/apps/guide-console/app/maps-seed.ts`
- Test: `passion/apps/guide-console/test/chess-map.test.ts`

**Interfaces:**
- Consumes: milestone ids from Tasks 1–3.
- Produces: `CONSOLE_CHESS_MAP.modes` becomes `["perform","investigate","explain"]`; some milestones get non-empty `modes`; adds one teach milestone `ch-teach-a-beginner`.

- [ ] **Step 1: Verify the teach-branch source**

Confirm real learning-by-teaching / protégé-effect literature to cite (e.g. Fiorella & Mayer 2013; the "protégé effect"). This milestone is `basis: "research"` and spends **one** of the two non-syllabus slots. If a clean citation cannot be found, cut the teach branch and keep `modes: ["perform","investigate"]` (record the decision in the commit message). Do not assert it on a `model` basis.

- [ ] **Step 2: Write the failing test**

```ts
import { WORK_MODES } from "@gt100k/two-axis-tagging";

describe("the map reads as a graph, not a single line", () => {
  it("declares the modes its branches use and no others", () => {
    for (const mode of CONSOLE_CHESS_MAP.modes) expect(WORK_MODES).toContain(mode);
    expect(CONSOLE_CHESS_MAP.modes).toContain("explain");
  });

  it("has real branches whose modes are a subset of the map's", () => {
    const mapModes = new Set<string>(CONSOLE_CHESS_MAP.modes);
    const branches = MS.filter((m) => m.modes.length > 0);
    expect(branches.length).toBeGreaterThanOrEqual(3);
    for (const b of branches) for (const mode of b.modes) expect(mapModes.has(mode), `${b.id} ${mode}`).toBe(true);
  });

  it("keeps at most two non-syllabus rungs, the teach branch being one", () => {
    const nonSyllabus = MS.filter((m) => m.ordering.basis !== "syllabus");
    expect(nonSyllabus.length).toBeLessThanOrEqual(2);
    expect(byId("ch-teach-a-beginner").ordering.basis).toBe("research");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter @gt100k/guide-console test -- chess-map`
Expected: FAIL — `modes` lacks `explain`, no branch milestones, `ch-teach-a-beginner` absent.

- [ ] **Step 4: Add branches and the teach milestone**

In `CONSOLE_CHESS_MAP`, set `modes: ["perform", "investigate", "explain"]`. Mark branch milestones' `modes` (leave the trunk spine as `[]`):
- `perform` branch: `ch-real-tournament-game`, `ch-rating-that-means-something` → `modes: ["perform"]`.
- `investigate` branch: `ch-study-your-games`, `ch-play-without-a-target`, `ch-convert` → `modes: ["investigate"]`.
- `explain` branch: add `ch-teach-a-beginner` (requires `ch-see-the-tactic`; `stageFloor: "S3_AUTHORSHIP"`; `modes: ["explain"]`; `basis: "research"` with the verified citation; capability like "Teach a beginner a tactic so they can find it themselves"; demonstration "A short lesson you gave, and what the learner could do after").

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter @gt100k/guide-console test -- chess-map`
Expected: PASS, and `validateMap` green (branch `modes` ⊆ map `modes` is validator-checked).

- [ ] **Step 6: Commit**

```bash
git add passion/apps/guide-console/app/maps-seed.ts passion/apps/guide-console/test/chess-map.test.ts
git commit -m "feat(guide-console): compete/study/teach branches turn the chess map into a graph"
```

---

### Task 5 (OPTIONAL — final slice): a demo child climbing the deep map

Build only if time allows before the demo; the deep map stands on its own without it.

**Files:**
- Modify: `passion/apps/guide-console/app/maps-seed.ts` and/or the child/evidence seed it reads (`passion/apps/guide-console/app/map-evidence.ts`).
- Test: `passion/apps/guide-console/test/chess-map.test.ts` or the maps-panel test.

**Interfaces:**
- Consumes: the deepened `CONSOLE_CHESS_MAP` and the existing child-read shape used by the Maps tab (inspect the current "Dulce" seed and `map-evidence.ts` before authoring — follow that exact shape; do not invent a new read model).

- [ ] **Step 1: Inspect the existing child-read seed**

Read `map-evidence.ts` and the current seeded child in `maps-seed.ts` to learn how linked work maps to milestones and how a standing is derived. Do not proceed until the shape is clear.

- [ ] **Step 2: Write the failing test**

Assert the demo child has work linked across ≥2 branches (e.g. a `perform` rung and an `investigate` rung), and that the panel view model derives a standing only where work exists. (Exact assertion depends on the read shape found in Step 1 — write it against that shape, not a guessed one.)

- [ ] **Step 3: Run test to verify it fails.** `pnpm --filter @gt100k/guide-console test`

- [ ] **Step 4: Seed the demo child's linked chess work** across branches (attested chess.com game links + a studio artefact), following the shape from Step 1.

- [ ] **Step 5: Run tests to verify they pass.** `pnpm --filter @gt100k/guide-console test`

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(guide-console): a demo child climbing the deep chess map across branches"
```

---

### Task 6: Full gate + PR

- [ ] **Step 1: Run the full local gate**

```bash
pnpm lint && pnpm typecheck && pnpm test
```
Expected: all green. Fix any biome/tsc/vitest failures before proceeding.

- [ ] **Step 2: Push the branch and open a draft PR (as spinkicks, via gh)**

PR body references the spec and notes the diff is mostly seed data (over the ~400-line guide by design). End the body with the Claude Code footer. Title: `feat(guide-console): deepen the chess mastery map — resources, opportunities, coverage, branches`.

---

## Self-Review

**Spec coverage:**
- §4.1 resources → Task 1 + Task 2. ✓
- §4.2 opportunities/rating anchors → Task 2. ✓
- §4.3 coverage/new milestones → Task 3. ✓
- §4.4 branches (incl. `explain`) → Task 4. ✓
- §5 validation/testing → invariants distributed across Tasks 1–4; full gate in Task 6. ✓
- §6 slicing + optional demo child → Task 5; one PR in Task 6. ✓
- §7 out of scope (no model/panel/attestation changes) → honored; no task touches them. ✓

**Correction vs. spec:** the spec cited the 34% model rule; the *binding* gate is the existing test's `syllabus >= MS.length - 2` (≤2 non-syllabus). The plan is built around the stricter gate — new milestones are `syllabus`, the teach branch spends one non-syllabus slot. Recorded in Global Constraints and Task 4.

**Placeholder scan:** candidate URLs and sources are marked "verify with WebFetch/confirm citation" — this is a real implementation action (the model can't ship an unverified link honestly), not a TBD. Test code is concrete. No "similar to Task N" references.

**Type consistency:** milestone ids (`ch-opening-principles`, `ch-king-safety`, `ch-visualize`, `ch-study-your-games`, `ch-teach-a-beginner`) and resource singleton names are used identically across Tasks 1–4. `CONSOLE_CHESS_MAP.modes` end state `["perform","investigate","explain"]` matches the branch modes assigned. `validateMap(map, REVIEW_NOW)` signature matches the existing test's usage.
