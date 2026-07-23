# Feature Specification: Specialization Planner (the ascent engine)

**Feature Branch**: `018-specialization-planner`
**Created**: 2026-07-23
**Status**: Draft (loop-ready)

**Input**: D1 in `docs/prd/passionApps.md` (Specialization Planner). Once discovery certifies a spike (an **ACTIVE** interest hypothesis from the 013 gate), this is the *ascent* engine: it lays out the child's multi-year climb as a **staged sequence of authentic (Renzulli Type III) projects with embedded, bounded deliberate practice**, advances stages on **readiness not age**, doses practice **small and late**, enforces **rest**, keeps the child owning the problem (**scaffolded autonomy**), and **replans** against the 016 wellbeing read (back-off / rest / deload). It never grades and never acts on the child — **the system proposes a plan; the human (guide) disposes**. Grounding: `docs/research/passion-pipeline/03-talent-development-spine.md` (§6 the Staged Specialization Blueprint — the four stages, the mentor relay, the DP-dosing rules, the staged PCDE curriculum, the guardrails), `SPECIALIZATION-PIPELINE-PRD.md` (planner + push/back-off playbook), `passion/CONTEXT.md`.

> **Loop-ready note.** Three parts: (A) a headless **domain package** `@gt100k/specialization-planner` (a pure `planSpecialization` engine + a `derivePlanInputs` deriver over the 014 profile / 013 store / 016 wellbeing read, plus a typed **`ProjectBriefGenerator` port** with a **deterministic stub**) on the `pnpm exec tsc -b` + `pnpm test` gate — **no network**; (B) a **real adapter** package `@gt100k/planner-live` — a TFY-backed `ProjectBriefGenerator` (OpenAI-compatible `fetch`, low-cost model, mirrors `tagger-tfy`/`tutor-tfy`/`concierge-live`) — **opt-in only (`planner:live`), never in the gate, never imported by a test**; (C) a **"Plan" panel added to `apps/guide-console`** that renders the staged plan for the selected child's certified spikes, defaulting to the **stub** brief so `next build` + the **`LOOP_QA`** usability gate stay deterministic and offline (real TFY briefs behind a `PLANNER_LIVE=1` server route). It must **preserve the existing `window.__qa` / `LOOP_QA`** contract (extend, never break). **SYNTHETIC ONLY.** Imports `@gt100k/{student-profile,hypothesis-store,wellbeing,interest-inference,two-axis-tagging}` by name → **`pnpm install` (not `--frozen`)**. **Parallel-safe with 015 (concierge):** disjoint files (new package + new adapter + guide-console, which 015 never touches); only the root `tsconfig.json` append overlaps (trivial merge).

---

## 1. Why & where it sits
Discovery ends when a spike is **certified** (an `ACTIVE` hypothesis in 013). What comes next is the hard, decade-scale part: turning a genuine interest into a **world-class trajectory** without killing the fuel. The evidence is emphatic and counter-intuitive — the heavy "investment years" are adolescent (~16+), childhood is for **sampling + play**, deliberate practice is *a scalpel not the engine* (and un-fun, so it must be small/chosen/project-embedded), progression is measured by **widening the audience** (self → mentor → community → field) not by adding hours, the mentor is a **relay** (warm → technical → expert → master) whose scarcest act is *access transfer*, and the child's **rage to master** is the non-manufacturable fuel that adult pressure reliably extinguishes. So this planner's first duty is *negative*: don't over-load, don't gamify, don't take away ownership. It consumes 013 (the certified spike), 014 (the interaction log / readiness signals), and 016 (the wellbeing read for deload/rest), and it produces a **guide-facing plan** — the current stage, the next authentic project (with its craft scaffold + bounded DP), the mentor role, the audience level, the rest cadence, and the stage's psychosocial focus. The honest terminal artifact by ~14 is a **"ready-to-invest" performer** (signature body of work + Evidence Graph + defensible portfolio), **not** an expert (eminence is adult).

## 2. Scope Fence *(hard)*

