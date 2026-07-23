// src/index.ts
import type { Tagger, ArtifactRef, TagSuggestion } from "@gt100k/two-axis-tagging";
import { WORK_MODES, CABINS } from "@gt100k/two-axis-tagging";
import { parseTfySuggestion } from "./parse.js";

export { parseTfySuggestion } from "./parse.js";

export interface TfyConfig {
  apiKey: string;
  baseURL: string;
  model: string;
}

const DEFAULT_BASE_URL = "https://tfy.promptlens.trilogy.com/openai/v1";
const DEFAULT_MODEL = "gpt-5.4-mini"; // verified low-cost model; override via TFY_TAGGER_MODEL

/**
 * Read the live-adapter config from the environment. NEVER called at import time
 * or in any test — only by the opt-in `tag:live` script — so the CI gate needs no env.
 */
export function tfyConfigFromEnv(env: NodeJS.ProcessEnv = process.env): TfyConfig {
  const apiKey = env["TFY_API_KEY"];
  if (!apiKey) throw new Error("TFY_API_KEY is required for the live tagger");
  return {
    apiKey,
    baseURL: env["TFY_BASE_URL"] ?? DEFAULT_BASE_URL,
    model: env["TFY_TAGGER_MODEL"] ?? DEFAULT_MODEL,
  };
}

/**
 * Zero-confidence fallback when the model errors or returns something unparseable.
 * confidence 0 < CONFIDENCE_FLOOR (0.5) → the pipeline rejects it and routes to
 * review; the adapter never fabricates a trusted tag.
 */
function fallback(ref: ArtifactRef): TagSuggestion {
  return {
    domainPath: [ref.kind === "gadget" ? "making-engineering" : "science-nature"],
    affordedModes: ["investigate"],
    confidence: 0,
    rationale: "tfy-parse-failed",
  };
}

/**
 * The real LLM auto-tagger against the TrueFoundry gateway (OpenAI-compatible Chat
 * Completions) via native `fetch` — no SDK dependency. Opt-in only; never in the gate.
 */
export class TfyTagger implements Tagger {
  constructor(private readonly cfg: TfyConfig) {}

  async suggest(ref: ArtifactRef): Promise<TagSuggestion> {
    const sys = [
      "You tag a learning resource on two axes for a children's interest-discovery product.",
      `Cabins (domainPath[0]): ${CABINS.join(", ")}.`,
      `Work-modes (affordedModes is a subset): ${WORK_MODES.join(", ")}.`,
      'Return STRICT JSON only: {"domainPath":[cabin] or [cabin,subTopicSlug],"affordedModes":[...],"confidence":0..1,"rationale":"..."}.',
    ].join("\n");
    const user = `Resource: ${ref.label}${ref.url ? ` (${ref.url})` : ""}. kind=${ref.kind}.`;

    let res: Response;
    try {
      res = await fetch(`${this.cfg.baseURL}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.cfg.apiKey}` },
        body: JSON.stringify({
          model: this.cfg.model,
          messages: [
            { role: "system", content: sys },
            { role: "user", content: user },
          ],
          temperature: 0,
          response_format: { type: "json_object" },
        }),
      });
    } catch {
      return fallback(ref);
    }

    if (!res.ok) return fallback(ref);
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      return fallback(ref);
    }
    const content =
      (body as { choices?: Array<{ message?: { content?: string } }> })?.choices?.[0]?.message?.content ?? "";
    return parseTfySuggestion(content) ?? fallback(ref);
  }
}
