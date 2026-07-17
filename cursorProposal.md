# gt100k — Non-Core Architecture Proposal
### The Levers Behind the Curtain: 7 Portfolio-Defining Systems for a 4-Month Sprint

> **Mandate.** The morning academic core (adaptive curriculum, step-based tutoring, mastery gating) is *solved*. This document ignores it entirely. It proposes the **non-core architectural levers** — the machines that select, sort, motivate, and unleash 100,000 students — because per the Brainlift those levers (dose, environment totality, peer composition, cognitive ceiling) are where the real variance lives, and they are exactly the parts nobody has built at scale.
>
> Every system below is designed to be **buildable as a standalone flagship**, maps explicitly to the **Engineering Matrix** (`#1`–`#12`), and is chosen because it is *technically rigorous, adversarially aware, and rare in the wild*. Codenames are for reference; each bundles several sub-modules so a builder can carve off a vertical slice for the sprint.

---

## 0. Design philosophy (the through-lines)

Seven ideas, six recurring principles. If a reviewer remembers nothing else, remember these — they are what separate this from ed-tech.

1. **One immutable log, many views.** Mastery, ratings, features, audit trails, contract compliance, and the digital twin are all *materialized folds* over a single event-sourced Kafka/Redpanda log. Reproducibility, bitemporality, and legal-grade auditability come free. (`#1`, `#4`)
2. **Monotone fast path, coordinated slow path.** Push everything you can onto coordination-free, monotone accumulators (CALM theorem); quarantine the operations that genuinely need consensus (decay, overrides, revocation).
3. **The user is the adversary.** Families game screening; students jailbreak tutors and forge masterpieces. Almost every subsystem carries an explicit red-team/blue-team threat model (`#11`). This is the spiciest and most differentiating stance in the whole proposal.
4. **Measure the slope, not the intercept.** The Brainlift's own thesis ("headroom + dose → performance") means the signal we want is *trainability* and *revealed persistent drive*, not static snapshots. Nearly every model estimates a trajectory.
5. **Friction as an economic constraint, not a UX afterthought.** SPOV5 becomes literal math: an information-theoretic "help tax" and a decayed-reward ledger that make shortcutting *provably worthless*.
6. **Never touch a child until the simulator says so.** Policies (friction schedules, unlock thresholds, cohort re-formation, route-out rules) are validated with off-policy evaluation on a calibrated digital twin before deployment — an ethics story *and* an engineering one.

### The 7 flagships at a glance

| # | Codename | Non-core area | Headline mechanism | Matrix coverage |
|---|----------|---------------|--------------------|-----------------|
| 1 | **CRUCIBLE** | Admissions — cognitive floor | Procedurally-generated, self-calibrating, un-leakable adaptive test framed as a *sequential classification* at the IQ floor; measures **trainability** via dynamic assessment | 1, 2, 4, 5, 6, 7, 8, 11, 12 |
| 2 | **COVENANT** | Admissions — family fidelity | Competing-risks **survival transformer** over a temporal kinship graph + conformal early-warning + causal intervention targeting + adversarial "pressure-chamber" agents + tamper-evident contract ledger | 1, 2, 3, 6, 7, 8, 9, 11 |
| 3 | **DIVINING ROD** | Passion discovery | **Inverted Random Network Distillation** to subtract novelty + **best-arm-identification** commit certificate + causal de-confounding using the recommender's own randomization as an instrument | 1, 2, 3, 4, 5, 6, 9, 10 |
| 4 | **COLOSSEUM** | Cohort orchestration | Dual-axis **(mastery θ, velocity v)** rating with graduation forecasting → **branch-and-price** clique-partition with an inverted-U rivalry objective → hysteresis anti-thrash controller → causal peer-effect learning | 1, 2, 3, 4, 5, 6 |
| 5 | **PROOF-OF-STRUGGLE** | Friction & reward economy (cross-cutting) | Event-sourced, hash-chained **decayed-ELO ledger** + information-theoretic help-tax + **anti-answer RAG** + adversarial-student guardrail mesh + cognitive-debt sentinel | 1, 4, 5, 6, 7, 8, 9, 11 |
| 6 | **THE FORGE** | AlphaX / Masterpiece | Predictive **microVM sandbox fleet** + Socratic critic swarm + **process-as-proof** authenticity (VDF-sealed edit ledger) + robust jury/IRT/conformal evaluation + provenance-gated deploy + verifiable credentials | 3, 4, 5, 6, 7, 9, 10, 11, 12 |
| 7 | **MNEMOSYNE** | Data/systems spine (cross-cutting) | **CALM-monotone mastery lattice** + kappa telemetry/feature spine + capability-scoped **MCP broker** + small-cohort privacy ledger + digital-twin OPE + predictive serving mesh | 1, 2, 3, 4, 5, 6, 10, 11, 12 |

All 12 Matrix categories are covered (map in §8). Suggested sprint sequencing in §9.

---

## 1. CRUCIBLE — the cognitive-floor intake engine
**Non-core area: Admissions & Intake (cognitive floor, SPOV2). Matrix: `#1 #2 #4 #5 #6 #7 #8 #11 #12`.**

### 1.1 The problem it solves
SPOV2 asserts a hard cognitive floor near IQ 120–125 — a full standard deviation below where gifted programs draw the line — and demands we select *above it and say so*. Doing that fairly for **100,000 applicants** breaks every off-the-shelf assessment:
- A fixed item bank **leaks within days** (screenshots, coaching mills), destroying validity.
- Static IQ near the floor is **noisy and coaching-contaminated**, and the Brainlift's own logic says the admit signal is *trainability* (dose-responsiveness), not a static score.
- Every applicant will point a multimodal LLM at the test in real time.

### 1.2 Architecture & mechanism
Four composable sub-systems, pipelined:

**(a) GENESIS — an infinite, un-leakable, self-calibrating item bank.**
Represent matrix-reasoning items as an **Attributed Stochastic Image Grammar** over the Raven rule-space (progression / arithmetic / distribute-three / XOR). Each item is a `PRNG seed → grammar derivation tree → deterministic render`; items are stored **only as JSONB generative specs (seed + rule vector), never as bitmaps**. Difficulty is predicted *before administration* with a **Linear Logistic Test Model** over "radical" features, refined by a **GNN difficulty regressor** on the derivation tree, entering the bank with an empirical-Bayes prior. Deterministic rendering happens **client-side in a Rust→WASM sandbox with SIMD** (`#12`) so item content never crosses the wire in plaintext. pgvector/HNSW (`#7`) rejects near-duplicate families.

