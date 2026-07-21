# Implementation Plan: EvidenceGraph

**Branch**: `002-evidence-graph` | **Date**: 2026-07-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-evidence-graph/spec.md`

## Summary

Build the code-first core of GT100K's EvidenceGraph (PRD §19) as a **pure, framework-agnostic TypeScript domain package** (`packages/evidence-graph`): a content-addressed evidence DAG of eight PROV-extended node types and six edge types; a deterministic Merkle root and an in-toto-style attestation for a per-milestone `EvidencePacket`; and the non-negotiable human-authority invariant (humans own every grade; a model output is only a cited `Assistance`/`Review`, never a grade or an authorship accusation). All I/O sits behind ports — `Hasher` (SHA-256, Node-crypto adapter), `Verifier` (deterministic stub adapter), `EvidenceRepository` (in-memory adapter) — so the domain stays deterministic and 100% unit-testable. The genuinely-hard parts (external transparency-log anchoring, crypto-shred erasure, comparative-judgment reliability, conformal calibration) are **stubs / out of scope** per §19.2. Synthetic-only; consent/legal machinery is a stubbed field.

**Loop-ready**: [spec.md](./spec.md) folds in a hard scope fence, ordered phasing (P0…P4), machine-checkable success criteria (SC-001…SC-012) each mapped to a named test, and **pinned golden values** (exact SHA-256 node ids and Merkle roots) that are the loop's deterministic acceptance targets. The build gate is `pnpm exec tsc -b` + `pnpm test`; a seeded smoke test keeps the gate green from iteration 1. The canonicalization and Merkle schemes are pinned exactly (see spec **Decisions Already Made**): node id = `sha256_hex(utf8(JCS(content)))`; Merkle via the **RFC-6962 raw-byte scheme** over the per-node 32-byte SHA-256 digests with `leaf=sha256(0x00 || digestBytes)`, `interior=sha256(0x01 || leftHashBytes || rightHashBytes)`, leaves sorted ascending by digest bytes, odd level promotes the lone right-most node unchanged (never duplicated) — the certificate-transparency standard, for interoperability with the deferred §19.2 D1 transparency log.

## Technical Context

**Language/Version**: TypeScript (strict), Node.js LTS (per PRD §26.1). `tsconfig.base.json` with `noUncheckedIndexedAccess` + `verbatimModuleSyntax` (inherited).

**Primary Dependencies**: None in the domain package (pure TS). Node's built-in `crypto` only inside the `adapters/evidence-hash-node` adapter. pnpm workspaces + Vitest + Biome + `tsc -b` (existing factory gate).

**Storage**: In-memory `EvidenceRepository` for the synthetic slice, behind a port so a real store slots in later without touching domain logic.

**Testing**: Vitest (unit + contract), matching the workspace `vitest.config.ts` include globs (`packages/**/test`, `adapters/**/test`).

**Target Platform**: Local/dev (Node). No cloud/infra in this slice.

**Project Type**: TS monorepo library (`packages/` domain + `adapters/` I/O). No app/frontend in this slice.

**Performance Goals**: Not performance-bound; graph/Merkle ops are deterministic and small at slice scale. Correctness and determinism over throughput.

**Constraints**: Pure domain logic — no I/O, no wall-clock reads, no direct crypto import in the core; hashing and verification injected via ports. Deterministic and replay-safe (idempotent content-addressing FR-005; deterministic Merkle root FR-011). SHA-1/MD5 forbidden (PRD §19).

**Scale/Scope**: One synthetic milestone's evidence graph and packet; eight node types, six edge types; synthetic data only.

## Constitution Check

*GATE: must pass before Phase 0. Re-checked after Phase 1.*

| Principle | Status | Note |
|---|---|---|
| I. Human authority over consequential decisions | ✅ Pass (enforced) | The human-authority invariant (FR-008/US2) is encoded in the domain: every grade/judgment `Outcome` is human-owned; no model owns a grade. |
| III. Evidence-class authority ladder | ✅ Pass | No learned model runs here; a `model` actor's output is admissible only as cited `Assistance`/`Review` (FR-009). |
| IV. Evidence before authority; proof of process | ✅ Pass (core purpose) | The feature *is* the proof-of-process substrate; it records how work was built and MUST NOT make an automated AI-authorship accusation (FR-009). |
| V. Privacy follows purpose | ✅ Pass | Synthetic-only; actor refs pseudonymous; consent scope is a stubbed field; no real PII/admissions/sensitive data. Erasure shape noted, real crypto-shred deferred (§19.2 D2). |
| IX. Prohibited product behavior | ✅ Pass | No automated AI-authorship accusation is representable (FR-009); no automated consequential decision (grades are human-owned). |
| ENG (governed flow, tests-define-done, no secrets) | ✅ Pass | Branch→PR→CI; Vitest/Biome/tsc gate; no secrets/machine paths; synthetic-only; SHA-1/MD5 forbidden. |

**Result: PASS** — no violations, no Complexity Tracking needed. The one deliberate deferral (transparency-log anchoring, crypto-shred, ACJ reliability, conformal calibration) is explicitly a **pre-live gate** (§19.2), not a synthetic-beta requirement, and is represented by clearly-marked stubs / out-of-scope notes rather than silent omission.

## Project Structure

### Documentation (this feature)

```text
specs/002-evidence-graph/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (domain API + ports)
│   └── evidence-graph.md
├── checklists/
│   └── requirements.md  # spec quality checklist
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
packages/
└── evidence-graph/              # PURE domain — the heart of this feature
    ├── src/
    │   ├── model.ts             # NodeType/EdgeType enums, EvidenceNode/Edge, ActorRef, ToolRef, ConsentScope, PROV map
    │   ├── canonicalize.ts      # deterministic canonical serialization (for hashing)
    │   ├── graph.ts             # addNode/addEdge, content-addressing, cycle + dangling rejection
    │   ├── invariants.ts        # assertHumanAuthority (human-grade / no-accusation)
    │   ├── merkle.ts            # deterministic Merkle root (domain-separated, odd-count rule)
    │   ├── attestation.ts       # in-toto Statement shape (unsigned in this slice)
    │   ├── packet.ts            # assembleEvidencePacket + traceEvidence
    │   ├── ports.ts             # Hasher, Verifier, EvidenceRepository (+ stub TransparencyLog, ErasureService)
    │   └── index.ts
    ├── test/                    # Vitest unit + contract tests (mirror FR/SC + contracts/)
    │   ├── smoke.test.ts        # seeded smoke (SC-011) — green from iteration 1
    │   ├── golden.test.ts       # asserts the exact golden node ids + Merkle roots (SC-007/SC-008)
    │   └── fixtures/            # in-repo synthetic seed fixtures (goldenArtifact, syntheticMilestone, …)
    ├── package.json
    ├── tsconfig.json            # extends ../../tsconfig.base.json
    └── README.md
