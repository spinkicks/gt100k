# Loop progress (durable memory the agent maintains each turn)

## NEXT
- Begin P0. Read only the PRD section for the current phase.

## 2026-07-20 — P0 green skeleton (T001–T005)
- Added the pinned Go 1.25.5 module, an empty `go.sum`, and Make targets for the four mandatory gate lanes plus the integration lane.
- Added the initial Buf v2 registry and three-field `Envelope`, the Go and OPA smoke tests, and the validate-only Terraform smoke module.
- TDD evidence: the structural acceptance check failed on all ten missing files before implementation and passed afterward.
- Gate status: `buf lint proto`, Go vet/build/test, `opa test policies/ -v`, Terraform init/validate/fmt-check, and the integration-tag Go smoke test all pass.
- P0 status: T001–T005 complete; T006–T007 remain. No SC is claimed yet.
- Runner blocker: GNU Make is absent, so `make gate` itself could not execute; every recipe was run verbatim and passed. The harness must provide `make` to exercise the aggregate target.

## NEXT
- T006: add the path-scoped foundation-spine CI workflow with pinned Go 1.25.5, buf 1.50.0, OPA 1.4.0, and Terraform 1.11.4; run `make gate` in the mandatory job and `make gate-integration` in a separate Docker-capable job.
- Acceptance: workflow paths cover every foundation directory/root file named by T006, pins match the spec, and the repository gate remains green.

## 2026-07-20 — P0 root Buf gate repair
- Fixed the latest harness failure by adding a root Buf v2 workspace configuration whose module path is `proto`; the task-required nested `proto/buf.yaml` remains the registry configuration for scoped lint and generation.
- TDD evidence: `buf lint` reproduced the package-directory failure before the root configuration, then passed afterward; `buf lint proto` and `buf format --diff` also pass.
- Gate status: root/scoped Buf lint, Go vet/build/fresh unit test, OPA test, Terraform init/validate/fmt-check, and the fresh integration-tag Go smoke test all pass.
- P0 status: T001–T005 remain complete; this repair restores their green checkpoint but completes no additional task or SC. T006–T007 remain.
- Runner blocker: GNU Make remains absent, so `make gate` itself cannot run; every current recipe was executed directly and passed.

## NEXT
- T006: add `.github/workflows/foundation-spine.yml`, path-scoped to root `buf.yaml` plus every foundation path/root file in the task, with pinned Go 1.25.5, buf 1.50.0, OPA 1.4.0, and Terraform 1.11.4; run `make gate` in the mandatory job and `make gate-integration` in a separate Docker-capable job.
- Acceptance: both jobs are separate, all pins and path filters match the spec, the mandatory job needs no cloud credentials, and every current gate recipe remains green.

## 2026-07-20 — P0 dedicated CI gate (T006)
- Added `.github/workflows/foundation-spine.yml`, isolated from the TS workflow and path-scoped to every foundation directory/root gate input plus root `buf.yaml` and the workflow itself.
- Added separate mandatory and Docker-capable integration jobs. The mandatory job pins Go 1.25.5, buf 1.50.0, OPA 1.4.0, and Terraform 1.11.4 and runs `make gate`; the integration job pins Go, verifies Docker, and runs `make gate-integration`.
- TDD evidence: the unchanged structural acceptance check first failed because the workflow was absent, then passed with every required path, pin, job, Docker check, and Make target present. `actionlint` v1.7.7 also accepts the workflow.
- Gate status: root/scoped Buf lint, Go vet/build/fresh unit test, OPA test, Terraform init/validate/fmt-check, and the fresh integration-tag Go test all pass with the pinned toolchain.
- P0 status: T001–T006 complete; T007 remains. No SC is claimed yet.
- Runner blocker: GNU Make remains absent locally, so every current recipe was executed directly and passed; CI installs on `ubuntu-latest`, where GNU Make is available.

## NEXT
- T007: run `buf generate proto` and commit the generated `Envelope` Go code under `proto/gen/go/...`.
- Acceptance: generated code matches the pinned plugins, `buf lint` remains clean, generated Go compiles/tests, and a fresh `buf generate proto` produces no content changes.

## 2026-07-20 — P0 generated Envelope contract (T007)
- Added the committed `Envelope` Go output under `proto/gen/go/gt100k/platform/v1/` using pinned `protoc-gen-go` v1.36.5. The minimal schema has no services, so the pinned gRPC plugin correctly emitted no service stub.
- Added a root `buf.gen.yaml`, identical to the task-required nested template, because buf resolves the template from the current directory; the spec's exact `buf generate proto` command now works. Added that root config to both dedicated workflow path filters.
- Added the direct `google.golang.org/protobuf` v1.36.5 runtime dependency and checksums so the generated package compiles without generation at build time.
- TDD evidence: the generated-file acceptance probe first failed because the output was absent; after generation, `go build ./...` failed specifically on the missing Protobuf runtime, then passed after adding the pinned dependency.
- Freshness evidence: an immediate second `buf generate proto` preserved the complete generated-tree SHA-256 manifest; the root and nested templates are byte-identical.
- Gate status: root/scoped Buf format/lint, Go vet/build/unit/integration-tag tests, OPA tests, Terraform init/validate/fmt-check, and actionlint v1.7.7 all pass.
- P0 status: T001–T007 complete; the P0 seeded-smoke checkpoint is green by direct recipe execution. No SC is claimed yet. Review was a requirement-level self-review because Git commands and reviewer delegation are not authorized in this loop.
- Runner blocker: GNU Make remains absent locally, so `make gate` itself could not execute; every recipe was run verbatim and passed.

## NEXT
- T008: define `ActorClass` and `ActorRef`, then expand `Envelope` to the full 12 fields with tags 1–12 exactly as specified in `data-model.md`.
- Acceptance: schema tests fail first for the missing enum/message/fields, `buf format --diff` and root/scoped `buf lint` pass, all names/types/tags match the data model, and P1 generation remains deferred to ordered task T010.

## 2026-07-20 — P1 envelope schema (T008)
- Added the pinned `ActorClass` values and pseudonymous `ActorRef`, then expanded `Envelope` to all 12 fields with the exact data-model names, types, tags, timestamp import, and Go package option.
- Added a hermetic Go schema-shape test covering file metadata, the exact enum values, all `ActorRef` fields, and all `Envelope` fields/tags without depending on generated code that remains intentionally stale until T010.
- TDD evidence: the targeted test first failed on the missing timestamp/go-package declarations, missing enum/message, and the nine absent envelope fields; it passed after the schema implementation.
- Self-review caught a zero-value map-membership hole in the enum assertion helper; a focused regression test failed against the defect and passed after the helper began checking key presence explicitly.
- Preserved the data model's unprefixed actor-class wire names with an `ENUM_VALUE_PREFIX` exception limited to `envelope.proto`; root and scoped Buf configs use the path form each entry point resolves while every other STANDARD rule remains enabled.
- Gate status: pinned tool versions confirmed; root/scoped Buf format/lint, Go vet/build/fresh unit tests, OPA tests, Terraform init/validate/fmt-check, and fresh integration-tag Go tests all pass by direct recipe execution.
- P1 status: T008 complete; T009–T012 remain. No SC is claimed yet, and `buf generate proto` remains deferred to ordered task T010.
- Runner blocker: GNU Make remains absent locally, so `make gate` itself could not execute; every current recipe was run verbatim and passed.

## NEXT
- T009: define the six contract messages plus supporting enums/messages in `learner_event.proto`, `consent.proto`, `assent.proto`, `decision.proto`, `override.proto`, and `appeal.proto`, together with `audit.proto` and `enrollment.proto`, fields-only with exact data-model tags.
- Acceptance: persistent schema-shape tests fail first for the absent files/declarations, every name/type/tag matches `data-model.md`, `buf format --diff` and root/scoped `buf lint` pass, and generated Go remains deferred to T010.

## 2026-07-20 — P1 foundation contract schemas (T009)
- Added the six fields-only foundation contracts plus `AuditEntry` and the reference-only `EligibleLearner` handoff, including all supporting messages and enums with exact data-model names, types, and sequential tags.
- Added persistent schema-shape tests for every file's package/import/Go metadata, all message fields, repeated markers, tags, and exact enum values.
- TDD evidence: the targeted suite first failed on all eight absent schema files, then passed after the minimal contract definitions were added.
- Preserved the pinned unprefixed assent/appeal enum wire values with path-scoped `ENUM_VALUE_PREFIX` exceptions in both Buf entry points; all other STANDARD lint rules remain enabled.
- Gate status: root/scoped Buf format/lint, Go vet/build/fresh unit tests, OPA tests, Terraform init/validate/fmt-check, and fresh integration-tag Go tests all pass by direct recipe execution.
- P1 status: T008–T009 complete; T010–T012 remain. No SC is claimed yet, and generated Go intentionally remains stale until T010.
- Runner blocker: GNU Make remains absent locally, so `make gate` itself could not execute; every current recipe was run verbatim and passed.

## NEXT
- T010: run `buf generate proto` and commit all generated Go contract types under `proto/gen/go/gt100k/platform/v1/`.
- Acceptance: generated files cover every T008/T009 schema, root/scoped Buf lint stays clean, `go vet ./...`, `go build ./...`, and `go test ./...` pass, and an immediate second generation produces an identical generated-tree manifest.

## 2026-07-20 — P1 generated foundation contracts (T010)
- Generated and retained all nine fields-only Go contract files under `proto/gen/go/gt100k/platform/v1/` with pinned `protoc-gen-go` v1.36.5; the message-only schemas correctly emit no gRPC service stubs.
- TDD evidence: the generated-coverage acceptance probe first failed on the eight missing T009 outputs, then passed with a one-to-one mapping from nine schema sources to nine `.pb.go` files.
- Freshness evidence: an immediate second `buf generate proto` preserved the complete generated-tree SHA-256 manifest, and every generated header reports `protoc-gen-go v1.36.5` with the expected source path.
- Gate status: root/scoped Buf format/lint, Go vet/build/fresh unit tests, OPA tests, Terraform init/validate/fmt-check, and fresh integration-tag Go tests all pass by direct recipe execution.
- P1 status: T008–T010 complete; T011–T012 remain. No SC is claimed yet because P1 is still foundational.
- Runner blocker: GNU Make remains absent locally, so `make gate` itself could not execute; every current recipe was run verbatim and passed.

