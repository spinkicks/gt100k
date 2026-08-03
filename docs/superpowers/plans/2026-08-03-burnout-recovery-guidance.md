# Burnout Recovery Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a burnout or fading-engagement signal is already flagged for a child, let a guide open a recovery panel of concrete, evidence-cited moves tailored to which signal fired, and record what they chose — without any child-facing surface or automated action.

**Architecture:** A pure recovery catalog in `@gt100k/wellbeing` (`recovery.ts`) maps a trigger (`BURNOUT_TIP` / `EARLY_BURNOUT` / `ENGAGEMENT_FADING`) to a `RecoveryPlan` of evidence-graded `RecoveryMove`s; the moves cite claims in `@gt100k/research`. The guide console renders the plan in a drawer opened from the wellbeing strip / action line, and records a browser-local, side-effect-free `RecoveryNote`.

**Tech Stack:** TypeScript (ESM, NodeNext — `.js` import extensions), React 18 / Next.js 14 App Router, Vitest (`renderToStaticMarkup` for components), pnpm workspaces.

## Global Constraints

- **pnpm only** (not npm/yarn). Run tests with `pnpm test` from the relevant package/app, or the package's own `test` script.
- **ESM with explicit `.js` extensions** on all relative imports (NodeNext).
- **`readonly` on all interface fields and array types**; catalog data is deeply readonly.
- **No child-facing output**: no score, label, or reward reaches a child; recovery is guide-facing only (016 guardrail). A logged recovery decision has **no** side effect on the child surface, hypothesis store, offers, or gates.
- **No cross-product imports**: never runtime-import `@gt100k/evidence-*`; recovery is passion-side. `@gt100k/wellbeing/recovery.ts` must not import `@gt100k/research` at runtime (claim ids are plain strings; resolution happens in the console).
- **Plain-language rule**: guide-facing copy must avoid the console's banned vocabulary (`plain-language.test.ts` `OURS`): among others `cell`, `spike`, `scaffold`, `autonomy`, `unprompted`, `broker`, `posterior`, `lower bound`, `heuristic`, `provenance`. Write copy in a teacher's words.
- **Research claim rule**: every `evidence` claim carries a resolvable `https://` source and a `band`; `band: "adult"` claims must carry a `limit` of >40 chars stating the population caveat (`bands.test.ts`).
- **Conventional Commits**; each PR `Closes #<id>`; PRs < ~400 lines; rebase on `origin/main`; CI green (`pnpm lint`, `pnpm typecheck`, `pnpm test`, plus per-app builds under `passion/apps/`).
- **Worktree**: work happens in the isolated worktree `.claude/worktrees/recovery-guidance` on branch `dev/prd/recovery-guidance`.

**Spec:** `docs/superpowers/specs/2026-08-03-burnout-recovery-guidance-design.md`.
**Evidence base:** `RESEARCH-once-a-learning-passion-development-app-for-childr-2026-08-03.md` (repo root).

---

## File structure

Created / modified, by responsibility:

- `passion/packages/research/src/registry.ts` — **modify**: add 7 `Wellbeing` claims.
- `passion/packages/research/test/bands.test.ts` — **modify**: update pinned adult-band count.
- `passion/packages/research/test/registry.test.ts` — **modify**: assert the 7 new ids resolve.
- `passion/packages/wellbeing/src/recovery.ts` — **create**: types + catalog + `recoveryFor`.
- `passion/packages/wellbeing/src/index.ts` — **modify**: export `./recovery.js`.
- `passion/packages/wellbeing/test/recovery.test.ts` — **create**: catalog structure/ordering/guardrails.
- `passion/apps/guide-console/app/recovery.ts` — **create**: trigger mapping + re-export.
- `passion/apps/guide-console/app/recovery-panel.tsx` — **create**: the drawer content.
- `passion/apps/guide-console/app/recovery-log.ts` — **create**: browser-local note log (PR3).
- `passion/apps/guide-console/app/wellbeing-strip.tsx` — **modify**: "See recovery steps" trigger.
- `passion/apps/guide-console/app/action-line.tsx` — **modify**: fading trigger.
- `passion/apps/guide-console/app/console.tsx` — **modify**: recovery drawer state + render.
- `passion/apps/guide-console/app/useConsole.ts` — **modify**: recovery-note plumbing (PR3).
- `passion/apps/guide-console/app/today.tsx` — **modify**: roster recovery marker (PR3).
- `passion/apps/guide-console/test/recovery.test.ts` — **create**: citation contract + trigger map.
- `passion/apps/guide-console/test/recovery-panel.test.tsx` — **create**: renders plan + guardrails.
- `passion/apps/guide-console/test/recovery-log.test.ts` — **create**: round-trip + malformed (PR3).
- `passion/apps/guide-console/test/plain-language.test.ts` — **modify**: scan recovery copy.
- `passion/apps/guide-console/app/globals.css` — **modify**: recovery drawer/panel styles.

---

# PR1 — Evidence + catalog (pure, no UI)

## Task 1: Research claims for recovery

**Files:**
- Modify: `passion/packages/research/src/registry.ts` (insert into the `// --- Wellbeing` section, after the `optimal-difficulty` claim ~line 306)
- Modify: `passion/packages/research/test/bands.test.ts:45`
- Modify: `passion/packages/research/test/registry.test.ts`

**Interfaces:**
- Consumes: `Claim`, `Source`, `Basis`, `EvidenceBand` from `@gt100k/research` (`packages/research/src/model.ts`).
- Produces: 7 new claim ids — `autonomy-strongest-lever`, `overjustification-reward-backfire`, `do-not-force-quit`, `rest-alone-insufficient`, `break-dosage`, `dip-vs-disengagement`, `goal-disengage-reengage`. (Task 2 and the console reference these by id.) The existing `optimal-difficulty` claim is reused for competence moves — do not duplicate it.

- [ ] **Step 1: Add the failing count assertion first**

The `bands.test.ts` count is currently pinned at 7 adult-band claims. Six of the new claims are `band: "adult"`, so the count becomes 13. Update the pin **before** adding claims so the test drives the change:

In `passion/packages/research/test/bands.test.ts`, change line ~45:

```ts
    // Pinned at the number actually verified. If this drops, either someone relabelled a band
    // without new evidence or a claim lost its sources, and both should fail rather than pass.
    expect(onAdults.length).toBe(13);
```

- [ ] **Step 2: Run the research tests to see the count fail**

Run: `pnpm --filter @gt100k/research test`
Expected: FAIL — `bands` count expects 13 but only 7 adult claims exist yet.

- [ ] **Step 3: Add the 7 claims**

In `passion/packages/research/src/registry.ts`, insert these into the `// ---- Wellbeing` block (after `optimal-difficulty`, before the `// ---- The plan` divider). Every `why` is one sentence (< 240 chars); every adult limit is > 40 chars.