adapters/
├── evidence-hash-node/          # Node-crypto SHA-256 Hasher adapter (the only crypto import)
├── evidence-repo-memory/        # in-memory EvidenceRepository (synthetic)
└── evidence-verifier-stub/      # deterministic stub Verifier (real WASI verifier deferred, §19.2)
```

**Structure Decision**: A TS monorepo library (per PRD §26.1) with all EvidenceGraph rules quarantined in a **pure, side-effect-free `packages/evidence-graph`** domain package, mirroring `packages/learning-loop`. All I/O (hashing, verification, persistence) is injected via ports so the core is deterministic and fully unit-testable, and real crypto/verifier/store integrations replace the stubs later without changing domain code. Go/Rust services (PRD §26.2/§26.3) and a PROV serializer are **not** needed for this slice and are deferred.

**Parallel-safety**: all new code lives in `packages/evidence-graph` and `adapters/evidence-*`. The root workspace glob (`packages/*`, `adapters/*`) and the Vitest include (`packages/**/test`, `adapters/**/test`) already discover them, so **no** shared root file (`package.json`, `pnpm-workspace.yaml`, `vitest.config.ts`, `biome.json`) is edited. The **only** shared-file touch is adding composite project references to the root `tsconfig.json`; that is the **final task** and is flagged as the single point a human reconciles at merge.

## Deferred scope (§19.2 pre-live gates — tracked, not built here)

| Item | §19.2 | Treatment in this slice |
|---|---|---|
| External transparency-log anchoring | D1 | `TransparencyLog` **stub port** (deterministic placeholder inclusion proof), marked non-production. |
| Verifiable-deletion / crypto-shred erasure | D2 | `ErasureService` **stub port** + tombstone shape; asserts only that retained packets stay verifiable. |
| Comparative-judgment reliability | D3 | **Out of scope**; no interface. Noted here + in the Release Threshold Registry (§33.1). |
| Conformal-triggered review calibration | D4 | **Out of scope**; no interface. |
| Cryptographic attestation signing | D6 | Attestation is the typed **in-toto shape only**; signing/key hierarchy deferred; stub verifier checks structure/digests, not signatures. |

## Complexity Tracking

None — Constitution Check passed with no violations.
