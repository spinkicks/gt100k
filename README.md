# GT100K

**GT100K** is Alpha School's internal accelerated-gifted layer on TimeBack — an operating system for an intensive, in-person gifted academy that takes an already-admitted child (ages 6–14) from daily academic mastery and passion discovery through to a portable, evidence-backed body of work. Long-horizon goal: MIT-level academic readiness by the end of 8th grade.

> **Status: working monorepo.** 25 packages, 17 adapters, and 9 apps, with **4,295 tests** green (1,109 engine and adapter, 3,186 app). Every engine is pure, deterministic and offline; all data is synthetic. No real child data touches this system until the pre-live gates pass (see [Pre-live gates](#pre-live-gates)): the discovery game can now post a session to the guide console, but only when someone sets `VITE_GT100K_INGEST_URL` (unset everywhere) *and* a guardian's consent for that purpose is on file, which the route checks per request and denies by default.

## Quick start

Requires Node 20+ and `pnpm` (developed on Node 24 / pnpm 9).

```bash
pnpm install
pnpm exec biome check passion   # lint + formatter, the same gate CI runs
pnpm exec tsc -b                # typecheck the whole workspace
pnpm test                       # 1,109 engine and adapter tests
```

**Start here:** the front door routes you to the right surface by role.

```bash
pnpm --filter @gt100k/home exec next dev -p 3000
```

Or go straight to one. Each app pins its own port in its `dev` script, matching the surfaces
registry in `@gt100k/ui`, so the front door and the shared header always resolve to a real address:

```bash
pnpm --filter @gt100k/project-studio    dev   # 3010, the child's project studio
pnpm --filter @gt100k/guide-console     dev   # 3020, the guide's cockpit
pnpm --filter @gt100k/evidence-explorer dev   # 3030, the provenance observatory
pnpm --filter @gt100k/concierge-app     dev   # 3040, sourced answers
pnpm --filter @gt100k/parent-guide      dev   # 3055, the parent playbook
pnpm --filter @gt100k/design-lab        dev   # 3060, design-system reference
```

## How it fits together

A child's behaviour becomes a revisable interest read, which a **human** promotes into a staged plan, which produces real projects — and those projects get a tamper-evident record from a **separate product** this repo also develops.

```
interactions ─► signal-pipeline ─► interest-inference ─► hypothesis-store ─► guide console
   (the game)      (012)               (011)                 (013)          (a human decides)
                                                                │
                                            certified spike ────┼──► specialization-planner (D1)
                                                                ├──► access-broker (D3/D4)
                                                                ├──► wellbeing (F2) · family (F3)
                                                                └──► project-workspace
                                                                          │
        ══════════ product boundary ═══════════════════════════════════════╪══════════
                                                                           ▼
                                                                     evidence-graph
```

**That boundary is real, and it is the one architectural rule in this repo.** The EvidenceGraph is its own product, developed here to reuse the toolchain and intended for extraction as a `git subtree` copy. PassionLab crosses to it one-way through a single adapter and never the reverse. `import type` may cross; a runtime import may not. See [`docs/decisions/evidencegraph-v1-design.md`](docs/decisions/evidencegraph-v1-design.md) §11 and §13a.

Separable code, though — not a separable pitch. The two products need each other commercially: a spike nobody can verify is just a claim, and a provenance system with nothing worth proving is just plumbing.

Two rules hold everywhere, and most of the design follows from them:

- **The system proposes, a human disposes.** Nothing labels, grades, or acts on a child on its own.
- **No score, no gamification.** Rewarding an activity a child already enjoys reliably reduces later voluntary engagement, and the effect is worse in children — which would corrupt the exact signal we measure. See `/evidence` in the guide console for the citation behind every measurement.

## The workspace

`pnpm-workspace.yaml` covers `passion/packages/*`, `passion/adapters/*`, `passion/apps/*`.

### Engines — `passion/packages/`

Pure, deterministic, dependency-light. No network, no LLM, no clock.

| Package | What it does |
|---|---|
| `two-axis-tagging` | The domain × work-mode taxonomy (8 cabins, 9 modes) every signal is keyed by |
| `signal-pipeline` | Raw `Interaction`s → `CellEvent`s. Novelty, voluntary-vs-prompted, and the disconfirming half |
| `interest-inference` | Beta-Bernoulli belief per cell; separates topic-love from style-love; reports "not sure yet" |
| `hypothesis-store` | Versioned, revisable hypotheses and their lifecycle |
| `student-profile` | Per-child append-only logs, of what was done AND what was offered, + the orchestrator that replays them |
| `consent` | Whether this child's data may be collected, for what, and how to take it back (G3) |
| `discovery-catalog` | The gadget → taxonomy crosswalk, shared so emitter and receiver cannot disagree |
| `surfacing` | What a session must offer regardless of belief: debts before breadth |
| `mastery-map` | Domain pathways, and a child's standing derived from work rather than a checkbox |
| `wellbeing` | Burnout and strain from behaviour only. No cameras, no emotion inference |
| `family` | Warm-demanding family coaching; watches for family-driven pressure |
| `specialization-planner` | The staged ascent from a certified spike to a signature body of work |
| `access-broker` | Brokers real mentors and audiences; guardian consent is a hard blocker |
| `socratic-defense` | Authorship verified by a spoken defense, never by an AI detector |
| `project-workspace` | The child's project log, and the mapping from it onto provenance |
| `concierge` | Child-safe retrieval behind a staged defense-in-depth pipeline |
| `guardrails` | Executable compliance checks (GC1–GC6) over the whole spine |
| `boundaries` | Executable architecture rules. Today: the EvidenceGraph product boundary below |
| `timeback` | Academic signals as priors only, never a gate |
| `research` | The cited evidence behind every measurement, as data |
| `design-tokens` | Framework-free CSS custom properties: one vocabulary, every surface |
| `ui` | The surfaces registry and the product header the adult surfaces share |

### Apps — `passion/apps/`

| App | Audience |
|---|---|
| `home` | The front door. Routes by role and does nothing else |
| `guide-console` | The guide's cockpit: overview dashboard, hypotheses, wellbeing, plan, family, access |
| `project-studio` | The child's project journal |
| `parent-guide` | The Warm-Demanding Parent Playbook (static export, hosted on AWS) |
| `mvp-jul24`, `tinker-cabin` | The child-facing discovery game (Vite + React Three Fiber) |
| `concierge`, `design-lab` | Concierge demo; design-system reference |

Adapters in `passion/adapters/` supply the real implementations behind engine ports (Postgres, filesystem, live tagging/tutoring), so every engine stays testable with a deterministic stub.

### The EvidenceGraph — the other product

Everything under the `@gt100k/evidence-*` name is a **separate product**, not a PassionLab engine. It is developed here to reuse the toolchain and green tests, and is meant to leave as a `git subtree` copy. It has no GT dependency and is demonstrable on its own.

| Package | What it does |
|---|---|
| `evidence-graph` | Content-addressed, tamper-evident record of how work was actually made. Pure domain: no framework, storage, network, clock or runtime crypto |
| `evidence-explorer-view` | The deterministic view model behind the observatory, 2D and 3D |
| `evidence-tiny-game` | The reproducible demo journey — a small game built over N steps |
| `apps/evidence-explorer` | The provenance observatory (port 3030), 2D and 3D |

Its adapters (`evidence-hash-node`, `evidence-repo-postgres`, `evidence-repo-memory`, `evidence-verifier-stub`, `evidence-deferred`) sit behind its own ports, on the same stub-plus-real pattern.

**If you are adding code here, the rule is one line:** nothing outside `@gt100k/evidence-*` may import a *value* from inside it. Types may cross. Everything PassionLab needs goes through one adapter.

## Where to start

- **New here?** [`docs/prd/DISCOVERY-APP-PRD.md`](docs/prd/DISCOVERY-APP-PRD.md), then [`docs/prd/GOVERNANCE.md`](docs/prd/GOVERNANCE.md). A demo walkthrough of the running apps lives in [`docs/DEMO-SCRIPT.md`](docs/DEMO-SCRIPT.md).
- **Want the thesis?** [`docs/research/passionBrainlift.md`](docs/research/passionBrainlift.md) — the spiky points of view and the evidence under them.
- **Building?** [`docs/prd/passionApps.md`](docs/prd/passionApps.md) (what exists, what does not) and [`docs/prd/passion-roadmap.md`](docs/prd/passion-roadmap.md) (the order).
- **Working in the repo?** [`AGENTS.md`](AGENTS.md) — branching, PRs, merge, security. `main` is branch-protected and PR-only.

### Key documents

| Document | What it is |
|---|---|
| [`docs/prd/GOVERNANCE.md`](docs/prd/GOVERNANCE.md) | Rights, consent, safety, decision authority (G1–G9). Stricter rule wins |
| [`docs/prd/DISCOVERY-APP-PRD.md`](docs/prd/DISCOVERY-APP-PRD.md) | Discovery: how a child's interest is found |
| [`docs/prd/SPECIALIZATION-PIPELINE-PRD.md`](docs/prd/SPECIALIZATION-PIPELINE-PRD.md) | Specialization: how a validated spike becomes expertise |
| [`docs/research/passionBrainlift.md`](docs/research/passionBrainlift.md) | Finding and proving the spike, with sources |
| [`docs/research/familyBrainlift.md`](docs/research/familyBrainlift.md) | The family as environment amplifier |
| [`docs/decisions/`](docs/decisions/) | Architecture decision records, including the design language |
| [`docs/proposals/`](docs/proposals/) | Live proposals, e.g. the interest-engine v2 data-collection review |

**Authority order** when documents conflict: [`.specify/memory/constitution.md`](.specify/memory/constitution.md) and `GOVERNANCE.md` (rights and safety; stricter wins) → `AGENTS.md` (workflow) → decision records → PRDs and specs (product intent).

## Pre-live gates

These block any real child using the system, and none are complete:

- **G3** identity, consent, retention, and erasure.
- **E1 productionization** — transparency log, crypto-shredding erasure, export provenance, signing. The hard part is that a right to erasure sits in direct tension with an append-only, tamper-evident store.
- **G4** content safety at child scale.
- **G5** inference validation, once real longitudinal outcomes exist to validate against.

## Tooling

- [`.specify/`](.specify/) — Spec Kit chain (constitution, templates, scripts).
- `.claude/`, `.github/` — agent skills and CI (gitleaks + hygiene).
