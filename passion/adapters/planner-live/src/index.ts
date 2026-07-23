// src/index.ts — the REAL project-brief generator against the TrueFoundry (OpenAI-compatible)
// gateway via native `fetch` (no SDK dep). OPT-IN ONLY: nothing here is ever imported by a test (the
// hermetic parse test imports `./parse.js` only) and the gate never hits the network or needs
// `TFY_API_KEY`. Mirrors concierge-live / tagger-tfy / tutor-tfy. The brief is GROUNDED on the passed
// curated `resources` (the A6 material) — the model is asked to cite the vetted titles/urls in the
// craft scaffold — and every response is coerced back into the schema (fall back to the stub on any
// malformed/empty field), so `generate` ALWAYS returns a valid Type III brief.
import { coerceBriefOrStub } from "./parse.js";
import type {
  BriefContext,
  CuratedResource,
  ProjectBrief,
  ProjectBriefGenerator,
} from "@gt100k/specialization-planner";

export { coerceBriefOrStub, parseBriefFields } from "./parse.js";

// --- TFY config ------------------------------------------------------------------------------
export interface TfyConfig {
  apiKey: string;
  baseURL: string;
  model: string;
}

const DEFAULT_BASE_URL = "https://tfy.promptlens.trilogy.com/openai/v1";
const DEFAULT_MODEL = "gpt-5.4-mini"; // verified low-cost model; override via TFY_PLANNER_MODEL

/**
 * Read the live-adapter config from the environment. NEVER called at import time or in any test —
 * only by the opt-in `planner:live` script — so the CI gate needs no env.
 */
export function tfyConfigFromEnv(env: NodeJS.ProcessEnv = process.env): TfyConfig {
  const apiKey = env["TFY_API_KEY"];
  if (!apiKey) throw new Error("TFY_API_KEY is required for the live planner");
  return {
    apiKey,
    baseURL: env["TFY_BASE_URL"] ?? DEFAULT_BASE_URL,
    model: env["TFY_PLANNER_MODEL"] ?? DEFAULT_MODEL,
  };
}

/**
 * One OpenAI-compatible Chat Completion. Returns the message content string, or `""` on any
 * transport/HTTP error — `""` is an unparseable body, so the caller coerces it to the stub fallback.
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

/** The vetted curated resources block the model must ground the craft scaffold on. */
function groundingBlock(resources: readonly CuratedResource[]): string {
  if (resources.length === 0) return "(no curated resources for this cell — use a generic craft floor)";
  return resources.map((r) => `- ${r.title} (${r.url})`).join("\n");
}

/**
 * TFY-backed `ProjectBriefGenerator`. Prompts for a bona-fide Renzulli Type III brief grounded on the
 * passed curated resources, parses the JSON, and coerces/falls-back to the deterministic stub on any
 * malformed/empty result (`source: "llm"` on success). The child ALWAYS owns problem/method/pace —
 * the prompt frames the brief as an offer, never an assignment.
 */
export class TfyBriefGenerator implements ProjectBriefGenerator {
  constructor(private readonly cfg: TfyConfig) {}

  async generate(ctx: BriefContext): Promise<ProjectBrief> {
    const sys = [
      "You design a single authentic project brief for a child's self-directed learning.",
      "It MUST be a Renzulli Type III project: (1) personalized to the child's own interest,",
      "(2) using a real methodology of the field, (3) a driving question with NO pre-existing right",
      "answer, (4) built to affect a real audience. Pair it with a small, bounded craft-floor",
      "scaffold. The brief is an OFFER the child may reshape — never an assignment, never a grade,",
      "never a score/points/streak/reward. Ground the craft scaffold in the CURATED RESOURCES",
      "provided (cite their titles + urls). Keep it warm and plain.",
      'Return STRICT JSON only: {"title":"...","drivingQuestion":"...","authenticMethod":"...",' +
        '"craftScaffold":"...","successLooksLike":"..."}.',
    ].join("\n");
    const user = [
      `Domain path: ${ctx.domainPath.join(" / ")}`,
      `Work mode: ${ctx.mode}`,
      `Stage: ${ctx.stage}`,
      `Audience level: ${ctx.audience}`,
      `Craft-floor hint: ${ctx.craftFloorHint}`,
      "Curated resources to ground the craft scaffold:",
      groundingBlock(ctx.resources),
    ].join("\n");
    return coerceBriefOrStub(await chat(this.cfg, sys, user), ctx);
  }
}
