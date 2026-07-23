import type { Facet, Judgment } from "@gt100k/socratic-defense";
import { THIN } from "@gt100k/socratic-defense";

export function parseJudgment(raw: string, facet: Facet): Judgment | null {
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof obj !== "object" || obj === null) return null;
  const o = obj as Record<string, unknown>;
  const coverage = o["coverage"];
  if (typeof coverage !== "number" || coverage < 0 || coverage > 1) return null;
  const rationale = typeof o["rationale"] === "string" ? o["rationale"] : "";
  const thin = typeof o["thin"] === "boolean" ? o["thin"] : coverage < THIN;
  return { facet, coverage, rationale, thin };
}

export function parseQuestion(raw: string): string | null {
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    return typeof o["question"] === "string" ? o["question"] : null;
  } catch {
    return null;
  }
}
