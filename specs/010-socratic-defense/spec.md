# Feature Specification: Socratic Project Defense/Tutor

**Feature Branch**: `010-socratic-defense`
**Created**: 2026-07-22
**Status**: Draft (loop-ready)

**Input**: An AI that **interviews a child about their *own* project** — what it is, why it matters to them, how it works, the hardest part, what's next, who it's for — adapting follow-ups to their answers, surfacing where their understanding/articulation is thin, and logging the dialogue as a tamper-evident **evidence record**. Motivated by the GT observation that *students often can't articulate their own projects*, and grounded in the passion research that authorship + understanding are verified by a person **explaining their own work** (`passionBrainlift.md` SPOV 5, the five-minute human defense). This is `E2` in `docs/prd/passionApps.md` (the assessment/defense surface) and the rebuilt successor to the archived `007-passion-tutor`. Grounding: `SPECIALIZATION-PIPELINE-PRD.md` §7.2, `docs/research/passion-pipeline/05-assessment-measurement.md`, `passion/CONTEXT.md`.

> **Loop-ready note (read first).** Built by an autonomous loop whose gate is `pnpm exec tsc -b` + `pnpm test`. It pre-answers decisions (**Decisions Already Made**), pins the stack, gives golden values, and states one catch-all (**Defaults for the Unspecified**). **No live child data — SYNTHETIC ONLY.** The LLM interviewer/judge is behind **ports**: the deterministic scaffold + all CI tests use a **scripted stub** (recorded questions + recorded judgments); the real TrueFoundry adapter is exercised only by an opt-in, non-CI script. **No served app → `LOOP_QA` is N/A**; the DoD is typecheck + test.

---

## 1. What this is (and is not)

- **Is:** a metacognition + authorship-verification tool. It interviews a kid about a project they made, to (1) **deepen ownership/understanding** (articulating deepens it) and (2) **surface articulation gaps**, emitting an **evidence record** of the dialogue for the EvidenceGraph/defense.
- **Is not:** a content teacher (that is the academic answer-blind tutor), a grader (it emits *evidence*, never an of-record grade — a human owns any grade downstream), or an AI-detector (forbidden; `passionBrainlift` SPOV 4).

## 2. The architecture (decided): LLM conducts, deterministic scaffold governs

