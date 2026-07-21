# Implementation Plan: Platform Foundation Spine (Real Production Stack)

**Branch**: `005-foundation-spine` | **Date**: 2026-07-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-foundation-spine/spec.md`; baby PRD
[`docs/prd/FOUNDATION_PRD.md`](../../docs/prd/FOUNDATION_PRD.md); parent [`PRD.md`](../../docs/prd/PRD.md)
§26 (stack), §26.2 (backend/language ownership), §26.4 (repo/delivery), §27 (boundaries + command path),
§28 (contracts), §29 → [`GOVERNANCE.md`](../../docs/prd/GOVERNANCE.md) G7, §30 (reliability/security),
§32.1 (Month-1 gate).

> ## ⚠️ SEPARATE BUILD TRACK — read first
>
> This feature targets the **real production stack** (Go + buf + OPA + Terraform + Redpanda + Temporal +
> PostgreSQL). Its **definition of done is its own gate**, **not** `tsc -b`/`vitest`:
>
> ```
> buf lint  +  buf breaking
> go vet ./... && go build ./... && go test ./...   # Go pinned to 1.25.5
> opa test policies/
> terraform validate  +  terraform fmt -check       # VALIDATE-ONLY — never apply
> ```
>
> It **must not** run in the TypeScript overnight loop batch (the factory loop harness gates on
> `pnpm typecheck` + `vitest` and has no Go/buf/OPA/Terraform toolchain). It **requires a Go + buf + OPA +
> Terraform-capable runner** (+ Docker for the optional `-tags=integration` testcontainers lane), driven by
> a dedicated GitHub Actions workflow (`.github/workflows/foundation-spine.yml`).

## Summary

Build the **real substrate** of the platform spine — the part every later Go service binds to. Concretely:

- **`proto/`** — a `buf`-owned Protobuf registry: the common `Envelope` header + the six foundation
  contracts (`LearnerEvent`, `ConsentGrant`, `AssentRecord`, `DecisionRecord`, `OverrideRecord`, `Appeal`),
  an append-only `AuditEntry`, and the `EligibleLearner` handoff — with `buf lint`, `buf breaking`, and
  generated Go committed under `proto/gen/go/`.
- **`pkg/platform`** — Go validators encoding every invariant over the generated types: envelope
  completeness, active-consent, refusal-honored, append-only, **model-can-never-fill `authorized_human`**,
  **four-eyes override**, **appeal reviewer independence**, distinct event/ingest time.
- **`services/identity-consent`** — pseudonymous identity resolution, the consent/assent domain, and the
  purpose-authorization **edge** that evaluates **OPA/Rego** on the command path and records `policy_version`.
- **`policies/`** — Rego policy-as-code (deny-by-default authorization, jurisdiction/residency, four-eyes,
  authority-forgery) with `opa test` decision-table + subgroup + deny-by-default coverage.
- **`pkg/spine`** — the transactional **outbox** + idempotent consumers + `HandleCommand` command path +
  append-only audit, behind interfaces with in-memory fakes (default gate) and testcontainers-backed
  Redpanda + PostgreSQL integration tests (`-tags=integration`).
- **`workflows/deletion`** — a **Temporal** durable deletion workflow with idempotent/compensating
  activities (KMS crypto-shred stubbed), proven via the Temporal Go test suite.
- **`infra/terraform`** — validate-only Terraform modules for the AWS runtime (account bootstrap, VPC, EKS,
  RDS, S3/KMS, IAM, Redpanda/Temporal wiring), Core + Identity modeled, Public/Sandbox/Sensitive reserved.
- **The gate itself** — a `Makefile` `gate` target + the separate CI workflow (FR-020).

**Definition of done: the real-stack gate above, green, synthetic-only.** Each interface is the exact seam a
production adapter slots into with zero domain change.

**Deferred production direction** (see [Deferred](#deferred-production-direction-described-not-built-or-tasked-here)):
`terraform apply` + the AWS org, managed Redpanda/Temporal runtime ops, real KMS crypto-shred, OPA/image
signing + SBOMs, mTLS/OTel wiring, Argo CD/OpenFeature, application shells, and the per-service Go module
split.

## Technical Context

**Language/Version**: **Go 1.25.5** (pinned in `go.mod` `go 1.25` + `toolchain go1.25.5`), single module
`github.com/gt100k/platform`. Protobuf via **buf 1.50.0** (`protoc-gen-go 1.36.5`, `protoc-gen-go-grpc
1.5.1`). Rego via **OPA 1.4.0**. IaC via **Terraform 1.11.4**.

**Primary Dependencies**: `google.golang.org/protobuf` (generated types), `go.temporal.io/sdk v1.34.0`
(+ `testsuite`), `github.com/open-policy-agent/opa v1.4.0` (Go SDK for the authz edge + `opa test`),
`github.com/twmb/franz-go v1.18.1` (Redpanda/Kafka client, integration lane), `github.com/jackc/pgx/v5
v5.7.2` (PostgreSQL, integration lane), `github.com/testcontainers/testcontainers-go v0.35.0`
(+ `/modules/redpanda`, `/modules/postgres`, integration lane). The invariant core (`pkg/platform`)
imports only the generated types + stdlib.

**Storage**: In-memory fakes behind Go interfaces for the default `go test` lane; **PostgreSQL** (via pgx +
testcontainers) for the integration lane; **Redpanda** (via franz-go + testcontainers) for the event spine
integration lane. Production RDS/managed-Redpanda are the deferred adapters behind the same interfaces.

**Testing**: `go test ./...` (default, hermetic — in-memory fakes + `testsuite.TestWorkflowEnvironment`);
`go test -tags=integration ./...` (Docker-backed testcontainers); `opa test policies/`; `buf lint` +
`buf breaking`; `terraform validate` + `terraform fmt -check`.

**Target Platform**: Local/dev + a Go/buf/OPA/Terraform-capable CI runner. No cloud apply in this slice.

**Project Type**: Go monorepo module + `proto/` + `policies/` + `workflows/` + `infra/` (parent §26.4),
coexisting with the repo's existing TS workspace (untouched by this feature).

**Performance Goals**: Not performance-bound; domain ops are O(1)–O(n) over small synthetic sets. The
parent's 10,000 events/s durability target is an operational property of the **deferred** managed Redpanda;
this slice proves the *logical* no-loss / no-double-apply property (fakes) + a real-broker exercise
(testcontainers).

**Constraints**: Pure invariant core — no I/O, no wall-clock, no random ids (clock + id injected); Temporal
uses deterministic APIs (FR-016). Append-only contracts (POL-006). Deny-by-default OPA authorization
(FR-007). Synthetic-only; legal layer stubbed (FR-015). Validate-only Terraform (FR-019). The mandatory gate
is hermetic (Docker only for the opt-in integration lane).

**Scale/Scope**: One synthetic tenant / learner flow; six contracts; OPA authorization; outbox + idempotent
consumers; Temporal deletion; validate-only IaC.

## Constitution Check

*GATE: must pass before Phase 0. Re-checked after Phase 1.*

| Principle | Status | Note |
|---|---|---|
| I. Human authority over consequential decisions | ✅ Pass (enforced) | `DecisionRecord` cannot be finalized without a named `authorized_human` + policy result; a `MODEL`/`SYSTEM` actor can never fill it — enforced in **Go** (`ValidateDecisionRecord`) **and** **OPA** (`deny_authority_forgery`) (FR-005, FR-017, SC-003/008). `OverrideRecord` four-eyes; `Appeal` independent reviewer (FR-017/018). Records append-only + replayable (FR-011, FR-016). |
| II. Child assent and veto | ✅ Pass (enforced) | `AssentBlocks` makes a child's honorable refusal block optional collection even with guardian consent (FR-004, SC-007). |
| III. Evidence-class authority ladder | ✅ Pass | No learned model runs here; a `MODEL` actor is admissible only as advisory `model_version`/evidence, never decision authority (FR-005). |
| IV. Evidence before authority; deterministic rules | ✅ Pass (core purpose) | Authorization is **OPA/Rego policy-as-code**, deny-by-default, returning `policy_version` — a model cannot change the rule (FR-007; PRD §4.1; GOVERNANCE G7). |
| V. Privacy follows purpose | ✅ Pass | Synthetic-only; downstream sees only a pseudonymous `actor_ref` + purpose scope (FR-012); consent is purpose-scoped with jurisdiction/residency deny (FR-008; GOVERNANCE G7); legal layer stubbed (FR-015). Real crypto-shred deferred (activity stub, FR-014). |
| ENG (governed flow, tests-define-done, contracts, no secrets) | ✅ Pass | Branch→PR→CI; the real-stack gate; **buf** contracts with append-only field evolution (parent §28); **signed OPA bundles** modeled (`opa build`; signing deferred); Terraform validate-only; no secrets/machine paths; gitleaks-safe; synthetic-only. |
| IX. Prohibited product behavior | ✅ Pass | No automated consequential decision representable (human authority in Go + OPA); four-eyes gates override classes (FR-017); enrollment is a read-only synthetic stub — no automated admission. |

**Result: PASS** — no violations, no Complexity Tracking needed. The deliberate deferrals (`terraform apply`,
managed-runtime ops, real KMS crypto-shred, bundle/image signing, mTLS/observability, override/appeal human
workflows) are **explicit production-direction / pre-live items**, represented by clearly-marked interfaces +
notes and (for policy signing) an `opa build` artifact, rather than silent omission.

## Project Structure

### Documentation (this feature)

```text
specs/005-foundation-spine/
├── plan.md              # This file
├── spec.md              # Feature spec (user stories, FR, SC, golden values, gate)
├── research.md          # Phase 0 decisions (real stack + testcontainers-vs-in-memory)
├── data-model.md        # proto messages + Go types + OPA I/O + interfaces + state transitions
├── quickstart.md        # gate/validation guide
├── contracts/
│   └── foundation-spine.md   # proto contracts + Go API + OPA decisions + test obligations
├── checklists/
│   └── requirements.md  # spec quality checklist
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root — real-stack layout, parent §26.4)