```ts
  {
    id: "autonomy-strongest-lever",
    label: "Hand back real choices",
    area: "Wellbeing",
    basis: "evidence",
    band: "adult",
    why: "Handing real choices back to a child — over the bigger goal, not just today's task — is the most reliable way to rebuild interest that has faded.",
    sources: [
      { authors: "Ryan & Deci", year: 2020, url: "https://doi.org/10.1016/j.cedpsych.2020.101860" },
      { authors: "Vasconcellos, Parker, Hilland et al.", year: 2020, url: "https://doi.org/10.1037/edu0000420" },
    ],
    limit:
      "The largest effects here were measured in adolescents and adults rather than in nine-to-twelves; the direction is well established, the exact size is not a finding about this age.",
  },
  {
    id: "overjustification-reward-backfire",
    label: "Rewards can backfire",
    area: "Wellbeing",
    basis: "evidence",
    band: "structural",
    why: "Rewarding or grading something a child already enjoys can make them do it less once the reward stops, so praise the effort rather than paying for the result.",
    sources: [
      { authors: "Lepper, Greene & Nisbett", year: 1973, url: "https://doi.org/10.1037/h0035519" },
      { authors: "Deci, Koestner & Ryan", year: 1999, url: "https://doi.org/10.1037/0033-2909.125.6.627" },
    ],
    limit:
      "The classic demonstration was in preschoolers; a later meta-analysis finds the effect across ages, strongest when the child was already interested and the reward was expected.",
  },
  {
    id: "do-not-force-quit",
    label: "Don't force a full stop",
    area: "Wellbeing",
    basis: "evidence",
    band: "adult",
    why: "Making a child quit a loved activity outright tends to leave them worse off than a supported break does, so rest rather than stop.",
    sources: [
      { authors: "Gustafsson, Madigan & Lundkvist", year: 2017, url: "https://doi.org/10.1016/j.copsyc.2017.04.002" },
    ],
    limit:
      "The burnout-recovery evidence here is from competitive athletes, mostly adolescents and adults, and is correlational rather than a controlled trial in younger children.",
  },
  {
    id: "rest-alone-insufficient",
    label: "Rest alone isn't enough",
    area: "Wellbeing",
    basis: "evidence",
    band: "adult",
    why: "A break helps only if what drained the child is changed before they return, because rest without lowering the load lets the same strain rebuild.",
    sources: [
      { authors: "Kellmann, Bertollo, Bosquet et al.", year: 2018, url: "https://doi.org/10.1123/ijspp.2017-0759" },
      { authors: "American Academy of Pediatrics (Brenner et al.)", year: 2024, url: "https://doi.org/10.1542/peds.2023-065129" },
    ],
    limit:
      "This comes from recovery research and clinical guidance in youth and adult sport, not from a controlled study of a learning app, so treat it as a strong steer rather than a measured result here.",
  },
  {
    id: "break-dosage",
    label: "How long a break",
    area: "Wellbeing",
    basis: "evidence",
    band: "adult",
    why: "A short break of a few days to about a week is usually enough to reset a child, and time off should still be active rather than idle.",
    sources: [
      { authors: "Ryan & Deci", year: 2020, url: "https://doi.org/10.1016/j.cedpsych.2020.101860" },
      { authors: "American Academy of Pediatrics (Brenner et al.)", year: 2024, url: "https://doi.org/10.1542/peds.2023-065129" },
    ],
    limit:
      "Sources diverge on length: re-engagement research favours short windows of days to a month, while youth-sport medicine prescribes weeks to months for more severe cases; either way, \"off\" means doing other things, not total inactivity.",
  },
  {
    id: "dip-vs-disengagement",
    label: "A dip or a dead end",
    area: "Wellbeing",
    basis: "evidence",
    band: "adult",
    why: "A short dip in interest usually recovers within about two weeks, so a fade that lasts longer is a sign the goal itself needs to change.",
    sources: [
      { authors: "Meeusen, Duclos, Foster et al.", year: 2013, url: "https://doi.org/10.1249/MSS.0b013e318279a10a" },
    ],
    limit:
      "The two-week guide comes from the overtraining literature in athletes and is a rule of thumb for reading recovery, not a diagnostic threshold to apply to a particular child.",
  },
  {
    id: "goal-disengage-reengage",
    label: "Swap the goal, don't just stop",
    area: "Wellbeing",
    basis: "evidence",
    band: "adult",
    why: "When a goal has become a dead end, helping a child let it go and take up a new one protects wellbeing better than pushing on or simply stopping.",
    sources: [
      { authors: "Wrosch, Scheier, Miller, Schulz & Carver", year: 2003, url: "https://doi.org/10.1177/0146167203256921" },
    ],
    limit:
      "This was established in adults, and the part that predicts better wellbeing is the pairing — letting go of the old goal and taking up a new one — not letting go on its own.",
  },
```

- [ ] **Step 4: Assert the new ids resolve**

In `passion/packages/research/test/registry.test.ts`, add a test inside the `describe("research registry", ...)` block:

```ts
  it("resolves every recovery claim", () => {
    const ids = [
      "autonomy-strongest-lever",
      "overjustification-reward-backfire",
      "do-not-force-quit",
      "rest-alone-insufficient",
      "break-dosage",
      "dip-vs-disengagement",
      "goal-disengage-reengage",
    ];
    for (const id of ids) expect(claim(id)?.area, `${id} missing`).toBe("Wellbeing");
  });
```

- [ ] **Step 5: Run the research tests — all green**

Run: `pnpm --filter @gt100k/research test`
Expected: PASS. The `bands` count is 13; the well-formedness tests (one-sentence `why`, resolvable https sources, band on every evidence claim, >40-char adult limits) pass; the new ids resolve.

- [ ] **Step 6: Commit**

```bash
git add passion/packages/research/src/registry.ts passion/packages/research/test/bands.test.ts passion/packages/research/test/registry.test.ts
git commit -m "feat(research): add recovery-guidance wellbeing claims"
```

## Task 2: Recovery catalog in `@gt100k/wellbeing`

**Files:**
- Create: `passion/packages/wellbeing/src/recovery.ts`
- Modify: `passion/packages/wellbeing/src/index.ts:9` (add export)
- Test: `passion/packages/wellbeing/test/recovery.test.ts`

**Interfaces:**
- Consumes: `WellbeingState` from `./model.js`.
- Produces:
  - `type RecoveryTrigger = "BURNOUT_TIP" | "EARLY_BURNOUT" | "ENGAGEMENT_FADING"`
  - `type EvidenceGrade = "controlled-in-children" | "correlational-or-older-sample" | "reasoned"`
  - `type RecoveryMoveKind = "SUBTRACT" | "RESTORE_AUTONOMY" | "REBUILD_COMPETENCE" | "BREAK" | "RENEGOTIATE_GOAL" | "DO_NOT"`
  - `interface RecoveryMove { id; kind; does; claimIds; grade }`
  - `interface BreakGuidance { headline; detail; claimIds }`
  - `interface PivotGuidance { headline; detail; claimIds }`
  - `interface RecoveryPlan { trigger; headline; moves; breakGuidance?; pivotGuidance }`
  - `function recoveryFor(trigger: string): RecoveryPlan | null`

- [ ] **Step 1: Write the failing test**

