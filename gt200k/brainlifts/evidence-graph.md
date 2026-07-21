# Evidence Graph — Proving the Work Is the Student's Own

**Goal:** give a student who has cleared the floor (SAT 1570+, 5s on BC Calculus, Physics C, Literature, and Language) a way to *prove* that the spike they built — the differentiating project that actually gets them looked at — is genuinely theirs, in a world where AI, tutors, and parents can produce a finished artifact that says nothing about who authored it.

**One line summary:** You cannot prove authorship from the finished product; you can only prove it from the *process* plus a short conversation — so we build the process record and the conversation, and we refuse to build the accusation machine everyone else built.

**Thesis.** The floor is table stakes; the spike is the differentiator. But a spike is worthless as a signal the moment a reader cannot tell whether the student made it or bought it. The entire ed-tech and academic-integrity industry has answered this question the wrong way: it points a detector at the finished artifact and asks "is this AI?" That test does not work, it will never work, and every serious evaluation says so. We take the opposite stance. Authorship is not a property you can extract from a document — it is a property of a *history* and an *understanding*. So we record the history (a tamper-evident graph of every step, every dead end, every revision — "git for student projects") and we test the understanding (a short, sampled, in-person defense the student cannot fake). Provenance in our hands is a **shield the student raises**, never a **weapon the school aims**. We assemble mature building blocks that already exist in software supply-chain security and provenance standards, point them at children's project work for the first time, and spend our hardest engineering on the one part nobody has solved: letting a child erase their data without breaking the chain.

---

## DOK 1: Facts and definitions

The vocabulary the argument runs on. Each is a plain factual statement, not yet a position.

- **Provenance** — a tamper-evident record of an artifact's origin, history, edits, and the tools and agents involved. It attests "who signed, when, using what tool" — not "a human created this unaided."
- **Authorship verification** — establishing that a specific person genuinely produced a piece of work. The research consensus is that there is *no reliable technical test* that proves a child did or did not author work unaided.
- **Process / keystroke logging** — recording the drafting sequence (pastes, edits, keystrokes) so the process can be replayed. It is supporting evidence of process, not proof of authorship: it cannot identify *who* was typing or the *source* of pasted text.
- **Content addressing** — integrity by construction: any one-bit change to content changes its identifier and cascades through history (Git commits, IPFS CIDs, Merkle DAGs). Verification is O(log n) and needs no trusted third party.
- **DAG (directed acyclic graph)** — the shape of a project's real history: artifacts derive from attempts, attempts from prior artifacts, with branches and merges but no cycles. The Evidence Graph is a content-addressed DAG.
- **W3C PROV** — the interoperability standard for provenance (`Entity`, `Activity`, `Agent`). Modeling our node/edge taxonomy as a PROV extension means external tools can read the graph.
- **in-toto / SLSA** — in-toto is a signed-attestation format binding metadata to artifacts by cryptographic digest. SLSA is the supply-chain framework (build-provenance levels L0–L3) that popularized "publish a hash-of-attestation plus a transparency-log pointer."
- **Transparency log (Rekor / Trillian)** — an append-only, externally auditable ledger. Its tamper-evidence comes from outside monitors confirming entries are never mutated or removed — not from the log's own promise.
- **C2PA / Content Credentials** — the "Coalition for Content Provenance and Authenticity" standard: cryptographically signed provenance metadata bound to an asset by hash. Trivially strippable by re-encoding, screenshotting, or upload.
- **Durable Content Credentials** — C2PA's triad of signed metadata **+** invisible watermarking **+** fingerprinting, published "because none of these techniques is durable enough in isolation."
- **AI-text detector** — a classifier that outputs a probabilistic style signal (usually from perplexity). Not proof; biased; defeated by trivial edits.
- **Viva / oral defense / Interactive Oral Assessment (IOA)** — dialogic assessment where the student explains, modifies, or reconstructs their work. The strongest single authenticator of understanding, and the hardest to fake.
- **Crypto-shredding** — erasing data by destroying its per-subject encryption key. A recognized technique, but a *supplement* to erasure, not a complete guarantee — encrypted-but-retained data is still personal data.
- **Verifiable Credentials / Open Badges 3.0 / CLR** — issuer-signed, selectively disclosable claims (W3C VC 2.0); Open Badges 3.0 has an `Evidence` class linking learner artifacts; CLR 2.0 bundles many signed credentials into one learner-controlled record.
- **Adaptive comparative judgment (ACJ)** — scaling the grading of open-ended work by pairwise comparison. Reliability must be reported as the de-biased all-play-all coefficient, not the inflated adaptive figure.