```text
go.mod                               # module github.com/gt100k/platform — go 1.25 + toolchain go1.25.5
go.sum
Makefile                             # `make gate` aggregates buf/go/opa/terraform (FR-020)
proto/
├── buf.yaml                         # lint + breaking config (module: proto)
├── buf.gen.yaml                     # protoc-gen-go v1.36.5 + protoc-gen-go-grpc v1.5.1 (pinned)
├── buf.lock
├── gt100k/platform/v1/
│   ├── envelope.proto               # Envelope + ActorRef + ActorClass enum
│   ├── learner_event.proto
│   ├── consent.proto                # ConsentGrant + WithdrawalState
│   ├── assent.proto                 # AssentRecord + AssentResponse enum
│   ├── decision.proto               # DecisionRecord
│   ├── override.proto               # OverrideRecord
│   ├── appeal.proto                 # Appeal + AppealStatus enum
│   ├── audit.proto                  # AuditEntry
│   └── enrollment.proto             # EligibleLearner + Track enum
└── gen/go/gt100k/platform/v1/       # COMMITTED generated Go (buf generate); freshness-checked in CI
pkg/
├── platform/                        # PURE invariant/validator lib over the generated types
│   ├── envelope.go                  # ValidateEnvelope
│   ├── learner_event.go             # ValidateLearnerEvent
│   ├── consent.go                   # ValidateConsentGrant + IsConsentActive
│   ├── assent.go                    # ValidateAssentRecord + AssentBlocks
│   ├── decision.go                  # ValidateDecisionRecord (human authority)
│   ├── override.go                  # ValidateOverrideRecord (four-eyes)
│   ├── appeal.go                    # ValidateAppeal (reviewer independence)
│   ├── invariants.go                # AssertEnvelopeComplete/AssertHumanAuthority/AssertAppendOnly/
│   │                                #   AssertFourEyes/AssertReviewerIndependent + error types
│   ├── clock.go                     # Clock + IDGenerator interfaces (injected; FR-016)
│   ├── fixtures/fixtures.go         # synthetic seed fixtures (spec → Seed fixtures)
│   └── *_test.go                    # G-ENV/G-DEC/G-ASSENT/... golden tests
├── spine/                           # transactional outbox + consumers + command path + audit
│   ├── outbox.go                    # OutboxStore iface + UnitOfWork (atomic commit)
│   ├── relay.go                     # Relay (idempotency key, at-least-once)
│   ├── consumer.go                  # Deliver (dedup on contract_id)
│   ├── audit.go                     # AuditLog iface + helpers
│   ├── command.go                   # HandleCommand full path
│   ├── ports.go                     # all interfaces (repos, EventBus, Clock, DeletionStarter, ...)
│   ├── outbox_test.go               # G-IDEM (fakes)
│   └── outbox_integration_test.go   # //go:build integration — testcontainers Redpanda + PostgreSQL
services/
└── identity-consent/
    ├── identity.go                  # ResolveActor / ProvisionLearner (pseudonymous only, FR-012)
    ├── consent_service.go           # GrantConsent / WithdrawConsent (starts Temporal deletion)
    ├── assent_service.go            # RecordAssent
    ├── authz.go                     # OPA edge: evaluate bundle, return {allow,reason,policy_version}
    └── *_test.go                    # G-AUTH via the OPA Go SDK
policies/
├── authz.rego                       # gt100k.authz.decision (deny-by-default; G-AUTH precedence)
├── override.rego                    # gt100k.override.deny (four-eyes + authority forgery)
├── appeal.rego                      # gt100k.appeal.deny (reviewer independence)
├── authz_test.rego                  # opa test (decision table)
├── override_test.rego
├── appeal_test.rego
└── testdata/authz_*.json            # OPA input fixtures mirroring G-AUTH
workflows/
└── deletion/
    ├── workflow.go                  # DeletionWorkflow (deterministic APIs)
    ├── activities.go                # store-erasure + crypto_shred (KMS stub) activities (idempotent)
    └── deletion_test.go             # testsuite.TestWorkflowEnvironment (G-WD; compensation path)
infra/terraform/
├── modules/
│   ├── bootstrap-org/               # AWS Organization + Core + Identity accounts (+ reserved boundaries)
│   ├── network-vpc/                 # default-deny VPC, private subnets
│   ├── eks/                         # EKS cluster (compute)
│   ├── rds/                         # RDS PostgreSQL + pgvector (PITR variables)
│   ├── s3-kms/                      # S3 (KMS-encrypted) + per-subject key hierarchy variables
│   ├── iam/                         # least-privilege roles / IRSA
│   ├── event-runtime/              # managed Redpanda + Temporal wiring variables
│   └── _smoke/                      # empty valid module (seeded smoke)
└── environments/dev/                # composition + terraform.tfvars.example (placeholders)
cmd/
└── demo/main.go                     # headless end-to-end demo (P7)
runbooks/
└── foundation-spine.md             # spine ops notes (P7)
.github/workflows/
└── foundation-spine.yml            # the SEPARATE Go/buf/OPA/Terraform gate (FR-020)
```

