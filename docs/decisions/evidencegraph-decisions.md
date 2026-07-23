# EvidenceGraph — Architecture & Student-Experience Decision Register

**Status:** Draft — awaiting operator decisions · Owner: (you) · Created 2026-07-23
**Purpose:** Lock the open decisions before we build the EvidenceGraph beyond the current synthetic example. Two tracks: **(A–B) how students actually produce and capture evidence**, and **(C–G) how we make the architecture robust and shippable for live child data.**
**Grounding:** PRD §19 / §19.1 / §19.2 (D1–D6 gates); the two hardening docs (`docs/prd/hardening/evidencegraph-productionization.md` + `docs/research/passion-pipeline/hardening/08-*.md`); the shipped MVP (`passion/packages/evidence-graph`, adapters, `evidence-explorer` app); `GOVERNANCE.md` G7/G9.

---

## How to use this doc

Each decision has: **why it matters**, **options** (with trade-offs), a **recommendation** (my default — delete if you disagree), and a **`Decision:`** blank for you.

- Fill the `Decision:` line. One word / letter is fine (`Decision: B`).
- Add a `Note:` line under any decision if you want to say *why* or add a constraint.
- Mark anything out of scope with `Decision: N/A (defer)`.
- Sections are ordered by how much they're currently *un*specified — **Section A (student experience) is the biggest gap and the most important to get right**, so it's first.

When the blanks are filled, I'll turn this into (1) an updated PRD §19 + a productionization plan, and (2) a spec for the first non-synthetic build.

---

# Track 1 — How students do it

*The repo has a rich provenance data model but almost nothing on the lived student workflow. These decisions define the product.*

## A. The student's loop

### A1. What is the unit of work an EvidencePacket wraps?
**Why it matters:** everything downstream (capture cadence, grading, the graph shape) keys off this. PRD calls it a "milestone"; proposals call it a "masterpiece"/"spike."
- **A)** One big multi-week **masterpiece/spike** (few packets per year, each large).
- **B)** Many small **milestones** within a project (frequent packets, fine-grained).
- **C)** Hybrid — milestones roll up into a masterpiece packet at project end.

Recommendation: **C** — matches PRD's per-milestone packets + the "durable spine" masterpiece goal.

Lets do away with the idea of packets, and just have graphs per project (one graph per project no matter how big or small)

### A2. How does a project START?
**Why it matters:** determines the hand-off from interest-lab and how self-directed the child is.
- **A)** Child picks freely (fully self-directed).
- **B)** Child picks from a **curated catalog** of project templates per interest.
- **C)** Handed off from **interest-lab** (the interest signal proposes projects).
- **D)** Assigned by a mentor/parent.

Recommendation: **C→B** — interest-lab proposes, child chooses from a shortlist.

`Decision: ____` Not directly relevant to how evidence graph works (as this is just the infrastructure to record projects)
`Note: ____`

### A3. Where does the child actually DO the work?
**Why it matters:** this is the single biggest driver of how hard evidence capture is. Capturing provenance from tools we control is easy; from arbitrary external tools is very hard.
- **A)** Inside a **GT100K-hosted sandboxed environment** (web IDE / creative tools we instrument).
- **B)** **Bring-your-own tools** (their laptop, GitHub, Figma, a notebook) + upload/connect.
- **C)** Hybrid — hosted environment for most domains, connectors for a few external tools.

Recommendation: **A for v1** (instrumented environment) — it's the only way to get trustworthy automatic provenance early; add connectors later.

`Decision: ____` It depends on the field the project is in (an art project is hands on and you would need to upload.). Lets have connectors for a hosted environment as well as upload.
`Note: ____`

### A4. What project domains does v1 support?
**Why it matters:** scopes the tools we build/instrument. The cabins already prototyped Music, Code, Art.
- **A)** One domain only (pick: ____).
- **B)** The three cabin domains: **Code, Music, Art**.
- **C)** Open-ended (any domain, generic artifact upload).

Recommendation: **A or B** — start narrow enough to instrument capture well.

`Decision: ____`
`Note (which domain[s]): ____` Ideally C, but for our MVP we can make it code facing , whcih is the easiest to prototype

### A5. Target age band for the first build
**Why it matters:** drives UX complexity, reading level, consent/legal regime (under-13 = COPPA), and the research findings on rewards/anxiety.
- **A)** 7–9 · **B)** 10–12 · **C)** 13–15 · **D)** wide (7–15 with adaptation)

Recommendation: pick **one narrow band** for v1; the research warns against one-size-fits-all.

`Decision: ____` Lets aim at 10-12, our final aim is to make it usable for students as young as possible ( as well as having more complex options for older students)
`Note: ____`

