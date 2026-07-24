# Feature Specification: Concierge + Child-Safe RAG + Curated Library

**Feature Branch**: `015-concierge-rag`
**Created**: 2026-07-23
**Status**: Draft (loop-ready)

**Input**: B1 (Concierge Companion) + B2 (Routing + Safety Pipeline) + A6 (External Resource Router + Curated Library) in `docs/prd/passionApps.md`. A child asks the concierge a question about a niche; the system answers from a **curated library first**, falls back to **allowlist-biased open-web retrieval only on a genuine gap**, and wraps everything in a **staged, defense-in-depth safety pipeline** (the model is never the only gate). Served results are cached and **asynchronously vetted + promoted** into the curated library so it compounds. Grounding: `docs/prd/hardening/child-safe-rag.md` (the 10-stage pipeline, components, standards), `DISCOVERY-APP-PRD.md` (concierge as a porous escape valve; chat is never scored), `passion/CONTEXT.md`.

> **Loop-ready note.** Three parts: (A) a headless **domain package** `@gt100k/concierge` (the pure pipeline + curated library + typed **ports** for every AI/web checkpoint) on the `pnpm exec tsc -b` + `pnpm test` gate, driven by **deterministic stub adapters** (no network); (B) a **real adapter** package `@gt100k/concierge-live` — TFY-backed moderation/generation/faithfulness (OpenAI-compatible `fetch`, low-cost model, mirrors `tagger-tfy`/`tutor-tfy`) + an allowlist web retriever — **opt-in only, never in the gate**; (C) a minimal **Next chat app** `apps/concierge` whose **server route** runs the pipeline (default = stubs, so `next build` + the **`LOOP_QA`** usability gate stay deterministic; real adapters behind an env flag). **SYNTHETIC child data**; `TFY_API_KEY` used only by the live adapter/script.

---

## 1. Why & where it sits
The bounded cabin/taste layer can't cover the long tail; the concierge is the **porous escape valve** that turns a stated niche into a pointer to real learning material — safely. It is the riskiest subsystem (child-facing open-web generation), so the whole point is the **harness around the model**: retrieval is untrusted evidence, distress exits to a human, answers are grounded-or-refused, and the curated library (A6) is the compounding lever that shrinks live retrieval over time. It also feeds the discovery signal: a concierge answer converts a niche into a **testable probe** (never scored chat).

## 2. Scope Fence *(hard)*

