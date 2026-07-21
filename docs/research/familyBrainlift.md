# Design: Family-Selection Brainlift ("Select the Family, Not the Child")

**Owner:** David & Felipe

## Context

`docs/research/gtBrainlift.md` is the overarching brainlift for GT 100k. It carries
five spiky POVs across the whole program. SPOV 1, "Select the family, not the
child," argues that a fanatical, totalizing home is the dominant lever and that
admissions should screen for family commitment over the child's early test score.

This design covers a second, narrower brainlift built around that one bet. It goes
deeper on family selection, adds fresh evidence, and reads through to what the bet
means for GT 100k admissions. It stays a research document.

## Goal

Produce this brainlift (`docs/research/familyBrainlift.md`): a standalone brainlift
arguing that, for GT 100k admissions, the family you admit decides more than the
child you admit. It carries real citations with summaries (DOK 1/2), original
insights (DOK 3), and a small set of strong spiky POVs (DOK 4), plus a
principles-level read on admissions.

## Scope

In scope:

- A blunt, first-person, contrarian brainlift in the voice of the parent document.
- Fresh web research for each claim, plus reuse of relevant gt100k docs.
- Real, verifiable citations. No fabricated sources. Weak or unverifiable claims
  get flagged, not dressed up.
- A principles-level admissions section.

Out of scope:

- Proposing concrete admissions mechanisms.
- Product or code changes.
- Live-policy claims for GT.

## Format

Follow the canonical brainlift template (`Template BLtxt.txt`), which is richer
than the essay-style parent doc. Section order, top-down:

1. **Title**: "Select the Family, Not the Child"
2. **Owners**
3. **Purpose**: purpose statement, In Scope, Out of Scope
4. **DOK 4: Spiky POVs**: each with the assertion, an elaboration in the blunt
   voice, and the parent doc's two tags, "Consensus it breaks" and "Backing"
5. **Experts**: Who / Focus / Why Follow / Where, per person
6. **DOK 3: Insights**: original conclusions, grouped by theme, each tracing to
   sources in the Knowledge Tree
7. **DOK 2: Knowledge Tree**: categories, then subcategories, then each source
   with DOK 1 facts, a DOK 2 summary in plain words, and a link

## Spiky POVs (DOK 4)

Seven claims were selected. Close ones merge into four strong SPOVs. Each SPOV is
fed by one or more research streams (see Research plan). Final count can drop to
three or rise to five once the research shows how much each claim carries.

**SPOV 1: Select on the family's commitment over the child's intake score.**
The variance that predicts elite outcomes sits in whether a family will reorganize
its life around the program, not in a six-year-old's test score. The twin-study
result that shared environment barely moves adult IQ is a range-restriction
artifact: no family in those samples ran a totalizing home, so the data is blind
to the environment that produces prodigies.
Streams: range_restriction, deprioritize_child_iq.

**SPOV 2: Select for parental obsession, and screen for it on purpose.**
The active ingredient is the parent's monomaniacal commitment, the same trait
schools and social workers treat as a hazard. Target it, and use parent
personality screening (grit, focus, resistance to social pressure) as the
admissions instrument rather than testing the child.
Streams: screen_for_obsession, parent_psych_profiling.

**SPOV 3: Admit and bind the household, not the child.**
The unit of selection is the household. Weight two-parent buy-in and enrolling
siblings, and require a binding multi-year commitment that filters out families
who quit when relatives and the school board push back.
Streams: family_as_unit, binding_contracts.

**SPOV 4: Ignore the "stolen childhood" objection; it isn't in the data.**
The main charge against selecting fanatical families is that it steals childhoods.
The long-term data on radical acceleration shows no harm to well-being. Treat a
family's resolve against that objection as a selection signal.
Stream: ethics_objection_wrong.

## Research plan

Seven research subagents run in parallel, one per stream. Each returns material
mapped to the brainlift's DOK levels.

Streams:

1. range_restriction: heritability as a range-restriction artifact; totalizing
   homes fall outside twin-study samples.
2. deprioritize_child_iq: family commitment outpredicts the child's intake score
   for elite outcomes.
3. screen_for_obsession: obsessive parenting as the target trait, not a hazard
   (Polgar, "tiger" parenting, engineered prodigies).
4. parent_psych_profiling: parent personality screening (grit, focus, pressure
   resistance) as a selection instrument.
5. family_as_unit: the household as the unit of selection; two-parent buy-in and
   sibling spillover.
6. binding_contracts: binding multi-year commitment as a filter for families who
   won't fold.
7. ethics_objection_wrong: long-term well-being data on acceleration refutes the
   "stolen childhood" objection.

Each subagent returns:

- Three to six real sources. Per source: full citation, a working link or DOI,
  three to five DOK 1 facts (findings, sample sizes, effect sizes), a two-to-four
  sentence DOK 2 summary in plain words, and the SPOV it supports.
- One to three DOK 3 insights (original connections, not summaries).
- A drafted DOK 4 framing for its claim: assertion, "Consensus it breaks,"
  "Backing."
- Experts surfaced: name, focus, why follow, where.
- Flags: overlaps with other streams, counter-evidence, and any claim that could
  not be verified.

Subagent constraints:

- Real sources only. No invented citations, DOIs, or quotes.
- Prefer peer-reviewed work, books, and documented cases. Note confidence when a
  source is weaker.
- Summaries in plain words. No jargon padding.

Synthesis (done by the lead, not a subagent):

- Merge the seven streams into the four SPOVs.
- Write Purpose and scope, the DOK 3 insights grouped by theme, the Experts
  section, and the DOK 2 Knowledge Tree.
- Reconcile the parent doc's existing SPOV 1 sources (Polderman et al. 2015;
  Bouchard & McGue 1981; Polgar; SMPY via Lubinski & Benbow) with the new finds,
  and dedupe.
- Write the admissions-principles part of DOK 3.
- Run the stop-slop skill over the whole document.

## Output and logistics

- Brainlift lives at this path: `docs/research/familyBrainlift.md`.
- Voice: blunt, first-person, plain words, stop-slop applied.
- Length: deeper than the parent's SPOV 1. The Knowledge Tree with per-source
  facts and summaries will push the total well past the parent doc; a full source
  base across seven streams runs long by design.
- Git: commit consistent with the repo's contributor workflow in `AGENTS.md`.

## Open items

- Owner name for the brainlift header.
- Final SPOV count (three to five) once research shows how much each claim carries.
