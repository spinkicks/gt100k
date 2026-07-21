# Feature Specification: Family Selection (Admissions Pipeline)

Choosing which families enter the GT100K program: the full admissions pipeline —
family application → CogAT routing → Track A/B eligibility → Talent Snapshot → blind review →
income-banded lottery → admission/aid + research handoff. This spec is the **loop-ready
distillation** of `docs/prd/ADMISSIONS_PRD.md`, which remains the authoritative source for
statuses, reason codes, rubric dimensions, Track A/B rules, and acceptance checks — read it
per-phase for detail; **its "MVP Acceptance Checks" section is the SC source of truth**.

> Synthetic-only, PR-only. No live child data, W-2s, fees, or real applications. Family- and
> child-adjacent surfaces are operator-reviewed before merge.

## Scope Fence *(loop-ready)*
**In scope**
- Pure domain packages: `packages/admissions-contracts` (statuses, reason codes, rubric, error
  codes — the executable contract) and `packages/admissions` (the decision engine).
- In-memory/stub adapters under `adapters/*` (application repo, assessment intake, review store,
  allocation RNG). **Postgres/Supabase is deferred** — build against in-memory adapters so the
  whole pipeline is headless-testable; keep the ports clean so a DB adapter can slot in later.
- Next.js app `apps/family-portal` (family flow) plus operator/reviewer/supervisor surfaces
  (may be routes within the same app).

**Out of scope / non-goals**
- No real CogAT administration, no real portal integration, no live aid/seat decisions
  (blockers B-01…B-08 in the PRD stay synthetic placeholders).
- No W-2/proof uploads; no fees. Synthetic income/household fixtures only.
- No AWS/Cognito/Aurora deployment (Milestone B target; not built here).
- Only `tsconfig.json` among shared-root files (references — final task).

## The eligibility firewall *(the load-bearing invariant — decisions already made)*
Prohibited inputs (income, household size, address/ZIP, name, DOB, gender, language, family
structure, prior-GT relatives, disability/accommodation, discipline/withdrawal, prose quality,
prestige, awards, paid enrichment, referral, research-consent, demographics) **never** enter the
Track A/Track B **capability-eligibility** determination or any decision hash. Income + household
size are used **only** at the allocation stage (banding). Enforce this in the type system + tests:
the eligibility function's input type physically cannot receive prohibited fields.

## Phasing (P0…P9) *(ordered build path — build the engine before the UI)*
- **P0** — `packages/admissions-contracts`: the 12 workflow statuses, 13 reason codes, 6-dim
  rubric `RB-SYN-01`, 17 error codes, decision-outcome enums, immutable versioning + `sha256`
  content hash + canonicalization (per PRD "Workflow Status, Reason Codes, and Contract Summary").
  Unit tests + a seeded smoke test (gate green from here).
- **P1** — application state machine: `draft → submitted → superseded`, immutable versions with
  `supersedes` pointer, optimistic concurrency (`expectedVersion`/`STALE_VERSION`), idempotency
  keys. Save/resume + two-session save/submit races.
- **P2** — CogAT intake + **automatic routing**: Track A cutoff → `TA_MET/BELOW`; Track B
  promising band + battery-profile rule → `TB_COMPOSITE_BAND`/`TB_BATTERY_PROFILE`/
  `TB_OUTSIDE_CONFIGURED_RULE`; `pending`/`invalid` → `ASSESSMENT_MISSING_OR_INVALID`. Golden
  routing table (synthetic profiles → exact outcome + ordered reason codes + result hash).
- **P3** — Track B Talent Snapshot: artifact route + bounded structured-narrative fallback
  (fixed synthetic fixtures; no uploads).
- **P4** — blind review: 2 reviewer slots + supervisor (on artifact-disagreement or from the
  start for narratives); 6-dim rubric; abstention/replacement; **averaged** review score vs cutoff
  → `qualifies`/`does_not_currently_qualify`; pending (not a low score) for blocked evidence.
- **P5** — income-banded lottery: household-size-adjusted bands, place by intake finance,
  **locked + replayable** seeded draw → `offered`/`not_offered`. Replay from retained seed+inputs.
- **P6** — admission/aid + research handoff (non-offered → next-cycle fee-waiver research invite);
  full decision trace + `replay_decision` reproduces every routing/review/allocation outcome.
