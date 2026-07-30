# PassionLab Build Roadmap

**Status:** v2.2 · updated 2026-07-28 · Owner: (product/eng)
**Purpose:** Sequence the `passionApps.md` artifacts into a phased, dependency-ordered build path, mapped to the **actual** Spec-Kit features under `specs/`. Each feature is `specs/NNN-<slug>/spec.md` → a `writing-plans` implementation plan (`docs/superpowers/plans/…`) → execution (factory loop).
**Reads with:** `passionApps.md` (artifact catalog + live status log), the two PRDs, and `hardening/`.

> **Numbering note (read this first):** the actual build order diverged from the v1 proposal. The real spec numbers are the source of truth: `009` two-axis-tagging, `010` socratic-defense, `011` interest-inference, `012` signal-pipeline, `013` hypothesis-store + guide console, `014` student-profile + orchestrator, `015` concierge + child-safe RAG + curated library, `016` wellbeing, `017` guardrails, `018` specialization-planner, `019` family-coengagement, `020` timeback. `002` evidence-graph predates the sequence **and is not a PassionLab feature at all** — the EvidenceGraph is its own product, built in this repo for later extraction (`docs/decisions/evidencegraph-v1-design.md` §11 + §13a). It is sequenced here because PassionLab integrates it and its pre-live gates block going live; the codebase is separable, the pitch is not. `001/003/004/005/006/007/008` are archived. **The numbered sequence stops at `023`.** Everything merged since — the mastery maps, the measurement lane, the presentation-cohesion work, the game's own build-out — is spec'd under `docs/superpowers/specs/` with a dated filename and no `specs/NNN` number, the way F4 was. So `specs/` is the source of truth for the *order the numbered features were built in*, and no longer a complete index of what exists; read this table and `passionApps.md` for that.

---

## Where we actually are (2026-07-28)

