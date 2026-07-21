# Foundation Spine Operations Runbook

This runbook operates and validates the buildable GT100K foundation spine. It covers the Protobuf
contracts, Go domain and adapters, embedded OPA policies, Temporal deletion workflow, and validate-only
Terraform. The default path is synthetic-only and does not connect to live Redpanda, Temporal, an OPA
server, PostgreSQL, AWS, or child data.

## Safety boundary

- Run commands from the repository root with Go 1.25.5, buf 1.50.0, OPA 1.4.0, and Terraform 1.11.4.
- Do not supply cloud credentials or production secrets. The default gate needs neither.
- Treat every committed fixture as synthetic. Stop if a command asks for live identity or child data.
- Infrastructure work is validate-only: never terraform plan or apply. `validate_all.sh` disables the
  backend and uses temporary work and data directories so provider caches do not enter the source tree.
- The optional integration lane may start ephemeral Redpanda and PostgreSQL containers through
  testcontainers. It still uses synthetic records and does not contact a managed service.

Check the pinned tools before diagnosing a gate failure:

```bash
go version
buf --version
opa version
terraform version
```

## Mandatory gate

Run the complete default gate before handoff:

```bash
make gate
```

`make gate` runs four lanes in order:

1. `gate-contracts` lints the schemas, exercises the G-BUF compatibility fixtures, compares against the
   local `main` schema baseline, and checks that committed generated Go is fresh.
2. `gate-go` runs `go vet ./...`, `go build ./...`, and `go test ./...`. This lane uses in-memory fakes and
   the Temporal SDK test suite; it needs no Docker or live service.
3. `gate-policy` runs the embedded Rego decision tables with `opa test policies/ -v`.
4. `gate-terraform` checks module and environment contracts, failure propagation, and backend-disabled
   `init`/`validate`/`fmt` for every module and the dev composition.

The contract lane requires repository history because it compares `proto/` with the local `main` ref and
checks the generated tree with a repository diff. On a runner where Git operations belong to the harness,
do not run `make gate`; run every non-Git constituent below and leave the two Git-backed comparisons to the
harness:

```bash
buf format --diff
buf lint
buf lint proto
./proto/breaking_test.sh
./proto/generated_freshness_test.sh

go vet ./...
go build ./...
go test -count=1 ./...

opa check --strict policies
opa test policies/ -v

./infra/terraform/modules_contract_test.sh
./infra/terraform/dev_environment_contract_test.sh
./infra/terraform/validate_all_test.sh
./infra/terraform/validate_all.sh
```

The deferred Git-backed checks are `./proto/breaking_against_main.sh` and the in-place generated-code
diff in `gate-contracts`. CI runs the complete `make gate` path from a full checkout.

## End-to-end synthetic demo

Exercise the complete in-memory path after the mandatory gate:

```bash
go run ./cmd/demo
```

The demo must finish with the deterministic summary described in
[`specs/005-foundation-spine/quickstart.md`](../specs/005-foundation-spine/quickstart.md). It covers the
reference-only enrollment handoff, consent and assent, OPA authorization, command/outbox/projection,
override, appeal, withdrawal, and Temporal deletion. It does not prove managed-runtime availability or
cloud provisioning.

## Optional integration lane

Use a Docker-capable runner to exercise real transport and storage adapters:

```bash
docker version
make gate-integration
```

This is equivalent to `go test -tags=integration ./...`. Testcontainers starts ephemeral Redpanda and
PostgreSQL instances and proves atomic outbox persistence plus exactly-once projection under replay and
out-of-order delivery. The default gate remains authoritative and must stay green even when Docker is not
available.

## Failure recovery

Preserve the first failing output and repair the narrowest failing lane. Do not weaken or skip an
acceptance test.

### Contracts or generated Go

- Run `buf format --diff`, `buf lint`, and `buf lint proto` to distinguish formatting from schema errors.
- Reproduce compatibility behavior with `./proto/breaking_test.sh`. Never reuse or renumber an existing
  field tag; make compatible additions with a new tag.
- If generated freshness fails, update the schema rather than editing `proto/gen` by hand, run
  `buf generate proto`, then rerun `./proto/generated_freshness_test.sh`.
- A failure to resolve the local `main` baseline is a checkout/history problem, not permission to skip
  compatibility. Restore the repository's normal full-history checkout and rerun the contract lane.

### Go, OPA, or demo

- Re-run the failing Go package with `go test -count=1 ./path/to/package`, then rerun vet, build, and the
  full unit lane. Keep integration-only dependencies behind `//go:build integration`.
- Run `opa check --strict policies` before the focused `opa test` command. Unknown inputs must remain
  deny-by-default; do not change golden reason-code precedence to make a test pass.
- The demo is deterministic and headless. A missing final summary or unexpected stderr is a failure even
  if an internal step completed; reproduce it with `go test -count=1 ./cmd/demo` before changing the CLI.

### Terraform

- Start with the structural scripts, then run `./infra/terraform/validate_all.sh`. Its last printed
  configuration identifies the failing module or environment.
- A credential prompt, backend operation, `plan`, or `apply` attempt is a gate defect. Stop immediately;
  do not provide credentials.
- The validation script mirrors the Terraform tree and cleans its temporary data on exit. If a source
  `.terraform` directory appears, verify it is generated cache data and remove only that exact cache;
  never remove Terraform source or state.

### Docker integration

- Confirm `docker version` succeeds before rerunning `go test -tags=integration -count=1 ./pkg/spine`.
- Treat container startup, image availability, and host resource failures as runner issues only after the
  focused test output proves the adapter code was not reached.
- Testcontainers owns the ephemeral containers. Do not point the test at shared or production endpoints.

## Deferred production direction

This slice supplies production-shaped contracts and seams, not a deployed production control plane.
Future work must replace or operate the existing boundaries without weakening their invariants:

| Current seam | Deferred production target |
|---|---|
| In-memory and franz-go `EventBus` adapters | Managed US-region Redpanda, capacity and durability operations |
| Temporal SDK test environment and `DeletionStarter` | Managed Temporal workers, namespaces, task queues, and recovery operations |
| Stubbed `crypto_shred` activity | Per-subject AWS KMS key destruction |
| Embedded, tested Rego bundle | Cosign-signed OPA bundles and two-reviewer high-stakes release |
| In-memory/pgx repositories and synthetic identity resolution | RDS data planes and the isolated Identity and Consent vault |
| Reference-only enrollment stub | Real Track A/B admissions eligibility handoff |
| Validate-only Terraform | Approved AWS Organization deployment; apply remains out of scope here |
| Package boundaries in one Go module | Per-service modules and deployable runtime supervision |
| Contract-level override and appeal records | Human approval routing, notifications, SLA timers, and remedy workflows |
| Trace IDs in the envelope | OTel/Prometheus/Grafana export, mTLS, workload identity, and DR sign-off |

Do not infer production readiness from a green hermetic gate. Managed-service credentials, deployment,
live-data validation, release signing, runtime observability, and disaster-recovery exercises require
separate approved work.
