# @gt100k/family-app

The **family co-engagement** surface (F3) — the Next.js app where a human **guide** coaches a child's
family toward **warm-demanding** support: **autonomy support + structure + non-contingent warmth**. It
renders the pure `FamilyRead` from `@gt100k/family` for each child in the synthetic pilot roster: it
computes no coaching logic in the UI (that lives in the domain package), and it never shows a child- or
family-facing **label, score, or reward**. **The system proposes; the guide disposes** — a family-facing
item appears only after the guide **approves** it, and nothing is ever sent to a parent automatically.
**Synthetic data only** — no real family or child data, ever.

> **Package name.** The domain package is `@gt100k/family`; pnpm rejects two workspace packages with the
> same name, so this app is **`@gt100k/family-app`** and `LOOP_QA_CMD` is scoped to it (a forced
> deviation from spec §9's literal string; the surface + contract are unchanged).

## Run

```bash
pnpm --filter @gt100k/family-app dev     # local dev server
pnpm --filter @gt100k/family-app build   # production build (part of the gate)
pnpm --filter @gt100k/family-app start   # serve the production build (used by LOOP_QA)
pnpm --filter @gt100k/family-app test    # app smoke tests (vitest, node env — no jsdom)
```

No secrets and no env vars are required. The surface is **deterministic + offline**: the roster is
derived once by `buildPilotRoster` (the real 012 → 011 → 013 chain over synthetic interaction logs), the
016 wellbeing reads are derived per spike, and `deriveFamilySignals` → `assessFamily` produces each
child's read at the pinned `PILOT_NOW`.

## What the surface shows

Three columns: a **child switcher** (with a per-child risk chip + a `⚑ Needs your review` flag), a
**guide coaching console** for the selected child, and a **family-facing preview**.

The coaching console renders, for the selected child:

- the **warm-demanding coaching posture** — autonomy support (`↑`/`→`), structure (`↑`/`→`), warmth
  (**non-contingent, always**), and whether to **decouple worth from outcome**;
- any **"Needs your review"** escalation — the named obsessive-tip **antecedents** that fired + the
  guide-facing re-coaching reason (elevated pressure or strain routes to a human);
- the **guide observations** in play (clearly labeled **synthetic** — never software-inferred; no facial
  or emotion detection, ever);
- the **coaching offers to approve** — door-opening asks (offers of opportunity / structure / access,
  never mandates) + shared-activity ideas (the "complex" high-support + high-challenge environment);
- the plain-language **why** + the standing guardrail notes.

The **family-facing preview** shows **only** the offers the guide has approved — nothing until an
approval, then exactly the approved items, phrased for the family with no label or score.

### The synthetic pilot roster

| kid | read | why |
|---|---|---|
| Ari (001) | baseline (healthy) | the `window.__qa` kid; no guide observations |
| Bex (002) | **elevated** + escalate | synthetic `conditional regard` note → re-coach counter-cyclically |
| Cyrus (003) | low family engagement | synthetic `low co-engagement` note → build the complex environment |
| Dulce (004) | baseline (healthy) | established + healthy |

## The `window.__qa` contract (spec §9)

A DOM surface (no canvas), so `window.__qa.state()` plus DOM diffing is the operable surface the gate
drives. The page installs the contract once, backed by a `ref`, so `state()` / `primaryAction()` always
read the **current** approved set — never a stale render closure:

| member | value |
|---|---|
| `ready` | `true` once the client component has mounted |
| `error` | `null` (no init error) |
| `state()` | `{ kidId, risk, escalations, approved }` — the selected kid, its pressure-watch risk, the roster review-queue count, and how many coaching cards are approved for the family |
| `primaryAction()` | **approves the top coaching card** (the primary offer) for the selected child's family; a no-op only once that card is already approved |

`primaryAction()` is **live**: it moves `state().approved` `0 → 1` and adds the approved card to the
family preview, observable in both `state()` and the DOM (`.preview[data-approved]`).

## LOOP_QA usability gate

```bash
pnpm --filter @gt100k/family-app build
LOOP_QA=1 \
LOOP_QA_CMD="pnpm --filter @gt100k/family-app start" \
LOOP_QA_PORT=<port> \
  <run the loop harness>
```

The harness loads the surface, asserts `window.__qa.ready === true` and `error === null`, snapshots
`state()`, invokes `primaryAction()`, and hard-fails if `state()` (and the DOM) did not change.
**Verified locally** against `next start` via a headless-Chromium CDP drive: `ready === true`,
`error === null`, `state()` `approved 0 → 1`, and the family preview grows `0 → 1` items with no page
errors.

## Accessibility & motion

- Semantic landmarks (`<main>` / `<aside>` / `<header>` / `<h1>`), labelled nav + action buttons, an
  always-visible focus ring (WCAG 2.4.7).
- **Grayscale-safe**: meaning never rides on color alone — risk chips carry a word (`Steady` / `Watch` /
  `Needs your review`) and a border shape (solid / dashed / bold); knobs carry an `↑`/`→` glyph + text.
- `prefers-reduced-motion: reduce` disables all motion. **Manual verification** (tone / legibility / full
  a11y sweep) is operator-reviewed on the PR (functional-but-plain; polish pass is P5).
