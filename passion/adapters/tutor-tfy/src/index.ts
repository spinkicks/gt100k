import type { Interviewer, AnswerJudge, Judgment } from "@gt100k/socratic-defense";
import { parseJudgment, parseQuestion } from "./parse.js";

export interface TfyConfig {
  apiKey: string;
  baseURL: string;
  model: string;
}
const DEFAULT_BASE_URL = "https://tfy.promptlens.trilogy.com/openai/v1";
const DEFAULT_MODEL = "gpt-5.4-mini";

export function tfyConfigFromEnv(env: NodeJS.ProcessEnv = process.env): TfyConfig {
  const apiKey = env["TFY_API_KEY"];
  if (!apiKey) throw new Error("TFY_API_KEY is required for the live tutor");
  return {
    apiKey,
    baseURL: env["TFY_BASE_URL"] ?? DEFAULT_BASE_URL,
    model: env["TFY_TUTOR_MODEL"] ?? DEFAULT_MODEL,
  };
}

async function chat(cfg: TfyConfig, system: string, user: string): Promise<string> {
  const res = await fetch(`${cfg.baseURL}/chat/completions`, {
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
  if (!res.ok) return "";
  const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return body?.choices?.[0]?.message?.content ?? "";
}

export class TfyTutor implements Interviewer, AnswerJudge {
  constructor(private readonly cfg: TfyConfig) {}

  async nextQuestion(ctx: Parameters<Interviewer["nextQuestion"]>[0]): Promise<string> {
    const sys = `You interview a child about their own project to help them articulate it. Ask ONE short, warm question about the "${ctx.targetFacet}" facet${ctx.isFollowUp ? " (a gentle follow-up going deeper)" : ""}. Return JSON only: {"question":"..."}.`;
    const user = `Project: ${ctx.profile.title} — ${ctx.profile.summary}.`;
    return parseQuestion(await chat(this.cfg, sys, user)) ?? `Tell me more about the ${ctx.targetFacet} of your project.`;
  }

  async judge(ctx: Parameters<AnswerJudge["judge"]>[0]): Promise<Judgment> {
    const sys = `Judge how well the child's answer articulates the "${ctx.facet}" facet of THEIR project. Score articulation depth 0..1 (not correctness). Return JSON only: {"coverage":0..1,"rationale":"...","thin":bool}.`;
    const user = `Q: ${ctx.question}\nA: ${ctx.answer}`;
    return (
      parseJudgment(await chat(this.cfg, sys, user), ctx.facet) ?? {
        facet: ctx.facet,
        coverage: 0,
        rationale: "judge-parse-failed",
        thin: true,
      }
    );
  }
}
