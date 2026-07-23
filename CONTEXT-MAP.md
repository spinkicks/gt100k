# Context Map

GT100K is a monorepo. Active development is passion-centric (see `docs/prd/passion-roadmap.md`); other
areas are archived until reactivated. This map points to each modelled context's `CONTEXT.md`.

## Contexts

- [PassionLab](./passion/CONTEXT.md) — the unified passion product: discover, develop, document, and
  sustain a student's passion. Covers the discovery app, the specialization pipeline, and the Evidence
  Graph (see `docs/prd/`). Code under `passion/`.

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
- **PassionLab (internal)** — Discovery → `InterestHypothesis` → Specialization → `EvidenceGraph`
  (provenance of the resulting project work).

## Decisions

System-wide ADRs live in [`docs/adr/`](./docs/adr/). Context-scoped decisions may later live under
`passion/**/docs/adr/`.
