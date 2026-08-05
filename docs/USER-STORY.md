# The user story

**Status:** draft 2, for review · 2026-08-05 · decides a lot, and names what blocks the rest

Every surface in this product was specified. The path between them never was. There are PRDs for the
discovery app, the specialization pipeline, the console and the parent guide, plus a dozen specs for
individual tabs, and no document that says what a child does, in order, and which screen they are on
while they do it.

This document closes that gap. Draft 1 was fact-checked against the repo and got ten things wrong; the
corrections are folded in, and the most important of them is §1, which was not in draft 1 at all.

---

## 0. The constraint everything answers to

**One guide, thirty children.**

At two hours of console time a week that is **four minutes per child per week**, and most children
should need **zero**. That gap, not word count, is the design brief.

**Software owns the labour.** If a decision can be derived, it is derived, and no guide is asked to
author it.

**Humans own only judgment**, and only where automating it would break the argument this product rests
on rather than because we lack the code:

| Stays human | Why |
|---|---|
| Promoting a child into a specialization | The system labelling a child is what the design refuses |
| Escalating burnout or family pressure | Harm |
| Approving adult contact with a child | Safety and consent |
| Running the two motivation probes | See §6.4. The research says this is the strongest lever we have |

Each must cost **one click from one screen**, except the probes, which happen in the world.

---

## 1. What actually blocks the story

Draft 1 described a child journey that the current system cannot run. Three blockers, none of them
UI problems. **No amount of redesign fixes these, and the child's story is fiction until they are
fixed.** They should be the first work, ahead of any app.

### 1.1 Only chess can produce a spike

The promotion gate needs three legs, and the third is `hasArtifact`: a perseverance artifact reference.
The only thing that mints one from real behaviour is a `failure_recovery` event, and the only producer
of `failure_recovery` in the whole product is `onAttempt`, which exactly one gadget calls:
`runtime/puzzles/Chess/Chess.tsx`.

**Forty three of the forty four pursuits can never pass the gate.** A child who returns to drums every
week for a year gets nothing.

Worse, the obvious fix is circular. The workspace already computes perseverance (a stuck outcome later
referenced by a revision or an artifact), but a child only has a workspace after a project, and a
project only arrives after promotion, which needs the artifact.

**Break the circle one of these ways:**

- **(a)** Every gadget reports attempts, the way chess does. Real work, roughly 14 gadgets, and it only
  ever covers the 8 pursuits that have a gadget at all.
- **(b)** Accept the self-authored project as the entry point. The workspace already has "new project",
  and a child who starts something and recovers from a setback mints the artifact without a promotion.
- **(c)** Change the third leg so link-only pursuits can satisfy it, for example an attested piece of
  off-platform work (§6.3).

Recommendation: **(b) and (c)**. (a) is worth doing anyway but it can never reach the 36 pursuits with
no gadget.

### 1.2 Nothing can happen for the first eight weeks

`MIN_TERM_DAYS = 56` with `MIN_REVIEW_CYCLES = 2` and `GAP_DAYS = 14`. The earliest any gate can pass is
day 56, which is **week nine**.

That is deliberate and probably correct. It also means the child's second screen is empty for two
months, and draft 1's "weeks two to ten" was arithmetically impossible.

**Consequence for the design:** My work cannot be an empty div waiting to fill. It must be a designed
"not yet" state that makes eight weeks of exploring feel like the product working rather than the
product being broken. See §3.3.

### 1.3 Four maps exist, and they are the wrong four

Maps exist for piano, game dev, competition math and chess. The console's demo child spikes on
`music-sound/audio-systems`, which has no map. The console already ships a component whose only job is
to say this out loud, because a guide reading "where Ari would go next" under a domain Ari has never
touched will reasonably take it for Ari's path.

**Consequence:** the "what you can do now / what is next" lines in §3.4 are blank for nearly every
child. The child surface needs a specified fallback, not a blank. Either generate maps for the domains
children actually spike on, or degrade to the project brief alone, which the planner can always emit.

---

## 2. Two apps

| App | Who | Contains |
|---|---|---|
| **Child** | The child, alone | Explore, My work, My record |
| **Adult** | Guide and parent, one shell, different permissions | Today, one child view, family |

### Migration

