# PRD — Open Contradictions & Gaps

Status of `PRD.md` as of commit `476cf83` ("rewrite based on notes"), v1.2.

The rewrite resolved every inline `NOTE:` from the prior commit (MIT branding, ProofGraph→EvidenceGraph rename, guide/mentor split, acronym glossary, in-school vs. remote, "return" and "intensity" definitions, mastery-quiz tutor, etc.) and carved admissions/selection out to a separate team (§3.4/§3.5). This doc lists only what still needs addressing — contradictions that survived the rewrite, one the rewrite arguably *sharpened*, and substantive gaps that were never flagged.

## 1. Live contradictions

### 1.1 Learned intensity control vs. "raising a dial needs fresh child assent" — **sharpened by the rewrite**
- §8.2 (new) defines intensity as named dials and states: *"Raising any dial requires fresh assent for that dial; higher intensity is never inferred from prior compliance, [or] good performance."* One named dial is **"difficulty ceiling and pace."**
- §8.5 / §14.8 still let the learned MPC **titrate difficulty and friction within dose caps as bounded automation** (guide veto, one-click revert), acting on short-horizon proxies like measured skill gain.
- Conflict: a controller that raises difficulty within caps *is* raising the difficulty dial on the basis of performance — exactly what §8.2 now forbids without fresh per-dial assent. Before the rewrite this was a soft tension; §8.2's new per-dial-assent rule makes it a direct one.
- **Needs:** state explicitly whether automatic difficulty titration counts as "raising a dial," or exempt within-cap titration from the per-dial-assent rule (and say why that's still consistent with §14.9's "zero learned-model outputs change … intensity ceiling").

### 1.2 Always-visible cross-cohort standings vs. the "public comparison" dose economy
- §15 / §23 permit **continuously visible** cross-cohort standings, reset each sprint.
- §8.2 lists "competition and rivalry exposure … visible standings" as an intensity dial requiring per-dial assent; §14.8 / §33.1 meter "public comparison" as a pressure action needing a `MotivationDoseToken` (cap: 2/day).
- Conflict: a persistently visible standing and a per-action-metered, 2-per-day "public comparison" token can't both describe the same feature. How continuous visibility is dosed (or exempted), and how it squares with per-dial rivalry assent, is unspecified.
- **Needs:** define whether an always-on standing consumes dose tokens, is a one-time assent, or is exempt — and reconcile with the 2/day public-comparison cap.

### 1.3 Radical-Dose R&D track studies "ability-based rivalry" vs. §23 prohibition
- §31.1 says the track studies *"ability-based and cross-cohort rivalry,"* but its own Rule 4 forbids any §23-prohibited mechanism, and §23 bans **fixed-ability caste leaderboards**.
- Conflict: if "ability-based rivalry" ≡ fixed-ability caste ranking, Rule 4 forbids the very thing the track is described as studying — even in simulation.
- **Needs:** clarify whether simulation-only ability-based rivalry is permitted, and if so, distinguish it precisely from the §23 caste-ranking ban.

### 1.4 Independence-reward mechanism still describes two different rules
- §13 (rewritten) is clearer but still mixes mechanisms: Step 2 says the reward accrues **only from unassisted first-attempt success + a later delayed unassisted check** (categorical event gate). Step 3 explains the near-zero post-rescue payoff via the **knowledge-tracing mastery-estimate delta** (proportional gate).
- Conflict: under Step 2's rule a post-rescue attempt yields zero *by category* (it isn't a first unaided attempt), so Step 3's mastery-delta rationale is either redundant or describes a different, proportional reward. A reader can't tell if the reward is event-gated or mastery-delta-proportional.
- **Needs:** pick one mechanism (event-gated *or* potential-based/mastery-delta) and state it once.

## 2. Substantive gaps (never flagged in the notes)

### 2.1 Age-14 targets vs. late entrants
Ages 6–14 are admitted; the program "can span up to eight years"; the hard targets (SAT 1570, three AP 5s) are pinned "at age 14." A child admitted at 12–13 cannot have an eight-year runway. How the targets apply to (or are re-scoped for) late entrants is undefined.

### 2.2 Cohort size "5 or 6" vs. minimum-5 secure aggregation
§29 requires "a minimum of five valid contributors" and aborts the aggregate on any missing share; §14.9 references "five-person cohort dashboards"; cohorts are 5 **or** 6. A 5-person pod therefore has zero tolerance for a single non-contributor and can never render wellbeing aggregates. Either raise the pod floor to 6 or rethink the aggregation minimum.

### 2.3 Guide-staffing ratio math
Planning ratio is 1 guide : 15–25 learners (§6.3) and enrollment freezes above 30 (§32.4.1), but the §32.4.1 staffing table yields ~25–26 learners/guide at every wave (40→1,000; 97→2,500; 192→5,000) — at/above the top of the planning band *before* the "ratio drops for younger cohorts / active interventions" adjustment. The plan runs persistently near the freeze line; reconcile the target band with the actual headcounts.

### 2.4 Residual boundary: "remote/after-school work" vs. "no data collected outside school"
§15 now supports remote and cross-school collaboration, while §10.2 / §14.11 forbid *any* out-of-school collection. The rewrite threads this by allowing "strictly-necessary, disclosed interaction data" from a remote session but banning "ambient/passive home sensing." That line is defensible but thin: a remote after-school session *is* running in the home. Spell out exactly which remote-session data is in scope so "interaction data" can't be read as a loophole around the no-home-data rule.

### 2.5 The "50x velocity hypothesis" is un-derisked
§25 still rests the entire 3-build-month scope on a single, unvalidated "50x velocity hypothesis," stated once. This is the largest planning assumption in the document and has no fallback/descope path if the multiplier doesn't hold.

## 3. Deferred to the admissions team (was a contradiction; now out of scope)
The rewrite moved recruitment, the family trial, the Cognitive Floor Engine, and the admit/route decision to a separate team (§3.4/§3.5). Two earlier findings now live with that team and only need to be tracked as integration assumptions, not fixed here:
- family-execution signal at **Advisory** vs. cognitive model at **Shadow**, both feeding one irreversible admissions decision (§8.5);
- calibrating admissions item difficulty on the population being admitted (§11) — leakage/fairness.
Confirm both are addressed in the admissions team's plan at the §3.5 handoff.