| Lane | Status |
|---|---|
| **Discovery spine** (C1/C2/C3/C4 + G1 orchestrator) | ✅ built + merged — `009` `011` `012` `013` `014` |
| **Guide-console cockpit** (F1) | ✅ merged — 7-tab (Overview/Hypotheses/Wellbeing/Plan/Family/Access/Maps), Overview the landing view, + polish + Galaxy backdrop |
| **Assessment / defense** (E2 engine) | ✅ built + merged — `010` |
| **Concierge + child-safe RAG + curated library** (B1/B2/A6) | ✅ built + merged — `015` |
| **Wellbeing** (F2) | ✅ built + merged — `016` |
| **Guardrails / metrics + compliance** (G6) | ✅ built + merged — `017` |
| **EvidenceGraph** (E1 MVP) — *separate product* | ✅ MVP merged — `002`; D1–D6 productionization **owned by teammate**. Integrated across a hard boundary: no value imports out of `@gt100k/evidence-*` (`import type` excepted), enforced by `@gt100k/boundaries` in CI, with the seam adapter `@gt100k/project-evidence-sink` the single exemption |
| **Specialization planner** (D1) | ✅ engine + Plan tab merged — `018` |
| **Family co-engagement** (F3) | ✅ engine + Family tab merged — `019` / `021` |
| **TimeBack priors** (G2) | ✅ merged — `020` (fake data now; live adapter opt-in) |
| **Project workspace** (D2) | ✅ engine + seam adapter + **project-studio app** merged — `022` (child-facing journey-timeline studio, 7-preset theme switcher, `window.__qa`/LOOP_QA). The engine emits a pure plan (`toEvidencePlan`); the `EvidenceSink` port, both sinks and all materialization live in `@gt100k/project-evidence-sink`, deliberately outside the `@gt100k/evidence-*` namespace so extraction leaves the adapter behind with PassionLab |
| **Game/visual world** (A1 world, A2 cabins, A3 assets, A5 mirror) | 🟡 partial — `apps/mvp-jul24` is the child-facing discovery app: a painted five-cabin map (**two enterable**, Logic Games and Math; three marked coming soon), an always-open shelf per cabin, teach-ins, and signal emission on since 2026-07-27. The 2026-07-25 revision removed locomotion entirely, so **A1** is no longer a walkable overworld and the row's original shape is out of date. `apps/tinker-cabin` is the separate photoreal realism-loop harness (teammate). Music has its gadget and audio layer but not its room; **A3** pipeline and **A5** mirror unbuilt. **Which surface is the child-facing one is an open question again:** the surface owner ruled on 2026-07-27 to keep the game (`docs/decisions/2026-07-27-discovery-surface.md` §-1), and a browsable catalogue prototype over the real taxonomy and the real curated library has since been built at `apps/design-lab/app/browse`; nothing has been decided between them |
| **Mastery maps** (guide-facing) | ✅ merged — `@gt100k/mastery-map` (slices 1 and 2), the `mastery-map-live` generator, the console **Maps tab**, and projects wired to milestones so a child's standing comes from real work rather than seeds. No `specs/NNN`; see `docs/superpowers/specs/2026-07-25-mastery-map-design.md` and the two slice specs. Not on the original artifact map at all — it is the layer between a certified spike and a **D1** plan |
| **Live wiring / measurement lane** | ✅ path open, ⬜ gates shut — the game posts sessions to the console's consent-gated `POST /api/ingest`, the gadget→taxonomy crosswalk lives in `@gt100k/discovery-catalog` so emitter and receiver share one, and `@gt100k/surfacing` holds the offer policy (maintenance debts before breadth). Egress is opt-in and off by default. See `docs/decisions/2026-07-27-live-wiring.md`; read it narrowly, since no auth, no rate limiting and no verified guardian |
| **Presentation cohesion** (G7) | ✅ merged — `@gt100k/design-tokens` + `@gt100k/ui` + `apps/home`; MUI is canonical on `:root` and the GT School identity sits at `[data-theme="gt"]`. The Horizon theme and the design-lab console mockup are both deleted now that nothing compares them. Still open: a single deployment |
| **Access broker** (D3 mentor, D4 audience) | ✅ merged — `023` (combined engine + live adapter + guide-console Access tab) |
| **Parent Playbook** (F4) | ✅ merged + **hosted on AWS** — `docs/superpowers/specs/2026-07-24-parent-guide-design.md` (no `specs/NNN`); static-exported `apps/parent-guide`; Family Check-In mirrors `@gt100k/family` (512-combination parity test). Manager MVP item 2 |
| **Rest of specialization** (D5 PCDE) | ⬜ not started |
| **Pre-live gates** (G3 consent/erasure, G4 safety-at-scale, G5 calibration, E1 D1–D6) | 🟡 G3 partly built (`@gt100k/consent`, enforced at ingest); G4/G5 not started (E1 productionization = teammate, and it is work *inside* the separate EvidenceGraph product) |

**Synthetic-first:** every merged feature is built + tested on synthetic/pilot data. No real child data until the Phase 5 pre-live gates pass.

---

## Phase 0 — Substrate ✅ done

- `002-evidence-graph` (E1 MVP) merged; a synthetic project graph builds + verifies. Productionization (D1–D6) is a Phase-5 gate, now owned by teammate. "Substrate" here means an **integrated dependency**, not a PassionLab layer — see the numbering note above.
- The discovery *engines* were built directly as `009`–`014` (the old `003-interest-lab` monolith was archived and split).

## Phase 1 — Discovery MVP ✅ done (engines) / 🟡 world partial

**Goal:** a kid's behavior produces a real, revisable interest read a guide can act on — on synthetic/pilot data.
- **`009-two-axis-tagging`** → **C2** ✅ — domain × work-mode taxonomy; afforded + action-resolved engaged mode; tag-validity gate.
- **`011-interest-inference`** → **C3** ✅ — Beta-Bernoulli belief-per-cell, novelty decay, voluntary-vs-prompted, topic-vs-style, calibrated "not sure yet".
- **`012-signal-pipeline`** → **C1** ✅ — Interaction → CellEvent firewall. The game-side emitter landed 2026-07-27, so this is no longer engine-only: `mvp-jul24` emits and can post a session to the console.
- **`013-hypothesis-store`** → **C4 + F1 (MVP)** ✅ — versioned hypotheses + lifecycle + Phase 2→3 gate + the guide console.
- **`014-student-profile`** → **G1** ✅ — per-kid profile + append-only log + idempotent `runCycle` wiring 012→011→013; the console reads genuinely-derived data.
- **Still open here:** **A4** taste-app embedding SDK (intern apps exist; the SDK and the measurable-panel standard are not built); **A5** accessibility mirror, unbuilt and now the sharper gap, because the Music gadgets are deliberately audible-only and the map is a pointer surface; **A2/A3** three of the five cabins on the map are still closed.

