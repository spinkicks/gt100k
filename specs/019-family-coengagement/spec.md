# Feature Specification: Family Co-Engagement System (the environment amplifier)

**Feature Branch**: `019-family-coengagement`
**Created**: 2026-07-23
**Status**: Draft (loop-ready)

**Input**: F3 in `docs/prd/passionApps.md` (Family Co-Engagement System) — the third leg of the human lane (F1 guide + F2 wellbeing + **F3 family**). A headless **domain package** turns a child's discovery + wellbeing state into **guide-facing** family-coaching guidance: a **warm-demanding coaching posture** (autonomy support + structure + *non-contingent* warmth), concrete **door-opening asks** (opportunity / structure / access the child can't self-source), **structured shared-activity / showcase** ideas (the "complex" high-support+high-challenge environment), and — crucially — a **family-driven-pressure watch** that surfaces the obsessive-passion antecedents and routes them to the guide for **re-coaching**. A **`apps/family` surface** renders it: a guide coaching console + a family-facing view that shows only what the guide has **approved**. **The system proposes; the human (guide) disposes** — no automated message ever reaches a parent, no label ever reaches the child. Grounding: `docs/research/passion-pipeline/02-push-vs-backoff-burnout.md` (SPOV 1/3 + Category C — autonomy support → harmonious passion; parental over-valuation / pressured specialization / over-identification → obsessive; conditional regard's costs; counter-cyclical autonomy on rising stakes), `docs/research/passion-pipeline/03-talent-development-spine.md` (§6.5 the "complex" support+challenge environment; the autonomy paradox), `docs/research/passionBrainlift.md` (harmonious vs obsessive passion; Winner's enriched environment), `passion/CONTEXT.md`.

> **Loop-ready note.** Two parts: (A) a headless **domain package** `@gt100k/family` (pure `assessFamily` engine + `deriveFamilySignals` deriver) on the `pnpm exec tsc -b` + `pnpm test` gate — **no network**; (B) a **new** `apps/family` (Next 14) surface — a guide coaching console + a family-facing preview — that renders the reads over the **synthetic pilot roster** (reuse `@gt100k/student-profile`'s `buildPilotRoster` + `@gt100k/wellbeing`'s reads), implements **`window.__qa` / `LOOP_QA`**, and is deterministic + offline. **SYNTHETIC ONLY.** Imports `@gt100k/{student-profile,hypothesis-store,wellbeing,interest-inference,two-axis-tagging}` by name → **`pnpm install` (not `--frozen`)**. **Parallel-safe with the in-flight 018 (specialization planner):** brand-new files under `passion/packages/family` + `passion/apps/family` + a root `tsconfig.json` append — **it never touches `apps/guide-console`** (which 018 is editing), so the lanes are fully disjoint.

---

## 1. Why & where it sits
The research is two-sided and blunt. The family is a **load-bearing wall**: durable passion grows in Csikszentmihalyi's "complex" homes (high support **and** high challenge together) and Winner's "enriched environments." But the family is also the **single biggest burnout risk**: **parental over-valuation**, **pressured specialization**, and **conditional regard** ("I'm proud of you when you win") are the *named, monitorable antecedents* that tip a **harmonious** passion into an **obsessive** one (Mageau 2009; Assor 2004), and the longitudinal data say **supportive beats tiger** on achievement *and* wellbeing (Kim 2013). So F3's job is to coach the family toward **warm-demanding** support (autonomy support + structure + non-contingent warmth) and, counter-cyclically, to **dial autonomy support up exactly when stakes rise** (the moment adults reflexively tighten control). It consumes the discovery signal (013 states, 014 log) and the **F2 wellbeing reads (016)** — reusing 016's `stakesEvent` / devaluation / back-off signals — and produces a **guide-facing** coaching read. It closes the F1/F2/F3 human lane.

## 2. Scope Fence *(hard)*