## NEXT
- T011: define the shared invariant error types in `pkg/platform/invariants.go` and injected `Clock`/`IDGenerator` interfaces in `pkg/platform/clock.go` exactly as specified by `data-model.md`.
- Acceptance: focused tests fail first for missing types/behavior, each error exposes the required fields and stable `Error()` text, the interfaces admit deterministic fakes, and the complete mandatory gate remains green.

## 2026-07-20 — P1 shared invariant primitives (T011)
- Added all five shared typed invariant errors with the exact diagnostic fields from the data model, deterministic `Error()` text, and value receivers so callers can use `errors.As` with pointer instances.
- Added the injected `Clock` and `IDGenerator` interfaces without concrete wall-clock or random implementations, preserving FR-016 purity and deterministic test seams.
- TDD evidence: the focused package test first failed to compile on all seven missing declarations, then passed after the minimal implementation; tests assert exact messages, typed `errors.As` field preservation, and deterministic fake time/id sequences.
- Gate status: pinned tool versions confirmed; root/scoped Buf format/lint, fresh Go vet/build/unit tests, OPA tests, and Terraform init/validate/fmt-check all pass by direct recipe execution.
- P1 status: T008–T011 complete; T012 remains. No SC is claimed yet because the P1 checkpoint still requires fixtures.
- Runner blocker: GNU Make remains absent locally, so `make gate` itself could not execute; every current mandatory recipe was run directly and passed.

## NEXT
- T012: add the synthetic Go seed fixtures and matching OPA G-AUTH input fixtures.
- Acceptance: fixture tests fail first for missing values/files; actors and records remain synthetic and pseudonymous, constants match the spec's golden seed values, `WithEnvelope(...)` produces the required header shape, all G-AUTH input rows are represented, and the complete mandatory gate remains green.

## 2026-07-20 — P1 synthetic foundation fixtures (T012)
- Added the canonical synthetic actor set, tenant/policy/time constants, reference-only `EligibleLearner`, fully populated `ValidEnvelope`, and four consent variants over the generated protobuf types.
- Added generic `WithEnvelope(...)` wrapping with a deep-cloned header, preventing mutable protobuf aliasing between canonical values and contract fixtures.
- Added six OPA input documents mirroring every G-AUTH row; unique top-level keys let the recursive OPA gate load all documents together, while expired/withdrawn rows reflect the specified Go-edge active-consent prefilter.
- TDD evidence: the focused fixture package first failed to compile on the missing canonical declarations, then passed after the minimal Go and JSON fixtures were added. Tests cover exact golden values, synthetic-only references, distinct timestamps, envelope clone isolation, all consent states, and all six policy inputs.
- Gate status: root/scoped Buf format/lint, fresh Go vet/build/unit tests, OPA tests with all six JSON documents loaded, and Terraform init/validate/fmt-check all pass by direct recipe execution.
- P1 status: T008–T012 complete; the foundational checkpoint is green and P2 story tests can begin. No SC is claimed yet because envelope validation starts at T013/T017.
- Runner blocker: GNU Make remains absent locally, so `make gate` itself could not execute; every mandatory recipe was run directly and passed.

## NEXT
- T013: add `pkg/platform/envelope_test.go` asserting the complete G-ENV decision table against `fixtures.ValidEnvelope`.
- Acceptance: the complete header passes; each missing required field fails with `*NamedFieldError` naming the exact field; optional `model_version` and nil `evidence_refs` pass; the expected RED is observed against missing validation, and the increment does not end until the corresponding minimal implementation restores the mandatory gate to green.

## 2026-07-20 — P2 envelope validation (T013 + T017)
- Added the full G-ENV table-driven acceptance suite over the canonical synthetic envelope, covering every required field, optional `model_version`, nil `evidence_refs`, nil headers, and invalid Protobuf timestamps.
- Implemented `ValidateEnvelope` and `AssertEnvelopeComplete` as pure validators returning `*NamedFieldError` with exact schema field names; both timestamps are required and checked for Protobuf validity.
- TDD evidence: the focused suite first failed to compile only because both validator functions were absent, then passed after the minimal implementation.
- Gate status: root/scoped Buf format/lint, fresh Go vet/build/unit tests, OPA tests, and Terraform init/validate/fmt-check all pass by direct recipe execution.
- P2 status: T013 and T017 complete; T014–T016 and T018–T020 remain. G-ENV behavior now covers the envelope portion of SC-002, but the P2 checkpoint and SC-002 are not yet claimed for every emitted contract.
- Runner blocker: GNU Make remains absent locally, so `make gate` itself could not execute; every mandatory recipe was run directly and passed.

## NEXT
- T014: add `pkg/platform/learner_event_test.go` and the minimal `ValidateLearnerEvent` implementation needed to restore the green gate.
- Acceptance: the complete synthetic event passes; incomplete envelopes, equal occurred/recorded timestamps, and every missing required learner-event field fail deterministically; the RED is witnessed first and the complete mandatory gate ends green.

## 2026-07-20 — P2 LearnerEvent validation (T014 + T018)
- Added synthetic, table-driven `LearnerEvent` acceptance coverage for a complete event, common-envelope propagation, distinct event/ingest time, all four required event-local fields, and optional context/evidence references.
- Implemented pure `ValidateLearnerEvent` composition over `ValidateEnvelope`, with deterministic `*NamedFieldError` diagnostics and no I/O, clock, or id generation.
- TDD evidence: the focused suite first failed to compile only because `ValidateLearnerEvent` was absent, then all focused cases passed after the minimal implementation.
- Gate status: root/scoped Buf format/lint, fresh Go vet/build/unit tests, OPA tests, Terraform init/validate/fmt-check, and fresh integration-tag Go tests all pass by direct recipe execution.
- P2 status: T013–T014 and T017–T018 complete; T015–T016 and T019–T020 remain. The `LearnerEvent` portion of FR-002/SC-002 is covered, but the P2 checkpoint and whole-contract SC-002 are not yet claimed.
- Runner blocker: GNU Make remains absent locally, so `make gate` itself could not execute; every mandatory recipe was run directly and passed.

## NEXT
- T015: add `pkg/platform/decision_test.go` asserting the complete G-DEC table and the minimal T019 implementation needed to restore the green gate.
- Acceptance: consequential records require a named human and policy result; `MODEL`/`SYSTEM` authority always returns `*AuthorityForgeryError`; non-consequential records pass; `AssertAppendOnly` rejects an existing contract id; the focused RED is witnessed first and the complete mandatory gate ends green.

## 2026-07-20 — P2 DecisionRecord invariants (T015 + T019)
- Added the full G-DEC acceptance suite over a synthetic, traceable `DecisionRecord`, including envelope propagation, consequential human/policy requirements, non-consequential behavior, and both append-only outcomes.
- Implemented pure `ValidateDecisionRecord`, `AssertHumanAuthority`, and `AssertAppendOnly` validators. Any present authority is checked against the human-class allowlist; `MODEL`/`SYSTEM` always returns `*AuthorityForgeryError`, including on non-consequential records.
- TDD evidence: the focused suite first failed to compile only on the three missing functions and passed after their minimal implementation. Follow-up tests separately failed against a permissive unspecified class and missing-ref precedence for model/system actors; both passed after the human-class allowlist and authority-forgery precedence were made explicit.
- Gate status: root/scoped Buf format/lint, fresh Go vet/build/unit tests, OPA tests, Terraform init/validate/fmt-check, and fresh integration-tag Go tests all pass by direct recipe execution.
- P2 status: T013–T015 and T017–T019 complete; T016 and T020 remain. The Go half of G-DEC/SC-003 is covered, but SC-003 is not claimed until its OPA mirror exists, and the P2 MVP checkpoint still requires the Buf compatibility/freshness gate.
- Runner blocker: GNU Make remains absent locally, so `make gate` itself could not execute; every current recipe was run directly and passed.

## NEXT
- T016 + T020: add the hermetic `proto/breaking_test.sh` G-BUF fixture test, then wire Buf breaking and generated-code freshness into `Makefile` and the dedicated CI workflow.
- Acceptance: remove/rename/tag-reuse mutations fail, a new unused tag passes, compatibility checks target `main` in CI, generation freshness detects drift without retaining generated mutations, and the complete mandatory gate ends green.

## 2026-07-20 — P2 Buf compatibility and freshness gate (T016 + T020)
- Added a hermetic G-BUF fixture matrix over temporary copies of the real registry: baseline and `DecisionRecord.new_note = 50` pass, field removal/rename/tag reuse fail, and invalid field casing fails STANDARD lint.
- Added a bootstrap-aware `main` comparison that skips only when `main` has no `.proto` baseline, as on this initial registry branch; with a real baseline it passes additive changes and rejects removal. The existing full-history CI checkout runs it through `make gate`.
- Added isolated generated-code freshness verification, then retained the spec's exact harness-owned `buf generate proto` plus `git diff --exit-code proto/gen` commands in the contract gate.
- TDD evidence: the structural probe first failed on all missing scripts/wiring; the bootstrap wrapper test then failed because the wrapper was absent; a deliberate stale generated-file probe failed and the generated tree was restored byte-for-byte. The final G-BUF and freshness suites pass.
- Gate status: root/scoped Buf format/lint, G-BUF fixtures, bootstrap-aware main comparison, generated-tree hash/freshness, Go vet/build/unit/integration-tag tests, OPA tests, and Terraform init/validate/fmt-check all pass with the pinned toolchain.
- P2 status: T013–T020 complete; the MVP checkpoint is green and SC-001 is persistently covered. SC-002 and SC-003 remain partially covered until the later contract validators and OPA authority mirror land.
- Runner constraint: GNU Make is absent and Git commands are harness-owned, so the recipes were run directly; isolated generation plus a before/after tree hash proved the exact generation step is clean locally, while the harness will execute the final Git diff.

## NEXT
- T021: add `pkg/platform/consent_test.go` and the minimal `ValidateConsentGrant`/`IsConsentActive` implementation needed to restore the green gate.
- Acceptance: a complete grant is active only inside its effective/expiry window; withdrawn, expired, and not-yet-effective grants are inactive; required consent fields and the common envelope fail deterministically; the focused RED is witnessed first and the complete mandatory gate ends green.

