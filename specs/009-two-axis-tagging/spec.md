# Feature Specification: Two-Axis Tagging (Domain × Work-Mode)

**Feature Branch**: `009-two-axis-tagging`
**Created**: 2026-07-22
**Status**: Draft (loop-ready)

**Input**: The tagging substrate for PassionLab discovery. Every artifact a child can engage with (cabin gadget, taste app, curated/open-web resource) is tagged on **two axes** — a hierarchical **domain** (topic) and a **work-mode** (style, from a fixed set of 9 verbs). Artifacts carry the work-modes they **afford**; a child's **actions resolve which mode they actually engaged**. Tags come from a manually-curated **gold** set plus an **LLM auto-tagger** (TrueFoundry gateway) for the long tail, and a **validity harness** measures tag reliability and gates trust. This is `C2` in `docs/prd/passionApps.md`; it feeds `C1` (event capture) → `C3` (inference). Grounding: `docs/prd/engines/C2-tagging.md`, `DISCOVERY-APP-PRD.md` §6.1, `hardening/measurement-validity.md`.

> **Loop-ready note (read first).** Written to be built by an autonomous loop whose gate is `pnpm exec tsc -b` + `pnpm test` + `pnpm --filter @gt100k/two-axis-tagging build`. It pre-answers decisions (**Decisions Already Made**), pins the stack, gives golden values as deterministic acceptance targets, and states one catch-all (**Defaults for the Unspecified**). **No live child data — SYNTHETIC ONLY.** The LLM auto-tagger is behind a **port**: the deterministic core + all CI tests use a **stub tagger**; the real TrueFoundry adapter is exercised only by an opt-in, non-CI script.

---

## 1. Why this feature is first

Every downstream interest read depends on tags being present and valid. If an artifact is mistagged (wrong topic, or a missing afforded mode), the `(domain × work-mode)` cell the child's behavior lands in is wrong, and `C3`'s inference is measuring noise. So this is built before the inference engine can be trusted, and it ships with a **validity harness** rather than assuming tags are correct.

---

## 2. Scope Fence *(hard — the loop builds the whole spec; anything vague is scope creep)*

### In scope

- A **pure, framework-agnostic TypeScript domain package** `@gt100k/two-axis-tagging` (`passion/packages/two-axis-tagging`) implementing:
  - the **domain taxonomy** (hierarchical: cabin → sub-topic) with a stable ID scheme and an extensible tail (concierge-minted sub-topics parented to a cabin);
  - the **work-mode taxonomy** (the fixed 9 verbs) with machine-readable operational definitions;
  - the **Artifact** record (afforded modes) and **ActionEvent** record (engaged modes);
  - the **engaged-mode resolver**: deterministic rules mapping an action to the mode(s) it engaged, constrained to the artifact's afforded set;
  - the **validity harness**: inter-tagger agreement (Krippendorff's α over a sample), a per-topic **tag-validity gate** (a topic's tags are `TRUSTED` only above a reliability bar), and an auto-tag **review queue** for human spot-audit;
  - a **Tagger port** and the deterministic **suggest → validate → accept/gold** tagging pipeline.
- **Adapters** (each its own package):
  - `@gt100k/tagger-stub` (`passion/adapters/tagger-stub`) — deterministic, seeded stub tagger for tests + the loop gate;
  - `@gt100k/tagger-tfy` (`passion/adapters/tagger-tfy`) — the real LLM auto-tagger against the **TrueFoundry** gateway (OpenAI-compatible), key from `TFY_API_KEY`, low-cost model.
- **Seed content**: the 8 launch cabins + their starter sub-topics, and the 9 work-modes with definitions, as in-repo synthetic fixtures.
- **Tests as first-class**: unit + contract tests mirroring every FR/SC, including golden-value tests (stable taxonomy IDs, resolver outputs, α on a fixture set).
- A headless `demo` script wiring: seed taxonomy → tag a synthetic artifact set (stub) → run a synthetic action stream → resolve engaged modes → compute validity → emit the coverage matrix.

### Out of scope (deferred to marked stubs / later features)

- **Live open-web retrieval + the child-safe RAG harness** — that is `011-concierge` (this feature only *tags* an artifact it is handed; it does not fetch it).
- **The inference engine (`C3`)** — `009` emits `ActionEvent`s with resolved modes; it does not compute beliefs.
- **Event capture instrumentation (`C1`)** — `009` defines the `ActionEvent` shape and the resolver; wiring real UI interactions is `C1`.
- **A rich curation/audit UI** — the review queue is a domain data structure + a minimal headless surface; a polished admin UI is a later phase.
- **Real network in CI** — the TFY adapter is contract-tested against a recorded fixture; live calls are an opt-in script only.

---

