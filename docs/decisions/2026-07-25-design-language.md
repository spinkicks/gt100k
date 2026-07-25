# Decision: the PassionLab design language

**Date:** 2026-07-25 · **Status:** accepted · **Supersedes:** the ad-hoc per-app styling that produced five unrelated CSS systems

## Context

Five apps hand-rolled roughly 8,550 lines of CSS with no shared package and at least three
unrelated theme systems, so the product read as separate sites rather than one system. The
brief was to pick a single durable language and propagate it.

Two constraints arrived mid-decision and changed the answer:

1. **Guides are not technically inclined.** Charts and readable visual summaries are a
   requirement, not a nice-to-have.
2. **Colour coding, including red/amber/green, is explicitly approved** for readability.

That reverses the earlier research-driven position of avoiding status colour and metric
display on the adult surfaces. Recorded here so nobody re-litigates it from the research
docs alone.

## Decision

**The canonical adult language is the MUI dashboard style:** neutral grey ground, white
cards with hairline borders, restrained blue accent (`#0b6bcb`), tight radii, subtle
shadows. Chosen in a side-by-side against Horizon UI; "crisper is better."

Reference: the MUI dashboard template and Horizon UI, captured during the review.

### How it is implemented

- `@gt100k/design-tokens` is the single source of truth: **framework-free CSS custom
  properties, zero dependencies.** This is what keeps the styling-tool choice reversible
  and lets the Vite/R3F app read the same values without React.
- The canonical values live on `:root`, so importing the package is enough. No attribute to
  set, no unthemed flash. Horizon remains only as an opt-in `[data-theme="horizon"]`
  override for comparison and should be deleted once nobody is comparing.
- Child and adult are **modes** (same semantic token names, different values), never
  separate token sets. Density is one derived multiplier and never scales type size.

### Rejected

- **Adopting shadcn/ui or Radix Themes wholesale.** Considered, and rejected because we
  already have a look worth keeping; adopting a kit would trade it for one that looks like
  every other SaaS product. Individual headless primitives may still be borrowed later
  where accessibility is fiddly (dialogs, menus, tabs).
- **Inventing a new language from scratch.** Three from-scratch directions were built and
  rejected on sight. The lesson: judge design on a full-width real screen, not on component
  fragments in narrow columns.
- **A dark canonical scheme.** The current console's dark look is well liked, but light is
  required for the long-form Parent Playbook, and one scheme across the adult surfaces is
  worth more than a per-app preference.

## Guardrail note (important)

Displaying per-child metrics and RAG status **does not** violate the existing compliance
checks. `GC1` (no scalar score / fixed label) and `GC6` (no gamification) in
`@gt100k/guardrails` scan the **hypothesis data model** for banned fields, not the UI. So
status may be derived at the view layer from data that already exists (lower bound,
evidence mass, lifecycle state, wellbeing risk). What would break the checks, and must not
be done, is stamping a new `score`, `grade`, or `rank` field onto a child's record.

Two cheap practices we keep regardless, because they cost nothing:

- Every colour-coded status also carries a **text label**, so hue is never the only carrier
  of meaning (roughly 8% of men have a colour vision deficiency).
- Status describes a **state** ("Needs a look"), not a judgement of the child.

## Consequences

- New surfaces import the token package and inherit the language for free.
- Switching the whole product's look later costs one file.
- Existing apps must be converted: guide console first, then the parent guide, then the
  evidence explorer. The Vite/R3F cabin consumes the token CSS only.
