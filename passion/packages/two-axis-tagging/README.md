# `@gt100k/two-axis-tagging`

Pure TypeScript domain logic for tagging every PassionLab artifact on **two axes** — a hierarchical
**domain** (cabin → sub-topic) and a **work-mode** (a fixed set of 9 verbs). Artifacts carry the work-modes
they **afford**; a child's actions resolve which mode they actually **engaged**
(`engagedModes ⊆ affordedModes`, always). The package has no framework, storage, network, or clock
dependency — the LLM auto-tagger is reached through a `Tagger` port.

Use synthetic or pseudonymous data with this feature slice. There is **no live child data** anywhere in the
package or its fixtures.

This is `C2` in `docs/prd/passionApps.md`; it feeds `C1` (event capture) → `C3` (inference). Grounding:
`docs/prd/engines/C2-tagging.md`, `DISCOVERY-APP-PRD.md` §6.1, `hardening/measurement-validity.md`.

## Quick start

```ts
import {
  createTaxonomy,
  acceptSuggestion,
  resolveEngagedModes,
  serializePath,
  type ArtifactRef,
} from "@gt100k/two-axis-tagging";
import { StubTagger } from "@gt100k/tagger-stub";

const tax = createTaxonomy();
const ref: ArtifactRef = { id: "synth-01", kind: "gadget", label: "Synth" };

// suggest → validate → accept (mints a novel sub-topic parented to its cabin if needed)
const suggestion = await new StubTagger().suggest(ref);
const artifact = acceptSuggestion(tax, ref, suggestion);

// A child's raw action resolves the engaged mode(s), constrained to the afforded set.
const r = resolveEngagedModes(artifact, { artifactId: "synth-01", actionType: "play" });
if (r.ok) {
  const cell = `${serializePath(artifact.domainPath)}::${r.engagedModes.primary}`;
  // e.g. "music-sound/audio-systems::perform"
}
```

A headless end-to-end wiring lives in `src/demo.ts` (`runDemo()`): seed taxonomy → stub-tag a synthetic
artifact → run a synthetic action stream → resolve engaged modes → emit a `(domain × work-mode)` coverage
matrix. See `test/demo.test.ts` for its golden output.

## Public domain API

| Export | Purpose |
| --- | --- |
| `CABINS`, `SEED_SUBTOPICS`, `isCabinId` | The 8 launch cabins (stable golden IDs) + starter sub-topics. |
| `createTaxonomy`, `serializePath` | Build the seed taxonomy; mint sub-topics (idempotent by slug); serialize a `domainPath`. |
| `WORK_MODES`, `WORK_MODE_DEFS`, `isWorkMode` | The fixed 9 work-modes (golden order) + machine-readable definitions. |
| `makeArtifact` | Validate + construct an `Artifact` against a taxonomy (rejects unresolvable paths / empty afforded set). |
| `resolveEngagedModes`, `ACTION_MODE_RULES` | The engaged-mode resolver: `actionType` → afforded-constrained, priority-ordered modes; unresolved/invalid never coerced. |
| `validateSuggestion`, `acceptSuggestion`, `CONFIDENCE_FLOOR` | The suggest → validate → accept pipeline (mints novel sub-topics, carries confidence through). |
| `krippendorffAlphaNominal`, `topicTrust`, `applyTrust`, `ALPHA_BAR` | The validity harness: inter-tagger α + the per-topic `TRUSTED`/`PROVISIONAL` gate. |
| `createReviewQueue` | Headless review-queue surface (low-confidence auto-tags + `unresolved` actions + audit sample). |

The entrypoint also exports the domain records (`Artifact`, `ActionEvent`, `RawAction`, `TagSuggestion`,
`DomainPath`, `WorkMode`, …), the `Tagger` / `ArtifactRef` port types, and the resolver/validity result
types.

## Ports and adapters

Domain functions and the pipeline accept the tagger by a structural TypeScript contract. Swap an adapter
without changing domain code; the domain never imports an adapter (no dependency cycle).

| Port | Contract | Adapters |
| --- | --- | --- |
| `Tagger` | `suggest(ref: ArtifactRef): Promise<TagSuggestion>` | `StubTagger` from `@gt100k/tagger-stub` (deterministic, seeded — used in CI); `TfyTagger` from `@gt100k/tagger-tfy` (TrueFoundry gateway). |

`Tagger.suggest` is the **only** async surface; all domain logic (taxonomy, resolver, validity, pipeline) is
synchronous and pure.

## TrueFoundry adapter (`@gt100k/tagger-tfy`)

The real LLM auto-tagger uses native `fetch` (no SDK, no new dependency) against the OpenAI-compatible
TrueFoundry gateway. It is **never in the CI gate** — it is contract-tested against a recorded JSON fixture,
and a separate opt-in `tag:live` script makes a real call for manual verification.

| Env var | Default | Notes |
| --- | --- | --- |
| `TFY_API_KEY` | *(none)* | Required **only** for the opt-in `tag:live` script. The gate needs no env. |
| `TFY_BASE_URL` | `https://tfy.promptlens.trilogy.com/openai/v1` | The `/openai/v1` suffix is required. |
| `TFY_TAGGER_MODEL` | `gpt-5.4-mini` | Cheap fallbacks: `gpt-5.4-nano`, `gemini-3.5-flash-lite`. |

`tfyConfigFromEnv` is called only by the script, never at import or in a test. A malformed response is a
failed suggestion routed to review, never a crash.

## Tests

```sh
pnpm --filter @gt100k/two-axis-tagging test
```

Every test runs offline (stub tagger + recorded TFY fixture); no network, no env, synthetic data only.
