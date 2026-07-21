# Phase 0 Research: Platform Foundation Spine (Real Production Stack)

The feature is scoped from [FOUNDATION_PRD.md](../../docs/prd/FOUNDATION_PRD.md) and parent PRD §26 (stack),
§26.2 (language ownership), §26.4 (repo/delivery), §27 (boundaries + command path), §28 (contracts),
§29 → [GOVERNANCE.md](../../docs/prd/GOVERNANCE.md) G7, §30 (reliability/security), §32.1 (Month-1 gate).
Unlike the prior TypeScript-reference draft, **this slice targets the real production stack** (Go, buf, OPA,
Terraform, Redpanda, Temporal, PostgreSQL) and defines its **own build gate** — it is a **separate track**
from the TypeScript overnight loops. The decisions below record what is **buildable now** (proven with the
real tools, hermetically) vs. the **deferred production direction** (needs credentials or a hosted runtime).

The two genuinely open design points, pre-answered here and flagged for human confirmation, are the
**enrollment-handoff eligibility-contract shape** ([spec.md → DP-1](./spec.md#pre-marked-decision-points-preferred-default-stated-inline-severity-noted))
and **whether the local spine is tested via testcontainers or in-memory fakes**
([spec.md → DP-2](./spec.md#pre-marked-decision-points-preferred-default-stated-inline-severity-noted)).

## Decision: Target the real production stack now; defer only cloud apply + managed-runtime ops

- **Decision**: Build the spine with its **real tools** — `buf` Protobuf contracts + generated Go, Go
  domain/services, OPA/Rego policy-as-code, a transactional outbox + idempotent consumers over a real
  Redpanda client, a Temporal deletion workflow, and Terraform modules — with a gate of `buf lint` +
  `buf breaking`, pinned `go vet`/`build`/`test`, `opa test`, and `terraform validate`/`fmt -check`. Defer
  **only** what a hermetic gate cannot exercise: `terraform apply` (needs an AWS org + creds), managed
  Redpanda/Temporal runtime ops, real KMS crypto-shred, bundle/image signing, and mTLS/observability wiring.
- **Rationale**: The prior draft proved the *rules* in TypeScript but left the *real substrate* (buf, Go,
  OPA, Temporal, Terraform) unbuilt, so a defective invariant could still be baked into every consumer at
  cutover. Building on the real stack now locks the invariants **in the tools that will carry them** while
  keeping the gate buildable: `buf breaking` is the real compatibility guarantee (parent §28); `opa test`
  is the real policy-as-code guarantee (GOVERNANCE G7); the Temporal test suite is the real workflow
  guarantee (§13); `terraform validate` is the real IaC guarantee (§4). Everything deferred is precisely the
  set that requires a credential or a hosted runtime — not logic.
- **Alternatives considered**: (a) The TS reference (prior draft) — rejected: it cannot be exercised by the
  real gate and risks re-work at cutover. (b) Going straight to a live AWS deploy — rejected: it front-loads
  credentials/org/apply before the invariants are locked and cannot run in a hermetic gate. (c) Building Go
  but skipping OPA/Temporal/Terraform — rejected: it drops three of the substrate's defining guarantees the
  Month-1 gate names (§17: policy enforcement, deletion, AWS provenance).

## Decision: A SEPARATE build track from the TypeScript overnight loops

- **Decision**: This feature is **not** gated by `tsc -b`/`vitest` and **must not** be enqueued in the TS
  loop batch. It ships its own `Makefile` `gate` target and a dedicated GitHub Actions workflow
  (`.github/workflows/foundation-spine.yml`) on a Go + buf + OPA + Terraform-capable runner (+ Docker for
  the optional integration lane).
- **Rationale**: The factory loop harness (`harness/run-loop.sh`) auto-detects a JS/TS lockfile and gates on
  `pnpm typecheck` + `vitest`; it has no Go/buf/OPA/Terraform toolchain and would mis-gate this feature
  (green on an unrelated TS check, or red because the Go code isn't TS). The clean separation keeps each
  track's gate meaningful. If the only available runner is TS-only, a Go/infra-capable runner is required —
  this is called out prominently at the top of the spec and plan (FR-020).
- **Alternatives considered**: (a) Shoe-horning a `pnpm`-invoked wrapper that shells out to `go`/`buf` so
  the TS loop "runs" it — rejected: it hides a Go build behind a JS gate, gives false signal, and needs the
  Go toolchain on the TS runner anyway. (b) Rewriting the loop harness to be polyglot — out of scope for
  this feature (a factory change), noted as a follow-up.

## Decision: `buf` owns the contract schema; commit generated Go

- **Decision**: One `proto/` registry (`buf.yaml`, `buf.gen.yaml`, `buf.lock`) with proto package
  `gt100k.platform.v1`. `buf lint` (STANDARD) + `buf breaking` (against `.git#branch=main`) are the
  compatibility gate; new fields take new tags, removals/renames/tag-reuse are forbidden. **Commit** the
  `buf generate` Go under `proto/gen/go/` and add a CI freshness check (`buf generate` +
  `git diff --exit-code`) so `go build` needs no `buf` yet the schema and code never drift (DP-7).
- **Rationale**: `buf breaking` is exactly the parent §28 "no breaking changes outside a deprecation window"
  guarantee, enforced by the real tool. Committing generated code keeps the Go gate independent of a `buf`
  install while the freshness check keeps it honest.
- **Alternatives considered**: Generate-in-CI only (don't commit) — rejected: makes `go build ./...` depend
  on `buf` being present and complicates the hermetic Go lane. Hand-written wire types — rejected: violates
  §26.4 "no service hand-writes a wire type."

## Decision: OPA/Rego is the authorization mechanism (not a hand-rolled predicate)

- **Decision**: Purpose authorization is **Rego** in `policies/` (package `gt100k.authz`), deny-by-default,
  keyed on role + purpose + active consent + jurisdiction, returning `{allow, reason, policy_version}` with
  the fixed reason-code precedence in [G-AUTH](./spec.md#g-auth--authorization-decisions). It is proven by
  `opa test policies/` (decision table + deny-by-default + subgroup fixtures) **and** exercised on the Go
  command path via the OPA Go SDK against the compiled bundle. Four-eyes and reviewer-independence are
  mirrored in `gt100k.override`/`gt100k.appeal`. `opa build` produces the bundle artifact; **cosign
  signing** of the bundle is deferred (GOVERNANCE G7).
- **Rationale**: This is the real §11 "signed OPA bundles evaluated on every command" mechanism, minus only
  the signing step (which needs a key). Putting the decision in Rego (not Go `if` branches) keeps
  deny-by-default honest and makes CI decision-table testing (GOVERNANCE G7) first-class.
- **Decision (input shape)**: pre-filter *active* consents in Go (`IsConsentActive`) and pass them to Rego,
  so "active" has one home (Go) and Rego owns purpose/jurisdiction/rule matching. The `at` timestamp and raw
  consents are still available to Rego for defense-in-depth tests.
- **Alternatives considered**: A pure-Go predicate (prior draft) — rejected: it is not policy-as-code and
  can't be CI-tested as a signed bundle. Embedding a WASM-compiled bundle only — deferred as an optimization.

## Decision: Local event spine tested BOTH ways — in-memory fakes (default) + testcontainers (integration) — DP-2

- **Decision**: Model the outbox as interfaces with **in-memory fakes** as the default `go test ./...` lane
  (fast, hermetic, no Docker), **and** provide **testcontainers-backed** Redpanda + PostgreSQL integration
  tests behind `//go:build integration` (`go test -tags=integration ./...`) that exercise the real broker +
  a real transactional outbox. Temporal uses the SDK in-memory `TestWorkflowEnvironment` by default; a
  `temporal` dev-server testcontainer is an optional integration extra.
- **Rationale**: The SC-005 property (no loss / exactly-once under at-least-once + out-of-order) is *logic*,
  provable with fakes — so the **mandatory** gate stays hermetic and runs on any Go runner, including CI
  without Docker. But real broker semantics (partition ordering, offset commit, at-least-once redelivery)
  and a real PostgreSQL transaction deserve a real exercise; the `-tags=integration` split gives that where
  Docker exists **without** making the mandatory gate depend on Docker. This is the safest of both worlds
  and directly answers the DP-2 open question.
- **Alternatives considered**: (a) testcontainers-only — rejected: makes the mandatory gate require Docker,
  which the factory's Go/CI runner may lack and slows every iteration. (b) in-memory-only — rejected: never
  exercises the real Redpanda/PostgreSQL semantics the production adapter depends on, weakening confidence
  at cutover. (c) mocking the broker with a Go double — rejected: a fake is fine for logic but a real broker
  test is worth having behind a tag. **Recommendation to the human: keep both; make the integration lane a
  separate, Docker-capable CI job that is required-on-`proto/`/`pkg/spine`-changes but not on every commit.**

## Decision: Temporal for durable deletion; SDK test suite as the proof

- **Decision**: The consent-withdrawal deletion is a **Temporal** workflow (`workflows/deletion`) with
  idempotent, compensating activities (`ErasePostgres`, `DeleteS3Objects`, `ClearRedis`, `CryptoShred`
  [KMS stub], `RecordDeletionAudit`), proven with `testsuite.TestWorkflowEnvironment` (runs to `Completed`;
  an injected activity failure triggers retry/compensation). `WithdrawConsent` calls a `DeletionStarter`
  seam exactly once.
- **Rationale**: This is the real §13 mechanism (durable workflow, idempotent activities, compensation),
  provable hermetically via the SDK test suite — no managed Temporal cluster needed for the gate. The KMS
  crypto-shred is the only piece that needs a real key, so it is a clearly-marked stub (DP-6).
- **Alternatives considered**: A synchronous in-process deletion — rejected: doesn't model the durable,
  compensating, cross-store reality §13 requires. A managed Temporal dependency in the gate — rejected: the
  test suite proves the logic without it.

## Decision: Terraform is validate-only in this slice

- **Decision**: Express the AWS runtime (§4) as Terraform modules (`bootstrap-org`, `network-vpc`, `eks`,
  `rds`, `s3-kms`, `iam`, `event-runtime`) that pass `terraform init -backend=false && terraform validate &&
  terraform fmt -check`. Core + Identity are modeled; Public/Sandbox/Sensitive are reserved (empty boundary
  modules). **No** `apply`, backend, or credentials.
- **Rationale**: `terraform validate` proves the IaC is well-formed and reviewable (a reviewer can read
  `infra/` and know the footprint, §4.4) **without** an AWS org or creds, which the buildable gate must not
  require. `apply` is the deferred production step (§4.1 requires an ADR + org sign-off anyway).
- **Alternatives considered**: `terraform plan` against a real account — rejected: needs credentials.
  Skipping IaC entirely — rejected: §17 gate item 8 (AWS provenance) and §4 make the Terraform footprint
  part of the substrate; validate-only is the buildable subset.

## Decision: Single Go module now; per-service split deferred

- **Decision**: Ship the slice as one Go module (`github.com/gt100k/platform`) so
  `go vet ./... && go build ./... && go test ./...` works verbatim from repo root. Keep clean package
  boundaries (`pkg/platform`, `pkg/spine`, `services/identity-consent`, `workflows/deletion`) so the
  per-deployable module split + `go.work` (parent §26.2) is a mechanical later refactor.
- **Rationale**: A `go.work` multi-module layout complicates `go build ./...` (it only builds the current
  module) and needs a script to walk modules — unjustified complexity for the buildable slice. The package
  boundaries already encode the eventual service ownership.
- **Alternatives considered**: Multi-module `go.work` now — rejected as premature; single module with the
  right package seams gives the same eventual split at lower cost.

## Decision: Synthetic-only, mechanical legal layer; append-only everywhere; injected clock/ids

- **Decision**: All actors/learners are pseudonymous synthetic refs; consent/assent legal artifacts
  (document hash, signature) are placeholder strings; enrollment is a stub; contracts are append-only
  (corrections are new records linked by `causation_id`; the store rejects re-writing a `contract_id`); the
  invariant core reads no wall-clock and generates no random ids (clock + id injected), and the Temporal
  workflow uses deterministic APIs.
- **Rationale**: Constitution V (synthetic-only until pre-live gates), POL-004/006 (replayable, append-only),
  and FR-016 (determinism). Modeling the *mechanics* is the buildable, testable part; real legal semantics
  are explicitly not this slice's job.
- **Alternatives considered**: Faking real legal validity — rejected; would misrepresent a stub as a legal
  control (Constitution IX intent). Mutable records with version columns — rejected; violates append-only.

## Pinned toolchain (rationale)

See [spec.md → Build gate + pinned toolchain](./spec.md#build-gate--pinned-toolchain) for the table. Versions
were pinned to recent stable releases current as of the 2026-07 build window (Go 1.25.5, buf 1.50.0,
protoc-gen-go 1.36.5, protoc-gen-go-grpc 1.5.1, OPA 1.4.0, Terraform 1.11.4, Temporal SDK 1.34.0,
testcontainers-go 0.35.0, franz-go 1.18.1, pgx 5.7.2). Pinning in `go.mod` + the CI setup actions makes the
gate reproducible; the `buf.gen.yaml` plugin pins make code generation reproducible.
