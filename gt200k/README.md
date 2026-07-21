# GT200K — The Rescope

> **Status: rescope in progress (2026-07-21).** GT100K's canonical spec (`docs/prd/PRD.md`) and research corpus remain valid background, but the product focus is shifting. Most of the old scope will be scrapped or parked; the parts worth keeping are extracted into this folder. Treat GT100K docs as a quarry, not a contract.

## The gospel

Reaching a **1570 SAT and 5s on BC Calculus, Physics C, Literature, and Language** — the stats — is the **floor**. It is what gets a student *considered* at the MIT level. It is table stakes, not a differentiator. Everyone in the room already cleared it.

We believe a student who clears the floor needs a **differentiator — a spike**. The whole point of GT200K is to help a student find and build that spike.

Finding and building a spike breaks into two problems, and we are building one pillar for each.

### Pillar 1 — Find the spike without pressure or burnout

**Interest Lab & Passion Engine.** Repeated, varied encounters with domains and work modes, designed to find where a child *voluntarily returns* once novelty, praise, and obligation fall away. What the child returns to is tracked as a **mutable interest hypothesis** carrying both evidence and counter-evidence — never a fixed label.

**Specialization Planner.** Turns a *validated* interest into an ambitious project spine — without locking the child into a permanent identity. It keeps exit ramps and adjacent paths open so a spike is a direction, not a cage.

Together these help a student find what they actually want to develop skill in, and then develop it, without being welded to a single track before they know it fits.

### Pillar 2 — Prove the work is the student's own

In a world full of AI, tutors, and helpful parents, it is genuinely hard to tell what a student actually did from what was done *for* them. A finished artifact proves almost nothing about who authored it.

**Evidence Graph** (name pending) is, roughly, **git for student projects**: every step of the path is logged as a graph, so an independent verifier can replay the entire process and see every iteration — the dead ends, the revisions, the moment the idea changed. Provenance, not just product.

**Verification-by-understanding** (design open): a way to test that the student actually understands the work they claim. Two candidate mechanisms we are weighing:
- an AI tutor (or a human teacher) periodically asking the student questions about the project and logging the exchange into the graph, to show they know what they are doing; and/or
- the student logging reflections or testimonials of the work so far — possibly audio explanations — as first-class evidence.

## What's in this folder

- **`README.md`** — this file: the gospel and the doc map.
- **`brainlifts/evidence-graph.md`** — the Evidence Graph brainlift (Pillar 2): facts → findings → composition → spiky points of view → build plan.
- **`brainlifts/passion-engine.md`** — the Passion Engine brainlift (Pillar 1): same structure.

Each brainlift follows the house format from `docs/research/gtBrainlift.md`, but is **built ground-up** — DOK 1 (facts and definitions) and DOK 2 (the evidence anchors) first, then DOK 3 (how the pieces compose) and DOK 4 (the spiky, contrarian-but-true positions) on top of that foundation.

## What carries over from GT100K, and what doesn't

**Kept:** the floor thesis (a real cognitive/academic ceiling exists and is worth clearing), the evidence-graded discipline (E1/E2/E3/R/G labels on claims), and two subsystems that already had deep PRD treatment — `§14` (Interest Lab, mutable `InterestHypothesis`, Specialization Planner) and `§19` (EvidenceGraph and evaluation).

**Parked / scrapped:** the 100,000-learner operations machine, the admissions-selection apparatus, the cohort/rivalry stack, the family-fidelity screening, and the broader acceleration-factory framing. GT200K assumes a student who has *already* cleared the floor and asks the next question: what makes them singular, and how do we prove it's real?
