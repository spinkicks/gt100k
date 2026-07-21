# Specification Quality Checklist: Platform Foundation Spine (Real Production Stack)

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-07-20
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details leak where they shouldn't; the stack IS the requirement here (real-stack slice)
- [x] Focused on the substrate every later feature depends on (parent §32.1)
- [x] Written for the builder + the reviewer
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable and mapped to concrete tests (`go test` / `opa test` / `buf` / `terraform`)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded (buildable-now vs deferred production direction)
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows (contracts, consent/OPA, outbox, override/appeal, deletion/IaC)
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] The build gate is defined and pinned

## Notes

- **Real production stack (not a TypeScript reference)**: this spec targets **Go** services/libraries,
  **Protobuf/gRPC via `buf`**, **OPA/Rego** policy-as-code, a transactional **outbox** + idempotent
  consumers over **Redpanda**, a **Temporal** deletion workflow, **PostgreSQL** state, and **Terraform**
  (validate-only) modules. It replaces the prior TS-reference draft entirely.
- **SEPARATE build track (critical)**: the definition of done is the **real-stack gate** —
  `buf lint`+`buf breaking`, `go vet/build/test` (Go **1.25.5** pinned), `opa test policies/`,
  `terraform validate`/`fmt -check` (**validate-only, no apply**). It is **not** gated by `tsc -b`/`vitest`
  and **must not** run in the TS overnight loop batch; it **requires a Go + buf + OPA + Terraform-capable
  runner** (+ Docker for the optional `-tags=integration` testcontainers lane), driven by
  `.github/workflows/foundation-spine.yml` (FR-020). This is stated at the top of spec.md, plan.md, and
  tasks.md.
- **Loop-ready**: the spec folds in the loop-readiness sections adapted to the real-stack gate — scope
  fence; ordered phasing P0–P7; machine-checkable SC-001…SC-011 each mapped to a named test/command; exact
  **golden values + tolerances** (G-BUF/G-ENV/G-DEC/G-ASSENT/G-AUTH/G-IDEM/G-WD/G-OVR/G-APL/G-TF);
  "Decisions already made" (real stack + pinned toolchain); the verbatim "Defaults for the unspecified"
  rule; pre-marked decision points with severity; pinned stack + exact gate commands + a seeded smoke path
  green from iteration 1; in-repo Go/OPA seed fixtures; env/secrets (`.env.local` + terraform tfvars
  placeholders).
- **Buildable-now vs deferred**: buildable = the `buf` contracts + generated Go, the Go invariant/spine/
  service code, OPA/Rego + `opa test`, the outbox/consumer (in-memory fakes + testcontainers), the Temporal
  deletion workflow (SDK test suite), and validate-only Terraform. Deferred (production direction, clearly
  marked, not silently dropped): `terraform apply` + AWS org, managed Redpanda/Temporal runtime ops, real
  KMS crypto-shred, cosign bundle/image signing + SBOMs, mTLS/observability wiring, Argo CD/OpenFeature,
  application shells, per-service Go module split, and the override/appeal human workflows.
- **Full contract set in scope**: `OverrideRecord` and `Appeal` are built here (FR-017, FR-018), completing
  the parent §32.1 "override, appeal" contract list, with four-eyes + reviewer-independence enforced in
  **both** Go and OPA; only their **human workflows** are deferred.
- **Open design questions (RETURN)**: DP-1 (enrollment-handoff `EligibleLearner` shape — reference-only
  default, confirm with admissions) and DP-2 (**testcontainers vs in-memory** for the local spine —
  answered "both": in-memory fakes as the hermetic mandatory lane + testcontainers Redpanda/PostgreSQL behind
  `-tags=integration`; recommend the integration lane be a separate Docker-capable CI job).
- **Legal layer is mechanical + stubbed** (FR-015): consent/assent modeled as mechanisms with placeholder
  legal artifacts; no real legal validity. KMS crypto-shred activity is a stub (real KMS deferred).
- **Constitution invariants encoded as testable requirements** (Go **and**, where applicable, OPA): human
  authority (FR-005, SC-003), four-eyes override (FR-017, SC-008), appeal reviewer independence (FR-018,
  SC-009), child assent veto (FR-004, SC-007), privacy-follows-purpose / synthetic-only (FR-012, FR-015),
  deny-by-default policy-as-code (FR-007, SC-004), replayability/determinism (FR-011, FR-016).