| Today | Becomes | Notes |
|---|---|---|
| `discovery` :3080 | Child · **Explore** | |
| `project-studio` :3010 | Child · **My work** | |
| `concierge` :3040 | Already embedded in the workspace | Delete the standalone |
| `evidence-explorer` :3030 | Child · **My record** | **Blocked**, see below |
| `guide-console` :3020 | **The adult app** | |
| `parent-guide` :3055 | Adult · parent permission | **Blocked**, see below |
| `home` :3000 | Deleted | Not a one-line delete, see below |
| `design-lab` :3060 | **Kept** | |
| `tinker-cabin` :5177 | **Left alone** | |

**`design-lab` stays.** Draft 1 called it an empty shell. It is empty of prototypes on purpose, and the
reason is written into the file: it renders from the same token contract as the real apps with none of
their data, so a surface can be looked at full size before anyone commits to building it. Deleting the
sandbox for evaluating new surfaces in the same week we design two new app shells is exactly backwards.

**`tinker-cabin` is not ours to delete.** Draft 1 said it was superseded on 2026-07-29. That ruling
retired `mvp-jul24` and a browse-wall branch, and never mentions tinker-cabin, which is a teammate's
photoreal realism-loop track.

**Deleting `home` is registry work, not a delete.** `resolveHomeUrl` resolves `home` in development
whether or not the app exists, and `ProductHeader` wraps the wordmark in a link to it. Delete the app
and every remaining surface ships a dead wordmark. The actual job: remove `HOME_DEV_PORT`,
`resolveHomeUrl`, `NEXT_PUBLIC_SURFACE_URL_HOME`, both `home-link.tsx` files, rewrite `SurfaceId` and
`Audience`, and decide what the wordmark points at.

**"My record" inside the child app is currently a CI error.** `@gt100k/boundaries` rule B1 forbids
anything outside the `@gt100k/evidence-*` namespace from importing a value inside it, with a single
exemption for `project-evidence-sink`. A child-app route importing the viewer breaks the build. Either
add an exemption, extract a viewer package, or keep the explorer standalone. This interacts with the
open question of whether EvidenceGraph is a separate product at all.

**"Same app, different permission" has no substrate yet.** The parent app is a static export with no
server, so it cannot POST. There is no identity verification, no consent UI, and the ingest route has
no auth. Also the Playbook is deliberately public for applicants with no assigned guide, so putting it
behind a permission strands them. Treat this as a build item, not routing.

---

## 3. The child

### 3.1 The shape

Two doors, and **both are always open**.

```
              ┌─────────────┐
              │   EXPLORE   │  no pager, no search, order random per session
              └──────┬──────┘
                     │  returns across days accumulate, invisibly
                     ▼
              ┌─────────────┐
    ┌────────▶│   MY WORK   │  the next step, the thing being made
    │         └──────┬──────┘
    │                │  append-only log
    │                ▼
    │         ┌─────────────┐
    └─────────│  MY RECORD  │  provable, tamper-evident
   always     └─────────────┘
   available
```

The pipeline PRD already calls discovery and specialization "a shifting blend, not sequential phases".
That has never been rendered as a product. **Explore never closes.**

### 3.2 Week one

The child points at things. Forty four pursuits on one screen for a fourteen-year-old; **seventeen for
a six-year-old**, because age is a hard filter and the footer says how many are hidden. There is a
cabin filter, so "no categories" is not quite true and draft 1 overstated it.

Nothing scores. The child never sees that.

### 3.3 Weeks one to nine: My work is a designed waiting state

Given §1.2, this is eight weeks. It cannot look like a bug.

My work in this state shows what the child has been doing and what would make it real, without
scoring anything: the pursuits they keep coming back to, and one line saying a grown-up will help them
pick something to build when they are ready. **No count, no progress bar, no "3 more returns to go".**
The moment the child can see the gate, the gate stops measuring interest and starts measuring
compliance.

This is also where §1.1(b) lands: a child who wants to start something now can, and self-authored work
is a legitimate way in rather than a fallback.

### 3.4 My work, once it fills

```
┌──────────────────────────────────────────────────────┐
│  MAKING TRACKS                                       │
│                                                      │
│  Right now you can    keep a loop steady for 30s     │
│  Next                 make two sounds trade off      │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ Build a 20-second loop that makes someone      │  │
│  │ nod their head.                                │  │
│  │                          [ Open the workshop ] │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  Judged by  ABRSM Certificate in Music Production    │
└──────────────────────────────────────────────────────┘
```

