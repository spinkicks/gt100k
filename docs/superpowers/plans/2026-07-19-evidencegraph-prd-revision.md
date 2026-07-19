# EvidenceGraph PRD Revision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Revise PRD §19 (EvidenceGraph) to match the deep-research prior-art findings — fix the integrity architecture, adopt standard provenance formats, reconcile immutability with child-data erasure — and defer the genuinely hard parts to an explicit pre-live-enrollment hardening gate.

**Architecture:** This is a documentation edit to a single file (`PRD.md`). "Correct-now" changes are cheap spec corrections applied to §19 and its cross-references. "Significant-difficulty" changes are recorded as design intent now but their full build/validation is deferred to a new **§19.2 Post-M4 hardening (required before live child enrollment)** subsection, because the Month 4 beta is synthetic (§32.4) and live children only arrive post-admissions-go-live. Each significant difficulty also gets a Release Threshold Registry pre-live gate (§33.1) and a risk row (§34).

**Tech Stack:** Markdown. No build/test toolchain in this repo (docs-only stage per AGENTS.md). "Tests" here are `grep`-based consistency checks against `PRD.md`.

## Global Constraints

- **Single source of truth:** `AGENTS.md` governs; this is a public repo — no machine paths, credentials, or internal identifiers in committed files.
- **Branching:** trunk-based; branch from latest `origin/main`; name `dev/prd/<slug>`; squash-merge; **Conventional Commits** (`docs:` for these edits); PR body references the issue (`Closes #<id>`).
- **Lanes/CODEOWNERS:** confirm the operator owns `PRD.md` in `.github/CODEOWNERS` before editing. `PRD.md` is the canonical spec and is edited directly via PR (see v1.3–v1.5 history); prefer new subsections (§19.2, new §24 anchors) over rewriting unrelated prose.
- **PR size:** keep < ~400 lines; rebase on `origin/main`; CI green (gitleaks); address the AI reviewer.
- **Definition of Done:** matches the PRD section it touches; internal cross-references resolve; Conventional Commit + `Closes #<id>`.
- **Evidence labels:** every new normative claim carries a §5 evidence class verbatim (`E1`/`E2`/`E3`/`R`/`G`/`ENG`, or a `STD-`/`SEC-`/`SRC-` anchor id). Copy the exact ids introduced in Task 9.
- **Phase boundary (verbatim from PRD):** Month 4 beta = **synthetic learners**, "live child enrollment is out of scope … gated behind the admissions team's pipeline going live and the required privacy and legal approvals (§3.4, §8.6, §29)." Deferred items land in the window **after the synthetic Month 4 beta and before live child enrollment.**

---

## File Structure

- Modify only: `PRD.md`
  - §0 change log — add v1.6 entry (Task 10)
  - §19 EvidenceGraph — integrity backbone, formats, erasure, evaluation (Tasks 2–6)
  - §19.1 acceptance criteria — two new bullets (Task 6)
  - §19.2 (new) — Post-M4 hardening (Task 7)
  - §21 Passport — C2PA demotion consistency (Task 8)
  - §24 evidence anchors — new sources (Task 9)
  - §33.1 Release Threshold Registry — pre-live gate row (Task 7)
  - §34 risks — two new rows (Task 7)
- Create: this plan file only. No product code (repo is pre-code).

## Research basis (why each edit)

All edits trace to the completed deep-research run (task `w3l0o76rk`), verified claims:
- **Merkle DAG / SLSA+in-toto+Rekor / W3C PROV / RO-Crate are reusable prior art** (3–0 unanimous). Adopt, don't invent.
- **C2PA fails its claimed security goals** (UMBC/Hacker Factor/NSA, 6 confirmed claims) and "certifies history, not truth." Demote to export-only.
- **Tamper-evidence is anchor-conditional** (two over-claims about intrinsic IPFS immutability were *refuted*). State the anchor dependency.
- **Immutability vs. erasure is the key unsolved risk** → crypto-shred + off-graph encrypted payloads (EDPB 2025, IACR SoK 2026/1109; medium confidence leads).
- **Comparative-judgment reliability is often inflated** (0.97 reported vs 0.82 all-play-all) and needs ~41 comparisons/item (E3 leads) → report de-biased, validate budget, keep panels shadow-only.

