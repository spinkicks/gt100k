// src/index.ts: the REAL mastery-map generator against the TrueFoundry (OpenAI-compatible) gateway
// via native `fetch` (no SDK dep). OPT-IN ONLY: nothing here is ever imported by a test (the
// hermetic parse test imports `./parse.js` only) and the gate never hits the network or needs
// `TFY_API_KEY`. Mirrors planner-live / concierge-live / tagger-tfy.
//
// THIS ADAPTER VERIFIES ITS CITATIONS, and that is the one way it differs from its siblings. A map
// claims a `syllabus` basis to say a published curriculum agrees with the order it put things in,
// and that claim is only worth something if someone checked. So after the model answers, every url
// it cited is fetched. What survives is passed to the pure downgrade in `./parse.js`, which strips
// the basis off anything that did not resolve. A url that times out or 404s is simply UNVERIFIED,
// never an error: the map still generates, it just stops claiming support for that milestone.
import { checkableUrls, coerceMapOrStub } from "./parse.js";
import type { MapContext, MapGenerator, MasteryMap } from "@gt100k/mastery-map";

export {
  checkableUrls,
  coerceMapOrStub,
  downgradeUnverifiedCitations,
  isCheckableSource,
  parseMilestones,
} from "./parse.js";
export type { LiveInputs } from "./parse.js";

// --- TFY config ------------------------------------------------------------------------------
export interface TfyConfig {
  apiKey: string;
  baseURL: string;
  model: string;
}

const DEFAULT_BASE_URL = "https://tfy.promptlens.trilogy.com/openai/v1";
const DEFAULT_MODEL = "gpt-5.4-mini"; // verified low-cost model; override via TFY_MASTERY_MAP_MODEL

/** Bumped whenever the prompt below changes, and recorded in `MapProvenance.promptVersion`, so a
    map that reads oddly can be traced to the wording that produced it. */
export const PROMPT_VERSION = "map-live-v1";

/** How long a citation gets to prove it exists before it counts as unverified. */
export const VERIFY_TIMEOUT_MS = 8_000;

/**
 * Read the live-adapter config from the environment. NEVER called at import time or in any test,
 * only by the opt-in `map:live` script, so the CI gate needs no env.
 */
export function tfyConfigFromEnv(env: NodeJS.ProcessEnv = process.env): TfyConfig {
  const apiKey = env.TFY_API_KEY;
  if (!apiKey) throw new Error("TFY_API_KEY is required for the live mastery-map generator");
  return {
    apiKey,
    baseURL: env.TFY_BASE_URL ?? DEFAULT_BASE_URL,
    model: env.TFY_MASTERY_MAP_MODEL ?? DEFAULT_MODEL,
  };
}

/**
 * One OpenAI-compatible Chat Completion. Returns the message content string, or `""` on any
 * transport/HTTP error. An empty body is unparseable, so the caller coerces it to the stub fallback.
 */
