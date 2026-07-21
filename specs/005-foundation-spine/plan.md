# Implementation Plan: Platform Foundation Spine

**Branch**: `005-foundation-spine` | **Date**: 2026-07-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-foundation-spine/spec.md`; baby PRD
[`docs/prd/FOUNDATION_PRD.md`](../../docs/prd/FOUNDATION_PRD.md); parent [`PRD.md`](../../docs/prd/PRD.md)
§26–§28, §30, §32.1.

## Summary

Build a **code-first, locally-testable TypeScript reference of the platform spine's core logic** — the
part whose correctness is a matter of rules, not infrastructure. Two pure, framework-agnostic packages:
`packages/platform-contracts` (the versioned envelope header + the **six** foundation contracts
`LearnerEvent`/`ConsentGrant`/`AssentRecord`/`DecisionRecord`/`OverrideRecord`/`Appeal` with their
invariants encoded — append-only, active-consent, refusal-honored, **four-eyes override**, **appeal
reviewer independence**, and **a model output can never fill `DecisionRecord.authorized_human`**) and
`packages/platform-spine` (pseudonymous identity/consent/assent domain, a deterministic
**purpose-authorization predicate** that is a local OPA analogue, and the **transactional-outbox +
idempotent-consumer** event-spine pattern). All I/O sits behind ports with in-memory / stub adapters
(`adapters/spine-repo-memory`, `adapters/spine-bus-memory`, `adapters/enrollment-stub`), so the core is
deterministic and 100% unit-testable. **Definition of done: `tsc -b` + Vitest.** Synthetic-only; the
legal layer is modeled mechanically and stubbed.

**The production stack is the deferred target** (see "Deferred: production direction" below) — Go
services, Redpanda, Temporal, signed OPA/Rego bundles, PostgreSQL, AWS + Terraform, managed runtimes,
crypto-shred deletion, observability, CI/CD signing. This slice locks the invariants those systems will
carry; each port is the exact seam where a production adapter slots in with **zero domain change**.

## Technical Context

**Language/Version**: TypeScript (strict), Node.js LTS (per parent §26.1). Inherits `tsconfig.base.json`
(`strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `composite`).

**Primary Dependencies**: None in the domain packages (pure TS). No crypto/network/DB imports in the
core. pnpm workspaces + Vitest + Biome + `tsc -b` (the existing factory gate).

**Storage**: In-memory adapters behind ports (`ConsentRepository`, `DecisionRepository`,
`OverrideRepository`, `AppealRepository`, `AuditLog`, `OutboxStore`, `ConsumerOffsets`, …) for the
synthetic slice; PostgreSQL is the deferred production adapter.

**Testing**: Vitest (unit + contract), matching the workspace `vitest.config.ts` include globs
(`packages/**/test`, `adapters/**/test`).

**Target Platform**: Local/dev (Node). No cloud/infra in this slice.

**Project Type**: TS monorepo libraries (`packages/` domain + `adapters/` I/O). No app/frontend needed;
the spine is exercised by tests and a demo script.

**Performance Goals**: Not performance-bound; domain ops are O(1)–O(n) over small synthetic sets. The
parent's 10,000 events/s durability target is an operational property of the **deferred** Redpanda
runtime; this slice proves the *logical* no-loss / no-double-apply property on a synthetic burst.

**Constraints**: Pure domain logic — no I/O, no wall-clock reads, no random ids in the core (clock +
id generator injected). Deterministic and replay-safe (FR-016). Append-only contracts (POL-006).
Deny-by-default authorization (FR-007). Synthetic-only; legal layer stubbed (FR-015).

**Scale/Scope**: One synthetic tenant / learner flow; six contracts; the outbox + idempotent-consumer
pattern; synthetic data only.

## Constitution Check

*GATE: must pass before Phase 0. Re-checked after Phase 1.*

