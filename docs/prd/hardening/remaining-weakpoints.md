# Hardening Mini-Spec — Remaining Weak Points (#2, #5, #7, #8)

**Status:** Draft v1 · 2026-07-22 · Owner: (product)
**Addresses:** the four lower-severity weak points from the PRD review not covered by the dedicated hardening specs.
**Grounding:** the brainlifts + `docs/research/passion-pipeline/` memos (no new research needed; these are design calls).

---

## #2 — "Voluntary return after a no-prompt gap" in a daily-attendance program

**Problem:** the return signal assumes spaced usage, but kids are in the passion block every day, so a per-app "gap" doesn't exist.

**Decision — per-spike quiet periods.** The gap is defined **per candidate spike, not per app**: a spike enters a **quiet period** during which it is **not surfaced, not nudged, and given no new content**. "Voluntary return" = the kid **self-navigates back to that cabin/topic during its quiet period**. In a free-choice world, choosing a de-emphasized cabin over everything else on offer is genuine voluntary return. The 7-/30-day horizons and novelty-decay are measured on **per-cabin revisits**, not app logins.

**Why:** it preserves the "return after support is removed" construct (Hidi & Renninger; the return signal) inside daily attendance, and it's directly observable on the 2D map. *Implementation note:* the coverage pass still runs first (so a spike can't go "quiet" before it was ever fairly sampled).

---

## #5 — Family selection selects for intensity, then must keep it warm-not-controlling

**Problem:** admissions selects intense/committed parents (familyBrainlift), then the pipeline must keep them from tipping into control; devaluation, today's detector, is a lagging signal (harm-first).

**Decision — select intense, convert via the science, keep a light backstop.**
- **Primary lever = evidence-based conversion.** Intense parents are outcome-maximizers, so use their own drive: teach them the motivation/passion science at onboarding and show that **pressure lowers the outcome they want** (Kim 2013: tiger < supportive on GPA *and* wellbeing; control → burnout → dropout; Mageau 2009: autonomy support → harmonious passion → sustained excellence). Framed as "warm-demanding is the *optimal* strategy," committed parents adopt it because it serves the goal they already hold. They are the asset, not a liability to filter.
- **Backstop = leading indicators + re-coaching.** Because knowing ≠ doing — the control reflex is strongest exactly as stakes rise (push/back-off SPOV 3) — keep light **leading-indicator** monitoring (the family's actual engagement style: warm prompts vs demanding scores; plus the kid's obsessive-passion antecedents: over-identification, can't-take-a-day-off) that **precede** devaluation, and trigger targeted re-coaching before harm.

**Why:** turns the selection tension into a strength; moves detection earlier than the lagging devaluation signal; keeps the wellbeing judge off the family (per the human-scaling carve-out).

---

## #7 — The "nothing sticks" kid

**Problem:** no defined route for a child who samples widely and shows no durable return anywhere.

**Decision — treat it as an exposure/diagnosis problem, never a verdict.**
1. **Build more.** Interest is *built* through repeated, varied exposure (Hidi & Renninger), so the first response is **broader and more varied exposure** — new domains × work-modes, concierge novel angles, aptitude/environment-seeded triggers — not a conclusion.
2. **Diagnose confounds** via a human review: is it a *measurement* problem (thin signal, bad tags), an *engagement* problem (the app isn't triggering this kid), or a *wellbeing* problem (disengaged/burned out from academics)?
3. **If still nothing after substantial varied exposure, that's normal and developmental.** The kid stays in `EXPLORING` with periodic fresh attempts; interest may emerge later. **Never a "you have no passion" label** — that fixed frame is exactly the resilience-killer we banned (O'Keefe/Dweck/Walton).

**Why:** honors the "interest is built" thesis and the no-fixed-label rule; converts an apparent dead-end into a diagnosable, recoverable state.

---

## #8 — "Fast discovery" vs "term-long certification" expectation gap

**Problem:** discovery is meant to feel fast, but expensive-commitment certification takes ~a term, which could disappoint families expecting a quick verdict.

**Decision — speed in the start, patience in the commitment.**
- A **provisional direction + deep hands-on engagement begin in weeks** (the kid is doing real chess by week 2), so it *feels* fast.
- **Expensive-commitment "certification" is a separate, low-visibility milestone months later** that families are not anxiously awaiting — because the kid is already engaged.
- Message it as **"we explore deeply right away, and lock in serious investment only once it's proven."** No "waiting for a verdict" UI or countdown.

**Why:** aligns expectations with the fast-start/escalating-commitment model (Pipeline PRD §2.2) without overpromising a deterministic early read that the evidence says isn't possible.