## Phase 2 — Discovery, full ✅ done (RAG + honesty) / 🟡 world remainder

**Goal:** the long-tail concierge + the honesty layer.
- **`015-concierge-rag`** → **B1 + B2 + A6** ✅ — on-demand companion; the staged child-safe harness (`hardening/child-safe-rag.md`); curated library + opt-in live open-web behind the harness; niche→probe; distress→human; async vet→promote.
- **`017-guardrails`** → **G6** ✅ — program metrics (funnel, coverage, calibration, reopen) + GC1–GC6 compliance checks + CLI report.
- **Still open here:** **G5** calibration/validation harness (needs longitudinal outcomes); **`003` remainder** — remaining cabins + **A5** accessibility mirror + per-spike quiet-period hygiene. The cabin work is no longer purely a teammate track: `mvp-jul24` has been built here since 2026-07-24, and `apps/tinker-cabin` is the part that is still theirs.

## Phase 3 — Handoff + Specialization core ✅ core merged / 🟡 remainder

**Goal:** a certified spike flows into a living, project-first plan with process capture.
- **Phase 2→3 certification** ✅ — shipped as the `013`/`014` gate (gap-surviving return + full-term durability + perseverance artifact + human autonomy sign-off).
- **`018-specialization-planner`** → **D1** ✅ (engine + Plan panel) — four-stage ascent (readiness-gated), bounded DP, rest cadence, mentor relay, PCDE focus, grounded on the `015` curated library; guide-console Plan panel. Surface polish pending.
- **Mastery maps** ✅ (engine + live generator + Maps tab) — what getting good at a domain involves, every ordering decision naming what it rests on (`syllabus`/`research`/`community`/`model`), read against the artefacts one child has actually made. Projects now carry a `milestoneId` from the brief the planner stamps, so standing is derived from real work. Nothing here picks the next milestone: that stays the guide's and **D1**'s.
- **`010-socratic-defense`** → **E2** ✅ (engine only) — AI-conducted, sampled, anxiety-safe oral defense + evidence record; human owns the of-record grade. **No surface exists:** no app imports `@gt100k/socratic-defense`, only the `tutor-stub`/`tutor-tfy` adapters do, so there is nowhere a defense can currently be conducted. Sampling cadence is unset for the same reason.
- **D2 project workspace** (Type III PBL; each project gets an E1 graph, an integration across the product boundary) ✅ **engine + seam adapter + `apps/project-studio` merged** (`022`; child-facing journey-timeline studio, 7-preset theme switcher, `window.__qa`/LOOP_QA; engine emits a plan, `@gt100k/project-evidence-sink` materializes it and holds both sinks). · **D5 PCDE curriculum** ⬜.

## Phase 4 — Specialization, full + the human/family layer 🟡 partial (F2/F3/D3/D4 merged, engine and surface)

