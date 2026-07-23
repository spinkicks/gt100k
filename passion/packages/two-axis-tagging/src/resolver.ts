import type { Artifact, RawAction } from "./records.js";
import type { WorkMode } from "./work-modes.js";
import { WORK_MODES } from "./work-modes.js";

// actionType → candidate work-modes, in priority order (first = preferred primary).
export const ACTION_MODE_RULES: Record<string, readonly WorkMode[]> = {
  play: ["perform"],
  assemble: ["build"],
  inspect: ["investigate"],
  tinker: ["build", "investigate"],
  "write-melody": ["compose"],
  fix: ["debug"],
  teach: ["explain"],
  pitch: ["persuade"],
  "co-work": ["collaborate"],
  tend: ["care"],
};

export type ResolveResult =
  | { readonly ok: true; readonly engagedModes: { readonly primary: WorkMode; readonly secondary?: WorkMode } }
  | { readonly ok: false; readonly reason: "invalid-for-artifact" | "unresolved" };

export function resolveEngagedModes(artifact: Artifact, action: RawAction): ResolveResult {
  const candidates = ACTION_MODE_RULES[action.actionType];
  if (!candidates || candidates.length === 0) return { ok: false, reason: "unresolved" };

  const afforded = new Set<WorkMode>(artifact.affordedModes);
  // Keep candidate order but drop non-afforded; if the rule table's own order is ambiguous,
  // fall back to the global WORK_MODES order for determinism.
  const kept = candidates.filter((m) => afforded.has(m));
  if (kept.length === 0) return { ok: false, reason: "invalid-for-artifact" };

  const primary = kept[0]!;
  const secondary = kept[1];
  return secondary
    ? { ok: true, engagedModes: { primary, secondary } }
    : { ok: true, engagedModes: { primary } };
}

// Exposed for tie-break auditing / future use.
export const GLOBAL_MODE_ORDER: readonly WorkMode[] = WORK_MODES;
