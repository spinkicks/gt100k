# Concierge + Child-Safe RAG + Curated Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Checkbox steps; commit after each task.

**Goal:** Build `015-concierge-rag` per its spec — a headless domain package (`@gt100k/concierge`: the 10-stage child-safe pipeline + curated library + typed ports + deterministic stubs), a real adapter (`@gt100k/concierge-live`: TFY models + allowlist web retriever, opt-in), and a minimal Next chat app (`apps/concierge`) whose server route runs the pipeline (stub deps by default) and implements `window.__qa`.

**Architecture:** A **pure** pipeline over **ports** for every non-deterministic checkpoint (moderation, distress, retrieval, generation, faithfulness, readability, hashing). **Stub adapters** make the whole thing deterministic + offline for the CI gate and the served app; **real adapters** (TFY via `fetch`, low-cost model; web via allowlist `fetch`) are opt-in and never imported by a test — exactly the `tagger-stub`/`tagger-tfy` split.

**Tech Stack:** TS (strict, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `composite`), vitest; Next 14 / React 18 / motion@12 for the app (mirror `guide-console`).

## Global Constraints
- **SYNTHETIC child data.** Domain/adapter gate = `pnpm exec tsc -b` + `pnpm test`; app = `next build` + `LOOP_QA`.
- **No network in the gate.** The live adapter uses `fetch` + `TFY_API_KEY` and is **only** called by the opt-in `concierge:live` script — never by a test. Hermetic tests use fixtures/parse-only (mirror `tagger-tfy`).
- **`pnpm install` (NOT `--frozen`)** after each new `package.json`. Lockfile committed.
- `import type` for types; guard `T | undefined`. Everything immutable; **fail safe** — any port that throws ⇒ `refused`, never a leak.
- Reuse `@gt100k/two-axis-tagging` domain×mode types. Constants golden (spec §3.4). Commit after each task.
- Safety exits are non-negotiable: **distress ⇒ escalate immediately**; **ungrounded ⇒ refuse**; **unsafe input/doc/output ⇒ refuse/drop**.

---

### Task 0: Scaffold `@gt100k/concierge`
**Files:** `passion/packages/concierge/{package.json,tsconfig.json,src/index.ts,test/smoke.test.ts}`; root `tsconfig.json`.
- [ ] Failing smoke test; `package.json` (`@gt100k/concierge`, dep `@gt100k/two-axis-tagging`, `test` script `vitest run --root ../.. packages/concierge/test`); `tsconfig.json` (extends base; reference `../two-axis-tagging`); `src/index.ts` → `export {};`; append root reference.
- [ ] `pnpm install` → `pnpm exec tsc -b && pnpm test` PASS. **Commit** `feat(concierge): scaffold @gt100k/concierge`.

---

### Task 1: Types + constants (P0)
**Files:** `src/model.ts`, `test/model.test.ts`; barrel.
- [ ] Define `AgeTier`, `ConciergeRequest`, `ConciergeResponse`, `Citation`, `CuratedResource`, `RetrievedDoc` (spec §3.1) and constants `AGE_TIERS`, `FAITHFULNESS_MIN`, `REPUTATION_FLOOR`, `MAX_DOCS`, `STRICTNESS` (§3.4). Reuse `DomainPath`/`WorkMode` from `@gt100k/two-axis-tagging`.
- [ ] Unit test pins the constants + a type-level smoke. **Commit** `feat(concierge): types + golden constants`.

---

### Task 2: Curated library (A6) — curated-first resolve (P1)
**Files:** `src/library.ts`, `test/library.test.ts`; barrel.
**Interfaces:** `CuratedLibrary` (immutable value = `readonly CuratedResource[]`); `resolve(lib, request): CuratedResource[]` (match by `domainPath`/`affordedModes` inferred from the request + `ageTier` eligibility, ranked by reputation, capped); `covers(lib, request): boolean`; `withResource(lib, r): CuratedLibrary`.
- [ ] **Failing golden test:** a library covering "chess openings" (a `games-strategy/chess::compete` resource, ageTiers incl. request tier) → `covers` true, `resolve` returns it top-ranked; a request with no match → `covers` false.
- [ ] Implement (deterministic ranking: reputation desc, tie by id). **Commit** `feat(concierge): curated library + curated-first resolve`.

---

