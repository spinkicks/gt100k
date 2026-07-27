# Mastery Maps: design

**Status:** design, awaiting review. Slice 1 only (the map itself). No child-facing surface.
**Date:** 2026-07-25

> **Amended (2026-07-27):** where this doc says a `demonstration` "feeds the Evidence Graph" and that "every
> milestone lands in the Evidence Graph as real work" (~91, 160, 179, 272, 291), that is still the intent, but the
> seam is now explicit. `docs/decisions/evidencegraph-v1-design.md` §13a makes the EvidenceGraph a separate
> product, extractable by `git subtree`, and no package outside the `evidence-*` namespace may import it as a
> value. So `@gt100k/mastery-map` names the artefact and stops there; getting it into a graph goes through an
> adapter (the pattern `@gt100k/project-evidence-sink` sets for the project workspace), never a direct import.
> The seam to E1 is unchanged as a product claim.

## 1. The gap

The specialization planner (018) answers "what should this child do next" with a single
`ProjectBrief`: a title, a driving question, an authentic method, a craft scaffold. It is good at
*pacing* (stage, deliberate-practice dose, rest cadence, wellbeing back-off) and it is deliberately
domain-agnostic.

Which means **nothing in the system knows what getting good at chess actually involves.** Not the
order (tactics long before opening repertoire), not the artefacts (a rated game, a tournament, an
annotated loss), not the resources, not the local competition that happens twice a year. The same is
true for audio production, for dance, for anything a child lands on. A child with a certified spike
currently gets a well-paced sequence of generically-shaped projects.

The bones for fixing this already exist and are better than the roadmap suggested:

| Already built | What it gives us |
|---|---|
| `ProjectBriefGenerator` port + `planner-live` adapter | An LLM already sits behind a typed port |
| `BriefContext.resources: CuratedResource[]` | The planner already expects curated resources |
| Concierge (015) | Ten-stage child-safe open-web retrieval into a curated library, ending in a human vet queue |
| `CuratedResource` | `url`, `reputation`, `ageTiers`, `provenance`. A vetted-resource record |
| Access broker (023) | Mentors and real audiences, guardian consent enforced |
| Wellbeing (016), Family (019) | The pressure and burnout reads |

So this is not a new LLM integration. It is composing what exists and pointing it at a spike.

## 2. The core decision: map and harness are different things

**A mastery map is domain knowledge.** What the milestones are and in what order, with real vetted
resources attached. Stable, reusable, and worth checking exactly once rather than once per child.

**The harness is child state.** Everything the system already knows about this particular child, fed
to the model so its reasoning is informed rather than generic.

The model reasons per child, against a validated domain substrate, instead of re-deriving what chess
is every time. Personalisation lives in selection and pacing, not in re-inventing the domain.

Two arguments decided this, and both are about the map being shared rather than per-child.

**Validation load stays bounded.** Every map is checked by the validator, and a guide can look over
what the software produced. If each child's pathway were generated fresh, both of those would run
once per child, and checking that scales with the roster gets skipped or rubber-stamped, at which
point the guardrail is theatre. One chess map, validated once, is a load the program can actually
carry. The cost of checking scales with the number of maps, not with the number of children. (§11
explains why a human signature is not the publication gate; the argument here is about the work of
checking a map at all.)

**The program stays evaluable.** G5 exists to validate the inference model against real outcomes. If
two children with the same chess spike get materially different paths, no outcome can be attributed:
was it the child, the path, or the generator that day? Per-child generation is an experiment with no
control.

## 3. What a mastery map is

**A map belongs to a domain, not to a cell.** This was an open question and the evidence settled it
against my first instinct, which was one map per domain × work-mode.

A map is a DAG of milestones with a **shared trunk and mode-specific branches**. Trunk milestones
serve every way of working in the domain; branch milestones declare which modes they serve.