### In scope
- **Domain package** `@gt100k/specialization-planner` (`passion/packages/specialization-planner`):
  - the types `Stage`, `MentorRole`, `AudienceLevel`, `ProjectCadence`, `RestCadence`, `Pcde`, `ProjectBrief`, `PlanInputs`, `SpecializationPlan` (§3.2);
  - the pure **stage detector** `deriveStage(inputs)` → `Stage` (S1…S4), **gated on readiness evidence, never age** (§3.3);
  - the pure **plan engine** `planSpecialization(inputs, deps, now)` → `SpecializationPlan` — the staged blueprint (mentor role, audience level, DP dose, project cadence, rest cadence, PCDE focus, the next `ProjectBrief` via the generator port) **with the 016 wellbeing read folded in as a replan** (deload / rest / autonomy-up), and **every guardrail invariant baked in** (§3.5);
  - the **deriver** `derivePlanInputs(profile, store, cellKey, wellbeing, now, catalog)` → `PlanInputs` from the **014 profile** (interaction log: months-in-pursuit, voluntary-return sustain, depth/craft-floor accumulation, stretch-seeking, producer-identity proxy) + **013 store** (the hypothesis state) + a **016 `WellbeingRead`** (§3.6);
  - the typed **`ProjectBriefGenerator` port** + a **deterministic stub** (`stubBriefGenerator`) that builds a valid Type III brief from the domain × mode × stage × audience × craft-scaffold, **no network** (§3.4).
