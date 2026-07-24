# Feature Specification: Wellbeing — Push / Back-off + Burnout Monitor

**Feature Branch**: `016-wellbeing`
**Created**: 2026-07-23
**Status**: Draft (loop-ready)

**Input**: F2 in `docs/prd/passionApps.md` (Push/Back-off + Burnout Monitor) — the behavioral-signal → action engine that keeps a deepening pursuit healthy, and the guide-console surface that shows a human the recommendation so **the system proposes and the human disposes**. A headless **domain package** turns per-spike behavioral signals into a recommendation on **two independent knobs** (a *challenge* move — PUSH/HOLD/SCAFFOLD — and a *pressure* move — autonomy up/steady), plus **BACK-OFF / REST / hand-to-a-human** when strain shows, weighting quiet **devaluation** as the earliest alarm. A **guide-console panel** renders it. Grounding: `docs/research/passion-pipeline/02-push-vs-backoff-burnout.md` (§6.2 decision table, §6.3 the nine guardrails), `docs/prd/hardening/remaining-weakpoints.md` (#2 per-spike quiet periods; #5 leading indicators), `SPECIALIZATION-PIPELINE-PRD.md` (push/back-off playbook), `passion/CONTEXT.md`.

> **Loop-ready note.** Two parts: (A) a headless **domain package** `@gt100k/wellbeing` (pure engine + deriver) on the `pnpm exec tsc -b` + `pnpm test` gate; (B) a **wellbeing/escalation panel added to `apps/guide-console`** that renders the reads — it must **preserve the existing `window.__qa` / `LOOP_QA`** contract (extend, never break). **SYNTHETIC ONLY.** Imports `@gt100k/{student-profile,hypothesis-store}` by name → **`pnpm install` (not `--frozen`)**. **Parallel-safe with 015 (concierge):** disjoint files (new package + guide-console, which 015 never touches); only the root `tsconfig.json` append overlaps (trivial merge).

---

## 1. Why & where it sits
As a built interest deepens toward mastery, the danger is not difficulty but **control** — pressure that turns a harmonious passion obsessive and ends in burnout — and the earliest warning is **quiet devaluation** (the child still shows up but stops going deep). This engine reads that from behavior (never faces), separates the **challenge** knob from the **pressure** knob, and — crucially — **never decides for the human**: back-off, rest, and quit are always routed to a mentor, and no burnout label ever reaches the child. It consumes the discovery signal already produced by 012/011/013/014 and closes the F1 console's wellbeing gap.

## 2. Scope Fence *(hard)*

### In scope
- **Domain package** `@gt100k/wellbeing` (`passion/packages/wellbeing`):
  - the **signal** type `WellbeingSignals` (per spike) and the **read** type `WellbeingRead`;
  - the pure engine **`assessWellbeing(signals)`** implementing the §6.2 decision table (7 states → challenge move + pressure move + back-off/rest/escalate), with the guardrail invariants baked in (§3.4);
  - a **deriver** `deriveWellbeingSignals(profile, cellKey, now)` that fills the signals it can from the **014 student profile** (interaction log) + **013 hypothesis store** (return trend, depth trend, devaluation-ish, per-spike missingness, stretch-seeking); the harder proxies (exhaustion, stakes events, obsessive-tip) are **optional** inputs (synthetic for now).
- **App** `apps/guide-console`: a **wellbeing/escalation panel** per child that renders each spike's `WellbeingRead` (the state, the two recommended moves, and any **"needs your review"** escalations the guide must dispose). Guide-facing only; **preserve `window.__qa`/`LOOP_QA`** (extend `state()` if useful; keep the existing `primaryAction`).
- Synthetic fixtures (one per §6.2 row + guardrail cases) + tests mirroring every FR/SC (domain golden + app smoke).

### Out of scope
- **Facial / affect / emotion detection** — permanently banned; all signals are behavioral.
- **Any automated back-off/rest/quit applied to the child** — the engine only *recommends* + escalates; the human disposes.
- **Gamification of any kind** — no streaks/points/prizes/leaderboards anywhere (guardrail #1).
- **The family-coaching protocol (F3)** and the difficulty *setter* (the planner D1 sets tasks; this engine only recommends the *move*).
- **New exhaustion/stakes instrumentation** — those signals are optional inputs; real capture is later (game-side / TimeBack).

## 3. Domain model *(decisions already made — do not re-open)*

### 3.1 Two knobs, named separately (research §6.1)
- **Challenge knob:** `PUSH` (raise difficulty / fade scaffold / *offer* a stretch) · `HOLD` (consolidate, vary reps) · `SCAFFOLD` (lower difficulty / add support). Setpoint ~80–90% success, co-set with the child.
- **Pressure knob:** `AUTONOMY_UP` (more choice/voice/rationale; decouple worth from outcome; reduce evaluative surfacing) · `STEADY`. Default posture: **low control, high structure, high warmth.** "Back off" = pressure down (autonomy up + load down) **before** touching challenge.

### 3.2 Types
```
WellbeingState = "UNDER_CHALLENGED" | "IN_ZONE" | "OVER_CHALLENGED"
               | "DANGER_WINDOW" | "EARLY_BURNOUT" | "BURNOUT_TIP" | "GAP"
Trend = "rising" | "stable" | "declining"
WellbeingSignals {
  kidId; cellKey;
  returnTrend: Trend; depthTrend: Trend;            // from 012/014 (voluntary, depth-weighted)
  successRate?: number;                              // [0,1]; optional (not yet instrumented)
  stretchSeeking?: boolean;                          // voluntarily picks harder (depth: chosen_challenge)
  devaluation?: boolean;                             // compliance-without-depth / cancels / stopped sharing
  exhaustion?: boolean;                              // shorter sessions / latency / sleep encroachment (optional)
  obsessiveTip?: boolean;                            // can't take a day off / guilt / plays hurt / single-identity (optional)
  stakesEvent?: boolean;                             // competition / deadline / audience / specialization / parental-valuation spike
  missing?: boolean;                                 // per-spike quiet-period gap (weak-point #2)
  now: string;
}
WellbeingRead {
  kidId; cellKey; state: WellbeingState;
  challenge: "PUSH" | "HOLD" | "SCAFFOLD";
  pressure: "AUTONOMY_UP" | "STEADY";
  backOff: boolean; rest: boolean;
  reduceEvaluativeSurfacing: boolean;                // true in the danger window (counter-cyclical)
  escalateToHuman: boolean; escalationReason?: string;
  rationale: string;                                 // guide-facing, plain language
  guardrailNotes: readonly string[];                 // e.g. "weight devaluation over exhaustion"
}
```
`WellbeingRead` is **guide-facing only**; there is **no child-facing field and no score/label**.

### 3.3 The decision engine `assessWellbeing(signals)` (research §6.2, priority-ordered)
Evaluate in this deterministic priority (highest first); the first match wins:
1. **BURNOUT_TIP** — `devaluation || obsessiveTip` (or a sustained multi-signal decline) → `HOLD`, `AUTONOMY_UP`, **`rest: true`**, **`escalateToHuman: true`** ("possible devaluation / obsessive tip — a human should decide on a guilt-free, reversible break; broaden identity / re-open plural spikes"). *Weight devaluation over exhaustion; presence-without-depth is worse than a clean gap.*
2. **EARLY_BURNOUT** — `exhaustion && depthTrend==="declining" && returnTrend==="declining"` → `HOLD`, `AUTONOMY_UP`, **`backOff: true`**, **`escalateToHuman: true`** ("early exhaustion pattern — cut load + pressure; warm check-in").
3. **GAP** — `missing` → no auto-nudge, no label; `escalateToHuman: true` only past the threshold ("a gap is a question, not a verdict — a human should check in"); `challenge: HOLD`, `pressure: STEADY`. **Never** `PUSH` or an automated nudge.
4. **DANGER_WINDOW** — `stakesEvent` → `HOLD`, **`AUTONOMY_UP`**, **`reduceEvaluativeSurfacing: true`** (counter-cyclical; never add stakes/streaks).
5. **OVER_CHALLENGED** — `(successRate ?? 1) < 0.7 && returnTrend!=="rising" && !devaluation` → **`SCAFFOLD`**, `STEADY`.
6. **UNDER_CHALLENGED** — `returnTrend==="rising" && depthTrend==="rising" && (successRate ?? 0) > 0.9 && stretchSeeking` → **`PUSH`**, `STEADY` (*push only from strength*).
7. **IN_ZONE** — otherwise → `HOLD`, `STEADY` ("resist adding stakes; protect autonomy").
Any thrown/invalid input → the safe default `IN_ZONE`/`HOLD`/`STEADY` with no escalation suppressed — **never** fabricate a PUSH.

### 3.4 Guardrail invariants (baked in; each a test)
- **No gamification** — the output type has no reward/streak/score field; the engine never emits one.
- **System proposes, human disposes** — `rest` or `backOff` ⇒ `escalateToHuman: true`; no state ever yields a child-facing label.
- **Counter-cyclical autonomy** — a `stakesEvent` ⇒ `AUTONOMY_UP` + `reduceEvaluativeSurfacing` + never `PUSH`.
- **Missingness → human, never auto** — `missing` ⇒ no `PUSH`, no nudge; escalate (past threshold) for a human check-in only.
- **Weight devaluation over exhaustion** — devaluation outranks exhaustion in the priority order.
- **Push only from strength** — `PUSH` requires rising return + rising depth + stretch-seeking, not merely high success.

### 3.5 The deriver `deriveWellbeingSignals(profile, cellKey, now)`
From the 014 `StudentProfile` interaction log + 013 store: `returnTrend`/`depthTrend` from recent-vs-older voluntary/depth cell-events; `stretchSeeking` from `chosen_challenge` depth events; `devaluation` from compliance-without-depth (prompted-return/skip after prior voluntary depth) + declining voluntary return; `missing` from a per-spike quiet period with no voluntary return. `successRate`/`exhaustion`/`obsessiveTip`/`stakesEvent` are left `undefined` unless supplied (synthetic in fixtures). Pure + deterministic.

### 3.6 Constants (golden)
| Name | Value | Meaning |
|---|---|---|
| `PUSH_SUCCESS` | `0.9` | success above which (with rising return + stretch) → PUSH |
| `ZONE_LOW` / `ZONE_HIGH` | `0.8` / `0.9` | the stretch zone |
| `SCAFFOLD_SUCCESS` | `0.7` | success below which → SCAFFOLD |
| `GAP_DAYS` | `14` | per-spike quiet-period length that counts as a gap |
| `TREND_WINDOW_DAYS` | `21` | recent-vs-older window for trend derivation |

## 4. Phasing (P0…P5)
- **P0** — scaffold `@gt100k/wellbeing`; types + constants; smoke test.
- **P1** — `assessWellbeing` engine (all 7 states, priority order). *(Core.)* Golden per-row test.
- **P2** — guardrail-invariant tests (§3.4) as explicit cases.
- **P3** — `deriveWellbeingSignals` over the 014 profile + 013 store. Golden.
- **P4** — guide-console **wellbeing panel** (render reads + escalations for the selected kid); preserve `window.__qa`; app smoke test.
- **P5** — polish pass entry point (functional-but-plain; operator + agent polish the panel together after).

## 5. Success Criteria *(each maps to a test)*
- **SC-1** each of the 7 §6.2 rows: the matching signal bundle → the exact `WellbeingState` + challenge + pressure + flags — golden table test.
- **SC-2** devaluation outranks exhaustion: a bundle with both → `BURNOUT_TIP` (rest+escalate), not `EARLY_BURNOUT` — test.
- **SC-3** push only from strength: high `successRate` but flat/declining return (no stretch) → **not** `PUSH` (→ `IN_ZONE`/`HOLD`) — test.
- **SC-4** missingness: `missing` → no `PUSH`, no nudge; escalate for a human check-in past threshold; never a label — test.
- **SC-5** counter-cyclical: `stakesEvent` → `AUTONOMY_UP` + `reduceEvaluativeSurfacing`, never `PUSH`/streaks — test.
- **SC-6** system-proposes: every `rest`/`backOff` sets `escalateToHuman`; no output carries a child-facing label/score — test.
- **SC-7** deriver: a synthetic 014 profile whose log shows declining voluntary return + compliance-without-depth → derived signals with `devaluation:true` + `returnTrend:"declining"` → engine returns `BURNOUT_TIP` — golden test.
- **SC-8 (app)** the guide-console wellbeing panel renders the selected kid's reads + escalations; `window.__qa.ready === true`, `error === null`, and the existing `primaryAction` still promotes the top candidate (LOOP_QA unbroken) — app smoke test + `LOOP_QA`.
- **SC-9** gate green: `pnpm exec tsc -b` + `pnpm test` (domain) and the app builds (`next build`) + `LOOP_QA` pass.

## 6. Golden Values *(exact)*
Fixtures in `src/__fixtures__/`: (a) one `WellbeingSignals` bundle per §6.2 row → its exact `WellbeingRead`; (b) the devaluation-vs-exhaustion, push-from-strength, missingness, and stakes cases; (c) a synthetic 014 profile (reuse `@gt100k/student-profile` fixtures / a small custom log) whose derived signals yield `BURNOUT_TIP`. Assert `state`, `challenge`, `pressure`, `backOff`, `rest`, `reduceEvaluativeSurfacing`, `escalateToHuman` exactly.

## 7. Decisions Already Made
- **[D1]** Two independent knobs (challenge vs pressure); "back off" = pressure down first.
- **[D2]** Priority order weights **devaluation** highest; **push only from strength**.
- **[D3]** **System proposes, human disposes** — back-off/rest/quit always escalate; **no child-facing label/score ever**.
- **[D4]** **Missingness → a human check-in, never an auto-nudge/label** (a gap is a question).
- **[D5]** **Counter-cyclical autonomy** on any stakes event; **never gamify** anything.
- **[D6]** All signals are **behavioral**; **no facial/affect detection**, ever.
- **[D7]** Engine is pure/deterministic; the deriver reads 014/013; harder proxies are optional/synthetic.
- **[D8]** SYNTHETIC ONLY; imports workspace packages by name → `pnpm install` (not frozen); guide-console panel **preserves `window.__qa`/LOOP_QA**.

## 8. Defaults for the Unspecified
Simplest correct option; record in `.loop/decisions.md`; continue. Escalate `critical` only if a choice would invalidate an SC (esp. SC-4/SC-6 — the human-in-the-loop safety rules — and SC-8's LOOP_QA).

## 9. Loop notes
- **Domain package:** headless, gate = `tsc -b` + `test`.
- **App:** `LOOP_QA=1` with `LOOP_QA_CMD="pnpm --filter @gt100k/guide-console start"` (after `next build`) + a `LOOP_QA_PORT`; **extend `window.__qa`, don't break it** (the existing `state()`/`primaryAction` must keep working).
- **Requires `pnpm install`** (not `--frozen`) — imports `@gt100k/student-profile` + `@gt100k/hypothesis-store`; guide-console gains the dep on `@gt100k/wellbeing`.
- **Parallel-safe with 015 (concierge):** new files under `passion/packages/wellbeing` + edits to `passion/apps/guide-console` (which 015 never touches) + a root `tsconfig.json` append. If 015 merges first, update this branch against `main` before merge (root reference append is a trivial merge).

## 10. Stack + Commands (pinned)
- Domain `passion/packages/wellbeing` (`@gt100k/wellbeing`), deps `@gt100k/student-profile`, `@gt100k/hypothesis-store`. App `passion/apps/guide-console` gains `@gt100k/wellbeing`.
- Gate: `pnpm exec tsc -b` + `pnpm test`; app `next build` + `LOOP_QA` usability pass.
- TS strict (`noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `composite`); vitest; no network anywhere.
