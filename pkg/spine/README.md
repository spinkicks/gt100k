# Foundation spine orchestration

`pkg/spine` connects pseudonymous identity, active consent, OPA authorization, immutable contracts, the transactional outbox, consumer deduplication, and append-only audit through injected Go interfaces. Import it as `github.com/gt100k/platform/pkg/spine`.

The package owns orchestration primitives, not a process host. A caller supplies each port, invokes the command or lifecycle function, runs `Relay`, and passes consumed events to `Deliver`.

## Command path

`HandleCommand` performs one policy-governed state transition:

1. Resolve the session to a pseudonymous actor through `IdentityResolver`.
2. Load candidate grants through `ActiveConsentSource`.
3. Send actor, purpose, subject, jurisdiction, time, and grants to `Authorizer`.
4. Write one `policy_deny` audit entry when policy denies the command.
5. On allow, clone and validate the decision and event, apply the returned `policy_version`, then commit the decision, outbox row, and audit entry as one `UnitOfWork` through `OutboxStore`.

The function returns the recorded decision or a denied result. It does not publish the outbox row in the command transaction.

`Command` carries the session, policy scope, candidate decision, and candidate event. `HandleResult` reports either the cloned recorded decision or a policy denial.

## Public API

### Ports

| Area | Interfaces |
|---|---|
| Identity and consent | `IdentityResolver`, `ActiveConsentSource`, `IdentityRepository`, `ConsentRepository`, `AssentRepository`, `EnrollmentHandoffSource` |
| Policy | `Authorizer`, with `PolicyInput` and `PolicyDecision` |
| Immutable records | `DecisionRepository`, `OverrideRepository`, `AppealRepository`, `AuditLog` |
| Event delivery | `OutboxStore`, `EventBus`, `EventSource`, `ConsumerOffsets`, `Projection` |
| Deletion | `DeletionStarter` |

`CommandDeps`, `OverrideDeps`, and `AppealDeps` collect the narrow ports used by `HandleCommand`, `RecordOverride`, and `FileAppeal`.

### Transactional outbox and relay

`UnitOfWork` groups a decision, validated events, `OutboxRow` values, and audit entries. The in-memory and PostgreSQL stores commit the decision, outbox rows, and audit entries atomically.

`Relay` reads pending rows in store order. It calls `EventBus.Publish` before marking a row relayed, so publish failure leaves the row pending. A mark failure can publish the same row again on retry. This gives the transport at-least-once delivery, keyed by the event `contract_id`.

### Consumer deduplication

`Deliver` validates each `LearnerEvent`, asks `ConsumerOffsets` whether its `contract_id` has been seen, applies unseen events through `Projection`, and marks the ID after a successful apply. It returns `true` when the event reaches both apply and mark; a replay of a marked ID returns `false` without applying it.

`Projection.Apply` and `ConsumerOffsets.Mark` do not share a transaction in this package. A production projection must make apply idempotent or persist the projection and offset in one adapter transaction.

### Audit and lifecycle records

`AuditEntryInput` holds the facts accepted by `NewAuditEntry`. The constructor clones caller-owned Protobuf values, and `ValidateAuditEntry` enforces the replayable audit shape. `RecordOverride` and `FileAppeal` load the immutable target decision, validate a cloned candidate, append the new lifecycle record, and append an `override` or `appeal_filed` audit entry.

Lifecycle record and audit appends do not share a transaction. Production adapters that require atomic lifecycle writes must provide a transactional boundary above these narrow repositories.

## OPA authorization edge

`pkg/spine` defines the `Authorizer` contract. `services/identity-consent` implements it with the OPA Go SDK and an embedded, compiled Rego bundle. The edge filters grants through `platform.IsConsentActive`, evaluates deny-by-default policy in process, and returns the bundle revision as `policy_version`. `HandleCommand` records that version on the contracts and audit entry.

## Available adapters and tests

- `pkg/spine/memory` supplies hermetic stores, repositories, an at-least-once event bus, consumer offsets, and a projection for the default Go test lane.
- `pkg/spine/pg` supplies PostgreSQL decision, outbox, and audit adapters over pgx.
- `pkg/spine/redpanda` supplies franz-go producer and consumer adapters. Records use `contract_id` as the Kafka key.
- `pkg/spine/outbox_integration_test.go` carries the `//go:build integration` tag and proves the PostgreSQL and Redpanda path with testcontainers. The default test lane does not require Docker.

## Limits and deferred production work

This slice has no long-running relay host, consumer supervisor, schema migration runner, or managed-service deployment. It also lacks durable adapters for identity, consent, assent, lifecycle repositories, consumer offsets, and projections. Those seams remain explicit in `ports.go`.

GT100K defers managed runtime deployment and operations. Production work still includes hosted Redpanda and Temporal configuration, real KMS crypto-shred, signed OPA bundles and images, service-mesh security, observability export, and Terraform apply with approved cloud credentials.