---

## DOK 2: Source anchors

The facts above rest on a body of evidence. Grouped by the five claims that matter, with the numbers that make them load-bearing.

**(a) There is no reliable technical test for authorship, and AI detectors specifically do not work.**
- Weber-Wulff et al. (2023) tested 14 detectors across 754 cases: none exceeded 80% accuracy, only five cleared 70%, and accuracy collapsed under paraphrasing and machine translation [1].
- Krishna et al. (Google Research, NeurIPS 2023): a paraphraser dropped DetectGPT from 70.3% to **4.6%** accuracy at a fixed 1% false-positive rate, without changing meaning [2].
- Liang et al. (*Patterns*, 2023): seven GPT detectors misclassified non-native-English (TOEFL) essays as AI at an average **61.3%** false-positive rate while scoring US 8th-grade essays near-perfectly — detectors track *style*, not authorship [3].
- OpenAI shut down its **own** AI Text Classifier (Jan–July 2023) "due to its low rate of accuracy": at launch it caught only 26% of AI text while false-flagging human text 9% of the time, and stated it is "impossible to reliably detect all AI-written text" [22].
- Turnitin's "<1% false-positive" claim applies only to documents >20% AI; its sentence-level false-positive rate is ~4%. Turnitin itself says the tool "does not make a determination of misconduct" [23]. Vanderbilt **disabled** Turnitin's AI detector (Aug 16, 2023), noting its 1% rate implies ~750 wrongly-flagged papers/year at their volume [44].
- The harm reaches children: a 15-year-old in North Carolina was failed on detector scores alone [46]; false accusations disproportionately hit non-native, neurodivergent, and Black students [47]; short, formulaic, quotation-heavy writing — the profile of an 8–14-year-old — inflates false positives.

**(b) Cryptographic provenance proves integrity, key-control, and timing — never human authorship.**
- A digital signature "does not prove she wrote it… a valid signature chain over document hashes demonstrates commitment to each state, not that physical interaction produced those states" (proof-of-process proposal, arXiv 2510.04964) [9].
- SLSA's own spec disclaims content: "SLSA does not tell you whether the developers writing the source code followed secure coding practices" [29]. The "garbage-in-signed-garbage-out" problem is inherent — signing assumes the input was authentic at signing time.
- C2PA 2.4 "explicitly makes no judgment about whether provenance is 'true,' only that it is well-formed, untampered, and signed by a trusted party — and it does not attest human authorship" [25].

**(c) Watermarking is not a rescue — it is formally defeatable.**
- Zhang et al. (ICML 2024): "strong" watermarking of generative models is **impossible** under natural assumptions — a bounded attacker with black-box access can erase any watermark without significant quality loss [5].
- Google's SynthID-Text (Nature 2024), the first production-scale LLM text watermark, is conceded by its authors to be "not a panacea" [6]; ETH Zurich reports scrubbing success **above 90%** [7]. Hardening a watermark against removal makes it *easier to spoof* — the robustness–spoofing tradeoff [8].
- The load-bearing limit: "A missing Content Credential is not proof that a file is fake, human-made, or AI-made." Provenance "cannot prove unaided human authorship, cannot prove the absence of AI, and its absence proves nothing."