## 2026-07-20 — P3 ConsentGrant activity (T021 + consent half of T027)
- Added complete `ConsentGrant` validation over the common envelope, every required local string/list/authority field, Protobuf timestamp validity, and conditional withdrawal time. Nil expiry remains an open-ended window and nil withdrawal state remains unwithdrawn.
- Implemented deterministic `IsConsentActive(grant, at)` with an injected evaluation time, inclusive effective bound, exclusive optional expiry bound, immediate withdrawal denial, and fail-closed handling for malformed grants.
- TDD evidence: the focused suite first failed to compile on the two absent functions; after the minimal implementation, a local review added a guardian-authority case that failed with a nil error before the validator was tightened. All focused cases then passed.
- Gate status: root/scoped Buf format/lint, G-BUF fixtures and bootstrap comparison, generated-code freshness, fresh Go vet/build/unit/integration-tag tests, OPA tests, and Terraform init/validate/fmt-check all pass with the pinned toolchain.
- P3 status: T021 complete and the consent half of T027 complete; T022–T030 remain, so T027 stays unchecked. FR-003 and the `ConsentGrant` envelope portion of SC-002 are covered; SC-004/SC-006 and the P3 checkpoint are not yet claimed.
- Runner constraint: GNU Make remains absent and Git commands are harness-owned, so the exact recipes were run directly; the isolated generated-code freshness check replaces the Git diff locally.

## NEXT
- T022: add `pkg/platform/assent_test.go` and the minimal remaining T027 `ValidateAssentRecord`/`AssentBlocks` implementation needed to restore the green gate.
- Acceptance: complete assent validates; incomplete envelope and every required assent field fail by name; G-ASSENT honorable refusal/dissent block, assent passes, non-honorable responses do not block; the RED is witnessed first and the complete mandatory gate ends green.

## 2026-07-20 — P3 child assent veto (T022 + remaining T027)
- Added complete `AssentRecord` validation coverage over the common envelope, every required local field, defined responses, Protobuf timestamp validity, and the optional renewal/non-honorable cases.
- Implemented pure `ValidateAssentRecord` composition and the pinned `AssentBlocks` veto predicate. The G-ASSENT table passes, and an explicit SC-007 case proves an honorable child refusal blocks while the guardian onboarding consent is active.
- TDD evidence: the focused suite first failed to compile only on the absent `ValidateAssentRecord` and `AssentBlocks` functions, then passed after their minimal implementation.
- Gate status: pinned tool versions confirmed; root/scoped Buf format/lint, G-BUF fixtures, generated-code freshness plus unchanged post-generation manifest, fresh Go vet/build/unit/integration-tag tests, OPA tests, and Terraform init/validate/fmt-check all pass.
- P3 status: T021–T022 and T027 complete; T023–T026 and T028–T030 remain. FR-004 and SC-007 are covered by the pure Go acceptance suite, but the P3 checkpoint remains open pending the OPA edge and services.
- Runner constraint: GNU Make remains absent and Git commands are harness-owned, so every non-Git recipe was run directly; the isolated freshness test and before/after generated-tree hash replace the Git diff locally.

## NEXT
- T023 + minimal T028: add the six-row G-AUTH Rego decision-table tests plus empty-policy deny-by-default coverage, then implement `policies/authz.rego` just far enough to restore the green gate.
- Acceptance: the tests witness the expected RED first; all fixed reason codes and precedence match G-AUTH, every decision returns `policy_version`, an empty/unknown policy denies by default, `opa test policies/` passes, and the complete mandatory gate remains green.

## 2026-07-20 — P3 OPA authorization policy (T023 + T028)
- Added a self-contained Rego acceptance suite for all six G-AUTH rows, exact rule shape, fixed reason-code precedence, the pinned policy version, empty-policy denial, and the MODEL/SYSTEM authority-forgery mirror.
- Implemented `gt100k.authz.decision` as deny-by-default over pre-filtered active consents, purpose, jurisdiction, role, and the single golden allow rule; every result carries `opa-bundle/2026-07-20a`. Added `deny_authority_forgery` with no human-class false positives.
- TDD evidence: the first focused run failed all four behavioral tests because the policy surface was absent. After minimal implementation, exact `opa test policies/` exposed that OPA omits nested `testdata`; self-contained mirror inputs restored GREEN. Completion review then added an exact rule-shape test that failed on set-vs-array jurisdiction representation before the golden array form fixed it. Final policy suite passes 6/6.
- Gate status: pinned buf 1.50.0 contract format/lint, G-BUF fixtures, generated freshness, Go 1.25.5 vet/build/fresh unit and integration-tag tests, OPA 1.4.0 strict check/test/bundle build, and Terraform 1.11.4 init/validate/fmt-check all pass without Git or cloud operations.
- P3 status: T021–T023 and T027–T028 complete; T024–T026 and T029–T030 remain. SC-003 is now covered in both Go and OPA; the OPA half of SC-004 is covered, while full SC-004 awaits the Go SDK edge.
- Runner constraint: Git commands remain harness-owned, so the direct gate used the isolated generated-code freshness check and local compatibility fixtures; the harness will execute its final Git-backed comparisons.

## NEXT
- T024 + minimal T029: add the Go authorization-edge tests against the compiled OPA bundle, then implement `Authorize` over the OPA Go SDK with active-consent prefiltering.
- Acceptance: the Go test witnesses RED first; all six G-AUTH rows match Rego, every result carries the pinned `policy_version`, inactive consents are removed via `IsConsentActive`, the bundle is evaluated in-process with no OPA server, and the complete non-Git gate ends green.

## 2026-07-20 — P3 Go OPA authorization edge (T024 + T029)
- Added the complete G-AUTH Go decision table plus an unknown-role deny-by-default case in `services/identity-consent/authz_test.go`; every row asserts the exact reason, allow bit, and pinned policy version.
- Implemented `Authorize` with the pinned OPA v1.4.0 Go SDK over a compiled, embedded authorization bundle. The edge pre-filters raw grants through `IsConsentActive`, supplies the exact policy input shape, compiles the query once, and requires the decision's policy version to match the bundle manifest revision.
- Added the deterministic bundle artifact stamped `opa-bundle/2026-07-20a`. A fresh second `opa build` compared byte-for-byte with the embedded artifact, and `opa inspect` confirmed Rego v1 plus the pinned revision.
- TDD evidence: the focused test first failed to compile only on the absent `PolicyInput`, `PolicyDecision`, and `Authorize`; after the minimal SDK implementation, all six golden rows and the unknown-role case passed.
- Dependency note: pinned OPA v1.4.0 requires the Protobuf Go runtime v1.36.6, so Go module resolution advanced the runtime patch while the schema generator remains pinned to v1.36.5.
- Gate status: root/scoped Buf format/lint, G-BUF fixtures, generated freshness, Go 1.25.5 vet/build/fresh unit and integration-tag tests, OPA 1.4.0 strict check/test/bundle freshness, and Terraform 1.11.4 init/validate/fmt-check all pass without Git, Docker, an OPA server, cloud credentials, or cloud operations.
- P3 status: T021–T024 and T027–T029 complete; T025–T026 and T030 remain. SC-004 is now covered through both direct Rego tests and the in-process Go SDK edge; the P3 checkpoint remains open for withdrawal, audit, and pseudonymous provisioning.
- Optional-runner note: `go test -race` could not start because this runner has CGO disabled and no C compiler; race mode is not part of the specified gate. The mandatory and integration-tag Go lanes pass.
- Runner constraint: Git commands remain harness-owned, so the local gate used the isolated compatibility and generation checks; the harness will execute the final Git-backed comparisons and commit.

## NEXT
- T025 + the consent-lifecycle portion of T030: add withdrawal-cascade tests, then implement `GrantConsent`/`WithdrawConsent` with exactly-once deletion start and one `consent_withdrawn` audit entry.
- Acceptance: the focused test witnesses RED first; withdrawal makes the grant inactive and `Authorize` return `no_active_consent`, `DeletionStarter.Start` is called exactly once, one audit entry is appended, repeated withdrawal is idempotent, and the complete non-Git gate ends green.

## 2026-07-20 — P3 consent withdrawal cascade (T025 + consent portion of T030)
- Added the G-WD service acceptance path: grant synthetic onboarding consent, authorize it, withdraw at the pinned time, prove inactivity and `no_active_consent`, then repeat withdrawal without duplicating deletion or audit side effects.
- Implemented validated append-only `GrantConsent` and dependency-injected `WithdrawConsent`. The repository performs one atomic active-to-withdrawn transition and returns a `changed` bit; only a new transition starts deletion and appends the `consent_withdrawn` audit entry with an injected opaque id and the original traceability header.
- Added concurrency-safe in-memory consent, audit, and deletion fakes in the service test. The stored withdrawal time is deterministic, repository values and audit records are deep-cloned, and malformed grants are rejected before persistence.
- TDD evidence: the focused test first failed to compile only on missing `GrantConsent`, `ConsentDeps`, and `WithdrawConsent`, then passed after the minimum consent-service implementation; a fresh uncached `go test -count=1 ./...` also passes.
- Gate status: buf 1.50.0 root/scoped format/lint, G-BUF fixtures, isolated generated freshness, Go 1.25.5 vet/build/unit/integration-tag tests, OPA 1.4.0 strict check and 6/6 tests, and Terraform 1.11.4 init/validate/fmt-check all pass without Git or cloud operations.
- P3 status: T021–T025 and T027–T029 complete; T026 and the assent/identity portions of T030 remain. The service-level portion of G-WD/SC-006 is covered; full SC-006 remains open until the Temporal workflow and command-path audit land in later phases.
- Runner constraint: GNU Make remains absent and Git commands are harness-owned, so the local gate ran every non-Git recipe directly; the harness will execute the Git-backed main comparison/generated diff and commit.

## NEXT
- T026 + the identity portion of T030: add `ProvisionLearner` coverage, then implement `ProvisionLearner`/`ResolveActor` over injected enrollment and pseudonymous identity seams.
- Acceptance: the focused test witnesses RED first; the handoff carries only the synthetic learner, accommodation-profile, and eligibility-evidence references plus track; downstream receives only a pseudonymous `ActorRef`; no raw or legal identity enters the service; repeated verification leaves the complete non-Git gate green.