### In scope
- **Domain package** `@gt100k/concierge` (`passion/packages/concierge`):
  - the request/response types + `AgeTier`; the **10-stage pipeline** `runConcierge(request, deps, now)` (§3.2), each stage able to refuse / deflect / escalate;
  - the **curated library (A6)**: `CuratedResource` (domain×mode-tagged, reputation, provenance, age-tiers), curated-first `resolve`, and `promote(...)`;
  - pure safety helpers: **PII scrub**, injection **spotlighting** (delimit/neutralize retrieved text), allowlist/**reputation** scoring;
  - the **async cache → vet-queue → promote** flow (deterministic; provenance via a `Hasher` port);
  - typed **ports** for the non-deterministic checkpoints: `Moderator`, `DistressClassifier`, `Retriever`, `Generator`, `Faithfulness`, `Readability`, `Hasher`;
  - **deterministic stub adapters** (in `__fixtures__` / `stubs`) implementing every port for CI + the app default.
- **Adapter package** `@gt100k/concierge-live` (`passion/adapters/concierge-live`): TFY-backed `Moderator`/`Generator`/`Faithfulness`/`DistressClassifier` (OpenAI-compatible `fetch`, `TFY_API_KEY`, default `gpt-5.4-mini`) + an **allowlist web `Retriever`** (`fetch` reputable sources → HTML→text; Chromium-render optional). Opt-in `concierge:live` script; **never imported by a test**.
- **App** `apps/concierge` (Next 14 / React 18): a minimal chat surface + a **server route/action** that runs `runConcierge`; default deps = stubs (deterministic); real deps behind `CONCIERGE_LIVE=1`. Implements **`window.__qa`**; WCAG 2.2 AA; reduced-motion.
- Synthetic fixtures (a curated library, a stub web corpus, requests) + tests mirroring every FR/SC.

### Out of scope
- **The two-axis tags themselves** (009) — reused to tag curated resources; not rebuilt.
- **A real human-vetting UI / moderation dashboard** — the vet queue is a value + deterministic `promote`; the reviewer surface is later (shares F1/G4 machinery).
- **Real consent/age-tier derivation** (G3) — `ageTier` is a server-supplied field; synthetic here.
- **Production provenance signing** (E1) — a `Hasher` port with a stub; the real signer is shared later.
- **The kid-facing production chat UI in the game** (A1/A2, teammate) — this app is a minimal engine surface, polished with the operator afterward.
- **Scoring the chat** — concierge chat emits at most a *probe suggestion*, never an interest score.

## 3. Domain model *(decisions already made — do not re-open)*

### 3.1 Types
```
AgeTier = "6-8" | "9-11" | "12-14"
ConciergeRequest  { kidId; ageTier; message; sessionId }
ConciergeResponse { kind: "answer" | "refused" | "escalated";
                    text?; citations?: Citation[]; resources?: CuratedResource[]; probe?: string; reason?: string }
Citation          { url; title; reputation }               // where the claim came from
CuratedResource   { id; title; url; domainPath; affordedModes; reputation; ageTiers: AgeTier[]; provenance }
RetrievedDoc      { url; title; text; reputation }
```
`domainPath`/`affordedModes` reuse `@gt100k/two-axis-tagging` (curated resources map to `(domain × mode)` cells → they can seed discovery). **Reuse those types.**

### 3.2 The pipeline `runConcierge(request, deps, now)` — each stage can refuse/deflect/escalate
1. **Session/age gate** — `ageTier` is a server fact on the request; attaches the tier's strictness params (§3.4).
2. **Input guard** — pure **PII scrub** of the message; `deps.moderator.moderate(msg, tier, "input")` (jailbreak/unsafe) → refuse; `deps.distress.assess(msg)` → **`escalated`** immediately (no retrieval, no generation; the concierge never counsels).
3. **Curated-first** — `library.resolve(request)`; if it covers the need, answer from curated (cite the curated resources) and **skip retrieval**.
4. **Gap-triggered retrieval** — only on a genuine gap: `deps.retriever.search(query, {ageTier})` → docs, **ranked by reputation/allowlist** (`reputation` scoring), capped.
5. **Per-doc filter** — for each doc, `deps.moderator.moderate(doc.text, tier, "doc")` (safety/quality/age) → drop failures; **spotlight** the surviving text (delimit; treat as untrusted).
6. **Grounded generation, cite-or-refuse** — `deps.generator.generate(query, docs, tier)` → `{ text, citations }` grounded in the passed docs; `deps.faithfulness.score(text, docs)` — if not grounded → **refuse** or fall back to curated. Never serve ungrounded text.
7. **Output moderation** — `deps.moderator.moderate(text, tier, "output")` (independent of step 2) → refuse on failure.
8. **Age-appropriateness + readability** — `deps.readability.shape(text, tier)` to the tier's reading level/tone.
9. **Serve** — `answer` with citations + a `probe` (the niche framed as the smallest testable next step). Chat is never scored.
10. **Async: cache → vet-queue → promote** — served open-web docs are cached provisionally and queued; `promote(item, decision)` folds a vetted resource into the library with `Hasher`-based provenance. Never blocks steps 1–9.

The orchestrator is **pure**: given deterministic ports it returns a deterministic `ConciergeResponse`. Any port throwing → **fail safe** (refuse), never leak.

### 3.3 Ports (interfaces) + stubs
```
Moderator          { moderate(text, tier, phase: "input"|"doc"|"output"): { safe: boolean; reason?: string } }
DistressClassifier { assess(message): { distress: boolean; reason?: string } }
Retriever          { search(query, opts): Promise<RetrievedDoc[]> }
Generator          { generate(query, docs, tier): Promise<{ text: string; citations: Citation[] }> }
Faithfulness       { score(answer, docs): { grounded: boolean; score: number } }
Readability        { shape(text, tier): string }
Hasher             { hash(bytes: string): string }
```
**Stub adapters** (deterministic, in-package): `Moderator` = denylist keyword match; `Distress` = distress-phrase match; `Retriever` = returns fixture docs from a synthetic corpus keyed by query; `Generator` = templated grounded answer built from the docs' sentences + citations (or the empty/ungrounded case for the refuse fixture); `Faithfulness` = answer tokens ⊆ docs' tokens; `Readability` = tier-parameterized truncate/simplify; `Hasher` = a stable non-crypto digest (real one shared from E1 later).

### 3.4 Constants (golden)
| Name | Value | Meaning |
|---|---|---|
| `AGE_TIERS` | `["6-8","9-11","12-14"]` | server-fact tiers |
| `FAITHFULNESS_MIN` | `0.6` | min grounding score to serve (else refuse) |
| `REPUTATION_FLOOR` | `0.5` | min source reputation to retain a doc |
| `MAX_DOCS` | `5` | retrieved docs capped before filtering |
| `STRICTNESS` | `{ "6-8": strict, "9-11": mid, "12-14": base }` | per-tier refusal/readability floors (a parameter, one pipeline) |

## 4. Phasing (P0…P7)
- **P0** — scaffold `@gt100k/concierge`; types + `AgeTier` + constants; smoke test.
- **P1** — curated library: `CuratedResource` + `resolve` (curated-first, domain×mode + reputation ranking). Golden.
- **P2** — pure safety helpers: PII scrub + injection spotlighting + reputation scoring. Unit.
- **P3** — ports + deterministic **stub adapters** for all seven. Unit.
- **P4** — `runConcierge` pipeline (all 10 stages) wired over the ports. *(Core.)* Golden end-to-end over fixtures.
- **P5** — async cache → vet-queue → `promote` (provenance via `Hasher`). Golden (promoted need resolves curated, no retrieval).
- **P6** — adapter `@gt100k/concierge-live` (TFY models + allowlist retriever) + parse tests (hermetic; fixtures) + an opt-in `concierge:live` script.
- **P7** — `apps/concierge` (chat + server route, stub deps default) + `window.__qa` + smoke/render test + `LOOP_QA`.

## 5. Success Criteria *(each maps to a test)*
- **SC-1** curated-first: a request the library covers is answered from curated and the (spy) retriever is **never called** — test.
- **SC-2** distress → `escalated` immediately; retriever/generator never called; no answer text — test.
- **SC-3** injection defense: a retrieved doc containing "ignore previous instructions…" is spotlighted and does **not** change the grounded answer/refusal — test.
- **SC-4** cite-or-refuse: when faithfulness `< FAITHFULNESS_MIN`, the response is `refused` (or curated fallback), never ungrounded `answer` — test.
- **SC-5** per-doc filter: an unsafe/low-reputation doc is dropped before generation — test.
- **SC-6** output moderation: an unsafe generated answer (independent of input) → `refused` — test.
- **SC-7** age-tier: the `6-8` tier applies the strictest refusal + readability floor (a parameter, same pipeline) — test.
- **SC-8** async promote: a served open-web result is cached + queued; `promote` folds it into the library with provenance; the same need then resolves curated (retriever not called) — golden test.
- **SC-9** determinism + fail-safe: identical request → identical response with stubs; any port that throws → `refused`, never a leak — test.
- **SC-10 (app)** the concierge app serves; `window.__qa` exposes `ready`/`error`/`state()` (last request kind + citation count) / `primaryAction()` (ask a seeded question); a seeded gap question → `answer` with citations, a seeded distress question → `escalated`; both observable in `state()` + DOM — render test + `LOOP_QA`.
- **SC-11** gate green: `pnpm exec tsc -b` + `pnpm test` (domain + adapter parse tests) and the app builds (`next build`) + `LOOP_QA` pass.
- **live (opt-in, not CI):** `concierge:live` answers a real question via TFY + web with cite-or-refuse; a real distress message escalates — manual/operator.

## 6. Golden Values *(exact)*
Fixtures in `src/__fixtures__/`: (a) a **synthetic curated library** (a handful of `CuratedResource`s tagged by domain×mode with reputations + age-tiers); (b) a **stub web corpus** keyed by query (incl. one doc with an embedded injection, one low-reputation/unsafe doc, and a clean grounded doc); (c) **fixture requests** — a covered need (→ curated, no retrieval), a genuine gap (→ retrieve → filter → grounded answer + citations + probe), a distress message (→ escalated), an ungrounded case (→ refused), an unsafe-output case (→ refused). Assert the exact `ConciergeResponse.kind`, citations, dropped-doc set, and (for SC-8) that a promoted resource flips the covered path to curated. `Hasher` digests are asserted as stable strings.

## 7. Decisions Already Made
- **[D1]** Live open-web **behind the full harness, uniform across ages** (age tier = a strictness parameter, one pipeline) — per `hardening/child-safe-rag.md`.
- **[D2]** Retrieval is **untrusted evidence, not an answer**; the model is **never the only gate** (grounding + moderation + age-gate around it).
- **[D3]** **Curated-first**; open-web retrieval only on a genuine gap; **allowlist-biased** ranking.
- **[D4]** **Distress/safety exits the RAG lane immediately** to a human; the concierge never counsels/impersonates a professional.
- **[D5]** **Cite-or-refuse** generation with a **faithfulness gate**; never serve ungrounded output.
- **[D6]** Injection defense is **architectural** (spotlighting + treat all retrieved text as untrusted), not a single filter.
- **[D7]** Cache → human-vet → **promote** runs **async** and never blocks the live answer; the curated library is the compounding lever.
- **[D8]** Every AI/web checkpoint is a **port**; **deterministic stubs** power CI + `LOOP_QA`; **TFY + web real adapters** are opt-in (`concierge:live`), never in the gate.
- **[D9]** SYNTHETIC child data; `TFY_API_KEY` only in the live adapter/script; **low-cost model** default `gpt-5.4-mini` (`TFY_CONCIERGE_MODEL` to override).
- **[D10]** Concierge chat is **never scored**; it emits at most a testable **probe** suggestion.

## 8. Defaults for the Unspecified
Simplest correct option; record in `.loop/decisions.md`; continue. Escalate `critical` only if a choice would invalidate an SC (esp. SC-2/SC-4/SC-6 — the safety exits — and SC-10's `LOOP_QA` determinism).

## 9. Loop notes
- **Domain + adapter packages:** headless; gate = `tsc -b` + `test`; the live adapter is opt-in and **never imported by a test** (parse-only hermetic tests + fixtures, like `tagger-tfy`).
- **App:** `LOOP_QA=1` with `LOOP_QA_CMD="pnpm --filter @gt100k/concierge start"` (after `next build`) + a `LOOP_QA_PORT`; default deps are **stubs** so the served app is deterministic and offline; `window.__qa` (`ready`, `error`, `state()`, `primaryAction()`).
- **Requires `pnpm install`** (not `--frozen`) — packages import `@gt100k/two-axis-tagging` (+ the app imports `@gt100k/concierge`); the adapter adds nothing beyond `fetch`.
- New files under `passion/packages/concierge` + `passion/adapters/concierge-live` + `passion/apps/concierge` + appended root `tsconfig.json` references. Single lane (new app; disjoint from guide-console).

## 10. Stack + Commands (pinned)
- Domain `passion/packages/concierge` (`@gt100k/concierge`), dep `@gt100k/two-axis-tagging`. Adapter `passion/adapters/concierge-live` (`@gt100k/concierge-live`), dep `@gt100k/concierge` (+ native `fetch`; TFY OpenAI-compatible gateway `https://tfy.promptlens.trilogy.com/openai/v1`, `TFY_API_KEY`, default `gpt-5.4-mini`). App `passion/apps/concierge` (`@gt100k/concierge`): Next 14, React 18, motion@12; `transpilePackages` the workspace deps (mirror `guide-console`).
- Gate: `pnpm exec tsc -b` + `pnpm test`; app `next build` + `LOOP_QA` usability pass.
- TS strict (`noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `composite`); vitest; **no network in the gate** (stubs only); the live adapter uses `fetch` and is opt-in.