**(d) Oral / interactive defense is the one authenticator that survives AI — with real, stated limits.**
- Sotiriadou et al. (2020) and a 2025 bioscience replication: interactive oral assessment "demonstrated resilience to academic misconduct, including inappropriate use of Generative AI" [10].
- Dawson's two-lane model separates *secured* assessment (supervised, oral, timed — his two essentials are **authentication** and **control of circumstances**) from *open* assessment where AI is permitted [40]. TEQSA (2023): "trustworthy judgements about student learning require multiple, inclusive and contextualised approaches" — authenticate across *many* touchpoints, don't police one artifact [41].
- **Honest limits we own:** anxiety is the largest confound, inter-examiner reliability is hard, there are equity concerns for EAL students, scalability is the biggest barrier, and nearly all rigorous evidence is higher-ed and health-professions — **not** ages 8–14 [11].

**(e) The pieces exist; the integration and the delete button do not.**
- No existing product combines a tamper-evident, content-addressed learning-provenance DAG with attested AI-assistance lineage and learner-controlled erasure — "that specific integration appears novel," though every constituent layer is a mature, reusable building block.
- Reconciling an append-only chain with a child's right to erasure is genuinely unsolved: EDPB Guidelines 02/2025 state technical immutability "cannot be invoked to justify non-compliance," and crypto-shredding alone is insufficient [38]. Per GT100K's own PRD, verifiable deletion on an append-only store applied to child data is "the central unsolved problem — no off-the-shelf answer exists."

*Numbered anchors (verbatim):*

1. Weber-Wulff et al. (2023). Testing of detection tools for AI-generated text. *International Journal for Educational Integrity*. https://doi.org/10.1007/s40979-023-00146-z
2. Krishna et al. (2023). Paraphrasing evades AI-text detectors. Google Research, NeurIPS 2023. https://arxiv.org/pdf/2303.13408
3. Liang et al. (2023). GPT detectors are biased against non-native English writers. *Patterns*. https://www.cell.com/patterns/fulltext/S2666-3899(23)00130-7
4. AI-polished human text triggers false positives (GLTR). arXiv 2502.15666. https://arxiv.org/pdf/2502.15666
5. Zhang et al. (2023/2024). Watermarks in the sand: impossibility of strong watermarking. arXiv 2311.04378, ICML 2024. https://arxiv.org/abs/2311.04378
6. SynthID-Text, scalable watermarking for LLMs. *Nature* (2024). https://www.nature.com/articles/d41586-024-03418-x
7. ETH Zurich SRI Lab — probing SynthID (>90% scrub). https://www.sri.inf.ethz.ch/blog/probingsynthid ; SynGuard, arXiv 2508.20228
8. Watermark robustness–spoofing tradeoff. arXiv 2510.09263.
9. Proof-of-process; signatures do not prove authorship. arXiv 2510.04964. https://arxiv.org/pdf/2510.04964
10. Sotiriadou et al. (2020). Interactive oral assessment. *Studies in Higher Education*. https://doi.org/10.1080/03075079.2019.1582015
11. Nallaya et al. — limits of oral assessment. http://www.iier.org.au/iier34/nallaya.pdf
12. "Accused" study — student experience of process surveillance. arXiv 2308.16374. https://arxiv.org/pdf/2308.16374
20. W3C PROV-DM Recommendation; Moreau, Missier et al. (EDBT 2013).
21. Sherman et al. — "Why the C2PA Specifications Fall Short" (2026 preprint; corroborated by C2PA Security Considerations 1.0).
22. OpenAI AI Text Classifier launch and shutdown. https://openai.com/index/new-ai-classifier-for-indicating-ai-written-text/
23. Turnitin false-positive disclosures. https://www.turnitin.com/blog/understanding-the-false-positive-rate-for-sentences-of-our-ai-writing-detection-capability
25. C2PA Specification 2.4 (AI/ML). https://spec.c2pa.org/specifications/specifications/2.4/ai-ml/ai_ml.html
26. Content Authenticity Initiative — Durable Content Credentials. https://contentauthenticity.org/blog/durable-content-credentials
28. in-toto attestation spec. https://github.com/in-toto/attestation
29. SLSA v1.0 (levels / about). https://slsa.dev/spec/v1.0/about
30. Sigstore (Cosign / Rekor). https://docs.sigstore.dev/logging/overview/
31. RFC 3161 trusted timestamping. https://datatracker.ietf.org/doc/html/rfc3161
33. Grammarly Authorship. https://www.grammarly.com/authorship
34. Open Badges 3.0 (1EdTech). https://www.imsglobal.org/spec/ob/v3p0
37. W3C Verifiable Credentials Data Model 2.0. https://www.w3.org/TR/vc-data-model-2.0/
38. EDPB Guidelines 02/2025 on blockchain and personal data. https://www.edpb.europa.eu/our-work-tools/documents/public-consultations/2025/guidelines-022025-processing-personal-data_en
40. Phillip Dawson — the two-lane model. https://philldawson.com/
41. TEQSA — Assessment reform for the age of AI (2023). https://www.teqsa.gov.au/guides-resources/resources/corporate-publications/assessment-reform-age-artificial-intelligence
44. Vanderbilt — disabling Turnitin's AI detector (2023). https://www.vanderbilt.edu/brightspace/2023/08/16/guidance-on-ai-detection-and-why-were-disabling-turnitins-ai-detector/