- **P7** — `apps/family-portal`: profile + multi-step cycle application + save/resume + review &
  submit + status page + routing result + snapshot route + final decision. Accessible, calm.
- **P8** — Admissions Operator dashboard: completeness queue, CogAT intake/validation, reviewer
  assignment, seat/band config, correction-rerun. Cannot override eligibility/scores/draw.
- **P9** — Reviewer + blind Supervisor workspaces: assigned blind queue, 6-dim rubric with
  citations, draft → locked submit, abstain, blocker report. No peer-score visibility.

## Success Criteria *(each maps to a test; source = PRD "MVP Acceptance Checks")*
- **SC-1** locked fictional Track A baseline results are identical whether or not Track B is enabled.
- **SC-2** a promising below-cutoff CogAT profile yields a Track B **invitation**, not eligibility.
- **SC-3** Track B eligibility requires the CogAT gate **and** an averaged Snapshot score ≥ cutoff.
- **SC-4** Track A eligibility → automatic admission offer; never enters Snapshot or lottery.
- **SC-5** no-artifact routes to the narrative fallback with no penalty.
- **SC-6** artifact disagreement beyond tolerance always adds a blind supervisor; 3 scores averaged.
- **SC-7** prohibited fields cannot enter eligibility or its hash (type-level + test); income/
  household affect only allocation banding.
- **SC-8** the lottery is locked and **replayable**; eligibility computed with no income input.
- **SC-9** a non-offered applicant is distinguished from not-eligible + gets the research invite.
- **SC-10** every decision (routing/review/allocation/admission) replays from retained inputs+versions.
- **SC-11** applicant messages never imply "not gifted"; no message claims a measured program effect.
- **SC-12** gate green: `pnpm exec tsc -b` + `pnpm test` + `pnpm --filter @gt100k/family-portal build`.
- **manual:** family/child-facing tone, accessibility polish, and WCAG conformance — operator-reviewed
  on the PR (outside the automated headless DoD; WCAG audit needs real assistive tech).

## Golden Values + Tolerances
- CogAT routing: a synthetic table of composite/battery profiles → exact `{outcome, reasonCodes[],
  resultHash}` (Track A cutoff, Track B band, battery-profile rule are configurable synthetic
  constants; declare them in the contracts package and cite in tests).
- Rubric averaging: fixed per-dimension scores → exact Track B review score and qualify/not result.
- Lottery: fixed `{seed, bands, seats, eligible pool}` → exact offered/not-offered set; re-running
  with the same seed reproduces it byte-for-byte.

## Decisions Already Made
- Build the **averaged** rubric scoring (PRD target), not the legacy binary classification.
- In-memory adapters now; DB is a later adapter (keep ports clean). Synthetic fixtures in-repo.
- Pinned stack: React 18 / Next 14 / TypeScript / vitest / Zod for contracts; pnpm monorepo.
- Reason codes, statuses, rubric dims, error codes = the exact registers in `ADMISSIONS_PRD.md`.
- Eligibility firewall enforced at the type level (prohibited fields aren't in the input type).

## Defaults for the Unspecified
For anything unspecified here or in `ADMISSIONS_PRD.md`, choose the simplest correct synthetic
option, record it in `.loop/decisions.md`, and continue. Escalate `critical` only for a choice
that would break the eligibility firewall or invalidate an SC.

## Visual direction *(family/operator-facing — professional, NOT gamified)*
Clean, calm, trustworthy — like a serious admissions tool, not a game. Apply the **simplicity**
rules in `~/code/gt100k-factory/docs/game-feel.md` (one primary action per step, progressive
disclosure, cut words, generous whitespace) but **ignore the 3D/video-game parts** — this is a
forms-and-status product. Multi-step application with save/resume; never a wall of fields.

## Stack + Commands (pinned)
- pnpm monorepo. `packages/admissions-contracts`, `packages/admissions`; `apps/family-portal`
  (`@gt100k/family-portal`, hosts operator/reviewer/supervisor routes for the MVP).
- Gate: `pnpm exec tsc -b` + `pnpm test` + `pnpm --filter @gt100k/family-portal build`.
- Seed a green smoke test from P0. Git-ignored `.env.local.example` with placeholders.