## 3. Domain model *(decisions already made — do not re-open)*

### 3.1 Domain (topic) axis — hierarchical

- **Coarse = cabin.** The 8 launch cabins (stable IDs):
  `music-sound, code-computers, games-strategy, making-engineering, art-motion, influence-media, science-nature, math-puzzles`.
- **Fine = sub-topic**, parented to exactly one cabin (e.g. `music-sound/audio-systems`, `code-computers/game-dev`).
- **`domainPath`** is an ordered array `[cabinId]` or `[cabinId, subTopicId]`. Inference reads at both levels (coarse = robust, fine = actionable).
- **Extensible tail:** a sub-topic can be **minted at runtime** (by the concierge, later) — always parented to an existing cabin, with a generated stable ID and `origin: "minted"`. Minting never creates a new cabin.

### 3.2 Work-mode (style) axis — fixed set of 9

`build, investigate, compose, perform, debug, explain, persuade, collaborate, care`.

Each work-mode ships a machine-readable definition record: `{ id, gloss, produces (artifact|understanding|performance|none), examples[], boundaryRules[] }` — e.g. `build` = "produces a new artifact/structure"; `investigate` = "probes how something works, need not produce an artifact". The definitions are the reference the human graders and the LLM tagger both use, and the thing the validity harness stress-tests (a mode that tags unreliably gets its boundary rules sharpened, or is merged/split — see §7).

### 3.3 Artifact

```
Artifact {
  id: string
  domainPath: [cabinId] | [cabinId, subTopicId]
  affordedModes: WorkMode[]        // the candidate styles this artifact makes possible (≥1)
  kind: "gadget" | "taste-app" | "resource"
  source: "gold" | "auto"          // gold = manually curated; auto = LLM-suggested then accepted
  origin: "seed" | "minted"
  tagConfidence: number            // [0,1]; gold = 1
  tagStatus: "TRUSTED" | "PROVISIONAL"   // derived from the topic's validity gate (§7)
}
```

### 3.4 ActionEvent

```
ActionEvent {
  kidId: string                    // synthetic/pseudonymous
  artifactId: string
  engagedModes: { primary: WorkMode, secondary?: WorkMode }   // resolved, ⊆ artifact.affordedModes
  depthSignals: DepthSignal[]      // opaque to this feature; passed through to C1/C3
  timestamp: string                // ISO-8601
  returnState: "voluntary" | "prompted"
  noveltyFlag: boolean
}
```

`009` **produces** `ActionEvent`s (via the resolver) and **guarantees** `engagedModes ⊆ affordedModes`. `depthSignals`, `returnState`, and `noveltyFlag` are carried through unmodified for `C1`/`C3`.

### 3.5 The engaged-mode resolver *(the crux)*

An in-world action arrives as a typed `RawAction { artifactId, actionType, params? }`. The resolver maps it to `engagedModes`, **constrained to the artifact's `affordedModes`**:

1. A fixed **actionType → work-mode** rule table gives the candidate mode(s) for the action.
2. **Intersect** with `affordedModes`. If the intersection is empty, the action is invalid for that artifact → rejected (a data/authoring error, surfaced, never silently coerced).
3. If exactly one mode remains → `primary`. If several → the rule table's **priority order** picks `primary`; the next becomes `secondary`.
4. Deterministic given `(RawAction, Artifact)` — same inputs, same output (golden-tested).

Ambiguous actions that the rule table cannot resolve are marked `unresolved` and routed to the review queue (they never guess a mode).

---

## 4. Tagging pipeline

1. **Gold (manual).** Seed cabins/gadgets/taste-apps and curated resources are hand-tagged: `source:"gold"`, `tagConfidence:1`, `tagStatus:"TRUSTED"`. This is the reference set.
2. **Auto (LLM).** For an untagged artifact, the **Tagger port** returns a `TagSuggestion { domainPath, affordedModes, confidence, rationale }`. The real adapter calls TrueFoundry; the stub returns seeded deterministic suggestions.
3. **Validate.** A suggestion is checked: domainPath resolves to a real cabin (+ optional sub-topic, minting if new), affordedModes are valid work-modes, confidence ≥ a floor. Passing suggestions become `source:"auto"` artifacts; the topic's `tagStatus` comes from the validity gate (§7).
4. **Review.** Auto-tags below a confidence bar, `unresolved` actions, and a random audit sample are enqueued for human spot-audit; a human decision promotes to `gold` or corrects and feeds the correction back.

---

## 5. Ports & adapters

| Port | Contract | Adapters |
|---|---|---|
| `Tagger` | `suggest(artifactRef): Promise<TagSuggestion>` | `tagger-stub` (deterministic, seeded — used in CI); `tagger-tfy` (TrueFoundry gateway) |

