# Context Map

GT100K is a monorepo, and it holds **two products**: PassionLab, and the EvidenceGraph — which is
developed here but is not part of PassionLab and is intended for extraction. Active development is
passion-centric (see `docs/prd/passion-roadmap.md`); other areas are archived until reactivated. This
map points to each modelled context's `CONTEXT.md` where one exists; the EvidenceGraph does not have
one yet, and its design docs stand in (`docs/decisions/evidencegraph-v1-*.md`).

## Contexts

- [PassionLab](./passion/CONTEXT.md) — the unified passion product: discover, develop, document, and
  sustain a student's passion. Covers the discovery app and the specialization pipeline (see
  `docs/prd/`). Code under `passion/`, excluding the `@gt100k/evidence-*` packages.
- **EvidenceGraph** — a **separate product**, developed in this repo for now and intended for
  extraction (`docs/decisions/evidencegraph-v1-design.md` §11 and §13a). A project → a verifiable,
  explorable record of how it was built, demonstrable with no GT dependency at all. Code under the
  `@gt100k/evidence-*` namespace (`passion/packages/evidence-*`, `passion/adapters/evidence-*`,
  `passion/apps/evidence-explorer`). It shares this repo's toolchain, not its product boundary.

## Referenced but not owned here

- **Academics / TimeBack** — the inherited external mastery engine (`DISCOVERY-APP-PRD.md` §5.1/§6.5,
  `SPECIALIZATION-PIPELINE-PRD.md` §2.3). PassionLab consumes its signals; it is not built in this repo.

## Not yet modelled

- **Family selection** (see `docs/research/familyBrainlift.md`) and the **archived** arena / cohort /
  foundation work. Add a `CONTEXT.md` if/when they reactivate.

## Relationships

- **Academics → PassionLab** — TimeBack surfaces a daily academic signal (which section a student pours
  *discretionary* XP into); PassionLab reads it as one **weak prior**, not a score. *(Resolved — see
  `docs/adr/` ADR-0004 and `DISCOVERY-APP-PRD.md` §6.5.)*
- **PassionLab (internal)** — Discovery → `InterestHypothesis` → Specialization → project work.
- **PassionLab → EvidenceGraph** — a **cross-product seam, not an internal call.** PassionLab's project
  work becomes provenance in the graph, through exactly one adapter
  (`@gt100k/project-evidence-sink`), so neither side names the other at runtime. The direction is
  one-way: the graph never reads PassionLab. `@gt100k/project-workspace` maps a project onto the closed
  taxonomy as a *plan* (pure data); the adapter materializes it. **Enforced**, not merely intended — see
  `@gt100k/boundaries` and `docs/decisions/evidencegraph-v1-design.md` §13a.

## Decisions

System-wide ADRs live in [`docs/adr/`](./docs/adr/). Context-scoped decisions may later live under
`passion/**/docs/adr/`.