### In scope
- **Domain package** `@gt100k/family` (`passion/packages/family`):
  - the per-child **signal** type `FamilySignals` and the **read** type `FamilyRead` (§3.2);
  - the pure engine **`assessFamily(signals)`** implementing the §3.3 priority-ordered decision (5 postures + the pressure watch), with the guardrail invariants baked in (§3.4);
  - a **deriver** `deriveFamilySignals(profile, store, wellbeingReads, now, catalog)` that fills the signals it can from the **014 profile** + **013 store** + the **016 wellbeing reads** (active-spike count, over-identification proxy, pressured-specialization proxy, any-stakes / any-devaluation / any-back-off-or-rest); the *unobservable* parental signals (over-valuation, conditional regard, control) are **optional guide-supplied inputs** (synthetic for now).
- **App** `apps/family` (Next 14 / React 18): a **guide coaching console** per child that renders the `FamilyRead` — the coaching posture, the door-opening asks, the shared-activity ideas, and any **"needs your review"** family-driven-pressure escalations the guide must dispose — plus a **family-facing preview** that shows only guide-**approved** items. Implements **`window.__qa`** (`ready`/`error`/`state()`/`primaryAction()`); WCAG 2.2 AA; grayscale-safe; reduced-motion. Functional-but-plain (polished with the operator after).
- Synthetic fixtures (one per §3.3 posture + the pressure-watch + guardrail cases) + tests mirroring every FR/SC (domain golden + app smoke).

### Out of scope
- **Facial / affect / emotion detection** — permanently banned; all signals are behavioral or explicit guide observations. The software **never infers a parent's (or child's) emotional state**.
- **Any automated message / nudge to a parent** — the engine only *recommends* to the guide, who delivers/adapts; a family-facing item appears **only after the guide approves it**.
- **Gamification of any kind** — no streaks/points/prizes/leaderboards/rankings anywhere (and never any *contingent* praise/reward the family is coached to give).
- **The difficulty setter / project planner** (D1/018) — F3 does not set tasks; it coaches the environment around the pursuit. F3 **does not import 018**.
- **Real family accounts / messaging / notifications infra** — the family-facing view is a preview surface; production delivery is later.
- **Diagnosing or labeling the family** — the pressure watch surfaces *behavioral antecedents* for a human to interpret; it never emits a "toxic parent" verdict or a child-facing label.

## 3. Domain model *(decisions already made — do not re-open)*

### 3.1 The warm-demanding target (research Category C + §6.5)
The coaching target is **authoritative / warm-demanding**: high warmth + high structure, delivered through **autonomy support** (choice, voice, rationale), with warmth kept **non-contingent** (never conditional on performance). The two knobs the engine moves are **autonomy support** (`up` / `steady`) and **structure** (`up` / `steady`); **warmth is always non-contingent** (a constant, never a knob toward contingent praise). "Back off" on the family side = **pressure/valuation down + autonomy support up**, never "care less."

### 3.2 Types
```
PressureRisk = "none" | "watch" | "elevated"
Knob         = "up" | "steady"
FamilySignals {                       // per CHILD, aggregated across spikes
  kidId; now;
  activeSpikes: number;               // ACTIVE + CANDIDATE count (013) — plurality vs over-identification
  anyStakesEvent: boolean;            // any spike's 016 read flags a stakes/danger window
  anyDevaluation: boolean;            // any spike shows quiet devaluation (016)
  anyBackOffOrRest: boolean;          // any spike's 016 read set backOff/rest
  overIdentification: boolean;        // single dominant spike + high concentration (proxy)
  pressuredSpecialization: boolean;   // a specialization/stakes push coinciding with declining return (proxy)
  lowFamilyEngagement?: boolean;      // optional: little shared co-engagement (build the complex environment)
  // OPTIONAL guide-supplied observations (NOT software-inferred; synthetic for now):
  parentalOverValuation?: boolean;    // family over-values the activity (Mageau antecedent)
  conditionalRegardObserved?: boolean;// approval made contingent on performance (Assor)
  familyControlObserved?: boolean;    // pressure/intrusion/surveillance (Grolnick control, not structure)
}
CoachingPosture {
  autonomySupport: Knob;              // up when stakes/pressure present (counter-cyclical)
  structure: Knob;                    // up to build the complex environment
  warmth: "non_contingent";          // ALWAYS — never contingent praise/reward
  decoupleWorthFromOutcome: boolean;  // true whenever stakes/pressure present
}
FamilyRead {
  kidId;
  posture: CoachingPosture;
  asks: readonly string[];            // concrete door-opening asks (opportunity/structure/access) — OFFERS
  sharedActivities: readonly string[];// structured shared-activity / showcase ideas (complex environment)
  pressureWatch: { risk: PressureRisk; antecedents: readonly string[] };
  escalateToHuman: boolean; escalationReason?: string;  // re-coaching the guide must dispose
  rationale: string;                  // guide-facing, plain language
  guardrailNotes: readonly string[];
}
```
`FamilyRead` is **guide-facing only**; there is **no child- or family-facing label, no score, and no reward field**. `asks` are **offers** (the child keeps choosing problem/method/pace), never mandates.

