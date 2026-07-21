# Phase 0 Research: Platform Foundation Spine

The feature is scoped from a detailed baby-PRD ([FOUNDATION_PRD.md](../../docs/prd/FOUNDATION_PRD.md))
and the parent PRD §26–§28, §30, §32.1, so there are no open unknowns. The decisions below record the
choices the plan rests on — chiefly *what is built in TypeScript now vs. what is the deferred
production target*.

## Decision: Build the spine's core **logic** in TypeScript; defer the runtime

- **Decision**: Implement a pure-TS, locally-testable reference of the spine — the contract envelope +
  four contracts + invariants, the consent/assent/identity domain, the purpose-authorization
  predicate, and the outbox + idempotent-consumer pattern — as `packages/platform-contracts` and
  `packages/platform-spine` with in-memory adapters. The definition of done is **`tsc -b` + Vitest**.
- **Rationale**: The correctness that matters most in the spine is *rules*, not infrastructure:
  "no machine decides," "append-only," "deny-by-default," "exactly-once projection under at-least-once
  delivery," "withdrawal blocks new processing." Those are provable in pure TypeScript and are exactly
  what an autonomous build loop can verify. Infrastructure (Redpanda/Temporal/OPA/PostgreSQL/AWS)
  proves *operational* properties that a typecheck+unit gate cannot, so it is the deferred target.
- **Alternatives considered**: Building against the real Go/Redpanda/Temporal/OPA stack — rejected for
  this slice: it cannot be exercised by a `tsc -b` + Vitest loop and front-loads infra before the
  invariants are even locked. Skipping the TS reference and going straight to production — rejected:
  it inverts "implement the contracts first" (parent §32.1) and risks baking a defective invariant
  into every consumer.

## Decision: Two pure packages — `platform-contracts` and `platform-spine`

- **Decision**: `platform-contracts` holds the envelope + `LearnerEvent`/`ConsentGrant`/`AssentRecord`/
  `DecisionRecord` types, validators, and encoded invariants (append-only, model-cannot-fill-human,
  active-consent, refusal-honored). `platform-spine` depends on it and holds the identity/consent/
  assent domain, the authorization predicate, and the event-bus + outbox logic.
- **Rationale**: Contracts are the thing "all later work depends on" (parent §32.1); isolating them in
  a dependency-free package lets consumers (and later the real wire types) import just the contracts.
  The spine's behavior sits one layer up and injects all I/O via ports, mirroring
  `packages/learning-loop` (pure domain + ports + adapters).
- **Alternatives considered**: One combined package — rejected; muddies the "contracts first, depended
  on by everything" boundary. Per-contract packages — rejected as over-fragmented at slice scale.

## Decision: Ports for every I/O + the deferred production seams

- **Decision**: Define ports for persistence (identity/consent/assent/decision/audit + outbox store),
  the event bus, the clock, the id generator, the enrollment-handoff source, and a **deletion-workflow
  stub**. Ship in-memory / stub adapters now.
- **Rationale**: Injecting I/O and time keeps the core deterministic and replay-safe (FR-016), and each
  port is the exact seam where a production adapter (PostgreSQL repo, Redpanda producer/consumer,
  Temporal deletion workflow, real admissions interface) slots in later with **zero domain change**.
  The ports *are* the "cutover is config, not rewrite" guarantee (FOUNDATION_PRD §7.3).
- **Alternatives considered**: Direct in-memory maps in the domain — rejected; breaks determinism and
  the later-cutover story.

## Decision: Purpose authorization as a deterministic predicate (local OPA analogue)

- **Decision**: Model the OPA/Rego decision as a pure TS function `authorize(request, consents, policy)
  -> { allow, reason, policy_version }`, **deny-by-default**, keyed on role + purpose + active consent +
  jurisdiction. The `policy` is a versioned, data-driven rule set (an allow-list), not code branches.
- **Rationale**: A pure predicate over explicit inputs is trivially testable across allow, deny,
  unknown-role/purpose (deny-by-default), expired/withdrawn consent, and jurisdiction mismatch. It
  emits a `policy_version` for the envelope/audit exactly as the real sidecar would. The real signed
  Rego bundle + local sidecar is the deferred production form of *the same decision*.
- **Alternatives considered**: Embedding an actual OPA/WASM evaluator — rejected for this slice
  (infra + bundle signing, not logic); it is the deferred target. Hard-coded `if` branches — rejected;
  a data-driven allow-list is closer to policy-as-code and keeps deny-by-default honest.

## Decision: Transactional outbox + idempotent consumers as pure logic

- **Decision**: Model the outbox as: a `UnitOfWork` that stages business state + an outbox row together
  (atomic commit or nothing), a `relay` that publishes staged rows with an idempotency key
  (at-least-once, retry-safe), and consumers that dedupe on `contract_id` and keep the first result.
- **Rationale**: The outbox's whole point is removing the DB-vs-log dual-write race; that property is
  logic and can be proven in-memory (partial-commit rejected; replayed `contract_id` applied once;
  synthetic burst loses nothing). Redpanda is the deferred transport, but the *pattern*'s correctness
  does not depend on it.
- **Alternatives considered**: Publishing directly from the command handler (no outbox) — rejected;
  reintroduces the dual-write race the parent PRD calls out (§9, §19.3). A real broker — deferred.

## Decision: Contracts are append-only; corrections are new records

- **Decision**: A contract is immutable once recorded; the store rejects re-writing an existing
  `contract_id`; a correction is a new record whose `causation_id` references the prior.
- **Rationale**: Satisfies POL-006 / parent §28 "append-only, corrections attach never overwrite" and
  makes decision replay meaningful (FR-011). It is enforceable as a repository + validator rule.
- **Alternatives considered**: Mutable records with version columns — rejected; violates the append-only
  invariant and complicates replay.

## Decision: Synthetic-only, mechanical legal layer

- **Decision**: All learners/actors are pseudonymous synthetic refs; consent/assent legal artifacts
  (document hash, signature, legal validity) are placeholder strings; the enrollment handoff is a stub.
- **Rationale**: Constitution V (synthetic-only until pre-live gates) and FOUNDATION_PRD §3.3/§19.2.
  Modeling the *mechanics* (purpose/expiry/withdrawal/refusal/deny-by-default) is the buildable,
  testable part; real legal semantics are explicitly not this slice's job.
- **Alternatives considered**: Faking real legal validity — rejected; would misrepresent a stub as a
  legal control (Constitution IX intent).
