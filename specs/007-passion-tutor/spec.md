# Feature Specification: Passion-Project Socratic Tutor

An AI tutor that **spontaneously interviews a student about their own passion project** —
what it is, why it matters to them, how it works, and what's next — adapting its follow-ups to
their answers, surfacing where their understanding is thin, and logging the dialogue as
evidence. Motivated by the finding that students often can't articulate their own projects.
Distinct from the academic answer-blind tutor (PRD §13): that helps solve academic problems;
this deepens **ownership and metacognition of a passion project**.

> Synthetic-only, PR-only. This is child-facing — the operator reviews before merge.

## Scope Fence *(loop-ready)*
**In scope**
- A pure, framework-agnostic domain package `packages/passion-tutor` (fully unit-tested core).
- In-memory/stub adapters under `adapters/*` (project source, evidence sink).
- A Next.js app `apps/passion-tutor` — a calm, one-question-at-a-time interview UI.

**Out of scope / non-goals**
- No LLM or external API calls. The question engine and answer assessment are **deterministic,
  rules/heuristics-based, and seeded** (so the whole feature is headless-testable). "AI" here =
  an adaptive rules engine over the project's facets, not a model call.
- No real child data. Synthetic students/projects only.
- No grading of the child. Coverage/understanding scores describe *articulation*, never worth.
- No changes to shared-root files except `tsconfig.json` (add the new package/app to
  `references` — the final task).

## Domain model *(decisions already made — do not re-open)*
- **Facets** (the things a student should be able to articulate about their project), fixed set:
  `what` (what the project is), `why` (why it matters to them), `how` (how it works /
  approach), `challenge` (hardest part / what's stuck), `next` (what's next), `audience`
  (who it's for). Each facet has a coverage score in `[0,1]`.
- **ProjectProfile**: `{ id, studentId, title, domain, summary, artifactRefs[] }` (synthetic).
- **Question bank**: per-facet Socratic question templates (≥3 per facet), plus follow-up
  templates keyed to a thin answer (e.g., "Say more about *why* that part matters to you").
- **Answer assessment (deterministic)**: score an answer's articulation for the asked facet in
  `[0,1]` from observable signals — normalized length, presence of reasoning markers
  (`because`, `so that`, `if`, `then`, `first`, `next`), specificity (numbers, proper nouns,
  domain terms from the profile), minus filler. Exact formula in Golden Values; **no NLP model**.
- **Question engine (adaptive)**: each turn, pick the next question for the **least-covered
  facet**; ties broken by a fixed facet order (`what, why, how, challenge, next, audience`).
  If the last answer scored below `THIN = 0.45`, ask a **follow-up** on the same facet instead
  of moving on (max 1 consecutive follow-up per facet). Deterministic given `(profile, seed,
  transcript)`.
- **Session**: ordered turns `{ facet, questionId, isFollowUp, answerText, score }`; ends when
  every facet has coverage ≥ `COVERED = 0.6` **or** after `MAX_TURNS = 12`.
- **Gaps**: facets with final coverage `< COVERED` = surfaced understanding gaps.
- **Evidence record** (ties to `002-evidence-graph`): the finished session emits
  `{ studentId, projectId, transcript, coverageByFacet, gaps, createdAt }`, serialized with the
  evidence-graph canonicalization and content hash (`sha256` over JCS-canonical JSON) so it can
  be ingested by EvidenceGraph. The domain emits the record; an adapter maps it to the graph.

## Phasing (P0…P6) *(ordered build path)*
- **P0** — domain: facets, question bank, deterministic answer assessment, adaptive engine, gap
  detection. Full unit tests + golden values. (This is the reliable core.)
- **P1** — session runner + evidence-record emission (content hash golden value).
- **P2** — adapters: in-memory project repo + evidence-sink stub; seeded synthetic students/projects.
- **P3** — `apps/passion-tutor` scaffold + a seeded smoke test so the gate is green from iter 1.
- **P4** — interview UI: one question at a time, answer input, adaptive follow-ups, transcript.
- **P5** — "understanding map" (facet coverage) + end-of-session summary that names the gaps
  kindly ("Let's revisit *how it works* next time").
- **P6** — polish: calm/warm, reduced-motion, a11y, empty/first-run states.

## Success Criteria *(each maps to a test)*
- **SC-1** engine picks the least-covered facet (order-tie-broken) — unit test.
- **SC-2** a thin answer (`score < THIN`) triggers exactly one same-facet follow-up — unit test.
- **SC-3** answer assessment matches the golden formula on fixture answers (±0.001) — unit test.
- **SC-4** a session ends at all-covered or `MAX_TURNS`; gaps = facets `< COVERED` — unit test.
- **SC-5** the evidence record's content hash is stable for a fixed session (golden hash) — unit test.
- **SC-6** the UI shows one question, accepts an answer, advances/asks a follow-up, and renders
  the coverage map + summary — component/render tests.
- **SC-7** gate green: `pnpm exec tsc -b` + `pnpm test` + `pnpm --filter @gt100k/passion-tutor build`.
- **manual:** child-facing tone/UX quality — operator-reviewed on the PR (outside the automated DoD).

## Golden Values + Tolerances *(exact)*
- Constants: `THIN = 0.45`, `COVERED = 0.6`, `MAX_TURNS = 12`, facet order
  `[what, why, how, challenge, next, audience]`.
- Answer score = `clamp01( 0.4*lenNorm + 0.35*reasoningMarkers + 0.25*specificity )` where
  `lenNorm = min(words/40, 1)`, `reasoningMarkers = min(markerCount/3, 1)`,
  `specificity = min((numbers+properNouns+domainTerms)/4, 1)`. Provide a fixtures table of
  ≥6 answers → expected scores (±0.001) in `packages/passion-tutor/src/__fixtures__/`.
- One fully-worked seeded session (fixed profile + scripted answers) → exact ordered question
  sequence + per-facet coverage + gap list + evidence content hash, asserted in tests.

## Decisions Already Made
- Deterministic rules engine, **no LLM/network** (keeps it synthetic + headless-testable).
- Pinned stack: React 18 / Next 14 / TypeScript / vitest; pnpm monorepo. Motion = `motion@^12`.
- Evidence hash reuses `packages/evidence-graph` canonicalization (import it; don't reinvent).
- One question on screen at a time (this is the simplicity guarantee).

## Defaults for the Unspecified
For anything this spec doesn't specify, choose the simplest correct option, record it in
`.loop/decisions.md`, and continue. Escalate `critical` only if a choice would invalidate an SC.

## Visual direction *(child-facing — calm, not a video game)*
Warm, encouraging, conversational. **One question at a time** (never a wall of fields). A gentle
progress/"understanding map" that fills as facets are covered; a kind end summary. Follow the
simplicity rules in `~/code/gt100k-factory/docs/game-feel.md` (few elements, cut words, calm
motion) — but this is a focused chat surface, **not** a 3D game. Reduced-motion is a first-class mode.

## Stack + Commands (pinned)
- pnpm monorepo. Domain `packages/passion-tutor`; app `apps/passion-tutor` (`@gt100k/passion-tutor`).
- Gate: `pnpm exec tsc -b` + `pnpm test` + `pnpm --filter @gt100k/passion-tutor build`.
- Seed a green smoke test in the app from P3. Commit a git-ignored `.env.local.example` if any env is needed.