## 2026-07-21 — P3 pseudonymous learner provisioning (T026 + identity portion of T030)
- Added `ProvisionLearner` and `ResolveActor` over injected service-local identity and enrollment ports; both return only validated pseudonymous `ActorRef` values.
- Added synthetic in-memory fakes and acceptance coverage proving the enrollment handoff has only learner, accommodation-profile, and eligibility-evidence references plus track; incomplete handoffs and malformed actor references fail closed before downstream use.
- TDD evidence: the focused suite first failed to compile on the two absent functions; follow-up RED runs rejected the untested actor-validation implementation and exposed acceptance of unknown Track values before the minimal validators restored GREEN.
- Gate status: buf 1.50.0 root/scoped format/lint and G-BUF fixtures pass; exact pinned local Go generators produce byte-identical committed output. Go 1.25.5 vet/build/fresh unit and integration-tag tests, OPA 1.4.0 strict check and 6/6 tests, and Terraform 1.11.4 init/validate/fmt-check pass without Git or cloud operations.
- P3 status: T021–T029 complete; consent and identity portions of T030 are complete, while `RecordAssent` remains. FR-012 and FR-013 are covered; the P3 checkpoint remains open until T030 finishes.
- Runner blocker: after two earlier successful remote freshness runs, the final isolated `buf generate` hit the BSR `resource_exhausted: too many requests` limit on three attempts, including after cooldown. The unchanged schema generated byte-identically with exact pinned local `protoc-gen-go` v1.36.5 and `protoc-gen-go-grpc` v1.5.1, but the harness must rerun the remote-plugin freshness check after the rate window resets. GNU Make remains absent and Git commands are harness-owned.

## NEXT
- T030 remaining assent-service slice: add `RecordAssent` tests, then implement it over an injected `AssentRepository` with an in-memory fake.
- Acceptance: a complete synthetic `AssentRecord` is validated and appended once; malformed records fail before persistence; repository failures propagate; the focused RED is witnessed first and the complete non-Git gate ends green.

## 2026-07-21 — P3 assent recording and checkpoint completion (remaining T030)
- Added service-local `AssentRepository` and `RecordAssent`, validating each record before append-only persistence while preserving the child's response and honorable veto semantics unchanged.
- Added a concurrency-safe, deep-cloning in-memory assent fake plus synthetic acceptance coverage for a stored honorable refusal, validation before persistence, caller-alias isolation, and wrapped repository failures.
- TDD evidence: the focused service suite first failed to compile only because `RecordAssent` was absent; after the minimal implementation, all three focused cases, platform assent regressions, and service vet passed.
- Gate status: buf 1.50.0 root/scoped format/lint, G-BUF fixtures, remote generated-code freshness, Go 1.25.5 vet/build/fresh unit and integration-tag tests, OPA 1.4.0 strict check and 6/6 tests, and Terraform 1.11.4 init/validate/fmt-check all pass without Git, Docker, cloud credentials, or cloud operations.
- P3 status: T021–T030 complete; the consent/assent + OPA authorization checkpoint is green. FR-003, FR-004, FR-007, FR-008, FR-012, and FR-013 are covered; SC-004 and SC-007 are covered. SC-006 remains intentionally partial until the P6 Temporal deletion workflow and the later command-path audit proof.
- Runner constraint: GNU Make remains absent and Git commands are harness-owned, so every non-Git recipe ran directly; the harness will execute the Git-backed main comparison/generated diff and commit.

## NEXT
- T031 + the minimal T034/T035 outbox slice needed to restore green: add the G-IDEM `UnitOfWork`/`Deliver` acceptance suite, then define only the required ports and in-memory implementation.
- Acceptance: atomic commit is all-or-nothing; `[A,B,A,C,B,A]` applies `[true,true,false,true,false,false]` with count 3; out-of-order unique events each apply once; a 100-event burst delivered twice yields exactly 100 applied and 100 skipped; the focused RED is witnessed first and the complete non-Git gate ends green.

## 2026-07-21 — P4 atomic outbox and idempotent delivery (T031 + partial T034/T035)
- Added the T031 G-IDEM acceptance suite for atomic decision/outbox/audit commit, the exact `[A,B,A,C,B,A]` replay table, out-of-order delivery, and a 100-contract/200-delivery burst.
- Defined the required P4 port slice and implemented `Deliver` plus a hermetic in-memory outbox store, consumer offsets, and projection. The store uses one lock and validates every conflict before mutation; all returned Protobuf values are deep clones.
- TDD evidence: the focused suite first failed because `pkg/spine/memory` was absent. Separate RED runs then proved relayed rows remained pending without `MarkRelayed` and proved the decision side was missing when deliberately removed; both returned GREEN after the minimal implementations were restored.
- Gate status: root/scoped Buf format and lint, Go 1.25.5 vet/build/fresh unit and integration-tag tests, OPA 1.4.0 tests (6/6), and Terraform 1.11.4 init/validate/fmt-check all pass without Git, Docker, cloud credentials, or cloud operations.
- P4 status: T031 complete; T034 and T035 are intentionally partial and remain unchecked. FR-009/FR-010 and the in-memory half of SC-005 are covered; SC-005 remains open until the T033 Redpanda/PostgreSQL integration proof.
- Runner constraint: Git commands remain harness-owned, so Git-backed Buf compatibility/generated-diff checks were not invoked; the harness will run them before committing.

## NEXT
- T032 + the minimal remaining T034/T035 command-path slice: add `HandleCommand` and audit acceptance tests, then centralize the required authorization/audit/repository ports and implement only enough command orchestration and memory fakes to restore green.
- Acceptance: authorized commands atomically commit one decision, outbox row, and audit entry; denied commands append exactly one `policy_deny` audit entry and no decision/outbox row; audit is append-only and replayable; the focused RED is witnessed first and the complete non-Git gate ends green.

## 2026-07-21 — P4 audited command path (T032 + partial T034/T035)
- Added the T032 command acceptance suite: an authorized command commits one decision, outbox row, and `action:"decision"` audit entry in a single `UnitOfWork`; a denial writes exactly one `action:"policy_deny"` audit entry and no decision or outbox row; audit replay returns deep-cloned records and duplicate audit ids return `*AppendOnlyError`.
- Implemented `HandleCommand` over injected identity, active-consent, authorization, outbox, audit, clock, and id seams. The handler validates named human authority before policy evaluation, records the actual policy version on cloned contracts, uses the event contract id as the idempotency key, and never performs a standalone audit write on the authorized path.
- Added the required shared port slice plus deterministic in-memory identity/active-consent readers. Extended the atomic memory store with append-only standalone audit writes for denials while retaining one-lock validation-before-mutation semantics for authorized units.
- TDD evidence: the focused suite first failed to compile on the absent `PolicyDecision`, `Command`, `CommandDeps`, and `HandleCommand` APIs, then passed after the minimal implementation. Fresh focused, package, and full Go tests passed.
- Gate status: Buf 1.50.0 root/scoped format and lint, G-BUF compatibility fixtures, isolated generated freshness and unchanged post-generation SHA-256 manifest, Go 1.25.5 vet/build/fresh unit and integration-tag tests, OPA 1.4.0 tests (6/6), and Terraform 1.11.4 init/validate/fmt-check all pass without Git, Docker, cloud credentials, or cloud operations.
- P4 status: T031–T032 complete; T034/T035 remain intentionally partial and unchecked. FR-011's decision/deny audit path and the command-path portion of SC-004 are covered; SC-005 remains open until the T033/T036 PostgreSQL+Redpanda integration proof.
- Runner constraint: Git commands remain harness-owned, so the Git-backed main compatibility comparison and generated-tree diff were not invoked; the harness will run them before committing.

## NEXT
- T033: add the build-tagged PostgreSQL + Redpanda testcontainers outbox integration acceptance test, introducing only the minimal T036 adapter slice needed to make it pass.
- Acceptance: `//go:build integration` keeps the default lane hermetic; the tagged test reproduces the 100-event G-IDEM burst through PostgreSQL outbox → Redpanda → deduplicated projection with exactly 100 applied and 100 skipped, proves acknowledged events are not lost, witnesses RED before adapter implementation, and leaves the complete non-Git gate green.

## 2026-07-21 — P4 PostgreSQL + Redpanda outbox integration (T033 + partial T036)
- Added the build-tagged T033 testcontainers acceptance path: 100 synthetic atomic units stage in PostgreSQL, each event is acknowledged twice by real Redpanda, all 200 records are consumed, and contract-id dedup yields exactly 100 applied plus 100 skipped with no acknowledged loss.
- Added the pinned pgx v5.7.2 PostgreSQL adapter and schema for atomic decision/outbox/audit commits, pending/relayed outbox state, append-only audit replay, and a separate decision-repository view over the same pool. Added the pinned franz-go v1.18.1 producer/consumer adapter with Protobuf validation and `contract_id` Kafka keys.
- TDD evidence: the focused tagged test first failed on the absent `pkg/spine/pg` adapter. The first GREEN attempt exposed Go's incompatible overloaded `Append` interfaces, and the runtime attempt exposed missing PostgreSQL readiness; separate repository views and the module-provided condition-based wait fixed the root causes before the final focused test passed.
- Verification evidence: the focused Docker test passed; fresh `go test -tags=integration ./... -count=1` passed every package; root/scoped Buf format/lint, G-BUF fixtures, isolated generated freshness, Go 1.25.5 vet/build/fresh unit tests, OPA 1.4.0 strict check plus 6/6 tests, and Terraform 1.11.4 init/validate/fmt-check all passed without Git or cloud operations.
- P4 status: T031–T033 complete; T034/T035 remain partial and T036 remains unchecked until the full shared ports are centralized. The concrete T036 pgx/franz-go slice is present and exercised. SC-005 is covered by both the in-memory G-IDEM suite and the PostgreSQL/Redpanda integration lane.
- Runner constraint: GNU Make remains absent and Git commands remain harness-owned, so the Git-backed main comparison/generated-tree diff were not invoked; the hermetic compatibility fixtures and isolated generated-tree comparison passed.

## NEXT
- T034: centralize the complete spine port surface in `pkg/spine/ports.go` exactly as specified by `data-model.md`, reconciling the existing narrow command/service interfaces and the new PostgreSQL/Redpanda adapters without changing behavior.
- Acceptance: focused compile-time/interface tests fail first for every missing repository/event/enrollment/deletion port; all services and fakes implement the shared interfaces without import cycles or concrete coupling; the Redpanda producer satisfies `EventBus`; T034 becomes complete while T035/T036 remain accurately tracked; the full default and integration lanes end green.