```ts
interface MasteryMap {
  readonly id: string;                  // stable, and independent of domainPath
  readonly version: number;             // bumped on every stored change
  readonly domainPath: DomainPath;      // the domain, NOT a cellKey
  readonly modes: readonly WorkMode[];  // the modes this domain affords
  readonly ageBands: readonly AgeTier[]; // plural: S1 to S4 spans ages 6 to 14
  readonly milestones: readonly Milestone[];
  readonly provenance: MapProvenance;   // model, prompt version, generation date, edit record
  readonly validation: ValidationRecord; // what actually gates publication (§11)
  readonly status: "draft" | "published" | "withdrawn";
  readonly vettedBy: HumanActor | null; // optional human review, never a precondition (§11)
  readonly revalidatedAt: string;       // resources rot; see §7
}

interface Milestone {
  readonly id: string;
  readonly title: string;               // plain language, a child could read it
  readonly capability: string;          // what the child can DO after this, not what they consumed
  readonly requires: readonly string[]; // milestone ids, the DAG edges
  readonly modes: readonly WorkMode[];  // empty = trunk, serves every mode in the domain
  readonly stageFloor: Stage;           // earliest stage this is appropriate at (§6)
  readonly ordering: Justification;     // why here, and after those
  readonly resources: readonly CuratedResource[];
  readonly practice: readonly PracticeForm[];   // what repeated effort looks like here
  readonly demonstration: string;       // the artefact that shows it, feeds the Evidence Graph
  readonly opportunities: readonly OpportunityHint[]; // competitions, showcases; brokered by 023
}
```

`DomainPath` and `WorkMode` come from two-axis-tagging, `Stage` from the specialization planner,
`AgeTier` and `CuratedResource` from the concierge, `HumanActor` from the hypothesis store. The
remaining types, `MapProvenance`, `ValidationRecord`, `Justification`, `PracticeForm` and
`OpportunityHint`, are new and are defined in the slice-1 spec, which is where the authoritative
shapes live. This block is the sketch; that document is the contract.

A map spans ages by construction. It runs from `S1_IGNITION` to `S4_SIGNATURE`, which is roughly
ages 6 to 14, so a single age tier cannot describe it and `ageBands` is plural. Resources are then
checked against the bands the map actually claims, rather than against one.

### Why a trunk, and where it branches

The strongest single finding is that **practice belonging to one mode is often the best predictor of
performance in another**. Charness, Tuffiash, Krampe, Reingold & Vasyukova (2005) studied two large
samples of rated chess players and found cumulative *solitary study*, the analytic mode, was a
stronger multivariate predictor of **tournament** rating than tournament play itself; grandmasters
logged roughly 5,000 hours of solitary study in their first decade, about five times intermediates.
If the competitor's best training is the analyst's activity, separate maps would sever exactly the
link that produces the competitor.

Divergence appears to begin at **expert entry, defined by skill rather than age**. Charness et al.
place the separation of expert and intermediate activity profiles around the tenth year of serious
play, and Bilalić, McLeod & Gobet (2009) find sub-specialisation effects only among titled players.
So `stageFloor` on a branch milestone is the right mechanism, and branches should sit high.

**A named dependency comes with that, and it is not small.** No child can currently be placed above
`S2_FOUNDATIONS`. `deriveStage` in `specialization-planner/src/stage.ts` requires `stretchSeeking`
for both `S3_AUTHORSHIP` and `S4_SIGNATURE`, `stretchSeeking` derives solely from
`chosen_challenge`, and nothing in production emits that event because the discovery app has no
difficulty-variant affordance. This is already escalated in PR #163 and is not this project's to
fix. It does not stop us authoring maps, because a map is authored independently of who can reach
it, but it does mean **branch milestones are unreachable until `chosen_challenge` becomes
observable**. Anything that tests or demonstrates a map has to include a trunk-only path a child can
walk today, or it is asserting on structure nobody can enter.

**Honest limits, and they are substantial.** Nobody has directly compared the developmental histories
of composers against performers, or competitors against problemists. There is no evidence at all for
building versus performing with audio, which was my own worked example. The branch point is inferred
from two chess studies. And there is real counter-evidence: Bilalić et al. found chess opening
specialisation worth about 1 SD of general skill, meaning within-domain knowledge is far less
fungible than a pure trunk model implies, and Creech et al. (2008) found classical and non-classical
musicians differ in developmental profile *from the start*, though that is genre rather than mode and
rests on self-report. Confidence in the trunk model is roughly 70%, not 95%, and the map format
should make it cheap to be wrong: a domain whose modes turn out to be genuinely disjoint is
expressible as a map whose trunk is nearly empty.

### Two design consequences that fall straight out of the evidence

**Do not over-weight the visible mode.** The Charness finding says the quiet analytic work outperforms
the competitive activity as a predictor. A map that fills up with tournaments and performances because
those are legible to adults would be recommending the weaker path.

