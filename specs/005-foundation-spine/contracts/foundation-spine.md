# Contract: `proto/` schema + `pkg/platform` / `pkg/spine` / `services/identity-consent` Go API + OPA decisions

This slice's "contract" has three faces: (1) the **Protobuf** wire schema owned by `buf`; (2) the **Go**
public API of the invariant lib + spine + identity-consent service over the generated types; and (3) the
**OPA/Rego** decisions on the command path. The invariant core is **pure over injected state** (no I/O, no
wall-clock, no random ids — clock + id injected, FR-016). Every expected result is pinned in
[spec.md → Golden Values](../spec.md#golden-values--tolerances) (G-BUF, G-ENV, G-DEC, G-ASSENT, G-AUTH,
G-IDEM, G-WD, G-OVR, G-APL, G-TF), using the seed fixtures in
[spec.md → Seed fixtures](../spec.md#seed-fixtures-in-repo).

## 1. Protobuf schema (`proto/gt100k/platform/v1`, owned by `buf`)

See [data-model.md](../data-model.md) for the full message shapes: `ActorRef`/`ActorClass`, `Envelope`,
`LearnerEvent`, `ConsentGrant`/`WithdrawalState`, `AssentRecord`/`AssentResponse`, `DecisionRecord`,
`OverrideRecord`, `Appeal`/`AppealStatus`, `AuditEntry`, `EligibleLearner`/`Track`.

**Schema-compatibility contract (G-BUF):**

```text
buf lint proto                                            -> STANDARD lint clean
buf breaking proto --against '.git#branch=main,subdir=proto'
  add new field (new tag)      -> pass
  remove field                 -> FAIL (FIELD_NO_DELETE)
  rename field (same tag)      -> FAIL (FIELD_SAME_NAME)
  reuse a tag number           -> FAIL
buf generate proto && git diff --exit-code proto/gen     -> committed Go matches schema (freshness)
```

`buf.gen.yaml` pins `buf.build/protocolbuffers/go:v1.36.5` and `buf.build/grpc/go:v1.5.1`.

## 2. `pkg/platform` — public Go functions (pure validators/invariants)

```go
// Envelope + contracts (all take a *platformv1.* generated message; return error or nil)
func ValidateEnvelope(h *platformv1.Envelope) error
  // nil on complete header; *NamedFieldError{Field} on any missing/empty required field.
  // model_version optional; evidence_refs may be nil; actor_ref must be non-nil (FR-001, SC-002; G-ENV).

func ValidateLearnerEvent(e *platformv1.LearnerEvent) error
  // envelope complete; distinct occurred_at/recorded_at; event_type/learner_ref/source/payload_schema set (FR-002).

func ValidateConsentGrant(g *platformv1.ConsentGrant) error
  // envelope complete; purpose/jurisdiction/effective_at set; expiry_at (if set) > effective_at (FR-003).
func IsConsentActive(g *platformv1.ConsentGrant, at time.Time) bool
  // !withdrawn && at in [effective_at, expiry_at) (FR-003).

func ValidateAssentRecord(r *platformv1.AssentRecord) error   // response ∈ {ASSENT,REFUSAL,DISSENT} (FR-004)
func AssentBlocks(r *platformv1.AssentRecord) bool            // honorable && response != ASSENT (FR-004, SC-007; G-ASSENT)

func ValidateDecisionRecord(d *platformv1.DecisionRecord) error
  // envelope complete; if consequential: authorized_human != nil AND policy_version != "";
  // authorized_human.class never MODEL/SYSTEM (*AuthorityForgeryError). (FR-005, SC-003; G-DEC)

func ValidateOverrideRecord(o *platformv1.OverrideRecord) error
  // envelope complete; required fields present; four-eyes for override classes:
  // >=2 distinct approvers, none MODEL/SYSTEM; header.causation_id == target_decision (FR-017, SC-008; G-OVR)
func ValidateAppeal(a *platformv1.Appeal, authorizedHumanRef string) error
  // envelope complete; status in enum; independent_reviewer.ref != authorizedHumanRef (FR-018, SC-009; G-APL)

// Shared invariants + error types
func AssertEnvelopeComplete(h *platformv1.Envelope) error
func AssertHumanAuthority(a *platformv1.ActorRef) error             // MODEL/SYSTEM ⇒ *AuthorityForgeryError
func AssertAppendOnly(existing map[string]bool, id string) error   // present ⇒ *AppendOnlyError
func AssertFourEyes(approvers []*platformv1.ActorRef) error         // model/system ⇒ forgery; <2 distinct ⇒ *FourEyesError
func AssertReviewerIndependent(reviewer *platformv1.ActorRef, authorizedHumanRef string) error // equal ⇒ *ReviewerConflictError

// Injected (FR-016)
type Clock interface{ Now() time.Time }
type IDGenerator interface{ Next() string }
```

**Purity**: every function above is a pure predicate/validator over its arguments; none performs I/O.
Error types (`NamedFieldError`, `AuthorityForgeryError`, `AppendOnlyError`, `FourEyesError`,
`ReviewerConflictError`) carry a `Field`/`ContractID`/`Have` and are matched with `errors.As`.

## 3. `services/identity-consent` — public Go functions

```go
// Identity (pseudonymous only — FR-012)
func ProvisionLearner(ctx, src EnrollmentHandoffSource, ids IdentityRepository, idgen IDGenerator) (*platformv1.ActorRef, error)
  // pull next EligibleLearner (references only), provision a pseudonymous actor_ref; downstream never sees legal identity.

// Consent / assent lifecycle
func GrantConsent(ctx, repo ConsentRepository, g *platformv1.ConsentGrant) error   // validates then append-only Put
func WithdrawConsent(ctx, deps ConsentDeps, contractID string, at time.Time) error
  // set withdrawal_state; DeletionStarter.Start(subjectRef) exactly once; AuditLog.Append("consent_withdrawn").
  // Postcondition: IsConsentActive false; new processing for that purpose denied (SC-006; G-WD).
func RecordAssent(ctx, repo AssentRepository, r *platformv1.AssentRecord) error    // validates; refusal honored (AssentBlocks)

// Authorization edge (OPA Go SDK — FR-007, FR-008)
func Authorize(ctx, in PolicyInput) (PolicyDecision, error)
  // Build the OPA input (pre-filter active consents via IsConsentActive), evaluate data.gt100k.authz.decision
  // against the compiled bundle, return {Allow, Reason, PolicyVersion}. Deny-by-default.
  // Reasons: "allow" | "no_active_consent" | "jurisdiction_mismatch" | "deny_by_default" (G-AUTH).
```

## 4. `pkg/spine` — outbox + command path (FR-009, FR-010, FR-011)

```go
func HandleCommand(ctx, deps CommandDeps, cmd Command) (HandleResult, error)
  // resolve actor -> load active consents -> Authorize (OPA).
  //   deny  -> AuditLog.Append(policy_deny); return {Denied:true, Decision:nil}.
  //   allow -> build human-authorized DecisionRecord + LearnerEvent, then
  //            OutboxStore.Commit(UnitOfWork{Decision, Outbox row, Audit}) ATOMICALLY (all or nothing).
  // Precondition: cmd carries a named human authorizer (never MODEL/SYSTEM — AssertHumanAuthority).

func Relay(ctx, store OutboxStore, bus EventBus) (int, error)
  // publish all pending rows with idempotency_key; MarkRelayed; at-least-once; returns count published.
func Deliver(ctx, offsets ConsumerOffsets, projection Projection, e *platformv1.LearnerEvent) (bool, error)
  // Seen(contract_id)? -> return (false, nil) (dedup no-op). else apply projection, Mark, return (true, nil). (FR-010, SC-005; G-IDEM)
```

## 5. OPA/Rego decisions (`policies/`)

```text
data.gt100k.authz.decision  -> { allow: bool, reason: string, policy_version: string }
  precedence: no_active_consent -> jurisdiction_mismatch -> deny_by_default -> allow (G-AUTH)
  deny-by-default: an empty/unknown role+purpose+jurisdiction is denied (opa test asserts).
data.gt100k.authz.deny_authority_forgery  -> set; fires if input.authorized_human.class ∈ {MODEL,SYSTEM} (G-DEC mirror)
data.gt100k.override.deny  -> set; fires on a model/system approver or <2 distinct approvers for a class (G-OVR mirror)
data.gt100k.appeal.deny    -> set; fires if input.independent_reviewer.ref == input.authorized_human_ref (G-APL mirror)
```

`opa test policies/` covers the decision table, deny-by-default, subgroup fixtures, and the mirror denies.
`opa build policies/` produces the bundle artifact (signing deferred).

## 6. Temporal deletion workflow (`workflows/deletion`)

```text
DeletionWorkflow(ctx workflow.Context, subjectRef string) error   // deterministic APIs (workflow.Now / SideEffect)
  activities (idempotent + compensating): ErasePostgres, DeleteS3Objects, ClearRedis, CryptoShred(KMS stub), RecordDeletionAudit
Proof: testsuite.TestWorkflowEnvironment runs to Completed; injected CryptoShred failure -> retry/compensation -> Completed (G-WD)
```

## 7. Terraform modules (`infra/terraform`, validate-only)

```text
per module M in {bootstrap-org, network-vpc, eks, rds, s3-kms, iam, event-runtime, _smoke}:
  terraform -chdir=infra/terraform/modules/M init -backend=false   -> success
  terraform -chdir=infra/terraform/modules/M validate              -> "Success! The configuration is valid."
terraform fmt -check -recursive infra/terraform                     -> exit 0
NO apply, NO backend, NO credentials (G-TF).
```

---

## Contract test obligations (map to FR/SC)

**Schema / `buf` (US1):**
- `buf lint` clean; `buf breaking` fails field removal/rename/tag-reuse, passes new-tag addition; committed
  Go matches `buf generate` (FR-006, SC-001; G-BUF).

**`pkg/platform` (US1/US4):**
- `ValidateEnvelope`: complete passes; each missing/empty required field rejected by `Field` (FR-001, SC-002).
- `ValidateLearnerEvent`: distinct occurred/recorded; required fields (FR-002).
- `ValidateDecisionRecord`: consequential without human/policy rejected; `MODEL`/`SYSTEM` in
  `authorized_human` rejected in **100%** of attempts; named human + policy passes (FR-005, SC-003).
- `AssertAppendOnly`: re-writing an existing `contract_id` returns `*AppendOnlyError`.
- `ValidateOverrideRecord`: two distinct human approvers pass; model/system ⇒ forgery; <2 distinct ⇒
  four-eyes; target unchanged; `causation_id == target_decision` (FR-017, SC-008; G-OVR).
- `ValidateAppeal`: reviewer == `authorized_human` ⇒ conflict; distinct passes; `late`/`reopened` OK;
  out-of-enum status ⇒ `*NamedFieldError{Field:"status"}`; target unchanged (FR-018, SC-009; G-APL).

**`services/identity-consent` + OPA (US2):**
- `opa test policies/`: the full G-AUTH decision table + deny-by-default + the override/appeal mirror denies.
- `Authorize` (Go edge via OPA SDK): allow on active consent + matching rule + jurisdiction; deny on no
  consent, withdrawn/expired, jurisdiction mismatch (FR-008), unknown role/purpose (deny-by-default); every
  result carries `policy_version` (FR-007, SC-004).
- `IsConsentActive`: true in window; false when withdrawn/expired/before effective (FR-003).
- `AssentBlocks`: guardian consent present + child honorable refusal ⇒ blocked (FR-004, SC-007).
- `WithdrawConsent`: after withdrawal `IsConsentActive` false + `Authorize` denies; `DeletionStarter.Start`
  called **exactly once**; **one** `consent_withdrawn` audit entry (FR-014, SC-006).
- `ProvisionLearner`: downstream receives only a pseudonymous `actor_ref` (FR-012, FR-013).

**`pkg/spine` (US3):**
- `HandleCommand`: authorized ⇒ `DecisionRecord` + outbox row + audit committed **atomically**; denied ⇒
  one `policy_deny` audit + no decision (FR-009, FR-011).
- `Relay` + `Deliver`: replaying the same `contract_id` applies exactly once; a burst of N applies N-unique
  with **no loss**; out-of-order dedups by `contract_id` (FR-010, SC-005; G-IDEM). Integration lane
  (`-tags=integration`) repeats against real Redpanda + PostgreSQL.
- Audit replay: every `DecisionRecord`, consent change, and `policy_deny` has an append-only audit entry
  carrying the envelope + policy result (FR-011).

**`workflows/deletion` (US5):**
- Temporal test suite: workflow runs to `Completed`; injected `CryptoShred` failure ⇒ compensation/retry ⇒
  `Completed`; deletion audit entry preserved (FR-014, SC-006; G-WD).

**`infra/terraform` (US5):**
- Each module passes `init -backend=false` + `validate`; `fmt -check` exits 0; no apply (FR-019, SC-010; G-TF).

**Cross-cutting:**
- Determinism: injected `Clock` + `IDGenerator` ⇒ identical records for identical inputs; Temporal replay
  determinism (FR-016) — a replay test.
- Golden test: `pkg/platform/golden_test.go` + `pkg/spine/golden_test.go` assert every table in
  [spec.md → Golden Values](../spec.md#golden-values--tolerances) against the seed fixtures (SC-011).
- Synthetic-only: no test requires real consent/admissions/legal machinery or cloud (FR-015, SC-011).
