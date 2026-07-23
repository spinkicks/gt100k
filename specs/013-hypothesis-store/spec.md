# Feature Specification: Hypothesis Store + Lifecycle + Guide Console

**Feature Branch**: `013-hypothesis-store`
**Created**: 2026-07-23
**Status**: Draft (loop-ready)

**Input**: The durable output of discovery and the thin-human surface (C4 in `docs/prd/passionApps.md`). A **domain package** holds the revisable `InterestHypothesis` per candidate spike, its **lifecycle state machine** (`EXPLORING → EMERGING → CANDIDATE → ACTIVE` + `PARKED / CONTESTED / REOPENED`), the **Phase 2→3 graduation gate** (deterministic checks + a required human autonomy sign-off), and a pure **console view-model**. A **guide-console app** (Next.js) renders it so a human promotes/parks/reopens with the evidence in front of them. Grounding: `DISCOVERY-APP-PRD.md` §8, `SPECIALIZATION-PIPELINE-PRD.md` §3, `passion/CONTEXT.md` (InterestHypothesis, Revisable Hypothesis), `docs/prd/hardening/human-scaling.md` (human-owns-of-record), consumes `@gt100k/interest-inference` (011).

> **Loop-ready note.** Two parts: (A) a headless domain package on the `pnpm exec tsc -b` + `pnpm test` gate; (B) a **served Next app** (`apps/guide-console`) that DOES enable the **`LOOP_QA` usability gate** — it implements the **`window.__qa` contract** (`ready`/`error`/`state()`/`primaryAction`) so the harness can verify the console is live. Imports `@gt100k/interest-inference` by name → `pnpm install` (not `--frozen-lockfile`) required. **SYNTHETIC ONLY** (synthetic students/reads; no real child data).

---

## 1. Why & where it sits
011 emits an `InterestRead` (per-cell beliefs + ranked candidates) — a *snapshot*. This package turns snapshots-over-time into **durable, versioned, revisable hypotheses**, runs the **lifecycle** (auto-advance the cheap early phases; gate the expensive promotions behind a human), and gives the guide a legible console. It is the seam where "the system proposes, the human disposes."

---

## 2. Scope Fence *(hard)*

### In scope
- **Domain package** `@gt100k/hypothesis-store` (`passion/packages/hypothesis-store`):
  - the `InterestHypothesis` record (versioned, with `history`), the `Lifecycle` states + transition rules;
  - `applyInterestRead(store, kidId, read, now)` — create/update hypotheses from an 011 read; **auto-advance** `EXPLORING↔EMERGING` from evidence; never auto-promote to `CANDIDATE`/`ACTIVE`;
  - the **graduation gate** `evaluateGate(hypothesis, returnTimeline, now)` — deterministic checks (return survived a `≥GAP_DAYS` quiet gap; sustained across `≥MIN_REVIEW_CYCLES`; a perseverance-artifact reference present) → a `GateStatus` (which checks pass / still-needed);
  - **human-owned transitions** `promote / park / reopen / contest`, each requiring a named human actor (reject `MODEL`/`SYSTEM`) and, for `promote` past the gate, a passed gate + an explicit `autonomySignOff`;
  - the pure **`consoleViewModel(store, kidId)`** → exactly what the UI renders (separated supporting/disconfirming evidence, coverage gaps, next distinguishing probe, calibrated uncertainty, lifecycle, allowed actions).
- **App** `apps/guide-console` (Next 14 / React 18): renders the view-model for a synthetic kid; guide actions call the store; implements **`window.__qa`**; WCAG 2.2 AA; reduced-motion; **not a game** — a calm, legible data console.
- Seed synthetic fixtures; tests mirroring every FR/SC (domain golden + app render/smoke).

### Out of scope
- **Belief computation** (011) and **signal derivation** (012) — consumed, not rebuilt.
- **The specialization pipeline** (Planner, etc.).
- **Persistence/DB** — the store is an in-memory value + pure transitions (a repository port may be added later).
- **Real auth** — the "human actor" is a synthetic `{ id, role }`; real identity/authz is a platform concern.

---

## 3. Domain model *(decisions already made — do not re-open)*

