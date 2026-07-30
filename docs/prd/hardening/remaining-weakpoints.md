# Hardening Mini-Spec — Remaining Weak Points (#2, #5, #7, #8)

**Status:** Draft v1 · 2026-07-22 · Each weak point re-checked against the code 2026-07-28; per-item status notes below · Owner: (product)
**Addresses:** the four lower-severity weak points from the PRD review not covered by the dedicated hardening specs.
**Grounding:** the brainlifts + `docs/research/passion-pipeline/` memos (no new research needed; these are design calls).

---

## #2 — "Voluntary return after a no-prompt gap" in a daily-attendance program

**Problem:** the return signal assumes spaced usage, but kids are in the passion block every day, so a per-app "gap" doesn't exist.

**Decision — per-spike quiet periods.** The gap is defined **per candidate spike, not per app**: a spike enters a **quiet period** during which it is **not surfaced, not nudged, and given no new content**. "Voluntary return" = the kid **self-navigates back to that cabin/topic during its quiet period**. In a free-choice world, choosing a de-emphasized cabin over everything else on offer is genuine voluntary return. The 7-/30-day horizons and novelty-decay are measured on **per-cabin revisits**, not app logins.

**Why:** it preserves the "return after support is removed" construct (Hidi & Renninger; the return signal) inside daily attendance, and it's directly observable on the 2D map. *Implementation note:* the coverage pass still runs first (so a spike can't go "quiet" before it was ever fairly sampled).

**Status 2026-07-28 — still open, and it now has a rule to reconcile with.** Nothing implements a quiet period: no code marks a spike quiet, withholds it from a slate, or reads a return as having happened during one. What exists is the *passive* version in the graduation gate, which looks for a ≥14-day interval between consecutive returns the child produced on their own. That is a filter over history, not the deliberately inserted gap this decision describes, and it cannot distinguish a gap we imposed from a fortnight the child was on holiday.

The reconciliation the implementation note anticipated is bigger than "coverage runs first." `@gt100k/surfacing` now owes every triggered domain **four spaced re-exposures** before it may be dropped, and it pays those debts *before* offering anything new — a rule that comes from the same memo, on the finding that a domain raised and then not maintained leaves a child below where they started. A quiet period is a deliberate suspension of exactly that maintenance. The two are compatible only if the quiet period may start after the debt is paid, and nothing says that yet. Whichever way it is settled, the surfacing policy is where a quiet period has to be expressed, because it is the thing that decides what a session offers.

---

## #5 — Family selection selects for intensity, then must keep it warm-not-controlling

**Problem:** admissions selects intense/committed parents (familyBrainlift), then the pipeline must keep them from tipping into control; devaluation, today's detector, is a lagging signal (harm-first).