---

## DOK 3: How the pieces compose

The facts and evidence chain into one machine with a single governing rule: **provenance is positive evidence a student offers, never an accusatory test a school runs.** Everything else follows.

1. **The graph records the process.** Every project produces a content-addressed DAG — `Artifact`, `Attempt`, `Transformation`, `Claim`, `Assistance`, `Review`, `Contribution`, `Outcome` nodes, joined by `derived_from`, `authored_by`, `used_tool`, `validates`, `contradicts`, `released_as` edges — modeled as a W3C PROV extension so it is not a bespoke silo. This is the "git for student projects" the gospel names: the dead ends, the revisions, the moment the idea changed, all replayable.

2. **AI help is attested, not hidden.** The design does not pretend a student works without AI. Each AI-tool invocation that touches the work emits a signed in-toto attestation bound to the artifact by its digest. Declared collaboration becomes *cryptographically verifiable* rather than a trust-me log line — a materially stronger guarantee than version-history replay, and the honest alternative to a detector that guesses.

3. **Integrity is anchor-conditional.** The DAG is tamper-*evident* only relative to a Merkle root committed to a separate trust domain (an externally-monitored transparency log, Rekor/Trillian) and the collision resistance of the hash. Content-addressing alone proves nothing if you also control the store — so the *anchor*, not the graph, is the security boundary. SHA-1 and MD5 are banned.

4. **Understanding is tested by conversation.** Because no artifact and no signature can prove a human understood the work, a *sampled live defense* asks the student to explain a decision, modify a component, or reconstruct a step — logged back into the graph. This is the verification-by-understanding the gospel left open; the evidence says it is the only thing that survives AI, and an intensive in-person academy is uniquely built to have that five-minute conversation. Reflections and audio explanations are first-class `Attempt`/`Review` evidence on the same footing.

5. **Humans own every judgment.** Deterministic checks (builds, tests, verifier output) may be automated. Every final grade and every non-deterministic judgment carries a named human owner. Model output is admissible only as cited supporting evidence — a suggestion, a comparison, a flag — never the grade itself. Discontinuity in a graph is a *sampling signal* to go ask a question, never proof of misconduct.

6. **Erasure without breaking the chain.** On-graph fields are minimized and anonymizable by design; artifact and personal payloads live encrypted off-graph under a per-subject key; crypto-shredding that key leaves a tombstone so the payload is unrecoverable while the DAG's hashes and inclusion proofs stay valid. We treat this as a *supplement* paired with on-graph anonymization and off-graph erasure — never a standalone claim — because this is the unsolved part and we will not oversell it.

---

## DOK 4: The spiky points of view

Each is false to current consensus and true anyway.

### SPOV 1 — An AI-detection score must never touch a child

The industry's front-line integrity control is a detector aimed at the finished artifact, and schools act on its number. That number is noise. Fourteen detectors are "neither accurate nor reliable" (Weber-Wulff 2023); a paraphrase drops the best of them to 4.6% (Krishna 2023); they false-flag non-native English at 61.3% (Liang 2023); OpenAI killed its own for 26% accuracy; Vanderbilt turned Turnitin's off. A 1% error rate still means hundreds of wrongly-accused children per school per year, and the children wrongly accused are disproportionately non-native, neurodivergent, and Black. We do not run a detector against a student, ever. Provenance is a shield the student raises, not a weapon we aim.
**Consensus it breaks:** AI/plagiarism detection is treated as the responsible default.
**Backing:** Weber-Wulff et al. (2023); Krishna et al. (2023); Liang et al. (2023); OpenAI classifier shutdown; Vanderbilt (2023).

