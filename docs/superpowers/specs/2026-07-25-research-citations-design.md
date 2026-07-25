# Research citations in the product: design

**Date:** 2026-07-25 · **Status:** approved, building

## Problem

Every measurement and recommendation this product makes is backed by research, and none of
that is visible in the product. Two concrete costs:

1. **Guides are not technically inclined.** Without a stated reason, "74% confidence" is an
   oracle. The practitioner literature is blunt about what happens next: in a comparable
   deployment, workers understood almost nothing about how their tool worked and invented
   folk theories to fill the gap, one comparing it to "religious faith." Transparency to the
   practitioner is a distinct requirement from transparency to the public.
2. **Credibility.** Third-party support that is *linked to the evidence* is a documented
   credibility signal, and prominence governs whether it counts at all: an element the user
   never notices has no effect. So citations belong at the point of the claim, not in a
   footer.

## Design

### 1. `@gt100k/research`, a shared citation registry

A zero-dependency package. One typed map from a stable claim id to an entry:

```ts
interface Claim {
  id: string;              // stable, referenced by UI call sites
  label: string;           // the thing on screen, e.g. "Voluntary returns"
  why: string;             // ONE plain sentence a non-expert can act on
  basis: "evidence" | "chosen" | "policy";
  sources: readonly Source[];   // authors, year, url (DOI preferred)
  limit?: string;          // honest caveat, shown when present
}
```

Zero dependencies so every surface can consume it: the console, the parent guide, the
evidence explorer, and later anything guide-facing in the child app. Most of the content
already exists in the parent guide's source list, so this largely relocates vetted material
into a reusable asset. That also serves the cohesion goal: the research becomes one asset
instead of per-app prose.

### 2. `basis` is the load-bearing field

Not every number in our engines is science. The 85% optimal-difficulty target comes from
Wilson et al. (2019). The 14-day recency half-life, the 0.6 spike threshold, and the
minimum evidence mass of 3 are **our chosen defaults**. The EU prohibition on emotion
inference in education is **policy**, not a finding.

Labelling these honestly is more credible than dressing a chosen default up as evidence,
and the parent guide already sets that precedent with its honest-limits note. The UI renders
the three bases differently, so a guide can tell at a glance which is which.

### 3. `WhyThis`, an affordance at the point of the claim

A small info button beside a metric label. Opens a popover with the plain sentence, the
sources as links, the honest limit if present, and a basis tag. Requirements:

- Keyboard operable, dismissible with Escape and on outside click, `aria-expanded` on the
  trigger, focus returned to the trigger on close.
- Never blocks the metric it annotates, and never required to understand the screen.
- The popover is the only place the citation appears, so the surface stays uncluttered.

### 4. An "Evidence base" page

One route listing every claim grouped by area, with sources and bases. Doubles as guide
onboarding and as material for the "outline for applications and guides" goal.

## Where it goes (first pass)

Console Overview: the four stat tiles, the returns-over-time card, the coverage tile, the
wellbeing card. Hypotheses: the confidence meter and the "not sure yet" state.

## Content rules

- `why` is one sentence, plain, and actionable. No jargon, no hedging stacks.
- Every entry needs at least one source with a resolvable URL, except `basis: "chosen"`
  entries, which must instead explain *why* that value was picked and say it is a default.
- State the limit whenever the evidence is thin, contested, or extrapolated from a
  different population. Under-claiming is cheaper than being caught over-claiming.
- Never phrase a claim as a statement about a specific child.

## Success criteria

- A guide can click any number on the Overview and get a plain-language reason plus a link.
- Chosen defaults are visibly distinguished from evidence-backed findings.
- Registry is consumable by any surface with no React or framework dependency.
- A test asserts every claim has a source or a chosen-default rationale, and that ids are
  unique.
