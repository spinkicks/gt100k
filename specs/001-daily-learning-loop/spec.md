# Feature Specification: Daily Learning Loop

**Feature Branch**: `001-daily-learning-loop`

**Created**: 2026-07-20

**Status**: Draft

**Input**: User description: "A code-first vertical slice of the GT100K product: a synthetic learner completes a daily academic block delivered by the (assumed-available) TimeBack learning apps across the four sections, earns XP for focused learning, and once the daily XP goal is met the rest of the day unlocks for project-based work. Governance/consent/legal machinery is stubbed; synthetic learners only."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Earn XP for focused learning in a section (Priority: P1)

A learner opens their day and works through focused learning in one of the four core sections (math, science, reading, language). Time spent in focused learning accrues XP at a rate of one XP per focused minute. The learner can see their XP rising in that section toward the section goal.

**Why this priority**: This is the atomic unit of the whole program — without "focused minute → XP in a section," nothing else (the daily gate, the project unlock, the GT extension) has anything to build on. It is the smallest thing that is independently demonstrable and delivers the core "your effort is counted" experience.

**Independent Test**: Start a session in one section for a synthetic learner, simulate N focused minutes, and confirm the section's XP increases by N and stops counting when focus stops. Delivers a visible, testable "learning is being measured" slice on its own.

**Acceptance Scenarios**:

1. **Given** a synthetic learner with 0 XP in the math section, **When** they complete 12 focused minutes of math learning, **Then** the math section shows 12 XP.
2. **Given** a learner mid-session, **When** focused learning pauses (idle/stopped), **Then** XP stops accruing and resumes only when focused learning resumes.
3. **Given** a learner who has reached a section's goal, **When** they continue in that section, **Then** additional XP is still recorded but the section is marked "goal met."

### User Story 2 - Meet the daily XP goal and unlock project time (Priority: P2)

Across the four sections, the learner accumulates XP toward a daily goal. When the daily goal is met, the rest of the day unlocks for project-based work, and the learner is shown that their academic block is complete for the day.

**Why this priority**: This is the program's defining rhythm ("hit the gate, then build") and the payoff that makes the academic block feel finite and rewarding. It depends on P1 but is the first slice that shows the *whole* daily loop.

**Independent Test**: For a synthetic learner, accrue XP across sections up to the daily goal and confirm that project time transitions from locked to unlocked exactly when the goal is crossed, and not before.

**Acceptance Scenarios**:

1. **Given** a learner below the daily XP goal, **When** they view their day, **Then** project time is shown as locked with the remaining XP to go.
2. **Given** a learner whose cumulative section XP reaches the daily goal, **When** the goal is crossed, **Then** project time unlocks and the academic block is marked complete for the day.
3. **Given** a new calendar day, **When** the learner starts, **Then** the daily XP counter and the project-unlock state reset while historical totals are preserved.

### User Story 3 - See whole-day progress across the four sections (Priority: P3)

The learner sees a single view of their day: XP and goal per section, total toward the daily goal, and whether project time is unlocked.

**Why this priority**: Progress visibility drives the loop, but the loop can function (and be tested) without a polished view, so it ranks after the core mechanic and the gate.

**Independent Test**: Render the day view for a synthetic learner in several states (fresh day, partial, goal met) and confirm each section's XP/goal and the unlock state display correctly.

**Acceptance Scenarios**:

1. **Given** a learner partway through the day, **When** they open the day view, **Then** each of the four sections shows current XP and its goal, plus total toward the daily goal.
2. **Given** the daily goal is met, **When** the learner opens the day view, **Then** the view clearly shows the academic block complete and project time available.

### Edge Cases