### SPOV 2 — Cryptography proves everything about a file except the one thing everyone wants

Content credentials, watermarks, and signatures are sold as authenticity guarantees. They are not. A signature proves key-control and integrity, "not that physical interaction produced those states" (arXiv 2510.04964). C2PA "does not attest human authorship" by its own spec. Strong watermarking is *formally impossible* (Zhang, ICML 2024) and SynthID scrubs at >90%. So we refuse to let any of them be the truth layer: C2PA is export-only, watermarks are a public-artifact convenience, and the actual authorship claim rests on process history plus a human conversation.
**Consensus it breaks:** provenance tech is marketed as proof of authenticity.
**Backing:** arXiv 2510.04964; C2PA 2.4 AI/ML spec; Zhang et al. (2024); SynthID evaluations.

### SPOV 3 — The only real proof a child understands their work is a five-minute conversation, and that is a feature, not a limitation

Everyone treats authorship as a document-forensics problem to be solved in software. It is not solvable in software — it is solvable in dialogue. Interactive orals are "resilient to academic misconduct, including inappropriate use of Generative AI" (Sotiriadou 2020; 2025 replication). Dawson's two essentials are authentication and control of circumstances — both of which an in-person academy already owns. The thing our competitors treat as an unscalable cost, we treat as our structural advantage: we are already in the room. (We state the caveat plainly: oral-assessment evidence is largely higher-ed, and its use for ages 8–14 is under-studied — so we sample, we design against anxiety, and we never let one defense stand alone.)
**Consensus it breaks:** authorship verification is framed as a software/forensics problem.
**Backing:** Sotiriadou et al. (2020); Dawson two-lane model; TEQSA (2023).

### SPOV 4 — "Git for student work" is not a technology problem; the hard part is the delete button

The verifiable-credential and blockchain startups act as if immutability is the innovation. It isn't — content-addressed DAGs, in-toto, and transparency logs are mature and reusable. The genuinely unsolved problem is the opposite of immutability: letting a child erase their data on demand without invalidating the chain everyone else relied on. EDPB says immutability "cannot be invoked to justify non-compliance"; crypto-shredding alone is not enough. We are staking the product on solving the delete button, not the append.
**Consensus it breaks:** immutability/blockchain is sold as the breakthrough.
**Backing:** EDPB Guidelines 02/2025; the crypto-erasure state-of-the-art; the novelty-of-integration finding.

### SPOV 5 — Surveilling every keystroke to prove honesty teaches a child they are a suspect

