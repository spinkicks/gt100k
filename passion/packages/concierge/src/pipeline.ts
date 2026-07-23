// The concierge orchestrator (spec §3.2) — one PURE, deterministic pipeline over typed ports.
// Given deterministic ports it returns a deterministic result (SC-9); any port that THROWS makes
// the whole thing fail SAFE (`refused`, reason "internal") — the model is never the only gate ([D2]).
//
// Task 5 implements stages 1–9 (§3.2). Stage 10 (cache → vet-queue → promote) is Task 6; this stage
// hands its side-value out as `cache` — the served open-web docs — WITHOUT changing the response the
// caller reads. Defense-in-depth ordering matters and is deliberate:
//   • stage 2 runs DISTRESS BEFORE moderation — some distress phrases contain denylist tokens, and a
//     child in distress must ESCALATE to a human ([D4]), never get "refused" for tripping a keyword.
//   • retrieved reputation is RECOMPUTED from the URL, never trusted from the doc (a doc can lie).
//   • surviving docs are SPOTLIGHTED as untrusted data before generation ([D6], SC-3).
//   • generation is CITE-OR-REFUSE behind a per-tier faithfulness floor ([D5], SC-4/SC-7).
import { covers, resolve, type CuratedLibrary } from "./library.js";
import {
  MAX_DOCS,
  REPUTATION_FLOOR,
  STRICTNESS,
  type AgeTier,
  type ConciergeRequest,
  type ConciergeResponse,
  type CuratedResource,
  type RetrievedDoc,
} from "./model.js";
import { reputationOf, scrubPII, spotlight } from "./safety.js";
import type {
  DistressClassifier,
  Faithfulness,
  Generator,
  Hasher,
  Moderator,
  Readability,
  Retriever,
} from "./ports.js";

/** Optional pipeline overrides (defaults come from the golden constants, §3.4). */
export interface ConciergeConfig {
  /** Retrieved docs capped before filtering (default {@link MAX_DOCS}). */
  readonly maxDocs?: number;
}

/** The full port bundle the pipeline runs over — stubs in CI/app, TFY+web in the opt-in adapter. */
export interface ConciergeDeps {
  readonly library: CuratedLibrary;
  readonly moderator: Moderator;
  readonly distress: DistressClassifier;
  readonly retriever: Retriever;
  readonly generator: Generator;
  readonly faithfulness: Faithfulness;
  readonly readability: Readability;
  readonly hasher: Hasher;
  readonly config?: ConciergeConfig;
}

/**
 * A served open-web doc (ORIGINAL text, pre-spotlight) handed to stage 10 (Task 6) to cache + vet.
 * `at` is the injected `now`, so provenance/ordering stay deterministic (never `Date.now()`).
 */
export interface CacheDraft {
  readonly doc: RetrievedDoc;
  readonly query: string;
  readonly at: number;
}

/**
 * The pipeline's return: the `ConciergeResponse` the caller serves, plus the stage-10 side-value
 * (`cache`, present only on the gap-answer path). Keeping the side-value beside the response — rather
 * than inside it — keeps `ConciergeResponse` exactly as §3.1 specifies while giving Task 6 the served
 * docs faithfully (see .loop/decisions.md).
 */
export interface ConciergeResult {
  readonly response: ConciergeResponse;
  readonly cache?: readonly CacheDraft[];
}

function refused(reason: string): ConciergeResult {
  return { response: { kind: "refused", reason } };
}

/** A curated pointer sentence (trusted material) — the curated path still shapes + moderates it. */
function curatedBlurb(resources: readonly CuratedResource[]): string {
  const top = resources[0];
  if (!top) return "";
  const n = resources.length;
  return `I found ${n} trusted resource${n === 1 ? "" : "s"} for that, starting with ${top.title}.`;
}

/** The niche framed as the smallest testable next step (stage 9). Chat is NEVER scored ([D10]). */
function buildProbe(topic: string): string {
  return `Try a small first step exploring ${topic.trim()} and see if it clicks.`;
}

/** Deterministic rank: reputation desc, ties by url asc. */
function byReputationThenUrl(a: RetrievedDoc, b: RetrievedDoc): number {
  if (b.reputation !== a.reputation) return b.reputation - a.reputation;
  return a.url < b.url ? -1 : a.url > b.url ? 1 : 0;
}