- **Adapter package** `@gt100k/planner-live` (`passion/adapters/planner-live`): a TFY-backed `ProjectBriefGenerator` (OpenAI-compatible `fetch`, `TFY_API_KEY`, default `gpt-5.4-mini`, `TFY_PLANNER_MODEL` override) that generates a grounded Type III brief and **coerces the result back into the schema** (validate → fall back to the stub on any malformed field). Opt-in `planner:live` script; **never imported by a test** (parse-only hermetic tests + fixtures, like `tagger-tfy`).
- **App** `apps/guide-console`: a **"Plan" panel** per child that, for each **certified** spike (`ACTIVE`, plus any `CANDIDATE`), renders the `SpecializationPlan` — the stage + "what this stage is for", the mentor role, the audience level, the next project (driving question, authentic method, craft scaffold, who it's for), the practice dose + rest cadence, the PCDE focus, and any **"needs your review"** replan (rest/back-off/stage-advance the guide must approve). Default brief = **stub** (deterministic, offline); a `PLANNER_LIVE=1` **server route** (`app/api/plan-brief`) regenerates a brief via `@gt100k/planner-live`. **Preserve `window.__qa`/`LOOP_QA`** (extend `state()` additively; keep the existing `primaryAction`).
- Synthetic fixtures (one `PlanInputs` per stage + the guardrail/replan cases) + tests mirroring every FR/SC (domain golden + adapter parse test + app smoke).

### Out of scope
- **Grading / assessment of the work** — the planner sets *what to do next*; the Evidence Graph (E1) grades the *process*, and a human owns any grade of record. No score here.
- **The wellbeing decision itself** (016) — this engine *consumes* a `WellbeingRead`; it does not re-derive the push/back-off decision.
- **Any auto-applied plan / task assignment to the child** — the output is a guide-facing recommendation; the human disposes, and the child always owns problem/method/pace.
- **Real mentor-matching / relay handoff logistics** (D3 Mentor Relay) — the plan *names the mentor role* for the stage; brokering the actual next mentor is a separate artifact.
- **Real curated-library / RAG grounding of the brief** (A6/B2 = 015, in-flight) — the generator may *optionally* accept curated `resources` as an input, but the default (stub) path takes none and has **no dependency on 015**.
- **The kid-facing project workspace** (D2) — where the child actually does the project; this planner only produces the brief + scaffold.
- **Gamification of any kind** — no streaks/points/prizes/leaderboards/rankings anywhere (a tested invariant).
- **Age-based advancement** — stages advance on evidence of readiness only; the engine takes no birthday.

## 3. Domain model *(decisions already made — do not re-open)*

### 3.1 The four-stage spine (research §6.1)
| Stage | "What it's for" | Mentor role (the relay) | Audience | Project cadence | DP dose (fraction) | Lead PCDEs |
|---|---|---|---|---|---|---|
| **S1 IGNITION** | fall in love; keep coming back | `WARM` (encouraging, relatedness-first) | `SELF` (+ family) | many short (2–4 wk) playful micro-projects | ~0 (deliberate **play**) | enjoyment, relatedness, identity spark, basic self-regulation |
| **S2 FOUNDATIONS** | get precise without killing the fun | `TECHNICAL` (standards, correction, ZPD) | `MENTOR_PEERS` | fewer, term-length (2–3/yr) | small, bounded, rising | goal-setting, quality practice, planning, realistic self-evaluation |
| **S3 AUTHORSHIP** | make it real for a community | `DOMAIN_EXPERT` (insider knowledge, opens doors) | `REAL_COMMUNITY` | 1–2 major Type III / yr | moderate, capped below investment | coping with public feedback, strategic risk, self-advocacy |
| **S4 SIGNATURE** | find your voice; portfolio-defining | `MASTER` (near-peer apprentice; shapes style) | `FIELD` | one flagship + coherent body of work | highest **but still capped** | self-direction, resilience under stakes, networking; learner→producer shift |

The progression variable is **audience + authenticity**, not hours. A fresh `ACTIVE` spike enters at **S1**. Each plural spike runs its **own** copy of this spine in parallel (**no transfer discount** — Sala & Gobet).

### 3.2 Types
```
Stage          = "S1_IGNITION" | "S2_FOUNDATIONS" | "S3_AUTHORSHIP" | "S4_SIGNATURE"
MentorRole     = "WARM" | "TECHNICAL" | "DOMAIN_EXPERT" | "MASTER"
AudienceLevel  = "SELF" | "MENTOR_PEERS" | "REAL_COMMUNITY" | "FIELD"
ProjectCadence = "MANY_SHORT" | "TERM_LENGTH" | "MAJOR_TYPE_III" | "FLAGSHIP"
Pcde           = "enjoyment" | "relatedness" | "identity" | "self_regulation"
               | "goal_setting" | "quality_practice" | "planning" | "self_evaluation"
               | "coping_feedback" | "strategic_risk" | "self_advocacy"
               | "self_direction" | "resilience" | "networking" | "producer_identity"

RestCadence {
  daysOffPerWeek: number;          // AAP: ≥1–2 (golden: 2)
  monthsOffPerYear: number;        // AAP: ~3 months/yr off the primary spike
  offInIncrementsOfMonths: number; // AAP: taken in ~1-month increments
}

ProjectBrief {                     // a bona-fide Renzulli Type III (all four criteria) + a craft floor
  title: string;
  drivingQuestion: string;         // no pre-existing right answer (criterion 3)
  authenticMethod: string;         // real methodology of the field (criterion 2)
  audience: AudienceLevel;         // built to affect a real audience (criterion 4)
  childOwnsChoice: true;           // personalization of interest (criterion 1) — always true (invariant)
  craftScaffold: string;           // the bounded DP / Type I–II skill floor paired with the project
  successLooksLike: string;        // process-based, never a score/reward
  source: "stub" | "llm";          // provenance of the brief
}

PlanInputs {
  kidId; cellKey;
  domainPath: DomainPath; mode: string;       // the (domain × work-mode) cell of the spike
  hypothesisState: string;                     // 013 state (expects ACTIVE / CANDIDATE)
  monthsInPursuit: number;                     // from the first voluntary engagement in the 014 log
  voluntaryReturnsRecent: number;              // sustained voluntary return (readiness, not age)
  depthAccumulation: number;                   // depth-weighted craft-floor proxy (013/012 depth families)
  stretchSeeking: boolean;                     // voluntarily picks harder (depth: chosen_challenge)
  producerIdentity: boolean;                   // ships/shares for others (learner→producer proxy)
  wellbeing: WellbeingRead;                     // 016 — the replan input
  now: string;
}

SpecializationPlan {
  kidId; cellKey; domainPath: DomainPath; mode: string;
  stage: Stage;
  mentorRole: MentorRole;
  audience: AudienceLevel;
  cadence: ProjectCadence;
  dpDose: number;                  // [0,1] fraction, ≤ the stage cap, hard-capped < INVESTMENT_LOAD
  restCadence: RestCadence;        // always present (AAP)
  pcdeFocus: readonly Pcde[];      // the stage's lead psychosocial skills
  nextProject: ProjectBrief;       // always present; always carries a craftScaffold (craft floor)
  replan: {                        // 016 wellbeing folded in — a proposal, never applied
    deload: boolean;               // reduce DP / soften cadence (back-off or over-challenge)
    restWindow: boolean;           // propose a guilt-free, reversible rest (rest/burnout-tip)
    autonomyUp: boolean;           // more choice/voice; decouple worth from outcome
    holdStage: boolean;            // do NOT advance the stage this cycle (strain present)
  };
  escalateToHuman: boolean;        // rest/back-off OR a proposed stage advance — the guide disposes
  escalationReason?: string;
  rationale: string;               // guide-facing, plain language
  guardrailNotes: readonly string[]; // e.g. "trajectory not eminence", "DP capped for age band"
  terminalNote: string;            // honest scope: by ~14 = a ready-to-invest performer, not an expert
}
```
`SpecializationPlan` is **guide-facing only** — there is **no child-facing field, no score, no reward/streak/rank, and no grade**.

### 3.3 Stage detection `deriveStage(inputs)` (readiness, not age — Sosniak/Bloom)
Advance on **evidence of readiness**: sustained **voluntary return** + **craft-floor** accumulation + psychosocial-readiness proxies (`stretchSeeking`, `producerIdentity`). Highest qualifying stage wins; **strain holds the stage** (see §3.5). Deterministic thresholds (golden §3.7):
- **S4_SIGNATURE** — `producerIdentity && stretchSeeking && depthAccumulation ≥ DEPTH_S4 && voluntaryReturnsRecent ≥ RETURN_S4` (and not held).
- **S3_AUTHORSHIP** — `stretchSeeking && depthAccumulation ≥ DEPTH_S3 && voluntaryReturnsRecent ≥ RETURN_S3`.
- **S2_FOUNDATIONS** — `depthAccumulation ≥ DEPTH_S2 && voluntaryReturnsRecent ≥ RETURN_S2`.
- **S1_IGNITION** — otherwise (the entry stage for a fresh `ACTIVE` spike).
`deriveStage` takes **no age input** (structurally impossible to advance on birthday). `monthsInPursuit` is *indicative only* — surfaced in the rationale, never a gate.

### 3.4 The `ProjectBriefGenerator` port + stub
```
ProjectBriefGenerator { generate(ctx: BriefContext): Promise<ProjectBrief> }
BriefContext { domainPath; mode; stage; audience; craftFloorHint: string; resources?: readonly CuratedResource[] }
```
**Stub** (`stubBriefGenerator`, deterministic, in-package): builds a valid Type III `ProjectBrief` by template from `domainPath` (humanized leaf) × `mode` × `stage` × `audience` — a driving question with no right answer, an authentic method, a `craftScaffold` from `craftFloorHint`, a process-based `successLooksLike`, `childOwnsChoice: true`, `source: "stub"`. **No network.** `resources` (015, in-flight) is accepted but ignored by the stub. The engine `await`s the generator; the panel's default render uses the stub so it stays synchronous-deterministic for `LOOP_QA`.

### 3.5 Guardrail invariants (baked in; each a test) — research §6.4 / §6.6
- **DP rises with stage but is always capped** — `dpDose` is non-decreasing S1→S4 (`DP_S1 ≤ DP_S2 ≤ DP_S3 ≤ DP_S4`) and **every** stage's dose is `< INVESTMENT_LOAD` (never investment-year loads before 14).
- **DP always serves a child-owned project** — `nextProject` is always present and always carries a non-empty `craftScaffold`; there is **no drill-only plan** (no free-standing DP regime).
- **Rest is mandatory** — `restCadence` is always present with `daysOffPerWeek ≥ 1` and `monthsOffPerYear ≥ 1` (AAP).
- **No gamification** — the type carries **no** reward/points/streak/rank/score/leaderboard field; the engine never emits one.
- **Scaffolded autonomy** — `nextProject.childOwnsChoice === true` always; the brief is an *offer* (opportunity/structure/access), never an assignment that fixes the child's problem/method/pace.
- **Craft floor** — audience never widens without a paired skill scaffold: for `audience !== "SELF"`, `craftScaffold` is non-empty (no confident shallowness).
- **Plurality is not a discount** — the engine is **per-spike**; it reads only the one cell's inputs (no cross-spike DP borrowing, no shared stage clock).
- **System proposes, human disposes** — any `replan.restWindow || replan.deload` **or** a proposed stage advance sets `escalateToHuman: true`; nothing is applied to the child.
- **Honest scope** — `terminalNote` states the by-14 artifact is a *ready-to-invest performer / trajectory*, not eminence; no output ever claims "expert by 14".
- **Counter-cyclical on strain** — when `wellbeing.rest || wellbeing.backOff`, the plan sets `replan.holdStage`, `replan.deload`, `replan.autonomyUp` and does **not** advance the stage (protect the rage to master).

### 3.6 The deriver `derivePlanInputs(profile, store, cellKey, wellbeing, now, catalog)`
Pure + deterministic. From the **014 `StudentProfile`** interaction log for the cell: `monthsInPursuit` (from the earliest voluntary engagement to `now`), `voluntaryReturnsRecent` (voluntary returns within `RETURN_WINDOW_DAYS`), `depthAccumulation` (depth-weighted count of depth-family events — unprompted revision, chosen challenge, gap survived — as the craft-floor proxy), `stretchSeeking` (any `chosen_challenge` depth event), `producerIdentity` (shares/ships-for-others proxy from the log; else `false`). From the **013 store**: `hypothesisState`. `wellbeing` is passed in (the 016 `WellbeingRead` for the cell). Cells with no voluntary engagement are **not** planned (discovery, not specialization).

### 3.7 Constants (golden)
| Name | Value | Meaning |
|---|---|---|
| `DP_S1` / `DP_S2` / `DP_S3` / `DP_S4` | `0.0` / `0.15` / `0.30` / `0.45` | bounded DP fraction by stage (rising, all `< INVESTMENT_LOAD`) |
| `INVESTMENT_LOAD` | `0.6` | the investment-year DP fraction we **never** reach before 14 (the hard ceiling) |
| `DEPTH_S2` / `DEPTH_S3` / `DEPTH_S4` | `3` / `8` / `16` | craft-floor (depth-accumulation) thresholds to reach each stage |
| `RETURN_S2` / `RETURN_S3` / `RETURN_S4` | `4` / `8` / `12` | sustained voluntary-return thresholds to reach each stage |
| `REST_DAYS_PER_WEEK` | `2` | AAP: ≥1–2 days/week off |
| `REST_MONTHS_PER_YEAR` | `3` | AAP: ~3 months/yr off the primary spike |
| `REST_INCREMENT_MONTHS` | `1` | AAP: taken in ~1-month increments |
| `RETURN_WINDOW_DAYS` | `90` | recency window for "sustained voluntary return" |

## 4. Phasing (P0…P7)
- **P0** — scaffold `@gt100k/specialization-planner`; types + constants; smoke test.
- **P1** — `deriveStage` (readiness thresholds, highest-qualifying wins, no age). Golden per stage.
- **P2** — `ProjectBriefGenerator` port + `stubBriefGenerator` (valid Type III brief; deterministic). Unit.
- **P3** — `planSpecialization` engine: assemble the staged blueprint + fold in the wellbeing replan + generate `nextProject`. *(Core.)* Golden per stage over fixtures.
- **P4** — guardrail-invariant tests (§3.5) as explicit cases (DP monotone + capped; rest present; craft floor; child-owns-choice; no reward field; strain holds stage; escalate on rest/deload/advance; honest scope).
- **P5** — `derivePlanInputs` over the 014 profile + 013 store + a 016 read. Golden (a synthetic log that reaches S3; a strained log that holds stage).
- **P6** — adapter `@gt100k/planner-live` (TFY brief generator + schema-coerce/fallback) + parse tests (hermetic; fixtures) + an opt-in `planner:live` script.
- **P7** — guide-console **"Plan" panel** (render the plan for the selected kid's certified spikes; stub brief default; `PLANNER_LIVE=1` server route for TFY) + preserve `window.__qa`; app smoke test + `LOOP_QA`.

## 5. Success Criteria *(each maps to a test)*
- **SC-1** each of the four stages: the matching `PlanInputs` bundle → the exact `stage`, `mentorRole`, `audience`, `cadence`, `dpDose`, `pcdeFocus` — golden table test.
- **SC-2** readiness not age: two inputs with identical readiness signals but wildly different `monthsInPursuit` → the **same** stage (age never gates); and a low-readiness/high-months input stays **S1** — test.
- **SC-3** DP monotone + capped: across the four stages `dpDose` is non-decreasing and every value `< INVESTMENT_LOAD` — test.
- **SC-4** craft floor: for any `audience !== "SELF"`, `nextProject.craftScaffold` is non-empty; `nextProject.childOwnsChoice === true` in every plan — test.
- **SC-5** rest mandatory: every plan carries `restCadence` with `daysOffPerWeek ≥ 1` and `monthsOffPerYear ≥ 1` — test.
- **SC-6** no gamification / no child-facing field: the `SpecializationPlan` (+ `ProjectBrief`) type carries **no** reward/points/streak/rank/score/grade/child-facing field (type-level + shape check) — test.
- **SC-7** strain holds the stage: an otherwise-S3-ready input whose `wellbeing` says `rest`/`backOff` → `replan.holdStage`, `replan.deload`, `replan.autonomyUp` all true, `escalateToHuman: true`, and the stage does **not** advance — test.
- **SC-8** system proposes: any `replan.restWindow`/`replan.deload` **or** a proposed stage advance sets `escalateToHuman: true`; nothing is applied to the child — test.
- **SC-9** plurality: a second spike for the same kid produces an **independent** plan (its own stage/dose), unaffected by the first spike's inputs — test.
- **SC-10** determinism + fail-safe: identical `PlanInputs` → identical plan with the stub; a generator that throws → the engine falls back to the stub brief (never an empty/invalid `nextProject`) — test.
- **SC-11** deriver: a synthetic 014 profile whose log shows sustained voluntary return + depth accumulation + stretch-seeking → derived inputs that `planSpecialization` reads as **S3_AUTHORSHIP**; a strained variant → held at its stage with `escalateToHuman` — golden test.
- **SC-12 (app)** the guide-console "Plan" panel renders the selected kid's certified-spike plans (stage, next project, mentor role, audience, rest, PCDE focus) and any "needs your review" replans; `window.__qa.ready === true`, `error === null`, and the existing `primaryAction()` still promotes the top candidate (LOOP_QA unbroken) — app smoke test + `LOOP_QA`.
- **SC-13** gate green: `pnpm exec tsc -b` + `pnpm test` (domain + adapter parse tests) and the app builds (`next build`) + `LOOP_QA` pass.
- **live (opt-in, not CI):** `planner:live` generates a real, schema-valid Type III brief via TFY for a seeded spike, and coerces/falls-back on a malformed response — manual/operator.

## 6. Golden Values *(exact)*
Fixtures in `src/__fixtures__/`: (a) one `PlanInputs` per stage (`S1`…`S4`) → its exact `SpecializationPlan` head (stage, mentorRole, audience, cadence, dpDose, pcdeFocus, restCadence); (b) the guardrail/replan cases — DP-monotone check across the four, a strain case (S3-ready + `wellbeing.rest` → held), a plurality pair (two cells, independent plans), a generator-throws case (→ stub fallback); (c) a synthetic 014 profile (reuse `@gt100k/student-profile` fixtures / a small hand-built log) whose derived inputs read as `S3_AUTHORSHIP`, plus a strained variant. Assert `stage`, `mentorRole`, `audience`, `cadence`, `dpDose`, `pcdeFocus`, `replan.*`, `escalateToHuman`, and `nextProject.{childOwnsChoice, craftScaffold non-empty, source}` exactly. The stub brief's `title`/`drivingQuestion` are asserted as stable strings.

## 7. Decisions Already Made
- **[D1]** One spine, **four stages** (Ignition → Foundations → Authorship → Signature), **gated on readiness/experience, not age** (Sosniak/Bloom).
- **[D2]** Progression = **widening the audience + authenticity** (Renzulli **Type III** as the recurring unit), **not** adding hours.
- **[D3]** **Deliberate practice is bounded** (Ericsson/Macnamara): small, chosen, project-embedded; a rising-but-capped fraction; **never investment-year loads before 14**.
- **[D4]** **Rest is mandatory** (AAP): ≥1–2 days/week off, ~3 months/yr off the primary spike, in ~1-month increments.
- **[D5]** **Mentor relay** named by stage (warm → technical → domain-expert → master); brokering the actual next mentor (D3) is out of scope.
- **[D6]** **Staged PCDE curriculum** — the psychosocial skills are stage-sequenced and surfaced (the Evidence Graph will grade the process later).
- **[D7]** **Protect the rage to master** — **no gamification/contingent rewards**, ever; **scaffolded autonomy** (the child always owns problem/method/pace); **strain holds the stage** (counter-cyclical).
- **[D8]** **Plurality is not a discount** — each spike runs its **own** spine in parallel; no transfer discount (Sala & Gobet).
- **[D9]** **Honest scope** — the by-14 artifact is a **ready-to-invest performer / trajectory**, not eminence (adult); surfaced in `terminalNote`.
- **[D10]** **System proposes, human disposes** — the plan is guide-facing; rest/back-off/stage-advance escalate; **no grade, no child-facing label/score ever**; nothing is auto-applied to the child.
- **[D11]** The **project-brief generator is a port**; a **deterministic stub** powers CI + `LOOP_QA`; a **TFY** real adapter is opt-in (`planner:live`), never in the gate. RAG grounding (015) is an *optional* input, not a dependency.
- **[D12]** SYNTHETIC child data; `TFY_API_KEY` only in the live adapter/script; **low-cost model** default `gpt-5.4-mini` (`TFY_PLANNER_MODEL` to override); guide-console panel **preserves `window.__qa`/LOOP_QA**.

## 8. Defaults for the Unspecified
Simplest correct option; record in `.loop/decisions.md`; continue. Escalate `critical` only if a choice would invalidate an SC — especially the safety/ethics invariants SC-3 (DP cap), SC-5 (rest), SC-6 (no gamification / no child-facing field), SC-7 (strain holds), SC-8 (human disposes), and SC-12's `LOOP_QA` determinism.

## 9. Loop notes
- **Domain + adapter packages:** headless; gate = `tsc -b` + `test`; the live adapter is opt-in and **never imported by a test** (parse-only hermetic tests + fixtures, like `tagger-tfy`/`concierge-live`).
- **App:** `LOOP_QA=1` with `LOOP_QA_CMD="pnpm --filter @gt100k/guide-console start"` (after `next build`) + a `LOOP_QA_PORT`; the panel's **default brief is the stub** (deterministic, offline) so the served app is deterministic; real TFY briefs only via the `PLANNER_LIVE=1` server route. **Extend `window.__qa`, don't break it** (the existing `state()`/`primaryAction` must keep working; you may add e.g. `plans: number`).
- **Requires `pnpm install`** (not `--frozen`) — packages import `@gt100k/{student-profile,hypothesis-store,wellbeing,interest-inference,two-axis-tagging}`; guide-console gains the dep on `@gt100k/specialization-planner`; the adapter adds nothing beyond `fetch`.
- **Parallel-safe with 015 (concierge):** new files under `passion/packages/specialization-planner` + `passion/adapters/planner-live` + edits to `passion/apps/guide-console` (which 015 never touches) + a root `tsconfig.json` append. If 015 merges first, `gh pr update-branch` before merging (the root reference append is a trivial merge).
- **Don't corrupt `.next`:** never run `next build` while `next dev` serves guide-console; stop the dev server (port-scoped) first.

## 10. Stack + Commands (pinned)
- Domain `passion/packages/specialization-planner` (`@gt100k/specialization-planner`), deps `@gt100k/student-profile`, `@gt100k/hypothesis-store`, `@gt100k/wellbeing`, `@gt100k/interest-inference`, `@gt100k/two-axis-tagging`. Adapter `passion/adapters/planner-live` (`@gt100k/planner-live`), dep `@gt100k/specialization-planner` (+ native `fetch`; TFY OpenAI-compatible gateway `https://tfy.promptlens.trilogy.com/openai/v1`, `TFY_API_KEY`, default `gpt-5.4-mini`). App `passion/apps/guide-console` gains `@gt100k/specialization-planner` (`transpilePackages`).
- Gate: `pnpm exec tsc -b` + `pnpm test`; app `next build` + `LOOP_QA` usability pass.
- TS strict (`noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `composite`); vitest; **no network in the gate** (stub only); the live adapter uses `fetch` and is opt-in.