Keystroke logging, screen recording, and Draftback-style replay are promoted as integrity best practice. They invert the relationship: the student becomes the accused, and the default posture is distrust. The MLA-CCCC task force critiqued exactly this; students in the "Accused" study conceded self-surveillance "verge[s] on privacy invasion and should not be necessary." We collect coarse semantic transitions ("revised the filter after measurement"), not raw keystrokes or screen video, and the record exists to let a student *demonstrate* their work, not to catch them. Trust is the product; suspicion is the anti-product.
**Consensus it breaks:** process surveillance is treated as rigor.
**Backing:** MLA-CCCC task force; "Accused" study (arXiv 2308.16374); child-data norms (UNESCO 2023; UK Children's Code).

### SPOV 6 — The graph is only as trustworthy as the anchor outside it

"Immutable" and "content-addressed" are marketed as tamper-*proof*. They are only tamper-*evident*, and only relative to something you don't control. A party who owns the object store can recompute an internally consistent DAG. So the security boundary is the externally-monitored Merkle-root anchor, not the graph — the SLSA hash-of-attestation-plus-log-pointer pattern. We build the monitored anchor first and treat "content-addressing = trust" as the marketing lie it is.
**Consensus it breaks:** content-addressing is equated with tamper-proofness.
**Backing:** SLSA/in-toto/Sigstore-Rekor pattern; the "garbage-in-signed-garbage-out" problem; GT100K PRD "integrity is anchor-conditional."

---

## People we read, and why

- **Debora Weber-Wulff** (HTW Berlin). Ran the 14-detector evaluation that is the empirical spine of SPOV 1: detection tools are "neither accurate nor reliable."
- **Weixin Liang & the Stanford group** (*Patterns*, 2023). The bias finding — 61.3% false positives on non-native English — that makes SPOV 1 a fairness argument, not just an accuracy one.
- **Kalpesh Krishna et al.** (Google Research). Showed a paraphrase collapses detection to near-chance; the reason we never build on detection.
- **Phillip Dawson** (Deakin). The two-lane model — authentication and control of circumstances — and the intellectual foundation for SPOV 3.
- **Cassandra Sotiriadou et al.** The interactive-oral-assessment evidence base showing dialogue resists GenAI misconduct.
- **The C2PA / Content Authenticity Initiative and its critics** (incl. Sherman et al.). We adopt their formats and reject their truth claims — the source of SPOV 2 and the export-only demotion.
- **The in-toto / SLSA / Sigstore communities.** The supply-chain provenance machinery we repurpose for learning artifacts, and the anchor-conditional posture of SPOV 6.
- **The EDPB** (Guidelines 02/2025). The reason the delete button (SPOV 4) is the real problem.

---

## Build plan (broad strokes)

Ordered so the first thing we build is the smallest thing that produces real trust, and the hardest problems gate *live child data*, not the prototype.

1. **The graph, on standards.** A content-addressed evidence DAG modeled as a W3C PROV extension, serialized per milestone as a Workflow Run RO-Crate packet (prospective plan vs. retrospective run). Hash with SHA-256/BLAKE3; ban SHA-1/MD5. *This is "git for student projects" — the core.*
2. **The anchor.** Per-milestone Merkle roots attested with in-toto. Start with a simple KMS-signed internal notarization; before any live child, move to an externally-verifiable, monitored transparency log (Trillian/Rekor-class) with inclusion and consistency proofs. *SPOV 6 lives here.*
3. **Attested AI assistance.** A named GT100K assistance predicate; every AI touch emits a signed attestation bound to the artifact digest; `Assistance` nodes and help-receipts verify or fail. *Declared help, cryptographically, instead of guessed help, statistically.*
4. **Verification-by-understanding.** A sampled live-defense flow: the student explains a decision, modifies a component, or reconstructs a step; reflections and audio explanations captured as first-class evidence and logged into the graph. Designed against anxiety, never standing alone, human-owned. *The open question from the gospel, answered by SPOV 3.*
5. **Human-owned evaluation.** Deterministic checks automated; every grade and non-deterministic judgment carries a named human owner; model panels and comparative judgment run shadow-only until calibrated. Discontinuity routes to a question, never an accusation.
6. **The delete button (pre-live gate).** The EDPB three-part erasure workflow — on-graph anonymization by design, encrypted off-graph payloads under per-subject keys, crypto-shredding with a keyref tombstone — plus adversarial verifiable-deletion testing and a formal argument that erasure leaves the DAG verifiable. *SPOV 4: the thing we are actually staking the product on.*
7. **Export, last.** Optional C2PA Durable Content Credentials (signed metadata + watermark + fingerprint) and Open Badges 3.0 / Verifiable Credentials for a portable, selectively-disclosable record — an export convenience, never the integrity layer.

**Our perspective, and what we still don't know.** We are confident the shape is right: record the process, attest the help, anchor the integrity outside the store, and prove understanding in conversation — never accuse. The three things we will not pretend to have solved are (1) verifiable deletion on an append-only store for child data — genuinely unsolved, and our hardest gate; (2) how children ages 6–14 actually understand and feel about an authorship-and-AI-help record — almost no direct evidence exists, so this needs its own study before scale; and (3) comparative judgment as a scaled outcome layer — no verified evidence base yet, so it stays shadow-only until proven. We would rather ship a smaller honest claim than a larger false one.
