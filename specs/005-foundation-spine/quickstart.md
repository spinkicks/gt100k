# Quickstart: Platform Foundation Spine (validation guide)

How to prove the slice works end-to-end once implemented. Implementation code lives in
[tasks.md](./tasks.md) / the code itself — this is a run/validation guide only. Everything here is
**synthetic-only** and requires **no** Redpanda, Temporal, OPA, PostgreSQL, or cloud infrastructure.

## Prerequisites

- Node.js LTS + pnpm installed.
- Repo bootstrapped: `pnpm install` at the repo root (pnpm workspace).
- **No env or secrets needed** — the slice is pure TS + synthetic in-memory adapters (see
  [spec.md → Env / secrets](./spec.md#env--secrets)). All fixtures are committed in
  `adapters/enrollment-stub/src/fixtures.ts` ([spec.md → Seed fixtures](./spec.md#seed-fixtures-in-repo));
  no external fetch.

## Primary validation — typecheck + tests (the definition of done)

```bash
tsc -b                 # composite build of all packages/adapters (must be clean)
pnpm test              # Vitest across the workspace
pnpm --filter @gt100k/platform-contracts test   # contract envelope + six contracts + invariants
pnpm --filter @gt100k/platform-spine test       # consent/assent/authorization + outbox/consumer
```

**Expected**: `tsc -b` clean, all Vitest suites green. The contract-test obligations in
[contracts/foundation-spine.md](./contracts/foundation-spine.md) all pass — envelope completeness,
`authorized_human` cannot be model-filled, `isConsentActive`, deny-by-default authorization, child
assent veto, atomic outbox commit, exactly-once projection under at-least-once **and out-of-order**
delivery, **four-eyes override**, and **appeal reviewer independence**. Every expected value is pinned in
[spec.md → Golden Values](./spec.md#golden-values--tolerances) and asserted by
`packages/platform-spine/test/golden.test.ts`.

## Run the spine demo (synthetic learner, end-to-end)

```bash
pnpm --filter @gt100k/enrollment-stub demo   # drives the full spine path against in-memory adapters
```

**Expected outcome** (synthetic fixture learner; mirrors the FOUNDATION_PRD §17 construction gate,
scaled to the buildable TS subset):

1. **Provisioning** — the fixture arrives through the **stubbed enrollment handoff**; the spine
   provisions a **pseudonymous** `actor_ref` (no legal identity downstream). (SC / gate 1)
2. **Consent lifecycle** — a guardian `ConsentGrant` is granted for a purpose; a child `AssentRecord`
   is recorded; a service refuses to process data lacking an active matching purpose. (gate 2)
3. **Traceability** — a consequential action emits a **`LearnerEvent`** whose envelope traces to
   `consent_purpose`, `policy_version`, `evidence_refs`, `schema_version`, and the responsible actor,
   with distinct `occurred_at`/`recorded_at`. (gate 3)
4. **Human authority** — a `DecisionRecord` **cannot** be finalized without a named `authorized_human`
   and a policy result; attempting to fill `authorized_human` with a `model` actor is rejected. (gate 4)
5. **Policy enforcement** — the authorization predicate **denies** a command whose purpose has no active
   consent (and any unknown role/purpose, deny-by-default), and the deny is recorded with its
   `policy_version`. (gate 5)
6. **Deletion (stub)** — guardian withdrawal blocks new processing for that purpose and **enqueues** the
   `DeletionWorkflow` stub; the append-only audit entry that the change occurred is preserved. (gate 6;
   real cross-store crypto-shred is deferred)
7. **Event durability (logical)** — a scaled-down synthetic burst flows outbox → in-process bus →
   projection with **no loss** and duplicate `contract_id`s rejected (exactly-once projection), including
   **out-of-order** delivery. (gate 7)
8. **Override & appeal** — an `OverrideRecord` with **two distinct human approvers** supersedes a prior
   `DecisionRecord` while **preserving the original** (both records + audit entries coexist); an `Appeal`
   filed with an **independent reviewer** (≠ the decision's `authorized_human`) is recorded without
   mutating the target. Attempting a model approver or a same-owner reviewer is rejected. (gate 8)

Switching the demo to a **denied** scenario (no consent / wrong jurisdiction / unknown role) shows the
command stopping at authorization with a recorded `policy_deny` audit entry and no `DecisionRecord`.

## Success criteria mapping

- SC-001 complete traceable envelope → `platform-contracts` envelope tests + demo step 3.
- SC-002 no model in `authorized_human`, human+policy required → `validateDecisionRecord` tests + step 4.
- SC-003 deny-by-default + policy_version → `authorize` tests + demo step 5.
- SC-004 exactly-once under at-least-once, no loss → outbox/`deliver` tests + demo step 7.
- SC-005 withdrawal blocks new processing + enqueues deletion (once) + audit preserved → `withdrawConsent`
  tests + demo step 6.
- SC-006 child assent veto → `assentBlocks` tests + demo step 2.
- SC-007 full run synthetic-only, `tsc -b` + Vitest green → this whole guide needs no external infra.
- SC-008 four-eyes override + original preserved → `validateOverrideRecord` tests + demo step 8.
- SC-009 appeal reviewer independence → `validateAppeal` tests + demo step 8.

## What this quickstart deliberately does **not** exercise (deferred production direction)

Redpanda throughput, Temporal deletion + KMS crypto-shred, signed OPA/Rego bundle evaluation,
PostgreSQL migrations, AWS/Terraform provisioning, mTLS/network, CI/CD signing, and the override/appeal
**human workflows** (four-eyes approval routing, appeal SLA timers + remedy execution) — see
[plan.md](./plan.md) "Deferred: production direction". Those prove *operational* / process properties a
`tsc -b` + Vitest loop cannot, and are the next-stage target the ports are already shaped for. The
override/appeal **contracts + invariants** themselves are exercised here (demo step 8).