## 2026-07-21 — P4 centralized spine ports (T034)
- Centralized the complete repository, audit, outbox, authorization, event, enrollment, and deletion contract surface in `pkg/spine/ports.go`; retained the command path's narrow read interfaces and the atomic consent-withdrawal compare-and-set result.
- Replaced identity-consent's duplicate repository and policy declarations with shared type aliases. Its compiled OPA evaluator now directly implements `spine.Authorizer`, while existing callers retain the same package-level API and behavior.
- Added compile-time contract coverage for every shared interface and for the in-memory, PostgreSQL, Redpanda, and identity-consent implementations. `PolicyDecision` also has a behavioral JSON test protecting the OPA `policy_version` mapping.
- TDD evidence: the focused suite first failed on every absent repository/event/enrollment/deletion declaration, the incomplete audit fake, and the mismatched OPA authorizer method; the same suite passed after the minimal centralization and fake conformance changes.
- Verification evidence: fresh `go vet ./...`, `go build ./...`, `go test -count=1 ./...`, and `go test -tags=integration -count=1 ./...` passed, including the real PostgreSQL/Redpanda testcontainers path. Root/scoped Buf format/lint, G-BUF fixtures, isolated generated freshness, OPA strict check plus 6/6 tests, and Terraform init/validate/fmt-check also passed.
- P4 status: T031–T034 complete; T035 and T036 remain partial and unchecked. T034 adds no new SC claim; SC-005 remains covered by the existing in-memory and integration suites.
- Runner constraint: Git commands remain harness-owned, so the Git-backed main compatibility comparison and generated-tree diff were not invoked; the hermetic compatibility and isolated generated-tree checks passed.

## NEXT
- T035: finish the transactional outbox implementation in `pkg/spine/relay.go`, central audit helpers, and the remaining in-memory `DecisionRepository`/`EventBus` fakes without reworking the already-green `Commit`, `Deliver`, or `HandleCommand` paths.
- Acceptance: tests witness RED first; `Relay` publishes every pending event and marks a row relayed only after a successful publish, retries leave failed rows pending, the in-memory bus preserves at-least-once behavior, all T035 port implementations have compile-time assertions, and the complete default plus integration gates end green.

## 2026-07-21 — P4 transactional relay and memory adapters (T035)
- Added the contract-pinned `Relay(ctx, store, bus) (int, error)`: it processes pending rows deterministically, marks only after a successful publish, returns the number actually published, and leaves failed rows pending for at-least-once retry.
- Added reusable audit construction/validation with deep-cloned Protobuf inputs, then routed command, memory, and PostgreSQL audit paths through the shared validator. Lifecycle audits may omit a policy reason but must retain the governing policy version.
- Added the remaining in-memory `DecisionRepository` and FIFO `EventBus` fakes. The decision view reuses the atomic store's validation/cloning and returns `*AppendOnlyError` on duplicates; the bus deliberately retains duplicate publishes and isolates caller mutations.
- TDD evidence: the focused suite first failed only on the missing relay, audit APIs, and memory fake types; after the minimal implementation, fresh `go test -count=1 ./pkg/spine/...` passed.
- Verification evidence: root/scoped Buf lint, G-BUF fixtures, isolated generated freshness, Go 1.25.5 vet/build/fresh unit tests, the fresh Docker-backed integration lane, OPA 1.4.0 tests (6/6), and Terraform 1.11.4 init/validate/fmt-check all passed without Git or cloud operations.
- P4 status: T031–T035 complete; T036 remains unchecked. SC-005 remains covered by the in-memory replay/burst suite and PostgreSQL/Redpanda integration lane; this increment closes the remaining default-lane T035 seams without adding a new SC claim.
- Runner constraint: GNU Make remains unavailable and Git commands are harness-owned, so `make gate`, the Git-backed main comparison, and the generated-tree Git diff were not invoked; their non-Git constituent checks passed.

## NEXT
- T036: finish and formally close the PostgreSQL/Redpanda integration adapters, reconciling their full `OutboxStore`/`DecisionRepository`/`AuditLog` and `EventBus`/`EventSource` behavior with the centralized ports.
- Acceptance: compile-time assertions cover every adapter port; PostgreSQL commits decision/outbox/audit atomically and preserves append-only replay; Redpanda publishes with `contract_id` keys and consumes validated matching events; the tagged 100-event/200-delivery integration proof and the complete non-Git gate pass fresh.

## 2026-07-21 — P4 integration adapter completion (T036)
- Added a real-PostgreSQL adapter acceptance test proving decision/outbox/audit rollback on a late transaction conflict, decision and audit replay, and shared typed append-only errors from both standalone repository ports.
- Mapped PostgreSQL SQLSTATE `23505` at the decision and audit append boundaries to `*platform.AppendOnlyError`; transport and unrelated persistence failures retain their original wrapped errors.
- Retained the existing compile-time assertions for every pgx/franz-go adapter port and the Redpanda consumer's contract-id key validation; the 100-event/200-delivery path still proves exactly 100 applied and 100 skipped.
- TDD evidence: the focused tagged test first failed on the raw pgx duplicate-decision error, then failed on the raw duplicate-audit error after the first minimal fix; both passed after the two narrow boundary translations.
- Verification evidence: root/scoped Buf format/lint, G-BUF fixtures, isolated generated freshness, Go 1.25.5 vet/build/fresh unit tests, OPA 1.4.0 strict check plus 6/6 tests, and Terraform 1.11.4 init/validate/fmt-check all passed. Fresh `go test -tags=integration -count=1 ./...` passed the PostgreSQL/Redpanda lane.
- P4 status: T031–T036 complete; the command → outbox → bus → projection → audit checkpoint is green. SC-005 remains covered by both in-memory and real PostgreSQL/Redpanda tests; no new SC is claimed.
- Runner constraint: GNU Make remains unavailable and Git commands are harness-owned, so `make gate` and Git-backed comparisons were not invoked; all non-Git constituents passed directly. No product blocker remains for T036.

## NEXT
- T037: add `pkg/platform/override_test.go` asserting the complete G-OVR decision table, then implement only the minimal T040 validator slice needed to restore the green gate.
- Acceptance: two distinct staff approvers pass; `MODEL`/`SYSTEM` return `*AuthorityForgeryError`; single/same-ref approvers return `*FourEyesError`; the target decision remains unchanged; `causation_id == target_decision`; the focused RED is witnessed first and the complete non-Git gate ends green.

## 2026-07-21 — P5 OverrideRecord four-eyes invariants (T037 + T040)
- Added the complete synthetic G-OVR acceptance suite: two distinct staff approvers pass; model/system actors return `*AuthorityForgeryError{Field:"approvers"}`; same-ref and single approvals return `*FourEyesError`; all four governed classes require four-eyes; a non-listed class requires exactly one named human.
- Implemented pure `ValidateOverrideRecord` and `AssertFourEyes` validation over the generated contract, including complete envelope/record fields, nonempty evidence, valid review time, a new override contract id, and `header.causation_id == target_decision`. Validation does not mutate the byte-for-byte cloned target decision.
- TDD evidence: the focused suite first failed to compile only because `ValidateOverrideRecord` was absent. A separate evidence-requirement case then failed behaviorally with a nil error before the minimal `evidence_refs` check restored GREEN.
- Verification evidence: pinned buf 1.50.0 format/lint, G-BUF fixtures, remote generated-code freshness, Go 1.25.5 vet/build/fresh unit tests, OPA 1.4.0 strict check plus 6/6 tests, and Terraform 1.11.4 init/validate/fmt-check all passed. Fresh `go test -tags=integration -count=1 ./...` also passed the PostgreSQL/Redpanda lane.
- P5 status: T037 and T040 complete; T038–T039 and T041–T042 remain. The Go validator portion of FR-017/SC-008 and the `OverrideRecord` portion of SC-002 are covered; SC-008 remains open until the OPA mirror and audit path land.
- Runner constraint: GNU Make remains unavailable and Git commands are harness-owned, so `make gate` and Git-backed comparisons were not invoked; all non-Git constituents passed directly. No product blocker remains for T037/T040.

## NEXT
- T038 + the minimal T041 validator slice: add `pkg/platform/appeal_test.go` asserting the complete G-APL table, then implement `ValidateAppeal` and `AssertReviewerIndependent` only far enough to restore the green gate.
- Acceptance: a distinct independent reviewer passes; the target's authorized human returns `*ReviewerConflictError`; `reopened` and `late` are recordable; an out-of-enum status returns `*NamedFieldError{Field:"status"}`; the target remains byte-for-byte unchanged; the focused RED is witnessed first and the complete non-Git gate ends green.

## 2026-07-21 — P5 Appeal reviewer independence (T038 + T041)
- Added the complete synthetic G-APL acceptance suite: a distinct reviewer passes, the target decision owner returns `*ReviewerConflictError{Field:"independent_reviewer"}`, `filed`/`reopened`/`late` are recordable, unspecified and unknown statuses fail by named field, and the target remains byte-for-byte unchanged.
- Implemented pure `ValidateAppeal` and `AssertReviewerIndependent` validation over the generated contract. Required fields follow the normative data-model invariant list, every defined nonzero lifecycle status is allowlisted, and reviewer equality is determined only by the pseudonymous actor reference.
- TDD evidence: the focused suite first failed to compile only because `ValidateAppeal` and `AssertReviewerIndependent` were absent, then passed after the minimal implementation.
- Verification evidence: pinned buf 1.50.0 root/scoped format/lint, G-BUF fixtures, isolated and in-place generated freshness, Go 1.25.5 vet/build/fresh unit tests, OPA 1.4.0 strict check plus 6/6 tests, and Terraform 1.11.4 init/validate/fmt-check all passed. Fresh `go test -tags=integration -count=1 ./...` also passed the PostgreSQL/Redpanda lane.
- P5 status: T037–T038 and T040–T041 complete; T039 and T042 remain. The Go validator portion of FR-018/SC-009 and the `Appeal` portion of SC-002 are covered; the full P5 checkpoint remains open until the OPA mirrors and override/appeal audit path land.
- Runner constraint: GNU Make remains unavailable and Git commands remain harness-owned, so `make gate` and Git-backed comparisons were not invoked; every non-Git constituent passed directly. No product blocker remains for T038/T041.

## NEXT
- T039 + the OPA policy slice of T042: add the G-OVR/G-APL Rego tests, then implement `policies/override.rego` and `policies/appeal.rego` only far enough to restore the green gate.
- Acceptance: governed overrides deny model/system approvers and fewer than two distinct human refs; appeals deny when `independent_reviewer_ref == authorized_human_ref`; the focused Rego tests witness RED first, both packages pass strict OPA 1.4.0 checks, and the complete non-Git gate ends green.

