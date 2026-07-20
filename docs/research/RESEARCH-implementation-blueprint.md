# gt100k — Implementation Blueprint: Mapping the Brainlift to the PRD

*Deep-research synthesis · Round 1 generated 2026-07-17 (26 sources, 25 claims verified, 23 confirmed) · **Round 2 refinement 2026-07-17** builds on Alpha School's 2-Hour Learning model (22 sources, 25 claims verified, 24 confirmed, 1 refuted).*

This document answers: **how do you build the gt100k program (MIT-level readiness — SAT 1570+, 5s on AP Calc BC / Physics C / English Lit, by end of 8th grade, for 100,000 students) as a production software/ML platform**, mapping each of the brainlift's 5 pedagogical pillars onto the engineering stacks named in `PRD.md`.

> **Deliverable scope.** This is an architecture/implementation blueprint, not a debate about the program's ethics. It flags honestly which layers are *evidence-backed* (2024–2026 primary sources) versus *standard engineering work still to be designed*.

> **Round-2 decision (delivery backbone).** gt100k adopts **Alpha School's "2 Hour Learning" model** as its delivery structure. **[Part 0](#part-0--building-on-the-alpha-2-hour-model-round-2-refinement)** is the new, load-bearing section: what of Alpha is verified-and-reusable, what is marketing, the *reconciled* tension between Alpha's frictionless UX and gt100k's "friction as product," and the single strongest architectural pattern that surfaced. Parts 1–5 below (the original pillar-by-pillar mapping) still hold and are refined by Part 0 — read Part 0 first.

---

## TL;DR — what the evidence supports

The **tutor-and-mastery layers are strongly buildable today** with current applied-GenAI and knowledge-tracing techniques. The **platform layers (MLOps, backend, IaC, security/compliance) are standard engineering** — real, but not substantiated by the surviving research claims, so treat those sections as *untested design*, not evidenced fact.

