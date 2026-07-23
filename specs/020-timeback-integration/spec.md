# Feature Specification: TimeBack Integration (real priors, never a gate)

**Feature Branch**: `020-timeback-integration`
**Created**: 2026-07-23
**Status**: Draft (loop-ready)

**Input**: G2 in `docs/prd/passionApps.md` (TimeBack Integration) — connect the academics platform (TimeBack) to the discovery signal by turning what school already knows about a kid into a **soft starting hint** for our interest inference: an **aptitude tilt** (how strong the kid is per subject) + a **discretionary-XP tilt** (where they voluntarily spend free-choice time). These become the `DomainPrior[]` the 011 inference engine already consumes (`buildPrior`), and they **only shift the starting point — they never gate** (011's `evidenceMass` subtracts the prior, so a prior can never make a hypothesis `confident` or a candidate on its own). Also encode the **two-block daily loop** as a light one-way handoff (school → passion hint; blocks independent; passion block reward-neutral). Grounding: `docs/research/passionBrainlift.md` (aptitude/ability as necessary-not-sufficient; SMPY; environment/opportunity priors; intrinsic-motivation protection — never gate/reward on the prior), `docs/prd/passionApps.md` (G2: "aptitude tilt + discretionary-XP prior … prior only, never gate"), `passion/CONTEXT.md`, and the existing `@gt100k/interest-inference` prior interface.

> **Loop-ready note.** Two parts: (A) a headless **domain package** `@gt100k/timeback` — a pure `toDomainPriors` mapper over a hand-authored subject→cabin **crosswalk**, a light `buildDailyHandoff`, a `withPriors` profile hook, and a **deterministic fake data source** (synthetic snapshots; there is **no real API yet**) — on the `pnpm exec tsc -b` + `pnpm test` gate, **no network**; (B) a **real adapter** package `@gt100k/timeback-live` — a `TimeBackClient` scaffolded against a **documented assumed API shape** (OpenAI-style `fetch`; `TIMEBACK_BASE_URL` + `TIMEBACK_API_KEY`), parsing an API payload → the same `TimeBackSnapshot` — **opt-in only (`timeback:live`), never in the gate, never imported by a test**, ready to flip on when the real API exists. **SYNTHETIC ONLY.** Imports `@gt100k/{interest-inference,two-axis-tagging,student-profile}` by name → **`pnpm install` (not `--frozen`)**. **Parallel-safe with the in-flight 018 (planner) + 019 (family):** brand-new files under `passion/packages/timeback` + `passion/adapters/timeback-live` + a root `tsconfig.json` append; **it never touches `apps/guide-console`, `packages/student-profile`, or any 018/019 file** (the `withPriors` hook lives in `@gt100k/timeback`, not in `student-profile`), so the lanes are fully disjoint.

---

## 1. Why & where it sits
Ability is necessary-but-not-sufficient and it keeps mattering (the megamodel, SMPY), and opportunity/environment shape which interests a child can even encounter. TimeBack already measures both cheaply: subject **mastery** (an aptitude proxy) and **discretionary XP** (a voluntary-choice proxy). Today every kid's `StudentProfile.priors` is synthetic; G2 makes them real. The design rule is absolute: a prior is a **starting hint, never a verdict**. The 011 engine already enforces this in two exact ways: (1) `buildPrior` adds the tilt to `alphaPrior` only, and `evidenceMass = alpha − alphaPrior + beta − betaPrior` **excludes the prior from evidence mass** — so a prior can never supply the `≥ MIN_EVIDENCE_MASS` of *behavioral* evidence a `confident`/candidate cell requires; and (2) `foldEvents` only creates a cell from an **event**, so a domain with a prior but **no behavioral events produces no cell and no candidate at all**. (A prior *does* legitimately shift `mean`/`sd`/`lowerBound` for cells that already have evidence — that is the intended Bayesian starting point, not a gate.) G2's whole job is to *produce good `DomainPrior[]`* and prove this no-gate guarantee end-to-end. It closes the "real priors (G2)" glue called out by the 014 wiring note, and connects academics to the passion signal without ever letting grades drive an interest.

## 2. Scope Fence *(hard)*

### In scope
- **Domain package** `@gt100k/timeback` (`passion/packages/timeback`):
  - the raw-signal types `SubjectSignal` + `TimeBackSnapshot` (§3.2);
  - the hand-authored **crosswalk** `SUBJECT_CABIN_CROSSWALK` (subject → `{ cabin, weight }[]`, **data**, easy to extend) (§3.3);
  - the pure mapper **`toDomainPriors(snapshot)`** → `readonly DomainPrior[]` (aptitude tilt, discretionary tilt, inEnvironment per cabin), **graceful** on unknown subjects / uncontributed cabins (§3.4);
  - an optional pure **`explainPriors(snapshot)`** → per-cabin contributing subjects (provenance / transparency; no UI);
  - the light **`buildDailyHandoff(snapshot, date)`** → `DailyHandoff` encoding the one-way school→passion hint + the block-independence + reward-neutral invariants (§3.5);
  - the profile hook **`withPriors(profile, priors)`** (immutable; sets `StudentProfile.priors`; **does not** change `runCycle`);
  - a **deterministic fake data source**: `syntheticSnapshot(...)` + `PILOT_TIMEBACK` fixtures for the pilot kids (there is no real API yet).
- **Adapter package** `@gt100k/timeback-live` (`passion/adapters/timeback-live`): a `TimeBackClient` (native `fetch`, `TIMEBACK_BASE_URL`, `TIMEBACK_API_KEY`) with `fetchSnapshot(kidId): Promise<TimeBackSnapshot>` that parses a **documented assumed API payload** → `TimeBackSnapshot`, **fails safe** (throws/parse-failure → the caller falls back to a fake/empty snapshot). Opt-in `timeback:live` script; **never imported by a test** (hermetic parse tests over fixture payloads).
- Synthetic fixtures (a crosswalk golden snapshot + the pilot snapshots + a malformed-payload fixture) + tests mirroring every FR/SC.

### Out of scope
- **Any real TimeBack API contract we don't have** — the live adapter is a scaffold against a *documented assumed* shape; the exact fields get pinned when the API exists. **No real credentials, no network in CI.**
- **A full daily-loop scheduler** — G2 defines the boundary + one-way handoff + invariants, not block timings/sequencing (that is a runtime/product concern we don't own).
- **Changing the inference math** — `buildPrior` / `W_ENV` / `W_APT` / `W_XP` / `evidenceMass` are 011's, reused verbatim; G2 never redefines them.
- **Gating, grading, or rewarding on the prior** — permanently banned; a prior only shifts the starting point, never decides an interest, never touches grades, and no points cross between blocks.
- **A UI** — G2 is plumbing; the priors + provenance are data on the profile (a surface is later, if ever).
- **Consent/erasure of TimeBack data** (G3) — a pre-live gate owned separately.

## 3. Domain model *(decisions already made — do not re-open)*

### 3.1 The prior it produces (011's type, reused verbatim)
`DomainPrior { domain: string; inEnvironment: boolean; aptitudeTilt: number /*[0,1]*/; discretionaryTilt: number /*[0,1]*/ }` — `domain` is a **cabin id** (`foldEvents` keys priors by `domainPath[0]`). `buildPrior` (011) turns it into `alphaPrior = ALPHA0 + (inEnvironment ? W_ENV : 0) + W_APT·aptitudeTilt + W_XP·discretionaryTilt`, `betaPrior = BETA0`. **Reuse the type + `buildPrior`; never redefine.**

### 3.2 Raw signal types
```
Subject = string   // e.g. "math","reading","writing","science","music","art","coding","social-studies"
SubjectSignal {
  subject: Subject;
  mastery: number;           // [0,1] aptitude proxy (subject performance/mastery)
  discretionaryXp: number;   // >= 0 raw free-choice XP spent on this subject
  offered: boolean;          // is this subject present in the kid's TimeBack environment?
}
TimeBackSnapshot { kidId: string; asOf: string /*ISO-8601*/; subjects: readonly SubjectSignal[] }
```

### 3.3 The crosswalk (hand-authored data; extensible + graceful)
`SUBJECT_CABIN_CROSSWALK: Record<Subject, readonly { cabin: CabinId; weight: number }[]>` — a small, editable table. Indicative seed (weights in `[0,1]`, tune freely):
| Subject | Cabins (weight) |
|---|---|
| `math` | math-puzzles (1.0), code-computers (0.5), games-strategy (0.5) |
| `science` | science-nature (1.0), making-engineering (0.5) |
| `reading` | influence-media (0.6) |
| `writing` | influence-media (1.0) |
| `coding` | code-computers (1.0), math-puzzles (0.3) |
| `music` | music-sound (1.0) |
| `art` | art-motion (1.0) |
| `social-studies` | influence-media (0.5) |
- **Graceful by construction:** a `subject` **absent** from the table contributes nothing; a `cabin` with **no contributing offered subject** yields **no `DomainPrior`** (the engine then uses its default blank prior). New cabins/subtopics need no code change — just add rows. **Never throw on an unknown subject/cabin.**

### 3.4 The mapper `toDomainPriors(snapshot)` (pure, deterministic)
For each `CabinId` that has ≥1 contributing **offered** subject:
- `inEnvironment = true` (some contributing subject is offered);
- `aptitudeTilt = clamp01( Σ_subject weight·mastery / Σ_subject weight )` over the cabin's *offered* contributing subjects (weighted mean of mastery);
- `discretionaryTilt = clamp01( Σ_subject weight·xpShare(subject) )`, where `xpShare(subject) = discretionaryXp(subject) / totalDiscretionaryXp` (share of the kid's total free-choice XP; `0` if the kid has no discretionary XP).
Cabins with no contributing offered subject are **omitted**. Output is sorted by cabin id (deterministic). `clamp01` (011) guards `[0,1]`; a `NaN`/negative input never poisons a tilt.

### 3.5 The daily handoff `buildDailyHandoff(snapshot, date)` (the light two-block loop)
```
DailyHandoff {
  kidId; date;
  priors: readonly DomainPrior[];   // the ONE-WAY school→passion hint (from toDomainPriors)
  passionBlockRewardNeutral: true;  // reward-neutral by construction (protects intrinsic motivation)
  blocksIndependent: true;          // school never gates passion; passion never touches grades
}
```
The handoff is **one-way** (school signal → passion hint) and carries **no reward/points/grade field** and **no back-channel** from passion to academics. These are invariants asserted by tests, not runtime config.

### 3.6 The profile hook `withPriors(profile, priors)` (immutable)
Returns a new `StudentProfile` with `priors` replaced (bump `updatedAt` to the snapshot's `asOf`). It **does not** touch the interaction log, the store, or `runCycle`; the next `runCycle` simply folds the new priors via `foldEvents`. Lives in `@gt100k/timeback` (imports the `StudentProfile` type), so `packages/student-profile` is never edited.

### 3.7 Constants (golden)
| Name | Value | Meaning |
|---|---|---|
| `SUBJECT_CABIN_CROSSWALK` | table §3.3 | the hand-authored translation (the golden data) |
| (reused from 011) `W_ENV`/`W_APT`/`W_XP` | `0.5`/`0.5`/`0.5` | 011's prior weights — **not** redefined here |
`toDomainPriors` introduces **no new tuning constants** beyond the crosswalk weights; all prior weighting stays in 011.

## 4. Phasing (P0…P6)
- **P0** — scaffold `@gt100k/timeback`; raw types; smoke test.
- **P1** — the `SUBJECT_CABIN_CROSSWALK` table + `explainPriors`. Unit (graceful on unknown subject).
- **P2** — `toDomainPriors` mapper (aptitude + discretionary + inEnvironment; omit uncontributed cabins). *(Core.)* Golden.
- **P3** — the **no-gate proof** (standing test via `runInference`): (a) **empty events + any priors → an empty read** (no cells, no candidates); (b) **`evidenceMass` is identical with vs without priors**, per cell, on an event-bearing fixture (the prior never adds evidence); (c) a domain that has a prior but **no events** never appears as a cell/candidate.
- **P4** — `buildDailyHandoff` + invariants (one-way; reward-neutral; no reward/grade field) + `withPriors` (immutable; `runCycle` unchanged still works).
- **P5** — the deterministic fake data source (`syntheticSnapshot` + `PILOT_TIMEBACK`) → stable priors for the pilot kids.
- **P6** — adapter `@gt100k/timeback-live` (`TimeBackClient` + parse over a documented assumed payload; fail-safe) + hermetic parse tests + an opt-in `timeback:live` script.

## 5. Success Criteria *(each maps to a test)*
- **SC-1** crosswalk mapping: a golden `TimeBackSnapshot` → the exact `DomainPrior[]` (per-cabin `aptitudeTilt`, `discretionaryTilt`, `inEnvironment`) — golden test.
- **SC-2** graceful + extensible: an unknown subject contributes nothing (no throw); a cabin with no contributing offered subject yields **no** prior; adding a crosswalk row for a new cabin needs no other code change — test.
- **SC-3** never gates (the core guarantee): via `runInference` — (a) **empty events + any priors → an empty read** (no cells, no candidates); (b) **`evidenceMass` per cell is identical with vs without** the priors on an event-bearing fixture (the prior is excluded from evidence mass, so it can never supply the `≥ MIN_EVIDENCE_MASS` a candidate needs); (c) a domain with a prior but **no events** never becomes a cell/candidate. (Priors *may* shift `mean`/`sd`/`lowerBound` for already-evidenced cells — that is intended, not a gate.) — standing test.
- **SC-4** normalization + fail-safe: every `aptitudeTilt`/`discretionaryTilt` ∈ `[0,1]`; discretionary is a share of the kid's total XP; a `NaN`/negative/absent field never produces an out-of-range tilt — test.
- **SC-5** daily handoff invariants: `buildDailyHandoff` is one-way (priors = `toDomainPriors(snapshot)`), `passionBlockRewardNeutral === true`, `blocksIndependent === true`, and the `DailyHandoff` type carries **no** reward/points/grade field (type-level + shape) — test.
- **SC-6** profile hook: `withPriors` sets priors immutably (original unchanged; `updatedAt` bumped); a subsequent `runCycle` runs unchanged and its confident/candidate outcomes match the no-prior run (SC-3) — test.
- **SC-7** fake data: `PILOT_TIMEBACK`/`syntheticSnapshot` are deterministic → stable `DomainPrior[]` for the pilot kids — golden test.
- **SC-8 (adapter)** parse + fail-safe: a fixture assumed-API payload → a valid `TimeBackSnapshot`; a malformed payload → a safe fallback (never a throw that escapes); the adapter is **never imported by a domain test** — hermetic parse test.
- **SC-9** gate green: `pnpm exec tsc -b` + `pnpm test` (domain + adapter parse) pass.
- **live (opt-in, not CI):** `timeback:live` fetches + maps a real snapshot once the API exists — manual/operator.

## 6. Golden Values *(exact)*
Fixtures in `src/__fixtures__/`: (a) a **golden snapshot** (a handful of `SubjectSignal`s spanning math/science/writing/music with mixed mastery + XP + one `offered:false`) → its exact `DomainPrior[]` (assert `aptitudeTilt`/`discretionaryTilt` to a fixed precision + `inEnvironment` + the omitted cabins); (b) an **unknown-subject** + **no-contribution** case (→ ignored / omitted, no throw); (c) a **prior-only vs event-bearing** pair proving SC-3 (empty-events+priors → empty read; and equal per-cell `evidenceMass` with/without priors on the event-bearing case); (d) the **pilot snapshots** `PILOT_TIMEBACK`; (e) an **assumed-API payload** + a **malformed payload** for the adapter. Assert tilts numerically (hand-verified from §3.4), the omitted-cabin set, and the no-gate equality exactly.

## 7. Decisions Already Made
- **[D1]** The prior is 011's `DomainPrior` (cabin-keyed); reuse `buildPrior` + the weights; **never redefine the inference math**.
- **[D2]** Two independent tilts — **aptitude** (subject mastery) + **discretionary** (free-choice XP share) — filled separately; 011 combines them.
- **[D3]** **Prior only, never a gate** — a prior shifts the starting point but is **excluded from `evidenceMass`**, so it can never supply the `≥ MIN_EVIDENCE_MASS` of behavioral evidence a candidate needs, and a domain with no events never becomes a cell/candidate; proven by a standing test.
- **[D4]** Subject→cabin is a **hand-authored crosswalk table (data)** — auditable, extensible, and **graceful** (unknown subject / uncontributed cabin → no prior, never a throw).
- **[D5]** The two-block loop is a **light one-way handoff** — school → passion hint; blocks independent; passion block **reward-neutral**; **no full scheduler**; no points/grades cross over.
- **[D6]** **No real API yet** — ship a deterministic **fake data source** + a **documented, opt-in live adapter scaffold** (never in the gate, never imported by a test), flippable when the API lands.
- **[D7]** **No student-profile edits** — the `withPriors` hook lives in `@gt100k/timeback`; `runCycle` is unchanged (so it's disjoint from 018/019).
- **[D8]** SYNTHETIC ONLY; `TIMEBACK_API_KEY` only in the live adapter/script; no gating/grading/rewarding on the prior, ever.

## 8. Defaults for the Unspecified
Simplest correct option; record in `.loop/decisions.md`; continue. Escalate `critical` only if a choice would invalidate an SC — especially SC-3 (never gates), SC-4 (range/fail-safe), and SC-5 (handoff invariants).

## 9. Loop notes
- **Domain + adapter packages:** headless; gate = `tsc -b` + `test`; the live adapter is opt-in and **never imported by a test** (hermetic parse tests over fixture payloads, like `tagger-tfy`/`concierge-live`).
- **Requires `pnpm install`** (not `--frozen`) — the domain package imports `@gt100k/{interest-inference,two-axis-tagging,student-profile}`; the adapter deps `@gt100k/timeback` + native `fetch`.
- **Parallel-safe with 018 + 019:** brand-new files under `passion/packages/timeback` + `passion/adapters/timeback-live` + a root `tsconfig.json` append; **never touches `apps/guide-console`, `packages/student-profile`, or any 018/019 file**. Branch from current `main`.
- **No network in the gate** (fake data source only); the live adapter uses `fetch` and is opt-in.

## 10. Stack + Commands (pinned)
- Domain `passion/packages/timeback` (`@gt100k/timeback`), deps `@gt100k/interest-inference`, `@gt100k/two-axis-tagging`, `@gt100k/student-profile`. Adapter `passion/adapters/timeback-live` (`@gt100k/timeback-live`), dep `@gt100k/timeback` (+ native `fetch`; `TIMEBACK_BASE_URL`, `TIMEBACK_API_KEY`).
- Gate: `pnpm exec tsc -b` + `pnpm test`.
- TS strict (`noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `composite`); vitest; no network in the gate (fake data only); the live adapter uses `fetch` and is opt-in.