### A6. Project cadence & duration (v1 assumption)
- Typical project length: `____` (e.g., 2 weeks / 6 weeks / a term) Doesnt matter
- Expected sessions/week: `____` Doesnt matter
- Packets per project: `N/A`

`Decision: ____`

## B. Evidence capture & the human defense

### B1. How is evidence captured?
**Why it matters:** trustworthiness of the whole graph. The digest-trap rule (never hash plaintext PII) applies whatever we pick.
- **A)** **Automatic instrumentation** of the hosted tools (every save/attempt/tool-call emits a node).
- **B)** **Manual** — child/mentor uploads artifacts and annotates.
- **C)** Hybrid — automatic for process, manual for reflections/claims.

Recommendation: **C** — automatic process capture + a few deliberate human-authored `Claim`/reflection nodes.

`Decision: ____` C, for example, drafts could be captured every hour, as well as tool calls, or running tests automatically. However, reflectiosn, pictures, or pother physical artifacts have to be manual 
`Note: ____`

### B2. How is AI assistance captured at the moment of use?
**Why it matters:** PRD requires AI assistance be *attested, not just logged* — a signed record bound to the artifact. Only works if AI use flows through us.
- **A)** All AI help goes through a **GT100K-mediated AI tutor/tools** → we emit the `Assistance` node + attestation automatically.
- **B)** Child **self-declares** external AI use (honor system + spot checks).
- **C)** Both — mediated by default, self-declare for anything outside.

Recommendation: **A for v1** (mediated AI only inside the sandbox) — makes attestation real.

`Decision: ____` Lets leave that as self declared for now, but leaving the connection to be done automatically, to simplify v1
`Note: ____`

### B3. The human defense — when & how does a student defend the work?
**Why it matters:** this is the load-bearing claim of the whole product ("prove they own it and can defend it"). Currently undefined.
- Format: **A)** live oral defense (video call) · **B)** recorded async video answering prompts · **C)** live text/Socratic session (extends passion-tutor) · **D)** in-person
- Who evaluates: **A)** trained human reviewers · **B)** mentors/teachers · **C)** parents · **D)** panel
- When: **A)** per milestone · **B)** at masterpiece completion only · **C)** randomly sampled

Recommendation: async recorded (B) per masterpiece + Socratic text checks per milestone (extends passion-tutor); trained human reviewers own the verdict.

`Decision (format): D`
`Decision (evaluator): Mentors/guides`
`Decision (when): periodically through project`
`Note: ____` However, this is external to the core product, (we just need an option to be like add reflection/interview)

### B4. What does the child SEE — during vs. after?
**Why it matters:** the research is emphatic — completion badges/leaderboards can crowd out intrinsic motivation and raise anxiety. The Observatory today is an end-state view.
- **A)** Child sees the evidence graph **live as they build** (process-visible).
- **B)** Child sees it **only at review/defense time**.
- **C)** Child sees a **simplified progress view** live; full graph at the end.
- Motivation framing: confirm **no leaderboards, no competitive/urgency framing, no completion-badge economy** (per research + the view-model guardrails). `Confirm: yes / change → ____`

Recommendation: **C** with the no-competition guardrail kept.

`Decision (visibility): A` No competition for this, the graph is just a record of the project, but they can see it whenever (not secret). Also doenst really matter for the core product.
`Note: ____`

### B5. Teams & contribution attribution
**Why it matters:** the model has `Contribution` nodes + `ContributionAttestation` with a dispute path, but no workflow.
- **A)** v1 is **solo projects only** (defer teams).
- **B)** Teams supported; each member's contribution attested with a dispute path.

Recommendation: **A for v1** — solo first; teams are a later gate.

`Decision: A` However, if an external research paper is used or my frined helped me build this, add an option to add node that is helped by x person
`Note: ____`

### B6. Consent & parental controls flow (v1)
**Why it matters:** COPPA/UK Children's Code require parental review + deletion. Needs a real UX, not just backend.
- Parental consent at signup: `required / ____`
- Parent can review all child data: `yes / ____`
- Parent can request deletion in-product (triggers the erasure workflow, §D): `yes / ____`
- AI-assistance disclosure shown to parent: `yes / ____`

`Decision: ____` Parents can see graph whenever, same as students. For v1, the prodcut main idea is more important than these small details about overview, we just want to get a graph workflow working (well work on all these privacy things later (well before release))
`Note: ____`

---

# Track 2 — Architecture robustness

*From the D1–D6 hardening gates + the three-layer erasure design. Most of these have a strong recommended default already argued in the hardening docs — you're mostly confirming or overriding.*

## C. Core integrity & storage