Four things: what they can do now, what is next, the thing to make, and who judges it. Software
curates all four. The map supplies the ladder, the validator gates the ordering, the planner emits the
brief. A guide may override for one child and is never asked to author it.

**When no map exists for the domain, which today is nearly always (§1.3), the two rung lines are
omitted entirely** and the card is the brief plus the venue. Never a placeholder, never a guess.

**The hard constraint.** No position on the ladder, no rungs-completed count, no percentage, no
progress bar, no comparison. There is already a UI-layer invariant with its own test forbidding exactly
this on the guide side, because the data model cannot enforce it: `milestones` is an array and
`done / total` is one division away. **The child surface needs its own copy of that test.**

### 3.5 The workshop

The child logs what they tried, what happened, what they fixed, what they made. Getting stuck is the
good part. An embedded assistant answers with sources or refuses, and hands distress to a person.

If they log a finished artifact with a thin record behind it, one question appears. The trigger is
record thinness, not a clock, and the answer appends as a reflection. Never framed as suspicion.

### 3.6 And back to Explore

At any point. A second specialization is normal; the console already models children with two.

---

## 4. The guide

### 4.1 Today already exists

`today.tsx` is already the console's default landing: one row per child, automated triage, collapsed
detail, promote in place. Draft 1 proposed it as if it were new. **It is not, and the rebuild must not
rewrite it.** What changes is what sits behind a row.

```
TODAY                                    2 need you · 1 ready · 27 steady

  Bex Ito        Needs you   Family pressure flagged            [ Review ]
  Elle Nkemelu   Needs you   Close to burning out               [ Steps  ]
  Ari Mercado    Ready       Music & Sound › Audio Systems      [ Promote ]

  27 steady                                                     [ show ]
```

### 4.2 Opening one child: one view, no tabs

```
  ARI MERCADO                                          [ Promote ]  [ Park ]

  ████████████████████░░░░  Audio Systems    strong · came back 6 times
  ████████░░░░░░░░░░░░░░░░  Dance            early  · still gathering

  On the map     no map for this domain yet
  Difficulty     keep it where it is · freedom: leave as is
```

Four things by default: the graph, map position (or its honest absence), the two buttons, and the
wellbeing line. Everything else moves behind one "more".

**Correction to draft 1.** It claimed the console shows coaching moves, posture knobs, the report form,
plan detail and access brokerage by default. It does not; those are already behind two tabs, and maps
and recovery are already drawers. The console went from seven tabs to three and made most of this
argument itself. The remaining density is real but smaller than draft 1 implied, and the honest change
is three tabs to none.

### 4.3 Promote is two transitions, not one

Human promote covers `EMERGING → CANDIDATE` (gated) and `CANDIDATE → ACTIVE` (ungated), and the Today
row only ever offers the first. **The doc must say where a CANDIDATE becomes ACTIVE**, or half the
lifecycle has no home.

### 4.4 CONTESTED needs a home

The system enters `CONTESTED` **by itself** when a belief falls back through the threshold it once
cleared. Both exits are human. A one-screen view with only Promote and Park cannot express either, and
`reopen` from PARKED has nowhere to live. This is a real hole in §4.2 and needs solving before build.

### 4.5 Map review is cross-child

Reviewing a map is work on a domain and does not depend on which child is loaded, which is why the
review queue currently sits beside the child switcher. A per-child "more" affordance has nowhere to put
it. It needs its own place in the adult app, probably a second top-level alongside Today.

### 4.6 What the guide never does again

Authoring or ordering map rungs. Choosing the next project. Reading a plan to find the action. Deciding
who needs attention. Interpreting evidence prose.

---

## 5. The parent

Same shell, different permission, one child, thinnest surface in the product.

**Monthly digest.** The child's words, chosen by the child, who sees the page first and can hold
anything back without a reason. One conversation opener with the reason it works.

**Never:** any number that moves, hours, sessions, streaks, comparison, trend lines, notifications,
predictive scores, "not opened in N days", session history.

**Three things asked of an adult, not one.** Draft 1 kept only the sighting. The report form also
captures a rest signal and an upcoming stakes event, and **those two are the only inputs that can
produce `EARLY_BURNOUT` and `DANGER_WINDOW`**. Dropping them re-orphans two wellbeing states, including
the one the Today mock leads with. All three stay, all write-only.

---

## 6. The loops that do not close