### 3.1 Lifecycle
`EXPLORING → EMERGING → CANDIDATE → ACTIVE`, plus `PARKED`, `CONTESTED`, `REOPENED`. Rules:
- **Auto (system), from `applyInterestRead`:** `EXPLORING → EMERGING` when the cell is `confident` (011). `EMERGING → EXPLORING` is **not** auto (missingness ≠ disinterest — never demote on silence); `EMERGING → CONTESTED` when new disconfirming evidence drops `lowerBound` below `SPIKE_THRESHOLD` after having been above.
- **Human-only:** `EMERGING → CANDIDATE` (requires a passed gate + `autonomySignOff`); `CANDIDATE → ACTIVE` (human); any `→ PARKED` (human, cost-free, reversible); `PARKED → REOPENED → EMERGING` (human). Every human transition records the actor + reason in `history`.
- **Never:** auto-promotion to `CANDIDATE`/`ACTIVE`; deletion (park, don't delete).

### 3.2 InterestHypothesis
```
InterestHypothesis {
  id: string; kidId: string; cellKey: string; domainPath: DomainPath; mode: string;
  state: Lifecycle; version: number;
  evidence: {                         // last snapshot from 011 (never a scalar score)
    mean: number; lowerBound: number; confident: boolean;
    attribution: Attribution | null; supporting: readonly string[]; disconfirming: readonly string[];
  };
  history: readonly HistoryEntry[];   // { at, from, to, actor, reason }
  createdAt: string; updatedAt: string;
}
HumanActor { id: string; role: string }   // role !== "MODEL"/"SYSTEM"
```

### 3.3 The graduation gate (Phase 2→3) — deterministic checks + human sign-off
`evaluateGate(hyp, returnTimeline, now)` where `returnTimeline` = the cell's voluntary-return timestamps (from 012's CellEvents, voluntary + non-novel). Deterministic checks:
1. **Gap-survival:** ≥1 voluntary return AFTER a `≥GAP_DAYS` gap with no returns (proves return after support/novelty lifted).
2. **Durability:** returns span `≥MIN_TERM_DAYS` with `≥MIN_REVIEW_CYCLES` distinct return occasions.
3. **Perseverance artifact:** `hyp` carries a `perseveranceArtifactRef` (an opaque reference — e.g. a socratic-defense EvidenceRecord or project artifact showing iteration past a failure; structural, not tightly coupled).
Returns `GateStatus { gapSurvived, durable, hasArtifact, passed: all three }`. **Promotion also requires a human `autonomySignOff`** (harmonious-not-pressured — invisible to logs, so a human asserts it); `promote()` throws unless `gate.passed && autonomySignOff && actor is human`.

### 3.4 Constants (golden)
| Name | Value | Meaning |
|---|---|---|
| `GAP_DAYS` | `14` | quiet-gap length the return must survive |
| `MIN_TERM_DAYS` | `56` | ~8-week term the durability must span |
| `MIN_REVIEW_CYCLES` | `2` | distinct return occasions required |
| `SPIKE_THRESHOLD` | `0.6` | reused from 011 (contest below it after being above) |

### 3.5 Console view-model (pure)
`consoleViewModel(store, kidId)` → ranked `HypothesisCard[]` (by `lowerBound` desc), each with: `cellKey`, `domainPath`, `mode`, `state`, **`supporting` and `disconfirming` shown separately (never summed)**, `attribution`, `lowerBound` + uncertainty, `coverageGaps` (domains/modes not yet sampled — from the read), the `nextProbe` hint (the smallest distinguishing next test), `gate` status, and `allowedActions` (the human transitions currently legal). Language is *"current evidence suggests… / next test is…"*, never "you are an X".

---

## 4. Phasing (P0…P6)
- **P0** — lifecycle types + transition-legality table + constants. Unit tests.
- **P1** — `InterestHypothesis` + `applyInterestRead` (create + auto EXPLORING↔EMERGING + CONTESTED). Golden.
- **P2** — the gate `evaluateGate` (gap-survival, durability, artifact). Golden temporal fixtures. *(Core.)*
- **P3** — human transitions (`promote`/`park`/`reopen`/`contest`) with human-authority + sign-off enforcement + history. Golden.
- **P4** — `consoleViewModel` (separated evidence, gaps, next probe, allowed actions). Golden.
- **P5** — `apps/guide-console` scaffold + a seeded page rendering the view-model + `window.__qa` + a green smoke/render test from iteration 1.
- **P6** — console interactions (promote/park/reopen buttons → store → re-render), calm/legible styling, a11y, reduced-motion, empty/first-run states.

