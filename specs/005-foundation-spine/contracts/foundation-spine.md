# Contract: `@gt100k/platform-contracts` + `@gt100k/platform-spine` interfaces

This slice exposes no external HTTP/network API; its "contract" is the public interface of the two pure
domain packages plus the record shapes. All domain functions are **pure over injected state** (no I/O,
no wall-clock reads, no random ids in the core — the clock and id generator are injected via ports,
FR-016). The production Protobuf/JSON registry + Buf compatibility gate (parent §28) is the deferred
wire form of these same types.

## Types

See [data-model.md](../data-model.md) for `ActorRef`, `EnvelopeHeader`, `LearnerEvent`, `ConsentGrant`,
`AssentRecord`, `DecisionRecord`, `OverrideRecord`, `Appeal`, `PolicyRule`/`PolicySet`,
`AuthorizationRequest`/`PolicyDecision`, `OutboxRow`, `UnitOfWork`, `AuditEntry`, `EligibleLearner`.

**Golden values**: the exact expected results for every validator/predicate below are pinned in
[spec.md → Golden Values & Tolerances](../spec.md#golden-values--tolerances) (G-ENV, G-DEC, G-ASSENT,
G-AUTH, G-IDEM, G-WD, G-OVR, G-APL), using the seed fixtures in
[spec.md → Seed fixtures](../spec.md#seed-fixtures-in-repo).

---

## `@gt100k/platform-contracts` — public functions

```text
validateEnvelope(header) -> void            // throws NamedFieldError on any missing/empty required field
                                            // model_version nullable; evidence_refs must exist (FR-001)

validateLearnerEvent(event) -> void         // envelope complete; distinct occurred_at/recorded_at;
                                            // event_type/learner_ref/source/payload_schema present (FR-002)

validateConsentGrant(grant) -> void         // envelope complete; purpose/jurisdiction/effective_at present;
                                            // expiry_at (if set) > effective_at (FR-003)
isConsentActive(grant, at) -> boolean       // not withdrawn AND at in [effective_at, expiry_at) (FR-003)

validateAssentRecord(record) -> void        // envelope complete; response ∈ {assent,refusal,dissent} (FR-004)
assentBlocks(record) -> boolean             // honorable AND response !== "assent" (FR-004, SC-006)

validateDecisionRecord(record) -> void      // envelope complete; if consequential: authorized_human present
                                            // AND policy_version non-empty; authorized_human.class never
                                            // model/system (FR-005, SC-002)

validateOverrideRecord(record) -> void      // envelope complete; target_decision/prior/new/rationale/
                                            // review_at present; four-eyes for override classes:
                                            // >=2 distinct human approvers, none model/system (FR-017, SC-008)
validateAppeal(appeal, authorizedHumanRef) -> void   // envelope complete; status in enum; independent_reviewer
                                            // ref !== authorizedHumanRef (reviewer independence) (FR-018, SC-009)

// invariants (shared)
assertEnvelopeComplete(header) -> void
assertHumanAuthority(actor) -> void         // throws AuthorityForgeryError if actor.class is model/system
assertAppendOnly(existingIds, contract_id) -> void   // throws AppendOnlyError if contract_id already present
assertFourEyes(approvers) -> void           // throws AuthorityForgeryError (model/system) or FourEyesError
                                            // (<2 distinct approver refs) (FR-017)
assertReviewerIndependent(reviewer, authorizedHumanRef) -> void  // throws ReviewerConflictError if equal (FR-018)

validatorFor(schema_version) -> Validator   // selects validator by schema_version (FR-006)
```

**Purity**: every function above is a pure predicate/validator over its arguments; none performs I/O.

---

## `@gt100k/platform-spine` — public functions

```text
// Identity (pseudonymous only — FR-012)
provisionLearner(source, identity, idgen) -> ActorRef
  Behavior: pull next EligibleLearner from the enrollment stub, provision a pseudonymous actor_ref.
  Postcondition: downstream sees actor_ref + purpose scope only — never legal identity.

// Consent / assent lifecycle
grantConsent(repo, grant) -> void              // append-only put; validates first
withdrawConsent(repo, deletionWorkflow, audit, contract_id, at) -> void
  Behavior: set withdrawal_state; enqueue DeletionWorkflow.requestDeletion (STUB); write audit entry.
  Postcondition: isConsentActive(...) === false thereafter; new processing for that purpose denied (SC-005).
recordAssent(repo, record) -> void             // validates; refusal is honorable (assentBlocks)

// Authorization (local OPA analogue — FR-007, FR-008)
authorize(request, consents, policySet) -> PolicyDecision
  Behavior: deny-by-default. allow ⇔ (active matching consent, jurisdiction agrees) AND
            (a PolicyRule matches role+purpose+jurisdiction). Always returns policy_version.
  Reasons: "allow" | "no_active_consent" | "jurisdiction_mismatch" | "deny_by_default".

// Transactional outbox + command path (FR-009, FR-010, FR-011)
handleCommand(deps, command) -> { decision: DecisionRecord | null; denied: boolean }
  Behavior: resolve actor -> load active consents -> authorize.
            deny -> append audit(policy_deny), return { denied: true }.
            allow -> build DecisionRecord (human-authorized) + LearnerEvent, then
            commit a UnitOfWork { decision, outbox row, audit } ATOMICALLY (all or nothing).
  Precondition: command carries a named human authorizer (never a model — assertHumanAuthority).

relay(outbox, bus) -> number                   // publish all pending rows with idempotency_key;
                                               // markRelayed; at-least-once; returns count published.
deliver(bus, offsets, projection, event) -> boolean
  Behavior: if offsets.seen(event.header.contract_id) -> return false (dedup no-op).
            else apply projection, offsets.mark, return true.  (FR-010, SC-004)
```

---

## Ports (implemented by adapters, injected)

See [data-model.md](../data-model.md) "Ports" for the full list: `Clock`, `IdGenerator`,
`ConsentRepository`, `AssentRepository`, `IdentityRepository`, `DecisionRepository`,
`OverrideRepository`, `AppealRepository`, `AuditLog`, `OutboxStore`, `EventBus`, `ConsumerOffsets`,
`EnrollmentHandoffSource`, and the **stub-only** `DeletionWorkflow`.

Adapters provided in this slice (all in-memory / stub, synthetic-only):

```text
adapters/spine-repo-memory   -> ConsentRepository, AssentRepository, IdentityRepository,
                                DecisionRepository, OverrideRepository, AppealRepository,
                                AuditLog, OutboxStore, ConsumerOffsets
adapters/spine-bus-memory    -> EventBus (in-process spine)
adapters/enrollment-stub     -> EnrollmentHandoffSource (synthetic EligibleLearner roster)
                                + a no-op DeletionWorkflow stub
```

---

## Contract test obligations (map to FR/SC)

**Contracts package (US1):**
- `validateEnvelope`: complete header passes; each missing/empty required field is rejected by name
  (FR-001, SC-001).
- `validateLearnerEvent`: distinct `occurred_at`/`recorded_at` required; immutable/idempotent by
  `contract_id` (FR-002).
- `validateDecisionRecord`: consequential record without `authorized_human` or `policy_version` is
  rejected; `authorized_human.class === "model"` (or `"system"`) is rejected in **100%** of attempts;
  a named human + policy result passes (FR-005, SC-002).
- `assertAppendOnly`: re-writing an existing `contract_id` throws (append-only edge).
- `validatorFor`: selecting a validator by `schema_version` works; unknown version errors (FR-006).

**Spine package (US2):**
- `isConsentActive`: true within window; false when withdrawn, expired, or before `effective_at`
  (FR-003).
- `authorize`: allow on active-consent + matching rule + jurisdiction; deny on no consent, on
  withdrawn/expired consent, on jurisdiction mismatch (FR-008), and on unknown role/purpose
  (deny-by-default); **every** result carries a `policy_version` (FR-007, SC-003).
- `assentBlocks`: guardian consent present + child refusal ⇒ optional collection blocked (FR-004,
  SC-006).
- `withdrawConsent`: after withdrawal, `isConsentActive` false and `authorize` denies; a
  `DeletionWorkflow.requestDeletion` call is made (stub) and an audit entry is written (FR-014, SC-005).
- `provisionLearner`: downstream receives only a pseudonymous `actor_ref` (FR-012, FR-013).

**Spine package (US3):**
- `handleCommand`: authorized command commits `DecisionRecord` + outbox row + audit **atomically**
  (all present or none); denied command writes a `policy_deny` audit entry and no decision (FR-009,
  FR-011).
- `relay` + `deliver`: replaying the same `contract_id` applies the projection **exactly once**
  (dedup); a synthetic burst of N events is applied N-unique times with **no loss** (FR-010, SC-004).
- Audit replay: every `DecisionRecord`, consent change, and `policy_deny` has an append-only audit
  entry carrying the envelope header and policy result (FR-011).

**Contracts package (US4):**
- `validateOverrideRecord`: two distinct human approvers pass; a `model`/`system` approver is rejected
  (`AuthorityForgeryError`); fewer than two distinct approvers for an override class is rejected
  (`FourEyesError`); the target `DecisionRecord` is unchanged after an override; `header.causation_id ===
  target_decision` (FR-017, SC-008) — golden [G-OVR](../spec.md#g-ovr--overriderecord-four-eyes).
- `validateAppeal`: an `independent_reviewer` equal to the target decision's `authorized_human` is rejected
  (`ReviewerConflictError`); a distinct reviewer passes; `late`/`reopened` statuses are recordable; an
  out-of-enum status is rejected on `status`; the target decision is unchanged after filing (FR-018,
  SC-009) — golden [G-APL](../spec.md#g-apl--appeal-reviewer-independence).
- Audit: recording an `OverrideRecord` writes an append-only audit entry `action: "override"`; filing an
  `Appeal` writes `action: "appeal_filed"` (FR-011).

**Cross-cutting:**
- Determinism: with an injected `Clock` + `IdGenerator`, identical inputs produce identical records
  (FR-016) — a replay test.
- Golden fixtures: `packages/platform-spine/test/golden.test.ts` asserts every table in
  [spec.md → Golden Values](../spec.md#golden-values--tolerances) against the seed fixtures (SC-007).
- Synthetic-only: no test requires real consent/admissions/legal machinery (FR-015, SC-007).
