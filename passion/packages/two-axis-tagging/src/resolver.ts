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
  /**
   * Following a curated link out to go and learn.
   *
   * WHY IT AFFORDS EVERY MODE. Every other verb here names what the child DID, so the verb
   * constrains the mode and the artifact narrows it. A follow names only that they left to learn
   * more, and what kind of work that is belongs entirely to the thing they opened: a throwing
   * tutorial affords `build`, a documentary affords `investigate`. Listing all nine lets the
   * intersection with `affordedModes` return exactly what the resource declares, which is the only
   * party here that actually knows.
   *
   * WHY IT IS NOT MODELESS like `open`. An open is presence on a tile the system put in front of
   * them. A follow is a child choosing to leave for a specific thing, and for the 36 pursuits with
   * no game in the product it is the ONLY act that can ever become evidence. Treating it as
   * presence would mean four fifths of the catalogue could never certify an interest however often
   * a child came back to it.
   *
   * HONEST LIMIT: a click is not the work. We know they opened it, not that they read or made
   * anything. What carries the weight is the same thing that carries it everywhere else, coming
   * back on a later day unprompted; one follow on one day proves very little and is scored as such.
   */
  "follow-source": WORK_MODES,
};

export type ResolveResult =
  | {
      readonly ok: true;
      readonly engagedModes: { readonly primary: WorkMode; readonly secondary?: WorkMode };
    }
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