**Goal:** the ascent runs healthy at scale.
- **`016-wellbeing`** → **F2** ✅ — signal→action push/back-off playbook; quiet-devaluation detection; escalation to F1.
- **F1 guide + wellbeing console** ✅ (functional) — redesigned Workbench, fed by `014`, carrying the `016` panel; audit-only default + human-owned carve-outs per `hardening/human-scaling.md` (polish ongoing).
- **`019-family-coengagement`** → **F3** ✅ (engine + surface) — warm-demanding coaching, door-opening asks, showcases + family-driven-pressure backstop (`remaining-weakpoints.md` #5). Surface polish pending.
- **D3 mentor relay + D4 audience broker** ✅ merged (`023`: one combined access-broker engine + opt-in live adapter + the guide-console **Access tab** — ranked mentor/audience matches, a guide-gated access-transfer lifecycle with a guardian-consent hard blocker, and wellbeing/stage/craft-floor guardrails).

## Phase 5 — Pre-live gates (block any real child) 🟡 G3 partly built, the rest not started

**Goal:** everything required before a live child touches the system.
- **E1 D1–D6 productionization** (`hardening/evidencegraph-productionization.md`): **D2 erasure data model first**, then anchoring/signing, then the rest. **Teammate-owned**, and delivered inside the separate EvidenceGraph product. *Blocks live use.*
- **G3 identity/consent/privacy**: consent scope, retention, parental access, erasure wiring. *Still blocks live use, but no longer absent.* `@gt100k/consent` ships per-purpose consent, absolute withdrawal, a one-year retention review and deny-by-default, and the ingest route enforces it per request. What is still missing splits in two. One part needs something outside this repository: identity verification, so `guide-asserted` is the strongest claim a pilot can honestly make. The rest is ours and unbuilt — the ingest route has no authentication and no rate limiting, and a stale grant produces a prompt rather than enforced deletion. Erasure is half done — a profile is a file and can be deleted, the EvidenceGraph is content-addressed and cannot, which is E1 **D2**. `eraseEverywhere` names the stores that could not forget rather than reporting success. See `docs/decisions/2026-07-27-g3-consent.md`.
- **G4 safety-at-scale**: harden + consolidate the shared moderation service (concierge already ships in-app safety stages). *Blocks live use.*
- **G5 inference validation**: once real outcomes land, re-fit and validate the model.

## Cross-cutting

- **G1 Student Profile / Longitudinal Record** — ✅ shipped (`014`); the shared state above everything. Corrected 2026-07-27: `surfaced` is now a second append-only log on the profile and a cycle takes both together, because offer history had been living on a per-call context that nothing persisted, so no skip and no decline had ever reached a profile.
- **G2 TimeBack Integration** — ✅ merged (`020`): aptitude tilt + discretionary-XP prior + a light two-block handoff (prior only, never a gate). Deterministic fake data now; opt-in live adapter ready for the real API.
- **G7 Presentation Cohesion** — ✅ merged: one token contract, a shared header and a front door at `apps/home`. See the Next step section for what it cost and what it deliberately left out.

---

## Critical path & risks

- **MVP critical path (done):** 009 tagging → 011 inference → 013 hypothesis store + guide console → 014 orchestrator. The discovery read is live on synthetic data, and since 2026-07-27 a real session played in `mvp-jul24` can reach it too.
- **Longest-lead / riskiest (remaining):** the **child-facing surface question**, because it is upstream of how the measurement lane, the artifact catalog and E5 are scoped and a wrong answer is paid for twice; 015/B2 child-safe live open-web (shipped behind stubs; live path is opt-in), C3 + G5 (inference validation with no launch labels yet), E1 D1–D6 (all pre-production, teammate, inside the separate EvidenceGraph product), G3 (erasure on append-only child data — a hard pre-live gate).
- **Hard ordering rule:** E1 **D2 (erasure data model) before D1 (external anchoring)** — never anchor un-erasable child PII externally.

## Next step

- 018/019/020/022/023 merged (023 = the combined **access broker** + the guide-console **Access tab**), plus the **guide-console cockpit** (now 7 tabs), **F4 the Parent Playbook** (`#149`, hosted on AWS), and — since this section was last written — the **mastery maps** lane, the **live wiring** that carries a session from the game to the console, and the game's own build-out (`#159`, `#179`, `#183`, `#215`, `#216`).
- **Cohesion was the constraint, and most of it is now done.** The domain layer was always well factored (engines behind typed ports, shared by every surface); the presentation layer was not. Three fixes landed:
  - **One vocabulary.** `@gt100k/design-tokens` now backs `guide-console`, `design-lab`, `parent-guide` and `concierge` (#171), and since then `home`, `evidence-explorer` and `mvp-jul24` as well — every app in the tree except `project-studio` and `tinker-cabin`. The apps had been describing the same concepts under different names (`--bg` here, `--canvas` there, `--panel` for a surface), so nothing could be re-themed centrally. Both migrations were verified pixel-identical by capturing computed styles before and after, because cohesion here means one vocabulary, not one look: the Playbook is still warm editorial paper and the concierge is still a dark instrument.
  - **A front door and a shared header** (#172). `@gt100k/ui` holds the surfaces registry and `ProductHeader`; `apps/home` (port 3000) routes by role and does nothing else. Surface URLs resolve to `localhost` only in development and to `null` otherwise, so the publicly deployed Playbook can never ship a dead link to a parent.
  - **Deliberately excluded:** `project-studio`, because a child must not be handed a switcher into the adult tools.
- **Cohesion: the explorer question answered itself.** There is one `evidence-explorer` in the tree now; the themed fork is gone and no decision had to be taken. The paragraph below is kept because its reasoning was right and would apply again to the next fork. ~~The **duplicate evidence explorers** need a decision, and the obvious one is wrong: retiring the plain `evidence-explorer` in favour of the themed copy would delete live work, since the EvidenceGraph branches are editing `Cosmos3D.tsx`, `synthetic-view.ts` and `a11y.test.ts` in the *plain* one. The themed app is the fork. Needs a conversation, not a delete.~~ A **single deployment** is still genuinely open; only the Playbook is hosted.
- **Feature gaps still unowned** (both named in the manager's long-term goals): the **admissions-facing portfolio / outward evidence export** (E1 v1 explicitly removed `EvidencePacket`; durable export provenance is E1 **D5**, a capability of the separate EvidenceGraph product, teammate, not started) and a **workshop builder for guides** (zero coverage anywhere in the repo). Real E1 evidence wiring is now a composition-root choice inside `@gt100k/project-evidence-sink`, not a pending API question.

### What is actually left, in order

Ordered by what unblocks the most, and stated as evidence rather than intent. Nothing here is a restatement of something already merged: each item names the package that does not exist, the engine with no caller, or the gate that is still shut.

1. **Decide the child-facing surface.** The 2026-07-27 ruling kept the game; the browse prototype at `apps/design-lab/app/browse` was built after it, on the real taxonomy and the real curated library. Both are real and only one can be the thing a child opens. It is first because most of what follows is scoped differently depending on the answer: `docs/superpowers/specs/2026-07-27-measurement-lane.md` §3–§7 describes nine specific gadgets and is thrown away under a catalogue, and **E5** (`W_SURFACED`) is deferred only for as long as nothing ranks what a child is shown.
2. **A surface for E2.** `@gt100k/socratic-defense` is the only merged engine that no app imports — its six references in the tree are all inside the `tutor-stub`/`tutor-tfy` adapters. The defense is the mechanism by which a spike is verifiable rather than asserted, so it being unreachable is the widest gap between what is built and what can be used.
3. **G4 content safety / moderation.** `@gt100k/concierge` ships the in-app safety stages; there is no shared moderation service, so the defense and any resource surface have no safety spine of their own. A pre-live gate and unstarted.
4. **The rest of G3 that is ours.** Route authentication and rate limiting, and enforced deletion on a stale grant. Identity verification needs something outside this repository; these two do not, and both currently sit behind a route that accepts a `kidId` from its caller.
5. **D5 PCDE curriculum.** The planner already carries `pcdeFocus` per stage — a list of skill names, and nothing that teaches, coaches or assesses them. No package, no spec, no plan. It is the named rate-limiter in the PRD and the only Group-D artifact with no code at all.
6. **A5 accessibility mirror.** Unbuilt, and the cost is rising rather than static: the Music gadgets are deliberately audible-only with the accessibility debt recorded rather than paid, and the map is a pointer surface.
7. **A4 embedding SDK.** Intern taste apps exist; the SDK and the measurable-panel standard that would make them emit signal do not, so the richest behavioural source in the design is not connected to anything.
8. **G5 calibration.** Genuinely blocked, not deferred by choice: it needs longitudinal outcomes and no child has produced one. Worth naming so it is not mistaken for available work.
9. **E1 D1–D6**, teammate-owned, inside the separate EvidenceGraph product, **D2 first**. A single deployment is still open too, and is the only Phase-5-adjacent item nobody has claimed.