### 6.1 Pursuit to project

The workspace seeds from brief-shaped fixtures in localStorage. **The generator is not the missing
piece**: a real brief route exists guide-side behind `PLANNER_LIVE`, plus a deterministic stub. What is
missing is **transport and a shared child identity**. Draft 1 pointed this work at the wrong package.

### 6.2 The challenge setpoint

**Draft 1 got this wrong three ways.** The setpoint belongs to the wellbeing engine, not the planner;
the dataflow runs the other way, with the planner consuming the wellbeing read; and a surface does
consume it, because the console renders "make it harder / keep it where it is / make it easier" above
every tab.

The real gap is the **input**. "Not enough judged work to tell yet" fires whenever success rate is
absent, which it is below four judged attempts, because almost nothing reports attempts. Same root
cause as §1.1.

**And the fix draft 1 proposed is a reversal.** The wellbeing read is guide-facing by explicit design:
there is intentionally no child-facing field, and anything recommending rest or backing off escalates
to a human rather than being applied to the child. Having the workshop consume the recommendation
directly contradicts that. It may be the right call at thirty children per guide, but it supersedes a
standing guardrail and must be decided deliberately.

### 6.3 Off-platform

There is no automatic tracking and no decision to build any. Behavioural over-pressure detection was
deleted on 2026-08-04, though an adult-reported channel replaced it, so draft 1's "detection does not
exist" overstated it.

**Attestation is not an option to weigh; it is built and was ruled non-deferrable** on 2026-07-30: a map
with no position on it cannot scaffold anyone. `attest.ts` exists, and it already argues that a link is
never evidence on its own because pasting someone else's work is trivial, so it becomes evidence only
after a defense session over it.

That also kills draft 1's child self-report idea in its naive form. There is no child-report event kind
in the belief math, only `external_report` for adults, so this would be a new kind and a new weight,
not a UI decision.

**Resolution:** wire the attestation path that already exists. Treat child self-report as a separate
proposal with its own evidence argument, or drop it.

### 6.4 The lever that cannot be automated

The motivation framework's whole output is guide labour: two probes run in the world (take it away for
a week, offer a real way out) plus six adult-directed moves. The strongest result in our entire
research corpus is a coach-behaviour intervention that cut youth dropout from 26 percent to 5 percent
with no change in win-loss.

**That is guide work, and it is the highest-value guide work there is.** A document whose thesis is
"software owns the labour" has to say so out loud rather than quietly automate around it. The four
minute budget is for *administration*. Coaching a child is not administration and should not be
squeezed by it.

---

## 7. Still open

1. Does the EvidenceGraph viewer live in the child app, given the boundary rule, or does it stay a
   standalone product?
2. Identity. There are currently four answers to "who is using this": an age select on the wall, a
   localStorage key in the workspace, profile JSON in the console, and a remembered role on the front
   door. Every screen in §3 assumes one.
3. Two specializations in My work: one panel that switches, or two side by side?
4. **Superseding the map ruling.** Draft 1 cited the wrong section. The audience ruling is not the
   "domain knowledge, not a decision about a child" line, which is about oversight. It is the explicit
   "Out: any child-facing surface, child login (that is G3, a pre-live gate)". So showing a child their
   rung is blocked on **G3 child login**, not on rhetoric.
5. Where does a guide override a rung, without it becoming weekly work?
6. Does the workshop consume the wellbeing recommendation (§6.2)?

---

## 8. Order of work

Engines and research are the strongest part of this project. Nothing here asks to change the inference
model, the planner or the evidence graph. What changes is which package is a product surface, what the
surfaces say, and three content gaps that make the story impossible.

1. **§1.1** Break the perseverance circle, or 43 of 44 pursuits stay dead.
2. **§1.3** Maps for the domains children actually spike on.
3. **§6.1** Transport and shared identity, so a promotion reaches a child.
4. Child app: one shell, three doors, moving surfaces rather than rewriting.
5. **§1.2 / §3.3** Design the eight-week waiting state.
6. Adult app: one child view, tabs gone, plus homes for CONTESTED (§4.4) and map review (§4.5).
7. **§6.2** Decide the guardrail, then close the loop.
8. Registry work for `home`, delete the standalone concierge.

The word count on the console is a symptom. The disease is that the guide was asked to conclude what
the software had already worked out, and underneath that, that the software cannot yet work it out for
anything except chess.