**Do not narrow a child while they specialise.** Güllich, Macnamara & Hambrick (2022), across 6,096
athletes including 772 world-class, found adult world-class athletes had *less* childhood main-sport
practice (d = −0.27) and *more* other-sport practice (d ≈ 0.52). That is across sports rather than
across modes, so it transfers with caution, but it points the same way as the breadth-invariance fix
already in the interest engine: breadth during early specialisation is not a distraction from the
spike.

Three deliberate choices in that shape.

`capability` is what the child can **do**, never what they watched or read. A milestone completed by
consuming a video is not a milestone.

`demonstration` names an artefact, so every milestone lands in the Evidence Graph as real work rather
than a checkbox. This is the seam to E1 and, later, the admissions portfolio.

`opportunities` are **hints, not bookings**. The access broker owns real-world contact and guardian
consent is a hard blocker there. The map may say "rated tournaments exist and this is when a child is
ready for one"; it may not reach into the world.

## 4. The harness

The harness is the context the model receives. It spans nearly every engine we have built, and this
is the first time they are composed into one thing:

| Source | What it contributes |
|---|---|
| Interest inference (011) | The belief, its confidence, distinct days, what the supporting evidence actually was |
| Specialization planner (018) | Current stage, deliberate-practice dose, rest cadence, mentor role, audience level |
| Wellbeing (016) | Pressure, burnout, quiet period, whether to back off right now |
| Family (019) | Whether the pressure is coming from home |
| Student profile (014) | The longitudinal record: what they returned to, what they abandoned |
| Project workspace / Evidence Graph | What they have actually made |
| Two-axis tagging (009) | Coverage and breadth, so a narrow child is not narrowed further |
| Age bands | Appropriateness, and they gate `ageTiers` on every resource |

**The harness is not a "don't hallucinate" wrapper.** Validation is a property of the pipeline, not
the point of it. The point is that the model reasons about a real child in a real state.

## 5. Generation and validation

1. A guide requests a map for a domain that has none.
2. The harness assembles domain context, and candidate resources are drawn from the concierge's
   curated library. Those resources are **human-vetted upstream**: the concierge's tenth stage is a
   vet queue where a person approves an entry into the library or rejects it
   (`concierge/src/promote.ts`). That is deliberate child-safety design and this project does not
   weaken it. Nothing here fetches from the open web.
3. The model drafts the milestone DAG and attaches library resources to milestones.
4. The validator checks what a model cannot self-certify: the DAG is acyclic, every `requires` id
   resolves, every resource came from the curated library and carries an `ageTiers` entry covering a
   band the map claims, every milestone's `capability` names the artefact its `demonstration`
   produces, and no banned scalar or gamification field appears anywhere (GC-class guardrail,
   already enforced elsewhere).
5. The map is stored as a draft. Publication needs `status: "published"` and an empty
   `validation.errors` (§11). A guide may review it, and that review is optional.

**Be precise about which half is software-decided.** The resource half of a map rests on human
vetting that already happened, upstream, by design. What this pipeline decides in software is the
**ordering**: which milestone comes after which, and what that ordering rests on. Those are
different claims, and §11 makes only the second one.

## 6. It does not create a second progression ladder

The planner already owns stage. The map must not become a parallel ladder that fights it, so:

- Milestones carry a `stageFloor`, the earliest stage at which a milestone is appropriate.
- **The map never advances anyone.** It says what is next and what it requires. The planner remains
  the sole authority on the child's stage and pace, and the guide remains the sole authority on
  promotion.
- Where the map runs past `S4_SIGNATURE`, the stage simply stays `S4_SIGNATURE`. The rungs continue;
  our stage vocabulary does not need more names to let a child keep climbing.

## 7. Freshness

A resource vetted in July is a dead link in November. Maps carry `revalidatedAt` and resources are
re-checked on a schedule. This is dramatically cheaper against one shared map than against a hundred
per-child pathways, which is a third argument for the shared map that only shows up in operation.

## 8. The ceiling belongs to the child

The map describes the **whole** path, uncapped. If a child's own pace carries them a long way, the
map should not be the thing that stops them.

**And the system never forecasts where a child will land.** A predicted rung becomes a quota, and a
quota is precisely the family pressure the wellbeing and family engines exist to detect. The path
goes all the way up; the pace is read off the child, never set against a date.

This requires changing `TERMINAL_NOTE` in the planner, which currently reads "By ~14 the honest goal
is a ready-to-invest performer ... not an expert." Its second half is right and stays: the plan
protects a trajectory and never claims to manufacture eminence. Its first half sets a ceiling by age
rather than by the child, and should say instead that how far a child goes is theirs, and that the
program paces by wellbeing rather than by a target date.