async function pipeline(
  request: ConciergeRequest,
  deps: ConciergeDeps,
  now: number,
): Promise<ConciergeResult> {
  const tier: AgeTier = request.ageTier;

  // Stage 1 — session/age gate: attach the tier's strictness parameters (one pipeline, [D1]).
  const strict = STRICTNESS[tier];
  const maxDocs = deps.config?.maxDocs ?? MAX_DOCS;

  // Stage 2 — input guard: PII scrub → DISTRESS (before moderation, [D4]) → input moderation.
  const { cleaned } = scrubPII(request.message);
  if (deps.distress.assess(cleaned).distress) {
    return { response: { kind: "escalated", reason: "distress" } };
  }
  const inputMod = deps.moderator.moderate(cleaned, tier, "input");
  if (!inputMod.safe) return refused(inputMod.reason ?? "input-unsafe");

  // Stage 3 — curated-first: if the library covers the need, answer from curated + SKIP retrieval ([D3]).
  if (covers(deps.library, request)) {
    const resources = resolve(deps.library, request);
    const citations = resources.map((r) => ({
      url: r.url,
      title: r.title,
      reputation: r.reputation,
    }));
    const curatedText = deps.readability.shape(curatedBlurb(resources), tier);
    const curatedMod = deps.moderator.moderate(curatedText, tier, "output");
    if (!curatedMod.safe) return refused(curatedMod.reason ?? "output-unsafe");
    return {
      response: {
        kind: "answer",
        text: curatedText,
        citations,
        resources,
        probe: buildProbe(cleaned),
      },
    };
  }

  // Stage 4 — gap retrieval: untrusted evidence, ranked by RECOMPUTED reputation, capped ([D2]).
  const raw = await deps.retriever.search(cleaned, { ageTier: tier });
  const ranked = raw
    .map((d) => ({ ...d, reputation: reputationOf(d.url) })) // never trust doc-supplied reputation
    .sort(byReputationThenUrl)
    .slice(0, maxDocs);

  // Stage 5 — per-doc filter: drop below the reputation floor or on unsafe content; then spotlight.
  const survivors: RetrievedDoc[] = [];
  for (const doc of ranked) {
    if (doc.reputation < REPUTATION_FLOOR) continue; // low-rep / unknown source dropped (SC-5)
    if (!deps.moderator.moderate(doc.text, tier, "doc").safe) continue; // unsafe content dropped (SC-5)
    survivors.push(doc);
  }
  if (survivors.length === 0) return refused("no-grounded-source");
  const spotlighted = survivors.map((d) => ({ ...d, text: spotlight(d.text) }));

  // Stage 6 — grounded generation, cite-or-refuse + faithfulness gate at the tier floor ([D5]).
  const gen = await deps.generator.generate(cleaned, spotlighted, tier);
  if (gen.text.trim().length === 0 || gen.citations.length === 0) return refused("empty-generation");
  const faith = deps.faithfulness.score(gen.text, spotlighted);
  if (!faith.grounded || faith.score < strict.faithfulnessMin) return refused("ungrounded");

  // Stage 7 — output moderation, independent of stage 2 (SC-6).
  const outMod = deps.moderator.moderate(gen.text, tier, "output");
  if (!outMod.safe) return refused(outMod.reason ?? "output-unsafe");

  // Stage 8 — age-appropriate readability shaping to the tier's floor.
  const shaped = deps.readability.shape(gen.text, tier);

  // Stage 9 — serve: answer + citations + a probe. Stage 10's side-value = the served docs (Task 6).
  return {
    response: {
      kind: "answer",
      text: shaped,
      citations: gen.citations,
      probe: buildProbe(cleaned),
    },
    cache: survivors.map((doc) => ({ doc, query: cleaned, at: now })),
  };
}

/**
 * Run the child-safe concierge pipeline (§3.2). Deterministic under deterministic ports; any port
 * that throws ⇒ `{ kind: "refused", reason: "internal" }` — fail safe, never leak (SC-9). `now` is
 * injected (never read from the clock) so identical requests yield identical results.
 */
export async function runConcierge(
  request: ConciergeRequest,
  deps: ConciergeDeps,
  now = 0,
): Promise<ConciergeResult> {
  try {
    return await pipeline(request, deps, now);
  } catch {
    return { response: { kind: "refused", reason: "internal" } };
  }
}
