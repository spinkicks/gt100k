# cursorProposal3.md
## Non-Core Architectural Levers for GT-100k
### 7 Portfolio-Defining Engineering Projects (+1 Wildcard) for a 4-Month Sprint

**Author role:** Systems Architect / AI Product Manager
**Scope:** The morning adaptive-curriculum tutor is *solved*. This document proposes the **non-core, infrastructure-level machinery** that makes the model work at a population of 100,000 — the levers the Brainlift argues are the *actual* binding constraints: **family fidelity, cognitive floor, peer composition, latent drive, and engineered friction.**

Every proposal is (a) grounded in a verified deep-research pass (110 research agents, 27 primary sources fetched, 25 falsifiable claims adversarially triple-voted, 22 confirmed / 3 refuted), (b) mapped to a specific numbered stack from the *Engineering Skills & End-to-End Project Matrix* (`impactful.md`), and (c) argued as an elite portfolio piece. It is built around the five spiky positions of the Brainlift (`gtBrainlift.md`).

> **Honest framing (read this first).** The verified evidence maps cleanly onto three levers (Intake attrition, Passion/Motivation bandits, Cohort formation). Two areas — the **AlphaX/Masterpiece infrastructure** and **Elo/TrueSkill rivalry** engineering — returned *no surviving verified claim*; the supporting papers were *found* but not adversarially confirmed in this pass. That makes them research frontiers, which is precisely why building them is a standout move rather than a re-implementation. The dominant caveat across the whole corpus is **domain transfer**: nearly all attrition/engagement evidence comes from *adult, self-selected MOOC learners* (XuetangX, CAROL, OULAD, HarvardX), not K-8 children or their families, on class-imbalanced data — so headline accuracy figures (94%/98%) are base-rate-inflated. Treat the *mechanisms* as transferable and the *numbers* as targets to be re-earned on our own population. Each proposal carries its own caveat block.

---

## The Levers → Projects Map

| # | Project | Lever | Primary Matrix Stack |
|---|---------|-------|----------------------|
| 1 | **Fidelity Survival Engine** | Admissions: family commitment (SPOV 1) | #4 gRPC/Kafka, #5 MLOps, #6 PyTorch |
| 2 | **Floor CAT + Tamper-Proof Testing Runtime** | Admissions: cognitive floor (SPOV 2) | #12 WASM, #6 PyTorch, #1 SQL |
| 3 | **Latent-Drive Cartographer** | Passion discovery (SPOV 4) | #6/#7 ML, #9 agentic |
| 4 | **Flow/Burnout Sentinel + Friction Governor** | Motivation without extinguishing it (SPOV 5) | #12 WASM (on-device), #4 gRPC, #6 PyTorch |
| 5 | **Cohort Orchestration Engine (Homogeneous Pods + Pace-Rating)** | Peer composition (SPOV 3) | #1 SQL, #4 Kafka, #5 K8s, ILP/Gurobi |
| 6 | **AlphaX Socratic Scaffolding Mesh** | Masterpiece build support | #9 LangGraph, #10 MCP, #11 adversarial |
| 7 | **Masterpiece Provenance & Authenticity Ledger** | Proving the work is real | #1 SQL/Merkle, #6 KT model, #10/#11 |
| ✦ | **GT-Twin: Population Policy Simulator** (wildcard) | De-risk the whole machine | #12 WASM/Rust, causal ML |

---

## 1. The Fidelity Survival Engine — *"Select the family, not the child."*

**Lever:** Admissions & Intake — screen for 8-year family commitment (Brainlift SPOV 1).

### The problem
The Brainlift's most radical claim is that the variance predicting elite outcomes lives in the far tail of *parental obsession*, not the child's age-6 test score. But "will this family hand its life to the program for eight years?" is the kind of judgment schools make with a gut-feel interview. That doesn't scale to 100,000 intakes, and it doesn't survive a lawsuit. We need a **quantified, auditable, continuously-updated model of family attrition risk** — because a family that folds in Year 3 has burned a cohort seat *and* destabilized a homogeneous pod.

### The architectural mechanism
Reframe admissions from *classification* ("admit / reject") to a **time-to-event survival problem**: estimate the hazard `h(t | X)` = probability a family withdraws or breaches fidelity at program-year `t`, given a behavioral covariate stream `X`.