### 3.3 The decision engine `assessFamily(signals)` (priority-ordered; first match wins)
1. **Elevated pressure (obsessive-tip)** — `parentalOverValuation || conditionalRegardObserved || familyControlObserved || (pressuredSpecialization && anyDevaluation) || (overIdentification && anyStakesEvent)` → `pressureWatch.risk="elevated"`; posture `autonomySupport:"up"`, `structure:"steady"`, `decoupleWorthFromOutcome:true`; **`escalateToHuman:true`** ("family-driven pressure pattern — re-coach toward autonomy support + non-contingent warmth; decouple the child's worth from the outcome; keep spikes plural and reversible"). `antecedents` lists exactly which fired.
2. **Rising stakes (counter-cyclical)** — else if `anyStakesEvent` → `pressureWatch.risk="watch"`; posture `autonomySupport:"up"`, `decoupleWorthFromOutcome:true`, `structure:"steady"`; asks emphasize reducing evaluative surfacing; `escalateToHuman:false` (a watch, not yet a re-coach).
3. **Strain present** — else if `anyBackOffOrRest || anyDevaluation` → `pressureWatch.risk="watch"`; posture `autonomySupport:"up"`, `structure:"steady"`; **`escalateToHuman:true`** ("strain showing — a warm, non-evaluative check-in; a guilt-free, reversible break is a legitimate outcome, not a failure").
4. **Low family engagement** — else if `lowFamilyEngagement` → `pressureWatch.risk="none"`; posture `autonomySupport:"steady"`, `structure:"up"`; `sharedActivities` emphasized (build the complex, high-support+high-challenge environment); `escalateToHuman:false`.
5. **Baseline (healthy)** — else → `pressureWatch.risk="none"`; posture `autonomySupport:"steady"`, `structure:"steady"`, `warmth:"non_contingent"`, `decoupleWorthFromOutcome:false`; door-opening asks appropriate to the child's spikes; `escalateToHuman:false`.
Any thrown/invalid input → the safe default = baseline posture, `risk:"none"`, no escalation suppressed and **never** a fabricated "push harder".

### 3.4 Guardrail invariants (baked in; each a test)
- **No affect detection** — every signal is behavioral or an explicit guide observation; the engine never infers parent/child emotion.
- **Non-contingent warmth always** — `posture.warmth === "non_contingent"` in every read; the engine never recommends contingent praise/reward.
- **No gamification** — the output type has no reward/streak/points/score/leaderboard field; the engine never emits one, and never coaches the family to attach one.
- **Counter-cyclical autonomy** — any stakes/pressure signal ⇒ `autonomySupport:"up"` + `decoupleWorthFromOutcome:true`, and **never** a "raise pressure / push harder" recommendation.
- **System proposes, human disposes** — elevated pressure or strain ⇒ `escalateToHuman:true`; nothing is ever sent to a parent automatically; no child-facing label.
- **Autonomy preserved** — `asks` are framed as offers of opportunity/structure/access; the engine never fixes the child's problem/method/pace.
- **Plurality / reversibility protected** — on `overIdentification`, the read recommends keeping spikes plural + reversible; it never recommends narrowing to a single identity.