---

## Task 0: Branch and confirm ownership

**Files:** none (git only)

- [ ] **Step 1: Confirm PRD ownership**

Run: `grep -n "PRD.md" .github/CODEOWNERS 2>/dev/null || echo "no CODEOWNERS entry"`
Expected: an entry showing the current operator owns `PRD.md`, or a documented decision to proceed. If another lane owns it, stop and coordinate.

- [ ] **Step 2: Branch from latest origin/main**

```bash
git fetch origin
git switch -c dev/prd/evidencegraph-hardening origin/main
```
Expected: new branch created off `origin/main` (not off `add-admissions-prd`).

- [ ] **Step 3: Confirm the current §19 anchors still match**

Run: `grep -n "EvidenceGraph stores a content-addressed evidence DAG" PRD.md`
Expected: exactly one match in §19. If zero, re-read §19 and update the `old_string` anchors in Tasks 2–6 before proceeding.

---

## Task 1: Baseline consistency snapshot

**Files:** none (read-only checks that later tasks re-run)

- [ ] **Step 1: Record current C2PA mentions**

Run: `grep -n "C2PA" PRD.md`
Expected: matches at ~§19 (line ~1076), §21 (~1114), §24 [STD-02] (~1157). Note them; Tasks 2, 8, 9 change them.

- [ ] **Step 2: Record current section headers**

Run: `grep -n "^### 19.1\|^## 20. Reality Gateway\|^### 33.1\|^## 34. Principal" PRD.md`
Expected: all four present. §19.2 (Task 7) inserts between §19.1 and §20.

---

## Task 2: §19 — replace the integrity backbone and adopt standard formats

**Files:**
- Modify: `PRD.md` (§19, the `EvidencePacket` paragraph)

**Interfaces:**
- Produces: the term "transparency log (§19.2)" and "export-only C2PA (§21)" that Tasks 7 and 8 rely on.

- [ ] **Step 1: Add the PROV-alignment sentence to §19 ¶1**

Edit — match this exact `old_string`:

```
Each node records hashes, actor, toolchain or container version, model involvement, inputs, timestamp, and consent scope.
```

Replace with:

```
Each node records hashes, actor, toolchain or container version, model involvement, inputs, timestamp, and consent scope. The node and edge taxonomy is modeled as a domain extension of the W3C PROV data model (PROV's `Entity`, `Activity`, and `Agent`), not a bespoke ontology, so external tools can consume the graph and GT100K inherits PROV's interoperability and existing extensions (e.g. ProvONE, PROV-ML). [STD-03, ENG]
```

- [ ] **Step 2: Replace the EvidencePacket / integrity paragraph**

Edit — match this exact `old_string`:

```
Each milestone creates a `EvidencePacket` with source and artifact hashes, failed branches, reproducible run instructions, verifier output, contribution attestations, assistance lineage, review evidence, and outcomes tied to an exact release. Merkle checkpoints and C2PA or in-toto attestations make later changes visible. WASI verifiers run without ambient network or filesystem access.
```

Replace with:

```
Each milestone creates an `EvidencePacket` serialized as a Workflow Run RO-Crate (WRROC) profile, with source and artifact hashes, failed branches, reproducible run instructions, verifier output, contribution attestations, assistance lineage, review evidence, and outcomes tied to an exact release. Following WRROC, each packet separates *prospective* provenance (the declared plan — a `Transformation` node) from *retrospective* provenance (what actually ran — the `Attempt` node's inputs, outputs, tools, timing, and success). The integrity backbone is a content-addressed DAG over a collision-resistant hash (SHA-256 or BLAKE3) whose per-milestone Merkle roots are attested with in-toto and anchored in an append-only transparency log (§19.2), following the SLSA pattern of publishing a hash-of-attestation plus a transparency-log pointer. WASI verifiers run without ambient network or filesystem access. C2PA / Content Credentials are supported only as an optional *export* format for public artifacts (§21), never as the integrity layer. [STD-04, STD-05, ENG]
```

