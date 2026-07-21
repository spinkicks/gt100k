# Skill Observation Log

Observations captured during task-oriented work.

**Status key:** OPEN = not yet actioned | ACTIONED (YYYY-MM-DD) = skill
updated/created | DECLINED (YYYY-MM-DD) = user decided not to pursue —
resolved statuses always carry their resolution date

---

## 2026-07-20

- 2026-07-20 T012 checkpoint: no observations.
- 2026-07-20 T013 checkpoint: no observations.
- 2026-07-20 T014 checkpoint: no observations.
- 2026-07-20 T015 checkpoint: no observations.
- 2026-07-20 T016/T020 checkpoint: no observations.
- 2026-07-20 T021 checkpoint: no observations.
- 2026-07-20 T022 implementation checkpoint: no observations.
- 2026-07-20 T023/T028 RED-GREEN checkpoint: no observations.
- 2026-07-20 T023/T028 completion checkpoint: no observations.
- 2026-07-20 weekly review checkpoint: no observations.
- 2026-07-20 T024 RED checkpoint: no observations.

### Observation 4: Distinguish autonomous task sessions from scheduled reviews

**Status:** OPEN
**Date:** 2026-07-20
**Session context:** Executing a harness-managed unattended implementation increment with a narrow product commit scope.
**Skill:** task-observer
**Type:** open-source
**Phase/Area:** Session Start Protocol review trigger

**Issue:** Treating every autonomous task session as a scheduled skill-review run can inject unrelated staged skill updates into a tightly scoped product increment. The trigger conflates an unattended implementation harness with a scheduler whose explicit purpose is skill maintenance.

**Suggested improvement:** Run the review unprompted only when the invocation is explicitly scheduled for skill review or declares skill review as its purpose. For unattended product work, record that the fallback is pending and continue the requested task without staging unrelated updates.

**Principle:** Background execution mode does not imply maintenance intent; automatic side workflows should require a purpose-specific trigger before mutating the task workspace.

- 2026-07-20 T024/T029 completion checkpoint: no additional observations.
- 2026-07-20 T025 RED checkpoint: no additional observations.
- 2026-07-20 T025 completion checkpoint: no additional observations.
- 2026-07-21 T030 RED-GREEN checkpoint: no additional observations.
- 2026-07-21 T030 completion checkpoint: no additional observations.
- 2026-07-21 T031 implementation checkpoint: no additional observations.
- 2026-07-21 T032 implementation checkpoint: no additional observations.
- 2026-07-21 T032 completion checkpoint: no additional observations.
- 2026-07-21 T034 RED-GREEN checkpoint: no additional observations.
- 2026-07-21 T034 completion checkpoint: no additional observations.
- 2026-07-21 T035 implementation checkpoint: no additional observations.
- 2026-07-21 T035 completion checkpoint: no additional observations.
- 2026-07-21 T036 RED-GREEN checkpoint: no additional observations.
- 2026-07-21 T036 completion checkpoint: no additional observations.

## 2026-07-21

### Observation 5: Treat an explicit implementation spec as design approval

**Status:** OPEN
**Date:** 2026-07-21
**Session context:** Executing an autonomous increment from an ordered, test-first implementation specification.
**Skill:** brainstorming
**Type:** open-source
**Phase/Area:** User approval hard gate

**Issue:** The brainstorming hard gate can require a duplicate design document and another approval round even when the user has supplied an approved canonical specification, an ordered task plan, and an explicit instruction to implement autonomously.

**Suggested improvement:** Define explicit implementation requests backed by a canonical design and task plan as satisfying the design-approval gate. Require fresh brainstorming only when the requested increment introduces an unapproved product or architecture choice.

**Principle:** A workflow should recognize approval already embodied in explicit artifacts and instructions instead of manufacturing a redundant approval loop.

- 2026-07-21 T039 checkpoint: no observations.

- 2026-07-21 T037/T040 completion checkpoint: no additional observations.
- 2026-07-21 T038/T041 RED-GREEN checkpoint: no additional observations.
- 2026-07-21 T038/T041 completion checkpoint: no additional observations.
- 2026-07-21 T039 completion checkpoint: no additional observations.
- 2026-07-21 T043 RED-GREEN and gate checkpoint: no additional observations.
- 2026-07-21 T043 completion checkpoint: no additional observations.
- 2026-07-21 T044 RED-GREEN checkpoint: no additional observations.
- 2026-07-21 T044/T047 completion checkpoint: no additional observations.
- 2026-07-21 T045 implementation checkpoint: no additional observations.

### Observation 6: Isolate Terraform init data in automated validate-only gates