Create `passion/packages/wellbeing/test/recovery.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { recoveryFor, type RecoveryTrigger } from "../src/recovery.js";

const TRIGGERS: readonly RecoveryTrigger[] = ["BURNOUT_TIP", "EARLY_BURNOUT", "ENGAGEMENT_FADING"];

describe("recoveryFor", () => {
  it("returns null for a state that is not a recovery signal", () => {
    expect(recoveryFor("IN_ZONE")).toBeNull();
    expect(recoveryFor("GAP")).toBeNull();
    expect(recoveryFor("nonsense")).toBeNull();
  });

  it("returns a tailored plan for each recovery trigger", () => {
    for (const t of TRIGGERS) {
      const plan = recoveryFor(t);
      expect(plan, `${t} has no plan`).not.toBeNull();
      expect(plan!.trigger).toBe(t);
      expect(plan!.headline.length).toBeGreaterThan(0);
      expect(plan!.moves.length).toBeGreaterThan(0);
      expect(plan!.pivotGuidance.claimIds.length).toBeGreaterThan(0);
    }
  });

  it("carries both DO_NOT guardrails on every plan", () => {
    for (const t of TRIGGERS) {
      const ids = recoveryFor(t)!.moves.filter((m) => m.kind === "DO_NOT").map((m) => m.id);
      expect(ids, `${t} missing guardrails`).toEqual(
        expect.arrayContaining(["do-not-quit", "do-not-rest-only"]),
      );
    }
  });

  it("orders the guardrails last, after the active moves", () => {
    for (const t of TRIGGERS) {
      const moves = recoveryFor(t)!.moves;
      const firstDoNot = moves.findIndex((m) => m.kind === "DO_NOT");
      const lastActive = moves.map((m) => m.kind !== "DO_NOT").lastIndexOf(true);
      expect(firstDoNot, `${t} interleaves guardrails`).toBeGreaterThan(lastActive);
    }
  });

  it("gives EARLY_BURNOUT a break, and does not give BURNOUT_TIP one", () => {
    expect(recoveryFor("EARLY_BURNOUT")!.breakGuidance).toBeDefined();
    expect(recoveryFor("BURNOUT_TIP")!.breakGuidance).toBeUndefined();
  });

  it("leads ENGAGEMENT_FADING with the autonomy move", () => {
    expect(recoveryFor("ENGAGEMENT_FADING")!.moves[0]?.kind).toBe("RESTORE_AUTONOMY");
  });

  it("gives every move a non-empty claim reference and a grade", () => {
    for (const t of TRIGGERS) {
      for (const m of recoveryFor(t)!.moves) {
        expect(m.claimIds.length, `${m.id} has no claim`).toBeGreaterThan(0);
        expect(["controlled-in-children", "correlational-or-older-sample", "reasoned"]).toContain(
          m.grade,
        );
      }
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @gt100k/wellbeing test`
Expected: FAIL — cannot resolve `../src/recovery.js`.

- [ ] **Step 3: Write the recovery module**

Create `passion/packages/wellbeing/src/recovery.ts`:

```ts
// @gt100k/wellbeing/recovery — what a guide DOES once a burnout or fading signal is already flagged.
//
// Companion to assess.ts: assess.ts says WHAT STATE a child's play is in; recovery.ts says WHAT TO
// DO about it. Both are pure and guide-facing; neither touches the child, and there is no child-
// facing label, score, or reward here either (016 guardrail).
//
// Moves are graded, subtraction-first, and aimed at the ADULT — the one place this literature has
// controlled child evidence is changing what the grown-ups do. Each move points at research claims
// by id (the surface resolves them via @gt100k/research); this module carries no sources of its own
// and imports no other package at runtime, so it stays trivially portable and testable.

import type { WellbeingState } from "./model.js";

/** How much weight a move deserves, strongest to weakest. Mirrors @gt100k/motivation's grading so a
 *  guide reads the same words wherever a move appears; copied, not imported, to keep this module's
 *  runtime dependency surface empty. */
export type EvidenceGrade =
  | "controlled-in-children"
  | "correlational-or-older-sample"
  | "reasoned";

export type RecoveryMoveKind =
  | "SUBTRACT"
  | "RESTORE_AUTONOMY"
  | "REBUILD_COMPETENCE"
  | "BREAK"
  | "RENEGOTIATE_GOAL"
  | "DO_NOT";

export interface RecoveryMove {
  readonly id: string;
  readonly kind: RecoveryMoveKind;
  /** One sentence a guide can act on this week, in a teacher's words. */
  readonly does: string;
  /** Claim ids into @gt100k/research; the surface turns them into WhyThis popovers. */
  readonly claimIds: readonly string[];
  readonly grade: EvidenceGrade;
}

export interface BreakGuidance {
  readonly headline: string;
  readonly detail: string;
  readonly claimIds: readonly string[];
}

export interface PivotGuidance {
  readonly headline: string;
  readonly detail: string;
  readonly claimIds: readonly string[];
}

/** The signals a plan can be built for: the two burnout states, plus the console's own fading-
 *  engagement signal (engagement.ts), which is not a WellbeingState. */
export type RecoveryTrigger =
  | Extract<WellbeingState, "BURNOUT_TIP" | "EARLY_BURNOUT">
  | "ENGAGEMENT_FADING";

export interface RecoveryPlan {
  readonly trigger: RecoveryTrigger;
  readonly headline: string;
  /** Ordered strongest lever first; the two DO_NOT guardrails always come last. */
  readonly moves: readonly RecoveryMove[];
  readonly breakGuidance?: BreakGuidance;
  readonly pivotGuidance: PivotGuidance;
}

// The two guardrails every plan carries: the two most common ways an adult makes burnout worse.
const DO_NOT_QUIT: RecoveryMove = {
  id: "do-not-quit",
  kind: "DO_NOT",
  does: "Don't make the child quit outright — a forced, total stop tends to leave them worse off than a supported break, so rest rather than stop.",
  claimIds: ["do-not-force-quit"],
  grade: "correlational-or-older-sample",
};

const DO_NOT_REST_ONLY: RecoveryMove = {
  id: "do-not-rest-only",
  kind: "DO_NOT",
  does: "Don't rely on the break alone — if the pressure or workload that drained them is still there when they return, it builds straight back up.",
  claimIds: ["rest-alone-insufficient"],
  grade: "correlational-or-older-sample",
};

const GUARDRAILS: readonly RecoveryMove[] = [DO_NOT_QUIT, DO_NOT_REST_ONLY];

const PIVOT: PivotGuidance = {
  headline: "Is this a dip or a dead end?",
  detail:
    "A short dip usually clears within about two weeks and doesn't dent how well they do. If low interest and few return visits last past that, treat the goal as one that no longer fits — and change it with the child, not for them.",
  claimIds: ["dip-vs-disengagement", "goal-disengage-reengage"],
};

const SHORT_BREAK: BreakGuidance = {
  headline: "A few days to about a week away.",
  detail:
    "For this age and setting a short break is usually enough, and longer isn't reliably better. \"Off\" means doing other things they enjoy, not sitting still — total inactivity tends to backfire.",
  claimIds: ["break-dosage"],
};

const PLANS: Readonly<Record<RecoveryTrigger, RecoveryPlan>> = {
  BURNOUT_TIP: {
    trigger: "BURNOUT_TIP",
    headline: "Ease the pressure and protect free play.",
    moves: [
      {
        id: "drop-external-pressure",
        kind: "SUBTRACT",
        does: "Stop using rewards, grades, or being watched as the reason to do it — notice the effort, don't pay for the result.",
        claimIds: ["overjustification-reward-backfire"],
        grade: "controlled-in-children",
      },
      {
        id: "protect-free-play",
        kind: "SUBTRACT",
        does: "Guard free, unwatched time with the activity, and don't fill the freed-up time with more organised practice.",
        claimIds: ["overjustification-reward-backfire"],
        grade: "reasoned",
      },
      {
        id: "keep-it-doable",
        kind: "REBUILD_COMPETENCE",
        does: "Keep tasks hard enough to matter but clearly doable, and give specific, honest praise when they land one.",
        claimIds: ["optimal-difficulty"],
        grade: "correlational-or-older-sample",
      },
      ...GUARDRAILS,
    ],
    pivotGuidance: PIVOT,
  },
  EARLY_BURNOUT: {
    trigger: "EARLY_BURNOUT",
    headline: "A real break — and change what's draining them.",
    moves: [
      {
        id: "take-a-break",
        kind: "BREAK",
        does: "Give a genuine, guilt-free break from this activity now.",
        claimIds: ["break-dosage"],
        grade: "correlational-or-older-sample",
      },
      {
        id: "remove-the-load",
        kind: "SUBTRACT",
        does: "Before they come back, cut the load or pressure that led here — don't just rest and return to the same setup.",
        claimIds: ["rest-alone-insufficient"],
        grade: "correlational-or-older-sample",
      },
      {
        id: "re-enter-gently",
        kind: "REBUILD_COMPETENCE",
        does: "Come back through small, clearly winnable tasks so the first sessions back end on a high.",
        claimIds: ["optimal-difficulty"],
        grade: "correlational-or-older-sample",
      },
      ...GUARDRAILS,
    ],
    breakGuidance: SHORT_BREAK,
    pivotGuidance: PIVOT,
  },
  ENGAGEMENT_FADING: {
    trigger: "ENGAGEMENT_FADING",
    headline: "Hand back control, and check the goal still fits.",
    moves: [
      {
        id: "restore-choice",
        kind: "RESTORE_AUTONOMY",
        does: "Give real choices back — over what they do and how, and over the bigger goal, not just today's task; this is the strongest lever you have.",
        claimIds: ["autonomy-strongest-lever"],
        grade: "correlational-or-older-sample",
      },
      {
        id: "renegotiate-goal",
        kind: "RENEGOTIATE_GOAL",
        does: "If the goal has become a dead end, help them let it go and pick a new one — a chosen switch beats both pushing through and simply stopping.",
        claimIds: ["goal-disengage-reengage"],
        grade: "correlational-or-older-sample",
      },
      ...GUARDRAILS,
    ],
    pivotGuidance: PIVOT,
  },
};

/**
 * The recovery plan for a trigger, or null when the state is not a burnout/fading signal, so a
 * caller never renders an empty panel. Pure and total: any unknown string returns null.
 */
export function recoveryFor(trigger: string): RecoveryPlan | null {
  return (PLANS as Record<string, RecoveryPlan>)[trigger] ?? null;
}
```