- [ ] **Step 3: Verify**

Run: `grep -n "Workflow Run RO-Crate\|integrity backbone is a content-addressed DAG\|never as the integrity layer" PRD.md`
Expected: three matches in §19. Run `grep -c "C2PA or in-toto attestations" PRD.md` → expected `0` (old backbone phrasing gone).

- [ ] **Step 4: Commit**

```bash
git add PRD.md
git commit -m "docs: PRD §19 integrity backbone to in-toto + transparency log; adopt PROV/RO-Crate"
```

---

## Task 3: §19 — add the anchor-conditional integrity statement

**Files:**
- Modify: `PRD.md` (§19, new paragraph after the EvidencePacket paragraph)

- [ ] **Step 1: Insert the integrity note**

Edit — match this exact `old_string` (the end of the paragraph edited in Task 2):

```
 C2PA / Content Credentials are supported only as an optional *export* format for public artifacts (§21), never as the integrity layer. [STD-04, STD-05, ENG]

Evaluation combines deterministic checks with human judgment.
```

Replace with:

```
 C2PA / Content Credentials are supported only as an optional *export* format for public artifacts (§21), never as the integrity layer. [STD-04, STD-05, ENG]

**Integrity is anchor-conditional, not intrinsic.** The DAG is tamper-*evident* only relative to (1) a committed Merkle root held in a separate trust domain (HSM/KMS-signed and mirrored to the transparency log, §19.2) and (2) the collision resistance of the chosen hash; a party who controls the object store could otherwise recompute an internally consistent DAG. GT100K therefore treats the root anchor and its independent monitoring — not content-addressing alone — as the security boundary, and forbids SHA-1 and MD5. [G/ENG]

Evaluation combines deterministic checks with human judgment.
```

- [ ] **Step 2: Verify**

Run: `grep -n "Integrity is anchor-conditional" PRD.md`
Expected: one match, positioned before "Evaluation combines deterministic checks".

- [ ] **Step 3: Commit**

```bash
git add PRD.md
git commit -m "docs: PRD §19 state tamper-evidence is anchor-conditional, not intrinsic"
```

---

## Task 4: §19 — add the erasure / crypto-shred paragraph

**Files:**
- Modify: `PRD.md` (§19, new paragraph after the anchor-conditional note)

- [ ] **Step 1: Insert the erasure paragraph**

Edit — match this exact `old_string`:

```
GT100K therefore treats the root anchor and its independent monitoring — not content-addressing alone — as the security boundary, and forbids SHA-1 and MD5. [G/ENG]

Evaluation combines deterministic checks with human judgment.
```

Replace with:

```
GT100K therefore treats the root anchor and its independent monitoring — not content-addressing alone — as the security boundary, and forbids SHA-1 and MD5. [G/ENG]

**Erasure without breaking the chain.** To reconcile append-only provenance with the child's right to erasure (§29; COPPA/FERPA), EvidenceGraph stores artifact and personal payloads encrypted *off-graph* under a per-subject key; only content hashes and PROV metadata live in the DAG. Erasure is performed by crypto-shredding — destroying the per-subject key and leaving a key-reference tombstone — so the payload becomes unrecoverable while the DAG's hashes, attestations, and transparency-log proofs stay valid. On-graph fields are minimized and designed to be rendered anonymous rather than deleted in place, consistent with regulator guidance that true in-place deletion of committed provenance is impracticable. The full key-lifecycle and cascade-to-derived-features workflow is a pre-live hardening item (§19.2). [G/ENG]

Evaluation combines deterministic checks with human judgment.
```

- [ ] **Step 2: Verify**

Run: `grep -n "Erasure without breaking the chain\|crypto-shredding" PRD.md`
Expected: at least the §19 match here (Task 7 adds §19.2/§34 mentions later).

- [ ] **Step 3: Commit**

```bash
git add PRD.md
git commit -m "docs: PRD §19 reconcile immutability with erasure via off-graph crypto-shredding"
```

---

## Task 5: §19 — qualify comparative judgment and pin panels to shadow-only

**Files:**
- Modify: `PRD.md` (§19, the "Open-ended work" evaluation paragraph)