| Principle | Status | Note |
|---|---|---|
| I. Human authority over consequential decisions | ✅ Pass (enforced) | `DecisionRecord` cannot be finalized without a named `authorized_human` + policy result; **a model/system actor can never fill it** (FR-005, SC-002). `OverrideRecord` requires **four-eyes** (two distinct human approvers, never model/system) for override classes (FR-017, SC-008); `Appeal` requires an **independent reviewer** ≠ the original decision owner (FR-018, SC-009). Records are append-only + replayable (FR-011, FR-016; POL-004/006). |
| II. Child assent and veto | ✅ Pass (enforced) | `assentBlocks` makes a child's honorable refusal block optional collection even with guardian consent present (FR-004, SC-006). |
| III. Evidence-class authority ladder | ✅ Pass | No learned model runs here; a `model` actor is admissible only as advisory `model_version`/evidence, never as decision authority (FR-005). |
| IV. Evidence before authority; deterministic rules | ✅ Pass (core purpose) | Authorization is a **deterministic policy predicate**, deny-by-default, returning a `policy_version` — a model cannot change the rule (FR-007; PRD §4.1). |
| V. Privacy follows purpose | ✅ Pass | Synthetic-only; downstream sees only a pseudonymous `actor_ref` + purpose scope (FR-012); consent is purpose-scoped with jurisdiction/residency deny (FR-008); legal layer stubbed (FR-015). Real crypto-shred deletion deferred as an interface stub (FR-014). |
| ENG (governed flow, tests-define-done, no secrets) | ✅ Pass | Branch→PR→CI; `tsc -b` + Vitest + Biome gate; no secrets/machine paths; synthetic-only; versioned contracts with append-only field evolution modeled (parent §28). |
| IX. Prohibited product behavior | ✅ Pass | No automated consequential decision is representable (human authority enforced); four-eyes gates override classes (admissions, public exposure, safeguarding, credential revocation) so no single actor can supersede a decision (FR-017); no irrevocable/automated admission (enrollment is a read-only synthetic stub). |

**Result: PASS** — no violations, no Complexity Tracking needed. The deliberate deferrals (production
runtime, real OPA bundle signing, crypto-shred deletion, and the `OverrideRecord`/`Appeal` **human
workflows**) are **explicit production-direction / pre-live items**, represented by clearly-marked ports +
notes rather than silent omission. The six contract **shapes + invariants** — including
`OverrideRecord`/`Appeal` — are in scope and enforced.

## Project Structure

### Documentation (this feature)

```text
specs/005-foundation-spine/
├── plan.md              # This file
├── spec.md              # Feature spec (user stories, FR, SC)
├── research.md          # Phase 0 decisions
├── data-model.md        # Phase 1 entities + ports + state transitions
├── quickstart.md        # Phase 1 validation guide
├── contracts/
│   └── foundation-spine.md   # domain API + ports + test obligations
├── checklists/
│   └── requirements.md  # spec quality checklist
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
packages/
├── platform-contracts/          # PURE, dependency-free — the thing everything depends on
│   ├── src/
│   │   ├── actor.ts             # ActorRef + class/role
│   │   ├── envelope.ts          # EnvelopeHeader + validateEnvelope + SCHEMA_VERSIONS
│   │   ├── learner-event.ts     # LearnerEvent + validateLearnerEvent
│   │   ├── consent.ts           # ConsentGrant + validateConsentGrant + isConsentActive
│   │   ├── assent.ts            # AssentRecord + validateAssentRecord + assentBlocks
│   │   ├── decision.ts          # DecisionRecord + validateDecisionRecord (human-authority invariant)
│   │   ├── override.ts          # OverrideRecord + validateOverrideRecord (four-eyes; FR-017)
│   │   ├── appeal.ts            # Appeal + validateAppeal (reviewer independence; FR-018)
│   │   ├── invariants.ts        # assertEnvelopeComplete / assertHumanAuthority / assertAppendOnly /
│   │   │                        #   assertFourEyes / assertReviewerIndependent
│   │   ├── validate.ts          # validatorFor(schema_version) registry (FR-006)
│   │   └── index.ts
│   ├── test/                    # Vitest unit + contract tests (mirror FR/SC + contracts/)
│   ├── package.json
│   ├── tsconfig.json            # extends ../../tsconfig.base.json
│   └── README.md
└── platform-spine/              # PURE domain — depends on platform-contracts
    ├── src/
    │   ├── identity.ts          # provisionLearner, pseudonymous actor resolution
    │   ├── consent-service.ts   # grantConsent / withdrawConsent (enqueues DeletionWorkflow stub)
    │   ├── assent-service.ts    # recordAssent
    │   ├── policy.ts            # authorize() deny-by-default predicate + PolicySet (local OPA analogue)
    │   ├── outbox.ts            # UnitOfWork staging + relay (idempotency key, at-least-once)
    │   ├── bus.ts              # deliver() idempotent consumer (dedup on contract_id)
    │   ├── command.ts          # handleCommand() full path: resolve→consent→authorize→commit
    │   ├── audit.ts            # AuditEntry helpers (append-only)
    │   ├── ports.ts            # all ports incl. DeletionWorkflow (stub) + EnrollmentHandoffSource
    │   └── index.ts
    ├── test/
    ├── package.json             # dependency: @gt100k/platform-contracts (workspace:*)
    ├── tsconfig.json            # extends base; references ../platform-contracts
    └── README.md
adapters/
├── spine-repo-memory/           # in-memory repos (consent/assent/identity/decision/override/appeal/
│                                #   audit) + outbox store + consumer offsets (synthetic)
├── spine-bus-memory/            # in-process EventBus
└── enrollment-stub/             # synthetic EligibleLearner roster + fixtures.ts + no-op DeletionWorkflow stub
```