- [ ] **Step 4: Export it from the package index**

In `passion/packages/wellbeing/src/index.ts`, add after the `derive.js` export (line 9):

```ts
export * from "./recovery.js";
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @gt100k/wellbeing test`
Expected: PASS (all recovery tests, and the existing wellbeing suite still green).

- [ ] **Step 6: Commit**

```bash
git add passion/packages/wellbeing/src/recovery.ts passion/packages/wellbeing/src/index.ts passion/packages/wellbeing/test/recovery.test.ts
git commit -m "feat(wellbeing): add per-state recovery catalog"
```

- [ ] **Step 7: Open PR1**

```bash
git push -u origin dev/prd/recovery-guidance
gh pr create --draft --title "feat: burnout recovery evidence + catalog (PR1)" \
  --body "$(cat <<'EOF'
Adds the evidence base and pure recovery catalog for the guide-console recovery panel (spec: docs/superpowers/specs/2026-08-03-burnout-recovery-guidance-design.md).

- 7 new `Wellbeing` research claims (recovery interventions), each cited + banded, with honest limits.
- `@gt100k/wellbeing/recovery.ts`: `recoveryFor(trigger)` → tailored `RecoveryPlan` for BURNOUT_TIP / EARLY_BURNOUT / ENGAGEMENT_FADING, subtraction-first, evidence-graded, guardrails last.
- No UI, no runtime cross-package import.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

# PR2 — Panel + trigger

## Task 3: Recovery view-model glue + citation contract

**Files:**
- Create: `passion/apps/guide-console/app/recovery.ts`
- Test: `passion/apps/guide-console/test/recovery.test.ts`

**Interfaces:**
- Consumes: `recoveryFor`, `RecoveryPlan`, `RecoveryTrigger` from `@gt100k/wellbeing`; `WellbeingState` (via `read.state`) from the console's `WellbeingCardVM`; `claim` from `@gt100k/research`.
- Produces:
  - `function recoveryTriggerForState(state: string): RecoveryTrigger | null` — maps a wellbeing `read.state` to a recovery trigger (the two burnout states), else null.
  - re-exports `recoveryFor`, and types `RecoveryPlan`, `RecoveryMove`, `RecoveryTrigger`, `BreakGuidance`, `PivotGuidance`, `EvidenceGrade` for the panel to import from one place.
  - `function planClaimIds(plan: RecoveryPlan): string[]` — every claim id a plan references (moves + break + pivot), deduped; used by the citation contract test and unused elsewhere at runtime (kept small).

- [ ] **Step 1: Write the failing test**

Create `passion/apps/guide-console/test/recovery.test.ts`:

```ts
// The console's side of the recovery citation contract. recoveryFor lives in @gt100k/wellbeing and
// references research claims by id; a typo or a renamed claim would silently drop the reason from a
// move's WhyThis. This is the loud part.
import { describe, expect, test } from "vitest";
import { claim } from "@gt100k/research";
import { recoveryFor } from "@gt100k/wellbeing";
import { planClaimIds, recoveryTriggerForState } from "../app/recovery.js";

const TRIGGERS = ["BURNOUT_TIP", "EARLY_BURNOUT", "ENGAGEMENT_FADING"] as const;

describe("recovery citations", () => {
  test("every claim id referenced by every plan resolves in the registry", () => {
    for (const t of TRIGGERS) {
      const plan = recoveryFor(t)!;
      for (const id of planClaimIds(plan)) {
        expect(claim(id), `${t} references ${id}, which is not in the registry`).toBeDefined();
      }
    }
  });
});

