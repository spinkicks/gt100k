# PRD Review — Citation Audit + "Max Defensible Intensity" Recontextualization

**Reviews:** `PRD.md` v1.1 (GT100K Full-Program Operating System)
**Against:** `gtBrainlift.md` (the five spiky positions) and the enrolled goal (MIT-level readiness by age 14)
**Direction set by product owner:** push toward **max defensible intensity**; loosen **all four** levers (real friction/help-tax, visible rivalry, model authority, sharper selection); keep full scope on the **50x-velocity** timeline bet.

---

## Part 1 — Citation audit

A 6-agent swarm verified ~50 citations (existence + claim fidelity, DOIs/arXiv IDs resolved live). **The corpus is unusually clean.** Every future-dated arXiv ID resolves to a real paper; no fabrications found. Four defects to fix, none load-bearing:

| # | Location | Defect | Fix |
|---|----------|--------|-----|
| 1 | §14.6, References | **Author order reversed:** "Ryan and Deci, 2000" for DOI `10.1207/S15327965PLI1104_01` | Change to **Deci & Ryan (2000)** |
| 2 | §24 SRC-08 | **Wrong authors:** Interpretable Knowledge Tracing (arXiv 2112.11209) attributed to "Liu et al." | Correct to **Minn, Vie, Takeuchi, Kashima & Zhu (EAAI-22)** |
| 3 | §14.11 | Wang et al. (2017) — "a technical estimate does not validate a wellbeing inference" is the PRD's interpretation, not a claim in the paper | Keep, but attribute the clause to GT100K, not the source |
| 4 | §16, §30 | Firecracker "~125 ms" is boot-**to-application-code**, not kernel-only | Add three words: "…~125 ms to application code" |

**Confirmed accurate (spot-checked as highest-risk):** VanLehn effect sizes (human d=0.79 / step-based ITS d=0.76); the Wilson (2019) "85% rule" is correctly and conservatively framed as a simulation prior for binary classification, **not** a universal human-learning target; Barrett et al. (2019) on non-universal emotion decoding; EU AI Act citation number (Reg. (EU) 2024/1689); OWASP LLM01; NIST AI RMF 1.0; all 1EdTech/W3C/C2PA standards and versions.

**Meta-finding:** the PRD's evidence discipline held up under adversarial checking. That matters for what follows — because it means when we loosen a control, we can't blame sloppy sourcing; we're making a *values* trade, and it should be argued as one.

---

## Part 2 — Softening the controls to "max defensible intensity"