- **Signal capture (probationary onboarding, ~90 days before a seat is confirmed):** parent-app engagement clickstream, at-home practice-adherence logs, response latency to school communications, attestation-check completions (TV-free-home audits, daily parent-on-the-hook logs), and the legally-binding-continuation-contract signing funnel. Ingested over **type-safe gRPC → Kafka** (Matrix #4), one Protobuf event schema per signal type.
- **Model:** a **deep survival network** in the SAVSNet / DeepSurv family (Matrix #6, PyTorch). Architecture mirrors the verified state of the art: a **1D-CNN smooths the volatile engagement time-series and auto-extracts behavioral features → an LSTM models temporal evolution → a survival head outputs a full hazard curve** (no proportional-hazards or distributional assumption required). This is the exact CONV-LSTM + survival design validated on 78k-student (CAROL) and 120k-student (XuetangX) corpora, with early-warning capability at **~80% accuracy after only 10% of a program has elapsed** and ~90% by mid-point.
- **Serving:** per-family risk score recomputed on every new event via a KServe/Triton endpoint (Matrix #5) behind an HPA-autoscaled K8s deployment; drift monitored in Prometheus/Grafana. Admissions officers see a calibrated hazard curve, *not* a black-box yes/no — the model surfaces *which* signals drive the risk (SHAP over the covariate stream).
- **Feature-weighting discipline (verified):** OULAD-scale evidence shows **prior assessment/coursework trajectory and cumulative engagement dominate; static demographics (region, age-band) correlate near zero** (r ≈ 0.008–0.07 vs 0.38–0.49). So the model is *explicitly weighted toward behavioral fidelity signals over demographics* — which is also the more defensible, less-discriminatory design.

### Why it's an elite portfolio piece
Survival analysis on **streaming behavioral data with a deep hazard head** is rare in candidate portfolios — most people ship a binary classifier. Time-to-event modeling + Kafka ingestion + a monitored MLOps serving loop demonstrates ML depth *and* production systems maturity in one artifact: an "I built a real-time actuarial engine," not "I trained a random forest."

> **Caveat:** All survival evidence is adult MOOC dropout on heavily class-imbalanced data (inflating headline accuracy). Family-commitment base rates differ. Ship as **decision-support** with a human in the loop and a fairness audit, never an autonomous gate. The refuted claims are instructive: clickstream is *not* automatically superior to all other signals, and a naive "daily-activity flag" is *not* as good as a proper feature blend — resist over-trusting raw logs.

---

## 2. The Floor CAT + Tamper-Proof Testing Runtime — *enforce the cognitive floor, efficiently and fairly.*

**Lever:** Admissions & Intake — gate at IQ ≈ 120–125 (Brainlift SPOV 2), a full SD below the gifted-program line.

### The problem
The model *insists* on a hard cognitive floor and admits the entire band (120–145) that gifted programs discard. Screening 100k applicants with a fixed 3-hour proctored battery is slow, expensive, coachable, and gameable. We must place each applicant *relative to the floor* in the **minimum number of items**, and the test must be **cheat-resistant at the client** because a life-altering seat creates enormous incentive to game it.

### The architectural mechanism
A **Computerized Adaptive Testing (CAT) engine** built on **Item Response Theory** — the same IRT/Rasch machinery the verified knowledge-tracing SOTA (DKT2) uses for interpretable ability estimation.

- **Adaptive core:** maintain a posterior over latent ability `θ`; after each response, select the next item by **maximum Fisher information at the current `θ̂`** (or a Bayesian expected-information criterion). Terminate when the credible interval clears (or falls below) the floor. This collapses a 200-item bank to ~20–30 items per applicant while *tightening* precision exactly at the 120–125 decision boundary — the region we care about — far more efficient than a fixed test that wastes items far from the cut.
- **Item bank + exposure control:** Postgres (Matrix #1) with a Sympson-Hetter exposure-control layer and calibrated item parameters; window functions and careful indexing for real-time item selection under concurrent load.
- **The novel systems twist — a WebAssembly testing runtime (Matrix #12):** compile the item-selection + response-timing + integrity logic to **WASM (Rust → Emscripten)** running in the applicant's browser. This gives (a) sub-frame latency so timing telemetry is precise, (b) *deterministic, tamper-evident execution* — the scoring logic isn't sitting in inspectable JS, and (c) rich **process-level integrity signals** (response-latency distributions, answer-change patterns, paste events, focus-loss) streamed back for a lightweight anomaly model that flags coaching / proxy test-taking.
- **Fairness instrumentation:** Differential Item Functioning (DIF) analysis baked into the calibration pipeline (Mantel-Haenszel / SIBTEST) so the floor gate is defensible across subgroups, shipped as a CI release gate.

### Why it's an elite portfolio piece
CAT + IRT is *psychometrically serious* — it signals you can build measurement systems, not just fit models. Compiling the secure test runtime to **WASM** is the Matrix's explicit "elite differentiation tier" (#12): manual memory, deterministic execution, native-to-browser bridging. Very few candidates can say "I shipped a psychometric engine whose integrity core runs as a hardened WASM binary."

> **Caveat:** A cognitive-floor gate is ethically loaded; flawless engineering still harms if `θ` is treated as destiny. Pair it with the Brainlift's own stated policy — route below-floor applicants to *excellent ordinary schooling*, not a rejection letter — and log every decision immutably (feeds Project 7's ledger).

---

## 3. The Latent-Drive Cartographer — *uncover the true, hidden passion.*

**Lever:** Passion Discovery & Specialization — find the latent drive that justifies "specialize brutally early" (SPOV 4).

### The problem
SPOV 4 spends ages 6–14 on a narrow spine and burns breadth — but pointed at *what*? Specializing early is a catastrophic bet if you specialize a child into the wrong obsession. Self-reported interest is noise; an 8-year-old doesn't know their latent drive, and interests genuinely *shift*. We need a system that **actively explores** the space of possible passions, **exploits** signal as it accrues, and — critically — **detects when a real interest shift happens** versus transient boredom.

### The architectural mechanism
Model passion discovery as a **contextual multi-armed bandit** (Matrix #6/#7/#9). Arms = "passion probes" (micro-projects, problem genres, domains). Context = the student's feature vector (traced skills, prior probe outcomes, affect signals from Project 4).

- **Exploration/exploitation:** **Linear Thompson Sampling (LinTS)** — the exact algorithm validated on 935k learner interactions in the verified corpus — where each probe's payoff is modeled as a linear function of learner features and the arm chosen is the one most likely to advance a targeted outcome. Thompson sampling's posterior sampling gives principled exploration without the cold-start brittleness of ε-greedy.
- **The reward — the design crux.** Naive "skill gain" alone produces a grind-optimizer, not a passion-finder. Define a **composite reward** = `skill-gain` (change in traced mastery pre/post probe, à la the verified LinTS reward) **× intrinsic-engagement** (flow signal from Project 4) **× voluntary-return** (did the student choose this thread again, unprompted?). Passion = where a child *both* improves fast *and* is in flow *and* comes back on their own.
- **Detecting genuine interest shifts:** wrap the bandit in a **piecewise-stationary "disjoint payoff" model (PSLinUCB)** — the verified AAAI-2020 mechanism that treats each arm's preference vector as piecewise-stationary with *asynchronous, per-arm change points* and a proven sublinear-regret bound. A detected change-point on an arm is a first-class event: *this child's drive just moved* — re-open exploration on that neighborhood instead of stubbornly exploiting a dead interest.
- **Stack:** bandit service in Python/FastAPI, arm-payoff models in PyTorch, probe outcomes on Kafka, state in Postgres. A lightweight **LangGraph agent** (Matrix #9) authors/varies probe content within a domain to keep arms fresh.

### Why it's an elite portfolio piece
Contextual bandits with **non-stationarity handling** are genuinely advanced applied ML — what recommender teams at top companies actually fight with. Framing *passion discovery* as a change-point-aware exploration problem is novel and memorable, and the composite-reward design shows product judgment, not just algorithm knowledge.

> **Caveat:** LinTS optimizes *myopic single-step* gain, not multi-step learning trajectories — a real risk when the goal is an 8-year obsession. Mitigate by periodically re-planning over longer horizons (bandit → offline RL for the long-horizon policy) and keeping a human mentor in the loop on the "commit to a spine" decision.

---

## 4. The Flow/Burnout Sentinel + Friction Governor — *"Friction is the product; make help hurt to reach for."*

**Lever:** Passion Discovery / Motivation — sustain drive without extinguishing it, and operationalize SPOV 5 (engineered friction, decayed-ELO help-tax).

### The problem
SPOV 5 says tax help: refuse the answer, run Socratic dialogue, and give a **decayed ELO reward to anyone who shortcuts after an AI rescue** so shortcutting is mathematically worthless. But friction is a *dosage* problem. Too little and you get the fluency illusion the Brainlift condemns; too much, at the wrong moment, and you snap a 10-year-old's motivation and cause the very burnout the enterprise is trying to avoid. **Friction cannot be set globally. It must be servo-controlled per-student, in real time, against their affective state.**

### The architectural mechanism
Two coupled subsystems: a **sensor** (detect flow vs. frustration vs. burnout vs. boredom) and an **actuator** (the friction governor).

- **The Sentinel (sensor):** a **multimodal affective-computing pipeline** grounded in Self-Determination Theory and self-efficacy — the verified operationalization (Booth et al., CU Boulder NSF AI Institute): supervised ML mapping multimodal features (**gaze, facial action units, vocal prosody, interaction logs**) to engagement/affect states. SDT gives the operationalizable feature set — autonomy, self-efficacy, interest, and **challenge–skill balance** (the Csikszentmihályi flow condition). **Multimodal fusion is the robustness play** (verified: Bosch et al. reached ~98% *coverage* by borrowing signal across channels when the face detector failed under motion/occlusion/lighting).
- **The novel systems twist — on-device WASM inference (Matrix #12):** children's faces are the most sensitive data imaginable. Run the affect model **entirely client-side as a WASM binary (Rust/C++ → Emscripten)** at 60 FPS; **only the derived low-dimensional affect state leaves the device over gRPC** (Matrix #4), never raw video. Privacy-by-architecture *and* the exact "native engine → WASM → browser at 60 FPS without a cloud round-trip" project the Matrix flags as elite differentiation.
- **The Governor (actuator):** a control loop that takes the affect state and tunes the SPOV-5 friction parameters per-student: the Socratic-hint decay rate, the ELO penalty for post-rescue answers, and the challenge level. **Flow detected → hold or increase difficulty (protect the desirable difficulty). Frustration approaching burnout → temporarily relax friction, restore autonomy. Boredom / under-challenge → raise the tax and the difficulty.** Implement as a policy (start with a tuned PID/bandit controller; graduate to RL) so the friction curve is a *learned, personalized dosage*, not a constant.

### Why it's an elite portfolio piece
The single most *conceptually distinctive* build in the set: a **closed-loop affective control system** where perception (multimodal ML), privacy engineering (on-device WASM), and actuation (adaptive control of a pedagogical policy) meet. It implements a spiky Brainlift thesis as running code — "I built a servo loop that dials learning difficulty against a child's real-time flow state, and the face model never leaves the device."

> **Caveat (be honest here):** Engagement/flow is a **latent construct with modest measurement validity** — real accuracy on public benchmarks (e.g., DAiSEE ~55%) is far below the ~98% *coverage* figure, which is data-availability, not correctness. So the Governor must be **conservative and reversible**: nudge friction within safe bounds, defer to a human mentor on sustained distress, never make irreversible motivational bets on a noisy signal.

---

## 5. The Cohort Orchestration Engine — *the biggest lever in the building.*

**Lever:** Peer composition — dynamic homogeneous pods of 5–6, engineered rivalry, matched-pace advancement (SPOV 3).

### The problem
The Brainlift calls homogeneous grouping "the biggest lever in the building" and the most suppressed fact in education. Assembling 100,000 students into ~17,000 tightly-matched pods of 5–6 — and **continuously re-assembling them as students advance at different rates** — is not a spreadsheet task. It's a hard combinatorial optimization problem, and the objective the published literature optimizes is *the opposite of ours.*

### The architectural mechanism
- **It's provably NP-hard (verified):** Educational Team Formation is NP-complete (reduction from SET COVER; EDU-TF), and balanced graph partitioning is NP-complete. Exact enumeration is impossible at 17k pods — this *demands* real optimization, which is the point.
- **Skill representation:** derive each student's latent skill vector via **Laplacian-eigenmap dimensionality reduction over mastery/mark data** (the verified unsupervised approach) — students become vertices in a similarity graph with edge weights encoding skill/pace affinity.
- **The core solver — and the crucial inversion (verified caveat):** the published graph-partitioning and genetic-algorithm methods optimize for *skill-diverse / heterogeneous* groups. **Our objective is the exact opposite: intra-pod homogeneity** (same pace, same ceiling, to manufacture rivalry and kill the dead-weight-slowest-kid problem). So we **flip the objective function to reward intra-group homogeneity** and solve it as a **constrained k-way graph partition** via a **hierarchical / lexicographic Integer Linear Program (Gurobi)** — the verified EDU-TF pattern: a feasibility base model, then stacked lexicographic objectives where each solved objective constrains the next (homogeneity first, then friend/rivalry social constraints, then logistics). Warm-start the ILP with a **genetic-algorithm** or **hill-climbing "priority" heuristic** (verified LAK-25 method with MAXITER/SPREAD/K params handling social preferences and anti-tokenism) to get good solutions fast and prove optimality where feasible.
- **Dynamic re-pods (the real systems challenge):** pace ratings update continuously as students clear mastery gates. Stream those over **Kafka** (Matrix #4); run the partitioner as a scheduled batch optimization on **K8s** (Matrix #5) with incremental re-solve (only re-partition destabilized neighborhoods, not all 100k). Assignments and the full audit trail live in **Postgres** (Matrix #1) with heavy indexing and transactional integrity.
- **The rivalry rating layer (research frontier — build it):** the requested **Elo/TrueSkill-style rating** returned *no verified evidence* for educational rivalry, so this is novel territory. Maintain a **Glicko-2 / TrueSkill pace-and-mastery rating** per student so pods are matched on a *calibrated* scale and rivalry is *productive* (near-peers) rather than *demoralizing* (a hopeless mismatch). The rating also drives cross-pod tournaments and leaderboards that engineer the shared-advancement pressure SPOV 3 wants.

### Why it's an elite portfolio piece
A real **operations-research + distributed-systems** system: NP-hard problem, ILP with a commercial solver, metaheuristic warm-starts, streaming re-optimization at scale. That combination is rare and immediately legible as senior-level work. The objective-inversion story — "the literature optimizes for diversity; our thesis demanded homogeneity, so I re-derived the objective" — is a fantastic technical-judgment narrative.

> **Caveat:** Homogeneous grouping can create fairness and peer-effect pathologies (rigid tracking, self-fulfilling ceilings), and the *optimally* engineered peer group can even backfire when students self-segregate within it. The rating layer is *unproven* for rivalry engineering and could extinguish drive if mis-tuned (a permanently-losing student). Build in mobility (pods must be *escapable* upward) and monitor motivation via Project 4's Sentinel as a safety signal.

---

## 6. The AlphaX Socratic Scaffolding Mesh — *build real things, without being handed the answer.*

**Lever:** AlphaX / Masterpiece Infrastructure — the afternoon block where students build startups, apps, documentaries, Olympic-level projects.

### The problem
The afternoon is where students build *real* artifacts. The instant an LLM is in the room, the friction thesis (SPOV 5) collapses — a general chatbot just *hands over* working code, a polished script, a finished business plan, and the student learns nothing while feeling productive (the exact "fluency illusion" the Brainlift attacks). Worse, the verified research surfaces an **"interactional mismatch": real students actively bypass scaffolding to extract answers.** So the challenge is a build-support system that is *genuinely* Socratic and *adversarially robust* against being jailbroken into an answer machine — while still giving students real tools to ship real work.

### The architectural mechanism
A **stateful multi-agent mesh** (Matrix #9, LangGraph) that scaffolds rather than solves, plus a **secure real-world tool layer** (Matrix #10, MCP) and an **adversarial guardrail** (Matrix #11).

- **Pedagogy-first agents, trained to withhold:** the research gives a concrete recipe — align the tutor with **on-policy RL (GRPO) on simulated student–tutor dialogues**, using a **conversation-level reward = student post-dialog solve rate + LLM-judge pedagogical acceptance** (verified 2025 method) so the agent is optimized to *make the student capable*, not to emit answers. A verified trade-off to design around: **subject-expertise and pedagogy trade off** — the best math solver is not the best teacher — so use a **role-split multi-agent** design (a "Copa"-style peer agent that promotes sense-making and *prevents over-reliance*, a separate expert consulted only through the pedagogical layer).
- **Measure the thing that matters:** evaluate agents against a **MathTutorBench-style "scaffolding-not-answer-giving" metric** (verified) as a first-class CI gate — regressions that make the tutor more answer-giving *fail the build*.
- **Real tools via MCP (Matrix #10):** students shipping actual products need actual capabilities — GitHub, cloud deploy, data/API access, CAD, video-editing pipelines. Expose these through **custom MCP servers over JSON-RPC/SSE** with **runtime ACL evaluation and per-student token-budget guards** — the exact elite MCP project in the Matrix. The scaffolding agent mediates tool use so a student *directs* the build and learns the workflow, rather than the agent silently doing it.
- **Adversarial guardrail (Matrix #11) — the delicious part:** because students *will* try to jailbreak the tutor into giving answers, run a **red-team/defense loop**: an attacking agent continuously fuzzes the tutor with answer-extraction payloads, and **Llama Guard / NeMo Guardrails at the gateway** catch "answer-leak" attempts, producing a live "scaffolding-integrity" score. This turns OWASP-LLM security engineering toward a *pedagogical* objective — a genuinely novel reframing.

### Why it's an elite portfolio piece
It fuses **three** of the Matrix's most differentiating stacks — agentic orchestration (#9), MCP infrastructure (#10), and adversarial AI security (#11) — around a hard, unsolved problem the research explicitly flagged as an open frontier. "I built a multi-agent tutor that's RL-trained to withhold answers, gives students real deploy tooling through hardened MCP servers, and has an adversarial red-team loop stopping kids from jailbreaking it into a cheat engine" is a portfolio *centerpiece*, not a line item.

> **Caveat:** This lever had **zero surviving verified claims** in the research pass — the supporting papers (GRPO Socratic tutor, MathTutorBench, Copa, interactional-mismatch) were *found* but not adversarially confirmed in this run. Treat the design as a well-motivated research bet and validate the scaffolding-vs-answer metric on real students early and often.

---

## 7. The Masterpiece Provenance & Authenticity Ledger — *prove the student actually built it.*

**Lever:** AlphaX / Masterpiece — credentialing and authenticity of student work; the adjacent lever the four categories miss.

### The problem
If the afternoon output (a shipped app, a funded startup, a documentary) is the *proof* of the model's success, then authenticity is existential. In an AI-saturated world, a submitted artifact is worthless as evidence unless we can show *this specific child, with their demonstrated capability, actually produced it.* The verified research is blunt: **AI-detection tools are unreliable, and AI-related misconduct now exceeds all other categories combined.** Detection-after-the-fact is a losing game. We must capture authenticity **at creation time.**

### The architectural mechanism
Three layers, moving from cryptographic provenance to a genuinely novel capability-consistency check.

- **Content provenance (verified standard):** attach **C2PA Content Credentials** — cryptographically-bound manifests recording origin, every modification, and AI-tool usage — to every artifact a student produces (code commits, video files, design assets). This gives a tamper-evident creation history bound to the artifact itself.
- **Tamper-evident portfolio ledger:** an **append-only, Merkle-hashed ledger in Postgres** (Matrix #1 — no blockchain needed; a Merkle-DAG over signed events gives tamper-evidence with far less complexity). Every build event, tool invocation (from Project 6's MCP layer), and mentor sign-off is a signed leaf. The student's whole masterpiece history becomes a verifiable, portable credential.
- **The novel core — capability-consistency verification:** this is the part nobody ships. Run **large-scale knowledge tracing** (Matrix #6) over the student's entire learning history — a **DKT2 (xLSTM + Rasch/IRT) or SAKT self-attention** model, the verified SOTA for KT at 100k scale — to maintain a live estimate of each student's demonstrated capability curve. Then **compare the sophistication of a submitted artifact against the student's traced capability.** A child whose knowledge-tracing curve says mid-Algebra-II submitting a distributed system with production-grade concurrency control is a **capability–artifact mismatch → flag for human review.** This is *far* more robust than AI-detectors because it doesn't ask "was this AI-written?" (unanswerable) — it asks "is this consistent with what this specific student has provably learned?" (tractable, grounded in our own longitudinal data).
- **Security posture (Matrix #11):** the ledger and KT signals feed the same guardrail dashboards, giving a per-student authenticity-risk score usable by other institutions that trust the credential.

### Why it's an elite portfolio piece
A **novel synthesis** — content-provenance cryptography (C2PA) + a tamper-evident data structure (Merkle/Postgres) + knowledge-tracing ML repurposed as an anti-fraud oracle. The "capability-consistency instead of AI-detection" insight is the kind of *reframe* that signals genuine engineering creativity, and it directly answers the research's finding that detection-based enforcement is a dead end.

> **Caveat:** Capability-consistency can false-positive on genuine breakthroughs (a student *can* leap) and false-negative on sophisticated cheating that stays within-curve. It is a **triage signal for human judgment**, not an automated verdict — the same discipline the misconduct research recommends.

---

## ✦ Wildcard — GT-Twin: The Population Policy Simulator

**Lever:** De-risk *every other lever* before it touches a real child.

### The problem
The Brainlift makes aggressive, falsifiable bets: floor at 120–125 (not 145), pods of 5–6, decayed-ELO friction, brutal early specialization. Testing these on live 8-year-olds is slow, expensive, and ethically fraught. Before we deploy a policy change to 100,000 children, we should be able to *simulate its systemic effect.*

### The architectural mechanism
An **agent-based simulation + causal-inference platform.**
- **Simulation core:** a high-performance **agent-based model in Rust compiled to WASM** (Matrix #12) — each simulated student is an agent with a learning-rate distribution, motivation dynamics (driven by a model of Project 4's flow signal), and peer-effect couplings (from Project 5's pod structure). Run 100k agents forward under a proposed policy at 60 FPS in-browser, no cloud round-trip.
- **Causal layer:** wrap it in a **causal-inference harness** (do-calculus / uplift modeling) so we estimate the *counterfactual* effect of a lever change ("what if floor → 118? what if pods → 8?") rather than a naive correlation, using the real telemetry from Projects 1–7 to calibrate the agents.
- **Serving:** results feed a Grafana-style policy dashboard; the whole thing is a decision-support tool for the people setting the Brainlift's guardrails.

### Why it's an elite portfolio piece
An in-browser 100k-agent simulation in WASM (#12) *plus* a causal-inference layer is a rare, cross-disciplinary flex — systems performance engineering and statistical rigor in one artifact. It also demonstrates *product maturity*: you built the thing that keeps the aggressive levers from hurting real children.

---

## How the seven compose (mirroring the Brainlift's DOK-3 chain)

```
                 ┌─────────────────────────────────────────────┐
   INTAKE  ──►   │ (1) Fidelity Survival   (2) Floor CAT/WASM   │  gate on
                 │      family commitment        cognitive floor │  2 axes
                 └───────────────┬─────────────────────────────┘
                                 ▼
   DISCOVER ──►  (3) Latent-Drive Cartographer  ──► points the spine (SPOV 4)
                                 ▼
   SUSTAIN  ──►  (4) Flow/Burnout Sentinel + Friction Governor  ── operationalizes SPOV 5
                                 ▼
   GROUP    ──►  (5) Cohort Orchestration Engine  ── the biggest lever (SPOV 3)
                                 ▼
   BUILD    ──►  (6) AlphaX Socratic Scaffolding Mesh  ── the afternoon block
                                 ▼
   PROVE    ──►  (7) Provenance & Authenticity Ledger  ── the credential
                                 ▼
   DE-RISK  ──►  (✦) GT-Twin Policy Simulator  ── test any lever change first
```

Shared backbone (build once, reuse everywhere): a **Kafka event spine** (Matrix #4) every project produces to and consumes from; a **K8s + KServe/Triton serving plane** with Prometheus/Grafana observability (Matrix #5); **Postgres** as the transactional system-of-record (Matrix #1); and a common **gRPC/Protobuf** contract layer (Matrix #4). Any two of these projects is a strong portfolio; the shared backbone lets a 4-month sprint ship 3–4 of them credibly.

---

## Suggested 4-month sprint sequencing

| Phase | Weeks | Ship | Why |
|-------|-------|------|-----|
| Foundation | 1–3 | Kafka/gRPC event spine + Postgres + K8s serving plane | Every project needs it; also its own MLOps portfolio piece (#4/#5) |
| Flagship A | 3–7 | **(5) Cohort Orchestration Engine** | Highest-leverage per the Brainlift; strongest OR + systems story |
| Flagship B | 6–10 | **(4) Flow/Burnout Sentinel** (on-device WASM) | Most conceptually distinctive; exercises #12 |
| Flagship C | 9–14 | **(6) AlphaX Scaffolding Mesh** | Fuses #9/#10/#11; unsolved frontier |
| Depth add-on | 12–16 | **(1) Fidelity Survival Engine** *or* **(7) Provenance Ledger** | Rounds out ML (#6) or data-integrity depth (#1/#11) |

*(2), (3), and (✦) are excellent stretch/parallel builds — (3) the bandit is the smallest self-contained ML win, (✦) GT-Twin is the best "product judgment" showpiece.)*

---

## Research provenance & integrity notes

- **Method:** deep-research workflow — 6 search angles, 27 primary sources fetched, 122 falsifiable claims extracted, top 25 adversarially triple-voted (≥2/3 refutations kill a claim). **22 confirmed, 3 refuted.**
- **Confirmed and load-bearing here:** deep survival + CONV-LSTM attrition at 100k scale (SAVSNet; Mubarak et al. 2021, *Computers & Electrical Engineering*; MOOCVERSITY); engagement/coursework ≫ demographics as predictors (OULAD); LinTS skill-gain bandit (De Kerpel et al., *INFORMS Trans. Education* 2026) + PSLinUCB piecewise-stationary interest-shift model (AAAI 2020); SDT-grounded multimodal affect detection with fusion-for-coverage (Booth et al. 2023; Bosch et al.); NP-completeness of educational team formation (EDU-TF) with Laplacian-eigenmap + constrained k-way ILP (Gurobi), GA (Moreno et al., *Computers & Education* 2011), and hill-climbing "priority" solvers (LAK'25).
- **Explicitly refuted (do not build on these):** clickstream is *not* categorically superior to other signals; a simple daily-activity flag is *not* as good as a real feature blend; metaheuristics are *not* the sole dominant grouping technique (ILP is mainstream too).
- **Genuine gaps (frontier, hence high-upside):** the entire **AlphaX/Masterpiece** lever and **Elo/TrueSkill rivalry** engineering returned no *verified* claim — the supporting papers were found but not confirmed in this pass. Projects 5 (rating layer), 6, and 7 are the research bets; validate them on real students early.
- **Overarching caveat:** **domain transfer.** The evidence is adult MOOC learners, not K-8 families. Mechanisms transfer; accuracy numbers do not. Every gate here is designed as human-in-the-loop decision support, never an autonomous verdict on a child's future.

---

## Key sources (verified this pass)

- SAVSNet — survival-analysis dropout network: pmc.ncbi.nlm.nih.gov/articles/PMC9071151
- CONV-LSTM MOOC dropout (Mubarak et al. 2021): sciencedirect.com/science/article/abs/pii/S0045790621002548
- MOOCVERSITY (deep dropout over weeks): researchgate.net/publication/343233362
- OULAD predictor analysis: pmc.ncbi.nlm.nih.gov/articles/PMC11639146
- LinTS contextual-bandit skill-gain recommender: arxiv.org/abs/2602.04347
- PSLinUCB piecewise-stationary "disjoint payoff" bandit (AAAI 2020): arxiv.org/abs/2003.00359
- Engagement detection review (Booth et al. 2023, CU Boulder): colorado.edu/research/ai-institute (Booth et al. 2023)
- Fair & skill-diverse group formation via constrained k-way graph partitioning: arxiv.org/pdf/2301.09984
- EDU-TF (NP-completeness + hierarchical ILP): arxiv.org/html/2506.02756
- GA multi-objective group formation (Moreno et al. 2011): researchgate.net/publication/220140694
- Priority hill-climbing group-formation algorithm (LAK'25): dl.acm.org/doi/10.1145/3706468.3706473
- DKT2 (xLSTM + Rasch + IRT knowledge tracing at scale): arxiv.org/pdf/2501.14256
- GRPO Socratic-tutor RL (found, unverified): arxiv.org/html/2505.15607v1
- MathTutorBench (found, unverified): arxiv.org/html/2502.18940v1
- C2PA content-provenance spec: spec.c2pa.org

---

*Deliverable prepared as an architecture + product brainstorm, grounded in a verified deep-research pass and mapped to the Engineering Matrix (`impactful.md`) and the five spiky positions of the Brainlift (`gtBrainlift.md`). Reference documents read: `impactful.md`, `gtBrainlift.md` only.*