### C1. The erasure-safe three-layer model (the foundational decision)
**Why it matters:** it's the prerequisite for everything else (you can't anchor externally until this is settled). Hardening docs recommend: **L0** immutable DAG holds only ciphertext digests + pseudonymous refs; **L1** off-graph per-child-encrypted payloads; **L2** deletable identity map.
- **A)** Adopt the three-layer model as specified.
- **B)** Adopt with modifications: ____.
- **C)** Different approach: ____.

Recommendation: **A** — it's the EDPB-recommended posture and the only one that reconciles append-only with child erasure.

`Decision: ____` Unsure, lets look into this more
`Note: ____`

### C2. Enforce the "digest trap" invariant in code from day one?
**Why it matters:** a single hash of plaintext PII onto L0 is permanently un-erasable. Fix: `EvidenceNode.payload` carries only `{ciphertextRef, ciphertextDigest, keyRef}`, enforced by the type system + a CI guardrail test.
- **A)** Yes — type-harden `payload` + add guardrail test before any live data.
- **B)** No / later.

Recommendation: **A** (non-negotiable per the hardening analysis).

`Decision: ____` Unsure, (if something needs to be deleted can we just delte the whole graph and be done?)

### C3. Hash algorithm for content-addressing
**Why it matters:** PRD mentions both SHA-256 and BLAKE3; the MVP uses SHA-256; RFC-6962 Merkle uses SHA-256.
- **A)** SHA-256 everywhere (matches MVP + CT/Rekor ecosystem).
- **B)** BLAKE3 for content, SHA-256 for Merkle/interop.

Recommendation: **A** — one algorithm, ecosystem-compatible; revisit only for perf.

`Decision: ____` sha256 is fine

### C4. Merkle leaf ordering (interop caveat)
**Why it matters:** the MVP **sorts leaves by digest** for order-independence, but RFC-6962 preserves *input order*. An off-the-shelf verifier recomputing our per-packet root must be told we sort.
- **A)** Keep digest-sorted leaves; document the deviation for verifiers.
- **B)** Switch to RFC-6962 input-order for drop-in verifier compatibility.

Recommendation: **B** if we want zero-friction external verification; **A** if order-independence matters more. (Leaning B.)

`Decision: ____` Can we order by time stamp (which is B i guess)
`Note: ____`

### C5. Transparency-log anchoring (D1) — which log?
**Why it matters:** anchoring child-linked roots into a *public, mirrored* log is irreversible; if the digest trap is ever violated, PII becomes un-erasable in a third party.
- **A)** Public-good **Rekor** (max external trust, least control).
- **B)** **GT100K-operated Tessera** log (externally verifiable, we control witnesses/retention).
- **C)** Internal KMS-notarization only for v1; external log post-gate.

Recommendation: **C now → B for production** (per the hardening doc's risk analysis — never anchor externally until C1/C2 pass).

`Decision: ____` Right now its chill, we can have a internal log since there are no children, we can defer this for later versions
`Note: ____`

### C6. Attestation signing (D6)
**Why it matters:** the MVP emits an **unsigned** in-toto Statement; production needs a signature.
- **A)** **Sigstore keyless** (Fulcio short-lived certs + OIDC).
- **B)** **KMS-backed signing keys** (we manage the hierarchy + rotation).
- **C)** Both / configurable.

Recommendation: **B** for child-data control; Sigstore optional for public exports.

`Decision: ____` (unsure, can we look mre into this)

## D. Erasure & key management

### D1. Key granularity
**Why it matters:** per-child KEK lets us shred one child without orphaning others; per-group couples erasability.
- **A)** **One KEK per child** (+ optional per-project sub-keys under it).
- **B)** Per-group / per-cohort keys.

Recommendation: **A** (matches GOVERNANCE G7 + NIST-88 CE requirements).

`Decision: ____` A

### D2. KMS / HSM provider
**Why it matters:** crypto-shred only counts as NIST-88 Cryptographic Erase if the module is FIPS 140-validated and *all* key copies die.
- **A)** AWS KMS (7–30d destruction window) · **B)** GCP Cloud KMS · **C)** Azure Key Vault · **D)** other: ____

`Decision: ____`
`Note (region / data residency): ____` Worry about it after v1

### D3. Retention policy (COPPA 2025 requires a written one)
- Default retention for a completed project's L1 payload: `____`
- Max retention before mandatory review: `____`
- Erasure-request SLA ("without undue delay" target): `____`

`Decision: ____` worry aafter v1

### D4. Safeguarding legal-hold carve-out (GOVERNANCE G9)
**Why it matters:** safeguarding-zone records must be exempt from routine crypto-shred and firewalled; erasure must consult a legal-hold resolver first.
- **A)** Implement the legal-hold resolver + separate key hierarchy in v1.
- **B)** Defer (accept that v1 has no safeguarding data).