The domain core depends only on the `Tagger` structural contract. All domain logic (taxonomy, resolver, validity, pipeline) is synchronous and pure; only `Tagger.suggest` is async.

### 5.1 TrueFoundry adapter (`tagger-tfy`) — VERIFIED

The integration was tested live against the gateway on 2026-07-22; the values below are confirmed, not assumed.

- **Transport:** native `fetch` (Node ≥18 global fetch) — **no SDK dependency** (keeps the package dependency-free and loop-install-free). OpenAI-compatible **Chat Completions** API.
- **Endpoint:** `POST {TFY_BASE_URL}/chat/completions` where **`TFY_BASE_URL` defaults to `https://tfy.promptlens.trilogy.com/openai/v1`** (the `/openai/v1` suffix is required; the bare root 404s).
- **Auth:** `Authorization: Bearer ${TFY_API_KEY}`.
- **Model:** `TFY_TAGGER_MODEL`, default **`gpt-5.4-mini`** (confirmed present + cheap; returns strict JSON via `response_format:{type:"json_object"}`, `temperature:0`). Even-cheaper fallbacks on the gateway: `gpt-5.4-nano`, `gemini-3.5-flash-lite`.
- **Confirmed response shape** (recorded fixture): the model returns exactly `{"domainPath":[...],"affordedModes":[...],"confidence":n,"rationale":"..."}`. Schema-validated by `parseTfySuggestion`; a malformed response is a failed suggestion (routed to review), never a crash.
- **Not in the CI gate**: contract-tested against the recorded JSON fixture (no network in tests); a separate opt-in `tag:live` script makes a real call for manual verification.

---

## 6. Phasing (P0…P5) *(ordered build path)*

- **P0** — taxonomy: cabins + sub-topics + the 9 work-mode definitions; stable ID scheme; validators. Unit tests + golden IDs.
- **P1** — records + the **engaged-mode resolver** (rule table, intersect-with-afforded, priority, reject-invalid, unresolved→review). Full unit tests + golden resolver outputs. *(The reliable core.)*
- **P2** — the tagging pipeline + `Tagger` port + `tagger-stub`; suggest→validate→accept, sub-topic minting. Tests with the stub.
- **P3** — the **validity harness**: Krippendorff's α over a fixture of multi-rater tags, the per-topic validity gate (`TRUSTED`/`PROVISIONAL`), the review queue. Golden α values.
- **P4** — `tagger-tfy` adapter (TrueFoundry, OpenAI-compatible, `TFY_API_KEY`, low-cost model); schema-validated JSON; contract test vs. recorded fixture; opt-in `tag:live` script.
- **P5** — the `demo` script (seed → stub-tag → synthetic actions → resolve → validity → coverage matrix) + a minimal headless review-queue surface.

---

## 7. Validity harness *(the load-bearing part)*

