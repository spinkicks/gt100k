# Interest Lab: exploration-world precedents → the return signal

**Status:** research memo · 2026-07-21 · owner: research (for `003-interest-lab` / PassionLab "Discover").
**Question:** (1) What precedents exist for exploration / "hub-world" experiences used for interest or
passion discovery, and what makes them legible + engaging vs confusing? (2) How do we map "explore a
world → enter discovery zones → do activities" onto our model, where **zone = interest domain**,
**activity = a probe**, and **voluntary revisit after novelty fades = the return signal** — while
disambiguating a preferred **topic** from a preferred **work-mode**, and ending in a **revisable
hypothesis** for a guide?

This memo grounds the design in the existing domain: probes are **domains × 9 work-mode verbs**
(`build, investigate, compose, explain, perform, debug, collaborate, care, persuade`); the engine emits
**six separated signal families** (`voluntary_return, unrequired_revision, chosen_challenge,
failure_recovery, self_authored_scope, artifact_competence`) and never a scalar score; return is scored
as **voluntary vs prompted at 7-day and 30-day horizons**; and the hypothesis is a versioned, revisable
record (`EXPLORING → EMERGING → CANDIDATE_SPINE → ACTIVE`, + `CONTESTED/PARKED/REOPENED`) that a human
guide authors ([spec](../../specs/003-interest-lab/spec.md),
[data model](../../specs/003-interest-lab/data-model.md)). It is set against the [passion
brainlift](./passionBrainlift.md): *interest is built, not found; trust what a child returns to, not what
they say; never assign a fixed label; and do not gamify the return signal itself.*

---

## 1. Precedents

### 1.1 The theory of "voluntary return" (why the signal is the right one)

