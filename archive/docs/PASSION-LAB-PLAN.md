# PassionLab — unified product plan (LIVING DRAFT)

**Status:** living draft · 2026-07-21 · owner: David & Felipe.
**Refine after** Felipe's passion brainlift lands — the two new pillars (Motivate, Wellbeing) are
deliberately left open for it. This is the plan we iterate; `docs/prd/PRD.md` stays the canonical spec
and `docs/research/RESEARCH-implementation-blueprint.md` is the evidence base.

> **Direction from the GT engineers (2026-07-21):** passion development is the main focus. They liked
> the Passion/Interest Lab and the Evidence Graph, and explicitly asked for an **AI that helps a
> student understand their own project** — because when they ask students about their projects, the
> students often can't really articulate them. Build a real, production-ready app around this.

---

## 1. Vision
**One app — "PassionLab" — where a GT student discovers, develops, documents, and *sustains* a genuine
passion project over years.** Not three demos bolted together; a single coherent product a child
actually lives in. Today we have three separate apps; students experience one journey, so we unify.

## 2. Why unify (the core decision)
`interest-lab` (003), `evidence-graph` (002), and `passion-tutor` (007) are currently **separate Next
apps**. A student doesn't want three tools — they want one place for "my passion." Unify them into a
single **PassionLab shell** with modules over **one shared student-passion state** (the student, their
project(s), their evidence, their tutor sessions, their motivation + wellbeing signals). A shared
design system ties it together (see §6).

## 3. The pillars (modules inside PassionLab)

### Built / maturing
1. **Discover — Passion / Interest Lab** *(003, `interest-lab`)*. Help a student find and commit to a
   passion (discovery rules engine + exploration UI). *Status: production rebuild in flight (interest-lab-v2).*
2. **Develop — Socratic passion tutor** *(007, `passion-tutor`)*. An AI that spontaneously interviews
   the student about their project so they truly understand it (the engineers' explicit ask). Built on
   the blueprint **keystone**: a *deterministic question/coverage engine decides*, the *LLM only
   renders* — friction/strategy are guaranteed by the engine, not left to model discretion
   (blueprint §0.4, §5). *Status: done, PR #78.*
3. **Document — Evidence Graph** *(002, `evidence-explorer`)*. Content-addressed provenance of the
   student's passion work over time — their authentic portfolio + proof of real, human-owned work.
   *Status: declutter done (PR #77); full UI revamp in flight (see §6).*

### New — to brainstorm (open for the brainlift)
4. **Motivate — sustain passion over years.** Keep a student engaged across an 8-year arc: momentum,
   meaningful milestones, reflection, gentle next-step nudges. **Design tension to resolve
   (blueprint §0.3, §5.4, open-Q #2):** gt100k is "friction as product," yet cheap extrinsic
   gamification (points/streaks) can *crowd out* the intrinsic passion we're trying to grow. The
   research could not resolve whether extrinsic rewards + deliberate difficulty **cancel or compound**
   — so motivation here must be designed for *intrinsic* drive and A/B-tested, not copy-pasted from
   Alpha-style points. **TO BRAINSTORM.**
5. **Wellbeing — "step back when they don't feel good."** Detect when a student is struggling,
   frustrated, or burning out, and give them a graceful way to **pause, lower the pressure, reflect,
   and re-enter** — so passion never becomes burnout. This is novel and *sensitive* (minors' wellbeing;
   not clinical). Likely couples with the human **"guide"** role (blueprint §0.1). **TO BRAINSTORM —
   needs the brainlift + engineer input on signals + the right, safe response.**

## 4. What's decided vs. open
**Decided:** one unified app; the three built pillars above are the spine; the tutor uses the
deterministic-engine-decides / LLM-renders keystone; synthetic-only, production-quality bar.
**Open (brainlift + engineers):** the Motivate and Wellbeing pillar designs; where PassionLab touches
the academic mastery/ELO loop (that's the *other* team's spine — passion is separate but adjacent);
single-shell vs. deep-linked-modules; the exact shared state model; what Felipe's brainlift adds.

## 5. Architecture sketch (to firm up post-brainlift)
- **One Next app** (`apps/passion-lab`) as the shell; each pillar is a **pure domain package** +
  adapters + a UI module/route. Reuse the existing `interest-lab`, `evidence-graph`, `passion-tutor`
  packages as the domains — the unify work is mostly the **shell + shared state + shared design**, not
  rebuilding the pillars.
- **Shared passion state** across modules (one student → projects → evidence → tutor sessions →
  motivation/wellbeing signals). Keep identity separate from behavioral data (blueprint §"Pillars 1&2").
- **Tutor** stays engine-decides/LLM-renders; if/when a live LLM is added, harden against
  answer-extraction (blueprint §0.7) — though the passion tutor's goal is *articulation*, not
  answer-withholding, so the threat model is lighter than the academic tutor's.

## 6. Production-readiness bar ("real app," not a demo)
- **Cohesive, crafted design system** — the opposite of the "vibe-coded" look. The **evidence-explorer
  UI revamp** (in flight) establishes PassionLab's visual language (color/type/space/radius/motion
  tokens, crafted 3D); every module inherits it.
- Fully **usable** (adversarial usability gate), **accessible**, with empty/loading/error states and
  **persistence**. Real (synthetic) data flows **end-to-end across modules**.
- Green factory gate (typecheck + test + build) + usability gate on every increment.

## 7. Sequencing (proposal)
1. **Now:** mature the three pillars — `interest-lab-v2` rebuild, `evidence-explorer` **revamp**
   (establishes the shared design system), `passion-tutor` done. Do **not** prematurely merge them into
   a shell yet.
2. **After the brainlift:** finalize §3.4–3.5 (Motivate + Wellbeing) → distill this into a loop-ready
   **`specs/009-passion-lab`** (the unified shell + the two new pillars) → build.
3. Fold each existing pillar into the shell as a module, adopting the shared design system.

## 8. Map to specs
| Pillar | Spec | App/package | Status |
|---|---|---|---|
| Discover | `003-interest-lab` | `interest-lab` | rebuild in flight |
| Develop (Socratic tutor) | `007-passion-tutor` | `passion-tutor` | done (#78) |
| Document (Evidence Graph) | `002-evidence-graph` | `evidence-explorer` | revamp in flight — v1 direction in `docs/decisions/evidencegraph-v1-*.md` (one graph per project) |
| **Unify + Motivate + Wellbeing** | **`009-passion-lab` (to write)** | `apps/passion-lab` | **planning (this doc)** |