**Decision — select intense, convert via the science, keep a light backstop.**
- **Primary lever = evidence-based conversion.** Intense parents are outcome-maximizers, so use their own drive: teach them the motivation/passion science at onboarding and show that **pressure lowers the outcome they want** (Kim 2013: tiger < supportive on GPA *and* wellbeing; control → burnout → dropout; Mageau 2009: autonomy support → harmonious passion → sustained excellence). Framed as "warm-demanding is the *optimal* strategy," committed parents adopt it because it serves the goal they already hold. They are the asset, not a liability to filter.
- **Backstop = leading indicators + re-coaching.** Because knowing ≠ doing — the control reflex is strongest exactly as stakes rise (push/back-off SPOV 3) — keep light **leading-indicator** monitoring (the family's actual engagement style: warm prompts vs demanding scores; plus the kid's obsessive-passion antecedents: over-identification, can't-take-a-day-off) that **precede** devaluation, and trigger targeted re-coaching before harm.

**Why:** turns the selection tension into a strength; moves detection earlier than the lagging devaluation signal; keeps the wellbeing judge off the family (per the human-scaling carve-out).

**Status 2026-07-28 — largely built, with one honest caveat.** Both halves shipped. The conversion lever is `apps/parent-guide`, a hosted playbook that teaches the motivation science with citations rather than asserting a house style. The backstop is `@gt100k/family`, whose read carries the antecedents this decision asked for — over-identification, a pressured specialization, parental over-valuation, conditional regard, observed control — separately from `anyDevaluation`, and escalates to a guide for re-coaching rather than acting. Warmth is a constant on the coaching posture, never a knob, and the read is guide-facing with no family- or child-facing label. The caveat is that the three sharpest antecedents are **guide observations, not software inferences**: a guide has to notice conditional regard and record it. So the leading indicators lead only as far as the guide's attention does, which is a staffing property and not an engine one.

---

## #7 — The "nothing sticks" kid

**Problem:** no defined route for a child who samples widely and shows no durable return anywhere.

**Decision — treat it as an exposure/diagnosis problem, never a verdict.**
1. **Build more.** Interest is *built* through repeated, varied exposure (Hidi & Renninger), so the first response is **broader and more varied exposure** — new domains × work-modes, concierge novel angles, aptitude/environment-seeded triggers — not a conclusion.
2. **Diagnose confounds** via a human review: is it a *measurement* problem (thin signal, bad tags), an *engagement* problem (the app isn't triggering this kid), or a *wellbeing* problem (disengaged/burned out from academics)?
3. **If still nothing after substantial varied exposure, that's normal and developmental.** The kid stays in `EXPLORING` with periodic fresh attempts; interest may emerge later. **Never a "you have no passion" label** — that fixed frame is exactly the resilience-killer we banned (O'Keefe/Dweck/Walton).

**Why:** honors the "interest is built" thesis and the no-fixed-label rule; converts an apparent dead-end into a diagnosable, recoverable state.

**Status 2026-07-28 — the prohibitions hold; the route does not exist.** Step 3 is the part that is real. A hypothesis is born `EXPLORING`, no automatic transition demotes one for silence, and a gap in the log never lowers a belief — missingness is absence of evidence in the fold, not evidence against. Two of the six guardrail checks name the failure modes directly: GC5 for a demote-after-silence, GC1 for any scalar or label field reaching a hypothesis. They run over the synthetic pilot roster inside the test gate, so a regression that reintroduced either fails CI; nothing runs them over a real child's profile yet. So the "you have no passion" verdict is unreachable today, which is the part that mattered most.

Step 1 is partly served: `@gt100k/surfacing` will offer one never-seen cabin per slate, but only once every maintenance debt is clear, so a child who has been triggered widely and maintained slowly gets *less* breadth, not more — the opposite of what this decision asks for in exactly the case it was written about. Step 2 has nothing at all: no state marks a child as having sampled widely without returning anywhere, so no human review is triggered and the measurement-versus-engagement-versus-wellbeing distinction is never drawn. Coverage breadth is computed program-wide in `@gt100k/guardrails` but is an aggregate metric, not a per-child flag.

---

## #8 — "Fast discovery" vs "term-long certification" expectation gap

**Problem:** discovery is meant to feel fast, but expensive-commitment certification takes ~a term, which could disappoint families expecting a quick verdict.

**Decision — speed in the start, patience in the commitment.**
- A **provisional direction + deep hands-on engagement begin in weeks** (the kid is doing real chess by week 2), so it *feels* fast.
- **Expensive-commitment "certification" is a separate, low-visibility milestone months later** that families are not anxiously awaiting — because the kid is already engaged.
- Message it as **"we explore deeply right away, and lock in serious investment only once it's proven."** No "waiting for a verdict" UI or countdown.

**Why:** aligns expectations with the fast-start/escalating-commitment model (Pipeline PRD §2.2) without overpromising a deterministic early read that the evidence says isn't possible.

**Status 2026-07-28 — the shape holds and the numbers match.** Certification is the months-scale milestone this decision assumes: the gate wants a 56-day span, at least two occasions, and one ≥14-day gap the child returned from, with a human autonomy sign-off on top. The provisional read is the fast half, reachable at two distinct days and a modest evidence mass. Nothing in any family-facing surface counts down to the gate or shows a pending verdict — the parent playbook teaches posture and never reports gate progress, and the gate view is guide-facing — so the "no waiting-for-a-verdict UI" half is honoured by absence rather than by a rule that would notice if someone added one.