### 3.5 The deriver `deriveFamilySignals(profile, store, wellbeingReads, now, catalog)`
Pure + deterministic. From the **013 store**: `activeSpikes` (count of ACTIVE + CANDIDATE), `overIdentification` (exactly one strongly-dominant spike). From the **016 `wellbeingReads`** (one per spike, as produced by `@gt100k/wellbeing`): `anyStakesEvent` (any `DANGER_WINDOW`/stakes), `anyDevaluation` (any `BURNOUT_TIP`/devaluation), `anyBackOffOrRest` (any read with `backOff||rest`), `pressuredSpecialization` (a stakes read coinciding with a declining-return spike). `lowFamilyEngagement` and the three parental observations are left `undefined` unless supplied (synthetic in fixtures / a future guide input). No affect inference anywhere.

### 3.6 Constants (golden)
| Name | Value | Meaning |
|---|---|---|
| `OVER_IDENTIFICATION_MIN_SHARE` | `0.8` | one spike this dominant (of the child's tracked spikes) ⇒ over-identification proxy |
| `MAX_ASKS` | `4` | door-opening asks surfaced per read (avoid overwhelm) |
| `MAX_SHARED_ACTIVITIES` | `3` | shared-activity ideas per read |

## 4. Phasing (P0…P5)
- **P0** — scaffold `@gt100k/family`; types + constants; smoke test.
- **P1** — `assessFamily` engine (all 5 postures + the pressure watch, priority order). *(Core.)* Golden per-row test.
- **P2** — guardrail-invariant tests (§3.4) as explicit cases.
- **P3** — `deriveFamilySignals` over the 014 profile + 013 store + 016 reads. Golden.
- **P4** — `apps/family` (guide coaching console + family-facing preview) over the pilot roster; `window.__qa`; app smoke test + `LOOP_QA`.
- **P5** — polish pass entry point (functional-but-plain; operator + agent polish the surface together after).

## 5. Success Criteria *(each maps to a test)*
- **SC-1** each of the 5 §3.3 postures: the matching signal bundle → the exact posture + `pressureWatch.risk` + `escalateToHuman` — golden table test.
- **SC-2** counter-cyclical: any `anyStakesEvent` (or elevated pressure) ⇒ `autonomySupport:"up"` + `decoupleWorthFromOutcome:true`, and **never** a "raise pressure" output — test.
- **SC-3** elevated pressure escalates: any obsessive-tip antecedent → `risk:"elevated"` + `escalateToHuman:true`, with `antecedents` naming what fired — test.
- **SC-4** non-contingent warmth + no gamification: every read has `warmth==="non_contingent"`; the `FamilyRead` type carries **no** reward/streak/score field (type-level + shape check) — test.
- **SC-5** over-identification: `overIdentification` ⇒ the read protects plurality/reversibility and never recommends narrowing to one identity — test.
- **SC-6** system-proposes: strain (`anyBackOffOrRest||anyDevaluation`) ⇒ `escalateToHuman:true`; no output is family-facing and no child-facing label exists — test.
- **SC-7** deriver: a synthetic child whose 016 reads include a stakes event + a devaluation on a dominant spike → derived signals (`anyStakesEvent`, `anyDevaluation`, `overIdentification`) → `assessFamily` returns `risk:"elevated"`, `escalateToHuman:true` — golden test.
- **SC-8 (app)** the `apps/family` guide console renders the selected kid's read (posture, asks, shared activities, escalations); the family-facing preview shows only **approved** items; `window.__qa.ready===true`, `error===null`, and `primaryAction()` (approve the top coaching card for the family) is observable in `state()` + DOM — app smoke test + `LOOP_QA`.
- **SC-9** gate green: `pnpm exec tsc -b` + `pnpm test` (domain) and the app builds (`next build`) + `LOOP_QA` pass.

## 6. Golden Values *(exact)*
Fixtures in `src/__fixtures__/`: (a) one `FamilySignals` bundle per §3.3 posture → its exact `FamilyRead` (posture + `pressureWatch.risk` + `escalateToHuman`); (b) the counter-cyclical, elevated-pressure (each antecedent), over-identification, and strain cases; (c) a synthetic child built from `@gt100k/student-profile` + `@gt100k/wellbeing` fixtures whose derived signals yield `risk:"elevated"`. Assert `posture.*`, `pressureWatch.risk`, `pressureWatch.antecedents`, `escalateToHuman` exactly; assert `asks`/`sharedActivities` presence + caps (not exact prose).

## 7. Decisions Already Made
- **[D1]** The target is **warm-demanding / authoritative** — high warmth + high structure via **autonomy support**; warmth is **non-contingent** (never conditional on performance).
- **[D2]** Two knobs (**autonomy support** × **structure**); warmth is a constant, not a knob toward contingent praise. "Family back-off" = pressure/valuation down + autonomy support up.
- **[D3]** **Counter-cyclical** — as stakes rise, dial autonomy support **up** and reduce evaluative surfacing (never tighten control).
- **[D4]** **Monitor the named obsessive-tip antecedents** — parental over-valuation, pressured specialization, over-identification, conditional regard — and route them to the guide for **re-coaching**.
- **[D5]** **System proposes, human disposes** — guide-mediated; **no automated parent message**; a family-facing item appears only after guide approval; **no child-facing label/score ever**.
- **[D6]** All signals **behavioral or explicit guide observations**; **no facial/affect detection**, ever; the unobservable parental signals are optional guide inputs.
- **[D7]** **Never gamify** and never coach the family to give **contingent** praise/reward; protect **plurality + reversibility** (never narrow to one identity).
- **[D8]** Engine pure/deterministic; the deriver reads **013 + 014 + the 016 reads**; F3 **does not import 018**.
- **[D9]** SYNTHETIC ONLY; imports workspace packages by name → `pnpm install` (not frozen); a **new `apps/family`** surface (never touches `apps/guide-console`, so parallel-safe with 018).

## 8. Defaults for the Unspecified
Simplest correct option; record in `.loop/decisions.md`; continue. Escalate `critical` only if a choice would invalidate an SC — especially the ethics invariants SC-2 (counter-cyclical), SC-4 (non-contingent warmth / no gamification), SC-6 (system proposes), and SC-8's `LOOP_QA`.

## 9. Loop notes
- **Domain package:** headless, gate = `tsc -b` + `test`.
- **App:** `LOOP_QA=1` with `LOOP_QA_CMD="pnpm --filter @gt100k/family start"` (after `next build`) + a `LOOP_QA_PORT`; deterministic + offline (renders over the synthetic pilot roster); `window.__qa` (`ready`, `error`, `state()`, `primaryAction()`).
- **Requires `pnpm install`** (not `--frozen`) — imports `@gt100k/{student-profile,hypothesis-store,wellbeing,interest-inference,two-axis-tagging}`; the app adds the dep on `@gt100k/family`.
- **Parallel-safe with 018 (specialization planner):** brand-new files under `passion/packages/family` + `passion/apps/family` + a root `tsconfig.json` append; **it never touches `apps/guide-console`** (018's lane), so the only overlap is the trivial root reference append. Branch from current `main` (009–017 + 015).

## 10. Stack + Commands (pinned)
- Domain `passion/packages/family` (`@gt100k/family`), deps `@gt100k/student-profile`, `@gt100k/hypothesis-store`, `@gt100k/wellbeing`, `@gt100k/interest-inference`, `@gt100k/two-axis-tagging`. App `passion/apps/family` (`@gt100k/family`): Next 14, React 18, motion@12; `transpilePackages` the workspace deps (mirror `guide-console`).
- Gate: `pnpm exec tsc -b` + `pnpm test`; app `next build` + `LOOP_QA` usability pass.
- TS strict (`noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `composite`); vitest; no network anywhere.