### Task 3: Pure safety helpers (P2)
**Files:** `src/safety.ts`, `test/safety.test.ts`; barrel.
**Interfaces:** `scrubPII(msg): { cleaned; hadPII }` (emails/phones/obvious names → redacted); `spotlight(text): string` (wrap retrieved text in explicit untrusted-content delimiters so it can't read as instructions); `reputationOf(url, allowlist): number` (allowlisted domains score high; unknown low); `ALLOWLIST` starter set (wikipedia.org, khanacademy.org, …).
- [ ] Failing tests: PII scrubbed; an injection string inside `spotlight()` is delimited/neutralized (still present as data, marked untrusted); allowlisted URL ≥ `REPUTATION_FLOOR`, unknown `< REPUTATION_FLOOR`.
- [ ] Implement. **Commit** `feat(concierge): PII scrub + injection spotlighting + reputation`.

---

### Task 4: Ports + deterministic stub adapters (P3)
**Files:** `src/ports.ts` (interfaces), `src/stubs.ts` (deterministic impls), `test/stubs.test.ts`; barrel.
**Ports (spec §3.3):** `Moderator`, `DistressClassifier`, `Retriever`, `Generator`, `Faithfulness`, `Readability`, `Hasher`.
**Stubs (deterministic):**
- `stubModerator` — `safe:false` if text matches a denylist (per-tier strictness for the `6-8` floor); else safe.
- `stubDistress` — `distress:true` on distress phrases ("want to hurt", "no one likes me", self-harm markers…).
- `stubRetriever(corpus)` — returns fixture `RetrievedDoc[]` keyed by query (incl. an injection doc + a low-reputation/unsafe doc + a clean doc).
- `stubGenerator` — builds a grounded answer from the docs' sentences + `Citation[]` from their urls; returns empty/ungrounded for the refuse fixture.
- `stubFaithfulness` — `grounded = answerTokens ⊆ union(docTokens)`, score = overlap ratio.
- `stubReadability` — tier-parameterized simplify/truncate (identity + length cap for `6-8`).
- `stubHasher` — stable FNV-style digest.
- [ ] Failing tests per stub (deterministic outputs). **Commit** `feat(concierge): ports + deterministic stub adapters`.

---

### Task 5: `runConcierge` pipeline (P4) — CORE
**Files:** `src/pipeline.ts`, `test/pipeline.test.ts`; barrel.
**Interface:** `runConcierge(request, deps, now): Promise<ConciergeResponse>` where `deps = { library, moderator, distress, retriever, generator, faithfulness, readability, hasher, config? }`. Implement stages 1–9 in order (spec §3.2); wrap the whole body so any thrown port ⇒ `{ kind: "refused", reason: "internal" }` (SC-9 fail-safe). Stage 10 (cache/queue) returns its side value for Task 6 to persist — keep `runConcierge` pure by returning `{ response, cache?: CacheEntry }` OR expose a separate `afterServe(...)`; record the shape choice in `.loop/decisions.md`.
- [ ] **Failing golden end-to-end tests** over the §6 fixtures (all with stub deps):
  - covered need → `answer` from curated, **retriever spy not called** (SC-1);
  - distress message → `escalated`, retriever/generator **not called**, no text (SC-2);
  - gap → retrieve → the injection doc is spotlighted and does not change the answer (SC-3);
  - faithfulness `< FAITHFULNESS_MIN` → `refused` (SC-4);
  - unsafe/low-rep doc dropped before generation (SC-5);
  - unsafe generated output → `refused` (SC-6);
  - `6-8` tier applies strict floor (SC-7);
  - identical request → identical response; a throwing port → `refused` (SC-9).
- [ ] Implement. **Commit** `feat(concierge): child-safe pipeline (curated-first, cite-or-refuse, safety exits)`.

---

### Task 6: Async cache → vet-queue → promote (P5)
**Files:** `src/promote.ts`, `test/promote.test.ts`; barrel.
**Interfaces:** `VetQueue` (immutable list of `CacheEntry { doc; query; provenance }`); `enqueue(queue, entry)`; `promote(library, entry, decision): { library; queue }` — an approved entry becomes a `CuratedResource` (tagged by domain×mode inferred from the query/doc; `provenance = hasher.hash(url+text)`) folded into the library.
- [ ] **Failing golden test (SC-8):** serve a gap answer → the served doc is cached + queued; `promote(..., "approve")` folds it in; re-running the same request now resolves **curated** (retriever spy not called), with the recorded provenance hash.
- [ ] Implement. **Commit** `feat(concierge): async cache → vet-queue → promote into the curated library`.

---

### Task 7: Real adapter `@gt100k/concierge-live` (P6)
**Files:** `passion/adapters/concierge-live/{package.json,tsconfig.json,src/index.ts,src/parse.ts,src/__fixtures__/*.ts,test/parse.test.ts,scripts/concierge-live.ts}`; root `tsconfig.json`.
- [ ] Scaffold (`@gt100k/concierge-live`, dep `@gt100k/concierge`; reference it; append root; `pnpm install`).
- [ ] **TFY-backed ports** — mirror `tagger-tfy`/`tutor-tfy` exactly: `TfyConfig { apiKey, baseURL, model }`, `DEFAULT_BASE_URL = "https://tfy.promptlens.trilogy.com/openai/v1"`, `DEFAULT_MODEL = "gpt-5.4-mini"`, `tfyConfigFromEnv()` reads `TFY_API_KEY` (required), `TFY_BASE_URL`, `TFY_CONCIERGE_MODEL`. A private `chat(cfg, system, user)` (`fetch` → `/chat/completions`, `temperature:0`, `response_format:{type:"json_object"}`). Implement `TfyModerator` (returns `{safe,reason}` JSON), `TfyDistress`, `TfyGenerator` (grounded `{text,citations}` JSON from passed docs — cite-or-refuse in the prompt), `TfyFaithfulness` (`{grounded,score}` JSON). Each has a **safe fallback** on error/parse-fail (`safe:false` / `grounded:false` / refuse) — never fabricate safety.
- [ ] **Web `Retriever`** `AllowlistRetriever` — `fetch` reputable/allowlisted sources for the query (a small allowlist: Wikipedia REST API, Khan Academy, etc.), HTML→text, tag each with `reputationOf`; cap `MAX_DOCS`. (Chromium-rendered fetch is an optional later enhancement; default `fetch` needs no extra dep.)
- [ ] **Hermetic tests:** `parse.test.ts` over `__fixtures__` (parse a canned TFY JSON body → the port's return); the network calls are **never** exercised in a test.
- [ ] **`scripts/concierge-live.ts`** — opt-in: build `deps` from the TFY ports + `AllowlistRetriever`, run `runConcierge` on a sample question, print the answer + citations (and a distress sample → escalated). Run via `pnpm exec tsx passion/adapters/concierge-live/scripts/concierge-live.ts` with `TFY_API_KEY` set.
- [ ] gate (`tsc -b` + `test`) — **Commit** `feat(concierge): @gt100k/concierge-live (TFY models + allowlist retriever, opt-in)`.

---

### Task 8: `apps/concierge` chat + server route (P7)
**Files:** `passion/apps/concierge/{package.json,tsconfig.json,next.config.mjs,app/layout.tsx,app/page.tsx,app/ask/route.ts (or a server action),app/qa.ts,app/globals.css,test/*.ts}`; root reference.
- [ ] Scaffold Next 14 app (mirror `guide-console`: `transpilePackages` the workspace deps; motion@12). `pnpm install`.
- [ ] **Server route** `POST /ask` runs `runConcierge(request, deps)` where `deps` = **stubs by default** (deterministic, offline → keeps `next build` + `LOOP_QA` hermetic); when `process.env.CONCIERGE_LIVE === "1"` build `deps` from `@gt100k/concierge-live` instead. Seed a synthetic curated library + stub corpus.
- [ ] **Chat UI** — a minimal calm surface (reuse the guide-console theme tokens): a prompt box, the answer with **citations** shown, a visible **refused/escalated** state, and the **probe** suggestion. Not a game; WCAG AA; reduced-motion.
- [ ] **`window.__qa`** (`app/qa.ts`): `ready`, `error`, `state()` = `{ lastKind, citationCount }`, `primaryAction()` = ask a **seeded gap question** (deterministic → `answer` with citations). Provide a seeded **distress** question path too so the escalate exit is demonstrable.
- [ ] **Tests:** a pure test of the server handler with stub deps (covered→answer, distress→escalated, ungrounded→refused); an app smoke/render test.
- [ ] gate: `pnpm exec tsc -b` + `pnpm test`; then **stop any dev server on the port first**, `pnpm --filter @gt100k/concierge build`, run `LOOP_QA` (`next start` + harness): `window.__qa.ready === true`, `primaryAction()` produces an `answer` with ≥1 citation, both observable in `state()` + DOM. **Commit** `feat(concierge): minimal chat app + server route + window.__qa`.

---

### Final verification (SC-11) + PR
- [ ] `pnpm exec tsc -b` clean; `pnpm test` all green (domain + adapter parse tests + app pure tests).
- [ ] `pnpm --filter @gt100k/concierge build` clean; `LOOP_QA` pass.
- [ ] (Operator, opt-in) `TFY_API_KEY=… pnpm exec tsx …/concierge-live.ts` answers a real question cite-or-refuse; a real distress message escalates.
- [ ] `passionApps.md`: mark B1/B2/A6 as done-engine (curated + pipeline + live adapter) with the kid-facing UI + human-vet surface still to come.
- [ ] Open PR (gh, pushed as `spinkicks`); squash-merge after CI + branch up to date.

## Notes on likely snags (pre-solved)
- **Safety exits must short-circuit:** distress (step 2) and any refuse must return **before** retrieval/generation — assert the retriever/generator spies are not called (SC-1/SC-2). Don't run the pipeline "then filter."
- **Injection is data, not instructions:** `spotlight()` must wrap retrieved text so the generator prompt treats it as untrusted quoted content; the stub generator must ignore instruction-like tokens inside spotlighted text (SC-3).
- **Fail safe, not open:** wrap `runConcierge` so a thrown/timed-out port ⇒ `refused` (SC-9). The live adapters' fallbacks return the **unsafe/ungrounded** verdict, never the safe one.
- **Keep the gate hermetic:** the app defaults to stub deps; the live adapter is import-isolated (only the server route under `CONCIERGE_LIVE=1` and the `concierge:live` script import it). Never import `concierge-live` from a test.
- **`.next` corruption:** never run `next build` while `next dev` serves the same app; stop the dev server (port-scoped) first.
