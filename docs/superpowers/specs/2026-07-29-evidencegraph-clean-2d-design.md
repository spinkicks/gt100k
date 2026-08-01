# EvidenceGraph — clean 2D, story-first (design)

**Date:** 2026-07-29 · **Owner:** Felipe · **Status:** Approved for planning
**Product:** EvidenceGraph (`@gt100k/evidence-*` + `passion/apps/evidence-explorer`)
**Grounds on:** `docs/decisions/evidencegraph-v1-design.md` (§9 surfaces, §10 UI direction, §12 parked, §13a extraction)

---

## 1. Goal (one paragraph)

Make the EvidenceGraph explorer **as simple and legible as possible** — one clean 2D
surface that reads plainly for a student (9–12) *and* holds up to an evaluator, with the
cryptographic rigor kept exactly one click deeper. The surface leads with the **story of how
the project was really built** (the honest journey — plans, dead-ends, help asked for, the
moment it worked), not with the machinery. A small **guided Story Mode** (Phase 2) narrates
that journey beat-by-beat. This is a **presentation + copy reshape**: the evidence domain,
hashing, verification, and manual-add path are untouched.

## 2. Decisions locked (from brainstorming)

1. **Audience:** both a student and an evaluator, on **one surface** — lead with story, rigor a click deeper.
2. **Hook:** *"See how it was really built"* — authentic effort made visible; the journey/replay is the lead.
3. **Scope:** drop the 3D entirely — **one clean, very simple 2D graph**; small guided Story Mode next.
4. **Layout:** **story-first, single column** — the graph is the hero; a big *Play the story* button; a single
   *Verify* button that expands the proof; all advanced tools behind a collapsed *Explore* disclosure.

## 3. Vocabulary — plain on top, rigor one click deeper

The surface stops speaking cryptography by default. Every technical string stays reachable
(and verbatim) behind a disclosure, so nothing is lost for an auditor.

| Today (reviewer-grade) | Default (plain) | Rigor kept where |
|---|---|---|
| `Provenance Observatory` / `Milestone <ref>` (headline) | **"How Maya built her game"** + one line *"A record of every step — that can't be faked."* | ref shown in the Verify panel |
| `12 NODES · 0 UNLINKED · 11 THREADS` | **"12 steps · 11 links"** ("unlinked" hidden unless > 0) | Explore → Ledger |
| `Synthetic` | **"Demo data"** | — |
| `Merkle root re-derivation — passed`, `Subject digest binding — passed`, `Human-owned final grade — passed`, `Transparency-log inclusion (pre-live gate, stub)` | **"✓ Verified — nothing here has changed since it was recorded"** | Verify panel → **"How we checked"** expander shows these lines **verbatim** |
| Node type names (`Artifact`, `Attempt`, `Assistance`, `Transformation`, `Claim`, `Contribution`, `Review`, `Outcome`) | keep the name **+ a plain gloss** (Artifact→*a file/draft*, Attempt→*a run/test*, Assistance→*help used*, Transformation→*a plan step*, Claim→*a reflection*, Contribution→*a credit/source*, Review→*a mentor note*, Outcome→*a result*) | Inspector/Ledger keep the type name |

**Guardrails unchanged:** the existing view-model guardrails (no competition/urgency/accusation
language) still hold. The human-authority invariant copy stays truthful — a grade/judgment
Outcome is human-owned; that fact is stated plainly, not softened away.

## 4. Layout — single column

```
+------------------------------------------------------+
|  How Maya built her game               [ Verify ✓ ]  |   <- header: plain title + one-liner
|  A record of every step — that can't be faked.       |      + "Demo data" pill + theme toggle
+------------------------------------------------------+
|                                                      |
|                ( 2D graph — the hero )               |   <- Constellation2D, centered, labels legible
|              o---o---o---o---*                        |      click a node -> Inspector (plainer copy)
|               \  |  /                                 |
|                o-o                                    |
|                                                      |
|   [ ▶ Play the story ]                                |   <- primary CTA (drives Story Mode, Phase 2)
|   ─────────●─────────────  timeline                   |   <- existing scrubber
+------------------------------------------------------+
|  › Explore  (search · filters · display · add · ledger)|  <- collapsed by default
+------------------------------------------------------+
```

- **Header:** plain title + one-line explainer; a small **"Demo data"** pill and the theme toggle;
  a **[Verify]** button on the right.