- **Focus vs. idle**: Only *focused* learning time counts; idle, paused, or away time does not accrue XP.
- **Day boundary**: XP/goal/unlock reset at the day boundary; a session spanning the boundary is attributed to the day in which each focused minute occurred.
- **Configurable goals (GT)**: The daily and per-section goals are configurable per learner cohort; the GT default is higher than the standard (see Assumptions), and changing the configuration must not corrupt prior days' recorded totals.
- **Replay/idempotency**: Re-processing the same focused-time record must not double-count XP.
- **Section imbalance**: A learner may reach the daily total while leaving one section below its floor; under the hybrid gate (FR-005) project time stays **locked** until every section clears its configured floor, even if the total is met.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST record focused learning time for a learner within one of the four sections (math, science, reading, language) and convert it to XP at **one XP per focused minute**.
- **FR-002**: The system MUST accrue XP only for *focused* learning time and MUST NOT accrue XP for idle, paused, or away time.
- **FR-003**: The system MUST maintain per-section XP and a per-day cumulative XP total for each learner.
- **FR-004**: The system MUST support a **configurable daily XP goal** and **configurable per-section goals** per learner/cohort, with a standard default (120 total = 4 × 30) and a raised GT default (see Assumptions).
- **FR-005**: The system MUST unlock project-based time for the day using a **hybrid gate**: the learner's cumulative daily XP MUST reach the daily goal **AND** each of the four sections MUST reach its per-section minimum floor. Project time stays locked until both conditions hold.
- **FR-005a**: The per-section minimum floor MUST be **configurable** (default assumption: the full per-section goal, i.e. 30 XP standard / GT-raised; a lower floor may be configured so sections need not be perfectly balanced).
- **FR-005b**: The system MUST record per-section XP earned **beyond** the floor, so downstream features can read relative section engagement (a candidate early interest/passion signal — not acted on in this slice).
- **FR-006**: The system MUST reset the daily XP counter and the project-unlock state at each day boundary while preserving historical per-day totals.
- **FR-007**: The system MUST present a day view showing per-section XP and goal, total toward the daily goal, and the project-unlock state.
- **FR-008**: The system MUST treat the academic learning content itself as delivered by the assumed-available TimeBack learning apps (see Assumptions); this feature owns the XP/goal/unlock loop, **not** the authoring of academic content or a mastery-estimation engine.
- **FR-009**: The system MUST be exercisable end-to-end with **synthetic learners only** (no real child data), and MUST NOT require any real consent, admissions, or legal/governance workflow to run this loop (those are stubbed).
- **FR-010**: Focused-time processing MUST be idempotent — re-processing the same focused-time record MUST NOT double-count XP.
- **FR-011**: The system MUST record enough per-day history that a learner's progression can be reconstructed for review.

### Key Entities *(include if feature involves data)*

- **Learner (synthetic)**: A pseudonymous learner the loop runs for; carries a cohort/config reference (standard vs. GT goals). No real PII in this slice.
- **Section**: One of the four core sections (math, science, reading, language), each with a per-section XP goal.
- **DailyProgress**: Per-learner, per-day state — XP per section, cumulative total, daily goal, project-unlock flag, day complete flag.
- **FocusedLearningRecord**: An attributable unit of focused learning time (learner, section, minutes, timestamp) that converts to XP; the idempotency unit.
- **ProjectUnlock**: The per-day state indicating project time is available (derived from DailyProgress meeting the goal).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A synthetic learner who completes the configured focused learning reaches the daily total **and** every per-section floor and unlocks project time in **100%** of runs, and never unlocks it before **both** conditions hold.
- **SC-002**: XP is counted accurately: for any simulated focused-time sequence, recorded XP equals total focused minutes (±0), including under re-processing (no double-count).
- **SC-003**: The standard vs. GT configuration changes only the goals (and thus the time-to-unlock), with **no code change** required to switch a learner between them.
- **SC-004**: The full loop (start day → earn XP across sections → meet goal → unlock project → roll to next day) runs end-to-end for a synthetic learner with **no consent/admissions/legal workflow present**.
- **SC-005**: A reviewer can reconstruct a synthetic learner's per-day progression (per-section XP, goal-met time, unlock state) after the fact.

## Assumptions

- **TimeBack is the assumed academic substrate** (PRD §3.6): the learning apps for the four sections and their content are available/simulated; this feature builds the XP/goal/unlock loop *on top of* them and does not author content or build a mastery engine.
- **GT goal modeling**: the GT "3–4 hours / higher XP" target is modeled as a **higher configurable daily XP goal** (default assumption: raise the 120 standard to a GT default in the ~180–240 range), not a code fork. The exact GT number is a tuning value, not fixed by this spec.
- **Gate definition** (resolved via `/speckit-clarify`): the daily unlock is a **hybrid gate** — reach the daily total **and** clear a configurable per-section floor (FR-005). This enforces baseline balance across all four sections while the "beyond-floor" per-section XP (FR-005b) doubles as an early relative-engagement/interest signal for later features.
- **Synthetic-only, governance stubbed**: no real learners, consent, admissions, or legal/governance machinery is implemented here; those remain background (`GOVERNANCE.md`) and out of scope for this slice.
- **Single learner focus**: this slice concerns one learner's daily loop; cohorts, rivalry, the passion/afternoon systems, and the answer-blind tutor are out of scope and handled by later features.
- **Time source**: focused-time is provided as attributable records (from the learning apps / a simulator); this feature does not itself measure attention or infer focus from sensors.
