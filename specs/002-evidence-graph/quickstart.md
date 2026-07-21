# Quickstart: EvidenceGraph (validation guide)

How to prove the slice works end-to-end once implemented. Implementation code lives in tasks.md / the code itself — this is a run/validation guide only. Synthetic-only; no consent/legal workflow is required.

## Prerequisites

- Node.js LTS + pnpm installed.
- Repo bootstrapped: `pnpm install` at the repo root (pnpm workspace).

## Run the tests (primary validation)

```bash
pnpm test                                       # Vitest across the workspace
pnpm --filter @gt100k/evidence-graph test       # domain unit + contract tests only
```

**Expected**: all contract-test obligations in [contracts/evidence-graph.md](./contracts/evidence-graph.md) pass — content-addressing + idempotency, cycle/dangling rejection, the human-authority invariant (human-owned grade passes; model-owned grade and authorship accusation rejected), deterministic Merkle root, packet assembly, and stub verification (pass untampered / fail tampered).

## Build & lint gate

```bash
pnpm exec tsc -b            # strict typecheck (noUncheckedIndexedAccess, verbatimModuleSyntax)
pnpm exec biome check .     # lint/format
```

**Expected**: `tsc -b` clean and `biome check` clean.

## Walk the end-to-end flow (synthetic milestone)

The demo/tests assemble a synthetic milestone graph and exercise the full path:

1. **Build the DAG (US1)**: add `Artifact`, `Transformation` (plan), `Attempt` (run), `Assistance`, `Review`, `Contribution`, `Outcome` nodes; link them with `derived_from`, `authored_by`, `used_tool`, `validates`, `released_as`. Each node's id equals the SHA-256 of its canonical content; re-adding identical content is a no-op; a cyclic edge is rejected.
2. **Enforce the invariant (US2)**: the `Outcome` grade is `authored_by` a **human** actor → `assertHumanAuthority` passes. Flip it to a `model` actor → it fails. Add an authorship-accusation node → it fails.
3. **Assemble + attest + verify (US3)**: assemble the `EvidencePacket` (deterministic Merkle root, in-toto attestation binding the artifact digest) and run the stub `Verifier` → **pass**. Alter one node's content and re-verify → **fail** (tamper-evident).
4. **Deferred stubs (§19.2)**: invoking `TransparencyLog.anchor` / `ErasureService.shred` returns deterministic placeholder results, clearly marked non-production (pre-live gates D1/D2).

## Success criteria mapping

- SC-001 deterministic content-addressing + idempotency → `graph`/`hash` tests (step 1).
- SC-002 acyclic DAG (cycle/dangling rejected) → `graph` tests (step 1).
- SC-003 human-grade / no-accusation invariant → `invariants` tests (step 2).
- SC-004 deterministic Merkle root + tamper-evident verify → `merkle`/`packet`/verifier tests (step 3).
- SC-005 full flow with no consent/legal/admissions workflow → the demo/tests need none.
- SC-006 adapter swap without domain change; stubs invocable + marked non-production → adapter tests (step 4).