- **Four-phase model of interest development (Hidi & Renninger, 2006).** Interest is "the
  predisposition to reengage with particular classes of objects, events, or ideas over time," moving
  from externally-supported *triggered → maintained situational* interest to self-generated *emerging →
  well-developed individual* interest. The marker of progress is **re-engagement without external
  support** — exactly our return signal. [doi.org/10.1207/s15326985ep4102_4](https://doi.org/10.1207/s15326985ep4102_4)
  · [Renninger phase handout](https://stelar.edc.org/sites/default/files/2022-11/Day%202_Ann%20Renninger%20.pdf)
- **Free-choice learning (Falk & Dierking).** Museums/science-centers/parks can't compel attendance,
  so they run on **intrinsic motivation and user-directed choice** — the closest real-world analogue to
  "what a child voluntarily returns to." Falk's five **identity-related visit motivations** (explorer,
  facilitator, professional/hobbyist, experience-seeker, spiritual pilgrim) also warn that *the same
  space is entered for different reasons* — a caution for reading a single "topic" off a visit.
  [Falk, identity-centered museum learning](https://onlinelibrary.wiley.com/doi/10.1111/j.2151-6952.2006.tb00209.x)
  · [Falk, "Understanding museum visitors" (PDF)](https://slks.dk/fileadmin/user_upload/dokumenter/KS/institutioner/museer/Indsatsomraader/Brugerundersoegelse/Artikler/John_Falk_Understanding_museum_visitors__motivations_and_learning.pdf)
  · [free-choice learning primer](https://www.gettingsmart.com/2013/02/26/free-choice-learning-what-teachers-can-learn-from-museums/)
- **Connected learning / HOMAGO (Ito et al.).** Youth engagement with media escalates through three
  "genres of participation": **hanging out → messing around → geeking out** — browsing, then tinkering,
  then deep interest-driven return. This is a validated ladder for the *depth* dimension of return, and
  its equity framing matters for accessibility. [MIT Press, *Hanging Out, Messing Around, Geeking
  Out*](https://mitpress.ublish.com/book/hanging-out-messing-around-and-geeking-out-kids-living-and-learning-with-new-media-10)
  · [MacArthur white paper (PDF)](https://www.macfound.org/media/article_pdfs/dml_ethnog_whitepaper_1.pdf)
  · [connected-learning framework](https://connectedlearning.uci.edu/wp-content/uploads/2019/06/Connected-Libraries-Landscape-Report-ConnectedLib-Project.pdf)

### 1.2 Hub-world / "learning world" precedents (and their legibility lessons)

- **Quest Atlantis (Barab et al.).** A 3D multi-user world where children (8–15) travel to places and
  do inquiry "Quests." Best-documented *cautionary* precedent: one classroom study measured **low
  engagement (3–4 on a 7-level scale)** and blamed **"distractions in the 3D MUVE,"** language load, and
  low computer competency; researchers repeatedly found a **gap between the designed and the enacted**
  experience. Lesson: 3D can *subtract* legibility unless the fiction and the task are tightly coupled.
  [Barab, "Consequential play"](https://doi.org/10.1007/s10956-006-9033-3)
  · [Singapore science-lessons study](https://bera-journals.onlinelibrary.wiley.com/doi/10.1111/j.1467-8535.2006.00531.x)
  · [gifted-students survey](https://doi.org/10.4101/jvwr.v2i1.403)
- **Whyville (Kafai et al.).** A tween virtual world (1.2M+ players, avg age 12.3, ~68% girls) of
  themed places and science mini-games, studied via **log files of movement + chat** — a precedent for
  reading *behavioral* interest from traces rather than surveys. [World of Whyville](https://doi.org/10.1177/1555412009351264)
- **Museum web explorables (Google Arts & Culture).** Browser-native "explore a collection" worlds:
  **[Museum of the World](https://experiments.withgoogle.com/the-museum-of-the-world)** (WebGL timeline
  you traverse), **[Freefall](https://artsexperiments.withgoogle.com/freefall/)** (fly through thousands
  of artworks in one 3D space), and **["Don't Touch the Art"](https://experiments.withgoogle.com/collection/arts-culture)**
  (navigation itself is the game). Legible because each has *one clear verb* (fall, traverse, avoid) and
  the 3D *is* the content, not a lobby. [artsandculture.google.com](https://artsandculture.google.com/)
- **Contemporary edu open-worlds (market comps).** [Exloris](https://exloris.com/) (safe open world
  with themed **factions = domains**: Explorers/Inventors/Artists/Scientists/Storytellers),
  [Learning Adventures](https://learningadventures.org/) (pixel campus with quests), and
  [Epistemeland](https://epistemeland.com/) (MMO "realms" per knowledge area). Useful for the
  zone/faction pattern — but all three risk the anti-pattern in §1.3 (world as wrapper around drills).
  See also the UOC Empathic Design Thinking Framework for child-centered edu-game design
  ([UOC, 2026](https://www.uoc.edu/en/news/2026/how-to-design-educational-video-games)).

### 1.3 "The world is the real interaction" (not decorative scenery over a menu)

- **Explorable explanations (Bret Victor; Nicky Case; Vi Hart).** The definitional move for us:
  *manipulating the simulation **is** the explanation*, not a widget bolted onto prose — "text as an
  environment to think in." Readers **prove the counterintuitive result to themselves** rather than being
  told. [Victor, "Explorable Explanations"](http://worrydream.com/ExplorableExplanations/)
  · [Case, "I Do And I Understand"](https://blog.ncase.me/i-do-and-i-understand/)
  · [Parable of the Polygons](https://ncase.me/polygons/)
  · [awesome-explorables list](https://github.com/blob42/awesome-explorables)
- **Intrinsic integration vs "chocolate-covered broccoli."** The name for our prior failure. Coined by
  Brenda Laurel / Amy Bruckman: edutainment that wraps drills in an unrelated game "as a sugar coating."
  Habgood & Ainsworth's *Zombie Division* study is the fix: children who played the **intrinsically
  integrated** version **learned more and chose to play it ~7× longer** than the extrinsic version.
  Rule: *make the vegetable itself taste good* — the game mechanic must **be** the learning act.
  [KQED on intrinsic integration](https://www.kqed.org/mindshift/20765/whats-the-secret-sauce-to-a-great-educational-game)
  · [Tedium, history of the term](https://tedium.co/2019/05/09/edutainment-math-blaster-chocolate-covered-broccoli/)
- **Nintendo World 1-1 / teaching through affordances.** The world teaches with **zero tutorial text**:
  empty space + a right-facing character afford movement; a lone Goomba teaches jumping; rising pipes
  teach variable jump height — all through *progressive disclosure* and *safe failure*. The environment
  is the instruction. [Super Mario UX: World 1-1](https://darioristic.com/2009/super-mario-ux-design-world-1-1)
  · [Design Club breakdown](https://www.youtube.com/watch?v=ZH2wGpEZVgE)
- **Diegetic vs spatial UI — with a warning.** The framework: *diegetic* UI lives in the world's
  fiction, *spatial* UI is player-facing 3D. But the canonical cautionary tale is **Dead Space's fully
  diegetic holographic map, which failed at navigation** and forced the team to add a non-diegetic
  "locator." Lesson: don't fetishize pure diegesis — legibility sometimes requires player-facing aids.
  [Diegetic/spatial 4-type framework](https://nastyrodent.com/diegetic-and-non-diegetic-ui/)
  · [Game Developer: what players want (Dead Space map failure)](https://www.gamedeveloper.com/design/game-ui-discoveries-what-players-want)

### 1.4 "Voluntary return over days" (session framing + streak-free come-back loops)

- **Animal Crossing — "real-time, all the time" + time as *dosage*.** The in-game world is tied to the
  real clock; things resolve **overnight**, and the game *intentionally limits* what you can do per day
  so it's played in 20–60 min bursts across many days. Developers (CHI 2026) explicitly frame time as
  **"dosage… you can overdose the player on content,"** and call for **"you are done for today"
  moments, catch-up paths, and returning-player reorientation** — a blueprint for genuine, unpunished
  cross-day return. [CHI 2026: temporal design in games](https://dl.acm.org/doi/10.1145/3772318.3790636)
  · [AC overnight/real-time mechanic](https://www.ign.com/wikis/animal-crossing-new-horizons/Time_Travel_Guide)
  · [AC "a little every day" analysis](https://gameandword.substack.com/p/issue-39-a-tale-of-two-case-studies)
- **Designing for disengagement.** Natural endpoints, pause/save **without losing progress**, and
  treating a session as *completed* reduce frustration; idle/overnight resolution fosters healthy
  return. [arXiv 2303.15400](https://arxiv.org/pdf/2303.15400)
- **The intrinsic-retention paradox.** Build the return mechanism **around** the experience, not
  **inside** it; keep extrinsic scaffolding in a separate psychological space; **"don't gamify the thing
  that's already fun."** This is the design-mechanics echo of our own no-gamifying-the-signal rule.
  [Yu-kai Chou](https://yukaichou.com/gamification-analysis/intrinsic-retention-paradox-user-retention/)
- **Children's right to disconnect (exit dark patterns).** Streaks and loss-framing make children
  optimize for *streak continuity and low-effort wins* — engagement success becomes a learning/wellbeing
  failure. Prescribes a **guilt-free Pause with no streak debt** and a **definitive exit**. [IDC 2026,
  "The Evil Bird and the Right to Disconnect"](https://csl.uwaterloo.ca/download/documents/reportsarticles/idc26a_sub2151_i6pdf;v1?attachment=1)
  · [Joan Ganz Cooney Center, "Beyond the Engagement Trap" (2026)](https://joanganzcooneycenter.org/2026/05/06/beyond-the-engagement-trap/)
  · [family-friendly retention without coercion](https://onlinegaming.biz/designing-for-parents-parental-control-first-patterns-that-b)

### 1.5 The accessible, non-spatial 1:1 path

- **Accessible Games Initiative / Microsoft feature tags (2025).** Concrete requirements: screen-reader
  access to *all* menus/notifications; **move focus one item at a time (never steer a cursor)**; narrate
  **name, role, and state**; alt text for non-decorative images; announce context changes. [Accessible
  Games Initiative criteria (PDF)](https://accessiblegames.com/wp-content/uploads/2025/03/Accessible-Games-Initiative-Tags-and-Criteria-March-2025.pdf)
  · [Microsoft accessibility feature tags](https://learn.microsoft.com/en-us/gaming/accessibility/accessibility-feature-tags)
- **Audio-game spatial awareness (list/grid worlds).** Blind-accessible games (Terraformers, A Hero's
  Call) present environments as **queryable lists/grids** with audio beacons — proof a world can be
  navigated non-visually. [VIP spatial-awareness tools study](https://dl.acm.org/doi/fullHtml/10.1145/3517428.3544802)
- **Surveyor (2024) — the key nuance.** Reducing a world to a point-and-click list **"robs players of
  the experience of discovering,"** and blind gamers dislike railroading. The accessible path should
  preserve the **act of choosing what to explore/revisit** (query unexplored patches, follow beacons),
  not collapse it to a flat button list. [Surveyor (arXiv 2403.10512)](https://arxiv.org/pdf/2403.10512)

---

## 2. Proposed mapping: explore a world → the return signal

The world is one **rendering** of a single interaction model; the accessible ledger is another. Both
express the **same verbs**, so parity is real (this already exists as `plainViewEquals` / one-marker-per-card).

| World element | Interaction (the verb) | Signal construct | Existing type / field |
|---|---|---|---|
| **Discovery zone** (music studio, coding lab, art gallery) | *approach / enter* | interest **domain** (topic axis) | `IslandView` (domain), coverage-matrix **rows** |
| **The activity you do inside** | *do the probe* | **probe** = domain × **work-mode verb** | `Probe` (`domain`,`workMode`), `QuestMarkerView`/`ProbeCardView` |
| **What kind of doing it is** (build / investigate / compose / debug / care …) | *the mode of work* | **work-mode** (the mode axis) | `WorkMode` (9 verbs), coverage-matrix **columns** |
| **Wandering back to a zone once it's no longer new/nudged** | *revisit, unprompted* | **voluntary return** @7d / @30d | `returnState:"voluntary-return"`, `voluntary_return` family, horizon 7/30 |
| **Coming back only after a reminder/assignment** | *prompted revisit* | **prompted return** (recessed, ≠ signal) | `returnState:"prompted-return"`, prompt-dependence |
| **First-visit sparkle** | *try the new thing* | **novelty** (must decay before return counts) | novelty-spike gate keeps state `EMERGING`; `novelty decay` signal |
| **Redoing your own work better; picking the harder path; recovering after a flop; setting your own goal; making something for an audience** | *iterate / stretch / persist / author / ship* | the other five families | `unrequired_revision, chosen_challenge, failure_recovery, self_authored_scope, artifact_competence` |
| **The guide's evolving read** | *review & revise* | **revisable hypothesis** | `InterestHypothesis` lifecycle; guide authors operative revision |

**Disambiguating topic vs work-mode (the crux).** Because every probe is a **(domain, work-mode)**
pair, and the coverage matrix is **domains × work-modes**, the return signal is read *per cell*, not per
zone. Two children who both "keep returning to the music studio" separate cleanly:

- Child A returns to *compose* across music **and** the art gallery **and** the coding lab → the stable
  thing is the **work-mode** (compose/create), not the topic. Their voluntary-return marks cluster down
  a **matrix column**.
- Child B returns to music but drifts across *compose → perform → debug the mixing desk → explain it* →
  the stable thing is the **domain** (audio), across modes. Their marks cluster along a **row**.

The hypothesis therefore always names **both a candidate domain and a work-mode profile** (already
required by the revision record), and the "smallest next distinguishing probe" is chosen precisely to
break a row-vs-column tie (e.g., offer *compose* in a **new** domain to test whether the mode travels).
This is also why the exploration floor and ≥6 domains / ≥6 work-modes coverage exist: you can't detect a
column preference if the child only ever saw one work-mode.

**Culminating in a revisable hypothesis for a guide.** The guide console renders the six families as
**separate values** (never summed), the strongest **supporting beside the strongest disconfirming**
explanation, coverage **gaps as visible gaps**, and uncertainty as a grade/interval — with the child's
lifecycle position and the *next distinguishing probe*. Language is "current evidence suggests… next
test is…," never "you are an X." Promotion to `CANDIDATE_SPINE` needs ≥3 families including a **delayed
discretionary** (return) and an **artifact/competence** signal — i.e., *voluntary return plus made
something*, not novelty clicks.

### 2.1 Making the world the REAL interaction (not decoration over a hidden menu)

The prior failure — decorative 3D over a disconnected menu — is a live risk in the current spec, where
the 3D `<Canvas>` is `aria-hidden` and "the accessible operable surface is the DOM quest ledger." If the
world becomes a fly-through and the *real* choosing happens in cards, we've rebuilt the failure. Fixes,
grounded in §1.3:

1. **The probe activity must be intrinsically integrated** (Habgood/Ainsworth). Entering the coding lab
   and *debugging a synth patch* has to be the actual doing — not a pretty door that opens a quiz. If the
   activity behind a marker is a generic form, the world is broccoli-wrapping. *The mechanic is the
   probe.*
2. **The signal-bearing choices happen in-world.** The two decisions that generate signal —
   *which zone/probe to approach* and *what to wander back to later* — must be expressible spatially
   (proximity, ambient "you were here / this is half-finished" cues) as explorable-explanation-style
   direct manipulation, not only as a list you click. The world and the ledger are **two renderings of
   the same verbs**, not scenery + the "real" UI.
3. **Teach with affordances, not tutorials** (World 1-1): a zone's look tells you what work happens
   there; a half-built artifact left glowing invites revisit; safe failure is visible and un-punishing.
4. **But keep legibility player-facing where needed** (Dead Space caution): allow spatial aids
   (labels, a "places you keep coming back to" overlay) rather than forcing pure diegesis. Quest
   Atlantis shows over-heavy 3D *lowers* engagement; the 2D/lite tier is a first-class equal, not a
   downgrade.

### 2.2 Representing "voluntary return over days" when it feels like one session

The construct is **delayed, unprompted re-engagement after novelty, praise, deadlines, and nudges
fade** — measured at ~7 and ~30 days. Two honest ways to represent it:

- **Genuine cross-session return (the real signal).** Instrument it for real: `returnState` already
  distinguishes voluntary @7/@30 from prompted. Design the come-back loop **around** the experience, not
  as a streak inside it (Yu-kai Chou; and our own no-gamify rule): each session ends at a **natural
  endpoint** ("that's a good place to stop today — the lab will be here"), pause is **guilt-free with no
  streak debt**, and any return cue is a **single, gentle, opt-in** "your half-built thing is still
  here," never a countdown or FOMO (disengagement research; IDC 2026 "right to disconnect"). Fire the
  `welcome-back` delight on voluntary return but **attach no points/score** to it.
- **A labeled time-lapse (to make a single session legible / for the synthetic demo).** Since the
  project is synthetic-only and a first session can't contain a 30-day gap, use an explicit,
  honestly-labeled **"a week later…"** device: the world visibly *quiets* — the "NEW" banners are gone,
  the sparkle fades, no reminder was sent — and then asks **"what do you drift back to?"** This mirrors
  Animal Crossing's overnight resolution and "time as dosage," and the disengagement literature's
  "preview of tomorrow." It represents the construct rather than faking a metric.

The non-negotiable: **separate novelty from return.** First-visit enthusiasm is *triggered situational
interest* (cheap, expected); only the *later, unprompted* revisit counts. The novelty-spike gate already
encodes this — a burst of easy first-clicks keeps the hypothesis `EMERGING` and *schedules a delayed
return check* instead of confirming.

### 2.3 The accessible, non-spatial equivalent (mirrors the world 1:1)

Keep the 3D `<Canvas>` `aria-hidden` and make the **DOM "quest ledger" a true peer**, not a reduced
menu — this is already the architecture (`plainViewEquals`, identical `probeId`/`returnState`/`tone`/
`whyCopy`/`workMode` per marker/card). Harden it against the "railroading" failure (Surveyor):

- **Preserve the act of exploring.** The ledger is organized as *zones you can open, probes inside, and
  a "places you keep coming back to" section* — the user still **chooses what to revisit**, rather than
  being handed a flat to-do list. Query "what's new in the art gallery?" / "what did I leave unfinished?"
- **Standard non-spatial navigation** (Accessible Games Initiative / MS tags): move focus one item at a
  time (no cursor steering); narrate name/role/state ("Music studio, zone, 2 unfinished"); alt-text
  equivalents for anything the world shows; announce context changes; WCAG 2.2 AA, color-independent,
  reduced-motion → instant framing.
- **Same signal, same delight.** Voluntary return in the ledger triggers the same label-free
  `welcome-back` tone; prompted return recedes identically. Help/assistive actions **never lower a
  signal** (already a guardrail). The time-lapse device is a narrated "a week later…" step, not a visual
  effect.

---

## 3. Top pitfalls to avoid

1. **Chocolate-covered broccoli / decorative 3D.** A world that's a lobby in front of a quiz. *The
   probe activity must be the mechanic* (Habgood/Ainsworth; the explicit lesson of the prior version).
2. **3D that subtracts legibility.** Quest Atlantis measured *lower* engagement from 3D distraction and
   task-opacity. Give each zone/probe **one clear verb**, keep the 2D/lite tier a genuine equal, and add
   player-facing aids rather than worshiping pure diegesis (Dead Space's failed diegetic map).
3. **Mistaking novelty for interest.** First-click enthusiasm is triggered situational interest and
   near-worthless as signal. Only *delayed, unprompted* return counts — enforce the novelty→decay→return
   gate.
4. **Gamifying the return signal.** Streaks/points/FOMO on re-engagement both **corrupt the very signal**
   (reward-undermining, worse in children) and create exit dark patterns that harm wellbeing. Keep return
   loops *around* the experience, guilt-free, streak-free, with a definitive exit (Yu-kai Chou; IDC 2026;
   Cooney Center).
5. **Collapsing topic and work-mode.** Reading interest per *zone* hides the child whose real spike is a
   **work-mode** across zones. Always read per **(domain × work-mode)** cell and name both axes.
6. **A fixed label / a single score.** Never "you are a musician." Output separated families, a
   supporting-vs-disconfirming pair, visible gaps, and a *revisable* hypothesis a guide authors — a "find
   your passion" frame collapses resilience when the work gets hard.
7. **Inferring low interest from missing data.** A quiet week is not disinterest; missingness must never
   lower the state (already a guardrail — keep it).
8. **An accessible path that's a lesser menu.** If the keyboard/screen-reader route is a flat button
   list while sighted kids "explore," it's both an equity failure and railroading (Surveyor). The ledger
   must mirror the world's *verbs* 1:1, including the choice of what to revisit.
9. **Reading one visit as one motive.** Falk's identities: the same zone is entered to explore, to
   accompany a friend, or to chase a thrill. Use repeated *patterns* of return across cells, not a single
   visit, before the hypothesis moves.