- [ ] **Step 1: Replace the comparative-judgment paragraph**

Edit — match this exact `old_string`:

```
Open-ended work uses adaptive comparative judgment and anchored rubrics. Calibrated model panels may suggest comparisons, while conformal intervals trigger more review under uncertainty. A human owns the result. A sampled live defense asks the student to explain a decision, modify a component, or reconstruct a step. Reviewers treat discontinuity as a sampling signal, never proof of misconduct.
```

Replace with:

```
Open-ended work uses adaptive comparative judgment (ACJ) and anchored rubrics. ACJ reliability must be reported as the de-biased all-play-all coefficient, not the inflated adaptive figure, and the comparison budget is set from evidence (published guidance indicates a substantially higher per-item comparison count than early estimates); validating that budget against reviewer capacity is a pre-live item (§19.2). [E3] Calibrated model panels may *suggest* comparisons, and conformal-interval triggers *route* uncertain work to more human review — both run shadow-only during the Month 4 beta and gain no triage authority over a live grade until calibrated and validated (§8.5, §19.2). A human owns the result. A sampled live defense asks the student to explain a decision, modify a component, or reconstruct a step. Reviewers treat discontinuity as a sampling signal, never proof of misconduct.
```

- [ ] **Step 2: Verify**

Run: `grep -n "de-biased all-play-all\|shadow-only during the Month 4 beta and gain no triage" PRD.md`
Expected: both matches in §19.

- [ ] **Step 3: Commit**

```bash
git add PRD.md
git commit -m "docs: PRD §19 report de-biased ACJ reliability; keep model panels/conformal shadow-only"
```

---

## Task 6: §19.1 — add acceptance criteria for the new integrity and erasure properties

**Files:**
- Modify: `PRD.md` (§19.1 acceptance-criteria list)

- [ ] **Step 1: Append two bullets to the §19.1 list**

Edit — match this exact `old_string`:

```
- Every final grade and every non-deterministic judgment carries a named human owner; a model-only output can never be recorded as the grade or judgment.

## 20. Reality Gateway
```

Replace with:

```
- Every final grade and every non-deterministic judgment carries a named human owner; a model-only output can never be recorded as the grade or judgment.
- The integrity backbone verifies without C2PA: a reviewer can confirm a milestone's Merkle root via an independent transparency-log inclusion proof, and C2PA is used only for optional public-artifact export.
- Crypto-shredding a learner's per-subject key renders their off-graph payloads unrecoverable while every retained EvidencePacket still passes hash and inclusion-proof verification.

## 20. Reality Gateway
```

- [ ] **Step 2: Verify**

Run: `grep -n "verifies without C2PA\|renders their off-graph payloads unrecoverable" PRD.md`
Expected: two matches, both before "## 20. Reality Gateway".

- [ ] **Step 3: Commit**

```bash
git add PRD.md
git commit -m "docs: PRD §19.1 add acceptance criteria for anchor verification and crypto-shred erasure"
```

---

## Task 7: Add §19.2 Post-M4 hardening + pre-live gate (§33.1) + risk rows (§34)

This task records the **significant difficulties** as deferred, gated items. It is one task because the §19.2 notes, the §33.1 gate row, and the §34 rows are the same deferral and a reviewer would accept/reject them together.

**Files:**
- Modify: `PRD.md` (new §19.2 before §20; new §33.1 row; two new §34 rows)

**Interfaces:**
- Consumes: "transparency log (§19.2)" and "pre-live hardening item (§19.2)" references written in Tasks 2 and 4.

- [ ] **Step 1: Insert §19.2 immediately before §20**

Edit — match this exact `old_string` (created by Task 6):

```
- Crypto-shredding a learner's per-subject key renders their off-graph payloads unrecoverable while every retained EvidencePacket still passes hash and inclusion-proof verification.

## 20. Reality Gateway
```

Replace with:

