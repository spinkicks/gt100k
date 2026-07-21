# Quickstart: Platform Foundation Spine (validation guide — real stack)

How to prove the slice works end-to-end once implemented. Implementation lives in [tasks.md](./tasks.md) /
the code — this is a run/validation guide only. Everything here is **synthetic-only**. The **mandatory gate**
requires **no** live Redpanda/Temporal/OPA-server/PostgreSQL/cloud (it uses in-memory fakes + the Temporal
SDK test suite + validate-only Terraform). The **optional integration lane** needs Docker.

> **NOT the TypeScript loop.** This feature's definition of done is the real-stack gate below, run by
> `make gate` and `.github/workflows/foundation-spine.yml` on a **Go + buf + OPA + Terraform-capable
> runner** — never `tsc -b`/`vitest`, never the TS overnight loop batch.

## Prerequisites

- **Go 1.25.5**, **buf 1.50.0**, **OPA 1.4.0**, **Terraform 1.11.4** installed (versions pinned in
  [spec.md → Build gate + pinned toolchain](./spec.md#build-gate--pinned-toolchain)).
- **Docker 24+** — only for the optional `-tags=integration` testcontainers lane.
- **No env, secrets, or cloud credentials needed** for the mandatory gate. Placeholder files
  (`.env.local`, `infra/terraform/environments/dev/terraform.tfvars.example`) exist only for future
  production adapters/apply (see [spec.md → Env / secrets](./spec.md#env--secrets)). All fixtures are
  committed under `pkg/platform/fixtures/` and `policies/testdata/` — no external fetch.

## Primary validation — the real-stack gate (definition of done)

```bash
# 1. Contract schema (buf owns compatibility)
buf lint proto
buf breaking proto --against '.git#branch=main,subdir=proto'
buf generate proto && git diff --exit-code proto/gen        # committed Go matches the schema

# 2. Go (pinned 1.25.5) — hermetic: in-memory fakes + Temporal SDK test suite (no Docker)
go vet ./...
go build ./...
go test ./...

# 3. Policy-as-code
opa test policies/ -v

# 4. Infrastructure as code (VALIDATE ONLY — never apply)
for m in bootstrap-org network-vpc eks rds s3-kms iam event-runtime _smoke; do
  terraform -chdir=infra/terraform/modules/$m init -backend=false
  terraform -chdir=infra/terraform/modules/$m validate
done
terraform fmt -check -recursive infra/terraform

# All of the above is aggregated by:
make gate
```

**Expected**: `buf lint`/`buf breaking` pass; `buf generate` produces no diff; `go vet`/`build`/`test`
clean; `opa test` green; every Terraform module reports `Success! The configuration is valid.` and
`fmt -check` exits 0. Every expected value is pinned in
[spec.md → Golden Values](./spec.md#golden-values--tolerances) and asserted by `pkg/platform/*_test.go`,
`policies/*_test.rego`, `pkg/spine/outbox_test.go`, and `workflows/deletion/deletion_test.go`.

## Optional integration lane (real Redpanda + PostgreSQL via testcontainers — needs Docker)

```bash
go test -tags=integration ./...   # spins up ephemeral Redpanda + PostgreSQL containers
```

**Expected**: the outbox → real Redpanda → projection burst (G-IDEM/burst) applies each `contract_id`
exactly once with no loss against a real broker + a real transactional outbox in PostgreSQL. This lane is
**not** part of the mandatory gate; run it on a Docker-capable job.

## Run the spine demo (synthetic learner, end-to-end)

```bash
go run ./cmd/demo          # drives the full spine path against in-memory fakes + the Temporal test env
```

**Expected outcome** (synthetic fixture learner; mirrors the FOUNDATION_PRD §17 construction gate, scaled to
the buildable real-stack subset):

1. **Provisioning** — the fixture arrives through the **stubbed enrollment handoff** (`EligibleLearner`,
   references only); the spine provisions a **pseudonymous** `actor_ref` (no legal identity downstream). (gate 1)
2. **Consent lifecycle** — a guardian `ConsentGrant` is granted; a child `AssentRecord` is recorded; a
   service refuses to process data lacking an active matching purpose. (gate 2)
3. **Traceability** — a consequential action emits a **`LearnerEvent`** whose `Envelope` traces to
   `consent_purpose`, `policy_version`, `evidence_refs`, `schema_version`, and the responsible actor, with
   distinct `occurred_at`/`recorded_at`. (gate 3)
4. **Human authority** — a `DecisionRecord` **cannot** be finalized without a named `authorized_human` and a
   policy result; a `MODEL`/`SYSTEM` actor in `authorized_human` is rejected (Go **and** OPA). (gate 4)
5. **Policy enforcement (OPA)** — the Rego policy **denies** a command whose purpose has no active consent
   (and any unknown role/purpose, deny-by-default; jurisdiction mismatch), and the deny is recorded with its
   `policy_version`. (gate 5)
6. **Deletion (Temporal)** — guardian withdrawal blocks new processing and starts the Temporal
   `DeletionWorkflow` (once); the workflow's idempotent/compensating activities run to completion (KMS
   crypto-shred stubbed); the append-only audit entry that deletion occurred is preserved. (gate 6)
7. **Event durability (logical + real)** — a scaled-down synthetic burst flows outbox → bus → projection
   with **no loss** and duplicate `contract_id`s rejected (exactly-once), including **out-of-order**
   delivery; the `-tags=integration` lane repeats it against real Redpanda + PostgreSQL. (gate 7)
8. **Override & appeal** — an `OverrideRecord` with **two distinct human approvers** supersedes a prior
   `DecisionRecord` while **preserving the original**; an `Appeal` filed with an **independent reviewer**
   (≠ the decision's `authorized_human`) is recorded without mutating the target. A model approver or a
   same-owner reviewer is rejected (Go + OPA). (gate 8)
9. **AWS provenance (validate-only)** — the runtime is expressed as Terraform that passes
   `terraform validate`/`fmt -check` (Core + Identity modeled; Public/Sandbox/Sensitive reserved); **no**
   cloud resource is created. (gate 9)

Switching the demo to a **denied** scenario (no consent / wrong jurisdiction / unknown role) shows the
command stopping at OPA authorization with a recorded `policy_deny` audit entry and no `DecisionRecord`.

## Success criteria mapping

- SC-001 `buf lint`/`buf breaking` + generated-Go freshness → `buf` commands + CI check.
- SC-002 complete traceable envelope → `pkg/platform` envelope tests + demo step 3.
- SC-003 no model in `authorized_human`, human+policy required → `decision_test.go` + `opa test` + step 4.
- SC-004 OPA deny-by-default + `policy_version` → `opa test policies/` + `authz_test.go` + demo step 5.
- SC-005 exactly-once under at-least-once/out-of-order, no loss → `outbox_test.go` (+ `-tags=integration`) + step 7.
- SC-006 withdrawal blocks new processing + starts Temporal deletion (once) + audit preserved →
  `consent_test.go` + `deletion_test.go` + demo step 6.
- SC-007 child assent veto → `assent_test.go` + demo step 2.
- SC-008 four-eyes override + original preserved → `override_test.go` + `opa test` + demo step 8.
- SC-009 appeal reviewer independence → `appeal_test.go` + demo step 8.
- SC-010 Terraform validate-only → `terraform validate`/`fmt -check` per module + demo step 9.
- SC-011 full gate synthetic-only, hermetic → this whole guide's `make gate` needs no external infra.

## What this quickstart deliberately does **not** exercise (deferred production direction)

`terraform apply` + the AWS org/accounts, managed Redpanda/Temporal **runtime ops**, real KMS crypto-shred,
cosign bundle/image signing + SBOMs, mTLS/network + OTel/Prometheus/Grafana wiring, Argo CD/OpenFeature, the
override/appeal **human workflows** (approval routing, SLA timers + remedy), and DR/RTO-RPO drills — see
[plan.md](./plan.md) "Deferred: production direction". Those prove *operational* / process properties a
hermetic gate cannot, and are the next-stage target the interfaces are already shaped for. The contracts +
invariants, OPA policy, outbox/consumer logic, Temporal workflow, and Terraform footprint themselves **are**
exercised here.