- The **LLM conducts**: it generates each next question **grounded in the project + transcript**, and **judges each answer** (structured JSON: the facet's articulation `coverage` in `[0,1]` + a short `rationale` + a `thin` flag). Behind ports; the real adapter is TrueFoundry.
- The **deterministic scaffold governs** (pure, unit-tested, in CI): facet-coverage tracking, next-facet selection, follow-up/stop logic, gap detection, readiness parameterization, evidence-record assembly + content hash, and the human-owns-grade guardrail.
- **CI is offline + deterministic**: a **scripted stub** implements the ports from a recorded fixture (questions + judgments), yielding a fully deterministic session (golden transcript, coverage, gaps, evidence hash). The **live TFY adapter is opt-in**, never in CI. (Same port pattern as `009`.)

---

## 3. Scope Fence *(hard)*

### In scope
- A **pure TypeScript domain package** `@gt100k/socratic-defense` (`passion/packages/socratic-defense`): facets, the session scaffold (selection/follow-up/stop), coverage math, gap detection, readiness parameterization, evidence-record assembly + content hash (via `@gt100k/evidence-graph` canonicalization — reused, not reinvented), and the human-owns-grade guardrail.
- **Ports**: `Interviewer.nextQuestion(ctx)` and `AnswerJudge.judge(ctx)` (may be one `Tutor` implementing both).
- **Adapters**: `@gt100k/tutor-stub` (`passion/adapters/tutor-stub`, deterministic scripted — CI) and `@gt100k/tutor-tfy` (`passion/adapters/tutor-tfy`, TrueFoundry via native `fetch`, opt-in).
- **Seed fixtures**: synthetic project profiles + one fully-scripted session (questions + judgments) with golden outputs.
- **Tests**: unit + contract, mirroring every FR/SC, incl. golden transcript/coverage/gaps + a stable evidence content hash.
- A headless `demo` script running one scripted session end-to-end and printing the evidence record.

### Out of scope
- **Live open-web / RAG** (that is `011-concierge`).
- **The EvidenceGraph itself** (exists — `passion/packages/evidence-graph`; this feature *emits a record + hash* using its canonicalization and provides a `toEvidenceNode()` mapper; it does not modify the graph).
- **Any of-record grade** — the tutor never grades; it emits evidence a human later grades.
- **A rich chat UI** — a minimal one-question-at-a-time surface may be a later phase; this feature is the headless engine + adapters.
- **Live network in CI** — the TFY adapter is contract-tested against a recorded fixture; live calls are opt-in.

---

## 4. Domain model *(decisions already made — do not re-open)*

### 4.1 Facets (fixed set of 6)
`what` (what the project is), `why` (why it matters to them), `how` (how it works / approach), `challenge` (hardest part / what's stuck), `next` (what's next), `audience` (who it's for). Each facet has a coverage in `[0,1]`. Fixed order (tie-break): `[what, why, how, challenge, next, audience]`.

### 4.2 ProjectProfile (synthetic)
`{ id, studentId, title, domain, summary, artifactRefs: string[] }`.

### 4.3 Readiness (drives scaffolding, not age)
`readinessLevel: "emerging" | "developing" | "fluent"` — derived by the caller from demonstrated domain-experience + self-regulation (not birthday; consistent with ADR-0? / `hardening`). It parameterizes: `probeDepth` hint passed to the LLM, and `MAX_FOLLOWUP` (emerging = 2, developing = 1, fluent = 1). Deterministic mapping.

### 4.4 Judgment (LLM → scaffold)
`{ facet, coverage: number[0,1], rationale: string, thin: boolean }`. `thin` is `coverage < THIN`.

### 4.5 Turn + Session
`Turn { index, facet, question, isFollowUp, answer, coverage }`.
`Session { profile, readinessLevel, turns[], coverageByFacet, gaps, status: "active"|"complete" }`.

### 4.6 EvidenceRecord (the output)
`{ studentId, projectId, title, domain, readinessLevel, turns[], coverageByFacet, gaps, createdAt, contentHash }` where `contentHash = sha256(canonicalize(record-without-contentHash))` using `@gt100k/evidence-graph` `canonicalize` + `@gt100k/evidence-hash-node`. It carries **no grade field** (invariant). A `toEvidenceNode(record)` mapper returns an evidence-graph `Artifact`-shaped node for later ingestion.

### 4.7 The scaffold logic (deterministic — the crux)
Given the running session + a fresh `Judgment` for the last answer:
1. **Update coverage:** `coverageByFacet[facet] = max(prev, judgment.coverage)` (monotonic).
2. **Follow-up vs advance:** if `judgment.thin` **and** follow-ups used for that facet `< MAX_FOLLOWUP(readiness)` → next turn re-probes the **same** facet (`isFollowUp = true`); else advance.
3. **Next facet (on advance):** the **least-covered** facet; ties broken by the fixed facet order.
4. **Stop:** when **every** facet `≥ COVERED` **or** `turns.length ≥ MAX_TURNS` → `status = "complete"`.
5. **Gaps:** at stop, facets with coverage `< COVERED`.
Deterministic given `(profile, readiness, ordered judgments)` — golden-tested.

---

## 5. Ports & adapters

| Port | Contract | Adapters |
|---|---|---|
| `Interviewer` | `nextQuestion(ctx: { profile, transcript, targetFacet, isFollowUp, readinessLevel }): Promise<string>` | `tutor-stub` (scripted), `tutor-tfy` (TFY) |
| `AnswerJudge` | `judge(ctx: { profile, facet, question, answer, readinessLevel }): Promise<Judgment>` | `tutor-stub` (scripted), `tutor-tfy` (TFY) |

The scaffold depends only on these structural contracts. `runSession({ profile, readinessLevel, ports, answerSource })` drives turns until stop (bounded by `MAX_TURNS`), where `answerSource(ctx)` supplies the child's answer each turn (live UI in production; a recorded replay in CI). Evidence assembly (`assembleEvidenceRecord(session, createdAt, hasher)`) is a **separate** step so the interview and the hashing stay decoupled.

### 5.1 TrueFoundry adapter (`tutor-tfy`) — reuses 009's verified integration
- Native `fetch`; **`POST {TFY_BASE_URL}/chat/completions`**, `TFY_BASE_URL` default **`https://tfy.promptlens.trilogy.com/openai/v1`**; auth `Bearer ${TFY_API_KEY}`; model `TFY_TUTOR_MODEL` default **`gpt-5.4-mini`** (verified 2026-07-22). No SDK dependency.
- `nextQuestion` → a plain question string (JSON `{ "question": "..." }`, parsed; fallback to a templated question on malformed).
- `judge` → strict JSON `{ "coverage": 0..1, "rationale": "...", "thin": bool }` via `response_format:{type:"json_object"}`, `temperature:0`; schema-validated; malformed → a safe default judgment (`coverage:0, thin:true, rationale:"judge-parse-failed"`), never a throw.
- **Not in CI**: contract-tested against recorded fixtures; opt-in `tutor:live` script for manual verification.

---

## 6. Phasing (P0…P5)
- **P0** — facets, records, readiness mapping, constants; validators. Unit tests + golden constants.
- **P1** — the deterministic scaffold (coverage update, follow-up/stop, next-facet, gap detection). Full unit tests + golden. *(The reliable core.)*
- **P2** — ports + `runSession` + `tutor-stub` (scripted). A fully-scripted golden session (transcript/coverage/gaps).
- **P3** — evidence-record assembly + content hash (reusing `@gt100k/evidence-graph` canonicalize + `@gt100k/evidence-hash-node`) + `toEvidenceNode` mapper + the human-owns-grade guardrail. Golden hash.
- **P4** — `tutor-tfy` adapter (native fetch, `gpt-5.4-mini`, JSON judge) + parse tests vs recorded fixtures + opt-in `tutor:live`.
- **P5** — `demo` script (scripted session → printed evidence record) + README.

---

## 7. Success Criteria *(each maps to a test)*
- **SC-1** facets + fixed order + readiness→`MAX_FOLLOWUP` mapping match the golden constants — unit test.
- **SC-2** coverage update is monotonic max per facet — unit test.
- **SC-3** a `thin` answer (`coverage < THIN`) triggers a same-facet follow-up, capped at `MAX_FOLLOWUP(readiness)`; then advances — unit test (incl. emerging=2 vs fluent=1).
- **SC-4** next-facet on advance = least-covered, fixed-order tie-break — unit test.
- **SC-5** session stops at all-facets-`≥COVERED` **or** `MAX_TURNS`; gaps = facets `< COVERED` — unit test.
- **SC-6** a fully-scripted session (fixed profile + recorded Qs + recorded judgments) yields the exact golden ordered transcript, `coverageByFacet`, and `gaps` — golden test.
- **SC-7** the evidence record has **no grade field**, and its `contentHash` is a stable 64-hex sha256 that is identical across two assemblies of the same session — golden/determinism test (exact literal locked on first green run).
- **SC-8** `tutor-tfy` `judge` parses a recorded JSON judgment; a malformed response yields the safe default judgment (no throw) — contract test.
- **SC-9** gate green: `pnpm exec tsc -b` + `pnpm test`.
- **manual:** one live `tutor:live` run produces a sensible grounded question + a schema-valid judgment — operator-run, outside CI.

## 8. Golden Values *(exact)*
- Constants: `THIN = 0.45`, `COVERED = 0.6`, `MAX_TURNS = 12`, `MAX_FOLLOWUP = { emerging: 2, developing: 1, fluent: 1 }`, facet order `[what, why, how, challenge, next, audience]`.
- One synthetic `ProjectProfile` + a scripted session (recorded questions + judgments per turn) in `src/__fixtures__/`, with the exact expected transcript, `coverageByFacet`, `gaps`, and (locked-on-first-run) evidence `contentHash`.

## 9. Decisions Already Made
- **[D1]** LLM conducts (questions + answer-judgment); a deterministic scaffold governs structure + guardrails + evidence emission.
- **[D2]** 6 fixed facets; coverage `[0,1]`; monotonic-max update; least-covered selection; `THIN`/`COVERED`/`MAX_TURNS`/`MAX_FOLLOWUP` per §8.
- **[D3]** Readiness (not age) parameterizes scaffolding.
- **[D4]** Emits an **evidence record**, never a grade; a human owns any downstream grade. Reuse `@gt100k/evidence-graph` canonicalization for the hash (import; don't reinvent).
- **[D5]** TFY via native `fetch`, `…/openai/v1`, `gpt-5.4-mini` (env-overridable `TFY_TUTOR_MODEL`); adapter behind a port; never in CI.
- **[D6]** Pinned stack: TypeScript / vitest; pnpm monorepo; packages under `passion/`, names `@gt100k/*`.
- **[D7]** SYNTHETIC ONLY; no real child data; no PII in fixtures.

## 10. Defaults for the Unspecified
For anything unspecified, choose the simplest correct option, record it in `.loop/decisions.md`, and continue. Escalate `critical` only if a choice would invalidate an SC.

## 11. Loop notes
- **No served app** → `LOOP_QA` N/A; DoD = `pnpm exec tsc -b` + `pnpm test`.
- **No network in CI**; **no new external dependency** (native `fetch`; reuses in-repo `@gt100k/evidence-graph` + `@gt100k/evidence-hash-node`).
- **In-lane**: new files under `passion/packages/socratic-defense`, `passion/adapters/tutor-stub`, `passion/adapters/tutor-tfy`, plus added lines in root `tsconfig.json` references. (`@gt100k/evidence-graph`/`evidence-hash-node` are consumed read-only — not modified.)
- **Parallel-safe with `009`**: disjoint files except both append a reference line to root `tsconfig.json` (a trivial, one-line merge).

## 12. Stack + Commands (pinned)
- pnpm monorepo. Domain `passion/packages/socratic-defense` (`@gt100k/socratic-defense`); adapters `passion/adapters/tutor-stub`, `passion/adapters/tutor-tfy`.
- Gate: `pnpm exec tsc -b` + `pnpm test`.
- Env for the live adapter only: `TFY_API_KEY`, `TFY_BASE_URL` (default `https://tfy.promptlens.trilogy.com/openai/v1`), `TFY_TUTOR_MODEL` (default `gpt-5.4-mini`). Commit a git-ignored `.env.local.example`; never commit a token. The CI gate needs no env.
- Add the new packages to root `tsconfig.json` references (final task). `vitest.config.ts` already globs `passion/{packages,adapters}/**/test/**`.