```
- Crypto-shredding a learner's per-subject key renders their off-graph payloads unrecoverable while every retained EvidencePacket still passes hash and inclusion-proof verification.

### 19.2 Post-M4 hardening (required before live child enrollment)

The Month 4 beta runs on synthetic learners (§32.4), so the items below are built and validated **after the synthetic beta and before any live child is enrolled** (post-admissions-go-live gate, §3.4, §8.6, §29). Each is tracked in the Release Threshold Registry (§33.1) as a pre-live gate and in the risk table (§34). These are the parts the prior-art review flagged as genuinely hard; the synthetic beta does not need them because it carries no live child data, but live enrollment must not proceed without them.

- **D1 — External transparency-log anchoring.** The beta may anchor Merkle roots with a simple internal, KMS-signed periodic notarization. Before live enrollment, roots are anchored in an append-only, externally verifiable transparency log (a Trillian-based log such as tile-based Rekor v2 on Trillian-Tessera, or equivalent) with inclusion and consistency proofs, split-view monitoring, and operation at 100,000-learner volume. *Significant difficulty: standing up and operating a monitored transparency log at scale.* [ENG]
- **D2 — Full crypto-shredding erasure workflow.** The §19 design (encrypted off-graph payloads, per-subject keys, keyref tombstones) is specified now; the complete per-subject key lifecycle, cascade to derived features and search indexes, and adversarial verifiable-deletion testing are completed before live PII exists. Synthetic beta data carries no live child PII, so full erasure tooling need not gate Month 4 but must gate live enrollment (§29). *Significant difficulty: verifiable deletion across an append-only store and every derived store.* [G/ENG]
- **D3 — Comparative-judgment reliability program.** Before comparative judgment informs any high-stakes live grade, validate the per-item comparison budget against reviewer capacity, report de-biased reliability, and confirm inter-rater reliability on a representative sample. *Significant difficulty: the evidenced comparison budget may exceed available human-reviewer capacity.* [E3]
- **D4 — Conformal-triggered review calibration.** Conformal-interval triage and model-panel suggestions remain shadow-only (§8.5) until their coverage is calibrated on held-out human-graded work; they gain routing authority over a live grade only after that validation. [R]

Residual evidence gap: the assessment-validity (D3) and erasure-precedent (D2) claims are R/E3-class leads not yet through GT100K's full verification bar; the governance board should commission a focused evidence review before these gates are signed (§24 [SRC-11], [SEC-02]).

## 20. Reality Gateway
```

- [ ] **Step 2: Add the pre-live gate row to §33.1**

Edit — match this exact `old_string`:

```
| Mentor RAG | Citation support at least 98 percent, context precision at least 90 percent, and zero cross-project retrieval or target-deliverable generation in the security suite. | Mentor owner per corpus or model; disable failed version. |
```

Replace with:

```
| Mentor RAG | Citation support at least 98 percent, context precision at least 90 percent, and zero cross-project retrieval or target-deliverable generation in the security suite. | Mentor owner per corpus or model; disable failed version. |
| EvidenceGraph integrity & erasure *(pre-live gate, §19.2)* | External transparency-log inclusion and consistency proofs verify for 100 percent of sampled milestone roots; split-view monitoring active; a per-subject crypto-shred renders payloads unrecoverable while retained packets still verify; comparative-judgment comparison budget validated against reviewer capacity with de-biased reliability reported. | EvidenceGraph owner and safeguarding; block live enrollment until met. |
```

- [ ] **Step 3: Add two risk rows to §34**

Edit — match this exact `old_string`:

```
| Three-month construction speed hides operational debt. | Enforce contract ownership and continuous developer tests during construction, then use Month 4 for integrated SLO, restore, deletion, security, accessibility, load, and release-gate validation; freeze growth when a sentinel threshold fails. |
```

Replace with:

```
| Three-month construction speed hides operational debt. | Enforce contract ownership and continuous developer tests during construction, then use Month 4 for integrated SLO, restore, deletion, security, accessibility, load, and release-gate validation; freeze growth when a sentinel threshold fails. |
| Provenance integrity is over-trusted, or C2PA is relied on as the integrity layer. | Anchor Merkle roots in a monitored, externally verifiable transparency log (§19.2 D1); forbid SHA-1/MD5; treat C2PA as export-only (§19, §21); before live enrollment verify roots via independent inclusion proofs; fail closed and block credential issuance when anchoring or monitoring is unavailable. |
| Immutable provenance blocks a child's right to erasure. | Store payloads encrypted off-graph under per-subject keys; erase by crypto-shredding with keyref tombstones (§19, §29); complete and adversarially test the full erasure workflow before live PII exists (§19.2 D2); minimize on-graph fields to renderable-anonymous. |
```