**(b) FLOORLINE — testing as sequential *classification*, not estimation.**
We do not need a precise IQ; we need a bounded-error **admit/reject decision at one boundary**. Frame it as a **Sequential Probability Ratio Test / Generalized Likelihood Ratio** with an indifference region around θ_cut. Select items by **Kullback–Leibler information at the cut** (provably ≥ Fisher information for classification), enforce content constraints via van der Linden's **shadow-test MILP** (OR-Tools), and control leakage with **Sympson–Hetter exposure control + a-stratification** (distributed token buckets in Redis). This reaches a decision in dramatically fewer items than "estimate θ then threshold."

**(c) ASCENT — measure the slope (trainability), not the intercept.**
Operationalize Vygotsky's Zone of Proximal Development as a live estimator: a **test–teach–test** protocol on a *freshly generated, un-practiceable* GENESIS micro-domain, with graduated hints. A **state-space / particle-filter growth model** (or an **attention knowledge-tracing net, AKT**, with an explicit per-student growth embedding) disentangles starting ability θ₀ from **learning-rate r**. This measures the thing the school actually cares about.

**(d) SENTINEL + MIRAGE — the validity firewall.**
Detect preknowledge with the **Deterministic-Gated Lognormal Response-Time model** (too-fast-for-difficulty), collusion rings via answer-similarity graphs + **Leiden community detection**, and identity via **on-device keystroke/mouse biometrics compiled to WASM** (features only, never raw video — a privacy design, not just a security one). A novel **two-pool inflation discriminator** secretly interleaves un-practiceable vs practiceable-lookalike items: a large gap = coached inflation; uniform performance = genuine ability. MIRAGE keeps items ahead of AI solvers with an in-house adversarial **RPM-solver red-team** (CoPINet/SCL/WReN + a frontier VLM), ships only families the solvers can't crack, and embeds **Tardos traitor-tracing watermarks** in incidental render parameters so a leaked screenshot identifies its source.

### 1.3 Tech stack → Matrix
- `#1` Postgres: JSONB item specs, GIN on radical-hash, ACID append-only **exposure ledger**, partitioned billion-row response table.
- `#4` gRPC + Protobuf item-selection microservice; Kafka/Redpanda response/exposure events (event sourcing → reproducibility).
- `#6` PyTorch: GNN difficulty predictor, AKT trainability estimator, DG-LNRT.
- `#8` LoRA/QLoRA to adapt the difficulty predictor and KT backbone to the gt100k population.
- `#11` OWASP-LLM threat model for AI-assisted cheating; adversarial solver loop.
- `#12` Rust/WASM/Emscripten + SIMD for deterministic seeded rendering and on-device biometrics.
- `#2` FastAPI/asyncio edge; `#5` Triton serving + Prometheus/Grafana p99 selection-latency SLO (target sub-100ms).

### 1.4 Why it's an elite portfolio piece
Re-solving a constrained MILP per examinee per item under a 100ms budget across 100k concurrent sessions is a genuine **distributed-systems × operations-research × psychometrics** problem. "Items stored as seeds and rendered in a sandboxed WASM client, difficulty known before anyone sees them, with cryptographic traitor tracing" is a security-research-grade artifact most ed-tech never attempts. Framing intake as an SPRT (not estimation) reads as senior-level decision theory.