async function chat(cfg: TfyConfig, system: string, user: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${cfg.baseURL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({
        model: cfg.model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
  } catch {
    return "";
  }
  if (!res.ok) return "";
  try {
    const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return body?.choices?.[0]?.message?.content ?? "";
  } catch {
    return "";
  }
}

// --- Citation verification ---------------------------------------------------------------------

/** `doi:10.1037/x` is the same citation as `https://doi.org/10.1037/x`, so it becomes one request.
    The verified set is keyed on the url AS THE MODEL WROTE IT, which is what the map carries. */
function httpTarget(url: string): string {
  return url.toLowerCase().startsWith("doi:") ? `https://doi.org/${url.slice(4)}` : url;
}

/**
 * Whether one cited url resolves. A HEAD, one attempt, no retry, and 2xx or nothing.
 *
 * DELIBERATELY PESSIMISTIC. A publisher that blocks HEAD, rate-limits us or sits behind a bot wall
 * makes a real citation look unverified, and the cost of that is a milestone that says `model`
 * where a genuine syllabus stands behind it. The opposite error, waving through a citation nobody
 * could reach, puts a claim in front of a guide that looks checkable and is not, and that is the
 * failure this adapter exists to prevent. Understating support is the cheaper mistake.
 */
async function resolves(url: string, timeoutMs: number): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(httpTarget(url), {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** The subset of `urls` that actually resolved. Never throws and never rejects: an unreachable
    citation is an answer, not a failure. */
export async function verifyUrls(
  urls: readonly string[],
  timeoutMs: number = VERIFY_TIMEOUT_MS,
): Promise<ReadonlySet<string>> {
  const checked = await Promise.all(
    urls.map(async (url) => [url, await resolves(url, timeoutMs)] as const),
  );
  return new Set(checked.filter(([, ok]) => ok).map(([url]) => url));
}

// --- The prompt ----------------------------------------------------------------------------------

/**
 * The map author's brief. Two things in it are load-bearing.
 *
 * HONESTY IS AN ACCEPTED ANSWER. The prompt says outright that `model` with no sources is correct
 * and expected, because a model that believes it must produce a citation produces one. The rest of
 * the paragraph removes the incentive from the other side: it tells the model the urls will be
 * fetched, so a fabrication is not merely wrong, it is pointless.
 *
 * THE VALIDATOR'S RULES ARE STATED, not left to be discovered. A response that trips any of them
 * costs the whole map to the stub fallback, so the rules a model can plausibly break by accident
 * (the artefact rule, the stage-floor ordering, forecasts) are spelled out in the words the
 * validator would use.
 */
function systemPrompt(): string {
  return [
    "You author a MASTERY MAP for one domain: what getting good at it actually involves, as",
    "milestones in the order they unlock each other. A guide will read this, and a child aged",
    "roughly 6 to 14 will eventually walk it. Plain language throughout.",
    "",
    'Return STRICT JSON only: {"milestones":[ ... ]}. Every key below appears on every milestone,',
    "including the empty arrays.",
    "  id             short stable slug, unique within this map",
    "  title          plain language, a child could read it",
    "  capability     what the child can DO afterwards, never what they consumed. It MUST name the",
    "                 artefact from `demonstration`: at least one real word appears in both.",
    "  requires       ids of milestones in THIS map that come first. [] for an entry point. The",
    "                 result must be acyclic and every id must exist here.",
    "  modes          [] for trunk, which serves every mode. Otherwise a branch, and every entry",
    "                 must be one of the modes this domain affords, listed in the request.",
    "  stageFloor     earliest stage this suits: S1_IGNITION, S2_FOUNDATIONS, S3_AUTHORSHIP,",
    "                 S4_SIGNATURE. Never earlier than the floor of anything it requires.",
    '  ordering       {"reason": one plain sentence on why it sits here and after those, "basis":',
    '                 one of the four below, "sources": [...], "limit": optional honest caveat}',
    '  practice       [{"title","description","solitary"}]: what repeated effort looks like. No',
    "                 hour counts and no session counts.",
    "  demonstration  the artefact that shows the capability",
    '  opportunities  [{"kind","description","readinessNote","stageFloor"}], kind one of',
    "                 competition | showcase | community | mentorship. Hints only, never a deadline.",
    "",
    "THE ORDERING BASIS IS THE POINT OF THIS DOCUMENT.",
    '  "syllabus"   a recognised published curriculum: a federation rating ladder, ABRSM or Trinity',
    "               grades, an olympiad syllabus. External and checkable, so the strongest support.",
    '  "research"   citable research about how this skill develops.',
    '  "community"  named community consensus: an established forum\'s progression guide, a widely',
    "               used practice curriculum with no formal standing. Real, not authoritative.",
    '  "model"      your own reasoning, with no external support. `sources` MUST be [].',
    "",
    'WHERE YOU HAVE NO SPECIFIC REAL SOURCE, ANSWER "model" WITH AN EMPTY sources ARRAY. That is a',
    "correct and expected answer and much of a good map is honestly `model`. Do NOT invent a",
    "citation, a DOI, a document title or a url to fill the field. EVERY URL YOU RETURN WILL BE",
    "FETCHED AND CHECKED. One that does not resolve is deleted along with the basis resting on it,",
    "so an invented citation buys nothing and costs the milestone the support it might have had.",
    "An invented citation is worse than none, because it looks checkable.",
    '  A source is {"authors","year","url"}, the url https or a doi, and it must be a document you',
    "  are confident exists at that address.",
    "",
    "Do NOT invent learning resources, links, videos or courses for a child. Those come from a",
    "separate human-vetted library and are attached to this map afterwards. Yours is the milestones,",
    "their order, and the justification for that order.",
    "",
    "Never name a date, an age, a grade or a timeframe by which a child should reach anything. The",
    "map says what comes after what. It never says when.",
  ].join("\n");
}

function userPrompt(ctx: MapContext): string {
  return [
    `Domain: ${ctx.domainPath.join(" / ")}`,
    `Modes this domain affords: ${ctx.modes.join(", ")}`,
    `Age bands this map spans: ${ctx.ageBands.join(", ")}`,
    "",
    "Aim for six to ten milestones. Most of them should be trunk: branches are for where the modes",
    "genuinely diverge, which is usually late. There must be a complete path from an entry point",
    "using only milestones whose stageFloor is S1_IGNITION or S2_FOUNDATIONS, because that is as",
    "far as anyone can currently be placed, and a map whose only path runs through a higher floor",
    "is one nobody can enter.",
  ].join("\n");
}

// --- The generator ---------------------------------------------------------------------------

/**
 * TFY-backed `MapGenerator`. Prompts for the milestone DAG, HEAD-checks every citation it comes
 * back with, and coerces the result into a map the validator accepts, falling back to the
 * deterministic in-package stub on anything malformed or invalid.
 *
 * The split is the design: everything impure happens in `generate` (the completion, the clock, the
 * HEAD checks) and every decision made from it happens in `./parse.js`, which has no idea any of
 * that exists.
 */
export class TfyMapGenerator implements MapGenerator {
  constructor(private readonly cfg: TfyConfig) {}

  async generate(ctx: MapContext): Promise<MasteryMap> {
    const raw = await chat(this.cfg, systemPrompt(), userPrompt(ctx));
    const verifiedUrls = await verifyUrls(checkableUrls(raw));
    return coerceMapOrStub(raw, ctx, {
      model: this.cfg.model,
      promptVersion: PROMPT_VERSION,
      generatedAt: new Date().toISOString(),
      verifiedUrls,
    });
  }
}