- [ ] **Step 4: Verify**

Run: `grep -n "### 19.2 Post-M4 hardening\|EvidenceGraph integrity & erasure\|Provenance integrity is over-trusted\|Immutable provenance blocks" PRD.md`
Expected: four matches (§19.2 header, §33.1 row, two §34 rows).

- [ ] **Step 5: Commit**

```bash
git add PRD.md
git commit -m "docs: PRD add §19.2 post-M4 hardening gate + §33.1/§34 pre-live entries"
```

---

## Task 8: §21 — make the Passport's C2PA reference consistent with the demotion

**Files:**
- Modify: `PRD.md` (§21, the C2PA sentence)

- [ ] **Step 1: Replace the §21 C2PA sentence**

Edit — match this exact `old_string`:

```
W3C Verifiable Credentials carry issuer, subject, competency, evidence, validity, and status data. C2PA links public artifacts to provenance records.
```

Replace with:

```
W3C Verifiable Credentials carry issuer, subject, competency, evidence, validity, and status data. C2PA / Content Credentials optionally link *public* artifacts to provenance records for external viewers; it is an export convenience, not the integrity backbone (§19), and its known limitations (strippable manifests, no truth guarantee) are assumed. [SEC-01]
```

- [ ] **Step 2: Verify**

Run: `grep -n "export convenience, not the integrity backbone" PRD.md`
Expected: one match in §21.

- [ ] **Step 3: Commit**

```bash
git add PRD.md
git commit -m "docs: PRD §21 clarify C2PA is export-only, not the integrity backbone"
```

---

## Task 9: §24 — add evidence anchors for the new sources

**Files:**
- Modify: `PRD.md` (§24 evidence-anchor list)

- [ ] **Step 1: Insert new anchors after [SRC-10]**

Edit — match this exact `old_string`:

```
- **[SRC-10, G/ENG]** The [EPFL adversarial answer-extraction benchmark](https://arxiv.org/abs/2604.18660) and [OWASP LLM01](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) support defense-in-depth, jailbreak tests, and the rule that tutor output is never trusted as a mastery decision.

## 25. Architecture mandate
```

Replace with:

```
- **[SRC-10, G/ENG]** The [EPFL adversarial answer-extraction benchmark](https://arxiv.org/abs/2604.18660) and [OWASP LLM01](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) support defense-in-depth, jailbreak tests, and the rule that tutor output is never trusted as a mastery decision.
- **[STD-03, ENG]** W3C PROV Data Model (PROV-DM) Recommendation and Moreau, Missier et al. (EDBT 2013). Support adopting and extending PROV rather than inventing provenance semantics in Section 19.
- **[STD-04, ENG]** RO-Crate and the Workflow Run RO-Crate profile family (Leo et al., PLOS ONE 2024). Support the EvidencePacket serialization and the prospective/retrospective split in Section 19.
- **[STD-05, ENG]** SLSA v1.0 provenance-distribution guidance, the in-toto attestation format, and the Sigstore/Rekor transparency log. Support the in-toto plus transparency-log integrity backbone in Sections 19 and 19.2.
- **[SEC-01, E3]** Sherman et al. (UMBC / Hacker Factor / NSA), "Why the C2PA Specifications Fall Short" (2026 preprint, corroborated by the C2PA Security Considerations 1.0). Support demoting C2PA from integrity backbone to optional export in Sections 19 and 21.
- **[SRC-11, E3]** Comparative-judgment reliability and comparison-budget literature (e.g. Bramley & Vitello; Verhavert et al.). Support de-biased reliability reporting and comparison-budget validation in Sections 19 and 19.2.
- **[SEC-02, E2]** EDPB Guidelines 02/2025 on blockchain and personal data, and the cryptographic-erasure SoK (IACR ePrint 2026/1109). Support the erasure-by-crypto-shredding design in Sections 19 and 29.

## 25. Architecture mandate
```