## 5. Success Criteria *(each maps to a test)*
- **SC-1** transition legality: only the §3.1 transitions are allowed; auto-promotion to CANDIDATE/ACTIVE is rejected; no demote-on-silence — unit test.
- **SC-2** `applyInterestRead` creates a hypothesis per candidate, auto-advances EXPLORING→EMERGING when `confident`, sets CONTESTED when `lowerBound` falls below threshold after being above, bumps `version`, appends `history` — golden test.
- **SC-3** `evaluateGate`: a timeline with a return after a ≥14-day gap + ≥2 occasions over ≥56 days + artifact → `passed:true`; each missing condition flips exactly its flag — golden temporal test.
- **SC-4** `promote` throws without (a) a passed gate, (b) `autonomySignOff`, or (c) a human actor (role MODEL/SYSTEM rejected); succeeds with all three and records history — unit test.
- **SC-5** `park` is always allowed (reversible, no gate), `reopen` returns to EMERGING; neither deletes — unit test.
- **SC-6** `consoleViewModel` returns cards ranked by `lowerBound`, supporting/disconfirming **separate**, coverage gaps + next probe + allowed actions present, never a scalar score — golden test.
- **SC-7 (app)** the guide-console renders the seeded kid's cards, a promote/park button drives the store and the DOM + `window.__qa.state()` both change; `window.__qa.ready === true`, `error === null` — component/render test + the `LOOP_QA` usability gate.
- **SC-8** gate green: `pnpm exec tsc -b` + `pnpm test` (domain) and the app builds (`next build`) + `LOOP_QA` usability pass (app).
- **manual:** console tone/legibility/a11y — operator-reviewed on the PR.

## 6. Golden Values *(exact)*
The golden fixtures — inline in the tests or consolidated in `src/__fixtures__/` (either is fine) — provide: (a) a synthetic 011 `InterestRead` (one confident candidate + one thin cell) → after `applyInterestRead`, the **confident candidate auto-advances to `EMERGING`** and the thin one stays `EXPLORING` (note: auto-advance runs on the *creation* path too, not only on updates); (b) a return-timeline fixture that passes the gate (returns at day 0, day 20 [>14 gap], day 60 [>56 term, 3rd occasion] + artifact) and variants that flip each flag; (c) the resulting `consoleViewModel` cards (ordered, evidence separated). Assert these exactly.

## 7. Decisions Already Made
- **[D1]** Lifecycle per §3.1; auto only for the cheap early phases; **all promotions past EMERGING are human-owned**.
- **[D2]** Gate = deterministic (gap-survival + durability + artifact) **AND** a human `autonomySignOff`; `promote()` enforces all + human actor.
- **[D3]** Never delete (park/reopen); never demote on silence (missingness ≠ disinterest).
- **[D4]** Output is separated evidence + reasons + a revisable hypothesis; **never a scalar passion score or fixed label**.
- **[D5]** Guide console is a Next app implementing `window.__qa`; **not a game**; WCAG 2.2 AA + reduced-motion.
- **[D6]** `perseveranceArtifactRef` is a structural opaque reference (decoupled from 010's exact type).
- **[D7]** Imports `@gt100k/interest-inference` by name → `pnpm install` (not frozen). SYNTHETIC ONLY.
- **[D8]** Pinned stack: TS / vitest; Next 14 / React 18 / motion@12 for the app (mirrors `apps/evidence-explorer`).

## 8. Defaults for the Unspecified
Choose the simplest correct option, record it in `.loop/decisions.md`, continue. Escalate `critical` only if a choice would invalidate an SC.

## 9. Loop notes
- **Domain package:** headless, `LOOP_QA` N/A, gate = tsc -b + test.
- **App:** enable **`LOOP_QA=1`** with `LOOP_QA_CMD="pnpm --filter @gt100k/guide-console start"` (after `next build`) and a `LOOP_QA_PORT`; the app implements the `window.__qa` contract (`ready`, `error`, `state()` = `{ selectedId, count, states }`, `primaryAction()` = promote the top gate-passed candidate) so the usability gate can verify it's live and the primary action is not dead. It is a DOM console (no canvas), so `state()` + DOM diffing is the operable surface.
- **Requires `pnpm install`** (not `--frozen`) — imports `@gt100k/interest-inference` by name.
- In-lane: new files under `passion/packages/hypothesis-store` + `passion/apps/guide-console` + appended root `tsconfig.json` references. Parallel-safe with 012 (disjoint files).

## 10. Stack + Commands (pinned)
- Domain `passion/packages/hypothesis-store` (`@gt100k/hypothesis-store`), dep `@gt100k/interest-inference`. App `passion/apps/guide-console` (`@gt100k/guide-console`): Next 14, React 18, motion@12; `next.config.mjs` `transpilePackages` the workspace deps (mirror `evidence-explorer`).
- Gate: `pnpm exec tsc -b` + `pnpm test`; app `next build` + `LOOP_QA` usability pass.
- Commit a git-ignored `.env.local.example` if any env is needed (none expected).
