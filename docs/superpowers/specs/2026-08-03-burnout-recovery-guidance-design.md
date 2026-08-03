# Burnout Recovery Guidance for the Guide Console — Design

_2026-08-03_

## Problem

The guide console already **detects** motivational burnout. `@gt100k/wellbeing`
computes `WellbeingState`s including `BURNOUT_TIP` and `EARLY_BURNOUT`, and
`app/engagement.ts` computes an `ENGAGEMENT_FADING` signal; these flow through
`attentionFor()` into the Today roster, the action line, and the `WellbeingStrip`.

What the console does **not** do is tell a guide what to *do* once burnout is
signalled. The `WellbeingStrip` shows the state plus two coarse moves
(Difficulty / Freedom) and an escalation note — but not the concrete,
evidence-based recovery protocol a guide should follow: how long a break should
be, how to restore autonomy, what to stop doing, when a dip is temporary vs. a
genuine dead-end that needs a pivot.

This design adds a **recovery-guidance surface**: when a burnout/fading signal is
already flagged, the guide can open a panel of concrete, evidence-cited moves
tailored to which signal fired, and record what they chose.

The evidence base is the deep-research report
`RESEARCH-once-a-learning-passion-development-app-for-childr-2026-08-03.md`
(repo root). This is a **remediation** feature, not a detection one — detection
already exists and is explicitly out of scope (see §9).

## Non-goals

- **No new detection.** We consume the existing wellbeing/engagement signals; we
  do not add or change signal derivation. (Note the instrumentation gap in §9.)
- **No child-facing surface**, no score or label shown to a child, no
  gamification. This matches the standing wellbeing guardrail: system proposes,
  human disposes.
- **No automated break enforcement.** The panel is advisory; a logged recovery
  decision has **no** side effect on the child surface, the hypothesis store,
  offers, or gates. (Parking a specialization *would* change the child surface,
  so recovery logging deliberately does not do that.)

## Architecture

Three edits across clean boundaries; no cross-product imports
(`@gt100k/evidence-*` is untouched; recovery is a passion-side concern).

1. **`@gt100k/research` (`packages/research/src/registry.ts`)** — add ~7
   `area: "Wellbeing"` claims that back the recovery moves. Evidence layer.
2. **`@gt100k/wellbeing`** — new pure module `recovery.ts`: the `RecoveryMove` /
   `RecoveryPlan` types, a per-state catalog, and a `recoveryFor()` selector.
   No React. Companion to `assess.ts` (assess says *what state*; recovery says
   *what to do about it*).
3. **`guide-console`** — new UI:
   - `app/recovery.ts` — view-model glue (maps a wellbeing/engagement trigger to
     a `RecoveryPlan` + resolves claim citations).
   - `app/recovery-panel.tsx` — the drawer.
   - `app/recovery-log.ts` — the browser-local, side-effect-free note log.
   - trigger affordance wired into `app/wellbeing-strip.tsx` /
     `app/action-line.tsx` and drawer toggle in `app/console.tsx`.

### Why not the alternatives

- **Everything in guide-console.** Faster and one lane, but the recovery
  knowledge could not be reused by a future parent surface, and it mixes domain
  content into a UI app. The wellbeing package is the right owner of "what to do
  about a wellbeing state."