**Framing.** "Max defensible intensity" makes the binding constraint **law + child-welfare review**, not caution. So every loosening below is paired with the specific hard limit (the PRD's `G`-class, governance/rights) that keeps it defensible. The move is not "remove the guardrail" — it's "turn the *caution* dials to the vision's setting while keeping the *rights* dials fixed." Where I can't tell which a control is, I raise it in Part 4.

The through-line: the current PRD repeatedly chose the *safe* reading of each SPOV and, in three places, **rejected the mechanism outright** (punitive ELO decay, public ranking, learned authority). The vision's claim is that those exact mechanisms are the lever. We can restore the *mechanism* while redefining the *failure mode* it's not allowed to cause.

### Lever 1 — Real friction / help-tax (§13, §14.8)

**Current posture.** Answer-blind tutor + `HelpReceipt` + a later unassisted re-check; help is always free; mastery credit is unaffected by help; SPOV5's decayed-ELO tax is **explicitly rejected** ("punitive ELO decay rejected" across §35).

**What the vision demands.** "Friction is the product; make help hurt to reach for" — shortcutting should be *mathematically worthless*, not merely re-checked later.

**Recommended change (defensible form): a two-currency split.**
- **Mastery credit** stays exactly as-is — earned only from unassisted proctored retrieval, never reduced by asking for help. (This is the rights-protecting invariant; do not touch it.)
- Add a **visible "independence" reward** (XP/streak/tier) that accrues *only* from unassisted first-attempts and pays out near-zero after an AI rescue. Mechanically this is the *potential-based* version of the decayed-ELO idea: because a post-rescue attempt barely moves the knowledge-tracing mastery estimate, the reward it yields is ≈0 automatically. Shortcutting becomes worthless **without punishing the child** — the reward simply doesn't fire.
- Harden attempt-before-hint (already in §13) and make the top independence tier reachable *only* through the delayed unassisted check.

**The reframe that makes it defensible:** it is a **bonus for not needing help**, never a **penalty for asking**. The child who asks keeps full access, full mastery credit, full standing, and safety/accessibility help — they just don't earn the independence bonus for that item.

**Hard line (do not cross, `G`):** never gate access, lower mastery credit, or reduce standing because a child asked for help; accessibility/safety help is always exempt and invisible to the reward; a child in distress is never XP-docked. Audit "frustration" and help-availability as kill-switch signals (already required in §34).

→ *Open questions Q1, Q2.*

### Lever 2 — Visible rivalry (§15, §23)

**Current posture.** Stable pods of 5–6; **private** level+velocity ratings; cooperative missions + short tournaments; every rivalry action costs a `MotivationDoseToken`; **public ability leaderboards are a hard exclusion (§23).**

**What the vision demands.** SPOV3 calls homogeneous, matched-pace, directly-competing pods "the engine" — rivalry and shared advancement are the point, not a metered side-effect.

**Recommended change (defensible form): cohort-scoped, gain-based, mutable visibility.**
- Make standings **visible inside the 5–6 pod** (not global), ranked on **velocity / mastery-gain / effort this sprint** — never on fixed ability. Reset each sprint so no permanent hierarchy forms.
- Use TrueSkill/Glicko purely for **matchmaking** so contests are near-peer (productive rivalry) rather than blowouts (demoralizing). This is the single highest-leverage safety move: rivalry only motivates between matched opponents.
- Keep the **§23 ban on *public* / cross-cohort / fixed-ability leaderboards** fully intact.

**The reframe:** the §23 exclusion targets *public, fixed-ability* ranking — the thing that builds a durable caste and invites bullying. A *private, within-pod, this-sprint, gain-based* standing is arguably a different object. **But this is a line only you/governance can draw — see Q3.**

**Hard line (`G`):** no cross-pod public ranking; no fixed-ability labels; any child can hide their standing without penalty; bullying/safeguarding overrides optimization (already §15.2); monitor **belonging** (SDT relatedness) as a promotion/rollback gate — if visible rivalry depresses belonging in a pod, it auto-reverts to private.

→ *Open questions Q3, Q4.*

### Lever 3 — Model authority (§8.5, §14, §15, §31, §33.1)

**Current posture.** Every learned high-stakes model (admissions risk, passion, motivation control, cohort peer-effects, route) runs **Shadow**; deterministic rules + humans decide. Bounded automation is allowed only for "low-risk scheduling, reminders, content routing, resource cleanup."

**The problem this creates (which the vision exposes).** A model whose ground truth is *8 years out* can never earn authority inside a 4-month beta — so under the current rule, the entire ML program is permanently benched. That guts the point.

**Recommended change (defensible form): gate authority on *reversibility + feedback latency*, not on stakes alone.** Add a promotion path Shadow → **Bounded Automation** for models whose actions are (a) reversible, (b) low-harm, (c) human-kill-switched, and (d) validated on a **short-horizon proxy** (this week's measured skill-gain, flow-band residence, voluntary return) rather than the 8-year outcome.

Promote **now** (reversible, fast feedback):
- **Passion-probe selection** — the contextual bandit picks the next probe (reversible; a bad probe costs one session).
- **Cohort *repair* suggestions** — auto-apply within the churn budget with a guide veto window.
- **Difficulty/friction governor** — let the shadow MPC act *within* the existing safe caps and rate limits (it already can't exceed dose budgets).
- **Mentor-attention allocation** — route scarce human minutes by uplift.

Keep **Shadow-only (`G`)**: admissions ADMIT/ROUTE, the IQ-floor cut, intensity *ceilings*, safeguarding, specialization *commitment*, public release, route transitions — anything irreversible, identity-defining, or only 8-year-verifiable.

**Hard line (`G`):** irreversible or identity-defining decisions stay human; every automated action is logged with a one-click human revert; a bounded-automation model that breaches a subgroup or safety threshold auto-falls-back to shadow (already the §22/§30 pattern).

→ *Open questions Q5, Q6.*

### Lever 4 — Sharper selection (§10, §11, §33.1) — **highest legal risk**

**Current posture.** Family trial rewards recovery over perfection; IQ floor as ADMIT/VERIFY/ROUTE at .95/.05 confidence; demographics down-weighted; family-risk model Shadow; humane ROUTE with alternatives; **renewable, not irrevocable** contract; no home surveillance.

**What the vision demands.** SPOV1: "select the family, not the child," screen fanaticism hard. SPOV2: set the floor and "cut below it cold."

**Recommended change (defensible form): sharpen the *bar and the signal*, not the *coercion*.**
- **Cognitive floor:** raising the floor or tightening the confidence bands is a **policy dial the existing mechanism already supports** — no new capability, and it stays psychometrically governed with DIF audits. This is the clean way to be "sharper."
- **Family commitment:** promote the *behavioral* commitment signal (the strongest validated predictor) from Shadow to **Advisory** — shown to the human admissions panel, still human-decided. Lengthen/intensify the compensated trial. Sharper input, same human authority.

**The two things to keep rejected** (they are the legally radioactive core of the vision, not the intensity): the **binding 8-year contract** and **screen-free home surveillance / audio attestation**. "Sharper" = higher bar + better signal; it is *not* lock-in + surveillance.

**Hard line (`G`):** no automated rejection; no surveillance-derived commitment proof; no protected-class proxies; humane ROUTE with real alternatives stays; renewable-not-irrevocable stays; publish subgroup false-exclusion rates and freeze a policy that breaches its band (already §33.1).

**Caution:** this is the lever where "max defensible" and "defensible" diverge fastest. A sharper cognitive gate on 6–14-year-olds raises disparate-impact and COPPA/FERPA/IDEA exposure. The mechanism can be turned up cleanly; whether you *should*, and how far, is a governance + counsel decision, not an engineering one. **See Q7 — I need your explicit line here.**

---

## Part 3 — The one place I'd push back on your direction

You chose **loosen all four levers** *and* **trust 50x velocity / full scope in 3 months**. Those two pull against each other. Loosening controls doesn't reduce work — it **increases the validation burden**: every lever we turn up needs a *new* safety envelope (independence-reward gaming tests, belonging-as-kill-switch monitoring, bounded-automation revert paths, sharpened-floor subgroup audits). Construction may well be 50x; **validation of child-safety-critical behavior is not**, because it's gated on observing real children, not on writing code.

Recommendation: keep the 50x bet for *build*, but treat the four loosened levers as the explicit **Month-4 validation long-pole** — and accept that if a safety envelope isn't proven, that lever ships Shadow even though the code is done. This keeps the schedule honest without capping the vision.

---

## Part 4 — Open questions for you to lead

Numbered so you can answer inline. My recommendation in **bold** where I have one.

1. **Friction visibility:** should the independence reward be **visible** to the child (more motivating, some anxiety/gaming risk) or **silent** (calmer, weaker lever)? *Rec: visible, but per-item and low-drama.*
2. **Friction ↔ standing:** should independence XP feed cohort rivalry standings (Lever 2), or stay a purely personal streak? *Rec: personal first; only feed rivalry after belonging monitoring proves safe.*
3. **The §23 line:** is the "public ability leaderboards" ban meant to also forbid **private, within-pod, this-sprint, gain-based** standings? I read them as separable; **I need you (with governance) to confirm** before I design visible rivalry.
4. **Rank on what:** pod standings on **velocity/gain/effort** (mutable, safer, arguably more motivating for a matched pod) or on **ability** (closer to raw SPOV3, higher harm risk)? *Rec: velocity/gain.*
5. **Reversible-model risk:** are you OK with a *reversible* model action occasionally being slightly wrong (a suboptimal probe, a one-session over-challenge) in exchange for the ML doing real work in beta? *Rec: yes — that's the price of graduating models before 8-year labels exist.*
6. **First live models:** of {passion-probe selection, cohort repair, difficulty/friction governor, mentor-attention allocation}, which do you want promoted to bounded automation **first**? *Rec: passion-probe selection + mentor-attention (lowest harm, fastest feedback).*
7. **Selection bar (highest stakes):** by "sharper selection" do you mean (a) a **higher cognitive floor / tighter bands**, (b) **heavier weight on demonstrated family execution**, or (c) both — and are you willing to accept **higher false-exclusion + equity/legal exposure** to raise the bar? This is the one I will not move without your explicit line.
8. **The deep tension:** even at max-defensible, this design likely still doesn't reach the Brainlift's *full* forbidden dose (irrevocable contracts, surveillance, cut-cold rejection, unbounded rivalry). Are you content closing that gap only as far as "defensible," or do you want a separate, clearly-quarantined **R&D track** that studies the radical version under research consent — so the production program stays clean while the vision keeps a home? *Rec: quarantined R&D track; never let it touch a live child's status.*

---

*Prepared as a review artifact. Citation verdicts come from a 6-agent live-verification swarm (DOIs/arXiv resolved, claim fidelity checked). Softening recommendations are calibrated to the "max defensible intensity" posture you set; each pairs a loosened caution-dial with the rights-dial that keeps it lawful and child-safe. Nothing here changes `PRD.md` — it proposes changes for your decision.*