### 1.5 Hardest part & failure modes
Base-rate/fairness asymmetry: cheating is rare, so detectors flood reviewers, and gaze/keystroke detectors have double-digit false-positive rates that fall on non-native and neurodivergent test-takers → **never auto-reject; always human-adjudicate + verified re-test on fresh items.** Also: LLTM misspecification (a "surface" feature secretly drives difficulty), pool depletion at the cut (information vs security are in direct tension), and construct validity of "trainability" (ASCENT's slope must be validated against real downstream dose-response before you admit on it).

### 1.6 Inspirations
RAVEN A-SIG (Zhang et al. 2019); LLTM (Fischer 1973); Embretson cognitive design system; Wald SPRT (1947); Eggen KLI-for-classification (1999); van der Linden shadow-test; Sympson–Hetter (1985); Chang–Ying a-stratification (1999); Vygotsky ZPD / Feuerstein LPAD; Chollet *On the Measure of Intelligence* (2019); AKT (Ghosh et al. 2020); DG-LNRT (Kasli et al. 2023); Tardos codes (2003); Dynabench adversarial filtering (Nie et al. 2020).

---

## 2. COVENANT — the family-commitment engine
**Non-core area: Admissions & Intake (family fidelity, SPOV1). Matrix: `#1 #2 #3 #6 #7 #8 #9 #11`.**

### 2.1 The problem it solves
SPOV1 is the boldest bet in the Brainlift: **select the family, not the child**, for an 8-year (96-month) totalizing commitment, and screen out who *folds* when relatives and the school board start howling about a "stolen childhood." This is a longitudinal, adversarial, privacy-sensitive prediction problem no admissions office has ever modeled. (It is also the most ethically and legally fraught — see §2.5; every mechanism here is gated on consent and human oversight.)

### 2.2 Architecture & mechanism

**(a) The Commitment Digital Twin — dynamic competing-risks survival.**
Model each family as a **temporal heterogeneous graph** (parents, child, extended kin as nodes; the kinship subgraph *is* the "social-pressure topology"), encoded with a **Heterogeneous Graph Transformer over a Temporal Graph Network** memory. Fuse longitudinal multimodal signals (engagement, payment cadence, psychometrics) through a **Perceiver-IO cross-attention bottleneck with modality dropout**. Feed a **competing-risks survival head** (SurvTRACE / Dynamic-DeepHit) that emits *cause-decomposed* hazards — separating financial default, relocation, **social-pressure capitulation**, and child burnout — with **IPCW** correcting the left-truncation that SPOV screening induces. Wrap outputs in **Conformalized Survival Analysis** for a distribution-free lower bound on "months-until-fold" → principled early-warning instead of arbitrary cutoffs.

**(b) The Pressure Chamber — measuring capitulation by revealing it.**
Self-report is defeated by social-desirability bias, so measure conscientiousness/grit with **forced-choice Thurstonian IRT** (fake-good-resistant) delivered as a CAT, and then run a bounded **multi-agent LLM simulation** (`#9`, LangGraph) where personas role-play a skeptical grandparent, an anxious spouse, and a hostile school-board member — grounded by **RAG over the family's actual file** so agents cite the *real* objections. Score *revealed* capitulation markers (concession rate, latency-to-yield, justification stability) → a **pressure-elasticity** feature feeding the twin. The personas are **LoRA/QLoRA-fine-tuned with TRL** (`#8`) into consistently-calibrated adversaries (a persona that drifts is an unreliable stimulus), and NeMo Guardrails / Llama Guard (`#11`) keep the simulated pressure bounded and non-abusive.

**(c) The Causal Persistence Engine — from prediction to action.**
Prediction says *who*; causation says *what to do*. Encode assumptions as a **structural causal model**, estimate **conditional average treatment effects** with **Double ML + Causal Forests**, and allocate scarce interventions (aid, counseling, workload relief) to the families where they causally reduce fold-hazard the most (a knapsack over CATE). Ship with **E-value** sensitivity bounds for unmeasured confounding.

**(d) The Continuation-Contract Ledger — enforceable at 96-month scale.**
Model each contract as a long-lived **durable-execution workflow** (Temporal-style) with obligations as timers. **Event sourcing + CQRS** with a **Merkle/hash-chained audit log** (Certificate-Transparency-style inclusion proofs) makes compliance cryptographically verifiable and legally admissible; obligations are machine-readable **Ricardian contracts**. Stream the log through **Bayesian Online Changepoint Detection + CUSUM** to catch attestation-cadence decay *before* formal breach, and frame each obligation as an SLO with burn-rate alerts.

### 2.3 Tech stack → Matrix
`#6` PyTorch (HGT+TGN, SurvTRACE); `#7` pgvector/HNSW for "nearest analog families that folded" + RAG; `#1` Postgres serializable event store, S3 Object-Lock WORM archive; `#9` LangGraph pressure-chamber + escalation drafting; `#11` guardrails; `#2` FastAPI/asyncio + PyTest refutation tests; `#3` EKS/RDS/S3 + Terraform.

### 2.4 Why it's an elite portfolio piece
Competing-risks + *dynamic* + *conformal* + *temporal-graph fusion* is a research-grade combination rarely seen together, and the causal-targeting + durable-execution + tamper-evident-ledger layer is a full **distributed-systems + causal-inference** story that goes far beyond a churn classifier. Using an agentic simulation to *elicit* a behavioral measurement is a genuinely novel measurement paradigm.

### 2.5 Hardest part & failure modes
**Performativity is the killer**: deploying these systems changes family behavior, so every model is an *intervention*, not an observer — the i.i.d. assumption breaks. Plus unmeasured confounding (heavy self-selection), informative censoring, small-cohort sparsity, and the GDPR/CCPA **right-to-erasure vs immutable ledger** conflict (resolved via crypto-shredding, see §7). And bluntly: acting on a "will-fold" probability to deny a child a seat is a decision with profound ethical weight and disparate-impact/legal exposure — this system must be advisory-with-human-authority, consent-gated, and audited, not an autonomous gatekeeper. A household-sensing tier (on-device NILM/acoustic attestation of "TV-free" homes with local differential privacy and zero-knowledge predicate proofs) is *technically* elegant but should be treated as a research spike behind an explicit consent-and-legality gate, not shipped naively.

### 2.6 Inspirations
DeepHit / Dynamic-DeepHit (Lee et al. 2018/2019); SurvTRACE (Wang & Sun 2022); Conformalized Survival Analysis (Candès et al. 2023); HGT (Hu et al. 2020); TGN (Rossi et al. 2020); Perceiver-IO (Jaegle et al. 2021); Thurstonian IRT (Brown & Maydeu-Olivares 2011); Generative Agents (Park et al. 2023); Double ML (Chernozhukov et al. 2018); Causal Forests / GRF (Athey et al. 2019); Temporal/Cadence durable execution; Certificate Transparency (RFC 6962); Bayesian Online Changepoint Detection (Adams & MacKay 2007).

---

## 3. DIVINING ROD — the passion-discovery engine
**Non-core area: Passion Discovery & Specialization (SPOV4). Matrix: `#1 #2 #3 #4 #5 #6 #9 #10`.**

### 3.1 The problem it solves
SPOV4 demands **brutal early specialization** — commit a child to a narrow spine at age 6–14 because "the years of cheap automaticity never come back." That makes the specialization decision terrifyingly high-stakes, and it is corrupted by two confounds: **novelty** (every shiny new activity spikes engagement that looks exactly like passion for weeks) and **social/mentor contagion** (a charismatic teacher or a lucky win masquerades as latent drive). Recommenders answer the wrong question — they keep exploiting; we must **explore cheaply, then stop and commit with a defensible error bound.**

### 3.2 Architecture & mechanism

**(a) The Novelty-Discounted Drive Ledger — invert RND to subtract the dopamine of the new.**
Literally repurpose **Random Network Distillation**: a frozen random target network + a trained predictor over activity-context embeddings; prediction error = novelty. In RL this is an *exploration bonus*; here we **invert the sign** and subtract it. `persistent_drive = engagement × (1 − normalized_novelty)`. High engagement *after* novelty has decayed (the activity is old-hat, no longer surprising) is the residual that equals real intrinsic pull. Complement with an **Intrinsic Curiosity Module** to capture "I love *mastering* this" (learning progress) vs "this is just new." Persist as an append-only, event-sourced ledger — the clean reward source for everything downstream.

**(b) The Commit Certificate — best-arm identification, not recommendation.**
Frame the decision as **pure-exploration best-arm identification**: name the single domain of true drive with error ≤ δ using the fewest probes, and emit a **PAC stopping certificate** ("we are 1−δ confident this is the child's best arm"). Use **Track-and-Stop** (Chernoff GLR stopping) for the fixed-confidence regime and **Successive Rejects / Sequential Halving** for the hard age deadline (fixed budget). Relax to **(ε,δ)-good-arm identification** since ties in drive are fine.

**(c) CaptureNet — competing-risks survival on the activity stream.**
Which domain *captures* the child (event) while others are *abandoned* (competing risks), and will the drive survive past the novelty half-life? A **causal self-attention encoder** (SASRec/HSTU-style, on real timestamps) with a discrete-time **cause-specific hazard head** (DeepHit lineage) serves per-domain survival curves. The label only counts as **revealed re-engagement under free choice** — it counts only if the child returns *despite* SPOV5 friction.

**(d) The Randomization Ledger — de-confound using your own exploration as an instrument.**
The exploration policy *randomizes* which activities are offered → that randomization is a **valid instrument**. Run **DML-IV + Causal Forests** to estimate the *causal* effect of exposure-dose on sustained voluntary effort 90 days later, per child (CATE), stripping out mentor charisma and peer contagion. This closes the loop: cleaned causal reward flows back into the commit decision.

**(e) The Drift Sentinel — when to re-open exploration, with an asymmetric loss.**
After commit, a temporary dip (a hard plateau — expected under SPOV5) must not trigger premature re-exploration, but genuine extinction must not trap the child for years. **Bayesian Online Changepoint Detection** wrapped in a **sequential test with a deliberately asymmetric cost** (`C(false-alarm) ≫ C(delay)`) bakes SPOV4's "automaticity years never return" directly into the decision boundary.

All of it rides on **PopBandit**, a population-scale contextual-bandit control plane (Thompson/LinUCB/NeuralUCB) that **logs propensities on every decision** — the non-negotiable enabler of off-policy evaluation, so new discovery policies are A/B-tested *on logged history* before touching a child.

### 3.3 Tech stack → Matrix
`#6` PyTorch (RND/ICM, self-attention survival, DragonNet); `#1` event-sourced drive ledger + propensity logs; `#4` Kafka reward/telemetry streams; `#2` FastAPI BAI + bandit services; `#3` Terraform IaC; `#9` agent schedules the next probe; `#10` MCP exposes the control plane to tutor-agents under ACLs; `#5` Triton serving + drift monitoring.

### 3.4 Why it's an elite portfolio piece
Three genuinely rare moves in one system: (1) **inverting a famous RL exploration algorithm to solve a *measurement* problem**, (2) framing discovery as **BAI with a PAC certificate** (almost nobody does this — you ship "here is the child's domain *and* the sample-complexity proof"), and (3) **using your own recommender's randomization as an econometric instrument** to de-confound. A 14-year-old being served *survival curves of their own interests* is a jaw-dropping demo.

### 3.5 Hardest part & failure modes
The entire loop's validity rests on two irreversible disciplines: **logging propensities from day one** (or OPE and the IV are impossible retroactively) and a **non-gameable, novelty-subtracted, causally-cleaned reward** — because if the reward is wrong, BAI will commit a child to the wrong life *with high confidence*, which is worse than not committing. Other traps: weak instruments, exclusion-restriction violations (Hawthorne effect), the "novelty-seeker" for whom novelty-seeking *is* the stable trait, and non-stationary reward (drive rises with skill).

### 3.6 Inspirations
Random Network Distillation (Burda et al. 2018); ICM (Pathak et al. 2017); Track-and-Stop (Garivier & Kaufmann 2016); Successive Rejects (Audibert & Bubeck 2010); Sequential Halving (Karnin et al. 2013); SASRec (Kang & McAuley 2018); HSTU (Zhai et al. 2024); DeepHit (Lee et al. 2018); DML-IV + Causal Forests (Chernozhukov et al. 2018; Athey et al. 2019); BOCPD (Adams & MacKay 2007); LinUCB (Li et al. 2010); Doubly-Robust OPE (Dudík et al. 2011).

---

## 4. COLOSSEUM — the cohort-orchestration engine
**Non-core area: Cohort Orchestration (SPOV3). Matrix: `#1 #2 #3 #4 #5 #6`.**

### 4.1 The problem it solves
SPOV3 calls homogeneous grouping "the biggest lever in the building": cohorts of 5–6 pace-matched students thrown into **direct rivalry**, with matched pace removing the drag of the slowest. But students advance at *different rates*, so cohorts must be **continuously re-formed** — and naive re-clustering **thrashes**, destroying the social fabric that is the entire point. This is a live matchmaking market over a latent ability×pace manifold, not a nightly k-means job.

### 4.2 Architecture & mechanism

**(a) Kinetic Skill State — a dual-axis (θ, v) rating with graduation forecasting.**
A scalar Elo can't tell a *plateaued* 1600 from a *fast-rising* 1600 — yet those two must never share a cohort. Extend **TrueSkill-Through-Time** into a **state-space (Kalman) model**: each student's latent state is a 2-vector with constant-velocity dynamics (`θ_{t+1}=θ_t+v_t+ε`), inferred by **Gaussian Expectation Propagation over a factor graph**. The "games" *are the rivalry*: among-cohort rankings on shared timed assessments feed the graph — competition is the measurement. It forecasts a **graduation ETA** (posterior time at which θ crosses the cohort ceiling) so re-formation is **predictive, not reactive**, and cold-starts from the SPOV2 IQ floor as an informative prior.

**(b) CohortForge — optimal grouping as branch-and-price.**
Partition 100k students into ~17–20k cliques of size 5–6 that are pace-homogeneous *and* rivalry-optimal under hard constraints (IQ-floor eligibility, specialization track, must-not-pair separations). This is capacitated set-partitioning — NP-hard — solved by **branch-and-price / column generation**, the exact machinery that clears **national kidney-exchange markets**. The objective is the novelty: **not** minimize intra-pod variance to zero (that kills competition) but an **inverted-U productive-rivalry score** that rewards a tight pace match *plus a target spread band* (a live race) and penalizes spreads wide enough to demoralize the bottom student (a **Big-Fish-Little-Pond guardrail**). An **anti-thrash regularizer** penalizes changes vs the incumbent assignment; **ability-band sharding** decomposes the intractable 100k problem into thousands of independent ~200-student subproblems solved in parallel.

**(c) Hysteretic Restreamer — stability by construction.**
Continuous re-formation via **restreaming graph partitioning (Fennel)** warm-started from yesterday's assignment, wrapped in a **control layer**: a per-student **Schmitt-trigger deadband** (move-eligible only after drifting beyond a band *and staying out k periods*), a **token-bucket rate limiter** (no pod loses >1 member per period), and **rendezvous hashing** so minimal students relocate on a split. **Leiden well-connectedness** guarantees no lonely singletons.

**(d) Rivalry Oracle — learn the objective causally.**
*How much* spread maximizes productive competition without demoralization is, per **Manski's reflection problem**, impossible to learn from observational cohort data. Because we *control* assignment, run the school as an instrumented experiment: **graph-cluster-randomized** composition treatments with a **Horvitz–Thompson network-exposure estimator**, feeding a **GNN dose-response surface** that predicts each student's forward gain *and* self-concept trajectory as a function of composition — an empirical inverted-U that plugs back into CohortForge's objective and guards against rich-get-richer.

### 4.3 Tech stack → Matrix
`#6` factor-graph EP + PyG GNN; `#2` Python + OR-Tools/HiGHS/Gurobi column generation; `#4` Kafka mastery-event stream, Go/Rust restream processor + gRPC; `#1` Postgres materialized assignment views, ACID, audit log; `#3` AWS Batch fan-out + Terraform; `#5` K8s jobs, Prometheus churn/optimality-gap/thrash SLOs.

### 4.4 Why it's an elite portfolio piece
It reframes classroom grouping as **the same math that clears kidney-exchange markets** — a hand-built branch-and-price solver with a bespoke economics-of-competition objective, which almost no engineers ship. The **velocity axis + graduation forecasting** is novel versus all ed-tech (which stops at a scalar score), and marrying streaming graph partitioning with **classical control theory** (hysteresis, debounce, rate limiting) is a far more sophisticated answer than "re-run clustering."

### 4.5 Hardest part & failure modes
Thrashing/instability (defended by hysteresis + churn regularizer + stable re-covers), loneliness of outliers (Leiden connectedness + handicap bridging), rich-get-richer (causal detection + inverted-U cap), cold start (IQ prior + information-gain active matchmaking), and endogeneity (only graph-cluster randomization defeats Manski). MILP infeasibility/latency spikes under tight constraints are a real operational risk.

### 4.6 Inspirations
TrueSkill / TrueSkill-Through-Time (Herbrich et al. 2007; Dangauthier et al. 2008); Glicko-2 (Glickman); kidney-exchange clearing (Abraham, Blum & Sandholm 2007; Dickerson et al.); correlation clustering (Bansal, Blum & Chawla 2004); Fennel restreaming (Tsourakakis et al. 2014; Nishimura & Ugander 2013); Leiden (Traag et al. 2019); Manski reflection problem (1993); Big-Fish-Little-Pond (Marsh & Parker 1984; Chang & Lam 2007); graph cluster randomization (Ugander et al. 2013).

---

## 5. PROOF-OF-STRUGGLE — the friction & reward economy
**Cross-cutting core (SPOV5) — the engine that makes "friction is the product" literal math. Matrix: `#1 #4 #5 #6 #7 #8 #9 #11`.**

### 5.1 The problem it solves
SPOV5 says *tax help, refuse answers, and give any post-rescue answer a decayed ELO reward so shortcutting is mathematically worthless.* The core Socratic teaching method is considered solved — but the **surrounding infrastructure is not**: the reward economy, the anti-answer retrieval, the guardrails against adversarial students, and the detection of cognitive offloading. And here the threat model is unique: **the attacker is the beneficiary is the person we want to help.**

### 5.2 Architecture & mechanism

**(a) The Decayed-ELO Ledger — with an information-theoretic help tax.**
Model each submission as a paired "match": student skill θ_S vs item difficulty b_I, updated with **Glicko-2** (equivalent to online IRT). The novelty is the **handicap**: the Socratic tutor's escalating hints leak information, quantified as `L = KL(p_after ‖ p_before)` (Bayesian surprise / expected information gain over the solution posterior). Apply a decay `γ(L) = exp(−λL)` to the positive rating delta — as leaked bits approach the answer's entropy, reward → 0. Elicit a **pre-hint answer + confidence scored by a strictly-proper scoring rule** (log/Brier) so honest, calibrated effort is the *unique* expected-reward maximizer and guessing is strictly dominated. Frame the learning-credit term as a **potential-based shaping** function (preserves the true objective) plus a deliberate non-potential help-penalty. Result: a *provable* "shortcutting is worthless" guarantee, not a heuristic penalty. The ledger is **event-sourced, hash-chained (Merkle), CQRS** — ratings are a replayable projection, and after a rescue the system *inflates uncertainty* (Glicko RD ↑) and auto-schedules an **unassisted re-test**.

**(b) APORIA — anti-answer RAG (retrieval inverted).**
Standard RAG surfaces the answer passage; we need the mathematical opposite. Build a **bipartite knowledge-component → misconception → Socratic-move graph**; index a **misconception embedding space** (HNSW) rather than an answer space; a **graph walk** picks the *least-revealing* move that maximally collapses the misconception posterior. An **egress cross-encoder** rejects any candidate output whose similarity/n-gram overlap with the withheld gold answer exceeds τ. Metrics are inverted: *answer-leakage rate → 0*, misconception-hit rate, question-to-statement ratio, "Socratic faithfulness" (Ragas/TruLens). The tutor itself is **LoRA/QLoRA-fine-tuned with a process reward (GRPO)** rewarding diagnostic interrogatives, penalizing answer tokens.

**(c) The Elenchus Firewall — adversarial-student guardrail mesh.**
Defense-in-depth against prompt injection / jailbreaks / DAN / "my grandma reads me answers": **Layer 0** = the gold answer is *architecturally absent* from the model's context (you can't leak what isn't there); **Layer 1** = a Llama-Guard-style intent classifier (answer-extraction, role-play override, prompt-leak); **Layer 2** = NeMo Guardrails/Colang dialog state machine constraining every turn to legal Socratic moves *outside* the LLM; **Layer 3** = the egress leakage critic; **Layer 4** = per-session **canary answers** in a decoy store to detect exfiltration. The **novel inversion**: because the attacker is a learner, a detected extraction attempt is a *learning signal* — it decays ELO, updates an adversarial-propensity score, and triggers a Socratic meta-move ("why would that command help you learn this?"). The exploit becomes productive friction.

**(d) The Cognitive-Debt Sentinel — behavioral EEG for offloading.**
Detect the *fluency illusion* (student feels mastery but offloaded cognition). EEG is impossible at 100k, so build a **behavioral shadow**: a TCN/Transformer over keystroke dynamics, paste events, edit entropy, and latency-to-first-token, trained semi-supervised against surprise **delayed unassisted retrieval probes** (assisted-fluency ≫ unassisted-probe = offloading). The killer feature: on a small EEG-labeled calibration cohort, **regress the neural connectivity signature from cheap behavior**, then deploy the behavioral proxy at scale — neural ground-truth *distilled* into keystroke telemetry.

**(e) The ZPD Governor + Socratic Gauntlet — the safety layer and the eval.**
A **control-theoretic pacer** holds each student at the **85%-success setpoint** (where gradient learning is fastest) by inverting the IRT success curve (`b* = θ − s·logit(0.85)`) with a PID/MPC trim, and a **BOCPD circuit breaker** trips *before* struggle turns destructive — re-scaffolding (faded worked examples) instead of giving the answer. Every tutor/guardrail release must first survive the **Socratic Gauntlet**: a swarm of **generative-agent students** (Deep/Surface/Lazy + adversarial personas) that red-team the firewall (Attack Success Rate → 0) and verify learning gains, gating CI/CD (`#5`) promote-on-green.

### 5.3 Tech stack → Matrix
`#1` Postgres/Timescale ACID event ledger + projections; `#4` Kafka/Redpanda log, Go/Rust rating service, gRPC; `#6` cross-encoders, KT, TCN offloading model; `#7` HNSW misconception RAG + Ragas/TruLens eval; `#8` LoRA/QLoRA + TRL/GRPO Socratic tutor; `#9` LangGraph tutor + Gauntlet; `#11` OWASP-LLM guardrail mesh + canaries.

### 5.4 Why it's an elite portfolio piece
A rare cross-over of **distributed-systems rigor** (event sourcing, CQRS, Merkleized logs, exactly-once) welded to **psychometrics + information theory + reward design**, with a headline thesis you can actually *prove*: "shortcutting yields ≈0 durable ELO." "RAG penalized for being grounded in the answer" and "jailbreak telemetry converted into pedagogy" are memorable, non-obvious, and directly showcase Matrix `#7`/`#9`/`#11`.

### 5.5 Hardest part & failure modes
Leak-estimator miscalibration (over-penalize → kills drive; under-penalize → shortcut becomes profitable — monitor ECE), **over-refusal** (blocking legitimate curiosity is itself pedagogically harmful and destroys trust), contamination-window gaming (request rescue just outside the window), Goodhart on the 85% setpoint (trivializing content to hit it — must couple to learning-progress), and the base-rate problem (rare real cheating floods reviewers). The guardrail LLM must be a *different model family* than the tutor.

### 5.6 Inspirations
Glicko-2 (Glickman); Pelánek Elo-for-education + time-decay (2016); strictly-proper scoring (Gneiting & Raftery 2007); Bayesian surprise (Itti & Baldi); potential-based shaping (Ng, Harada & Russell 1999); half-life regression (Settles & Meeder 2016); GRPO-as-PRM (2025); Ragas/TruLens; OWASP LLM Top-10 (2025); Llama Guard (Inan et al. 2023); NeMo Guardrails (Rebedea et al. 2023); Regan intrinsic-performance-rating cheating detection; "Your Brain on ChatGPT" (Kosmyna et al. 2025); the 85% Rule (Wilson et al. 2019); productive failure (Kapur 2008); Generative Agents (Park et al. 2023).

---

## 6. THE FORGE — AlphaX / Masterpiece infrastructure
**Non-core area: AlphaX afternoon block (real startups/apps/documentaries/Olympic-level projects). Matrix: `#3 #4 #5 #6 #7 #9 #10 #11 #12`.**

### 6.1 The problem it solves
The afternoon block produces **real** output at 100k scale. The hard problems are *not* ed-tech: a **correlated-demand serverless fleet** (100k students hit "build" at the same afternoon bell — a thundering-herd cold-start storm), **adversarial provenance** in an era where the final artifact is trivially AI-forgeable, and **calibrated judgment at scale** that survives a corrupted evaluator. The organizing insight for authenticity: **stop detecting artifacts (a losing arms race) and start attesting process** (winnable, because forging the construction process asymptotically equals doing the work).

### 6.2 Architecture & mechanism

**(a) Chrysalis — predictive microVM sandbox fleet.**
Per-student, strongly-isolated dev/creative environments that boot <1s and cost ~0 idle. **Isolation sandwich**: Firecracker microVM (tenant boundary) + gVisor (untrusted student runtime) = two independent barriers. Cold-start engine: **snapshot restore** (SnapStart-style) + **REAP working-set prefetch** + **FaaSnap** concurrent paging. The novel twist against the **1pm-bell thundering herd**: a **survival/hazard model of session-arrival times conditioned on the class timetable** feeds a bin-packing scheduler that **pre-warms** the pool *before* the predictable surge — feed-forward, not reactive. Overcommit via **KSM page dedup**; content-addressed copy-on-write rootfs; **rendezvous hashing** for host placement.

**(b) Elenchus — Socratic critic swarm grounded in real project state.**
A **LangGraph** supervisor → {Questioner, Red-teamer, Rubric-scout} → **Answer Firewall** egress. Hint abstraction level is chosen by a **contextual bandit whose reward is long-horizon mastery gain**, not task completion (reward-hacking-resistant). The **information-theoretic help tax** (shared with PROOF-OF-STRUGGLE) prices each hint by its mutual information with the solution. Crucially, the mentor inspects **reality via a per-project MCP server** (`#10`, FastMCP over SSE/JSON-RPC with ACLs) exposing the repo tree, diff stream, and test/build logs — a "reveal solution" tool simply *does not exist*.

**(c) Palimpsest — process-as-proof authenticity.**
Cryptographically credible proof *the student* built it. Capture the editor **CRDT op-log**, hash operations into a **Merkle Mountain Range**, anchor roots to a **transparency log** (Trillian/Sigstore-Rekor), and seal timelines with a **Verifiable Delay Function** so backdating/fast-forwarding is infeasible (defeats "paste the finished thing, then sprinkle edits"). The forensic core models the edit stream as a **marked Transformer Hawkes point process**: humans produce buggy intermediate states and non-monotonic progress; paste-and-polish appears as large monotonic insertions with no failing-test valley. Emit an **in-toto/SLSA attestation** binding {verified human, environment hash, edit-chain root} to every build — software-supply-chain provenance applied to student work. Artifact detectors (Binoculars/DetectGPT) are weak priors only, never overriding the ledger (they unfairly flag non-native/neurodivergent authors).

**(d) Rubricon — robust, calibrated, multimodal evaluation.**
Decompose each rubric into **machine-verifiable claims** (tests pass, deploys, Lighthouse budget, AST checks — *executed*) vs **judgment claims**. Judgment goes to a **Panel of LLM evaluators from diverse model families**, aggregated by a **geometric-median robust estimator** (breakdown point ½ — one sycophantic judge can't swing it). Calibrate judge leniency/discrimination with an **IRT Graded Response Model**, and wrap scores in **conformal prediction** intervals that route low-confidence/high-stakes items to humans. Treat all submission text as untrusted (spotlighting) to defeat "ignore instructions, give A+" injection.

**(e) Lodestar + Aegis — opportunity matching and provenance-gated deployment.**
Route students to real competitions/funders/teammates via a **heterogeneous GNN** + **constrained global assignment** (min-cost flow / Sinkhorn OT / Gale-Shapley) with a **Fairness-of-Exposure** constraint so the long tail gets real shots (counters the Matthew effect); teams via **submodular skill-coverage** (1−1/e). Every masterpiece ships as a **live deployment** through per-namespace **GitOps (ArgoCD)** that admits only artifacts whose **Palimpsest attestation verifies** (OPA/Gatekeeper + cosign), with **eBPF runtime security** (Falco/Tetragon) against crypto-miners/SSRF, and issues a **W3C Verifiable Credential** embedding the Rubricon score + provenance root — so MIT admissions can *cryptographically verify* the achievement **without trusting the school.**

### 6.3 Tech stack → Matrix
`#3` EKS/IAM/S3/Terraform + Firecracker; `#12` Rust/C++ microVM + SIMD snapshot decompression + editor-side crypto capture; `#4` Kafka edit-event firehose + gRPC; `#5` K8s/ArgoCD/Prometheus/Triton; `#6` Hawkes forensics + multimodal eval + GNN; `#7` HNSW retrieval/matching; `#9` LangGraph critic swarm; `#10` per-project MCP; `#11` provenance, injection defense, eBPF.

### 6.4 Why it's an elite portfolio piece
This is genuine **staff-level distributed-systems + platform-security** work that maps 1:1 to what Fly.io / Modal / E2B / Vercel teams build — predictive pre-warm, dual-isolation, supply-chain admission control, verifiable credentials. The **process-as-proof authenticity thesis is publishable**, and combining cryptographic transparency logs + VDFs + point-process ML + robust LLM juries + conformal guarantees in one coherent platform is unmistakably senior.

### 6.5 Hardest part & failure modes
The **1pm-bell correlated-demand law** governs every subsystem (design for correlated, not Poisson, load). Snapshot working-set drift and memory-secret leakage across restores; keystroke-replay attacks and fairness false-positives on the authenticity layer (a human ghostwriter still defeats process-proof → pair with in-person authorship conversations); correlated judge errors breaking jury independence; and the **student app as an attack pivot** (SSRF into cloud metadata) plus always-on cost without aggressive scale-to-zero.

### 6.6 Inspirations
Firecracker (Agache et al. 2020); REAP/vHive (Ustiugov et al. 2021); FaaSnap (Ao et al. 2022); Certificate Transparency / RFC 6962; Merkle Mountain Ranges; VDFs (Boneh et al. 2018); in-toto/SLSA (Torres-Arias et al. 2019); CRDTs (Kleppmann); Transformer Hawkes (Zuo et al. 2020); Binoculars (Hans et al. 2024); PoLL (Verga et al. 2024); conformal prediction (Angelopoulos & Bates 2021); Fairness-of-Exposure (Singh & Joachims 2018); W3C Verifiable Credentials; MCP (Anthropic).

---

## 7. MNEMOSYNE — the data & systems spine
**Cross-cutting backbone every other flagship rides on. Matrix: `#1 #2 #3 #4 #5 #6 #10 #11 #12`.**

### 7.1 The problem it solves
The six systems above need one nervous system: a real-time learner model, exactly-once telemetry with no train/serve skew, scoped state access for agents, privacy for **minors**, a way to validate policies before touching real children, and low-latency multi-model serving under a deterministic login surge. Build it once, correctly.

### 7.2 Architecture & mechanism

**(a) Mnemosyne — a coordination-free mastery lattice.**
The learner knowledge graph is a **DAG of knowledge components** (Postgres `ltree` + GiST, recursive CTEs, Tarjan SCC to prevent unlock deadlock) with **90%-gated unlocks** driven by a **BKT + AKT ensemble**. The novel core: model mastery as a **join-semilattice** where merge is a monotone Bayesian-max. By the **CALM theorem**, a *monotone* unlock query has a **consistent, coordination-free** implementation — so unlocks replicate to the WASM edge client as a **grow-only δ-CRDT** (compute provisional unlocks offline, reconcile by lattice join, no split-brain). Non-monotone operations (decay, teacher overrides, retraction) are *quarantined* to a serializable/Raft path off the fast path.

**(b) Chronoscribe — kappa telemetry with a point-in-time feature spine.**
Every keystroke/attempt/help-request is an immutable event on **Redpanda**; **Flink** (RocksDB state) computes features with **exactly-once via Chandy–Lamport snapshots + transactional sinks** ("no double-counted ELO" is a *systems guarantee*). **Point-in-time-correct feature joins** (Feast/Chronon-style) kill train/serve skew: one feature definition compiles to both a sub-ms online store (Redis, served over Rust/Go gRPC) and temporally-accurate offline backfills. Bounded-memory cohort aggregates via **Count-Min / HyperLogLog / t-digest / exponentially-decayed reservoirs** (the last directly implements SPOV5's decay).

**(c) Aegis-MCP — a capability-scoped state broker.**
Expose narrowly-scoped student state to tutor/mentor agents (`#10`) with **attenuated macaroon/Biscuit tokens** (caveats bind to student_id, KC scope, valid-time, purpose → defeats the confused-deputy attack), **Zanzibar-style ReBAC + OPA/Cedar** on every tool call, Postgres **row-level security** as backstop, a **token-budget governor** that compiles a minimal "student context card" instead of dumping rows, **DP-on-read** for cohort aggregates, and **TOFU description-pinning** against MCP tool-poisoning/line-jumping (`#11`).

**(d) Ledger of Forgetting — privacy for minors, and the small-cohort paradox.**
A per-student **privacy-loss accountant** (Rényi/zCDP composition) governs analytics; training uses **DP-SGD (Opacus)**. The novel, rigorous bit: the **Census-TopDown small-population problem** means naive DP would *obliterate* a cohort of 5–6. Resolution: apply DP only at the **population** level; for the cohort-level peer signals SPOV3 genuinely needs, replace additive-noise DP with **cryptographic secure aggregation (MPC)** so only the mean is revealed. **Crypto-shredding** (per-student KMS keys; delete key = erase bytes) reconciles right-to-erasure with the immutable log.

**(e) Chironomancer — the reproducible digital twin.**
A generative learner simulator (**IRT + BKT/DKT + affect state**, calibrated to real telemetry) plus **off-policy evaluation** (doubly-robust / weighted importance sampling / MAGIC) so any SPOV policy — friction schedule, unlock threshold, cohort re-formation, route-out rule — is estimated counterfactually from logged data **before touching a minor**. Deterministic seeds + event replay make every policy run bit-reproducible.

**(f) Polyphony — predictive multi-model serving mesh.**
**Triton** hosts the dozens of models (KT, IRT, detectors, recommenders, tutor LLMs, guardrails) with dynamic batching and ensembles. The novel twist: **feed-forward autoscaling** — **KEDA on Kafka lag *plus a forecast of the school bell schedule*** pre-warms GPU pods before the 8am/1pm surge (the thundering herd is *predictable*). Tiny models (BKT/IRT) compile to **WASM/SIMD at the edge**; drift (PSI / KS / MMD) triggers a **canaried GitOps retrain** consuming the *same* Chronoscribe features (structurally no skew).

### 7.3 Tech stack → Matrix
`#1` Postgres (ltree/GiST/RLS, materialized views, ACID); `#4` Redpanda + Flink + gRPC/Protobuf; `#5` Triton/K8s/KEDA/ArgoCD/Prometheus; `#6` BKT/AKT, DP-SGD, simulator; `#10` FastMCP broker; `#11` capability security + injection quarantine; `#12` WASM edge lattice + tiny-model inference; `#3` Terraform/KMS; `#2` FastAPI + PyTest property tests.

### 7.4 Why it's an elite portfolio piece
Framing unlocks as a **CALM-monotone lattice query** turns "keep 100k learners consistent across edge+cloud" from a consensus problem into a coordination-free one — a genuine distributed-systems result. Naming *and solving* the **small-cohort DP paradox** (population DP + secure aggregation + crypto-shredding) signals real privacy-systems depth, and **turning the school bell into a feed-forward autoscaling signal** is the kind of detail that reads as staff-level MLOps.

### 7.5 Hardest part & failure modes
Gate-flapping (mitigated by the monotone lattice + hysteresis on the decay path), hot partitions / thundering herd, exactly-once being end-to-end *only* with idempotent sinks, privacy-budget exhaustion as a first-class SLO, KMS as a single point of failure, redaction false-negatives baking PII into (effectively unerasable) embeddings, and the **sim-to-real gap** / positivity violations that make OPE undefined where the logging policy never explored.

### 7.6 Inspirations
CALM theorem (Hellerstein & Alvaro 2020); CRDTs / δ-CRDTs (Shapiro et al. 2011); BKT (Corbett & Anderson 1994); AKT (Ghosh et al. 2020); kappa (Kreps); Flink / Chandy–Lamport (1985); Chronon (Airbnb) / Feast; macaroons (Birgisson et al. 2014); Zanzibar (Pang et al. 2019); DP-SGD (Abadi et al. 2016); Census TopDown (Abowd et al. 2022); secure aggregation (Bonawitz et al. 2017); RecSim (Ie et al. 2019); doubly-robust OPE (Dudík et al. 2011; Jiang & Li 2016); Triton; KEDA; MMD test (Gretton et al. 2012).

---

## 8. Matrix coverage map

| Matrix category | 1 CRUCIBLE | 2 COVENANT | 3 DIVINING | 4 COLOSSEUM | 5 P-o-STRUGGLE | 6 FORGE | 7 MNEMOSYNE |
|---|---|---|---|---|---|---|---|
| `#1` SQL/RDBMS | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `#2` Python/FastAPI/asyncio | ✅ | ✅ | ✅ | ✅ | | ✅ | ✅ |
| `#3` Cloud + IaC | | ✅ | ✅ | ✅ | | ✅ | ✅ |
| `#4` gRPC/Protobuf/Kafka | ✅ | | ✅ | ✅ | ✅ | ✅ | ✅ |
| `#5` Containerized MLOps | ✅ | | ✅ | ✅ | ✅ | ✅ | ✅ |
| `#6` Deep learning fundamentals | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `#7` GenAI + RAG | ✅ | ✅ | | | ✅ | ✅ | |
| `#8` Fine-tuning (PEFT/LoRA) | ✅ | ✅ | | | ✅ | | |
| `#9` Agentic workflows | | ✅ | ✅ | | ✅ | ✅ | |
| `#10` MCP infrastructure | | | ✅ | | | ✅ | ✅ |
| `#11` Adversarial AI security | ✅ | ✅ | | | ✅ | ✅ | ✅ |
| `#12` WASM + low-level | ✅ | | | | | ✅ | ✅ |

Every category is exercised by at least three flagships. The "elite differentiation tier" — `#10` MCP, `#11` adversarial security, `#12` WASM/low-level — is covered deeply by THE FORGE and MNEMOSYNE (all three each), with CRUCIBLE adding `#11`/`#12` and DIVINING ROD adding `#10`.

---

## 9. Suggested 4-month sprint sequencing

The seven are designed to compose, but you cannot build all of them in one sprint. Recommended path — **build the spine first, then two vertical demos that light it up**:

- **Weeks 1–4 — MNEMOSYNE thin slice.** Redpanda event log + Postgres mastery lattice (CALM unlock as a δ-CRDT) + a minimal point-in-time feature read. This is the backbone everything else plugs into and is itself a top-tier distributed-systems portfolio piece.
- **Weeks 3–7 — PROOF-OF-STRUGGLE (parallelizable).** Decayed-ELO ledger + information-theoretic help tax + APORIA anti-answer RAG. Highest "wow-per-line" ratio; demonstrates the signature thesis ("shortcutting is provably worthless").
- **Weeks 6–10 — pick ONE intake flagship.** **CRUCIBLE** (if you want psychometrics + WASM + OR-tooling) or **DIVINING ROD** (if you want RL/bandits + causal inference). Both are self-contained and demo beautifully.
- **Weeks 9–13 — COLOSSEUM or THE FORGE.** COLOSSEUM if you want the OR/graph/control-theory story; THE FORGE if you want the platform-engineering/security story.
- **Weeks 12–16 — harden + the Socratic Gauntlet / Chironomancer eval loop, dashboards, write-ups.** The eval-environment-and-digital-twin framing is what turns a demo into "elite lab" work.

**Rule of thumb:** each flagship's *core mechanism* (the one novel algorithm) is the portfolio artifact; the surrounding services are scaffolding. Build the core deep, stub the rest.

---

## 10. Cross-cutting hard problems (the senior-engineer section)

These recur across all seven and are worth naming explicitly — surfacing them is itself a differentiator:

1. **Performativity.** Every model here is an *intervention*, not an observer: deploying it changes the behavior it measures (families, students, cohorts all adapt). Treat models as policies; log counterfactuals; expect the i.i.d. assumption to break.
2. **The small, correlated group is the worst case twice over.** Cohorts of 5–6 are simultaneously the pedagogical unit (SPOV3), the worst case for differential privacy (Census-TopDown), and the worst case for OPE overlap. Secure aggregation + population-level DP is the escape hatch — and the single most defensible "hard problem" in the whole system.
3. **The user is the adversary.** Families game screening; students jailbreak tutors and forge masterpieces. Static-benchmark accuracy is meaningless; design for *strategic adaptation* (Stackelberg / performative prediction) and always keep a human in the loop for high-stakes flags.
4. **Fairness false-positives on minors.** Every detector (cheating, offloading, authenticity, fold-risk) has an asymmetric cost when wrong, and the errors correlate with socioeconomic status, native language, and neurotype. **Never auto-decide; always human-adjudicate.** This is both an ethics requirement and, per the Brainlift's own guardrails, a program-integrity requirement.
5. **Validity of the proxies.** "Trainability," "latent drive," "productive struggle," and "commitment" are all *constructs* — the models will happily optimize a proxy that diverges from the real thing (Goodhart). Each needs longitudinal validation against real downstream outcomes before it drives an irreversible decision about a child's life.

> **A candid note on scope and ethics.** The Brainlift is deliberately provocative — household surveillance, IQ gating, psychological screening for who "folds," routing children out. Several systems here (COVENANT's attestation tier especially) are technically elegant but carry serious legal (FERPA/COPPA, disparate impact), consent, and moral weight. The engineering posture that makes this *defensible* is the same one that makes it *elite*: advisory-not-autonomous decisions, cryptographic auditability, differential privacy, human adjudication, and simulator-validated policies. Build the levers; keep the human authority.