**Structure Decision**: A **single Go module** rooted at the repo (parent §26.4 top-level dirs) keeps the
gate `go vet ./... && go build ./... && go test ./...` working verbatim from repo root while still honoring
the `proto/` `policies/` `workflows/` `infra/` `services/` layout. The invariant rules live in the pure
`pkg/platform` package (the thing "all later work depends on", parent §32.1); `pkg/spine` and
`services/identity-consent` build behavior on top and inject all I/O via interfaces. The **per-service Go
module split + `go.work`** (parent §26.2 "each deployable owns its module") is deferred behind these same
package boundaries so it is a mechanical refactor, not a redesign.

**Parallel-safety**: all new code lives under new top-level dirs (`proto/`, `pkg/`, `services/`, `policies/`,
`workflows/`, `infra/`, `cmd/`, `runbooks/`) plus new files `go.mod`, `go.sum`, `Makefile`, and
`.github/workflows/foundation-spine.yml`. **No existing TS file** (`package.json`, `pnpm-workspace.yaml`,
`tsconfig*.json`, `vitest.config.ts`, `biome.json`, `apps/`, `packages/`, `adapters/`) is edited. The two
git-ignored placeholders (`.env.local`, `infra/terraform/environments/dev/terraform.tfvars`) plus the
`.gitignore` line for `**/terraform.tfvars` and `**/*.tfstate*` are grouped into the final task (the single
human-reconciled merge point).