- **Hero:** the 2D graph, centered and larger than today, node labels legible. Clicking a node opens
  the existing **Inspector** (plainer copy; keeps type + gloss + artifact view + actor + timestamp).
- **Under the graph:** the **[▶ Play the story]** primary button + the timeline scrubber.
- **Verify panel** (opens from the header button): the plain result line, the **"How we checked"**
  detail (technical checks verbatim), and the **tamper demo** ("change one byte → verification visibly
  breaks"). This is where all the crypto rigor lives — reachable, not front-and-center.
- **`› Explore` disclosure** (collapsed by default): Search, Filters, Display, **Add-to-graph**, and the
  full **Ledger** (the accessible `role="tree"` source of truth). Power tools are opt-in.

## 5. Retire the 3D (cleanly, reversibly)

`ObservatoryStage` renders **only** `Constellation2D`. Removed from the app:
- the 3D/2D tier toggle (`obs-tier-control`),
- the `Cosmos3D` dynamic import and `components/cosmos/`,
- the tier-resolution machinery in the stage: device/WebGL probe, `resolveRenderTier` usage,
  `PerformanceMonitor` auto-degrade, the `CanvasBoundary` fallback, `degradedTo`/`webglFailed` state,
- the three.js / `@react-three/*` / postprocessing dependencies from the **app** `package.json`
  (bundle-size win).

**Kept, untouched:** the `@gt100k/evidence-explorer-view` package's `layout3d`/`camera`/`tiers` code.
It is a separable library; leaving it costs nothing and preserves the 3D option without shipping it.
`Constellation2D`, `layout2d`, `Inspector`, `TimeScrub`, `VerifyBox`, `Ledger`, `AddPanel` all stay.

**Trade-off (named on purpose):** the v1 design §10 calls the 3D "a differentiator — keep it." We are
overriding that for simplicity and demo-ability. Decision recorded here; the code path is retired, not
destroyed, so it can return behind a flag if ever wanted.

## 6. Story Mode (Phase 2 — small, guided)

A guided, auto-advancing narration over the beats that **already exist** (`view.growthTimeline`).
It is **presentation-only**: it drives the existing scrub-reveal (`revealedCount`) forward on a timer.

- **One plain caption per beat**, authored in a small caption table keyed by beat position
  (e.g. *"First build run — it didn't pass yet. That's normal, and it's recorded too."*,
  *"After a fix, the next run passes."*). Fallback = the node's existing plain label if a beat has
  no authored caption.
- **Highlights the newest node** as each beat reveals (reuse the existing focus/emphasis path).
- **Controls:** Play / Pause + Next / Prev (reuse the scrubber's step logic). Respects reduced-motion
  (no auto-advance animation; step-only) per the existing motion budget.
- **Ends** on a nudge: *"…and here's the proof → Verify"* that opens the Verify panel.
- **No new domain data.** Captions live in the app layer; the graph/view are read, never mutated.

### 6.1 Phase 2 lock (2026-07-29) — "the git of a project"

The framing the operator wants: EvidenceGraph is *git for how a project was built* — a
content-addressed, tamper-evident **DAG**, not a straight line. Phase 2 makes that legible without
redesigning the graph:

- **A `git log`-style commit list beside the 2D constellation.** Each of the 12 beats is a row:
  the node's **real short content-address** (`shortHash(node.id)` = first 7 chars of its sha256) +
  a plain message. The constellation stays the authoritative shape; the list is the readable spine.
- **Not linear.** The list is chronological but must not imply a single rope. Rows whose node draws
  on more than one earlier step (`node.inputs.length > 1`) get a small **merge** cue; the root step
  (no inputs) reads as the start. Branch/merge structure lives in the graph edges — the list only
  hints at it.
- **Story Mode owns the transport.** The existing `TimeScrub` play/timer/beat-chips are **retired**
  and folded into the new Story surface (Play/Pause, Prev/Next, an accessible scrub slider, the
  caption line, the commit list, the end nudge). `scrub.ts` pure reveal logic is kept and reused.
- **Highlight without hijack.** The newest node is highlighted via the constellation's `focusNodeId`
  prop directly (the focus ring), **not** via `select()` — so auto-play does not pop the Inspector
  open on every beat. Clicking a commit row still `select()`s (Inspector opens deliberately).
- **Captions keyed by beat position** (`birthOrder` 0–11), authored to the real demo fixture —
  **tiny-runner-v1** (`@gt100k/evidence-tiny-game`), a student building a one-button endless runner —
  honest to each step (cited tutor help, a *failed* first run kept in the record: "player falls
  through floor", a credited free CC0 asset, a human-owned final grade). The two source-code Artifacts
  are the DAG's merge points (each combines prior code with cited tutor help), computed from the view
  edges. A guard test binds captions to the actual beats so a fixture change fails loudly.
- **Cadence** is a single app constant (`STORY_STEP_MS`, ~2.6s/beat) — slow enough to read, not a
  motion token (a JS interval, not a CSS animation). Any CSS added (caption fade, current-row
  emphasis) animates only `transform`/`opacity`/`filter` and is neutralized under reduced motion.

## 7. What does NOT change

- The `@gt100k/evidence-*` domain: model, `canonicalize`, `Hasher`, `merkleRoot`, invariants,
  attestation, ports/adapters, the manual-add server action (`app/actions.ts`, Node SHA-256).
- The extraction invariant (§13a): **no new value import** across the `@gt100k/evidence-*` boundary.
  The app keeps its only outward deps — `@gt100k/design-tokens` + `@gt100k/ui` — which `@gt100k/boundaries`
  already reports as an intentional **warning**, not a failure.
- The DOM Ledger remains the single accessible source of truth (now inside *Explore*), keyboard/SR reachable.

## 8. Testing & the review gate

- **Update/remove** app tests that assumed the tier toggle / 3D: `test/motion-budget.test.ts`,
  the 3D-tier parts of `test/a11y.test.ts`, and any tier-control assertions. The a11y guarantees that
  survive (DOM Ledger as source of truth, transform/opacity/filter-only motion, reduced-motion parity)
  stay pinned.
- **Add** tests for: the *Verify* disclosure (plain line ↔ "How we checked" verbatim ↔ tamper demo),
  the *Explore* disclosure (collapsed by default; contents reachable), and — Phase 2 — Story Mode
  advance/caption/reduced-motion-step.
- **Keep** `e2e/smoke.spec.ts` green (updated for the single-column, 2D-only surface).
- **Gate:** Conventional Commits; PRs < ~400 lines; CI green; cross-model/human review. Likely
  **two PRs for Phase 1** — (1) *retire 3D + single-column layout*, (2) *plain copy + Verify/Explore
  disclosures* — then a third for **Phase 2 Story Mode**.

## 9. Sequence

- **Phase 1 (this build):** §3 vocabulary, §4 layout, §5 retire-3D, §7 invariants, §8 tests.
- **Phase 2 (next):** §6 Story Mode.

## 10. Deferred vision — the student's daily workflow (NOT built now)

Captured so intent isn't lost; explicitly out of scope, and aligned with the v1 design's parked items
(§12: automatic capture `B1-auto`, project-start `A2`, cadence `A6`).

EvidenceGraph gets **fed by a light daily ritual** — the "guided daily workflow" — that turns
evidence-capture from a chore into an age-appropriate habit for a 9–12yo:

1. **Open with intent** — *"What are you working on today?"* → a plan step (`Transformation`). Guided entry.
2. **Work happens** in their tool; drafts/versions get saved to the record (`Artifact`) — by hand now,
   auto-captured later (hourly snapshots, tool calls, test runs).
3. **Ask for help honestly** — an AI tutor or a person becomes an `Assistance`/`Contribution` node.
   The honesty mechanic: where AI helped, it is labeled.
4. **Run, fail, fix** — `Attempt` nodes. The dead-ends *are* the authentic-effort story.
5. **Close with a reflection** — a one-sentence `Claim`. Guided close.

Over weeks the graph **becomes** the "how it was really built" story — captured live, not reconstructed.
It plugs into GT / PassionLab through the seams §11 already names (interest-lab proposes the project;
passion-tutor sessions become `Assistance` nodes; TimeBack is a weak prior) — clean seams, **no hard
dependencies**. Two pieces stay deferred: **automatic capture** and **the guided-ritual UI itself**.
The demo's **Story Mode replays a project shaped by exactly this loop**, so it previews the daily
workflow's payoff without building the capture side.

---

**Next:** writing-plans → an implementation plan for Phase 1.
