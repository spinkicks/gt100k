# @gt100k/socratic-defense

An AI that **interviews a child about their *own* project** — what it is, why it matters to them, how it
works, the hardest part, what's next, who it's for — adapting follow-ups to their answers, surfacing where
their articulation is thin, and logging the dialogue as a tamper-evident **evidence record**.

This is `E2` in `docs/prd/passionApps.md` (the assessment/defense surface): a metacognition +
authorship-verification tool grounded in the passion research that authorship + understanding are verified
by a person **explaining their own work** (`passionBrainlift.md` SPOV 5, the five-minute human defense).

- **Is:** a tool to (1) deepen ownership/understanding (articulating deepens it) and (2) surface
  articulation gaps, emitting an evidence record of the dialogue for the EvidenceGraph/defense.
- **Is not:** a content teacher, a grader (it emits *evidence*, never an of-record grade — a human owns any
  grade downstream), or an AI-detector.

**Not yet wired into a product.** The package is complete and tested, but no app under `passion/apps/`
imports it; its only consumers today are its own tutor adapters and its demo. Treat the API below as
settled and the integration as unbuilt.

## Architecture: LLM conducts, deterministic scaffold governs

- The **LLM conducts** (behind ports): it generates each next question grounded in the project +
  transcript, and judges each answer (`{ coverage, rationale, thin }`).
- The **deterministic scaffold governs** (pure, unit-tested, in CI): facet-coverage tracking, next-facet
  selection, follow-up/stop logic, gap detection, readiness parameterization, evidence-record assembly +
  content hash, and the human-owns-grade guardrail.
- **CI is offline + deterministic**: a scripted stub implements the ports from a recorded fixture. The live
  TrueFoundry adapter is opt-in, never in CI.

## Domain model

- **6 fixed facets**, fixed order: `[what, why, how, challenge, next, audience]`. Each has a coverage in
  `[0,1]`, updated **monotonic-max**.
- **Readiness** (`emerging | developing | fluent`) — not age — is the one thing that changes how the
  interview runs. Deterministically it sets the follow-up cap (`emerging: 2`, `developing: 1`,
  `fluent: 1`); it is also passed to both ports every turn, so an LLM interviewer can pitch the question,
  but the scaffold makes no further use of it.
- **Scaffold constants:** `COVERED = 0.6` and `MAX_TURNS = 12` drive the loop. `THIN = 0.45` does **not** —
  the scaffold reads the judge's boolean `Judgment.thin` and never compares a number. `THIN` is exported
  for the judge side to apply, and `@gt100k/tutor-tfy` uses it exactly once, as the fallback when a model
  returns a coverage but omits `thin`. Keeping the number here rather than in the adapter is what stops two
  judges from disagreeing about what "thin" means.
- The session probes the **least-covered** facet (fixed-order tie-break), re-probes a **thin** facet up to
  the readiness cap, and stops when every facet `≥ COVERED` **or** `turns ≥ MAX_TURNS`. **Gaps** = facets
  `< COVERED` at stop.

## Public API

| Export | What |
|---|---|
| `FACET_ORDER`, `Facet`, `isFacet` | the 6 facets + guard |
| `ReadinessLevel`, `maxFollowup`, `MAX_FOLLOWUP` | readiness → follow-up cap |
| `THIN`, `COVERED`, `MAX_TURNS` | scaffold constants |
| `ProjectProfile`, `Judgment`, `Turn`, `Session`, `EvidenceRecord`, `Hasher` | domain types |
| `initialCoverage`, `updateCoverage`, `selectNextFacet`, `isComplete`, `computeGaps` | the scaffold |
| `Interviewer`, `AnswerJudge`, `TutorPorts` | the LLM ports |
| `runSession`, `AnswerSource`, `RunSessionInput` | drive an interview to stop |
| `assembleEvidenceRecord`, `toEvidenceNode`, `EvidenceNodeLike` | evidence emission |

## Ports & adapters

| Port | Adapters |
|---|---|
| `Interviewer` / `AnswerJudge` | `@gt100k/tutor-stub` (scripted, CI) · `@gt100k/tutor-tfy` (TrueFoundry, opt-in) |

The evidence hash uses this package's **own copy** of `canonicalize` (JCS key ordering), kept
honest by a parity test that pins it byte-for-byte against `@gt100k/evidence-graph`'s implementation. It is
deliberately not imported: the EvidenceGraph is a standalone product intended for extraction
(`docs/decisions/evidencegraph-v1-design.md` §11/§13a), and nothing outside `@gt100k/evidence-*` may import a
value from inside it. Hoisting `canonicalize` into a shared package would invert the dependency —
evidence-graph would then depend on a passion-side package and stop being buildable in isolation — so a small
duplicate under a parity test is the cheaper trade. `Hasher` and `EvidenceNodeLike` are local structural types
for the same reason, so this package imports no value from the `evidence-*` namespace; the record it emits is
plain data that an evidence sink materializes.

The record carries **no grade field** (invariant). `assembleEvidenceRecord` is a separate step from `runSession`, so
the interview and the hashing stay decoupled; the `Hasher` is injected (tests/demo use a `node:crypto`
inline hasher).

## Live adapter (opt-in, never in CI)

`@gt100k/tutor-tfy` uses native `fetch` against `POST {TFY_BASE_URL}/chat/completions`
(`TFY_BASE_URL` default `https://tfy.promptlens.trilogy.com/openai/v1`, model `TFY_TUTOR_MODEL` default
`gpt-5.4-mini`). Env only for the live run — see `passion/adapters/tutor-tfy/.env.local.example`; the CI
gate needs no env. Run it manually: `pnpm --filter @gt100k/tutor-tfy tutor:live`.

## Commands

- Test: `pnpm --filter @gt100k/socratic-defense test`
- Demo (headless): `pnpm --filter @gt100k/socratic-defense exec tsx src/demo.ts` — runs one scripted
  session end-to-end and prints the gradeless, hashed evidence record.