## 9. A map must never become a reason not to change your mind

This was the sharpest open question and our own research answers it without ambiguity. Hypotheses are
revisable by design; a published map is a substantial artefact; artefacts create sunk cost; sunk cost
argues against revision. Left alone, the map would quietly work against the engine it serves.

The evidence says irreversibility is the actual harm mechanism, not early depth. Marcia (1966) on
identity foreclosure, commitment without exploration, is already cited in our registry under
`plural-reversible`. Vallerand et al. (2003) and Mageau et al. (2009) find reversibility and autonomy
support are what separate harmonious passion from the obsessive kind that burns out. O'Keefe, Dweck &
Walton (2018) find a fixed theory of interest collapses resilience at the first difficulty. The
brainlift states it plainly: the damage attributed to specialising early is really the damage of
being locked in.

Three consequences, and the second is the one that actually solves it.

**No completion percentage, ever.** "Ari is 60% through the chess map" is a completion-contingent
frame, and Deci, Koestner & Ryan (1999) measure completion-contingent rewards undermining intrinsic
motivation at d = −0.36. The **stronger in children than adults** comparison comes from their
*engagement-contingent* figures (−0.46 against −0.21), which is a different contingency class from
the one a percentage creates, so read the age comparison as coming from those figures rather than
from the −0.36. A percentage would also corrupt the voluntary-return signal the engine is built on.

This is **not** the guardrail arriving by a second, independent route. It is the same finding our
registry already records: the `no-gamification` claim cites Deci, Koestner & Ryan (1999) directly.
That entry carries a limit this section should not drop, so it is restated here. The effect is
debated. Rewards can help start a task a child genuinely does not care about; it is rewards on the
thing they already love that backfire (Cameron, Banko & Pierce, 2001). A completion percentage on a
spike a child chose is squarely the second case, which is why the guardrail holds here, but the
claim is narrower than "rewards are bad".

**Milestones produce artefacts, so leaving costs nothing.** Every milestone's `demonstration` lands in
the Evidence Graph as real work. A child who parks chess after four milestones keeps four real
things they made. Nothing is forfeited, so there is nothing to be sunk. This is a structural fix
rather than a request that people not feel sunk cost, which is why it is the important one.

**Parking detaches a map, it never deletes one.** Re-attaching later is free and carries no penalty,
and no interface should describe a parked spike as abandoned, incomplete, or at a percentage.

A fourth, smaller point from O'Keefe, Dweck & Walton: difficulty must be framed as expected rather
than as evidence of poor fit, or the map becomes a device for quitting at the first hard milestone.

## 10. Guides may edit a map, and every edit is recorded

Approve-or-reject only would make the model the author and the human a rubber stamp, which inverts
the rule the whole system rests on. So a guide can edit.

Provenance then has to carry the weight. Each milestone records whether it was model-proposed,
human-edited or human-authored, and the map's `provenance` keeps every edit **with the value before
it and the value after it**. Recording only that a field changed would not do: an edit overwrites
the only copy of what the model proposed, so without both sides there is nothing left to compare.
This mirrors how the Evidence Graph treats a child's work: the record shows how the thing was
actually made.

An edit also invalidates the map's validation record, because a changed field makes `validatedAt`
stale the moment it lands. An edited map returns to draft and is re-validated before it can be
published again.

It also buys something useful. Once outcomes accrue, "did human-edited maps produce better outcomes
than model-authored ones" becomes an answerable question, and the edits themselves are the clearest
signal of where the generator is weak.

## 11. What software gates, and what it does not

**Superseded 2026-07-26.** This section originally said a guide approves the milestones and their
order, "because the sequencing is the domain-expertise claim and it is what a human can actually
judge." That was wrong, and it was wrong in the specific way this whole document warns against. Our
guides are not chess masters or conservatoire teachers. Ordering is the one thing they have no basis
to evaluate, so they would approve it unread, and we would have manufactured a rubber stamp and
called it oversight.

**The validator gates the ordering.** A map is publishable with no human signature. Publication
takes two things: `status: "published"`, which says someone decided to use the map, and an empty
`validation.errors`, which says the map is valid. They answer different questions and are kept
apart deliberately, so that a guide pulling a map back sets `status: "withdrawn"` and leaves
`validation` exactly as it was. Withdrawing a map is a decision about whether to use it, not a
finding that it is broken.

