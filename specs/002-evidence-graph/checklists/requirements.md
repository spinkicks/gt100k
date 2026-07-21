# Specification Quality Checklist: EvidenceGraph

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-07-20
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Constitution Alignment (GT100K)

- [x] Human authority: every final grade/`Outcome` is human-owned; no model owns a grade (FR-008; Constitution I/IV)
- [x] No automated AI-authorship accusation is representable (FR-009; Constitution IX; PRD §4.7)
- [x] Model output is admissible only as a cited `Assistance`/`Review` node (FR-009; PRD §19)
- [x] Privacy/synthetic-only: no real PII/consent/admissions; consent scope is a stubbed field (FR-018; Constitution V)
- [x] No SHA-1/MD5; hashing behind a port (FR-007; PRD §19)

## Scope & Deferral Discipline (PRD §19.2)

- [x] Genuinely-hard parts deferred as **marked stubs / out-of-scope**, not silently omitted: transparency-log anchoring (D1), crypto-shred erasure (D2), comparative-judgment reliability (D3), conformal calibration (D4), attestation signing (D6)
- [x] Deferrals are pre-live gates that do not block the synthetic-beta slice (PRD §19.2/§32.4)
- [x] MVP is explicitly called out (Setup + Foundational + US1)

## Parallel-Safety (merge hygiene)

- [x] All feature code lives in new dirs (`packages/evidence-graph`, `adapters/evidence-*`)
- [x] No shared root file (`package.json`, `pnpm-workspace.yaml`, `vitest.config.ts`, `biome.json`) requires editing (existing globs discover the new dirs)
- [x] The single shared-file touch (root `tsconfig.json` references) is isolated as the final task and flagged for human reconciliation

## Loop-Readiness (spec.md folds in the [loop-ready checklist](../../../../gt100k-factory/docs/loop-ready-prd.md))

- [x] **Scope fence**: explicit in-scope / out-of-scope (marked stubs) / non-goals (no interface).
- [x] **Phasing P0…P4**: ordered build path with per-phase SC coverage and navigable headers.
- [x] **Acceptance criteria = tests**: SC-001…SC-012, each mapped to a named test file + assertion.
- [x] **Golden values + tolerances**: exact SHA-256 node ids (idA `facecf25…`) and Merkle roots (3-leaf `0360836a…`, packet `df1f000d…`); tolerance = exact `===` (zero).
- [x] **Decisions already made**: SHA-256, RFC 8785 JCS canonicalization, hex-string Merkle scheme, port shapes.
- [x] **Defaults for the unspecified**: the catch-all rule recorded verbatim.
- [x] **Stack + commands pinned**: pnpm; `tsc -b` / `vitest` / `biome`; seeded smoke test (SC-011).
- [x] **Seed fixtures in-repo**; **env/secrets** note (none needed); **pre-marked decision defaults** with severity.

## Notes

- **PROV extension, not exporter**: this slice encodes the PROV `Entity`/`Activity`/`Agent` mapping (data-model.md) but does not ship a PROV/RO-Crate serializer — deferred (PRD §19, STD-03/STD-04).
- **in-toto shape, not signed**: the attestation is the typed in-toto Statement shape; cryptographic signing and the attestor key hierarchy are deferred (§19.2 D6). The stub verifier checks structure, subject digests, and Merkle re-derivation only.
- **Milestone membership is an input**: which nodes belong to a packet is a caller-supplied selection (external `MilestoneContract`, PRD §28); this feature owns assembly/attestation/verification, not the milestone workflow.
- **Canonical serialization (resolved)**: pinned to **RFC 8785 (JCS)** over the hashed field subset with optional-field omission; the exact golden canonical bytes are in spec.md **Golden Values**, so any conformant encoder reproduces the golden ids (FR-004/FR-020). Formerly an open question — now closed by the golden fixtures.