**Structure Decision**: A TS monorepo (per parent §26.1) with the spine's rules quarantined in **two
pure, side-effect-free packages** mirroring `packages/learning-loop` (pure domain + ports + adapters).
`platform-contracts` is dependency-free because it is the thing "all later work depends on" (parent
§32.1); `platform-spine` builds behavior on top and injects all I/O via ports. Go/Rust services (parent
§26.2/§26.3) are **not** used in this slice and are the deferred production form.

**Parallel-safety**: all new code lives in `packages/platform-contracts`, `packages/platform-spine`,
`adapters/spine-repo-memory`, `adapters/spine-bus-memory`, and `adapters/enrollment-stub`. The root
workspace glob (`packages/*`, `adapters/*`) and the Vitest include (`packages/**/test`,
`adapters/**/test`) already discover them, so **no** shared root file (`package.json`,
`pnpm-workspace.yaml`, `vitest.config.ts`, `biome.json`) is edited. The **only** shared-file touch is
adding composite project references to the root `tsconfig.json`; that is the **final task** (T-last) and
is the single point a human reconciles at merge.

## Deferred: production direction (described, not built or tasked here)

Per the build-loop gate (`tsc -b` + Vitest), the production stack below is the **target this slice's
ports are shaped for**, not work in `tasks.md`. Each row names the port/seam where it slots in.

| Spine concern (FOUNDATION_PRD §) | Deferred production target | Port / seam it replaces |
|---|---|---|
| Contract registry + wire format (§7, parent §28) | Protobuf + JSON from one `proto/` registry; **Buf** breaking-change gate in CI | The TS types + `validatorFor(schema_version)` model the same compatibility discipline |
| Event spine (§9) | **Redpanda** (managed, US region, child-data DPA); durability 99.99%, 10k events/s | `EventBus` port (in-process bus → Redpanda producer/consumer) |
| Transactional outbox relay (§9) | DB outbox table + relay to Redpanda with idempotency key | `OutboxStore` + `relay()` |
| Policy-as-code (§11) | Signed **OPA/Rego** bundles evaluated by a local sidecar on every command | `authorize()` predicate + `PolicySet` (local OPA analogue) → OPA sidecar client |
| Data plane (§12) | Per-service **PostgreSQL** (bitemporal), Redis (revocation/session), S3 + Iceberg | `*Repository` / `AuditLog` / `ConsumerOffsets` ports |
| Deletion & retention (§13) | **Temporal** workflow: cross-store erasure + per-subject **crypto-shred** (KMS) | `DeletionWorkflow` **stub port** (interface only, FR-014) |
| Override / appeal **workflows** (§7.2, parent §28) | Four-eyes approval routing/notifications; appeal SLA timers + remedy execution | `OverrideRecord`/`Appeal` **contracts + invariants are in scope** (FR-017/FR-018); only the human workflows are deferred |
| Identity vault (§10) | Own Identity & Consent vault (passkeys/MFA), Identity AWS account | `IdentityRepository` (pseudonymous resolution kept identical) |
| Enrollment handoff (§7.3) | Real admissions Track A/Track B eligibility interface | `EnrollmentHandoffSource` stub → real client (config, not rewrite) |
| Runtime & IaC (§4) | **AWS** (EKS, RDS+pgvector, S3, KMS, CloudFront, VPC) via **Terraform**; account isolation | Out of scope — no infra in `tasks.md` |
| CI/CD & release (§15) | GitHub Actions sign, Argo CD, OpenFeature rings (cannot bypass consent/policy) | Out of scope for this slice |
| Observability (§16) | OpenTelemetry / Prometheus / Grafana; `correlation_id`/`causation_id` tracing | Header carries `correlation_id`/`causation_id` already; wiring deferred |
| Reliability/security (§14, §30) | mTLS, short-lived workload identity, default-deny networks, RTO/RPO sign-off | Out of scope for this slice |

**Also out of scope (noted, not built):** the four-eyes override **approval routing/notification
workflow**, appeal **SLA timers / remedy execution**, and DR drills. The `OverrideRecord`/`Appeal`
**contracts + invariants** themselves are **in scope** (FR-017, FR-018) — this closes the parent §32.1
"override, appeal" contract set.

## Complexity Tracking

None — Constitution Check passed with no violations. The two-package split (contracts vs. spine) is the
minimum needed to keep "contracts everything depends on" dependency-free; it adds no unjustified
complexity.