## 2026-07-21 — P5 override and appeal OPA mirrors (T039 + policy slice of T042)
- Added `gt100k.override.deny` with the four pinned DP-3 classes, MODEL/SYSTEM authority-forgery denial, and distinct nonempty-ref four-eyes enforcement; non-governed corrections remain outside the four-eyes rule.
- Added `gt100k.appeal.deny`, comparing a nonempty `independent_reviewer.ref` with the target decision's `authorized_human_ref`, plus synthetic G-OVR/G-APL tests for pass and deny outcomes.
- TDD evidence: the focused OPA run first failed 6/6 because both policy packages were absent, then passed 6/6 after the minimal implementations. Strict OPA compilation and formatting also pass.
- Verification evidence: Buf 1.50.0 root/scoped format/lint, G-BUF fixtures, remote generated-code freshness, Go 1.25.5 vet/build/fresh unit tests, OPA 1.4.0 strict check plus 12/12 tests and bundle build, and Terraform 1.11.4 init/validate/fmt-check all pass. The fresh Docker-backed PostgreSQL/Redpanda integration lane also passes.
- P5 status: T037–T041 complete; the policy portion of T042 is complete, while its override/appeal persistence and audit slice remains open. The OPA mirror portions of FR-017/FR-018 and SC-008/SC-009 are covered; the full P5 checkpoint remains open until both lifecycle actions write append-only audits.
- Runner constraint: GNU Make remains unavailable and Git commands are harness-owned, so `make gate` and Git-backed comparisons were not invoked; all non-Git constituents passed directly.

## NEXT
- T042 remaining audit slice: add `pkg/spine/override_appeal_audit_test.go`, shared `OverrideRepository`/`AppealRepository` ports, lifecycle recording functions, and append-only in-memory fakes.
- Acceptance: recording a valid override preserves the target, appends the new record, and writes exactly one `action:"override"` audit; filing a valid appeal preserves the target, appends the appeal, and writes exactly one `action:"appeal_filed"` audit; invalid inputs fail before persistence, duplicate ids are rejected append-only, adapter failures propagate, focused RED is witnessed first, and the complete default plus integration gates end green.

## 2026-07-21 — P5 override/appeal persistence and lifecycle audit (remaining T042)
- Added `RecordOverride` and `FileAppeal` over the shared decision/lifecycle repository and audit ports. Both clone caller-owned contracts, load the immutable target, enforce the existing Go invariants, and write exactly one lifecycle audit with the contract's traceability header.
- Added append-only in-memory override and appeal repositories with deep-cloned ingress/egress, target-ordered lookup, and typed duplicate-contract rejection. Valid lifecycle actions preserve their target decisions; invalid records have no persistence or audit side effects.
- TDD evidence: the focused spine suite first failed to compile only on the missing lifecycle APIs and memory repository types, then passed after the minimal implementation. The acceptance suite checks exact `override`/`appeal_filed` actions, outcomes, audit ids, target preservation, clone isolation, invalid-input rejection, and duplicate append-only behavior.
- Verification evidence: pinned Buf 1.50.0 format/lint, G-BUF fixtures and generated-code freshness, Go 1.25.5 vet/build/fresh unit tests, OPA 1.4.0 strict check plus 12/12 tests, and Terraform 1.11.4 init/validate/fmt-check all passed. Fresh `go test -tags=integration -count=1 ./...` also passed the PostgreSQL/Redpanda lane.
- P5 status: T037–T042 complete; the six contracts now validate in Go, the override/appeal invariants have OPA mirrors, and both lifecycle actions write append-only audits. SC-008 and SC-009 are covered; the P5 checkpoint is green.
- Runner constraint: Git commands remain harness-owned, so `make gate` and the explicit Git diff recipe were not invoked; every non-Git constituent passed directly. No blocker remains for P5.

## NEXT
- T043: add `workflows/deletion/deletion_test.go` with Temporal's `testsuite.TestWorkflowEnvironment` before implementing the workflow in ordered T046.
- Acceptance: the focused test witnesses RED first; the workflow reaches `Completed`; every deletion activity is idempotent; an injected `CryptoShred` failure retries/compensates and still completes; the deletion audit fact is preserved; the complete non-Git gate remains green.

## 2026-07-21 — P6 Temporal deletion workflow proof (T043 + partial T046)
- Added the pinned Temporal Go SDK v1.34.0 and an in-memory `testsuite.TestWorkflowEnvironment` acceptance suite for the five-step deletion workflow.
- Added deterministic `DeletionWorkflow` orchestration plus injected worker activities for PostgreSQL erasure, S3 deletion, Redis clearing, the KMS crypto-shred stub seam, and append-only deletion audit recording. Activity inputs carry replay-stable workflow-operation idempotency keys.
- Proved replay idempotency by running the same synthetic subject workflow twice: all five activities were attempted twice but applied exactly once in order. A one-shot synthetic crypto-shred failure retried on attempt two, surfaced `Compensated`, reached `Completed`, and preserved exactly one deletion-audit fact.
- TDD evidence: the focused test first failed to compile only on the absent workflow/activity API, then passed after the minimal implementation; ten fresh focused repetitions remained green.
- Verification evidence: pinned Buf 1.50.0 root/scoped format/lint, G-BUF fixtures, isolated generated freshness and unchanged in-place generation manifest, Go 1.25.5 vet/build/fresh unit tests, OPA 1.4.0 strict check plus 12/12 tests, and Terraform 1.11.4 init/validate/fmt-check all passed. Fresh `go test -tags=integration -count=1 ./...` also passed the PostgreSQL/Redpanda lane.
- P6 status: T043 complete; the workflow/activity portion of T046 is implemented, while its production `DeletionStarter` adapter/wiring remains open. The Temporal workflow portion of FR-014/SC-006 is covered; full SC-006 remains open until the remaining T046 wiring is proven.
- Runner constraint: GNU Make remains unavailable and Git commands are harness-owned, so `make gate` and Git-backed comparisons were not invoked; every non-Git constituent passed directly.

## NEXT
- T044: add `services/identity-consent/enrollment_test.go` asserting the enrollment-handoff stub yields the canonical synthetic `EligibleLearner` reference-only shape before implementing ordered T047.
- Acceptance: the focused test witnesses RED first; the stub emits the exact synthetic learner, accommodation-profile, eligibility-evidence, and Track references; no raw or legal identity data is exposed; the complete non-Git gate ends green.

## 2026-07-21 — P6 synthetic enrollment handoff (T044 + T047)
- Added a deterministic `EnrollmentStub` implementing the shared `EnrollmentHandoffSource` and yielding a deep-cloned canonical synthetic `EligibleLearner` on every call.
- Added focused acceptance coverage for the exact DP-1 learner, accommodation-profile, eligibility-evidence, and Track references, the four-field reference-only schema, shared-port conformance, and mutation isolation from the canonical fixture.
- TDD evidence: the focused test first failed to compile only because `NewEnrollmentStub` was absent, then the focused and complete identity-consent suites passed after the minimal implementation.
- Verification evidence: pinned Buf 1.50.0 root/scoped format/lint, hermetic G-BUF fixtures and generated-code freshness, Go 1.25.5 vet/build/fresh unit tests, OPA 1.4.0 strict check plus 12/12 tests, and Terraform 1.11.4 init/validate/fmt-check all passed. Fresh `go test -tags=integration -count=1 ./...` also passed the PostgreSQL/Redpanda lane.
- P6 status: T043–T044 and T047 complete; T045, the remaining T046 Temporal starter wiring, and T048–T049 remain. FR-013 is covered by the reference-only stub and its existing provisioning path; the P6 checkpoint and SC-006/SC-010 remain open.
- Runner constraint: Git commands remain harness-owned, so `make gate` and its Git-backed comparisons were not invoked; every non-Git constituent passed directly. No blocker remains for T044/T047.

## NEXT
- T045: add `infra/terraform/validate_all.sh` and wire it into the gate so every Terraform module is initialized with `-backend=false`, validated, and format-checked without credentials or resource creation.
- Acceptance: a structural/fake-module test witnesses RED first for missing module iteration or failed init/validate/fmt propagation; the script validates every current module hermetically, `Makefile` and dedicated CI invoke it, and the complete non-Git gate ends green.

## 2026-07-21 — P6 Terraform validate-only gate (T045)
- Added `infra/terraform/validate_all.sh`, which discovers every direct Terraform module, fails closed when none exist, and runs noninteractive `init -backend=false`, `validate`, and recursive `fmt -check` for each without any plan/apply path. A temporary `TF_DATA_DIR` keeps init caches out of the source tree and is removed on exit.
- Added a hermetic fake-Terraform contract test proving every module is visited, the exact backend-disabled/validate/format commands are used, plan/apply never run, working data is isolated and cleaned, and init, validate, or format failures each stop the gate before the next module. Replaced the `_smoke`-only Make recipe with the contract test plus the real runner; the dedicated workflow already invokes it transitively through `make gate`.
- TDD evidence: the focused test first failed because `validate_all.sh` was absent, then passed after the minimal runner and gate wiring were added. A second regression RED proved `TF_DATA_DIR` was not isolated before the temporary-data fix restored GREEN.
- Verification evidence: fresh root/scoped Buf lint, Go 1.25.5 vet/build/unit tests, OPA 1.4.0 strict check plus 12/12 tests, the fake-module contract, real `_smoke` init/validate, recursive Terraform format-check, and an explicit no-`.terraform` assertion all passed without Git, cloud credentials, or resource creation.
- P6 status: T043–T045 and T047 complete; the remaining T046 Temporal starter wiring and T048–T049 remain. FR-019's reusable validation gate is covered, but SC-010 remains open until all T048/T049 Terraform modules exist and pass it.
- Runner constraint: Git commands remain harness-owned, so the aggregate `make gate` and its Git-backed comparisons were not invoked; every non-Git mandatory constituent passed directly.

## NEXT
- T046 remaining starter slice: implement a Temporal-backed `spine.DeletionStarter` adapter and wire the consent-withdrawal path to start the already-tested `DeletionWorkflow` exactly once for a newly withdrawn consent.
- Acceptance: focused tests witness RED first; the adapter starts a deterministic workflow id for the pseudonymous subject, idempotent repeat withdrawals do not start another run, start failures propagate without duplicating the withdrawal audit, and the complete default gate ends green.