- [ ] **Step 2: Verify anchor ids resolve**

Run: `grep -c "\[STD-03\|\[STD-04\|\[STD-05\|\[SEC-01\|\[SEC-02\|\[SRC-11" PRD.md`
Expected: each id appears at its §24 definition **and** at every use site introduced in Tasks 2–8. Then run:
`for id in STD-03 STD-04 STD-05 SEC-01 SEC-02 SRC-11; do echo -n "$id: "; grep -c "$id" PRD.md; done`
Expected: every count ≥ 1 (definition present); STD-04, STD-05, SEC-01, SRC-11 ≥ 2 (defined and cited).

- [ ] **Step 3: Commit**

```bash
git add PRD.md
git commit -m "docs: PRD §24 add PROV, RO-Crate, SLSA/in-toto, C2PA-security, ACJ, and erasure anchors"
```

---

## Task 10: §0 — add the v1.6 change-log entry

**Files:**
- Modify: `PRD.md` (§0 change log, above the v1.5 block)

- [ ] **Step 1: Insert the v1.6 entry**

Edit — match this exact `old_string`:

```
## 0. Change log

**v1.5 (2026-07-19) — phased Academic Mastery OS delivery (build on the partner engine first, in-house second).**
```

Replace with:

```
## 0. Change log

**v1.6 (2026-07-19) — EvidenceGraph provenance hardening (research-driven).** Applies a deep-research prior-art review of §19 (see `docs/superpowers/plans/2026-07-19-evidencegraph-prd-revision.md`). No new product scope; corrects the integrity architecture and defers the hard parts to a pre-live gate. Summary:

- **§19 integrity backbone.** The tamper-evidence layer is now content-addressed DAG (SHA-256/BLAKE3) + in-toto attestation + append-only transparency-log anchor (SLSA-style). **C2PA is demoted** from integrity mechanism to optional public-artifact *export* only (§19, §21), following an independent security analysis that C2PA does not achieve its claimed security goals and the spec's own statement that provenance certifies history, not truth. Added an explicit **anchor-conditional** integrity statement (content-addressing alone is not self-securing).
- **§19 formats.** EvidencePacket adopts the W3C PROV data model (extended, not reinvented) and the Workflow Run RO-Crate serialization, including the prospective vs. retrospective split mapped to `Transformation` and `Attempt`.
- **§19 erasure.** Reconciles append-only provenance with COPPA/FERPA erasure via encrypted off-graph payloads plus per-subject crypto-shredding (§29).
- **§19 evaluation.** Comparative-judgment reliability must be reported de-biased (all-play-all) with an evidence-based comparison budget; conformal-triggered review and model panels stay shadow-only until calibrated (§8.5).
- **§19.2 (new) — Post-M4 hardening.** The significant difficulties (external transparency log, full crypto-shred erasure workflow, comparative-judgment reliability program, conformal calibration) are built and validated **after the synthetic Month 4 beta and before any live child enrollment** (§3.4, §8.6, §32.4), tracked as pre-live gates in §33.1 and risks in §34.
- **§24 anchors.** Added PROV, RO-Crate, SLSA/in-toto/Rekor, the C2PA security analysis, comparative-judgment, and EDPB/crypto-shred sources.
- **Residual risk.** The assessment-validity and erasure-precedent leads are R/E3-class and not yet through GT100K's full verification bar; governance should commission a focused evidence review before signing the §19.2 gates.

**v1.5 (2026-07-19) — phased Academic Mastery OS delivery (build on the partner engine first, in-house second).**
```

- [ ] **Step 2: Update the header version pointer if present**

Run: `grep -n "PRD v1.5\|v1\.5\b\|version.*1\.5" PRD.md | head`
Expected: if a document-version header names v1.5, bump it to v1.6 in the same commit. If none, skip.

- [ ] **Step 3: Verify**

Run: `grep -n "v1.6 (2026-07-19) — EvidenceGraph provenance hardening" PRD.md`
Expected: one match, immediately under `## 0. Change log` and above the v1.5 entry.

