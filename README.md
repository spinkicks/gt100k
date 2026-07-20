# GT100K

**GT100K** is Alpha School's internal accelerated-gifted layer on TimeBack — an operating system for an intensive, in-person gifted academy that takes an already-admitted child (ages 6–14) from daily academic mastery and passion discovery through to a portable, evidence-backed body of work. Long-horizon goal: MIT-level academic readiness by the end of 8th grade.

> **Status: pre-code / PRD.** This repo is docs-only today. Code lands behind the governed workflow in [`AGENTS.md`](AGENTS.md) as implementation begins.

## Where to start

- New here? Read [`docs/prd/PRD.md`](docs/prd/PRD.md) §1 (executive summary) and §2 (mission), then [`docs/prd/GOVERNANCE.md`](docs/prd/GOVERNANCE.md).
- Building? Start with [`docs/prd/FOUNDATION_PRD.md`](docs/prd/FOUNDATION_PRD.md) (the platform spine — the first buildable slice), and follow the Spec Kit chain (`/speckit-*`) against [`.specify/memory/constitution.md`](.specify/memory/constitution.md).
- Working in the repo? Read [`AGENTS.md`](AGENTS.md) (golden rules: branching, PRs, merge, security).

## Document map

### Canonical specs — `docs/prd/`

| Document | What it is | Authoritative for |
|---|---|---|
| [`PRD.md`](docs/prd/PRD.md) | Full-program operating system (the canonical product spec) | Product scope, requirements, architecture, delivery plan |
| [`GOVERNANCE.md`](docs/prd/GOVERNANCE.md) | Rights, consent, safety, decision-authority invariants (G1–G8) | `G`-class rights/safety rules (stricter rule wins) |
| [`FOUNDATION_PRD.md`](docs/prd/FOUNDATION_PRD.md) | Baby PRD #1 — AWS-hosted platform foundation spine | The first buildable slice (identity/consent, event spine, contracts, OPA, data plane) |
| [`PIPELINE-PRD.md`](docs/prd/PIPELINE-PRD.md) | Standalone reframe of the program as a deterministic student pipeline | The station/pipeline view of the same program |
| [`ADMISSIONS_PRD.md`](docs/prd/ADMISSIONS_PRD.md) | Admissions front door (owned by a separate admissions team) | The CogAT / Track A·B eligibility process (integrated at the enrollment handoff) |

**Authority order** when documents conflict: [`.specify/memory/constitution.md`](.specify/memory/constitution.md) **and** `GOVERNANCE.md` (G-class rights/safety; stricter wins) → `AGENTS.md` (workflow) → decision log → PRD/specs (product intent).

### Background & research — `docs/research/`

| Document | What it is |
|---|---|
| [`gtBrainlift.md`](docs/research/gtBrainlift.md) | Originating thesis and the five spiky points of view (SPOV 1–5) |
| [`RESEARCH-implementation-blueprint.md`](docs/research/RESEARCH-implementation-blueprint.md) | Evidence-based implementation blueprint the PRD syncs to |
| [`RESEARCH-FINDINGS.md`](docs/research/RESEARCH-FINDINGS.md) | Topic-ordered evidence record for product/policy decisions |
| [`PRD-review.md`](docs/research/PRD-review.md) | Citation audit + "max defensible intensity" review that drove PRD v1.2 |
| [`impactful.md`](docs/research/impactful.md) | Engineering skills & end-to-end project matrix (proposals map to it) |
| [`DEEP-RESEARCH.md`](docs/research/DEEP-RESEARCH.md) | The multi-agent deep-research workflow readme |

### Source proposals — [`docs/proposals/`](docs/proposals/)

The ten source architecture/product proposals consolidated into the PRD (see `PRD.md` §35 traceability).

## Tooling

- [`.specify/`](.specify/) — Spec Kit chain (constitution, templates, scripts) for turning the PRDs into specs → plans → tasks → code.
- `.claude/`, `.github/` — agent skills/workflows and CI (gitleaks + hygiene; branch-protected, PR-only `main`).