describe("recoveryTriggerForState", () => {
  test("maps the two burnout states to a trigger", () => {
    expect(recoveryTriggerForState("BURNOUT_TIP")).toBe("BURNOUT_TIP");
    expect(recoveryTriggerForState("EARLY_BURNOUT")).toBe("EARLY_BURNOUT");
  });
  test("returns null for states with no recovery plan", () => {
    expect(recoveryTriggerForState("IN_ZONE")).toBeNull();
    expect(recoveryTriggerForState("GAP")).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @gt100k/guide-console test -- recovery`
Expected: FAIL — cannot resolve `../app/recovery.js`.

- [ ] **Step 3: Write the glue module**

Create `passion/apps/guide-console/app/recovery.ts`:

```ts
// The console's recovery surface, glued to the pure catalog in @gt100k/wellbeing.
//
// recoveryFor takes a trigger; the wellbeing STRIP hands us a read.state (a WellbeingState), and the
// engagement signal hands us a fading flag. This module is the one place that turns each of those
// into a trigger, so the panel and the trigger buttons never disagree about when recovery applies.
import {
  recoveryFor,
  type BreakGuidance,
  type EvidenceGrade,
  type PivotGuidance,
  type RecoveryMove,
  type RecoveryPlan,
  type RecoveryTrigger,
} from "@gt100k/wellbeing";

export { recoveryFor };
export type { BreakGuidance, EvidenceGrade, PivotGuidance, RecoveryMove, RecoveryPlan, RecoveryTrigger };

/** A wellbeing read.state has a recovery plan only for the two burnout states. Everything else — a
 *  healthy or merely watchful state — returns null so no trigger button appears. */
export function recoveryTriggerForState(state: string): RecoveryTrigger | null {
  return state === "BURNOUT_TIP" || state === "EARLY_BURNOUT" ? state : null;
}

/** Every claim id a plan references, deduped. Used by the citation contract test. */
export function planClaimIds(plan: RecoveryPlan): string[] {
  const ids = new Set<string>();
  for (const m of plan.moves) for (const id of m.claimIds) ids.add(id);
  for (const id of plan.breakGuidance?.claimIds ?? []) ids.add(id);
  for (const id of plan.pivotGuidance.claimIds) ids.add(id);
  return [...ids];
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @gt100k/guide-console test -- recovery`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add passion/apps/guide-console/app/recovery.ts passion/apps/guide-console/test/recovery.test.ts
git commit -m "feat(guide-console): recovery trigger mapping + citation contract"
```

## Task 4: The recovery panel component

**Files:**
- Create: `passion/apps/guide-console/app/recovery-panel.tsx`
- Test: `passion/apps/guide-console/test/recovery-panel.test.tsx`
- Modify: `passion/apps/guide-console/app/globals.css` (append recovery styles)

**Interfaces:**
- Consumes: `RecoveryPlan`, `RecoveryMove`, `EvidenceGrade` from `./recovery.js`; `WhyThis` from `./why.js`.
- Produces: `function RecoveryPanel({ plan }: { plan: RecoveryPlan }): JSX.Element` — the drawer body. (Task 7 adds an optional logging prop; keep the signature extensible by using a props object.)

- [ ] **Step 1: Write the failing component test**

Create `passion/apps/guide-console/test/recovery-panel.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { recoveryFor } from "@gt100k/wellbeing";
import { RecoveryPanel } from "../app/recovery-panel.js";

function render(trigger: string): string {
  return renderToStaticMarkup(<RecoveryPanel plan={recoveryFor(trigger)!} />);
}

describe("RecoveryPanel", () => {
  test("shows the plan headline and every move's instruction", () => {
    const html = render("BURNOUT_TIP");
    expect(html).toContain("Ease the pressure");
    expect(html).toContain("Stop using rewards");
    expect(html).toContain("Keep tasks hard enough to matter");
  });

  test("always renders both guardrails as things to avoid", () => {
    const html = render("ENGAGEMENT_FADING");
    expect(html).toContain("Don't make the child quit");
    expect(html).toContain("Don't rely on the break alone");
    // Guardrails carry the avoid modifier so they read as a warning, not another step.
    expect(html).toContain("recmove--avoid");
  });

  test("shows the break block only when the plan has one", () => {
    expect(render("EARLY_BURNOUT")).toContain("A few days to about a week");
    expect(render("BURNOUT_TIP")).not.toContain("A few days to about a week");
  });

  test("always shows the dip-vs-dead-end guidance", () => {
    expect(render("BURNOUT_TIP")).toContain("Is this a dip or a dead end?");
  });

  test("renders a why button for a cited move (claim resolves)", () => {
    // WhyThis renders its info button only when the claim id resolves, so its presence proves the
    // move's citation is wired through to the registry.
    expect(render("ENGAGEMENT_FADING")).toContain("why-btn");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @gt100k/guide-console test -- recovery-panel`
Expected: FAIL — cannot resolve `../app/recovery-panel.js`.

- [ ] **Step 3: Write the component**

Create `passion/apps/guide-console/app/recovery-panel.tsx`:

```tsx
"use client";

// The recovery panel: what a guide DOES once a burnout or fading signal is already flagged.
//
// It opens on demand from the wellbeing strip or the action line (see console.tsx), so it never
// competes with the strip for height — the strip stays the always-on summary, this is the step a
// guide takes when they decide to act. The moves are the point, so they are the loudest thing here;
// each carries a quiet "why?" resolving to the research behind it, and the two guardrails sit apart
// as things to avoid rather than as two more steps. No child-facing content, ever.
import type { JSX } from "react";

import type { EvidenceGrade, RecoveryMove, RecoveryPlan } from "./recovery.js";
import { WhyThis } from "./why.js";

// Evidence strength in a teacher's words, told apart by text first and colour second, the same way
// BasisTag treats a claim's basis. Not "grade" on screen: a teacher reads how much to trust it.
const GRADE_LABEL: Record<EvidenceGrade, string> = {
  "controlled-in-children": "Tested with children",
  "correlational-or-older-sample": "From related or older-age studies",
  reasoned: "Our best reasoning",
};

function Move({ move }: { move: RecoveryMove }): JSX.Element {
  const avoid = move.kind === "DO_NOT";
  return (
    <li className={`recmove${avoid ? " recmove--avoid" : ""}`}>
      <span className="recmove__does">{move.does}</span>
      <span className="recmove__meta">
        <span className={`recmove__grade recmove__grade--${move.grade}`}>
          {GRADE_LABEL[move.grade]}
        </span>
        {move.claimIds.map((id) => (
          <WhyThis key={id} id={id} what="this step" />
        ))}
      </span>
    </li>
  );
}

export function RecoveryPanel({ plan }: { plan: RecoveryPlan }): JSX.Element {
  // The active moves lead; the guardrails ("what not to do") sit in their own group so a guide does
  // not read "Don't make the child quit" as the next thing to try.
  const active = plan.moves.filter((m) => m.kind !== "DO_NOT");
  const avoid = plan.moves.filter((m) => m.kind === "DO_NOT");

  return (
    <div className="recovery">
      <h2 className="recovery__headline">{plan.headline}</h2>

      <ol className="recovery__moves">
        {active.map((m) => (
          <Move key={m.id} move={m} />
        ))}
      </ol>

      {plan.breakGuidance ? (
        <section className="recovery__break">
          <h3 className="recovery__subhd">How long a break?</h3>
          <p className="recovery__breakhd">
            {plan.breakGuidance.headline}
            {plan.breakGuidance.claimIds.map((id) => (
              <WhyThis key={id} id={id} what="the break length" />
            ))}
          </p>
          <p className="recovery__breakdetail">{plan.breakGuidance.detail}</p>
        </section>
      ) : null}

      <section className="recovery__pivot">
        <h3 className="recovery__subhd">
          {plan.pivotGuidance.headline}
          {plan.pivotGuidance.claimIds.map((id) => (
            <WhyThis key={id} id={id} what="this" />
          ))}
        </h3>
        <p className="recovery__pivotdetail">{plan.pivotGuidance.detail}</p>
      </section>

      {avoid.length > 0 ? (
        <section className="recovery__avoid" aria-label="What to avoid">
          <h3 className="recovery__subhd">What to avoid</h3>
          <ul className="recovery__moves recovery__moves--avoid">
            {avoid.map((m) => (
              <Move key={m.id} move={m} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Add the styles**

Append to `passion/apps/guide-console/app/globals.css` (match the existing drawer look; `.mapdrawer` is the sibling pattern):

```css
/* Recovery drawer — opened on demand from the wellbeing strip / action line, same aside pattern as
   the maps drawer. The moves are the loudest thing; guardrails read as a warning, not a step. */
.recoverydrawer {
  /* Mirror .mapdrawer positioning/width so the two drawers behave identically. */
}
.recovery__headline { font-size: 1.05rem; margin: 0 0 0.75rem; }
.recovery__moves { list-style: none; margin: 0 0 1rem; padding: 0; display: grid; gap: 0.6rem; }
.recmove { padding: 0.6rem 0.7rem; border-radius: 8px; background: #f4f7f9; }
.recmove__does { display: block; color: #33505c; }
.recmove__meta { display: inline-flex; align-items: center; gap: 0.4rem; margin-top: 0.3rem; }
.recmove__grade { font-size: 0.72rem; color: #4a6470; }
.recmove--avoid { background: #fbf2ef; }
.recovery__subhd { font-size: 0.9rem; color: #33505c; margin: 0.9rem 0 0.35rem; }
.recovery__break, .recovery__pivot, .recovery__avoid { margin-top: 0.8rem; }
```

(Confirm `.mapdrawer`'s exact rules in `globals.css` and give `.recoverydrawer` the same `position`/`width`/`border` so the drawer lands where the maps drawer does.)

- [ ] **Step 5: Run to verify it passes**

Run: `pnpm --filter @gt100k/guide-console test -- recovery-panel`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add passion/apps/guide-console/app/recovery-panel.tsx passion/apps/guide-console/test/recovery-panel.test.tsx passion/apps/guide-console/app/globals.css
git commit -m "feat(guide-console): recovery panel component"
```

## Task 5: Wire the trigger into the strip, action line, and drawer

**Files:**
- Modify: `passion/apps/guide-console/app/wellbeing-strip.tsx`
- Modify: `passion/apps/guide-console/app/action-line.tsx`
- Modify: `passion/apps/guide-console/app/console.tsx`
- Modify: `passion/apps/guide-console/test/plain-language.test.ts`

**Interfaces:**
- Consumes: `recoveryTriggerForState` and `RecoveryTrigger` from `./recovery.js`; `recoveryFor` for the drawer body.
- Produces: an `onRecover(trigger: RecoveryTrigger, specId: string | null) => void` callback threaded from `console.tsx` into `WellbeingStrip` and `ActionLine`; recovery drawer state in `console.tsx`.

- [ ] **Step 1: Add the recovery trigger to the wellbeing strip**

In `passion/apps/guide-console/app/wellbeing-strip.tsx`:

Change the component signature to accept the callback and each row's spec id:

```tsx
import { recoveryTriggerForState } from "./recovery.js";
import type { RecoveryTrigger } from "./recovery.js";

export function WellbeingStrip({
  cards,
  onRecover,
}: {
  readonly cards: readonly WellbeingCardVM[];
  readonly onRecover?: (trigger: RecoveryTrigger, specId: string | null) => void;
}): JSX.Element | null {
```

Then, inside the `.map((c) => ...)` row, after the `escalateToHuman` review block, add a recovery button when the state has a plan:

```tsx
          {onRecover !== undefined && recoveryTriggerForState(c.read.state) !== null ? (
            // Action-first, evidence-on-demand: the strip stays the summary, and the concrete
            // recovery steps open in a drawer only when the guide asks for them.
            <button
              type="button"
              className="wbstrip__recover"
              onClick={() => onRecover(recoveryTriggerForState(c.read.state)!, c.id)}
            >
              See recovery steps
            </button>
          ) : null}
```

- [ ] **Step 2: Add the fading trigger to the action line**

In `passion/apps/guide-console/app/action-line.tsx`, add an `onRecover` prop and, where the verdict is rendered, show the button when `reason === "ENGAGEMENT_FADING"`. (Open `action-line.tsx` to find the reason/specId in scope; the attention verdict exposes `reason` and `specId`.)

```tsx
import type { RecoveryTrigger } from "./recovery.js";
// ...in the props type:
//   readonly onRecover?: (trigger: RecoveryTrigger, specId: string | null) => void;
// ...where the ENGAGEMENT_FADING verdict renders:
{onRecover !== undefined && attention.reason === "ENGAGEMENT_FADING" ? (
  <button
    type="button"
    className="actionline__recover"
    onClick={() => onRecover("ENGAGEMENT_FADING", attention.specId)}
  >
    See recovery steps
  </button>
) : null}
```

- [ ] **Step 3: Hold the drawer state and render it in `console.tsx`**

In `passion/apps/guide-console/app/console.tsx`:

Add imports:

```tsx
import { RecoveryPanel } from "./recovery-panel.js";
import { recoveryFor, type RecoveryTrigger } from "./recovery.js";
```

Add state beside `mapsOpen` (~line 79):

```tsx
  // The recovery drawer: opened on demand from the strip (a burnout row) or the action line (a
  // fading verdict), holding the trigger so the panel shows the tailored plan. Null = closed.
  const [recovery, setRecovery] = useState<{ trigger: RecoveryTrigger; specId: string | null } | null>(null);
  const onRecover = (trigger: RecoveryTrigger, specId: string | null): void =>
    setRecovery({ trigger, specId });
```

Pass `onRecover` to the strip (line ~320) and the action line (line ~283):

```tsx
            <ActionLine ctrl={ctrl} onReviewFamily={() => setView("family")} onRecover={onRecover} />
```
```tsx
            <WellbeingStrip cards={scopedTo(ctrl.wellbeing)} onRecover={onRecover} />
```

Render the drawer beside the maps drawer (after the `{mapsOpen ? ... : null}` block, ~line 416):

```tsx
          {recovery !== null ? (
            <aside className="mapdrawer recoverydrawer" aria-label="Recovery steps">
              <div className="mapdrawer__head">
                <span>Recovery steps</span>
                <button type="button" className="linkbtn" onClick={() => setRecovery(null)}>
                  Close
                </button>
              </div>
              <RecoveryPanel plan={recoveryFor(recovery.trigger)!} />
            </aside>
          ) : null}
```

- [ ] **Step 4: Extend the plain-language guard to cover recovery copy**

In `passion/apps/guide-console/test/plain-language.test.ts`, add `recoveryFor` to the imports and a test that scans every user-facing recovery string against `OURS`:

```ts
import { recoveryFor } from "@gt100k/wellbeing";

// ...inside describe("what an engine puts in front of a guide", () => { ... })
  it("keeps recovery guidance in the guide's words", () => {
    const triggers = ["BURNOUT_TIP", "EARLY_BURNOUT", "ENGAGEMENT_FADING"] as const;
    for (const t of triggers) {
      const plan = recoveryFor(t)!;
      const strings = [
        plan.headline,
        ...plan.moves.map((m) => m.does),
        plan.breakGuidance?.headline ?? "",
        plan.breakGuidance?.detail ?? "",
        plan.pivotGuidance.headline,
        plan.pivotGuidance.detail,
      ];
      for (const s of strings) {
        for (const bad of OURS) {
          expect(s, `recovery copy for ${t} uses our vocabulary: "${s}"`).not.toMatch(bad);
        }
      }
    }
  });
```

- [ ] **Step 5: Run the console tests + typecheck**

Run: `pnpm --filter @gt100k/guide-console test`
Run: `pnpm --filter @gt100k/guide-console exec tsc -b`
Expected: PASS. If the plain-language scan flags a word, fix the copy in `recovery.ts` (PR1 file) to a plainer synonym and re-run — do not weaken the banned list.

- [ ] **Step 6: Verify it works in the running app**

Run the guide console (`pnpm --filter @gt100k/guide-console dev`, dev port 3020) and confirm: a child with a `BURNOUT_TIP` row (e.g. one of the pilot children with devaluation) shows "See recovery steps"; clicking opens the drawer with the tailored plan; a "why?" button opens a source popover; Close dismisses it. (See CLAUDE memory on the dev-server port gotcha.)

- [ ] **Step 7: Commit + open PR2**

```bash
git add passion/apps/guide-console/app/wellbeing-strip.tsx passion/apps/guide-console/app/action-line.tsx passion/apps/guide-console/app/console.tsx passion/apps/guide-console/test/plain-language.test.ts
git commit -m "feat(guide-console): open recovery panel from strip and action line"
git push
gh pr create --draft --title "feat: burnout recovery panel + trigger (PR2)" --body "Second slice of the recovery guidance feature. Renders the recovery plan in a drawer opened from the wellbeing strip (burnout rows) and the action line (fading). Depends on PR1.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

---

# PR3 — Logged decision + roster marker

## Task 6: The recovery note log

**Files:**
- Create: `passion/apps/guide-console/app/recovery-log.ts`
- Test: `passion/apps/guide-console/test/recovery-log.test.ts`

**Interfaces:**
- Consumes: `RecoveryTrigger` from `./recovery.js`.
- Produces:
  - `const RECOVERY_KEY = "gt100k.guide-console.recovery"`
  - `interface RecoveryNote { kidId; specId; trigger; moveId?; note; at }`
  - `function parseRecoveryLog(raw: string | null): RecoveryNote[]`
  - `function latestNoteFor(notes: readonly RecoveryNote[], kidId: string): RecoveryNote | null`

- [ ] **Step 1: Write the failing test**

Create `passion/apps/guide-console/test/recovery-log.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { latestNoteFor, parseRecoveryLog, type RecoveryNote } from "../app/recovery-log.js";

const NOTE: RecoveryNote = {
  kidId: "001",
  specId: "h1",
  trigger: "BURNOUT_TIP",
  moveId: "take-a-break",
  note: "Started a 1-week step-away",
  at: "2026-08-03T10:00:00.000Z",
};

describe("parseRecoveryLog", () => {
  test("round-trips a valid log", () => {
    expect(parseRecoveryLog(JSON.stringify([NOTE]))).toEqual([NOTE]);
  });
  test("returns [] for null or unparseable input", () => {
    expect(parseRecoveryLog(null)).toEqual([]);
    expect(parseRecoveryLog("{not json")).toEqual([]);
    expect(parseRecoveryLog(JSON.stringify({ not: "an array" }))).toEqual([]);
  });
  test("drops malformed entries rather than throwing", () => {
    const raw = JSON.stringify([NOTE, { kidId: 5 }, { note: "no kid" }]);
    expect(parseRecoveryLog(raw)).toEqual([NOTE]);
  });
});

describe("latestNoteFor", () => {
  test("returns the most recent note for a child, or null", () => {
    const older: RecoveryNote = { ...NOTE, note: "older", at: "2026-08-01T00:00:00.000Z" };
    expect(latestNoteFor([older, NOTE], "001")?.note).toBe("Started a 1-week step-away");
    expect(latestNoteFor([NOTE], "999")).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @gt100k/guide-console test -- recovery-log`
Expected: FAIL — cannot resolve `../app/recovery-log.js`.

- [ ] **Step 3: Write the log module**

Create `passion/apps/guide-console/app/recovery-log.ts`:

```ts
// The guide's recovery notes: what a human decided to do about a burnout/fading flag, kept so a
// reload does not lose it.
//
// SEPARATE FROM decisions.ts ON PURPOSE. A hypothesis decision (promote/park/…) folds onto the 013
// store through the domain's own actions; a recovery note is not a store transition and must not
// touch the store, the child surface, offers, or gates. It is advisory record-keeping, nothing more.
//
// SCOPE. Browser-local and synthetic, exactly like decisions.ts: real persistence is G3 (identity,
// consent, retention), and until that exists there is nowhere honest to put these but the browser
// that made them. Anything unparseable is treated as no notes rather than a thrown error, and a
// half-valid log costs the bad entries rather than the whole session.
import type { RecoveryTrigger } from "./recovery.js";

export const RECOVERY_KEY = "gt100k.guide-console.recovery";

const TRIGGERS: ReadonlySet<string> = new Set<RecoveryTrigger>([
  "BURNOUT_TIP",
  "EARLY_BURNOUT",
  "ENGAGEMENT_FADING",
]);

export interface RecoveryNote {
  readonly kidId: string;
  readonly specId: string | null;
  readonly trigger: RecoveryTrigger;
  /** The move the guide acted on, if they picked one. */
  readonly moveId?: string;
  /** What the guide chose, in their words, e.g. "Started a 1-week step-away". */
  readonly note: string;
  /** ISO timestamp of the decision. */
  readonly at: string;
}

function isNote(x: unknown): x is RecoveryNote {
  if (typeof x !== "object" || x === null) return false;
  const n = x as Partial<Record<keyof RecoveryNote, unknown>>;
  return (
    typeof n.kidId === "string" &&
    n.kidId !== "" &&
    (n.specId === null || typeof n.specId === "string") &&
    typeof n.trigger === "string" &&
    TRIGGERS.has(n.trigger) &&
    typeof n.note === "string" &&
    n.note !== "" &&
    typeof n.at === "string" &&
    (n.moveId === undefined || typeof n.moveId === "string")
  );
}

export function parseRecoveryLog(raw: string | null): RecoveryNote[] {
  if (raw === null) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isNote);
}

/** The most recent note for a child (by ISO `at`), or null. Pure; the caller supplies the notes. */
export function latestNoteFor(
  notes: readonly RecoveryNote[],
  kidId: string,
): RecoveryNote | null {
  const mine = notes.filter((n) => n.kidId === kidId);
  if (mine.length === 0) return null;
  return mine.reduce((a, b) => (b.at > a.at ? b : a));
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @gt100k/guide-console test -- recovery-log`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add passion/apps/guide-console/app/recovery-log.ts passion/apps/guide-console/test/recovery-log.test.ts
git commit -m "feat(guide-console): browser-local recovery note log"
```

## Task 7: Log from the panel + roster marker

**Files:**
- Modify: `passion/apps/guide-console/app/useConsole.ts`
- Modify: `passion/apps/guide-console/app/recovery-panel.tsx`
- Modify: `passion/apps/guide-console/app/console.tsx`
- Modify: `passion/apps/guide-console/app/today.tsx`

**Interfaces:**
- Consumes: `parseRecoveryLog`, `latestNoteFor`, `RECOVERY_KEY`, `RecoveryNote` from `./recovery-log.js`.
- Produces on `ConsoleController` (useConsole): `recoveryNotes: readonly RecoveryNote[]`, `logRecovery(note: RecoveryNote): void`, and `latestRecoveryNote(kidId: string): RecoveryNote | null`.

- [ ] **Step 1: Add note state to the controller**

In `passion/apps/guide-console/app/useConsole.ts`, mirror how the decision log is loaded/persisted (search for `DECISIONS_KEY` / `parseDecisionLog` for the exact pattern already in this file — reuse it verbatim in shape):

```ts
import { latestNoteFor, parseRecoveryLog, RECOVERY_KEY, type RecoveryNote } from "./recovery-log.js";

// ...alongside the decision-log state:
const [recoveryNotes, setRecoveryNotes] = useState<readonly RecoveryNote[]>([]);

// Load once on mount, same as the decision log (localStorage is client-only).
useEffect(() => {
  if (typeof window === "undefined") return;
  setRecoveryNotes(parseRecoveryLog(window.localStorage.getItem(RECOVERY_KEY)));
}, []);

const logRecovery = useCallback((note: RecoveryNote): void => {
  setRecoveryNotes((prev) => {
    const next = [...prev, note];
    if (typeof window !== "undefined") window.localStorage.setItem(RECOVERY_KEY, JSON.stringify(next));
    return next;
  });
}, []);

const latestRecoveryNote = useCallback(
  (kidId: string): RecoveryNote | null => latestNoteFor(recoveryNotes, kidId),
  [recoveryNotes],
);
```

Add `recoveryNotes`, `logRecovery`, and `latestRecoveryNote` to the returned `ConsoleController` object and to its interface/type declaration (find where `decisions` / `decisionCount` are declared on the controller type and add the three fields beside them).

- [ ] **Step 2: Add a logging affordance to the panel**

In `passion/apps/guide-console/app/recovery-panel.tsx`, extend the props and add a minimal "record what you chose" control. Add a test first — append to `recovery-panel.test.tsx`:

```tsx
test("offers to record a decision when a logger is supplied", () => {
  const html = renderToStaticMarkup(
    <RecoveryPanel plan={recoveryFor("EARLY_BURNOUT")!} onLog={() => {}} />,
  );
  expect(html).toContain("Record what you chose");
});
```

Then change the component signature and add the control (a small form; the guide types the note, submit calls `onLog`):

```tsx
import { useState } from "react";

export function RecoveryPanel({
  plan,
  onLog,
}: {
  readonly plan: RecoveryPlan;
  /** When present, the guide can record what they chose. Advisory only — see recovery-log.ts. */
  readonly onLog?: (note: string) => void;
}): JSX.Element {
  const [draft, setDraft] = useState("");
  // ...existing body...
```

Add, at the end of the returned markup (before the closing `</div>`):

```tsx
      {onLog !== undefined ? (
        <form
          className="recovery__log"
          onSubmit={(e) => {
            e.preventDefault();
            const text = draft.trim();
            if (text !== "") {
              onLog(text);
              setDraft("");
            }
          }}
        >
          <label className="recovery__logk" htmlFor="recovery-note">
            Record what you chose
          </label>
          <input
            id="recovery-note"
            className="recovery__loginput"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. Started a 1-week step-away"
          />
          <button type="submit" className="recovery__logbtn">
            Save to this browser
          </button>
        </form>
      ) : null}
```

> Note: `renderToStaticMarkup` renders the initial state (`draft = ""`), so the static-markup assertions read the label text; `useState` is fine in SSR (only effects are skipped).

- [ ] **Step 3: Wire the logger through `console.tsx`**

In `console.tsx`, pass `onLog` to the drawer's `RecoveryPanel`, building the note from the open trigger + selected child:

```tsx
              <RecoveryPanel
                plan={recoveryFor(recovery.trigger)!}
                onLog={(note) =>
                  ctrl.logRecovery({
                    kidId: ctrl.kid,
                    specId: recovery.specId,
                    trigger: recovery.trigger,
                    note,
                    at: nowFor(ctrl.kid),
                  })
                }
              />
```

Import `nowFor` from `./console-data.js` if not already imported (it provides the per-child deterministic clock used elsewhere, avoiding `Date.now()` so tests stay deterministic).

- [ ] **Step 4: Add the roster marker in `today.tsx`**

Add a test first — create/extend a today marker test. Since `today.tsx` reads from the controller, assert via the log helper that the marker string is produced. Add to `passion/apps/guide-console/test/recovery-log.test.ts`:

```ts
test("a logged note gives the roster something to show for a child", () => {
  expect(latestNoteFor([NOTE], "001")?.note).toBe("Started a 1-week step-away");
});
```

Then in `passion/apps/guide-console/app/today.tsx`, inside the row, after the `kid__sub` block (~line 128), add:

```tsx
                  {(() => {
                    // A recovery note is advisory record-keeping, surfaced here so a guide sees that
                    // a step-away is in progress without opening the child. It changes nothing about
                    // the verdict or the child surface.
                    const note = ctrl.latestRecoveryNote(c.id);
                    return note ? (
                      <span className="todayrow__recovery">Recovery logged: {note.note}</span>
                    ) : null;
                  })()}
```

Add a style to `globals.css`:

```css
.todayrow__recovery { font-size: 0.78rem; color: #4a6470; margin-top: 0.2rem; display: block; }
```

- [ ] **Step 5: Run the full console suite + typecheck + build**

Run: `pnpm --filter @gt100k/guide-console test`
Run: `pnpm --filter @gt100k/guide-console exec tsc -b`
Run: `pnpm --filter @gt100k/guide-console build`
Expected: all PASS.

- [ ] **Step 6: Verify in the running app**

Open the recovery drawer, type "Started a 1-week step-away", Save; return to Today and confirm the child's row shows "Recovery logged: …"; reload and confirm it persists (localStorage). Confirm the child surface, offers, and gates are unchanged.

- [ ] **Step 7: Commit + open PR3**

```bash
git add passion/apps/guide-console/app/useConsole.ts passion/apps/guide-console/app/recovery-panel.tsx passion/apps/guide-console/app/console.tsx passion/apps/guide-console/app/today.tsx passion/apps/guide-console/app/globals.css passion/apps/guide-console/test/recovery-panel.test.tsx passion/apps/guide-console/test/recovery-log.test.ts
git commit -m "feat(guide-console): log recovery decisions and mark them on the roster"
git push
gh pr create --draft --title "feat: log recovery decisions + roster marker (PR3)" --body "Final slice: the guide can record what they chose in a browser-local, side-effect-free note, shown on the Today roster. No change to the child surface, store, offers, or gates. Depends on PR2.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

---

## Final verification (before marking done)

- [ ] Rebase the branch on `origin/main`; resolve any drift in `registry.ts` / `console.tsx` / `globals.css`.
- [ ] From repo root: `pnpm lint && pnpm typecheck && pnpm test`, then confirm the per-app build under `passion/apps/guide-console` is green (CI runs app builds the root scripts don't).
- [ ] Re-read the spec §Non-goals: confirm no child-facing output, no gamification, and that a logged recovery note has no effect on the child surface, hypothesis store, offers, or gates.

---

## Self-review notes (plan author)

- **Spec coverage:** §Architecture → Tasks 1–7; §recovery content model → Task 2; §per-state tailoring → Task 2 catalog; §research claims → Task 1; §panel+trigger → Tasks 4–5; §logged decision + roster marker → Tasks 6–7; §break dosage → `SHORT_BREAK` + `break-dosage` claim limit; §dip-vs-disengagement → `PIVOT` + `dip-vs-disengagement`/`goal-disengage-reengage` claims; §testing → tests in every task; §out-of-scope instrumentation gap → honored (EARLY_BURNOUT plan exists but the state is not forced to fire); §PR phasing → PR1/PR2/PR3.
- **Reuse (DRY):** the competence moves reuse the existing `optimal-difficulty` claim rather than adding a near-duplicate — the spec listed 8 candidate claims; this plan adds 7 and reuses 1.
- **Type consistency:** `recoveryFor`, `RecoveryTrigger`, `RecoveryPlan`, `RecoveryMove`, `EvidenceGrade`, `RecoveryNote`, `recoveryTriggerForState`, `planClaimIds`, `logRecovery`, `latestRecoveryNote`, `RECOVERY_KEY` are used identically across tasks.
- **Known gotchas encoded:** `bands.test.ts` pinned count 7 → 13 (Task 1 Step 1); plain-language banned vocabulary avoided in all copy and enforced by an extended scan (Task 5 Step 4); drawer reuses the `.mapdrawer` pattern; `nowFor` used instead of `Date.now()` for deterministic timestamps.