- [ ] **Step 4: Commit**

```bash
git add PRD.md
git commit -m "docs: PRD §0 add v1.6 change log for EvidenceGraph provenance hardening"
```

---

## Task 11: Final consistency self-review

**Files:** none (verification only; fix inline if a check fails)

- [ ] **Step 1: No stray "C2PA as backbone" language remains**

Run: `grep -n "C2PA" PRD.md`
Expected: mentions only at §19 (export-only), §19.1 (verifies without C2PA), §21 (export convenience), §24 [STD-02] and [SEC-01]. No mention presents C2PA as an integrity/tamper mechanism.

- [ ] **Step 2: All new cross-references resolve**

Run: `grep -n "§19.2" PRD.md`
Expected: §19.2 is defined once (header) and referenced from §19 body, §33.1 row, and §34 rows.

- [ ] **Step 3: Section ordering intact**

Run: `grep -n "^### 19.1\|^### 19.2\|^## 20. Reality Gateway" PRD.md`
Expected: 19.1, then 19.2, then §20, in that order.

- [ ] **Step 4: Evidence ids all defined**

Run: `for id in STD-03 STD-04 STD-05 SEC-01 SEC-02 SRC-11; do grep -q "\*\*\[$id" PRD.md && echo "$id defined" || echo "$id MISSING DEFINITION"; done`
Expected: all six report "defined".

- [ ] **Step 5: Diff size within PR budget**

Run: `git diff --stat origin/main -- PRD.md`
Expected: well under ~400 changed lines. If over, split the PR (e.g. Tasks 2–6 in one PR, Tasks 7–10 in a follow-up).

- [ ] **Step 6: Open the PR**

```bash
git push -u origin dev/prd/evidencegraph-hardening
gh pr create --base main --title "docs: EvidenceGraph provenance hardening (PRD v1.6)" \
  --body "Applies deep-research prior-art findings to §19: in-toto + transparency-log integrity backbone, PROV/RO-Crate formats, crypto-shred erasure, ACJ reliability caveats, and a new §19.2 post-M4/pre-live hardening gate. Closes #<id>.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```
Expected: PR opens against `main`; CI (gitleaks) green; address the AI reviewer's comments.

---

## Self-Review (against the research findings)

- **Adopt-don't-invent prior art** (Merkle DAG, SLSA/in-toto/Rekor, PROV, RO-Crate) → Tasks 2, 9. ✅
- **Demote C2PA** → Tasks 2, 6, 8, 9 ([SEC-01]). ✅
- **Anchor-conditional integrity** (refuted intrinsic-immutability claims) → Task 3. ✅
- **Immutability vs. erasure** (crypto-shred, off-graph payloads) → Tasks 4, 7 (D2), 9 ([SEC-02]), §34. ✅
- **Comparative-judgment reliability + conformal shadow-only** → Tasks 5, 7 (D3/D4), 9 ([SRC-11]). ✅
- **"Significant difficulties → post-M4, before live students"** → Task 7 §19.2 (D1–D4), §33.1 pre-live gate, §34 risks; aligned to the PRD's synthetic-beta/live-enrollment boundary. ✅
- **Residual evidence gap acknowledged** (leads not through full verification) → §19.2 note + change-log residual risk. ✅

Placeholder scan: no "TBD"/"handle appropriately" — every step carries exact match/replace text and a concrete grep check. Type/anchor consistency: evidence ids (`STD-03..05`, `SEC-01/02`, `SRC-11`) are defined in Task 9 and used verbatim in Tasks 2–8; Task 11 Step 4 guards it.

## Optional follow-up (not in this plan)

The four §19.2 items rest partly on R/E3 leads that fell below the research run's verification budget. Before governance signs the §19.2 gates, dispatch a second focused deep-research pass on: (a) adaptive comparative-judgment validity/reliability and reviewer-capacity economics; (b) conformal prediction as a human-review trigger in high-stakes assessment; (c) verifiable-credential issuance/revocation for minors (Open Badges 3.0 / CLR / VC 2.0); (d) real-world crypto-shredding precedents for erasure over append-only logs. Fold results into §19.2 and upgrade the evidence labels.