**Resource safety is not software-gated, and never was.** Resources come from the concierge's
curated library, and its tenth stage is a human vet queue: a person approves an entry into the
library or rejects it. That is a deliberate child-safety design and nothing here weakens it. So the
claim in this section is narrow. Software decides the ordering. A human already decided, upstream,
that each resource is fit for a child.

This does not weaken "the system proposes, a human disposes." A map is **domain knowledge, not a
decision about a child.** Nothing in a map reaches a child until a human promotes a hypothesis and
approves a plan, and both are already human-owned. A third gate at the map would not add oversight;
it would add a signature from someone with no basis for giving it, which is worse than none because
it looks like review.

Correctness is carried instead by the ordering rule, which is §2 of the slice-1 spec rather than a
section of this document: every ordering decision names what it rests on, a published syllabus is
the strongest support, and the model's own unsupported reasoning is permitted but visible and
capped. That makes the claim checkable by anyone, rather than resting on a signature.

Guides still get a **review** surface, because seeing and correcting software output is a judgment
they genuinely can make: a guide can tell that a resource is wrong for a nine-year-old without being
able to sequence the domain. A guide can edit a map, which returns it to draft for re-validation, or
withdraw it, which takes it out of use immediately. Any resource can be pulled at any time.

## 12. Slice 1

**In:** the `MasteryMap` domain model; the generator behind a typed port with a deterministic stub for
CI; the validator; the guide's review screen; persistence.

**Out:** any child-facing surface; per-child selection from the map; real-world opportunity brokering
beyond hints; the admissions portfolio; child login (that is G3, a pre-live gate).

Everything downstream depends on this existing and being trustworthy, which is why it goes first.

## 13. What remains genuinely unknown

The three questions this document opened with are resolved above. What is left is the evidence that
does not exist, recorded here so nobody mistakes a reasoned default for a measured one.

1. **Nobody has directly studied the comparison the trunk model rests on.** There is no study
   comparing the developmental histories of composers against performers, competitors against
   problemists, or provers against solvers. The trunk is inferred from Charness et al. on chess and
   supported by the general shape of near-transfer findings.
2. **There is no within-domain, cross-activity transfer meta-analysis.** Sala et al. (2019) put near
   transfer at g ≈ 0.30 across 332 samples, but "near" there means task-similar cognitive tests, not
   different activities inside one domain. The number is suggestive, not on-point.
3. **The branch point is a guess with two studies behind it.** "Expert entry" comes from Charness et
   al.'s tenth-year separation and Bilalić et al.'s finding that sub-specialisation shows up only in
   titled players.
4. **Nothing at all is known about build versus perform**, which is the case our own two-axis
   taxonomy makes most often. The audio example in §3 has no evidence behind it in either direction.
5. **Deliberate practice is a weaker foundation than it is usually treated as.** Its central study
   failed to replicate (Macnamara & Maitra, 2019), and meta-analytically practice explains 26% of
   variance in games, 21% in music and 18% in sport (Macnamara, Hambrick & Oswald, 2014). Any
   milestone whose rationale is "this many hours" is on thinner ice than it sounds.

The design accommodates being wrong about the first four: a domain whose modes are genuinely disjoint
is expressible as a map with an almost empty trunk, and no data migration is needed to get there.

**Sources.** Charness, Tuffiash, Krampe, Reingold & Vasyukova (2005), doi:10.1002/acp.1106 · Gobet &
Simon (1996), doi:10.3758/bf03212414 · Bilalić, McLeod & Gobet (2009), *Cognitive Science* · Creech
et al. (2008), doi:10.1080/14613800802079080 · Sala, Aksayli, Tatlidil, Tatsumi, Gondo & Gobet
(2019), doi:10.1525/collabra.203 · Güllich, Macnamara & Hambrick (2022),
doi:10.1177/1745691620974772 · Macnamara, Hambrick & Oswald (2014), doi:10.1177/0956797614535810 ·
Macnamara & Maitra (2019), doi:10.1098/rsos.190327 · Meinz & Hambrick (2010),
doi:10.1177/0956797610373933 · Deci, Koestner & Ryan (1999), doi:10.1037/0033-2909.125.6.627 ·
Cameron, Banko & Pierce (2001) · Marcia (1966), doi:10.1037/h0023281 ·
Vallerand et al. (2003), doi:10.1037/0022-3514.85.4.756 · O'Keefe, Dweck & Walton (2018).