**Status:** OPEN
**Date:** 2026-07-21
**Session context:** Adding a validate-only Terraform gate that will later cover provider-backed and child-module configurations.
**Skill:** New skill candidate: terraform-validate-gate
**Type:** open-source
**Phase/Area:** Hermetic gate execution

**Issue:** A validate-only gate can still dirty the source tree because `terraform init -backend=false` writes `.terraform` module and provider data beside the configuration. Automation that stages the working tree may then capture caches even though no plan or apply ran.

**Suggested improvement:** Run each module's init and validate sequence with a gate-owned temporary `TF_DATA_DIR`, clean it on every exit path, and include a fake-Terraform regression test that proves data isolation and cleanup alongside failure propagation.

**Principle:** Read-only infrastructure validation should isolate tool working data from version-controlled inputs; avoiding remote mutations is not enough to make a gate hermetic.

- 2026-07-21 T045 completion checkpoint: Observation 6 captured; no additional observations.

### Observation 7: Reconcile durable loop state with existing artifacts

**Status:** OPEN
**Date:** 2026-07-21
**Session context:** Resuming an autonomous implementation loop whose durable progress ledger marked a task unfinished while its test and implementation artifacts were already present.
**Skill:** New skill candidate: autonomous-loop-recovery
**Type:** open-source
**Phase/Area:** Interrupted increment recovery

**Issue:** A loop ledger can lag behind the workspace when a prior run is interrupted after writing artifacts but before recording progress. Blindly restarting from the ledger risks overwriting valid in-progress work or falsely claiming a new red-green cycle.

**Suggested improvement:** At task startup, compare the ledger with a narrow inventory of task-owned artifacts, preserve unexpected existing work, run its focused tests, and create a fresh failing regression only for a verified gap before continuing.

**Principle:** Durable plans describe intent, but resumable automation must reconcile them with actual artifacts before mutating shared state.

- 2026-07-21 T048 completion checkpoint: Observation 7 captured; no additional observations.

### Observation 8: Preserve relative module topology in Terraform validation mirrors

**Status:** OPEN
**Date:** 2026-07-21
**Session context:** Extending a hermetic validate-only gate from leaf Terraform modules to an environment root that composes those modules through relative sources.
**Skill:** New skill candidate: terraform-validate-gate
**Type:** open-source
**Phase/Area:** Hermetic gate execution

**Issue:** Copying each Terraform configuration into an unrelated temporary directory works for self-contained modules but breaks environment roots whose local module sources depend on the repository-relative directory topology.

**Suggested improvement:** Mirror the complete Terraform source tree into one gate-owned temporary workspace, validate each discovered root at the same relative path, and keep a separate temporary `TF_DATA_DIR` per root. Add a fake-Terraform test that proves both module and environment discovery without touching source directories.

**Principle:** Hermetic validation of composed configuration must preserve source-relative dependency topology while isolating every tool-generated artifact from version-controlled inputs.

- 2026-07-21 T049 completion checkpoint: Observation 8 captured; no additional observations.
- 2026-07-21 T050 RED-GREEN checkpoint: no additional observations.
- 2026-07-21 T050 completion checkpoint: no additional observations.

### Observation 9: Capture process-level output for headless CLI acceptance

**Status:** OPEN
**Date:** 2026-07-21
**Session context:** Building a deterministic headless demo that embeds a workflow SDK test environment.
**Skill:** test-driven-development
**Type:** open-source
**Phase/Area:** CLI acceptance testing

**Issue:** A test that injected a buffer for application output passed while an embedded runtime still wrote timestamped debug messages to process stderr. The executable was functionally correct but its combined output was noisy and nondeterministic.

**Suggested improvement:** For headless CLI acceptance, test both the injectable writer path and a subprocess-level combined stdout/stderr path. Use the subprocess failure to drive explicit logger injection for embedded runtimes.

**Principle:** CLI output contracts live at the process boundary; testing only an internal writer can miss library output emitted through global stdout or stderr.

- 2026-07-21 T051 completion checkpoint: Observation 9 captured; no additional observations.
- 2026-07-21 T051 post-verification checkpoint: no additional observations.
- 2026-07-21 T052 focused replay checkpoint: no additional observations.
- 2026-07-21 T052 completion checkpoint: no additional observations.
- 2026-07-21 T053 golden-test authoring checkpoint: no additional observations.
- 2026-07-21 T053 completion checkpoint: no additional observations.
- 2026-07-21 T054 quickstart and gate checkpoint: no additional observations.
- 2026-07-21 T054 completion checkpoint: no additional observations.
- 2026-07-21 T055 RED-GREEN checkpoint: no additional observations.
- 2026-07-21 T055 completion checkpoint: no additional observations.