| Brainlift pillar | PRD domain(s) | Evidence status |
|---|---|---|
| **0 — Alpha 2-hr delivery backbone** | Delivery structure, staffing, mastery gate | **Structure verified**; efficacy claims **self-reported/marketing** (see [Part 0](#part-0--building-on-the-alpha-2-hour-model-round-2-refinement)) |
| 5 — Friction-as-product Socratic tutor | Applied GenAI / RAG, Fine-tuning (PEFT/LoRA), Agentic workflows | **Strong** (primary, 2024–2026); Alpha tutor UX must be **replaced** |
| 4 — Mastery-gated narrow spine (90% gate) | Deep learning / ML fundamentals; knowledge-graph + spaced retrieval | **Strong** (KT taxonomy + PFAE update rule) |
| 3 — Homogeneous cohorting (ELO, regrouping) | Data/backend, algorithmic matching | **Partial** — ELO rating evidenced; the *decayed-reward* variant is gt100k's own extension |
| 2 — Cognitive-floor gating (IQ ~120–125) | Data/backend, psychometric intake | **Not researched** (out of scope of surviving claims) |
| 1 — Family fidelity tracking (8-yr) | SQL, backend, compliance | **Not researched**; identity/behavioral-data separation pattern noted |
| Serving @ 100k | Docker→K8s→CI/CD, Triton/vLLM, HPA, Prometheus/Grafana | **Not substantiated by surviving claims** — standard engineering |
| PII / minors' data | Terraform/IaC, IAM, FERPA/COPPA | **Not substantiated** — standard compliance work |
| Anti-jailbreak guardrails | OWASP LLM Top 10, Llama Guard / NeMo | **Partial** — threat confirmed real; mitigations are known but unproven for this use |

---

## Part 0 — Building on the Alpha 2-Hour Model (Round-2 Refinement)

> **Bottom line up front.** Alpha's *delivery structure* is verified and directly reusable as gt100k's backbone. Alpha's *efficacy numbers* are marketing, not evidence, and gt100k cannot borrow them. Alpha's *frictionless, engagement-maximizing tutor UX is fundamentally incompatible with gt100k's "friction as product" and must be replaced, not extended.* The research surfaced one dominant architecture pattern that resolves the tension — **decouple an interpretable decision layer from an LLM that only renders the chosen action** — turning friction into guaranteed constraints rather than model discretion.

### 0.1 What is VERIFIED about Alpha (reusable backbone)

Independently corroborated well beyond Alpha's own marketing — CBS, CNN (Jan 2026), The 74, Texas Standard, Block Club Chicago (Mar 2026), Newsweek, Wikipedia, and the non-partisan Astral Codex Ten parent review all describe the *identical* model:

- **~2-hour app-based adaptive academic block**, **Pomodoro-timed** (25-min focus blocks), followed by afternoon life-skills / arts / sports / project workshops.
- **Mastery gate at ~90% accuracy**, with **ZPD tuning** (>85% correct → too easy, <70% → too hard) — this is essentially gt100k's stated 90% node-unlock gate, already field-operationalized.
- **Adults are "guides," not subject teachers** — they do motivation, coaching, and supervision; the software is supposed to "provide that tutoring experience" (co-founder MacKenzie Price). Low subject-expertise staffing is what makes the ~100k-scale staffing math plausible.

**Reusable for gt100k as-is:** the daily structure, the 90%+ZPD mastery gating, and the guide-not-teacher staffing model. These are the delivery spine.

### 0.2 What is SELF-REPORTED / marketing (do NOT build on as evidence)

- **"2.6x average / 6.5x top MAP growth," "top 1–2% nationally," "2x faster"** are **internal, unaudited, non-peer-reviewed**. The numbers **drift across Alpha's own materials** (2.0x/2.3x/2.4x/2.6x average; 4x vs 6.5x top).
- **Massive selection confound:** ~**$40k+ tuition** draws affluent, motivated, TV-free-ish families — outcomes can't be attributed to the model. **gt100k's IQ ~120–125 floor is an even *stronger* explicit selection mechanism**, so gt100k *especially* cannot cite Alpha's numbers as proof its far-more-extreme MIT-readiness bar is reachable.
- **Tech stack is in flux (time-sensitive):** the 2025 "adaptive AI" was **substantially static / pre-generated third-party apps** (IXL, Khan, MobyMax); **IXL formally ended its Alpha relationship in July 2025**; dynamic AI generation was still *"planned for 2026."* Treat "adaptive AI" in Alpha's marketing as partly aspirational — **gt100k must build the real adaptive+AI-tutor layer itself.**

### 0.3 The central tension — RECONCILED

Alpha optimizes **engagement and extrinsic incentives (points, rewards, gamification)** → a **low-friction** UX. gt100k's SPOV-5 is the opposite: **friction is the product.** These do not compose. The research makes the reconciliation concrete and quantitative:

- **Base/RLHF'd LLMs leak answers by default** — they're optimized for user satisfaction, not teaching. Untuned Qwen2.5-**72B leaked full solutions 61.0%** of the time; DeepSeek V3 **46.6%** — even when prompted not to (arXiv 2505.15607; corroborated ACL Findings 2025). **So an Alpha-style engagement-maximizing tutor cannot produce answer-withholding — the tutor layer must be replaced, not extended.**
- **The friction knob is trainable.** Online multi-turn **RL (GRPO)** on a **7B open model** (Qwen2.5-7B) with reward `r = r_sol + (r_ped − 1)·λ`: at **λ=1.5, solution leakage dropped to 5.4%** *while student solve rate improved +21.2%*. λ is literally the friction/success dial SPOV-5 describes.
- **The cost is real and must be accepted by design.** In the StratL field study (n=17), the answer-withholding tutor produced **~2.6 vs ~1 student-generated solution methods** (p=.05) **but was rated less helpful (1.20 vs 2.00 / 3)** — "PF tutoring can be frustrating." gt100k is deliberately choosing the *lower-satisfaction, higher-learning* target — the inverse of Alpha's optimization. (Caveats: tiny N; helpfulness gap descriptive, not significance-tested.)

**Motivation-architecture implication (open question):** gt100k inherits Alpha's *structure* but must decide how gamified extrinsic rewards interact with deliberate difficulty and the DECAYED-ELO shortcut penalty — do they cancel or compound? No verified source resolved this; it needs a live A/B.

### 0.4 The dominant architecture pattern (strongest round-2 finding)

**Decouple an interpretable decision layer from an LLM renderer.** Two convergent primary sources:

- **StratL** (ACL 2025 Findings, arXiv 2410.03781): an LLM classifies student state each turn (mistake type, request, emotion) → an **expert-authored transition graph** maps state → tutoring intent (scaffold vs. problematize) → *only then* is the LLM prompted.
- **ES-LLMs** (arXiv 2603.23990, Mar 2026): a **deterministic rules-based orchestrator guided by an interpretable BKT student model** picks the action; the **LLM only surface-realizes it**, so strategy is "never overridden by generative fluency." Enforcing **attempt-before-hint** and **hint caps as explicit rules → 100% constraint adherence, ~3.3× hint efficiency** vs a monolithic tutor. *(Caveat: Monte-Carlo simulation, N=2,400 simulated learners, non-peer-reviewed; 100% adherence is by-construction, not a real-student outcome.)*

> **For gt100k this is the keystone:** engineer answer-withholding + the DECAYED-ELO friction as **hard rules in a deterministic orchestrator**, not as instructions the LLM may or may not obey. The LLM renders; the control layer decides. This maps cleanly onto gt100k's two pillars — the interpretable ~90% mastery gate (BKT) *and* the answer-withholding Socratic tutor — under one architecture.

### 0.5 Mastery engine — refined for auditability + fairness

Round 1 said "prefer interpretable KT (BKT/PFAE) for the gate." Round 2 sharpens this and adds a **hard warning**:

- **PFA > BKT** for the gate: PFA (Pavlik/Cen/Koedinger, AIED 2009) beat BKT on LL/BIC/r/A′ across all 4 datasets with fewer parameters, and **fixes BKT's core flaw** — BKT's Markov assumption over-weights a single failure as "skill unlearned," whereas PFA's `ρ` scaling adjusts gradually.
- **IKT** (AAAI-22, arXiv 2112.11209): three interpretable latent features (skill mastery, ability/transfer, difficulty) + a Tree-Augmented Naïve Bayes classifier → explainable diagnostic/prognostic gating.
- **⚠ Fairness landmine (peer-reviewed, EDM 2025, n=8,549 on Carnegie Learning MATHia):** aggregate BKT bias is small, but a **skill-level audit found 36 of 50 math skills biased against emerging readers, with mastery-prediction gaps up to 26%** ("apply exponent"), driven by **unmodeled reading ability**. A naïve BKT gate would **systematically mis-gate weaker readers.** gt100k must **audit the gate per-skill** and model reading ability as a covariate — non-negotiable given a hard 90% gate on minors.

### 0.6 AI-tutor layer — refined fine-tuning strategy

- **QLoRA imitation alone is the weaker regime.** ConvoLearn (Stanford, arXiv 2601.08950) QLoRA-tuned Mistral-7B on ~1,250 dialogues rated *comparable to* Claude Sonnet 4.5 (M=3.49 vs 3.56, p=.583 — a *failure to reject*, not proven equivalence) but **Gemini 2.0 Flash beat both** (3.82), attributed to "**LearnLM's pedagogy-informed post-training at scale** being a fundamentally different regime from imitation fine-tuning." Also: ConvoLearn is *dialogic*, **not** answer-withholding Socratic — it does **not** validate friction-as-product.
- **Recommended stack:** **QLoRA imitation *plus* RL answer-withholding tuning** (GRPO, per 2505.15607), not imitation alone — to both match pedagogy-post-trained quality *and* get the trainable λ friction knob.

### 0.7 Adversarial hardening — mandatory given the DECAYED-ELO incentive

gt100k's cohorts are in **direct competition** and its ELO rewards **actively incentivize shortcutting** — so students *will* try to extract answers. This is now a named research area:

- **arXiv 2604.18660** (EPFL, ACL 2026 Main): fine-tunes an **adversarial student agent that reliably jailbreaks LLM tutors** (in-context adversaries "often fail"; a *trained* one succeeds), ships a **standardized robustness benchmark** (GitHub `epfl-ml4ed/tutor-robustness-eval`), and shows **simple defenses measurably cut answer leakage.**
- **Build the tutor against this benchmark from day one.** Answer-withholding that survives only well-intentioned students is worthless when the incentive structure rewards extraction. Combine with the deterministic control layer (0.4) — the orchestrator's hard rules are harder to jailbreak than a system prompt.

### 0.8 gap analysis — reusable vs. must-build

| Alpha component | gt100k action | Why |
|---|---|---|
| 2-hr block + Pomodoro + afternoon workshops | **Reuse** | Verified structure; plausible staffing math |
| 90% mastery gate + ZPD tuning | **Reuse + harden** | Matches gt100k gate; add per-skill fairness audit (0.5) |
| Guide-not-teacher staffing | **Reuse** | Scales to 100k; software carries instruction |
| Third-party adaptive apps (IXL/Khan) | **Replace** | IXL exited; build own interpretable KT engine (PFA/BKT/IKT) |
| Engagement-maximizing, answer-giving tutor UX | **Replace** | Incompatible with friction-as-product; leaks answers by default |
| Gamified extrinsic incentives | **Redesign** | Must reconcile with deliberate difficulty + decayed-ELO (open Q) |
| (absent) IQ ~120–125 floor | **Add** | gt100k's own pillar; stronger selection than Alpha's tuition |
| (absent) homogeneous 5–6 competitive cohorts | **Add** | gt100k's own pillar; ELO-matched (Part 3) |
| (absent) narrow quant+verbal spine | **Add** | gt100k's own pillar; vs Alpha's full-curriculum breadth |
| (absent) adversarial answer-extraction defense | **Add** | Mandatory given decayed-ELO incentive (0.7) |

---

## Pillar 5 — The Friction-as-Product Socratic Tutor

This is the pillar with the deepest evidence base and the one that most directly maps to the PRD's *Applied GenAI / RAG*, *Fine-tuning*, and *Agentic workflow* sections.

### 5.1 The core problem is real and named in the literature

Base LLMs **default to delivering information, not guiding learning** — the exact behavior the friction mechanic must override. LearnLM (Google DeepMind, Dec 2024) states it verbatim: *"generative AI systems are tuned to present information by default, rather than engage users in service of learning as a human tutor would."* Frontier general models exhibit precisely the failure mode gt100k must prevent — a June 2026 study found *"GPT-5 responses often reveal the full solution and final answer to the student… it leaves little room for further student engagement."*

**Design implication:** answer-refusal is not a default you get for free; it must be *engineered* at three composable layers (prompt → fine-tune → RL), strongest when combined.

### 5.2 Layer 1 — System-prompt constraint (cheapest, weakest)

A pedagogically-tuned model can be constrained by a strict system prompt to run an answer-refusing Socratic dialogue. The Eedi RCT (arXiv 2512.23633, Nov 2025) used *"a strictly defined system prompt instructing the model to draft a concise, Socratic response aimed at guiding the student to self-correct their specific misconception without revealing the answer."* `NEVER reveal the direct answer` is a corroborated standard Socratic-prompt constraint across multiple papers.

- **Recipe:** confirm the correct answer *only upon valid Socratic resolution*; otherwise guide self-correction.
- **Caveat (critical):** prompt-only refusal is **jailbreakable** (arXiv 2604.18660) and students bypass it cheaply — this is why Layers 2–3 and the ELO enforcement layer exist.

### 5.3 Layer 2 — Fine-tune a small open model (the PRD's PEFT/LoRA/QLoRA section)

Fine-tuning a **7–8B open model** cheaply specializes a Socratic tutor and can **match or beat frontier models** on human-judged tutoring quality:

- **SocraticLM** (NeurIPS 2024 Spotlight) — Qwen2.5-Math-7B / ChatGLM fine-tuned on the **35K-dialogue SocraTeach corpus** (built via a Dean–Teacher–Student multi-agent pipeline). Beats GPT-4 by **>12%** on a 5-dimension pedagogy eval. Releasable model + corpus + eval. Its *"Thought-Provoking"* paradigm (vs passive *"Question-Answering"*) is the published academic framing of the friction pillar.
- **ConvoLearn / Mistral-7B** (Stanford, arXiv 2601.08950, Jan 2026) — QLoRA on a single A100 over a learning-sciences-grounded tutoring-dialogue dataset (2,134 dialogues, 6 dialogic dimensions). *(Note: one efficacy claim here — teachers rating it competitive with a proprietary baseline — was **refuted 1-2** in verification; treat its head-to-head quality as unproven.)*
- **Qwen3-8B, two-stage SFT+DPO** (MBZUAI, arXiv 2606.21502, 2026) — preferred over **GPT-5 in 54.3%** of human-judged math-remediation cases. *Thin margin (~10 raters, gold-solution-conditioned variant, 2-1 vote) — directional, not conclusive.*
- **PEFT tradeoff note:** Spectrum (SNR-based selective-layer FT) beat QLoRA on a math-tutoring fine-tune (58% vs 54% GSM8K @ 1 epoch) — worth benchmarking against QLoRA.

**Deployment tradeoff:** a fine-tuned 7–8B model is cheap to serve at 100k scale (fits commodity GPUs, quantizable) and removes per-token frontier-API cost — the economically decisive choice for this scale.

### 5.4 Layer 3 — RL makes friction a *tunable knob*

The strongest result for the friction mechanic: online RL with **simulated student–tutor interactions** can train a ~7B tutor to *strategically withhold answers*, with **a single controllable reward weight (λ)** tuning the answer-refusal-vs-helpfulness tradeoff **along a Pareto frontier** ("From Problem-Solving to Teaching Problem-Solving," ETH Zurich / TU Darmstadt, EMNLP 2025 Oral, arXiv 2505.15607; repo `eth-lre/PedagogicalRL`). TutorRL-7B reaches LearnLM-level quality **without human annotations** while preserving GSM8K/MATH reasoning.

> **This turns "how hard should help be to reach for" from a hard-coded rule into a single trainable parameter** — directly operationalizing SPOV-5's dial.

### 5.5 RAG + orchestration (the PRD's vector-DB / LangChain section)

- **Curriculum RAG:** chunk the mastery-gated curriculum, embed, store in a vector DB. On the pgvector-vs-Qdrant tradeoff: at 99% recall on 50M 768-dim embeddings, **Postgres/pgvector(scale) hit ~11.4× higher QPS than Qdrant** (471 vs 41 QPS), while **Qdrant had lower tail latency** at lower recall. For a single-store, FERPA-scoped platform, **pgvector co-located with the relational student data** is the pragmatic default.
- **Agentic tutor→critic→router loop:** validated as buildable — a multi-agent math-tutoring platform (Chudziak & Kostka, AIED 2025, arXiv 2507.12484) combines *adaptive Socratic agents, dual-memory personalization, GraphRAG textbook retrieval, and DAG-based course planning.* This is the existence proof for the "route backward if quality threshold not met" pattern (LangGraph/CrewAI-style), though the paper doesn't name those frameworks and is a feasibility demo, not an efficacy RCT.

### 5.6 How to evaluate the tutor (the PRD's Ragas/eval section)

Use **expert human-preference judgment across diverse scenarios** + **human-in-the-loop draft-approval rates** + **learning-transfer RCTs**:

- LearnLM: expert-preferred **+31% vs GPT-4o, +11% vs Claude 3.5 Sonnet, +13% vs base Gemini 1.5 Pro**.
- Eedi RCT (N=165 UK students): expert tutors accepted **74.4% of LearnLM's drafts with zero edits** (76.4% with ≤1-2 char edits); LearnLM-supervised students **+5.5pp more likely to solve a novel transfer problem** (66.2% vs 60.7%, 93.6% posterior probability of superiority).
- **Honesty caveat:** the +5.5pp CI is **[-1.4%, +12.4%] — it crosses zero** (small, exploratory, industry-authored). LearnLM measures overall pedagogy dimensions, not misconception-repair specifically. A "numerical-perturbation factuality gate" claim was **refuted 0-3** — do *not* build that gate on the strength of the cited paper.

---

## Pillar 4 — Mastery-Gated Narrow Spine (the 90% gate)

Maps to the PRD's *Deep Learning / ML fundamentals* plus a knowledge-graph + spaced-retrieval engine.

### 4.1 Choose the knowledge-tracing (KT) model deliberately

The KT literature (IEEE TLT 2024 survey, Shen et al.) defines **three families**:

1. **Bayesian** — BKT: a hidden Markov model with 4 interpretable per-skill scalars (prior `p₀`, learn/transition `T`, slip `S`, guess `G`); Corbett & Anderson 1994.
2. **Logistic** — LFA / **PFA** / KTM.
3. **Deep learning** — **DKT** (RNN/LSTM), DKVMN, AKT, GKT.

**The decisive tradeoff for a hard 90% node-unlock gate:** DKT is the most *predictive* but *cannot read out per-concept mastery from its hidden state* and *lacks interpretability*, whereas **BKT / PFAE expose the interpretable per-concept mastery a binary gate requires**.

> **Recommendation:** use an **interpretable model (BKT or PFAE, optionally HELP-DKT) for the gating readout**, even if a DKT-family model is used for prediction/recommendation elsewhere. *(Caveat: Khajah/Lindsey/Mozer 2016 showed extended BKT can match DKT — DKT's accuracy edge is not overwhelming.)*
>
> **Open question the research flags:** validate the 90% threshold against **false-unlock / false-lockout rates** before trusting it as a binary gate on minors' progression.

### 4.2 Spaced retrieval

Standard spaced-repetition scheduling sits on top of the per-concept mastery estimate; the mastery model gates node unlock, the scheduler decides *when* to resurface a mastered node for retention. *(The specific scheduling algorithm was not deeply evidenced in surviving claims — treat as standard, well-understood engineering.)*

---

## Pillar 3 — Homogeneous Cohorting & the Decayed-ELO Friction Math

Maps to the PRD's *SQL / data-backend* plus algorithmic matching.

### 3.1 The ELO engine has a published, directly-usable basis

**PFA Elo/Extended (PFAE)** (Pelánek et al.; IEEE TLT 2024 survey) gives a concrete per-interaction skill update:

```
on correct answer:  θ  +=  μ · (1 − p(θ))
on wrong answer:     θ  +=  ν · p(θ)
```

where `p(θ)` is the model's predicted probability of a correct response. The Elo framing — *"interpret a student's answer to an item as a match between the student and the item"* — jointly estimates **student skill and item difficulty** and has been validated for adaptive content recommendation in a live course. A **multivariate Elo** extension handles items tagged with multiple concepts (removes the one-concept-per-item limitation) — necessary for a real curriculum graph.

### 3.2 The decayed-reward-after-AI-rescue variant is gt100k's own extension

**Important:** the literature supplies the PFAE update rule and the per-concept mastery readout, **but not** the "decayed ELO reward after an AI rescue" mechanic. That is the program's *original design on top of* PFAE. The research flags it as an **open question**: formally specify the decay function, its interaction with cohort re-grouping, and whether making shortcutting "mathematically worthless" actually changes student behavior in a live trial. In the published formula, note the wrong-answer branch only *decreases* θ when `ν` is negative — a property to preserve when designing the decay.

### 3.3 Cohorting

Cohort formation/regrouping (matched groups of 5–6) is an algorithmic matching problem over the ELO ratings — standard engineering, not deeply evidenced. The rating layer above feeds it.

---

## Pillars 1 & 2 — Family Fidelity & Cognitive-Floor Gating

**Neither was substantiated by surviving research claims** — they are largely conventional data-platform and psychometric-intake engineering rather than novel ML. One relevant architecture pattern did surface for the data model:

- **Separate identity data from learning/behavioral data.** Represent learners with **internal IDs**, and keep real-identity mapping in a **dedicated identity service**. This directly informs the SQL schema for `students / cohorts / mastery_state / elo` and is a prerequisite for the COPPA/FERPA posture below.

The IQ ~120–125 floor gating (Pillar 2) and 8-year family-fidelity/contract tracking (Pillar 1) are intake + longitudinal-CRM problems on top of that schema.

---

## The Platform Layers — Standard Engineering, NOT Research-Backed Here

> The workflow's surviving verified claims **did not substantiate** the serving/MLOps, backend, IaC, or most of the security layers. What follows is drawn from the *fetched-but-not-verified* practitioner sources and should be treated as **design leads to validate**, not evidence.

### Serving / MLOps @ ~100k students (Docker → K8s → CI/CD → Triton/vLLM → HPA → Prometheus/Grafana)

The single most actionable *engineering* finding across the practitioner sources:

- **Default Kubernetes HPA does not work for LLM inference.** CPU stays flat (the GPU does the compute) and vLLM **pre-allocates GPU memory for the KV cache at startup**, so a pod serving 100 requests looks identical to an idle one. GPU utilization sits near 100% regardless of efficiency.
- **Autoscale on queue depth, not CPU/GPU util.** Use **vLLM's `num_requests_waiting`** via **KEDA**, or Triton+TensorRT-LLM's **`triton:queue_compute:ratio`** (queue-to-compute ratio) — hardware- and model-independent.
- **vLLM** (PagedAttention + continuous batching) is the recommended inference engine for high GPU utilization; **Triton+TensorRT-LLM** has NVIDIA's canonical K8s autoscaling reference architecture.

*Everything else in this domain (multi-stage Docker builds, GitHub Actions GitOps, Grafana dashboards, drift monitoring) is conventional and unevidenced here — build to PRD spec and measure.*

### Backend (SQL + async FastAPI + gRPC/Protobuf + Kafka)

Not substantiated by surviving claims — standard engineering. The identity/behavioral-data separation pattern (above) is the one research-informed constraint on the schema. Real-time learning-event telemetry over gRPC/Kafka is a conventional event-streaming design.

### Cloud / IaC (Terraform, multi-AZ, IAM least-privilege) + FERPA/COPPA

Not substantiated by surviving claims. One current compliance note that did surface: **the 2025 COPPA amendments shifted the default consent model from opt-out to opt-in** — vendors must obtain and document **explicit parental consent**. Given the platform handles minors' *psychometric + educational* data, treat data-residency, consent records, and least-privilege IAM as first-class requirements, not add-ons.

### Adversarial security & guardrails (OWASP LLM Top 10, Llama Guard / NeMo)

Partially evidenced — the **threat is confirmed real and specific to this design**:

- **The adversary is the student**, trying to extract full answers/solutions — an "answer-extraction" threat that is exactly the failure mode that breaks the friction mechanic. **Prompt injection is OWASP's #1 LLM risk (LLM01:2025).**
- **There is no fool-proof prevention** for prompt injection (it stems from how LLMs process input), and **RAG + fine-tuning do NOT fully mitigate it** — so answer-refusal **cannot be treated as a guaranteed guardrail**; it must be defended in depth.
- **Mitigation lead:** **LlamaFirewall** (Meta, open-source, arXiv 2505.03574) layers PromptGuard 2 + AlignmentCheck + CodeShield in production — applicable to catching answer-leaking injections at the gateway. Llama Guard / NeMo Guardrails are the other named options.

> **Architecturally decisive consequence:** because the tutor prompt is jailbreakable *and* students bypass scaffolding cheaply (see below), the friction mechanic **depends on the DECAYED-ELO penalty as the real enforcement layer** — making shortcutting *mathematically worthless* is what the prompt alone cannot guarantee.

---

## The One Finding That Should Reshape the Design

The most important deployment reality, verified 3-0 across two independent sources (Stanford, arXiv 2606.15766, 9,490 chats across 9 datasets; and arXiv 2604.23486 "Your Students Don't Use LLMs Like You Wish They Did"):

> **Real students show substantially lower uptake of tutor scaffolding than benchmarks assume, and routinely bypass pedagogical framing** — by rephrasing or just asking directly for the answer — **at little interpersonal cost.**

This **both validates and warns** the friction pillar:
- **Validates it:** frictionless tutoring fails in the wild exactly as SPOV-5 predicts; students take the easy path when offered.
- **Warns it:** answer-refusal *alone is insufficient*. The tutor prompt will be bypassed. The **decayed-ELO enforcement layer is not optional polish — it is the mechanism that actually holds the friction in place.** Build and instrument it as a first-class subsystem, and A/B test whether "mathematically worthless shortcutting" changes real uptake.

---

## Open Questions the Research Could Not Close

1. **Serving/MLOps cost & latency envelope** for a ~100k-student live tutoring endpoint (Triton/vLLM, KEDA autoscaling, drift monitoring, CI/CD) — no surviving claim addressed it end-to-end.
2. **Robustness of answer-refusal at scale** — tutors are demonstrably jailbreakable and students bypass framing; does coupling refusal with the decayed-ELO penalty *actually* deter shortcutting in a live trial?
3. **KT model choice + calibration for a hard 90% gate on minors' data** — can an interpretable model deliver DKT-level accuracy *and* reliable per-concept readout, and how is 90% validated against false unlock/lockout?
4. **Formal spec of the decayed-reward-after-AI-rescue ELO** on top of PFAE — decay function, interaction with cohort regrouping, and measured behavioral effect.

---

## Recommended Build Order (evidence-weighted, Alpha-backbone refined)

0. **Adopt the Alpha delivery structure** — 2-hr Pomodoro block + afternoon workshops + guide-not-teacher staffing + 90%/ZPD mastery gate. Verified and reusable; this is the frame everything else drops into. Do **not** reuse Alpha's tutor UX or efficacy assumptions.
1. **Interpretable mastery engine** (PFA-preferred, or BKT/IKT; 90% gate) **with a per-skill fairness audit** and reading-ability covariate (EDM-2025 landmine). Replaces Alpha's exited third-party apps. Everything keys off this state.
2. **Deterministic control layer (the keystone)** — a rules-based orchestrator, BKT/PFA-guided, that enforces **attempt-before-hint, hint caps, and answer-withholding as hard rules** (StratL/ES-LLMs pattern). Friction is guaranteed here, not left to LLM discretion.
3. **Fine-tuned 7–8B tutor as *renderer*** — **QLoRA imitation + GRPO RL answer-withholding** (λ knob), served on **vLLM** with **queue-depth autoscaling**. The LLM surface-realizes the action the control layer chose.
4. **Decayed-ELO friction enforcement + cohort ELO** (PFAE update rule) — the economic mechanism that makes shortcutting worthless. Instrument uptake from day one; A/B against Alpha-style extrinsic incentives.
5. **Adversarial hardening** against student answer-extraction — build/test against the `epfl-ml4ed/tutor-robustness-eval` benchmark + LlamaFirewall/Llama Guard at the gateway. Mandatory because the ELO rewards shortcutting.
6. **Homogeneous 5–6 competitive cohorts + narrow quant/verbal spine** — gt100k's own pillars layered on the Alpha structure.
7. **Backend, IaC, compliance** (identity/behavioral split, opt-in 2025-COPPA consent, multi-AZ IAM) as the platform foundation under all of it. **Still unevidenced — standard engineering.**

---

## Sources (verified-claim backbone)

**Primary (tutor & pedagogy):**
- LearnLM: Improving Gemini for Learning — Google DeepMind, arXiv:2412.16429 (Dec 2024) + LearnLM Nov-2025 report
- SocraticLM (Thought-Provoking paradigm) — NeurIPS 2024 Spotlight, openreview.net/forum?id=qkoZgJhxsA
- From Problem-Solving to Teaching Problem-Solving (Pedagogical RL, λ Pareto frontier) — ETH/TU Darmstadt, arXiv:2505.15607 (EMNLP 2025)
- ConvoLearn / Mistral-7B QLoRA — Stanford, arXiv:2601.08950 (Jan 2026)
- Qwen3-8B SFT+DPO vs GPT-5 — MBZUAI, arXiv:2606.21502 (2026)
- Multi-agent AI tutoring platform — Chudziak & Kostka, AIED 2025, arXiv:2507.12484
- Eedi Socratic-tutor RCT — arXiv:2512.23633 (Nov 2025)
- Real-student uptake / bypass — Stanford arXiv:2606.15766; arXiv:2604.23486

**Primary (knowledge tracing / ELO):**
- A Survey of Knowledge Tracing — Shen et al., IEEE TLT 2024 (DOI 10.1109/TLT.2024.3383325)
- Multivariate Elo for learner modeling — arXiv:1910.12581
- Elo in education (Pelánek) — Computers & Education 2016

**Primary (security):**
- OWASP Top 10 for LLM Applications v2025 (LLM01: Prompt Injection)
- LlamaFirewall — Meta, arXiv:2505.03574

**Practitioner / secondary (platform — unverified leads):**
- NVIDIA Triton+TensorRT-LLM K8s autoscaling docs; vLLM-on-K8s autoscaling (dev.to, markaicode, zartis); pgvector-vs-Qdrant benchmark (tigerdata); COPPA/FERPA EdTech guides (schoolai, 6b.education)

**Refuted in verification (do NOT rely on):**
- Numerical-perturbation factuality gate improves accuracy ~10pp (0-3)
- ConvoLearn-7B rated competitive with proprietary baseline by teachers (1-2)
- Transformer-Bayesian hybrid KT "resolves" the accuracy-vs-interpretability tradeoff via cross-attention (1-2, round 2)

*Round-1 workflow: 108 agents, 0 errors, ~3.4M tokens.*

---

## Round-2 Sources (Alpha 2-Hour Model refinement)

**Alpha model — structure (verified) & claims (self-reported):**
- Alpha School program page — alpha.school/the-program/ *(primary, marketing)*; TimeBack announcement — alpha.school/blog
- Wikipedia: Alpha School *(secondary)*; Newsweek (Brownsville/expansion, 2025); Astral Codex Ten parent review *(independent)*; NEPC blog (critical); Dan Meyer / fivetwelvethirteen Substacks (critical); Cognitive Revolution ("2 sigma in 2 hours")

**Mastery engine / knowledge tracing:**
- PFA vs BKT — Pavlik/Cen/Koedinger, AIED 2009 (ERIC ED506305) *(primary)*
- IKT (interpretable KT) — AAAI-22, arXiv:2112.11209 *(primary)*
- KT interpretability/accuracy tradeoff — MDPI Appl. Sci. 15/17/9605 (2025) *(primary)*
- **Fairness audit** — EDM 2025, MATHia n=8,549, per-skill BKT bias *(primary, peer-reviewed)*

**Answer-withholding tutor / architecture / robustness:**
- GRPO RL answer-withholding (λ Pareto, Qwen2.5-7B) — arXiv:2505.15607 *(primary)*
- StratL control-layer + PF field study (n=17) — ACL 2025 Findings, 2025.findings-acl.1348 *(primary)*
- ES-LLMs decoupled decision/renderer (BKT-gated, 100% adherence, sim) — arXiv:2603.23990 *(primary, preprint)*
- ConvoLearn QLoRA Mistral-7B vs LearnLM — arXiv:2601.08950 *(primary, preprint)*
- Adversarial answer-extraction benchmark + defenses — EPFL, arXiv:2604.18660 (ACL 2026) *(primary)*
- LearnLM / TeachLM context — emergentmind LearnLM; Dr. Philippa Hardman TeachLM *(secondary)*

**Open questions round-2 could NOT close:** Alpha's incentive/behavioral-science basis & its effect on intrinsic motivation; how gamified extrinsic rewards interact with friction + decayed-ELO; the full 100k-scale engineering/MLOps/FERPA-COPPA stack (research goal 4 returned no verified claims); and whether "2 hours is sufficient" holds against time-on-task evidence for gt100k's far-more-extreme bar.

*Round-2 workflow: 104 agents, 0 errors, ~3.2M tokens. Raw output retained in the deep-research task transcripts.*
