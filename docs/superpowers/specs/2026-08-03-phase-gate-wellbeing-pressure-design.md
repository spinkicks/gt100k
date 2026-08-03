# Phase-gate the wellbeing pressure/burnout machinery (no age)

**Date:** 2026-08-03
**Status:** approved (design), implementing
**Scope:** `@gt100k/wellbeing` + `guide-console` glue. No child-facing change. Guide-facing only.

## Problem

Feedback asked to "reduce the scope of motivation onto ages ~9–12": 6–8s are free to
explore (low switching cost), while 9–12s are more committed and should be kept from
burning out. The request came framed as an **age-band** scoping.

## Why not age

Two independent findings say age is the wrong axis:

1. **The research does not support the age-window premise.** Skill-consolidation windows
   are adolescent (13–17), and reward-undermining harm peaks in preschoolers — neither
   lands on a 6-8 vs 9-12 line. The one defensible age effect (validated burnout
   *self-report* instruments only work from ~9–10) does not bite here, because this engine
   reads **behavioural** signals (return/depth trends), not self-report.

2. **The codebase structurally forbids gating a child on age — deliberately.** No age /
   DOB / age-band field exists on `StudentProfile`, `InterestHypothesis`, or anywhere on a
   child. `specialization-planner` states the invariant in its own code: *"Advance on
   EVIDENCE OF READINESS … NEVER on age … structurally impossible to advance a child on a
   birthday."* Every `AgeBand`/`AgeTier` in the repo tags **content** (which resources suit
   which audience), never a child. Introducing a child-age field to tune constants would
   fight a governance-level invariant.

## The axis that works: pursuit phase

"6–8 free to explore / 9–12 keep motivated" is really about **investment / switching
cost**, and the codebase already models that as **pursuit phase**, keyed on readiness, not
age:

- **Discovery** — hypothesis lifecycle `EXPLORING` / `EMERGING` (pre-human), plus the
  not-currently-pursued states `PARKED` / `CONTESTED` / `REOPENED`.
- **Specialization** — `CANDIDATE` / `ACTIVE` (`PLANNABLE_STATES`), reached only by a human
  `promote`.

Phase is a *better* proxy than age for what the feedback wants: a precocious 7-year-old
deep in a specialization gets protected, and a 12-year-old still sampling is not
false-flagged. **You can't burn out on what you're only sampling.**

## Design

Phase-gate only the **pressure/burnout half** of the wellbeing engine; leave the
**challenge-calibration half** universal at every phase.

The engine has two orthogonal knobs. Challenge (`PUSH | HOLD | SCAFFOLD`) — "too hard / too
easy" — stays on for everyone, including a 6-8 in discovery. Pressure/burnout — the four
states `BURNOUT_TIP`, `EARLY_BURNOUT`, `GAP`, `DANGER_WINDOW` and their escalations — turns
on only once a spike is an active specialization.

### 1. `assessWellbeing` gains an optional, backwards-compatible gate

```ts
assessWellbeing(signals, opts?: { pressureActive?: boolean })  // default true = unchanged
```

When `pressureActive === false`, `decide()` skips the four pressure branches and falls
through to the challenge states (`OVER_CHALLENGED` / `UNDER_CHALLENGED` / `IN_ZONE`). A
guardrail note records that the pressure half was held. Pure, deterministic, additive — no
existing caller breaks; no change to `WellbeingSignals` / `WellbeingRead` / the priority
table. `AssessOptions` is exported from `model.ts`.

### 2. Console glue supplies the phase

In `wellbeingForKid` (guide-console), derive
`pressureActive = isPlannableState(card.state)` from the card's existing lifecycle state and
pass it in. `isPlannableState` comes from `@gt100k/specialization-planner`, which
guide-console already depends on — no new dependency, no new phase enum, no age.

### 3. Recovery follows transitively

The strip keys the "See recovery steps" button on `read.state`
(`recoveryTriggerForState`). A discovery spike never reaches a burnout state, so the button
never appears for it — recovery is gated for free, no `recovery.ts` change.

## Consequence for the synthetic demo roster (deliberate)

The pilot roster's escalations were all authored on **non-active** spikes — Ari's `GAP` on
an `EXPLORING` dance cell, Dulce's escalation on a reversibly `PARKED` cell. The gate
correctly suppresses both (neither is an active pursuit), so after this change no synthetic
child raises a wellbeing escalation, and the `#282` recovery surface has no synthetic
trigger. That is the gate working as intended: those triggers were never realistic. Restoring
a demo escalation belongs on an **active specialization** spike (e.g. Dulce's `ACTIVE`
pursuit going quiet), which is fixture surgery in `@gt100k/student-profile` and is left as a
follow-up rather than smuggled into this PR. Real ingested children with active
specializations still escalate normally.

## Out of scope (deliberate follow-up)

- **Demo escalation fixture.** Move a realistic escalation onto Dulce's `ACTIVE` spike in
  `buildPilotRoster` so the recovery surface stays demoable (see consequence above).

- **Child-level `ENGAGEMENT_FADING` recovery.** `voluntaryReturns(kidId)` is computed over
  the child's whole interaction log, not per spike, so "phase" (a per-spike property) does
  not map cleanly onto it. Gating it means deciding a child-level phase (e.g. "has any
  specialization"), which touches `attention.ts` / `useConsole.ts` and is a fuzzier
  heuristic. Left for a separate change to keep this PR tight; noted here so it is a
  decision, not an omission.
- **Age storage / age-tuned constants.** Dropped per the no-age invariant above.
- Pre-existing limitation, untouched: `EARLY_BURNOUT` and the `obsessiveTip` path of
  `BURNOUT_TIP` are declared but not yet derived.

## Guardrails preserved

Guide-facing only; system proposes, human disposes; never gamify; no child-facing
label/score/reward; no age gate on any child.

## Testing

- Discovery (`pressureActive: false`): a signal set that would yield `BURNOUT_TIP` /
  `EARLY_BURNOUT` / `GAP` / `DANGER_WINDOW` instead falls through to the challenge read and
  does not escalate.
- Specialization (`pressureActive: true`) and default (no opts): unchanged from today.
- Challenge states (`OVER` / `UNDER` / `IN_ZONE`) identical under both phases.