## 2026-07-21 — P6 Temporal deletion starter wiring (remaining T046)
- Added a narrow Temporal client adapter implementing `spine.DeletionStarter`. It starts the existing `DeletionWorkflow` with the pseudonymous subject input and an injected task queue, without waiting for workflow completion.
- Made workflow starts idempotent with stable `gt100k-deletion/<subject_ref>` ids, `USE_EXISTING` for running executions, and `REJECT_DUPLICATE` for completed executions. Genuine Temporal start errors remain visible to the consent service.
- Added focused adapter and consent-path coverage proving exact workflow options/input, concrete port conformance, one start across a repeated withdrawal, one successful withdrawal audit, and no audit when the start request fails.
- TDD evidence: the focused packages first failed to compile only because `deletion.NewTemporalStarter` was absent, then passed after the minimal adapter implementation.
- Verification evidence: fresh Buf 1.50.0 root/scoped format/lint, G-BUF compatibility fixtures, generated-code freshness, Go 1.25.5 vet/build/unit tests, OPA 1.4.0 strict check plus 12/12 tests, and Terraform 1.11.4 contract/init/validate/fmt-check all passed without Git, cloud credentials, or resource creation.
- P6 status: T043–T047 complete; FR-014 and SC-006 are covered by the consent cascade, concrete Temporal starter, idempotent workflow activities, compensation/retry, and preserved audit proofs. T048–T049 and SC-010 remain, so the P6 checkpoint is still open.
- Runner constraint: GNU Make remains unavailable and Git commands are harness-owned, so `make gate` and Git-backed comparisons were not invoked; every non-Git mandatory constituent passed directly.

## NEXT
- T048: implement the seven validate-only Terraform modules under `infra/terraform/modules/`: `bootstrap-org`, `network-vpc`, `eks`, `rds`, `s3-kms`, `iam`, and `event-runtime`.
- Acceptance: module-focused structural tests witness RED first; every module is self-contained, uses only US-region/provider-agnostic validation inputs, encodes the pinned account/network/security/runtime boundaries without credentials or apply paths, and passes `infra/terraform/validate_all.sh` plus recursive `terraform fmt -check` while the complete non-Git gate remains green.

## 2026-07-21 — P6 validate-only AWS runtime modules (T048)
- Added all seven self-contained Terraform modules: Organization/OUs plus Core and Identity accounts; a three-AZ private VPC with default-deny security groups and AWS service endpoints; private EKS with explicit administrators, managed nodes, and IRSA; encrypted Multi-AZ PostgreSQL with managed credentials, PITR, and a pgvector migration contract; KMS-encrypted/private S3 buckets plus per-subject key-hierarchy inputs; least-privilege EKS/IRSA roles; and variables-only managed Redpanda/Temporal wiring.
- Every AWS module accepts an injected provider and enforces a commercial-US-region boundary. No module embeds a backend, provider credentials, plan/apply command, public data-store route, or managed-runtime resource; the reserved Public/Sandbox/Sensitive boundaries remain empty OUs.
- Recovery/TDD evidence: the interrupted workspace already contained a passing structural suite and module implementations. Review found that EKS still accepted two subnets; the new three-AZ assertion failed with `eks is missing a three-AZ subnet minimum`, then passed after the validator was tightened to three. No broader red-green claim is made for the recovered artifacts.
- Verification evidence: fresh root/scoped Buf format/lint, G-BUF fixture compatibility, isolated generated-code freshness, Go 1.25.5 vet/build/unit tests, OPA 1.4.0 strict check plus 12/12 tests, Terraform contract/failure-propagation tests, and real Terraform 1.11.4 backend-disabled init/validate/fmt for `_smoke` plus all seven modules passed without Git, cloud credentials, or resource creation.
- Cleanup: moved six generated `.terraform` provider-cache directories (about 4 GiB total) to the system trash; they are recoverable/recreatable, and the source tree contains no Terraform cache or state files.
- P6 status: T043–T048 complete; T049 and the environment-composition portion of SC-010 remain, so the P6 checkpoint is still open. The T048 module slice of FR-019 is covered.
- Runner constraint: Git commands remain harness-owned, so the aggregate `make gate` and its Git-backed comparisons were not invoked; every non-Git mandatory constituent passed directly.

## NEXT
- T049: implement `infra/terraform/environments/dev/` composition wiring the seven T048 modules with placeholder-only inputs and `terraform.tfvars.example`.
- Acceptance: the dev root composes the Core/Identity infrastructure without provider credentials or real account/runtime identifiers; all cross-module inputs/outputs type-check; placeholders remain synthetic and US-only; `infra/terraform/validate_all.sh` covers the environment or an equivalent backend-disabled environment validation is added; recursive format-check and the complete non-Git gate remain green.

## 2026-07-21 — P6 validate-only dev environment composition (T049)
- Added a credential-free `environments/dev` root that composes every T048 module type with explicit Organization/Core/Identity provider boundaries, network/IAM/KMS cross-module wiring, a two-stage base-role/IRSA IAM graph, synthetic administrator/thumbprint defaults, a pinned provider lock, and the canonical placeholder-only `terraform.tfvars.example`.
- Extended the validate-only runner to discover environment roots as well as leaf modules. It mirrors the complete Terraform tree into a temporary workspace so relative module sources resolve, assigns each configuration a separate temporary `TF_DATA_DIR`, and leaves source directories untouched.
- Added a persistent dev-environment contract test covering all module sources, boundary routing, dependency wiring, the commercial-US allowlist, exact placeholder values, and rejection of credentials, real account ids, plan/apply paths, backends, and machine paths. The Make gate now runs it before the hermetic validation tests.
- TDD evidence: the environment contract first failed on missing `environments/dev/versions.tf`, and the gate contract independently failed because the runner skipped `environments/dev`. Review regressions then failed on absent provider-boundary aliases and the absent environment provider lock before each minimal fix restored green.
- Verification evidence: fresh Buf 1.50.0 format/lint, G-BUF fixtures, generated-code freshness, Go 1.25.5 vet/build/unit tests, OPA 1.4.0 strict check plus 12/12 tests, Terraform structural/failure-propagation contracts, recursive format-check, and real Terraform 1.11.4 backend-disabled init/validate for `_smoke`, all seven leaf modules, and `environments/dev` passed. The Docker-backed integration lane also passed fresh during the increment.
- Cleanup: moved six pre-existing generated `.terraform` provider-cache directories (about 4 GiB total) to the recoverable system trash; provider lock files remain, and no Terraform cache or state remains in the source tree.
- P6 status: T043–T049 complete; FR-019 and SC-010 are covered, and the provision → withdraw → Temporal deletion plus validate-only Terraform checkpoint is green. No blocker remains for P6.
- Runner constraint: Git commands are harness-owned, so `make gate`, the Git-backed main compatibility comparison, and the generated-tree Git diff were not invoked; every non-Git mandatory constituent passed directly, and no cloud plan/apply ran.

## NEXT
- T050: add `pkg/platform/README.md` and `pkg/spine/README.md` documenting the public foundation APIs and deferred seams.
- Acceptance: the platform README explains the envelope, all six contracts, and their invariants while stating override/appeal workflows are deferred; the spine README explains ports, atomic outbox/relay/idempotent-consumer and audit patterns, the OPA authorization edge, and deferred production adapters without overstating implemented operations.

## 2026-07-21 — P7 foundation package API guides (T050)
- Added `pkg/platform/README.md` documenting the common envelope, all six generated contracts, their pure validators, typed invariant errors, deterministic dependency interfaces, and the deferred override/appeal human workflows.
- Added `pkg/spine/README.md` documenting the shared ports, OPA-backed command edge, atomic authorized-command unit of work, at-least-once relay, contract-id consumer deduplication, audit/lifecycle functions, available adapters, and deferred production seams.
- Kept the operational claims narrow: consumer projection/offset writes are separate, lifecycle record/audit appends are separate, and the package provides orchestration primitives rather than a long-running process host.
- TDD evidence: both package-focused README tests first failed because `README.md` was absent, then passed after the two guides were added. The tests pin all six contract names, the exported validator/error surface, spine orchestration entry points, OPA policy-version propagation, adapter coverage, and deferred-work language.
- Verification evidence: fresh Buf 1.50.0 root/scoped format/lint, G-BUF compatibility fixtures, isolated and in-place generated-code freshness, Go 1.25.5 vet/build/unit tests, OPA 1.4.0 strict check plus 12/12 tests, and Terraform 1.11.4 structural/failure-propagation tests plus backend-disabled init/validate/fmt for `_smoke`, all seven modules, and `environments/dev` passed. The Docker-backed PostgreSQL/Redpanda integration lane also passed fresh.
- P7 status: T050 complete; T051–T055 remain. This documentation increment adds no SC claim; SC-011 remains open for the ordered golden-test and final-gate work.
- Runner constraint: GNU Make remains unavailable and Git commands remain harness-owned, so `make gate`, the Git-backed main compatibility comparison, and the generated-tree Git diff were not invoked; every non-Git mandatory constituent passed directly, and no cloud plan/apply ran.

## NEXT
- T051: implement `cmd/demo/main.go` as the synthetic headless walkthrough of the complete foundation spine path described by `quickstart.md`.
- Acceptance: the demo uses deterministic in-memory/stub dependencies to drive provision → consent/assent → OPA authorization → command/outbox → relay/projection → override → appeal → withdrawal/Temporal deletion start, reports each successful stage without live data or cloud access, builds and runs from the documented quickstart command, and leaves the complete non-Git gate green.