- **Extend `@gt100k/motivation` with recovery moves.** Rejected: that package is
  deliberately verdict-free ("a probe never returns a classification of the
  child"). Recovery moves are triggered *by* the burnout verdict, so keying them
  to a state contradicts its stated philosophy. We borrow its `AdultMove`
  *shape* and `EvidenceGrade` vocabulary, not its module.

## The recovery content model (`@gt100k/wellbeing/recovery.ts`)

Borrows the `AdultMove` philosophy — an instruction aimed at the adult,
subtraction-first, evidence-graded — but references research claims for
citations rather than carrying its own sources.

```ts
export type RecoveryMoveKind =
  | "SUBTRACT"            // stop doing something depleting (reduce pressure)
  | "RESTORE_AUTONOMY"    // meaningful choice, autonomy over long-term goals
  | "REBUILD_COMPETENCE"  // optimal-challenge tasks, positive feedback
  | "BREAK"               // structured time away
  | "RENEGOTIATE_GOAL"    // autonomously-chosen disengage + re-engage elsewhere
  | "DO_NOT";             // guardrail: an anti-pattern to avoid

// Reuse the motivation package's grading vocabulary verbatim (copy the type; no
// runtime import across packages).
export type EvidenceGrade =
  | "controlled-in-children"
  | "correlational-or-older-sample"
  | "reasoned";

export interface RecoveryMove {
  readonly id: string;
  readonly kind: RecoveryMoveKind;
  /** One sentence a guide can act on this week. */
  readonly does: string;
  /** Ids into @gt100k/research; rendered via the WhyThis popover. */
  readonly claimIds: readonly string[];
  readonly grade: EvidenceGrade;
}

export interface BreakGuidance {
  /** Primary, app-context default. */
  readonly headline: string;   // "A few days to about a week away."
  readonly detail: string;     // "off" = active in other ways, not inactivity
  readonly claimIds: readonly string[];
}

export interface PivotGuidance {
  readonly headline: string;   // dip vs. genuine disengagement
  readonly detail: string;     // ~2-week rule of thumb; pivot is guide's call
  readonly claimIds: readonly string[];
}

export type RecoveryTrigger = WellbeingState | "ENGAGEMENT_FADING";

export interface RecoveryPlan {
  readonly trigger: RecoveryTrigger;
  readonly headline: string;                 // plain language
  readonly moves: readonly RecoveryMove[];    // ordered: strongest lever first
  readonly breakGuidance?: BreakGuidance;     // present where a break applies
  readonly pivotGuidance: PivotGuidance;      // always present
}

/**
 * Pure selector. Returns the tailored plan for the trigger, or null for states
 * that are not a burnout/fading signal (e.g. IN_ZONE) so callers never render an
 * empty panel.
 */
export function recoveryFor(trigger: RecoveryTrigger): RecoveryPlan | null;
```

### Per-state tailoring

Ordered by the research's own strength-of-evidence. Every plan also carries the
two universal `DO_NOT` guardrails.

- **`BURNOUT_TIP`** (devaluation / obsessive tip) → headline *"Ease the pressure
  and protect free play."*
  1. `SUBTRACT` — stop using rewards, grades, or evaluation as the motivator
     (overjustification: an expected reward for an already-enjoyed activity
     roughly halved later free-play time).
  2. `SUBTRACT` — protect unstructured free play; do not fill the freed time
     with more structured practice.
  3. `REBUILD_COMPETENCE` — keep tasks at an optimal challenge with positive
     feedback.

- **`EARLY_BURNOUT`** (exhaustion + declining depth/returns) → headline *"A real
  break, and change what is draining them."*
  1. `BREAK` — genuine time away (see break guidance below).
  2. `SUBTRACT` — rest alone is insufficient: remove the depleting conditions
     (load, pressure), don't just rest and return to the same setup.
  3. `REBUILD_COMPETENCE` — re-enter with well-structured, achievable tasks.

- **`ENGAGEMENT_FADING`** (voluntary returns trending down) → headline *"Hand
  back control, and check the goal still fits."*
  1. `RESTORE_AUTONOMY` — the strongest lever (autonomy effect g=1.14 vs.
     intrinsic-motivation g=0.58): meaningful choice, interest-aligned tasks,
     autonomy over the child's *long-term* goals, not just daily tasks.
  2. `RENEGOTIATE_GOAL` — if it is a genuine dead-end, an autonomously-chosen
     disengagement *paired with* re-engagement in a new goal predicts better
     wellbeing than either pushing through or a bare quit.

Universal guardrails appended to every plan:

- `DO_NOT` — don't force the child to quit outright; full withdrawal often
  worsens their state. Rest, not quitting.
- `DO_NOT` — don't rely on rest alone; recovery needs the depleting conditions
  removed too.

## Research claims to add (`registry.ts`, `area: "Wellbeing"`)

Each is a `Claim` with `why` (one plain sentence), `basis: "evidence"`,
`band`, resolvable `sources` from the report, and an honest `limit`. Proposed
ids:

| id | gist | band | key limit |
|---|---|---|---|
| `autonomy-strongest-lever` | Handing back real choice is the most reliable way to rebuild lost interest | adult | Effect established largely in older samples; direction holds, magnitude may not |
| `overjustification-reward-backfire` | Rewarding an activity a child already enjoys can halve how much they do it freely | 6-14 | Classic finding; strongest for already-interested children |
| `competence-optimal-challenge` | Interest recovers faster when tasks are hard enough to matter but achievable | 6-14 | Smaller lever than autonomy |
| `do-not-force-quit` | Making a child quit a loved activity outright tends to make things worse, not better | adult | Sports-sample evidence; a *chosen* pivot is different from a forced quit |
| `rest-alone-insufficient` | A break without changing what drained them rarely fixes burnout on its own | adult | Correlational; from athlete samples |
| `break-dosage` | A short break (days to about a week) helps; longer is not reliably better, and "off" means active in other ways | adult | **Sources diverge**: SDT favours short windows, sports-medicine prescribes weeks-to-months for severe cases (each `Claim.band` is a single value, so the mixed provenance lives in `limit`) |
| `dip-vs-disengagement` | A temporary dip usually clears within about two weeks; a persistent one is a signal to change the goal | adult | Rule of thumb from overreaching literature; not a diagnostic threshold |
| `goal-disengage-reengage` | Letting go of a dead-end goal *and* picking a new one beats pushing through or just stopping | adult | Established in older samples |

Exact source URLs come from the research report's per-finding `sources` lists.
The dosage divergence lives in the `break-dosage` claim's `limit` so it is shown,
not hidden. Bands are set honestly — most of this evidence is adult/older-sample,
which the `band` field + `limit` are designed to disclose.

## The panel + trigger (guide-console)

- **Trigger.** The `WellbeingStrip` already renders one row per specialization
  with the burnout state and (when escalating) a "Needs your review" note. Add a
  quiet **"See recovery steps"** affordance on rows whose `state` has a recovery
  plan (`recoveryFor(state) !== null`), and on the action line / roster row when
  `attention.reason === "ENGAGEMENT_FADING"`. Action-first, evidence-on-demand —
  consistent with the existing house pattern.
- **Panel.** A drawer (`<aside>`, same pattern as `MapsPanel`, toggled from
  `console.tsx`). Renders the `RecoveryPlan`: headline, the ordered moves each
  with its `does` sentence, an evidence-grade tag (reusing `basis.tsx` styling),
  and a `WhyThis` popover per move resolving its `claimIds`; then the break-dosage
  block and the dip-vs-pivot block. No child-facing content.

## Logged decision + roster marker (`app/recovery-log.ts`)

Browser-local and synthetic, carrying the same `SCOPE` caveat as `decisions.ts`
(real persistence is G3). **Separate from the hypothesis decision log** — a
recovery note is not a hypothesis transition and must not fold onto the store.

```ts
export interface RecoveryNote {
  readonly kidId: string;
  readonly specId: string | null;
  readonly trigger: RecoveryTrigger;
  readonly moveId?: string;   // the move the guide acted on, if any
  readonly note: string;      // e.g. "Started a 1-week step-away"
  readonly at: string;        // ISO timestamp
}
```

`parseRecoveryLog(raw)` mirrors `parseDecisionLog`: unparseable → `[]`,
half-valid → drop bad entries rather than throw. The guide records a note from
the panel; a small marker then shows on the Today roster row
(e.g. *"Recovery: step-away logged 3d ago"*) so it is visible without opening
the child. No effect on offers, gates, or the child surface.

## Break dosage (the one place the evidence diverges)

Presented as a range with the caveat surfaced, tailored to this app's context
(learning/passion, ages 9–12 — not competitive sport):

- **Primary:** a few days to about a week; longer is not reliably more effective
  (SDT re-engagement window).
- **Caveat (shown):** sports-medicine sources prescribe weeks-to-months for
  moderate–severe cases; "off" means **active in other ways, not total
  inactivity**. Carried in the `break-dosage` claim's `limit`.

## Dip vs. disengagement (when to pivot)

Every plan carries a `PivotGuidance` block: an acute dip typically clears within
~2 weeks and does not tank performance; disengagement persisting past ~2 weeks
with no recovery is a cue to treat it as a genuine dead-end and consider an
*autonomously-chosen* pivot. Decision support for the guide — never an automated
classification of the child.

## Testing

Vitest, repo conventions (one file per module; `renderToStaticMarkup` for
components; `.js` import extensions):

- `packages/wellbeing/test/recovery.test.ts` — `recoveryFor` returns the right
  tailored plan per trigger; returns `null` for non-recovery states; move
  ordering (strongest lever first); both `DO_NOT` guardrails present on every
  plan; immutability.
- `guide-console/test/recovery-panel.test.tsx` — renders moves + break/pivot
  blocks; every referenced `claimId` resolves in the research registry; the
  `DO_NOT` guardrails always render.
- `guide-console/test/recovery-log.test.ts` — round-trips notes; malformed
  entries dropped not thrown.
- Extend `guide-console/test/citations.test.ts` and `test/plain-language.test.ts`
  so the new Wellbeing claims resolve and stay jargon-free.

## Out of scope / known limitations

- **Instrumentation gap.** `EARLY_BURNOUT` and the `obsessiveTip` path of
  `BURNOUT_TIP` cannot currently fire, because `exhaustion` / `obsessiveTip` /
  `stakesEvent` / `successRate` are declared in `wellbeing/src/model.ts` but not
  derived in `derive.ts`. The recovery panel is built to be *ready* for those
  states and works today for `BURNOUT_TIP` (via `devaluation`) and
  `ENGAGEMENT_FADING`. Instrumenting the missing signals is a separate detection
  task, out of scope here.
- No child-facing surface, no gamification, no automated break enforcement.

## PR phasing (each < ~400 lines, per AGENTS.md)

- **PR1 — evidence + catalog (pure, no UI).** Research claims in
  `registry.ts` + `@gt100k/wellbeing/recovery.ts` + `recovery.test.ts`.
- **PR2 — panel + trigger.** `app/recovery.ts`, `app/recovery-panel.tsx`, the
  trigger affordance, drawer wiring, `recovery-panel.test.tsx`, citation/plain-
  language test extensions.
- **PR3 — logged decision + roster marker.** `app/recovery-log.ts`, the roster
  marker, `recovery-log.test.ts`.

## Definition of done

Matches this spec and the deep-research evidence base. Tests + docs updated. CI
green (`pnpm lint`, `pnpm typecheck`, `pnpm test`, plus per-app builds under
`passion/apps/`). Reviewed. Conventional Commits; each PR `Closes #<id>`.