- **Inter-tagger agreement:** given ≥2 raters' tags over a shared sample, compute **Krippendorff's α** separately for the domain axis and the work-mode axis.
- **Validity gate:** a topic (cabin or sub-topic) is `TRUSTED` only when its axis α ≥ the reliability bar (`ALPHA_BAR`, a tunable default); otherwise its artifacts are `PROVISIONAL`. Per `hardening/measurement-validity.md`, downstream (`C3`) does not trust the content-based read for a `PROVISIONAL` topic.
- **Mode-definition feedback:** a work-mode whose α is below bar is flagged for boundary-rule sharpening or merge/split (an authoring action, logged; the 9-verb set may change — that's expected and why definitions are data, not code).
- **Review queue:** low-confidence auto-tags + `unresolved` actions + a random audit sample; a human decision promotes/corrects.

---

## 8. Success Criteria *(each maps to a test)*

- **SC-1** every seed cabin + sub-topic + work-mode has a stable ID and a valid record; IDs match the golden list — unit test.
- **SC-2** the resolver returns `engagedModes ⊆ affordedModes` for every valid action; an action whose rule-table modes don't intersect the afforded set is **rejected**, not coerced — unit test.
- **SC-3** the resolver is deterministic: a fixture of `(RawAction, Artifact)` pairs maps to the exact golden `engagedModes` (primary+secondary, priority-ordered) — golden test.
- **SC-4** an ambiguous action the rule table can't resolve is marked `unresolved` and enqueued for review (never guessed) — unit test.
- **SC-5** the pipeline: a stub `TagSuggestion` validates → becomes an `auto` artifact; a novel sub-topic path mints a parented sub-topic; an invalid work-mode or unresolvable cabin is rejected — unit test.
- **SC-6** Krippendorff's α on the multi-rater fixture equals the golden value (±0.001); a topic below `ALPHA_BAR` is `PROVISIONAL`, above is `TRUSTED` — golden test.
- **SC-7** `tagger-tfy` parses a recorded TFY JSON response into a valid `TagSuggestion`; a malformed response yields a failed suggestion routed to review, no throw — contract test.
- **SC-8** gate green: `pnpm exec tsc -b` + `pnpm test` + `pnpm --filter @gt100k/two-axis-tagging build`.
- **manual:** one live TFY call via `tag:live` returns a schema-valid suggestion for a sample artifact — operator-run, outside CI.

## 9. Golden Values *(exact)*

- Constants: `CONFIDENCE_FLOOR = 0.5`, `ALPHA_BAR = 0.667` (the conventional Krippendorff tentative-reliability threshold), work-mode order `[build, investigate, compose, perform, debug, explain, persuade, collaborate, care]`.
- The 8 cabin IDs (§3.1) and the seed sub-topic IDs are the golden taxonomy list.
- A fixtures table of **≥8** `(RawAction, Artifact)` → expected `engagedModes` in `src/__fixtures__/`.
- The **golden reliability fixture is small and hand-verifiable** (2 raters × 4 units → α = **0.5333**, plus a perfect-agreement case → α = 1.0), asserted to ±0.001. A larger, more realistic multi-rater fixture (≥3 raters, ≥10 items) MAY be added as a lock-on-first-run characterization test, but the *exact* golden is the hand-verified small one (a precise hand-checkable value is worth more than a large opaque one).

## 10. Decisions Already Made

- **[D1]** Two axes; domain hierarchical (cabin → sub-topic, minted tail parented to a cabin); work-mode a fixed set of 9 defined as **data**.
- **[D2]** Artifacts carry **afforded** modes; actions resolve **engaged** modes; `engagedModes ⊆ affordedModes` is an invariant.
- **[D3]** Auto-tagger uses the **TrueFoundry** gateway via native `fetch` (OpenAI-compatible Chat Completions), `TFY_API_KEY`, base **`https://tfy.promptlens.trilogy.com/openai/v1`**, model **`gpt-5.4-mini`** (verified 2026-07-22; env-overridable via `TFY_TAGGER_MODEL`). No SDK dependency.
- **[D4]** Deterministic core + stub tagger in CI; the LLM adapter is never in the loop gate.
- **[D5]** Pinned stack: TypeScript / vitest; pnpm monorepo; packages under `passion/`, names `@gt100k/*`. No framework in the domain core.
- **[D6]** Validity gate governs trust (`hardening/measurement-validity.md`); `PROVISIONAL` topics are flagged, not silently trusted.
- **[D7]** SYNTHETIC ONLY; no real child data; no PII in fixtures.

## 11. Defaults for the Unspecified

For anything unspecified, choose the simplest correct option, record it in `.loop/decisions.md`, and continue. Escalate `critical` only if a choice would invalidate an SC.

## 12. Stack + Commands (pinned)

- pnpm monorepo. Domain `passion/packages/two-axis-tagging` (`@gt100k/two-axis-tagging`); adapters `passion/adapters/tagger-stub`, `passion/adapters/tagger-tfy`.
- Gate: `pnpm exec tsc -b` + `pnpm test` (the repo-wide gate; `tsc -b` builds this package via composite project references — this is the "build" check).
- Env for the live adapter only: `TFY_API_KEY` (required only when running the opt-in `tag:live` script), `TFY_BASE_URL` (default `https://tfy.promptlens.trilogy.com/openai/v1`), `TFY_TAGGER_MODEL` (default `gpt-5.4-mini`). Commit a git-ignored `.env.local.example`; never commit a token. **The CI gate needs no env** — `tfyConfigFromEnv` is only called by the opt-in script, never at import or in a test.
- Add the new packages to root `tsconfig.json` references (the final task). `vitest.config.ts` already globs `passion/packages/**/test/**` and `passion/adapters/**/test/**`.

## 13. Loop notes (headless / loop-verifiability)

- **No served app.** This feature is a headless domain package + adapters; there is nothing to serve. **`LOOP_QA` is N/A** — do not enable the adversarial usability/served-app gate for this loop. The Definition of Done is `pnpm exec tsc -b` + `pnpm test`.
- **No network in CI.** Every test runs offline (stub tagger + recorded TFY fixture). The only network call is the opt-in `tag:live` script, which is `manual:` (operator-run, outside the automated DoD).
- **Zero new external dependencies** — the TFY adapter uses native `fetch`, so there is no `pnpm install` / lockfile step and the loop can build from a cold checkout.
- **In-lane.** All files are new and under `passion/packages/two-axis-tagging`, `passion/adapters/tagger-stub`, `passion/adapters/tagger-tfy`, plus one line added to root `tsconfig.json` references. No cross-lane edits.