## 2026-07-21 — P7 synthetic headless spine demo (T051)
- Added `go run ./cmd/demo`, a deterministic synthetic-only walkthrough that uses the real enrollment, consent/assent, embedded OPA, command/outbox, relay/idempotent-consumer, override, appeal, withdrawal, and Temporal deletion workflow APIs over in-memory ports.
- The demo reports each ordered stage, proves a duplicate delivery is skipped, verifies override/appeal do not mutate the target decision, runs every deletion activity to `Completed`, and requires the in-memory deletion-audit fact before reporting success. It creates no cloud resources and needs no external service.
- TDD evidence: the acceptance test first failed to compile on the absent `run`; a subprocess regression then reproduced Temporal's timestamped stderr debug leakage before injected logging restored clean deterministic output; a deletion-stage assertion separately failed until audit preservation became part of the runtime success condition.
- Verification evidence: `go run ./cmd/demo`; fresh Buf root/scoped format/lint, G-BUF compatibility fixtures, generated-code freshness and checksum stability; Go 1.25.5 vet/build/unit tests; OPA 1.4.0 strict check plus 12/12 tests; Terraform 1.11.4 structural/failure-propagation tests plus backend-disabled init/validate/fmt for `_smoke`, all seven modules, and `environments/dev`; and the Docker-backed integration lane all passed.
- Cleanup: moved seven pre-existing generated `.terraform` provider/module caches (about 4.7 GiB) to the recoverable system trash; the hermetic validate runner left the source tree cache-free.
- P7 status: T050–T051 complete; T052–T055 remain. T051 exercises the implemented SC paths end-to-end but does not claim SC-011, which remains ordered to the golden-test and final quickstart/gate work.
- Runner constraint: GNU Make remains unavailable and Git commands are harness-owned, so `make gate`, the Git-backed main compatibility comparison, and the generated-tree Git diff were not invoked; every non-Git mandatory constituent passed directly, and no cloud plan/apply ran.

## NEXT
- T052: add deterministic record replay and Temporal workflow replay tests in `pkg/platform/replay_test.go` and `workflows/deletion/replay_test.go`.
- Acceptance: injected `Clock` and `IDGenerator` inputs produce byte-identical records across repeated construction; the deletion workflow history replays without nondeterminism; focused tests witness RED first; and the complete non-Git gate ends green.

## 2026-07-21 — P7 deterministic record and Temporal replay proofs (T052)
- Added a record-replay acceptance test that runs the real command path twice over independent in-memory stores with identical injected clocks and id generators, then compares deterministic decision/event/audit Protobuf bytes plus outbox idempotency keys and staged times.
- Added a complete synthetic Temporal history covering all five deletion activities and replayed it with the SDK `WorkflowReplayer`; an incompatible activity-order negative control proves the history reaches Temporal's nondeterminism detector.
- TDD evidence: the task's structural acceptance probe first failed because both ordered replay-test files were absent. The completed focused tests then passed against the already-deterministic production paths, so no production API or behavior change was required.
- Verification evidence: fresh Buf 1.50.0 root/scoped format/lint, G-BUF fixtures and generated-code freshness, Go 1.25.5 vet/build/unit tests, OPA 1.4.0 strict check plus 12/12 tests, Terraform 1.11.4 structural/failure-propagation contracts plus backend-disabled init/validate/fmt for `_smoke`, all seven modules, and `environments/dev` passed. The Docker-backed PostgreSQL/Redpanda integration lane also passed fresh.
- Cleanup: moved seven generated `.terraform` provider/module caches (about 4.7 GiB total) to the recoverable system trash; no Terraform cache or state remains in the source tree.
- P7 status: T050–T052 complete; T053–T055 remain. FR-016 is now covered by explicit record and workflow replay proofs; SC-011 remains open for the ordered golden-test and final-gate work.
- Runner constraint: GNU Make remains unavailable and Git commands are harness-owned, so `make gate`, the Git-backed main compatibility comparison, and the generated-tree Git diff were not invoked; every non-Git mandatory constituent passed directly, and no cloud plan/apply ran.

## NEXT
- T053: add `pkg/platform/golden_test.go` and `pkg/spine/golden_test.go` asserting every pinned golden decision table, with G-AUTH retained in `policies/`.
- Acceptance: seed-backed tests cover every row of G-ENV, G-DEC, G-ASSENT, G-IDEM, G-OVR, and G-APL plus the existing G-AUTH policy rows; a structural/table-coverage RED is witnessed first; SC-011's golden values are represented exactly; and the complete non-Git gate ends green.

## 2026-07-21 — P7 consolidated golden decision tables (T053)
- Added `pkg/platform/golden_test.go` with seed-backed, table-driven coverage for every G-ENV, G-DEC, G-ASSENT, G-OVR, and G-APL row, including exact typed-error fields, append-only outcomes, active-guardian assent veto, governed/non-governed override behavior, and target preservation.
- Added `pkg/spine/golden_test.go` with the exact G-IDEM replay vector, out-of-order delivery, projection counts/keys, and a genuinely interleaved 200-delivery burst producing 100 applied and 100 skipped results through the real in-memory offsets/projection adapters.
- Pinned the consequential decision's `StaffGuide` authority and policy bundle plus the exact override/appeal payload values; retained the existing six-row G-AUTH Rego table as the policy golden source.
- TDD evidence: the structural acceptance probe first failed on both absent ordered files, then the focused platform/spine suites passed after the golden tables were added. Review found and closed one drift gap by explicitly asserting the valid G-DEC actor and bundle rather than relying only on validator success.
- Verification evidence: pinned Buf 1.50.0 root/scoped format/lint, G-BUF fixtures, isolated generated freshness and in-place checksum stability; Go 1.25.5 vet/build/fresh unit tests; OPA 1.4.0 strict check plus 12/12 tests; and Terraform 1.11.4 structural/failure-propagation contracts plus backend-disabled init/validate/fmt for `_smoke`, all seven modules, and `environments/dev` passed. The Docker-backed integration lane also passed fresh.
- Cleanup: moved seven stale generated `.terraform` provider/module caches (about 4.7 GiB) to the recoverable system trash. Their timestamps predated this increment; a fresh complete isolated Terraform validation left the source tree cache-free.
- P7 status: T050–T053 complete; T054–T055 remain. All pinned golden decision tables are now represented, but SC-011 remains open for the ordered runbook/quickstart and final full-gate tasks.
- Runner constraint: GNU Make remains unavailable and Git commands remain harness-owned, so `make gate`, the Git-backed main compatibility comparison, and the generated-tree Git diff were not invoked; every non-Git mandatory constituent passed directly, and no cloud plan/apply ran.

## NEXT
- T054: add `runbooks/foundation-spine.md`, run the documented `quickstart.md` path end-to-end, and verify the complete foundation gate at the operations boundary.
- Acceptance: the runbook documents mandatory and integration commands, synthetic/no-cloud operation, failure recovery, and deferred production adapters; every quickstart command succeeds; `make gate` is exercised when GNU Make is available or every non-Git recipe is rerun with the harness-owned Git comparisons explicitly deferred; the increment ends green.

## 2026-07-21 — P7 foundation spine operations runbook (T054)
- Added `runbooks/foundation-spine.md` with the pinned-tool preflight, mandatory and Docker integration lanes, the synthetic/no-cloud safety boundary, lane-specific failure recovery, and an explicit current-seam-to-production-target handoff table.
- Documented `make gate` as the normal operator/CI entry point and an exact non-Git fallback for harness-owned worktrees, keeping the `main` schema comparison and generated-tree repository diff visible rather than silently skipping them.
- TDD evidence: the focused runbook acceptance probe first failed on the absent file, then passed with every required operations section and command present.
- Quickstart evidence: `go run ./cmd/demo` exited 0 with the deterministic synthetic-only provision-to-deletion summary and no extra stderr; Docker 29.6.2 then ran the fresh PostgreSQL/Redpanda testcontainers lane successfully.
- Verification evidence: pinned Buf 1.50.0 root/scoped format/lint, G-BUF compatibility fixtures and isolated generated freshness; Go 1.25.5 vet/build/fresh unit tests; OPA 1.4.0 strict check plus 12/12 tests; and Terraform 1.11.4 structural/failure-propagation contracts plus backend-disabled init/validate/fmt for `_smoke`, all seven modules, and `environments/dev` passed.
- Cleanup: moved seven generated `.terraform` provider caches (about 4.7 GiB total) to the recoverable system trash; no Terraform cache or state remains in the source tree.
- P7 status: T050–T054 complete; T055 remains. The T054 operations-boundary portion of SC-011 is covered, but the whole-spec completion marker remains correctly absent until final shared-file hygiene and the harness-owned complete Git-backed gate finish.
- Runner constraint: GNU Make remains unavailable and Git commands remain harness-owned, so `make gate`, the live `main` compatibility comparison, and the generated-tree Git diff were not invoked; every non-Git constituent and the optional real-adapter integration lane passed fresh, and no cloud plan/apply ran.

## NEXT
- T055: reconcile the already-present `infra/terraform/environments/dev/terraform.tfvars.example`, add the ignored local `.env.local` placeholder, and make the strictly final shared/root `.gitignore` changes required by the task.
- Acceptance: `.env.local` contains placeholders only and remains ignored/untracked; `terraform.tfvars.example` stays synthetic and committable while real `**/terraform.tfvars` and `**/*.tfstate*` are ignored; no secret, credential, machine path, or Terraform cache/state enters the tree; all ordered tasks and SCs are rechecked, the complete non-Git gate ends green, and `.loop-done` is created only if the whole spec is genuinely complete.

## 2026-07-21: P7 final environment and state hygiene (T055)
- Added the pinned placeholder-only `.env.local` and explicit root ignore rules for `.env.local`, real Terraform variable files, and Terraform state. The existing committed `terraform.tfvars.example` already contained the four required synthetic values and needed no content change.
- TDD evidence: the focused structural check failed on the missing local placeholder and all three missing ignore rules, then passed after the minimal change. It also rejects unexpected active values in `.env.local`.
- Verification evidence: pinned Buf 1.50.0 format/lint, G-BUF compatibility fixtures, isolated generated freshness, and unchanged in-place generation; Go 1.25.5 vet/build/fresh unit tests; OPA 1.4.0 strict check plus 12/12 tests; Terraform 1.11.4 structural contracts and backend-disabled validation for `_smoke`, all seven modules, and `environments/dev`; the synthetic demo; and the Docker-backed PostgreSQL/Redpanda integration lane all passed fresh.
- Cleanup: moved seven generated `.terraform` provider caches, about 4.7 GiB total, to the recoverable system trash. No Terraform cache, state, or real `terraform.tfvars` remains in the source tree.
- Completion status: T001–T055 are complete. SC-001 through SC-011 have mapped passing tests, and `.loop-done` records whole-spec completion. GNU Make remains unavailable, and the no-Git rule leaves the live `main` compatibility comparison plus repository diff to the harness.

## NEXT
- Harness: commit this green final increment and run the Git-backed CI gate before merge-queue submission.
- Acceptance: use `.loop/commit-msg`, confirm `make gate` passes with the live `main` baseline and generated-tree diff, and merge only through the governed PR queue.