Recommendation: depends on whether v1 collects any safeguarding-relevant data. If unsure → **A**.

`Decision: ____`
`Note: ____` worry after v1

## E. Assessment & human authority

### E1. Human-authority invariant — confirm
**Why it matters:** PRD is absolute: every final grade/non-deterministic judgment has a **named human owner**; a model output is only a cited `Assistance`/`Review` node, never a grade or authorship accusation.
- **A)** Confirm and keep as an enforced invariant.
- **B)** Change: ____.

Recommendation: **A**. 

`Decision: ____`A

### E2. Who are the human reviewers, and at what scale?
**Why it matters:** ACJ needs ~30–40 comparisons/artifact; reviewer supply may not exist at 100k scale.
- Reviewer pool: **A)** trained GT100K reviewers · **B)** teachers/mentors · **C)** trained parents · **D)** mix
- v1 assumption for pilot scale: `____` students, `____` reviewers

`Decision: ____` not needed for v1
`Note: ____`

### E3. Do model panels / conformal calibration (D3/D4) run in v1?
**Why it matters:** PRD pins them **shadow-only** until calibrated — they never set a live grade.
- **A)** Build them shadow-only in v1 (data collection for calibration).
- **B)** Defer entirely; humans-only grading in v1.

Recommendation: **B for the first pilot** (humans only), **A** once there's enough human-graded data.

`Decision: ____` B for v1 (again kind of outside core evidence graph funtionality)

## F. Stack, infra & deployment

### F1. Service language(s)
**Why it matters:** PRD §22 names **Go** services; the shipped MVP is **TypeScript**. Need to reconcile.
- **A)** Keep the domain core in **TypeScript**; build production services in TS too.
- **B)** Reimplement/port hot paths to **Go** per PRD §22.
- **C)** TS domain + Go for the crypto/anchoring/erasure services.

Recommendation: **A for v1** (leverage the tested TS core), revisit per-service later.

`Decision: ____` whatever is easier to build (ts for mvp)
`Note: ____`

### F2. Cloud provider & region
- Provider: `AWS / GCP / Azure / ____` AWS
- Region (child-data residency matters): `____` unsure, not critical for v1

`Decision: ____`

### F3. Datastores
- L0 (immutable DAG): `____` (e.g., append-only Postgres table / ledger DB)
- L1 (encrypted payloads): `____` (e.g., S3 + envelope encryption)
- L2 (identity/index): `____`

`Decision: ____` unsure lets discuss more
`Note: ____`

### F4. Client-facing app for v1
**Why it matters:** the Observatory 3D view is impressive but you flagged it's "not that user-friendly."
- **A)** Keep the 3D Observatory as the primary view.
- **B)** Build a **simpler child-facing UI** for building/capture; keep the Observatory as a reviewer/showcase view.
- **C)** Both, tiered by role (child vs reviewer vs parent).

Recommendation: **C** — child gets a friendly build UI, reviewers/parents get the graph.

`Decision: ____` keep the graphics of 3d obervstory, and a frinedly ui fro kids, but the ways we interact with the graph and review it are unclear in the graph we have rn
`Note: ____`

## G. Scope & phasing

### G1. What is the goal of the first non-synthetic build?
- **A)** Internal alpha with **fake-but-realistic** student data (no live children).
- **B)** Closed pilot with **real children** (requires D2 erasure gate passed first).
- **C)** Something else: ____.

Recommendation: **A first** (proves capture + graph + defense end-to-end with no legal exposure), then **B** once the erasure gate passes. 

`Decision: ____` A, and show how eviednce graph works independent of gt, but as a product of its own, and also how well include it into our gt and gtacceleration and gt100k program

### G2. Which gates MUST pass before any live child data?
The hardening doc says **D2 (verifiable erasure) is the hard pre-live gate**, and D1 external anchoring must come *after* D2.
- Confirm the gate order: **D2-design → D6+D1-beta → D1-prod → D2-prod (pre-live gate) → D3/D4 shadow → D5**? `Confirm / change → ____` 

`Decision: ____` doesnt matter rn, thats kind of far, well decide later

### G3. Pilot parameters (fill once G1/A5 are set)
- Number of students: `____`
- Age band: `____` (from A5)
- Domain(s): `____` (from A4)
- Duration: `____`
- Success criteria for the pilot: `____` doesnt matter for v1

`Decision: ____`

---

## Open questions back to me (anything unclear or missing)

- `____`
- `____`

## Once filled, next steps

1. I fold decisions into a new doc just detailing evidence graph and we discuss whats missing
2. I write a **spec for the first build** (Track 1 workflow ).
3. We build behind the normal PR/review gate.