## Deferred: production direction (described, not built or tasked here)

Per the real-stack gate, the items below are the **target this slice's interfaces are shaped for**, not work
in `tasks.md`. Each row names the seam where it slots in.

| Spine concern (FOUNDATION_PRD §) | Deferred production target | Interface / seam it replaces |
|---|---|---|
| Cloud provisioning (§4) | `terraform apply` on the real AWS Organization (Core + Identity live; Public/Sandbox/Sensitive created) | Terraform modules exist + `validate`/`fmt` now; **apply** deferred (needs creds/org) |
| Event spine runtime (§9) | **Managed Redpanda** (US region, child-data DPA); 99.99% durability, 10k events/s | `EventBus`/producer interface (fake → franz-go → managed Redpanda); testcontainers exercises real broker |
| Durable workflows runtime (§13) | **Managed Temporal** (US region, DPA); production task queues + workers | `DeletionStarter` + workflow code exist (SDK test suite); managed cluster deferred |
| Deletion crypto-shred (§13) | Per-subject **KMS** key destruction | `crypto_shred` activity is a **stub/fake**; KMS-backed activity deferred (FR-014, DP-6) |
| Policy signing (§11, §14.2) | **Cosign-signed OPA bundles** + two-reviewer high-stakes release | Rego + `opa test` + `opa build` bundle now; **signing** deferred (GOVERNANCE G7) |
| Data plane (§12) | Per-service **RDS PostgreSQL** (bitemporal, pgvector), Redis, S3/Iceberg | `*Repository`/`AuditLog`/`OutboxStore` interfaces (fakes → pgx → RDS) |
| Identity vault (§10) | Own Identity & Consent vault (passkeys/MFA), Identity AWS account | `IdentityRepository` (pseudonymous resolution identical) |
| Enrollment handoff (§7.3) | Real admissions Track A/B eligibility interface | `EligibleLearner` stub consumer → real client (config, not rewrite) |
| CI/CD & release (§15) | Argo CD deploy, OpenFeature rings, signed images + SBOMs | Out of scope for this slice; the gate CI workflow is in scope |
| Observability (§16) | OTel/Prometheus/Grafana; `correlation_id`/`causation_id` tracing | Envelope already carries the ids; collector wiring deferred |
| Reliability/security (§14, §30) | mTLS, short-lived workload identity, default-deny networks, RTO/RPO sign-off | Terraform encodes default-deny SG variables; live mesh + DR sign-off deferred |
| Override/appeal **workflows** (§7.2) | Four-eyes approval routing/notifications; appeal SLA timers + remedy | Contracts + invariants in scope (Go + OPA); human workflows deferred |
| Per-service module split (§26.2) | Each deployable its own Go module + `go.work` | Single module now, same package boundaries |

## Complexity Tracking

None — Constitution Check passed with no violations. The single-module layout is the **minimum** that keeps
the real-stack gate (`go build ./...`) trivial while honoring the monorepo directory layout; the per-service
module split is deliberately deferred to avoid unjustified `go.work` complexity in the buildable slice.
